import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    Keyboard,
    Dimensions,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get, post } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Message {
    _id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: string;
    fileUrl?: string;
    fileType?: string;
}

const fetchMessages = async (channelId: string): Promise<Message[]> => {
    const response = await get<any>(`/api/channels/${channelId}/messages`);
    return Array.isArray(response?.messages) ? response.messages : [];
};

const ChannelChat = ({ route, navigation }: any) => {
    const { channelId, channelName } = route.params;
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const [messageText, setMessageText] = useState('');
    const flatListRef = useRef<FlatList>(null);
    const queryClient = useQueryClient();

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['channel-messages', channelId],
        queryFn: () => fetchMessages(channelId),
        refetchInterval: 3000, // Poll every 3 seconds for new messages
    });

    const mutation = useMutation({
        mutationFn: (newMessage: any) => post(`/api/channels/${channelId}/messages`, newMessage),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channel-messages', channelId] });
            setMessageText('');
        },
    });

    const handleSendMessage = () => {
        if (!messageText.trim()) return;

        const newMessage = {
            senderId: user?._id,
            senderName: user?.name,
            text: messageText.trim(),
            timestamp: new Date().toISOString(),
        };

        mutation.mutate(newMessage);
        Keyboard.dismiss();
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.senderId === user?._id;

        return (
            <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage]}>
                {!isMe && (
                    <View style={styles.senderAvatar}>
                        <Text style={styles.avatarText}>{item.senderName?.[0]?.toUpperCase() || '?'}</Text>
                    </View>
                )}
                <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
                    {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                        {item.text}
                    </Text>
                    <Text style={styles.timestamp}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Custom Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{channelName}</Text>
                    <Text style={styles.onlineStatus}>Active in community</Text>
                </View>
                <TouchableOpacity style={styles.headerAction}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            {/* Input Bar */}
            <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 15) }]}>
                <TouchableOpacity style={styles.attachButton}>
                    <Ionicons name="add-circle-outline" size={28} color="#6B7280" />
                </TouchableOpacity>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                    />
                </View>
                <TouchableOpacity
                    style={[styles.sendButton, !messageText.trim() && styles.disabledSend]}
                    onPress={handleSendMessage}
                    disabled={!messageText.trim() || mutation.isPending}
                >
                    {mutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Ionicons name="send" size={20} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        elevation: 2,
    },
    backButton: {
        padding: 8,
    },
    headerInfo: {
        flex: 1,
        marginLeft: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    onlineStatus: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '500',
    },
    headerAction: {
        padding: 10,
    },
    messageList: {
        paddingHorizontal: 10,
        paddingVertical: 20,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 15,
        maxWidth: '85%',
    },
    myMessage: {
        alignSelf: 'flex-end',
    },
    otherMessage: {
        alignSelf: 'flex-start',
    },
    senderAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        alignSelf: 'flex-end',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    messageBubble: {
        padding: 12,
        borderRadius: 20,
        elevation: 1,
    },
    myBubble: {
        backgroundColor: '#3B82F6',
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
    },
    senderName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#3B82F6',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    myMessageText: {
        color: '#FFFFFF',
    },
    otherMessageText: {
        color: '#1F2937',
    },
    timestamp: {
        fontSize: 10,
        color: 'rgba(0,0,0,0.4)',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    attachButton: {
        padding: 5,
    },
    inputContainer: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 22,
        marginHorizontal: 10,
        paddingHorizontal: 15,
        paddingVertical: 8,
        justifyContent: 'center',
    },
    input: {
        fontSize: 16,
        color: '#1F2937',
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    disabledSend: {
        backgroundColor: '#9CA3AF',
    },
});

export default ChannelChat;
