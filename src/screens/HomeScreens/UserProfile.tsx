import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    StatusBar,
    Alert,
    Linking,
    Modal,
    Pressable,
    Share,
    Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { get, post } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import VideoPlayer from '../../components/VideoPlayer';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-clipboard/clipboard';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface UserProfileData {
    _id: string;
    name: string;
    userName: string;
    profileImage: string;
    coverImage?: string;
    email?: string;
    bio?: string;
    shortBio?: string;
    location?: string;
    work?: string;
    education?: string;
    phone?: string;
    studies?: string;
    dateOfBirth?: string;
    website?: string;
    hometown?: string;
    relationshipStatus?: string;
    friendsCount?: number;
    bookCollectionsCount?: number;
    isOnline?: boolean;
}

interface Post {
    _id: string;
    userId: string;
    userName?: string;
    userProfileImage?: string;
    description: string;
    image?: string;
    imageUrl?: string;
    pdf?: string;
    likes: number;
    likedBy: string[];
    comments: any[];
    createdAt: string;
    video?: string;
    date?: string;
    time?: string;
}

const ShareSheet = ({
    visible,
    onClose,
    post
}: {
    visible: boolean;
    onClose: () => void;
    post: Post | null;
}) => {
    const { isDark } = useTheme();
    if (!post) return null;

    const shareOptions = [
        {
            id: 'share_native',
            label: 'Share via...',
            icon: 'share-social-outline',
            color: '#6C63FF',
            action: async () => {
                try {
                    await Share.share({
                        message: `${post.userName || 'Someone'}'s Opinion: ${post.description}\n\nShared via FlyBook`,
                    });
                    onClose();
                } catch (error) {
                    Alert.alert('Error', 'Failed to share post');
                }
            },
        },
        {
            id: 'copy_link',
            label: 'Copy Link',
            icon: 'copy-outline',
            color: '#43CBFF',
            action: () => {
                Clipboard.setString(`https://flybook.com.bd/opinion-post/${post._id}`);
                Toast.show({ type: 'success', text1: 'Link copied!' });
                onClose();
            },
        },
        {
            id: 'report',
            label: 'Report',
            icon: 'flag-outline',
            color: '#FF6584',
            action: () => {
                Alert.alert('Reported', 'Thank you for reporting this post.');
                onClose();
            },
        },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <View style={[styles.bottomSheet, isDark && { backgroundColor: '#1e293b' }]}>
                    <View style={[styles.sheetHandle, isDark && { backgroundColor: '#334155' }]} />
                    <Text style={[styles.sheetTitle, isDark && { color: '#f8fafc' }]}>Share Opinion</Text>

                    <View style={styles.sheetOptions}>
                        {shareOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[styles.sheetOptionList, isDark && { borderBottomColor: '#334155' }]}
                                onPress={option.action}
                            >
                                <View style={[styles.optionIconCircle, { backgroundColor: option.color + '15' }]}>
                                    <Ionicons name={option.icon} size={20} color={option.color} />
                                </View>
                                <Text style={[styles.optionLabelList, isDark && { color: '#f8fafc' }]}>{option.label}</Text>
                                <Ionicons name="chevron-forward" size={16} color={isDark ? "#475569" : "#DDD"} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={[styles.cancelButton, isDark && { backgroundColor: '#334155' }]} onPress={onClose}>
                        <Text style={[styles.cancelButtonText, isDark && { color: '#cbd5e1' }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
};

const ProfileOptionsSheet = ({
    visible,
    onClose,
    user,
    onSeeFriendship,
    onReportProfile,
    onBlock,
    onShareProfile,
    isFriend,
    isSent,
    isReceived,
    onUnfriend,
    onCancelRequest,
    onAccept,
    onReject,
}: {
    visible: boolean;
    onClose: () => void;
    user: UserProfileData | null;
    onSeeFriendship: () => void;
    onReportProfile: () => void;
    onBlock: () => void;
    onShareProfile: () => void;
    isFriend: boolean;
    isSent: boolean;
    isReceived: boolean;
    onUnfriend: () => void;
    onCancelRequest: () => void;
    onAccept: () => void;
    onReject: () => void;
}) => {
    const { isDark } = useTheme();
    if (!user) return null;

    const profileOptions = [
        ...(isFriend ? [{
            id: 'unfriend',
            label: 'Unfriend',
            icon: 'person-remove-outline',
            color: '#EF4444',
            action: onUnfriend,
        }] : []),
        ...(isSent ? [{
            id: 'cancel_request',
            label: 'Cancel Friend Request',
            icon: 'close-circle-outline',
            color: '#D97706',
            action: onCancelRequest,
        }] : []),
        ...(isReceived ? [
            {
                id: 'accept_request',
                label: 'Accept Friend Request',
                icon: 'checkmark-circle-outline',
                color: '#10B981',
                action: onAccept,
            },
            {
                id: 'reject_request',
                label: 'Reject Friend Request',
                icon: 'close-circle-outline',
                color: '#EF4444',
                action: onReject,
            }
        ] : []),
        {
            id: 'see_friendship',
            label: 'See Friendship',
            icon: 'people-outline',
            color: '#8B5CF6',
            action: onSeeFriendship,
        },
        {
            id: 'report_profile',
            label: 'Report Profile',
            icon: 'flag-outline',
            color: '#F59E0B',
            action: onReportProfile,
        },
        {
            id: 'block',
            label: 'Block',
            icon: 'ban-outline',
            color: '#EF4444',
            action: onBlock,
        },
        {
            id: 'share_profile',
            label: 'Share Profile',
            icon: 'share-social-outline',
            color: '#0EA5E9',
            action: onShareProfile,
        },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <View style={[styles.bottomSheet, isDark && { backgroundColor: '#1e293b' }]}>
                    <View style={[styles.sheetHandle, isDark && { backgroundColor: '#334155' }]} />
                    <Text style={[styles.sheetTitle, isDark && { color: '#f8fafc' }]}>Profile Options</Text>

                    <View style={styles.sheetOptions}>
                        {profileOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[styles.sheetOptionList, isDark && { borderBottomColor: '#334155' }]}
                                onPress={() => {
                                    option.action();
                                    onClose();
                                }}
                            >
                                <View style={[styles.optionIconCircle, { backgroundColor: option.color + '15' }]}>
                                    <Ionicons name={option.icon} size={20} color={option.color} />
                                </View>
                                <Text style={[styles.optionLabelList, isDark && { color: '#f8fafc' }]}>{option.label}</Text>
                                <Ionicons name="chevron-forward" size={16} color={isDark ? "#475569" : "#DDD"} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={[styles.cancelButton, isDark && { backgroundColor: '#334155' }]} onPress={onClose}>
                        <Text style={[styles.cancelButtonText, isDark && { color: '#cbd5e1' }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
};

const UserProfile = () => {
    const { isDark } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<any>();
    const { userId } = route.params || {};
    const { user: currentUser, refreshUser } = useAuth();

    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
    const [processingAction, setProcessingAction] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isShareSheetVisible, setShareSheetVisible] = useState(false);
    const [isProfileOptionsVisible, setProfileOptionsVisible] = useState(false);

    const defaultAvatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
    const defaultCover = 'https://i.ibb.co.com/xmyN9fT/freepik-expand-75906-min.png';
    const insets = useSafeAreaInsets();
    // iOS: Dynamic Island/notch অনুযায়ী button position নির্ধারণ
    const topButtonPosition = Platform.OS === 'ios' ? Math.max(insets.top, 44) : 40;

    const {
        data: user,
        isLoading: loading,
        refetch: refetchProfile
    } = useQuery({
        queryKey: ['user-profile', userId],
        queryFn: async () => {
            const response = await get<{ success: boolean; data: UserProfileData }>(`/api/user-profile/${userId}`);
            return response.data || null;
        },
        enabled: !!userId,
    });

    const {
        data: postsData,
        isLoading: loadingPosts,
        refetch: refetchPosts
    } = useQuery({
        queryKey: ['user-posts', userId],
        queryFn: async () => {
            const response = await get<{ data: Post[] }>(`/api/opinion/fast-posts?userId=${userId}&limit=20`);
            return response?.data || [];
        },
        enabled: !!userId,
    });

    const posts = postsData || [];

    // --- Friend Actions ---
    const sendRequestMutation = useMutation({
        mutationFn: () => post('/friend-request/send', { recipientId: userId }),
        onSuccess: () => refreshUser(),
        onSettled: () => setProcessingAction(false),
    });

    const acceptRequestMutation = useMutation({
        mutationFn: () => post('/friend-request/accept', { acceptId: userId }),
        onSuccess: () => refreshUser(),
        onSettled: () => setProcessingAction(false),
    });

    const rejectRequestMutation = useMutation({
        mutationFn: () => post('/friend-request/reject', { senderId: userId }),
        onSuccess: () => refreshUser(),
        onSettled: () => setProcessingAction(false),
    });

    const cancelRequestMutation = useMutation({
        mutationFn: () => post('/friend-request/cancel', { recipientId: userId }),
        onSuccess: () => refreshUser(),
        onSettled: () => setProcessingAction(false),
    });

    const unfriendMutation = useMutation({
        mutationFn: () => post('/friend-request/unfriend', { friendId: userId }),
        onSuccess: () => refreshUser(),
        onSettled: () => setProcessingAction(false),
    });

    const blockUserMutation = useMutation({
        mutationFn: () => post('/api/user/block', { userId: userId }),
        onSuccess: () => {
            refreshUser();
            queryClient.invalidateQueries({ queryKey: ['peoples'] });
            queryClient.invalidateQueries({ queryKey: ['opinion-posts'] });
            queryClient.invalidateQueries({ queryKey: ['home-posts'] });
            Toast.show({ type: 'success', text1: 'User blocked', text2: 'They have been removed from your feeds.' });
            navigation.goBack();
        },
        onError: (err: any) => {
            Toast.show({ type: 'error', text1: 'Block failed', text2: err.message || 'Please try again.' });
        },
        onSettled: () => setProcessingAction(false),
    });

    const unblockUserMutation = useMutation({
        mutationFn: () => post('/api/user/unblock', { unblockId: userId }),
        onSuccess: () => {
            refreshUser();
            refetchProfile();
            Toast.show({ type: 'success', text1: 'User unblocked' });
        },
        onSettled: () => setProcessingAction(false),
    });

    const handleAction = (action: () => void) => {
        setProcessingAction(true);
        action();
    };

    const handleUnfriendConfirm = () => {
        Alert.alert(
            'Unfriend',
            `Are you sure you want to unfriend ${user?.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unfriend',
                    style: 'destructive',
                    onPress: () => handleAction(() => unfriendMutation.mutate())
                },
            ]
        );
    };

    const handleMessage = async () => {
        if (!user) return;

        // --- PRO SSO FLOW ---
        // We use the sso-auth flow with a 'target' parameter.
        // This ensures the user is logged in AND navigates to this specific chat.
        const url = `flybook://sso-auth?callback=flyconnect&target=chat:${user._id}`;

        try {
            const supported = await Linking.canOpenURL('flyconnect://'); // Check if FlyConnect exists
            if (supported) {
                await Linking.openURL(url);
            } else {
                Toast.show({
                    type: 'info',
                    text1: 'FlyConnect App Not Installed',
                    text2: 'Opening local chat as fallback...',
                });
                // Fallback to internal chatroom
                (navigation as any).navigate('ChatRoom', {
                    chatUser: {
                        _id: user._id,
                        name: user.name,
                        profileImage: user.profileImage,
                        isOnline: user.isOnline || false
                    }
                });
            }
        } catch (error) {
            console.error('Deep linking error:', error);
            // Emergency fallback
            (navigation as any).navigate('ChatRoom', {
                chatUser: {
                    _id: user._id,
                    name: user.name,
                    profileImage: user.profileImage,
                    isOnline: user.isOnline || false
                }
            });
        }
    };

    const handleLibrary = () => {
        navigation.navigate('UserLibrary', { userId, userName: user?.name });
    };


    const handleSeeFriendship = () => {
        navigation.navigate('UserFriends', { userId, userName: user?.name });
    };

    const handleReportProfile = () => {
        navigation.navigate('ReportProfile', { userId, userName: user?.name });
    };

    const handleBlockUser = () => {
        Alert.alert(
            'Block User',
            `Are you sure you want to block ${user?.name}? You won't see each other's content and they won't be able to message you.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Block',
                    style: 'destructive',
                    onPress: () => handleAction(() => blockUserMutation.mutate()),
                },
            ]
        );
    };

    const handleShareProfile = async () => {
        try {
            await Share.share({
                message: `Check out ${user?.name}'s profile on FlyBook!\nhttps://flybook.com.bd/profile/${userId}`,
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to share profile');
        }
    };

    // --- Helper Functions ---
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        if (time.length < 5) return time;
        return time.slice(0, -6) + time.slice(-3);
    };

    const truncateText = (text: string, maxLength: number) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };

    const handlePdfView = (pdfUrl: string) => {
        Linking.openURL(pdfUrl).catch((err) => {
            Toast.show({
                type: 'error',
                text1: 'Failed to open PDF',
            });
        });
    };

    const handleShare = (post: Post) => {
        setSelectedPost(post);
        setShareSheetVisible(true);
    };

    const handleLikeToggle = async (postId: string, isLiked: boolean) => {
        if (!currentUser?._id) return;

        // Optimistic Update with React Query
        const queryKey = ['user-posts', userId];
        const previousPosts = queryClient.getQueryData<Post[]>(queryKey);

        if (previousPosts) {
            queryClient.setQueryData<Post[]>(queryKey, (old) => {
                return old?.map((p: Post) => {
                    if (p._id === postId) {
                        return {
                            ...p,
                            likes: isLiked ? Math.max(0, (p.likes || 0) - 1) : (p.likes || 0) + 1,
                            likedBy: isLiked
                                ? (p.likedBy || []).filter(id => id !== currentUser._id)
                                : [...(p.likedBy || []), currentUser._id]
                        };
                    }
                    return p;
                });
            });
        }

        try {
            const endpoint = isLiked ? '/opinion/unlike' : '/opinion/like';
            const response = await post<{ success: boolean }>(endpoint, { postId });

            if (!response?.success) {
                queryClient.setQueryData(queryKey, previousPosts);
                Toast.show({ type: 'error', text1: 'Action failed' });
            }
        } catch (err) {
            console.error('Like error:', err);
            queryClient.setQueryData(queryKey, previousPosts);
        }
    };

    const navigateToPostDetail = (post: Post) => {
        navigation.navigate('OpinionDetails', { post });
    };

    // Determine Friend Status
    const isFriend = currentUser?.friends?.includes(userId);
    const isSent = currentUser?.friendRequestsSent?.includes(userId);
    const isReceived = currentUser?.friendRequestsReceived?.includes(userId);

    const renderActionButtons = () => {
        if (currentUser?._id === userId) return null;

        const hasFriendshipStatus = isFriend || isSent || isReceived;

        return (
            <View style={styles.actionRow}>
                {/* Only show Add Friend prominently if no existing relationship */}
                {!hasFriendshipStatus && (
                    <TouchableOpacity
                        style={{ flex: 1.2 }}
                        onPress={() => handleAction(() => sendRequestMutation.mutate())}
                        disabled={processingAction}
                    >
                        <LinearGradient
                            colors={['#14B8A6', '#0D9488']}
                            style={styles.actionButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="person-add" size={18} color="#FFF" />
                            <Text style={[styles.actionButtonText, { color: '#FFF' }]}>Add Friend</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={{ flex: 1 }} onPress={handleMessage}>
                    <View style={[styles.actionButton, isDark ? { backgroundColor: '#334155' } : styles.btnGray]}>
                        <Ionicons name="chatbubble-ellipses" size={18} color={isDark ? "#94a3b8" : "#374151"} />
                        <Text style={[styles.actionButtonText, isDark && { color: '#cbd5e1' }]}>Message</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={{ flex: 1 }} onPress={handleLibrary}>
                    <LinearGradient
                        colors={isDark ? ['#5B21B6', '#4C1D95'] : ['#8B5CF6', '#7C3AED']}
                        style={styles.actionButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="library" size={18} color="#FFF" />
                        <Text style={[styles.actionButtonText, { color: '#FFF' }]}>Library</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, isDark && { backgroundColor: '#0f172a' }]}>
                <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#0D9488"} />
                <Text style={[styles.loadingText, isDark && { color: '#94a3b8' }]}>Loading Profile...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.errorContainer, isDark && { backgroundColor: '#0f172a' }]}>
                <Ionicons name="alert-circle-outline" size={64} color={isDark ? "#475569" : "#CBD5E1"} />
                <Text style={[styles.errorText, isDark && { color: '#f8fafc' }]}>User not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                    <Text style={styles.backLinkText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isBlocked = currentUser?.blockedUsers?.some((id: any) => id?.toString() === userId?.toString());

    if (isBlocked) {
        return (
            <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}>
                <View style={styles.blockedHeader}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.blockedBack}>
                        <Ionicons name="arrow-back" size={24} color={isDark ? "#FFF" : "#000"} />
                    </TouchableOpacity>
                </View>
                <View style={[styles.center, { flex: 1, paddingHorizontal: 40 }]}>
                    <View style={styles.blockedIconContainer}>
                        <Ionicons name="ban" size={80} color="#EF4444" />
                    </View>
                    <Text style={[styles.blockedTitle, isDark && { color: '#f8fafc' }]}>Account Blocked</Text>
                    <Text style={[styles.blockedSub, isDark && { color: '#94a3b8' }]}>
                        You have blocked this account. You cannot see their posts or visit their profile unless you unblock them.
                    </Text>
                    <TouchableOpacity
                        style={styles.unblockBtnLarge}
                        onPress={() => handleAction(() => unblockUserMutation.mutate())}
                        disabled={processingAction}
                    >
                        {processingAction ? <ActivityIndicator color="#FFF" /> : <Text style={styles.unblockBtnText}>Unblock Account</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={[styles.headerContainer, isDark && { backgroundColor: '#0f172a' }]}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('FullImageViewer', { imageUrl: user.coverImage || defaultCover })}
                        activeOpacity={0.9}
                    >
                        <Image
                            source={{ uri: user.coverImage || defaultCover }}
                            style={styles.coverImage}
                            resizeMode="cover"
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.6)']}
                            style={styles.coverOverlay}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.backButton, { top: topButtonPosition }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    {currentUser?._id !== userId && (
                        <TouchableOpacity
                            style={[styles.moreButton, { top: topButtonPosition }]}
                            onPress={() => setProfileOptionsVisible(true)}
                        >
                            <Ionicons name="ellipsis-vertical" size={22} color="#FFF" />
                        </TouchableOpacity>
                    )}

                    <LinearGradient
                        colors={isDark ? ['#1e293b', '#0f172a'] : ['#FFFFFF', '#F8FAFC']}
                        style={styles.profileContentWrapper}
                    >
                        <View style={styles.profileContent}>
                            <View style={[styles.avatarContainer, isDark && styles.darkAvatarContainer]}>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('FullImageViewer', { imageUrl: user.profileImage || defaultAvatar })}
                                    activeOpacity={0.9}
                                >
                                    <Image
                                        source={{ uri: user.profileImage || defaultAvatar }}
                                        style={styles.avatar}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.userInfo}>
                                <Text style={[styles.userName, isDark && { color: '#f8fafc' }]}>{user.name}</Text>
                                <View style={[styles.handleBadge, isDark && { backgroundColor: '#334155' }]}>
                                    <Text style={[styles.userHandle, isDark && { color: '#cbd5e1' }]}>@{user.userName || user.name.replace(/\s+/g, '').toLowerCase()}</Text>
                                    {user.isOnline && <View style={styles.onlineDot} />}
                                </View>

                                {(user.bio || user.shortBio) && (
                                    <Text style={[styles.userBio, isDark && { color: '#94a3b8' }]} numberOfLines={3}>
                                        {user.bio || user.shortBio}
                                    </Text>
                                )}

                                {/* Stats Card */}
                                <LinearGradient
                                    colors={isDark ? ['#1e293b', '#0f172a'] : ['#1E293B', '#0F172A']}
                                    style={styles.statsCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValueLight}>{posts.length}</Text>
                                        <Text style={styles.statLabelLight}>Posts</Text>
                                    </View>
                                    <View style={styles.statDividerLight} />
                                    <TouchableOpacity
                                        style={styles.statItem}
                                        onPress={() => navigation.navigate('UserFriends', { userId: user._id, userName: user.name })}
                                    >
                                        <Text style={styles.statValueLight}>{user.friendsCount ?? 0}</Text>
                                        <Text style={styles.statLabelLight}>Friends</Text>
                                    </TouchableOpacity>
                                    <View style={styles.statDividerLight} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValueLight}>{user.bookCollectionsCount ?? 0}</Text>
                                        <Text style={styles.statLabelLight}>Books</Text>
                                    </View>
                                </LinearGradient>

                                {/* Action Buttons */}
                                <View style={styles.actionsContainer}>
                                    {renderActionButtons()}
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Tabs */}
                <View style={[styles.tabContainer, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'posts' && (isDark ? { borderBottomColor: '#14b8a6' } : styles.activeTab)]}
                        onPress={() => setActiveTab('posts')}
                    >
                        <Text style={[styles.tabText, activeTab === 'posts' && (isDark ? { color: '#14b8a6' } : styles.activeTabText)]}>Posts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'about' && (isDark ? { borderBottomColor: '#14b8a6' } : styles.activeTab)]}
                        onPress={() => setActiveTab('about')}
                    >
                        <Text style={[styles.tabText, activeTab === 'about' && (isDark ? { color: '#14b8a6' } : styles.activeTabText)]}>About</Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Content */}
                {activeTab === 'posts' ? (
                    <View style={styles.postsContainer}>
                        {loadingPosts ? (
                            <ActivityIndicator size="small" color={isDark ? "#14b8a6" : "#0D9488"} style={{ marginTop: 20 }} />
                        ) : posts.length > 0 ? (
                            posts.map((postItem) => (
                                <View key={postItem._id} style={[styles.postCard, isDark && { backgroundColor: '#1e293b', shadowOpacity: 0 }]}>
                                    {/* Post Header */}
                                    <View style={[styles.userHeader, isDark && { borderBottomColor: '#334155' }]}>
                                        <Image
                                            source={{ uri: postItem.userProfileImage || user.profileImage || defaultAvatar }}
                                            style={styles.userImage}
                                        />
                                        <View style={styles.userInfoHeader}>
                                            <Text style={[styles.postUserName, isDark && { color: '#f8fafc' }]}>{postItem.userName || user.name}</Text>
                                            <Text style={[styles.postTime, isDark && { color: '#94a3b8' }]}>
                                                {postItem.date || formatDate(postItem.createdAt)} {postItem.time ? `at ${formatTime(postItem.time)}` : ''}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Description */}
                                    <TouchableOpacity
                                        style={styles.descriptionContainer}
                                        onPress={() => navigateToPostDetail(postItem)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.description, isDark && { color: '#cbd5e1' }]}>
                                            {truncateText(postItem.description, 180)}
                                        </Text>
                                        {postItem.description.length > 180 && (
                                            <TouchableOpacity
                                                onPress={() => navigateToPostDetail(postItem)}
                                                style={styles.readMoreButton}
                                            >
                                                <Text style={styles.readMoreText}>Read More</Text>
                                            </TouchableOpacity>
                                        )}
                                    </TouchableOpacity>

                                    {/* PDF */}
                                    {postItem.pdf && (
                                        <TouchableOpacity
                                            onPress={() => handlePdfView(postItem.pdf!)}
                                            style={[styles.pdfContainer, isDark && { backgroundColor: '#0f172a', borderColor: '#334155' }]}
                                        >
                                            <Ionicons name="document-text" size={24} color="#EF4444" />
                                            <Text style={styles.pdfText}>View PDF</Text>
                                        </TouchableOpacity>
                                    )}

                                    {/* Image */}
                                    {(postItem.image || postItem.imageUrl) && (
                                        <TouchableOpacity
                                            onPress={() => (navigation as any).navigate('FullImageViewer', { imageUrl: postItem.image || postItem.imageUrl })}
                                            activeOpacity={0.9}
                                            style={[styles.imageContainer, isDark && { backgroundColor: '#0f172a' }]}
                                        >
                                            <Image
                                                source={{ uri: postItem.image || postItem.imageUrl }}
                                                style={styles.postImage}
                                                resizeMode="cover"
                                            />
                                        </TouchableOpacity>
                                    )}

                                    {/* Video */}
                                    {postItem.video && (
                                        <View style={styles.videoContainer}>
                                            <VideoPlayer
                                                uri={postItem.video}
                                                height={220}
                                                borderRadius={12}
                                                onFullscreen={() => navigateToPostDetail(postItem)}
                                            />
                                        </View>
                                    )}

                                    {/* Actions */}
                                    <View style={[styles.postActionsContainer, isDark && { backgroundColor: '#1e293b' }]}>
                                        <View style={styles.likeContainer}>
                                            <TouchableOpacity
                                                onPress={() => handleLikeToggle(postItem._id, !!(currentUser && postItem.likedBy?.includes(currentUser._id)))}
                                                style={styles.likeButton}
                                            >
                                                <Ionicons
                                                    name={currentUser && postItem.likedBy?.includes(currentUser._id) ? "heart" : "heart-outline"}
                                                    size={28}
                                                    color={currentUser && postItem.likedBy?.includes(currentUser._id) ? "#EF4444" : (isDark ? "#94a3b8" : "#475569")}
                                                />
                                            </TouchableOpacity>
                                            <Text style={[styles.likesText, isDark && { color: '#cbd5e1' }]}>{postItem.likes || 0} Likes</Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.commentIconContainer, isDark && { backgroundColor: '#334155' }]}
                                            onPress={() => navigateToPostDetail(postItem)}
                                        >
                                            <Ionicons name="chatbubble-outline" size={22} color={isDark ? "#94a3b8" : "#475569"} />
                                            <Text style={[styles.commentCountText, isDark && { color: '#cbd5e1' }]}>{postItem.comments?.length || 0}</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.shareButton}
                                            onPress={() => handleShare(postItem)}
                                        >
                                            <Ionicons name="share-social-outline" size={22} color={isDark ? "#94a3b8" : "#475569"} />
                                            <Text style={[styles.shareText, isDark && { color: '#cbd5e1' }]}>Share</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No posts shared yet</Text>
                            </View>
                        )}
                    </View >
                ) : (
                    <View style={styles.aboutContainer}>
                        <View style={[styles.aboutCard, isDark && { backgroundColor: '#1e293b', shadowOpacity: 0 }]}>
                            <Text style={[styles.aboutTitle, isDark && { color: '#f8fafc' }]}>Bio</Text>
                            <Text style={[styles.aboutText, isDark && { color: '#cbd5e1' }]}>{user.bio || user.shortBio || 'No bio available'}</Text>
                        </View>

                        <View style={[styles.aboutCard, isDark && { backgroundColor: '#1e293b' }]}>
                            <Text style={[styles.aboutTitle, isDark && { color: '#f8fafc' }]}>Personal Information</Text>

                            {user.email && (
                                <View style={styles.aboutRow}>
                                    <View style={[styles.iconBox, isDark && { backgroundColor: '#334155' }]}><Ionicons name="mail" size={18} color={isDark ? "#14b8a6" : "#0D9488"} /></View>
                                    <View>
                                        <Text style={[styles.infoLabel, isDark && { color: '#94a3b8' }]}>Email</Text>
                                        <Text style={[styles.infoText, isDark && { color: '#f8fafc' }]}>{user.email}</Text>
                                    </View>
                                </View>
                            )}

                            {user.phone && (
                                <View style={styles.aboutRow}>
                                    <View style={[styles.iconBox, isDark && { backgroundColor: '#334155' }]}><Ionicons name="call" size={18} color={isDark ? "#14b8a6" : "#0D9488"} /></View>
                                    <View>
                                        <Text style={[styles.infoLabel, isDark && { color: '#94a3b8' }]}>Phone</Text>
                                        <Text style={[styles.infoText, isDark && { color: '#f8fafc' }]}>{user.phone}</Text>
                                    </View>
                                </View>
                            )}

                            {user.location && (
                                <View style={styles.aboutRow}>
                                    <View style={[styles.iconBox, isDark && { backgroundColor: '#334155' }]}><Ionicons name="home" size={18} color={isDark ? "#14b8a6" : "#0D9488"} /></View>
                                    <View>
                                        <Text style={[styles.infoLabel, isDark && { color: '#94a3b8' }]}>Lives in</Text>
                                        <Text style={[styles.infoText, isDark && { color: '#f8fafc' }]}>{user.location}</Text>
                                    </View>
                                </View>
                            )}

                            {user.hometown && (
                                <View style={styles.aboutRow}>
                                    <View style={[styles.iconBox, isDark && { backgroundColor: '#334155' }]}><Ionicons name="location" size={18} color={isDark ? "#14b8a6" : "#0D9488"} /></View>
                                    <View>
                                        <Text style={[styles.infoLabel, isDark && { color: '#94a3b8' }]}>From</Text>
                                        <Text style={[styles.infoText, isDark && { color: '#f8fafc' }]}>{user.hometown}</Text>
                                    </View>
                                </View>
                            )}

                            {user.relationshipStatus && (
                                <View style={styles.aboutRow}>
                                    <View style={[styles.iconBox, isDark && { backgroundColor: '#334155' }]}><Ionicons name="heart" size={18} color={isDark ? "#14b8a6" : "#0D9488"} /></View>
                                    <View>
                                        <Text style={[styles.infoLabel, isDark && { color: '#94a3b8' }]}>Relationship</Text>
                                        <Text style={[styles.infoText, isDark && { color: '#f8fafc' }]}>{user.relationshipStatus}</Text>
                                    </View>
                                </View>
                            )}

                            {user.dateOfBirth && (
                                <View style={styles.aboutRow}>
                                    <View style={[styles.iconBox, isDark && { backgroundColor: '#334155' }]}><Ionicons name="calendar" size={18} color={isDark ? "#14b8a6" : "#0D9488"} /></View>
                                    <View>
                                        <Text style={[styles.infoLabel, isDark && { color: '#94a3b8' }]}>Date of Birth</Text>
                                        <Text style={[styles.infoText, isDark && { color: '#f8fafc' }]}>{user.dateOfBirth}</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {(user.work || user.studies || user.education) && (
                            <View style={[styles.aboutCard, isDark && { backgroundColor: '#1e293b' }]}>
                                <Text style={[styles.aboutTitle, isDark && { color: '#f8fafc' }]}>Work & Education</Text>
                                {user.work && (
                                    <View style={styles.aboutRow}>
                                        <View style={[styles.iconBox, isDark && { backgroundColor: '#334155' }]}><Ionicons name="briefcase" size={18} color={isDark ? "#14b8a6" : "#0D9488"} /></View>
                                        <View>
                                            <Text style={[styles.infoLabel, isDark && { color: '#94a3b8' }]}>Work</Text>
                                            <Text style={[styles.infoText, isDark && { color: '#f8fafc' }]}>{user.work}</Text>
                                        </View>
                                    </View>
                                )}
                                {(user.studies || user.education) && (
                                    <View style={styles.aboutRow}>
                                        <View style={[styles.iconBox, isDark && { backgroundColor: '#334155' }]}><Ionicons name="school" size={18} color={isDark ? "#14b8a6" : "#0D9488"} /></View>
                                        <View>
                                            <Text style={[styles.infoLabel, isDark && { color: '#94a3b8' }]}>Education</Text>
                                            <Text style={[styles.infoText, isDark && { color: '#f8fafc' }]}>{user.studies || user.education}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={[styles.aboutCard, isDark && { backgroundColor: '#1e293b' }]}>
                            <Text style={[styles.aboutTitle, isDark && { color: '#f8fafc' }]}>Activity</Text>
                            <View style={styles.aboutRow}>
                                <View style={[styles.iconBox, isDark && { backgroundColor: '#334155' }]}><Ionicons name="document-text" size={18} color={isDark ? "#14b8a6" : "#0D9488"} /></View>
                                <View>
                                    <Text style={[styles.infoLabel, isDark && { color: '#94a3b8' }]}>Posts</Text>
                                    <Text style={[styles.infoText, isDark && { color: '#f8fafc' }]}>{posts.length} Published</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView >

            <ShareSheet
                visible={isShareSheetVisible}
                onClose={() => setShareSheetVisible(false)}
                post={selectedPost}
            />

            <ProfileOptionsSheet
                visible={isProfileOptionsVisible}
                onClose={() => setProfileOptionsVisible(false)}
                user={user}
                onSeeFriendship={handleSeeFriendship}
                onReportProfile={handleReportProfile}
                onBlock={handleBlockUser}
                onShareProfile={handleShareProfile}
                isFriend={!!isFriend}
                isSent={!!isSent}
                isReceived={!!isReceived}
                onUnfriend={handleUnfriendConfirm}
                onCancelRequest={() => handleAction(() => cancelRequestMutation.mutate())}
                onAccept={() => handleAction(() => acceptRequestMutation.mutate())}
                onReject={() => handleAction(() => rejectRequestMutation.mutate())}
            />
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginTop: 12,
    },
    headerContainer: {
        backgroundColor: '#FFF',
        marginBottom: 8,
        paddingBottom: 20,
    },
    coverImage: {
        width: '100%',
        height: Platform.OS === 'ios' ? 200 : 170,
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    moreButton: {
        position: 'absolute',
        top: 40,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    profileContentWrapper: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: Platform.OS === 'ios' ? -50 : -40,
        paddingTop: 20,
    },
    profileContent: {
        paddingHorizontal: 20,
        alignItems: 'center',
        paddingBottom: 20,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFF',
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        marginTop: Platform.OS === 'ios' ? -70 : -85,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 15,
    },
    darkAvatarContainer: {
        borderColor: '#1e293b',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    userInfo: {
        marginTop: 15,
        alignItems: 'center',
        width: '100%',
    },
    userName: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    handleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 25,
        marginTop: 8,
        marginBottom: 15,
    },
    userHandle: {
        fontSize: 15,
        color: '#64748B',
        fontWeight: '700',
    },
    onlineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10B981',
        marginLeft: 8,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    userBio: {
        fontSize: 15,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
        paddingHorizontal: 20,
        fontWeight: '500',
    },
    statsCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 24,
        paddingHorizontal: 15,
        borderRadius: 28,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDividerLight: {
        width: 1,
        height: '60%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'center',
    },
    statValueLight: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    statLabelLight: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: 4,
    },
    actionsContainer: {
        width: '100%',
    },
    actionRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 18,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    actionButtonText: {
        fontWeight: '800',
        fontSize: 15,
    },
    btnGray: { backgroundColor: '#F1F5F9' },
    btnRedLight: { backgroundColor: '#FEF2F2' },
    textRed: { color: '#EF4444' },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingHorizontal: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 18,
        alignItems: 'center',
        borderBottomWidth: 4,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#0D9488',
    },
    tabText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#94A3B8',
    },
    activeTabText: {
        color: '#0D9488',
    },
    postsContainer: {
        paddingTop: 20,
        paddingBottom: 60,
    },
    postCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        marginBottom: 20,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 5,
        overflow: 'hidden',
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    userImage: {
        width: 52,
        height: 52,
        borderRadius: 26,
        marginRight: 15,
    },
    userInfoHeader: {
        flex: 1,
    },
    postUserName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    postTime: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: 2,
    },
    descriptionContainer: {
        padding: 20,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#334155',
        fontWeight: '400',
    },
    readMoreButton: {
        marginTop: 10,
    },
    readMoreText: {
        fontSize: 14,
        color: '#0D9488',
        fontWeight: '800',
    },
    pdfContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    pdfText: {
        marginLeft: 12,
        fontSize: 14,
        color: '#EF4444',
        fontWeight: '800',
    },
    imageContainer: {
        width: '100%',
        backgroundColor: '#F8FAFC',
    },
    postImage: {
        width: '100%',
        height: 380,
    },
    postActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FDFDFD',
    },
    likeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    likeButton: {
        padding: 5,
    },
    likesText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#475569',
        marginLeft: 6,
    },
    commentIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 25,
    },
    commentCountText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '800',
        color: '#475569',
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
    },
    shareText: {
        marginLeft: 6,
        fontSize: 15,
        fontWeight: '800',
        color: '#475569',
    },
    emptyContainer: {
        padding: 80,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 17,
        fontWeight: '700',
        marginTop: 15,
    },
    aboutContainer: {
        padding: 16,
        gap: 20,
        paddingBottom: 80,
    },
    aboutCard: {
        backgroundColor: '#FFF',
        padding: 28,
        borderRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
    },
    aboutTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 20,
    },
    aboutText: {
        fontSize: 16,
        color: '#475569',
        lineHeight: 26,
    },
    aboutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F0FDFA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    infoLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 17,
        color: '#1E293B',
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 30,
        paddingBottom: Platform.OS === 'ios' ? 45 : 30,
    },
    sheetHandle: {
        width: 50,
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 25,
    },
    sheetTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 30,
    },
    sheetOptions: {
        marginBottom: 24,
    },
    sheetOptionList: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    optionIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
    },
    optionLabelList: {
        flex: 1,
        fontSize: 17,
        fontWeight: '800',
        color: '#334155',
    },
    cancelButton: {
        marginTop: 10,
        backgroundColor: '#F1F5F9',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 17,
        fontWeight: '900',
        color: '#475569',
    },
    backLink: {
        marginTop: 15,
        padding: 10,
    },
    backLinkText: {
        color: '#14b8a6',
        fontWeight: '600',
        fontSize: 16,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    blockedHeader: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
    },
    blockedBack: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    blockedIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    blockedTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'center',
    },
    blockedSub: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    unblockBtnLarge: {
        backgroundColor: '#14B8A6',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#14B8A6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    unblockBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    btnYellow: { backgroundColor: '#FEF3C7' },
    textYellow: { color: '#D97706' },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: '700',
        color: '#64748B',
    },
    coverOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    videoContainer: {
        width: '100%',
        marginBottom: 10,
        overflow: 'hidden',
    },
});

export default UserProfile;
