import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Image,
    ActivityIndicator,
} from 'react-native';
import { get, put } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';

interface Notification {
    _id: string;
    title?: string;
    body?: string;
    senderName?: string;
    senderProfile?: string;
    notifyText?: string;
    type?: string;
    senderId?: string;
    data?: {
        type?: string;
        postId?: string;
        senderId?: string;
        [key: string]: any;
    };
    isRead: boolean;
    timestamp: string;
}

export default function NotificationScreen() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const { isDark } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async (showLoading = true) => {
        if (!user?._id) return;
        if (showLoading) setLoading(true);
        try {
            const response: any = await get(`/api/notifications/${user._id}`);
            if (response?.success) {
                setNotifications(response.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            if (showLoading) setLoading(false);
            setRefreshing(false);
        }
    }, [user?._id]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (socket) {
            const normalizeNotification = (raw: any): Notification => ({
                _id: raw._id?.toString() || `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                title: raw.title,
                body: raw.body,
                senderName: raw.senderName,
                senderProfile: raw.senderProfile,
                notifyText: raw.notifyText || raw.messageText,
                type: raw.type || raw.data?.type,
                senderId: raw.senderId?.toString() || raw.data?.senderId,
                data: raw.data,
                isRead: raw.isRead ?? false,
                timestamp: raw.timestamp
                    ? (typeof raw.timestamp === 'string' ? raw.timestamp : new Date(raw.timestamp).toISOString())
                    : new Date().toISOString(),
            });

            const handleNewNotification = (data: any) => {
                try {
                    setNotifications(prev => [normalizeNotification(data), ...prev]);
                } catch (e) {
                    console.error('Error handling newNotification:', e);
                }
            };

            const handleReceiveNotify = (data: any) => {
                try {
                    setNotifications(prev => [normalizeNotification(data), ...prev]);
                } catch (e) {
                    console.error('Error handling receiveNotify:', e);
                }
            };

            socket.on('newNotification', handleNewNotification);
            socket.on('receiveNotify', handleReceiveNotify);
            return () => {
                socket.off('newNotification', handleNewNotification);
                socket.off('receiveNotify', handleReceiveNotify);
            };
        }
    }, [socket]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications(false);
    };

    const getNotificationType = (item: Notification) => {
        return item.data?.type || item.type || '';
    };

    const getSenderId = (item: Notification) => {
        return item.data?.senderId || item.senderId || '';
    };

    const getTitle = (item: Notification) => {
        if (item.title) return item.title;
        const type = getNotificationType(item);
        switch (type) {
            case 'bookReq': return 'New Book Request';
            case 'bookReqCl': return 'Book Request Cancelled';
            case 'bookReqAc': return 'Book Request Update';
            case 'bookReturn': return 'Book Returned';
            default: return item.senderName || 'Notification';
        }
    };

    const getBody = (item: Notification) => {
        if (item.body) return item.body;
        if (item.senderName && item.notifyText) {
            return `${item.senderName} ${item.notifyText.toLowerCase()}`;
        }
        return item.notifyText || '';
    };

    const getTimeAgo = (timestamp: string | undefined) => {
        try {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return '';
            return formatDistanceToNow(date, { addSuffix: true });
        } catch {
            return '';
        }
    };

    const handleNotificationPress = async (item: Notification) => {
        if (!item.isRead) {
            markAsRead(item._id);
        }

        const type = getNotificationType(item);
        const postId = item.data?.postId;
        const senderId = getSenderId(item);

        switch (type) {
            case 'LIKE':
            case 'COMMENT':
            case 'OPINION_LIKE':
            case 'OPINION_COMMENT':
                if (postId) {
                    navigation.navigate('OpinionDetails', { postId });
                }
                break;
            case 'FOLLOW':
            case 'PROFILE_VIEW':
            case 'FRIEND_REQUEST':
                if (senderId) {
                    navigation.navigate('UserProfile', { userId: senderId });
                }
                break;
            case 'bookReq':
            case 'bookReqCl':
                navigation.navigate('MyLibrary', { initialTab: 'bookRequests' });
                break;
            case 'bookReqAc':
                navigation.navigate('MyLibrary', { initialTab: 'myRequests' });
                break;
            case 'bookReturn':
                navigation.navigate('MyLibrary', { initialTab: 'myBooks' });
                break;
            default:
                if (postId) {
                    navigation.navigate('OpinionDetails', { postId });
                } else if (senderId) {
                    navigation.navigate('UserProfile', { userId: senderId });
                }
                break;
        }
    };

    const markAsRead = async (id: string) => {
        try {
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            await put('/api/notifications/mark-read', {
                userId: user?._id,
                notificationIds: [id]
            });
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const getNotificationIcon = (type?: string) => {
        switch (type) {
            case 'LIKE':
            case 'OPINION_LIKE':
                return <View className={`p-2 rounded-full ${isDark ? 'bg-red-900/40' : 'bg-red-100'}`}><Ionicons name="heart" size={20} color="#ef4444" /></View>;
            case 'COMMENT':
            case 'OPINION_COMMENT':
                return <View className={`p-2 rounded-full ${isDark ? 'bg-blue-900/40' : 'bg-blue-100'}`}><Ionicons name="chatbubble" size={12} color="#3b82f6" /></View>;
            case 'FOLLOW':
            case 'PROFILE_VIEW':
            case 'FRIEND_REQUEST':
                return <View className={`p-2 rounded-full ${isDark ? 'bg-teal-900/40' : 'bg-teal-100'}`}><Ionicons name="person" size={12} color={isDark ? "#2dd4bf" : "#0f766e"} /></View>;
            case 'bookReq':
                return <View className={`p-2 rounded-full ${isDark ? 'bg-purple-900/40' : 'bg-purple-100'}`}><Ionicons name="book" size={12} color="#a855f7" /></View>;
            case 'bookReqCl':
                return <View className={`p-2 rounded-full ${isDark ? 'bg-orange-900/40' : 'bg-orange-100'}`}><Ionicons name="close-circle" size={14} color="#f97316" /></View>;
            case 'bookReqAc':
                return <View className={`p-2 rounded-full ${isDark ? 'bg-green-900/40' : 'bg-green-100'}`}><Ionicons name="checkmark-circle" size={12} color="#22c55e" /></View>;
            case 'bookReturn':
                return <View className={`p-2 rounded-full ${isDark ? 'bg-blue-900/40' : 'bg-blue-100'}`}><Ionicons name="return-down-back" size={12} color="#3b82f6" /></View>;
            default:
                return <View className={`p-2 rounded-full ${isDark ? 'bg-teal-900/40' : 'bg-teal-100'}`}><Ionicons name="notifications" size={12} color={isDark ? "#2dd4bf" : "#0f766e"} /></View>;
        }
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const notifType = getNotificationType(item);
        const title = getTitle(item);
        const body = getBody(item);
        const timeAgo = getTimeAgo(item.timestamp);
        const hasProfileImage = typeof item.senderProfile === 'string' && item.senderProfile.length > 0;

        return (
            <TouchableOpacity
                onPress={() => handleNotificationPress(item)}
                className={`flex-row items-center p-4 border-b ${isDark ? 'border-slate-800' : 'border-gray-100'} ${item.isRead
                    ? (isDark ? 'bg-slate-950' : 'bg-white')
                    : (isDark ? 'bg-teal-900/10' : 'bg-teal-50/30')
                    }`}
            >
                <View className="mr-3">
                    {hasProfileImage ? (
                        <TouchableOpacity
                            className="relative"
                            onPress={() => {
                                const senderId = getSenderId(item);
                                if (senderId) {
                                    if (senderId === user?._id) {
                                        navigation.navigate('Home', { screen: 'Profile' });
                                    } else {
                                        navigation.navigate('UserProfile', { userId: senderId });
                                    }
                                }
                            }}
                        >
                            <Image source={{ uri: item.senderProfile }} className="w-14 h-14 rounded-full" />
                            <View className="absolute -bottom-1 -right-1">
                                {getNotificationIcon(notifType)}
                            </View>
                        </TouchableOpacity>
                    ) : (
                        getNotificationIcon(notifType)
                    )}
                </View>
                <View className="flex-1">
                    <Text className={`${isDark ? 'text-slate-100' : 'text-gray-900'} ${item.isRead ? 'font-normal' : 'font-bold'}`}>
                        {title}
                    </Text>
                    {body ? (
                        <Text className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm mt-1`} numberOfLines={2}>
                            {body}
                        </Text>
                    ) : null}
                    {timeAgo ? (
                        <Text className={`${isDark ? 'text-slate-500' : 'text-gray-400'} text-xs mt-1`}>
                            {timeAgo}
                        </Text>
                    ) : null}
                </View>
                {!item.isRead && (
                    <View className={`w-2 h-2 ${isDark ? 'bg-teal-500' : 'bg-teal-600'} rounded-full ml-2`} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
            <View className={`px-4 py-3 border-b flex-row justify-between items-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-100'}`}>
                <Text className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Notifications</Text>
                {!loading && notifications.some(n => !n.isRead) && (
                    <TouchableOpacity
                        onPress={() => {
                            const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
                            if (unreadIds.length > 0) {
                                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                                put('/api/notifications/mark-read', {
                                    userId: user?._id,
                                    notificationIds: unreadIds
                                });
                            }
                        }}
                    >
                        <Text className={`${isDark ? 'text-teal-400' : 'text-teal-600'} font-medium`}>Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#0f766e" />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[isDark ? '#2dd4bf' : '#0f766e']}
                            tintColor={isDark ? '#2dd4bf' : '#0f766e'}
                        />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center pt-20 px-10">
                            <View className={`${isDark ? 'bg-slate-900' : 'bg-gray-100'} p-6 rounded-full mb-4`}>
                                <Ionicons name="notifications-off-outline" size={60} color={isDark ? "#475569" : "#9ca3af"} />
                            </View>
                            <Text className={`${isDark ? 'text-slate-100' : 'text-gray-900'} text-lg font-bold`}>No notifications yet</Text>
                            <Text className={`${isDark ? 'text-slate-400' : 'text-gray-500'} text-center mt-2`}>
                                We'll let you know when something important happens!
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
