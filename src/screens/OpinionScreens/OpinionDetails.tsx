import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Share,
    Linking,
    Modal,
    Pressable,
    Alert,
    StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { get, post } from '../../services/api';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import VideoPlayer from '../../components/VideoPlayer';

const { width } = Dimensions.get('window');

const formatTimeAgo = (date: string | Date | undefined) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return then.toLocaleDateString();
};

interface Comment {
    userId: string;
    userName: string;
    userProfileImage?: string;
    comment: string;
    timestamp?: string;
    createdAt?: string;
}

interface Post {
    _id: string;
    userId: string;
    userName?: string;
    userProfileImage?: string;
    description?: string;
    postText?: string;
    image?: string;
    imageUrl?: string;
    video?: string;
    pdf?: string;
    likes: number;
    likedBy: string[];
    comments?: Comment[];
    date?: string;
    time?: string;
    createdAt?: string;
}

const ShareSheet = ({
    visible,
    onClose,
    post: postItem
}: {
    visible: boolean;
    onClose: () => void;
    post: Post | null;
}) => {
    const { isDark } = useTheme();
    if (!postItem) return null;

    const shareOptions = [
        {
            id: 'share_native',
            label: 'Share via...',
            icon: 'share-social',
            color: '#6366f1',
            action: async () => {
                try {
                    await Share.share({
                        message: `${postItem.userName || 'Someone'}'s Opinion: ${postItem.description || postItem.postText || ''}\n\nShared via FlyBook`,
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
            icon: 'copy',
            color: '#06b6d4',
            action: () => {
                Alert.alert('Success', 'Link copied to clipboard!');
                onClose();
            },
        },
        {
            id: 'save',
            label: 'Save Post',
            icon: 'bookmark',
            color: '#f59e0b',
            action: () => {
                Alert.alert('Saved', 'Post added to your bookmarks');
                onClose();
            },
        },
        {
            id: 'report',
            label: 'Report',
            icon: 'flag',
            color: '#ef4444',
            action: () => {
                Alert.alert('Reported', 'Thank you for reporting this post.');
                onClose();
            },
        },
    ];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
                                <Text style={[styles.optionLabelList, isDark && { color: '#cbd5e1' }]}>{option.label}</Text>
                                <Ionicons name="chevron-forward" size={16} color={isDark ? '#475569' : '#DDD'} />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity
                        style={[styles.cancelButton, isDark && { backgroundColor: '#334155' }]}
                        onPress={onClose}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
};

const OpinionDetails = () => {
    const insets = useSafeAreaInsets();
    const route = useRoute();
    const navigation = useNavigation();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const { post: initialPost, postId: passedPostId } = route.params as { post?: Post, postId?: string };

    const queryClient = useQueryClient();
    const {
        data: postData = initialPost || null,
        isLoading,
    } = useQuery<Post | null>({
        queryKey: ['opinion-details', (initialPost?._id || passedPostId)],
        queryFn: async () => {
            const id = initialPost?._id || passedPostId;
            if (!id) return null;
            const response = await get<{ success: boolean; data: Post }>(`/opinion/posts/${id}`);
            return response?.success ? response.data : (initialPost || null);
        },
        initialData: initialPost || undefined,
        initialDataUpdatedAt: 0, // Forces an immediate fetch to grab the missing video
        enabled: !!(initialPost?._id || passedPostId),
    });

    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [isShareSheetVisible, setShareSheetVisible] = useState(false);

    const handleLike = async () => {
        if (!user || isLiking || !postData) return;

        const isLiked = postData.likedBy?.includes(user._id);
        const queryKey = ['opinion-details', postData._id];
        const previousPostData = queryClient.getQueryData<Post>(queryKey);

        queryClient.setQueryData<Post | null>(queryKey, (prev) => {
            if (!prev) return prev;
            const newLikedBy = isLiked
                ? (prev.likedBy || []).filter(id => id !== user._id)
                : [...(prev.likedBy || []), user._id];
            return { ...prev, likes: isLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1, likedBy: newLikedBy };
        });

        try {
            setIsLiking(true);
            const endpoint = isLiked ? '/opinion/unlike' : '/opinion/like';
            const response = await post<{ success: boolean }>(endpoint, { postId: postData._id });
            if (!response?.success) {
                queryClient.setQueryData(queryKey, previousPostData);
                Toast.show({ type: 'error', text1: 'Action failed' });
            }
        } catch (error) {
            console.error('Like error:', error);
            queryClient.setQueryData(queryKey, previousPostData);
        } finally {
            setIsLiking(false);
        }
    };

    const handleComment = async () => {
        if (!commentText.trim() || !user || !postData) return;
        try {
            setIsSubmittingComment(true);
            const response = await post<{ success: boolean; comment: Comment }>(
                '/opinion/comment',
                { postId: postData._id, comment: commentText.trim() }
            );
            if (response?.success) {
                setCommentText('');
                queryClient.invalidateQueries({ queryKey: ['opinion-details', postData._id] });
                Toast.show({ type: 'success', text1: 'Comment added' });
            }
        } catch (error) {
            console.error('Comment error:', error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handlePdfView = (pdfUrl: string) => {
        Linking.openURL(pdfUrl).catch(() => {
            Toast.show({ type: 'error', text1: 'Could not open PDF' });
        });
    };

    const isLiked = user && postData?.likedBy?.includes(user._id);

    return (
        <View style={[styles.container, { paddingTop: insets.top }, isDark && { backgroundColor: '#0f172a' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={[styles.header, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <View style={[styles.navIconCircle, isDark && { backgroundColor: '#1e293b' }]}>
                        <Ionicons name="arrow-back" size={20} color={isDark ? "#f8fafc" : "#0f172a"} />
                    </View>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]} numberOfLines={1}>Opinion</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => setShareSheetVisible(true)}>
                    <View style={[styles.navIconCircle, isDark && { backgroundColor: '#1e293b' }]}>
                        <Ionicons name="share-social-outline" size={20} color={isDark ? "#f8fafc" : "#0f172a"} />
                    </View>
                </TouchableOpacity>
            </View>

            {isLoading && !postData ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#0D9488"} />
                </View>
            ) : !postData ? (
                <View style={styles.loaderContainer}>
                    <View style={[styles.emptyIconCircle, isDark && { backgroundColor: '#1e293b' }]}>
                        <Ionicons name="alert-circle-outline" size={48} color={isDark ? "#334155" : "#D1D5DB"} />
                    </View>
                    <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>Opinion not found</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackBtn}>
                        <LinearGradient colors={['#0D9488', '#0f766e']} style={styles.goBackBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={styles.goBackBtnText}>Go Back</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            ) : (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
                    style={{ flex: 1 }}
                >
                    <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>

                        {/* Author Card */}
                        <TouchableOpacity
                            style={[styles.authorCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}
                            onPress={() => {
                                if (postData.userId && postData.userId !== user?._id) {
                                    (navigation as any).push('UserProfile', { userId: postData.userId });
                                } else if (postData.userId === user?._id) {
                                    (navigation as any).navigate('Home', { screen: 'Profile' });
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            <Image
                                source={{ uri: postData.userProfileImage || 'https://via.placeholder.com/48' }}
                                style={styles.userImage}
                            />
                            <View style={styles.userInfo}>
                                <Text style={[styles.userName, isDark && { color: '#f8fafc' }]}>
                                    {postData.userName || 'FlyBook User'}
                                </Text>
                                <View style={styles.metaRow}>
                                    <Ionicons name="globe-outline" size={12} color="#94a3b8" style={{ marginRight: 4 }} />
                                    <Text style={styles.postMeta}>
                                        {postData.date || formatTimeAgo(postData.createdAt)}
                                        {postData.time ? ` • ${postData.time}` : ''}
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.followBadge, isDark && { backgroundColor: '#0f172a' }]}>
                                <Ionicons name="person-add-outline" size={14} color={isDark ? "#14b8a6" : "#0D9488"} />
                            </View>
                        </TouchableOpacity>

                        {/* Content Section */}
                        <View style={[styles.contentCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                            <Text style={[styles.description, isDark && { color: '#cbd5e1' }]}>
                                {postData.description || postData.postText}
                            </Text>

                            {postData.pdf && (
                                <TouchableOpacity
                                    onPress={() => handlePdfView(postData.pdf!)}
                                    style={[styles.pdfCard, isDark && { backgroundColor: '#0f172a', borderColor: '#334155' }]}
                                >
                                    <View style={[styles.pdfIconContainer, isDark && { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                                        <Ionicons name="document-text" size={28} color="#EF4444" />
                                    </View>
                                    <View style={styles.pdfInfo}>
                                        <Text style={[styles.pdfTitle, isDark && { color: '#f8fafc' }]}>Attached PDF Document</Text>
                                        <Text style={styles.pdfSubtitle}>Tap to view</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={isDark ? "#475569" : "#9CA3AF"} />
                                </TouchableOpacity>
                            )}

                            {(postData.image || postData.imageUrl) && (
                                <TouchableOpacity
                                    onPress={() => (navigation as any).navigate('FullImageViewer', { imageUrl: postData.image || postData.imageUrl })}
                                    activeOpacity={0.9}
                                    style={styles.imageContainer}
                                >
                                    <Image
                                        source={{ uri: postData.image || postData.imageUrl }}
                                        style={styles.postImage}
                                        resizeMode="cover"
                                    />
                                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.08)']} style={StyleSheet.absoluteFill} />
                                </TouchableOpacity>
                            )}

                            {/* ── Video Player ── */}
                            {postData.video && (
                                <View style={[styles.videoSection, isDark && { backgroundColor: '#0f172a', borderColor: '#1e293b' }]}>
                                    {/* Header badge */}
                                    <View style={styles.videoHeader}>
                                        <LinearGradient colors={['#f43f5e', '#e11d48']} style={styles.videoBadgeDot} />
                                        <Text style={[styles.videoBadgeText, { color: isDark ? '#f87171' : '#e11d48' }]}>VIDEO</Text>
                                        <View style={styles.videoHeaderSpacer} />
                                        <View style={[styles.hdBadge, { backgroundColor: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(225,29,72,0.1)' }]}>
                                            <Text style={[styles.hdText, { color: isDark ? '#f87171' : '#e11d48' }]}>HD</Text>
                                        </View>
                                    </View>

                                    {/* Player */}
                                    <View style={styles.videoPlayerWrap}>
                                        <VideoPlayer
                                            uri={postData.video}
                                            height={340}
                                            borderRadius={16}
                                            autoPlay={false}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>


                        {/* Stats Row */}
                        <View style={[styles.statsCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                            <View style={styles.statItem}>
                                <LinearGradient colors={['#ef4444', '#f87171']} style={styles.statIconCircle}>
                                    <Ionicons name="heart" size={12} color="#fff" />
                                </LinearGradient>
                                <Text style={[styles.statText, isDark && { color: '#94a3b8' }]}>
                                    {postData.likes || 0} Likes
                                </Text>
                            </View>
                            <View style={[styles.statDot, isDark && { backgroundColor: '#334155' }]} />
                            <View style={styles.statItem}>
                                <LinearGradient colors={['#3b82f6', '#6366f1']} style={styles.statIconCircle}>
                                    <Ionicons name="chatbubble" size={10} color="#fff" />
                                </LinearGradient>
                                <Text style={[styles.statText, isDark && { color: '#94a3b8' }]}>
                                    {postData.comments?.length || 0} Comments
                                </Text>
                            </View>
                        </View>

                        {/* Actions Row */}
                        <View style={[styles.actionRow, isDark && { backgroundColor: '#1e293b', borderTopColor: '#334155', borderBottomColor: '#334155' }]}>
                            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                                <Ionicons
                                    name={isLiked ? "heart" : "heart-outline"}
                                    size={22}
                                    color={isLiked ? "#EF4444" : (isDark ? "#94a3b8" : "#4B5563")}
                                />
                                <Text style={[styles.actionText, isLiked && { color: '#EF4444' }, isDark && !isLiked && { color: '#94a3b8' }]}>Like</Text>
                            </TouchableOpacity>

                            <View style={[styles.actionDivider, isDark && { backgroundColor: '#334155' }]} />

                            <TouchableOpacity style={styles.actionButton} onPress={() => { }}>
                                <Ionicons name="chatbubble-outline" size={20} color={isDark ? "#94a3b8" : "#4B5563"} />
                                <Text style={[styles.actionText, isDark && { color: '#94a3b8' }]}>Comment</Text>
                            </TouchableOpacity>

                            <View style={[styles.actionDivider, isDark && { backgroundColor: '#334155' }]} />

                            <TouchableOpacity style={styles.actionButton} onPress={() => setShareSheetVisible(true)}>
                                <Ionicons name="share-social-outline" size={20} color={isDark ? "#94a3b8" : "#4B5563"} />
                                <Text style={[styles.actionText, isDark && { color: '#94a3b8' }]}>Share</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Comments Section */}
                        <View style={styles.commentsContainer}>
                            <View style={styles.commentsHeaderRow}>
                                <Text style={[styles.commentsHeader, isDark && { color: '#f8fafc' }]}>Comments</Text>
                                <View style={[styles.commentCountBadge, isDark && { backgroundColor: '#334155' }]}>
                                    <Text style={[styles.commentCountText, isDark && { color: '#94a3b8' }]}>
                                        {postData.comments?.length || 0}
                                    </Text>
                                </View>
                            </View>

                            {postData.comments && postData.comments.length > 0 ? (
                                postData.comments.map((item, index) => (
                                    <View key={index} style={styles.commentItem}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (item.userId && item.userId !== user?._id) {
                                                    (navigation as any).push('UserProfile', { userId: item.userId });
                                                } else if (item.userId === user?._id) {
                                                    (navigation as any).navigate('Home', { screen: 'Profile' });
                                                }
                                            }}
                                        >
                                            <Image
                                                source={{ uri: item.userProfileImage || 'https://via.placeholder.com/36' }}
                                                style={styles.commentUserImage}
                                            />
                                        </TouchableOpacity>
                                        <View style={styles.commentContent}>
                                            <View style={[styles.commentBubble, isDark && { backgroundColor: '#1e293b' }]}>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (item.userId && item.userId !== user?._id) {
                                                            (navigation as any).push('UserProfile', { userId: item.userId });
                                                        } else if (item.userId === user?._id) {
                                                            (navigation as any).navigate('Home', { screen: 'Profile' });
                                                        }
                                                    }}
                                                >
                                                    <Text style={[styles.commentUserName, isDark && { color: '#f8fafc' }]}>
                                                        {item.userName}
                                                    </Text>
                                                </TouchableOpacity>
                                                <Text style={[styles.commentText, isDark && { color: '#cbd5e1' }]}>
                                                    {item.comment}
                                                </Text>
                                            </View>
                                            <Text style={[styles.commentTime, isDark && { color: '#475569' }]}>
                                                {formatTimeAgo(item.timestamp || item.createdAt)}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.noComments}>
                                    <View style={[styles.noCommentsIconCircle, isDark && { backgroundColor: '#1e293b' }]}>
                                        <Ionicons name="chatbubbles-outline" size={36} color={isDark ? "#334155" : "#D1D5DB"} />
                                    </View>
                                    <Text style={[styles.noCommentsText, isDark && { color: '#64748b' }]}>
                                        No comments yet. Be the first to reply!
                                    </Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Comment Input */}
                    <View style={[styles.inputContainer, isDark && { backgroundColor: '#0f172a', borderTopColor: '#1e293b' }]}>
                        <Image
                            source={{ uri: user?.profileImage || 'https://via.placeholder.com/40' }}
                            style={styles.inputUserImage}
                        />
                        <View style={[styles.textInputWrapper, isDark && { backgroundColor: '#1e293b' }]}>
                            <TextInput
                                style={[styles.textInput, isDark && { color: '#f8fafc' }]}
                                placeholder="Write a comment..."
                                placeholderTextColor={isDark ? "#475569" : "#9CA3AF"}
                                value={commentText}
                                onChangeText={setCommentText}
                                multiline
                            />
                            <TouchableOpacity
                                onPress={handleComment}
                                disabled={!commentText.trim() || isSubmittingComment}
                                style={styles.sendButton}
                            >
                                {isSubmittingComment ? (
                                    <ActivityIndicator size="small" color={isDark ? "#14b8a6" : "#0D9488"} />
                                ) : (
                                    <LinearGradient
                                        colors={commentText.trim() ? ['#0D9488', '#0f766e'] : (isDark ? ['#1e293b', '#1e293b'] : ['#e2e8f0', '#e2e8f0'])}
                                        style={styles.sendGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Ionicons
                                            name="send"
                                            size={16}
                                            color={commentText.trim() ? "#fff" : (isDark ? "#334155" : "#94a3b8")}
                                        />
                                    </LinearGradient>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            )}

            <ShareSheet
                visible={isShareSheetVisible}
                onClose={() => setShareSheetVisible(false)}
                post={postData}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f5f9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#f1f5f9',
    },
    backButton: {
        padding: 2,
    },
    navIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    goBackBtn: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    goBackBtnGrad: {
        paddingVertical: 14,
        paddingHorizontal: 36,
        borderRadius: 20,
    },
    goBackBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 15,
    },
    scrollView: {
        flex: 1,
    },
    authorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
        marginTop: 14,
        marginBottom: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },
    userImage: {
        width: 52,
        height: 52,
        borderRadius: 26,
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#f1f5f9',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 17,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
    },
    postMeta: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
    },
    followBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentCard: {
        marginHorizontal: 12,
        marginBottom: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },
    description: {
        fontSize: 16,
        lineHeight: 26,
        color: '#334155',
        fontWeight: '500',
        marginBottom: 16,
    },
    imageContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 4,
    },
    postImage: {
        width: '100%',
        height: 320,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
    },
    pdfCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 16,
        gap: 12,
    },
    pdfIconContainer: {
        width: 50,
        height: 50,
        backgroundColor: '#FEE2E2',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pdfInfo: {
        flex: 1,
    },
    pdfTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
    },
    pdfSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
        marginTop: 2,
    },
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
        marginBottom: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statIconCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#64748b',
    },
    statDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 16,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
        marginBottom: 10,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderTopWidth: 0,
        borderBottomWidth: 0,
        paddingVertical: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    actionDivider: {
        width: 1,
        height: 22,
        backgroundColor: '#f1f5f9',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#475569',
    },
    commentsContainer: {
        paddingHorizontal: 12,
        paddingBottom: 100,
    },
    commentsHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    commentsHeader: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    commentCountBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
    },
    commentCountText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748b',
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 10,
    },
    commentUserImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
    },
    commentContent: {
        flex: 1,
    },
    commentBubble: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 20,
        borderTopLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    commentUserName: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 4,
    },
    commentText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 20,
        fontWeight: '500',
    },
    commentTime: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '600',
    },
    noComments: {
        alignItems: 'center',
        paddingVertical: 50,
        gap: 14,
    },
    noCommentsIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    noCommentsText: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '600',
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: '#f1f5f9',
        paddingBottom: Platform.OS === 'ios' ? 30 : 12,
        gap: 10,
    },
    inputUserImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    textInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingHorizontal: 16,
        minHeight: 46,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: '#0f172a',
        paddingVertical: 10,
        fontWeight: '500',
    },
    sendButton: {
        marginLeft: 8,
    },
    sendGradient: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingTop: 12,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#f1f5f9',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 24,
    },
    sheetTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 24,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    sheetOptions: {
        marginBottom: 20,
    },
    sheetOptionList: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    optionIconCircle: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionLabelList: {
        flex: 1,
        fontSize: 16,
        color: '#334155',
        fontWeight: '800',
    },
    cancelButton: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 16,
        borderRadius: 20,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#ef4444',
    },
    // ── Video styles ─────────────────────────────────────────────────────────
    videoSection: {
        marginTop: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
    },
    videoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    videoBadgeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    videoBadgeText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.2,
    },
    videoHeaderSpacer: { flex: 1 },
    hdBadge: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
    },
    hdText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    videoPlayerWrap: {
        overflow: 'hidden',
        borderRadius: 16,
        marginHorizontal: 10,
        marginBottom: 12,
        height: 340, // Ensures ScrollView layout measures correctly
    },
});

export default OpinionDetails;