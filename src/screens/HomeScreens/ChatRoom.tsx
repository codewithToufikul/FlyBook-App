import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
    StatusBar,
    Modal,
    Alert,
    Linking,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useStreamVideo } from '../../contexts/StreamVideoContext';
import { initiateCall } from '../../services/callService';
import { get, put, del } from '../../services/api';
import { format, isToday, isYesterday } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { handleImageUpload } from '../../utils/imageUpload';
import { handleVideoUpload } from '../../utils/videoUpload';
import { handlePdfUpload } from '../../utils/pdfupload';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

interface Message {
    _id: string;
    senderId: string;
    receoientId: string;
    messageText: string;
    messageType: 'text' | 'image' | 'video' | 'file' | 'call';
    mediaUrl?: string;
    callData?: {
        callType: 'audio' | 'video';
        status: 'missed' | 'completed' | 'rejected';
        duration: number;
    };
    timestamp: string | Date;
    isRead: boolean;
    isEdited?: boolean;
}

interface ChatUser {
    _id: string;
    name: string;
    profileImage?: string;
    isOnline?: boolean;
    lastSeen?: string | Date;
}

const ChatRoom = () => {
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const route = useRoute();
    const navigation = useNavigation();
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const { client: streamClient, isReady: isStreamReady } = useStreamVideo();
    const { chatUser } = route.params as { chatUser: ChatUser };
    const queryClient = useQueryClient();

    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isAttachMenuVisible, setIsAttachMenuVisible] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editText, setEditText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    // Generate Room ID (consistent with backend logic if possible, or just use recipient room)
    // Actually the backend uses socket.to(roomId) in receiveMessage and socket.to(receoientId) for notification.
    // In joinRoom it uses userId.sort().join("-").
    const roomId = [user?._id, chatUser._id].sort().join("-");

    const handleStartCall = async (isVideo: boolean) => {
        if (!streamClient || !isStreamReady) {
            Alert.alert('Not Ready', 'Video service is still connecting. Please try again.');
            return;
        }
        if (!user?._id || !chatUser._id) return;
        try {
            const call = await initiateCall(streamClient, user._id, chatUser._id, isVideo);
            (navigation as any).navigate('CallScreen', {
                callId: call.id,
                otherUserName: chatUser.name,
                callType: isVideo ? 'video' : 'audio',
            });
        } catch (error) {
            console.error('Call error:', error);
            Alert.alert('Call Failed', 'Could not start the call. Please try again.');
        }
    };

    const markMessagesAsRead = async () => {
        try {
            await put('/api/messages/mark-read', {
                userId: user?._id,
                senderId: chatUser._id,
                roomId: roomId
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const fetchMessages = async ({ pageParam = 1 }): Promise<any> => {
        const response = await get<any>(`/api/messages/${chatUser._id}?page=${pageParam}&limit=20`);
        return response || { messages: [], hasMore: false, page: 1 };
    };

    const queryKey = ['chat-messages', chatUser._id];

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
    } = useInfiniteQuery({
        queryKey,
        queryFn: fetchMessages,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
        staleTime: 0, // Always fetch fresh messages when screen mounts
        gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    });

    // Flatten and deduplicate messages for the FlatList
    const messages = useMemo(() => {
        const flattened = data?.pages.flatMap(page => page.messages) || [];
        const seenIds = new Set();
        return flattened.filter(msg => {
            if (!msg?._id || seenIds.has(msg._id)) return false;
            seenIds.add(msg._id);
            return true;
        });
    }, [data]);

    // Refetch on every screen focus to catch messages received while away
    useFocusEffect(
        useCallback(() => {
            refetch();
            markMessagesAsRead();
        }, [refetch])
    );

    useEffect(() => {
        markMessagesAsRead();

        if (socket && isConnected) {
            // Join chat room
            socket.emit('joinRoom', user?._id);
            socket.emit('joinRoom', roomId);

            // Listen for new messages
            socket.on('receiveMessage', (message: any) => {
                if (message.senderId === chatUser._id || message.senderId === user?._id) {
                    queryClient.setQueryData(queryKey, (old: any) => {
                        if (!old) return old;

                        // If this is OUR message confirmed by server, replace the temp optimistic entry
                        if (message.senderId === user?._id) {
                            const hasTempMsg = old.pages.some((page: any) =>
                                page.messages.some((msg: any) => msg._id?.startsWith('temp_'))
                            );
                            if (hasTempMsg) {
                                // Replace the first temp message with the real one
                                let replaced = false;
                                return {
                                    ...old,
                                    pages: old.pages.map((page: any) => ({
                                        ...page,
                                        messages: page.messages.map((msg: any) => {
                                            if (!replaced && msg._id?.startsWith('temp_')) {
                                                replaced = true;
                                                return { ...message };
                                            }
                                            return msg;
                                        }),
                                    })),
                                };
                            }
                        }

                        // For incoming messages from the other user, check for duplicates
                        const messageExists = old.pages.some((page: any) =>
                            page.messages.some((msg: any) => msg._id === message._id)
                        );
                        if (messageExists) return old;

                        // Add to the START of the first page (since list is descending/inverted)
                        const newPages = [...old.pages];
                        newPages[0] = {
                            ...newPages[0],
                            messages: [{ ...message, _id: message._id || Math.random().toString() }, ...newPages[0].messages]
                        };
                        return { ...old, pages: newPages };
                    });

                    if (message.senderId === chatUser._id) {
                        markMessagesAsRead();
                    }
                }
            });

            // Typing listeners
            socket.on('typing', (data: { senderId: string }) => {
                if (data.senderId === chatUser._id) {
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 3000);
                }
            });

            // Message edit/delete listeners
            socket.on('messageUpdated', (data: { messageId: string, messageText: string }) => {
                queryClient.setQueryData(queryKey, (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            messages: page.messages.map((msg: any) =>
                                msg._id === data.messageId ? { ...msg, messageText: data.messageText, isEdited: true } : msg
                            )
                        }))
                    };
                });
            });

            socket.on('messageDeleted', (data: { messageId: string }) => {
                queryClient.setQueryData(queryKey, (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            messages: page.messages.filter((msg: any) => msg._id !== data.messageId)
                        }))
                    };
                });
            });

            socket.on('messagesRead', (data: { roomId: string, readerId: string }) => {
                if (data.roomId === roomId && data.readerId === chatUser._id) {
                    queryClient.setQueryData(queryKey, (old: any) => {
                        if (!old) return old;
                        return {
                            ...old,
                            pages: old.pages.map((page: any) => ({
                                ...page,
                                messages: page.messages.map((msg: any) =>
                                    msg.senderId === user?._id ? { ...msg, isRead: true } : msg
                                )
                            }))
                        };
                    });
                }
            });

            return () => {
                socket.off('receiveMessage');
                socket.off('typing');
                socket.off('messageUpdated');
                socket.off('messageDeleted');
                socket.off('messagesRead');
            };
        }
    }, [socket, isConnected, chatUser._id]);

    const handleSend = () => {
        if (!inputText.trim() || !socket || !isConnected) return;

        const messageData = {
            senderId: user?._id,
            senderName: user?.name,
            receoientId: chatUser._id,
            messageText: inputText.trim(),
            roomId: roomId,
            messageType: 'text',
        };

        // Optimistically add sender's message to the cache immediately
        queryClient.setQueryData(queryKey, (old: any) => {
            if (!old) return old;
            const tempId = `temp_${Date.now()}`;
            const optimisticMsg = {
                _id: tempId,
                senderId: user?._id,
                receoientId: chatUser._id,
                messageText: inputText.trim(),
                messageType: 'text',
                timestamp: new Date().toISOString(),
                isRead: false,
            };
            const newPages = [...old.pages];
            newPages[0] = {
                ...newPages[0],
                messages: [optimisticMsg, ...newPages[0].messages],
            };
            return { ...old, pages: newPages };
        });

        // Emit to socket
        socket.emit('sendMessage', messageData);

        // Close attach menu if open
        setIsAttachMenuVisible(false);
        setInputText('');
    };

    const handleTyping = (text: string) => {
        setInputText(text);
        if (text.length > 0) {
            setIsAttachMenuVisible(false);
        }
        if (socket && isConnected) {
            socket.emit('typing', { roomId, senderId: user?._id });
        }
    };

    const formatMessageTime = (date: string | Date) => {
        const d = new Date(date);
        return format(d, 'hh:mm a');
    };

    const handleLongPressMessage = (message: Message) => {
        if (message.senderId === user?._id) {
            setSelectedMessage(message);
            setIsOptionsModalVisible(true);
        }
    };

    const handleDeleteMessage = async () => {
        if (!selectedMessage) return;

        Alert.alert(
            'Delete Message',
            'Are you sure you want to delete this message?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsOptionsModalVisible(false);
                            const response = await del(`/api/delete-message/${selectedMessage._id}?roomId=${roomId}`);
                            if (response.success) {
                                queryClient.setQueryData(queryKey, (old: any) => {
                                    if (!old) return old;
                                    return {
                                        ...old,
                                        pages: old.pages.map((page: any) => ({
                                            ...page,
                                            messages: page.messages.filter((msg: any) => msg._id !== selectedMessage._id)
                                        }))
                                    };
                                });
                                setSelectedMessage(null);
                            }
                        } catch (error) {
                            console.error('Error deleting message:', error);
                        }
                    }
                }
            ]
        );
    };

    const handleEditMessage = () => {
        if (!selectedMessage) return;
        setEditText(selectedMessage.messageText);
        setIsOptionsModalVisible(false);
        setIsEditModalVisible(true);
    };

    const handleUpdateMessage = async () => {
        if (!selectedMessage || !editText.trim()) return;

        try {
            const response = await put(`/api/messages/update/${selectedMessage._id}`, {
                messageText: editText.trim(),
                roomId: roomId
            });

            if (response.success) {
                queryClient.setQueryData(queryKey, (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            messages: page.messages.map((msg: any) =>
                                msg._id === selectedMessage._id ? { ...msg, messageText: editText.trim(), isEdited: true } : msg
                            )
                        }))
                    };
                });
                setIsEditModalVisible(false);
                setSelectedMessage(null);
                setEditText('');
            }
        } catch (error) {
            console.error('Error updating message:', error);
        }
    };

    const sendMediaMessage = (url: string, type: 'image' | 'video' | 'file', originalName?: string) => {
        if (!socket || !isConnected) return;

        const messageData = {
            senderId: user?._id,
            senderName: user?.name,
            receoientId: chatUser._id,
            messageText: originalName || (type === 'image' ? 'Sent a photo' : type === 'video' ? 'Sent a video' : 'Sent a file'),
            roomId: roomId,
            messageType: type,
            mediaUrl: url,
        };

        socket.emit('sendMessage', messageData);
    };

    const handleAttachmentOption = async (type: 'photo' | 'document' | 'video') => {
        setIsAttachMenuVisible(false);
        try {
            setIsUploading(true);
            let url = '';

            if (type === 'photo') {
                url = await handleImageUpload();
                if (url) sendMediaMessage(url, 'image');
            } else if (type === 'video') {
                url = await handleVideoUpload();
                if (url) sendMediaMessage(url, 'video');
            } else if (type === 'document') {
                const result = await handlePdfUpload();
                if (result?.secureUrl) {
                    sendMediaMessage(result.secureUrl, 'file', result.originalFilename);
                }
            }
        } catch (error: any) {
            if (error.message !== 'User cancelled image picker' &&
                error.message !== 'User cancelled video picker' &&
                error.message !== 'User cancelled PDF picker') {
                Alert.alert('Upload Failed', 'Something went wrong while uploading your file.');
            }
        } finally {
            setIsUploading(false);
        }
    };

    const renderCallMessage = (item: Message) => {
        const isMe = item.senderId === user?._id;
        const isMissed = item.callData?.status === 'missed';
        const isRejected = item.callData?.status === 'rejected';
        const isVideo = item.callData?.callType === 'video';
        const iconName = isVideo ? (isMissed || isRejected ? 'videocam-off' : 'videocam') : (isMissed || isRejected ? 'call-outline' : 'call');

        // Premium colors
        const bgColor = isMe ? (isDark ? '#14b8a6' : '#0f766e') : (isDark ? '#1e293b' : '#ffffff');
        const iconColor = isMe ? '#ffffff' : (isMissed || isRejected ? '#EF4444' : (isDark ? '#10B981' : '#10B981'));
        const textColor = isMe ? '#ffffff' : (isDark ? '#f8fafc' : '#111827');
        const subTextColor = isMe ? 'rgba(255,255,255,0.7)' : (isDark ? '#94a3b8' : '#6B7280');

        return (
            <View style={[styles.callMessageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
                <View style={[styles.callBubble, { backgroundColor: bgColor }, !isMe && styles.theirBubbleShadow]}>
                    <View style={styles.callHeader}>
                        <View style={[styles.callIconBg, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : (isMissed || isRejected ? '#FEE2E2' : '#ECFDF5') }]}>
                            <Ionicons name={iconName} size={16} color={iconColor} />
                        </View>
                        <View>
                            <Text style={[styles.callSummaryText, { color: textColor }]}>
                                {item.messageText}
                            </Text>
                            <Text style={[styles.callTimeText, { color: subTextColor }]}>
                                {formatMessageTime(item.timestamp)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderMessageItem = ({ item }: { item: Message }) => {
        if (item.messageType === 'call') {
            return renderCallMessage(item);
        }

        const isMe = item.senderId === user?._id;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onLongPress={() => handleLongPressMessage(item)}
                style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}
            >
                <View style={[
                    styles.messageBubble,
                    isMe ? styles.myBubble : styles.theirBubble,
                    isMe && isDark && { backgroundColor: '#14b8a6' },
                    !isMe && isDark && { backgroundColor: '#1e293b', shadowOpacity: 0 }
                ]}>
                    {item.messageType === 'image' && item.mediaUrl && (
                        <TouchableOpacity
                            onPress={() => (navigation as any).navigate('FullImageViewer', { imageUrl: item.mediaUrl })}
                        >
                            <Image
                                source={{ uri: item.mediaUrl }}
                                style={styles.messageImage}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    )}

                    {((item.messageType as any) === 'file' || (item.messageType as any) === 'video') && (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                                if ((item.messageType as any) === 'video') {
                                    (navigation as any).navigate('VideoPlayer', { videoUrl: item.mediaUrl });
                                } else if (item.mediaUrl) {
                                    Linking.openURL(item.mediaUrl);
                                }
                            }}
                            style={[styles.filePreview, { backgroundColor: isMe ? 'rgba(255,255,255,0.1)' : (isDark ? '#334155' : '#F3F4F6') }]}
                        >
                            <Ionicons
                                name={(item.messageType as any) === 'video' ? "play-circle" : "document-text"}
                                size={32}
                                color={isMe ? "#ffffff" : "#0f766e"}
                            />
                            <Text
                                style={[styles.fileName, { color: isMe ? "#ffffff" : (isDark ? "#f8fafc" : "#111827") }]}
                                numberOfLines={1}
                            >
                                {item.messageText || ((item.messageType as any) === 'video' ? 'Video' : 'Document')}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {(item.messageType as any) === 'text' && (
                        <Text style={[styles.messageText, isMe ? styles.myMessageText : [styles.theirMessageText, isDark && { color: '#f8fafc' }]]}>
                            {item.messageText}
                        </Text>
                    )}

                    <View style={styles.messageFooter}>
                        {item.isEdited && (
                            <Text style={[styles.messageTime, { marginRight: 4 }, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
                                Edited •
                            </Text>
                        )}
                        <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
                            {formatMessageTime(item.timestamp)}
                        </Text>
                        {isMe && (
                            <Ionicons
                                name="checkmark-done"
                                size={16}
                                color={item.isRead ? "#10B981" : "#9CA3AF"}
                                style={{ marginLeft: 4 }}
                            />
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }, isDark && { backgroundColor: '#0f172a' }]}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={isDark ? "#0f172a" : "#ffffff"}
            />

            {/* Header */}
            <View style={[styles.header, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#111827"} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => (navigation as any).push('UserProfile', { userId: chatUser._id })}
                >
                    <View>
                        <Image
                            source={{ uri: chatUser.profileImage || 'https://via.placeholder.com/40' }}
                            style={styles.avatar}
                        />
                        {chatUser.isOnline && <View style={styles.onlineBadge} />}
                    </View>
                    <View style={styles.nameContainer}>
                        <Text style={[styles.userName, isDark && { color: '#f8fafc' }]} numberOfLines={1}>{chatUser.name}</Text>
                        <Text style={[styles.userStatus, isDark && { color: '#94a3b8' }]}>
                            {isTyping ? 'typing...' : chatUser.isOnline ? 'Online' : 'Offline'}
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerActionBtn} onPress={() => handleStartCall(false)}>
                        <Ionicons name="call-outline" size={22} color={isDark ? "#14b8a6" : "#0f766e"} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerActionBtn} onPress={() => handleStartCall(true)}>
                        <Ionicons name="videocam-outline" size={24} color={isDark ? "#14b8a6" : "#0f766e"} />
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                style={{ flex: 1 }}
            >
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#0f766e"} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessageItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.messageList}
                        inverted={true}
                        onEndReached={() => {
                            if (hasNextPage && !isFetchingNextPage) {
                                fetchNextPage();
                            }
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={isFetchingNextPage ? (
                            <View style={{ paddingVertical: 20 }}>
                                <ActivityIndicator size="small" color={isDark ? "#14b8a6" : "#0f766e"} />
                            </View>
                        ) : null}
                        style={{ flex: 1 }}
                    />
                )}

                <View style={[styles.inputArea, isDark && { backgroundColor: '#0f172a', borderTopColor: '#1e293b' }]}>
                    {isAttachMenuVisible && (
                        <View style={[styles.attachMenu, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                            <TouchableOpacity
                                style={styles.attachMenuItem}
                                onPress={() => handleAttachmentOption('photo')}
                            >
                                <View style={[styles.attachIconCircle, { backgroundColor: isDark ? '#1e3a8a' : '#DBEAFE' }]}>
                                    <Ionicons name="image" size={20} color={isDark ? "#60a5fa" : "#2563EB"} />
                                </View>
                                <Text style={[styles.attachMenuText, isDark && { color: '#cbd5e1' }]}>Photo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.attachMenuItem}
                                onPress={() => handleAttachmentOption('document')}
                            >
                                <View style={[styles.attachIconCircle, { backgroundColor: isDark ? '#4c1d95' : '#F3E8FF' }]}>
                                    <Ionicons name="document-text" size={20} color={isDark ? "#a78bfa" : "#9333EA"} />
                                </View>
                                <Text style={[styles.attachMenuText, isDark && { color: '#cbd5e1' }]}>Document</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.attachMenuItem}
                                onPress={() => handleAttachmentOption('video')}
                            >
                                <View style={[styles.attachIconCircle, { backgroundColor: isDark ? '#7f1d1d' : '#FEF2F2' }]}>
                                    <Ionicons name="videocam" size={20} color={isDark ? "#f87171" : "#DC2626"} />
                                </View>
                                <Text style={[styles.attachMenuText, isDark && { color: '#cbd5e1' }]}>Video</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.attachBtn}
                        onPress={() => setIsAttachMenuVisible(!isAttachMenuVisible)}
                    >
                        <Ionicons
                            name={isAttachMenuVisible ? "close-circle" : "add-circle-outline"}
                            size={28}
                            color={isAttachMenuVisible ? "#EF4444" : (isDark ? "#14b8a6" : "#0f766e")}
                        />
                    </TouchableOpacity>
                    <View style={[styles.inputWrapper, isDark && { backgroundColor: '#1e293b' }]}>
                        <TextInput
                            style={[styles.textInput, isDark && { color: '#f8fafc' }]}
                            placeholder="Type a message..."
                            placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                            value={inputText}
                            onChangeText={handleTyping}
                            multiline
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled, isDark && { backgroundColor: '#14b8a6' }]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons name="send" size={20} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Uploading Overlay */}
            {isUploading && (
                <View style={styles.uploadOverlay}>
                    <View style={[styles.uploadCard, isDark && { backgroundColor: '#1e293b' }]}>
                        <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#0f766e"} />
                        <Text style={[styles.uploadText, isDark && { color: '#f8fafc' }]}>Uploading file...</Text>
                    </View>
                </View>
            )}

            {/* Options Modal */}
            <Modal
                visible={isOptionsModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOptionsModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsOptionsModalVisible(false)}
                >
                    <View style={[styles.optionsContainer, isDark && { backgroundColor: '#1e293b' }]}>
                        <TouchableOpacity style={styles.optionItem} onPress={handleEditMessage}>
                            <Ionicons name="create-outline" size={22} color={isDark ? "#94a3b8" : "#4B5563"} />
                            <Text style={[styles.optionText, isDark && { color: '#f8fafc' }]}>Edit Message</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.optionItem, styles.deleteOption, isDark && { borderTopColor: '#334155' }]} onPress={handleDeleteMessage}>
                            <Ionicons name="trash-outline" size={22} color="#EF4444" />
                            <Text style={[styles.optionText, styles.deleteText]}>Delete Message</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Edit Modal */}
            <Modal
                visible={isEditModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.editModalContainer, isDark && { backgroundColor: '#1e293b' }]}>
                        <View style={styles.editModalHeader}>
                            <Text style={[styles.editModalTitle, isDark && { color: '#f8fafc' }]}>Edit Message</Text>
                            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={isDark ? "#94a3b8" : "#4B5563"} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.editInput, isDark && { backgroundColor: '#0f172a', color: '#f8fafc' }]}
                            value={editText}
                            onChangeText={setEditText}
                            multiline
                            autoFocus
                        />
                        <TouchableOpacity style={[styles.updateBtn, isDark && { backgroundColor: '#14b8a6' }]} onPress={handleUpdateMessage}>
                            <Text style={styles.updateBtnText}>Update Message</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        elevation: 2,
    },
    backButton: {
        padding: 8,
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    nameContainer: {
        marginLeft: 10,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    userStatus: {
        fontSize: 12,
        color: '#6B7280',
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerActionBtn: {
        padding: 8,
        marginLeft: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageList: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    messageWrapper: {
        marginBottom: 12,
        maxWidth: '80%',
    },
    myMessageWrapper: {
        alignSelf: 'flex-end',
    },
    theirMessageWrapper: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    myBubble: {
        backgroundColor: '#0f766e',
        borderBottomRightRadius: 2,
    },
    theirBubble: {
        backgroundColor: '#ffffff', // Will be overridden in runtime with conditional styles if needed, but let's update styles object too
        borderBottomLeftRadius: 2,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#ffffff',
    },
    theirMessageText: {
        color: '#111827',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myMessageTime: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    theirMessageTime: {
        color: '#9CA3AF',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    attachBtn: {
        padding: 8,
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
        maxHeight: 100,
    },
    textInput: {
        fontSize: 15,
        color: '#111827',
        maxHeight: 84,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0f766e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: '#9CA3AF',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        width: '80%',
        padding: 8,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    optionText: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
    },
    deleteOption: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    deleteText: {
        color: '#EF4444',
    },
    editModalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '90%',
        padding: 20,
    },
    editModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    editModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    editInput: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#1F2937',
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    updateBtn: {
        backgroundColor: '#0f766e',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
    },
    updateBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    callMessageWrapper: {
        marginBottom: 12,
        maxWidth: '85%',
    },
    callBubble: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 18,
    },
    theirBubbleShadow: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    callHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    callIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callSummaryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    callTimeText: {
        fontSize: 10,
        marginTop: 1,
    },
    // Attach Menu Styles
    attachMenu: {
        position: 'absolute',
        bottom: 70,
        left: 12,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        gap: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    attachMenuItem: {
        alignItems: 'center',
        gap: 6,
    },
    attachIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachMenuText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4B5563',
    },
    messageImage: {
        width: 240,
        height: 180,
        borderRadius: 12,
        marginBottom: 4,
    },
    filePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        gap: 12,
        marginBottom: 4,
        width: 240,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
    },
    uploadCard: {
        backgroundColor: '#ffffff',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    uploadText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
});

export default ChatRoom;
