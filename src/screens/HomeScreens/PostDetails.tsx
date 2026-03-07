import React, { useState, useEffect } from 'react';
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
    StatusBar,
    Modal,
    Pressable,
    Alert,
    Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { get, post } from '../../services/api';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const formatTimeAgo = (date: string | Date) => {
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
    userPhoto?: string;
    comment: string;
    timestamp?: string;
    createdAt?: string;
}

interface PostData {
    _id: string;
    userId: string;
    userName?: string;
    userProfileImage?: string;
    title?: string;
    description?: string;
    postText?: string;
    message?: string;
    image?: string;
    imageUrl?: string;
    postImage?: string;
    pdf?: string;
    likes: any;
    likedBy: string[];
    comments?: Comment[];
    date?: string;
    time?: string;
    createdAt?: string;
}

const ShareSheet = ({
    visible,
    onClose,
    post
}: {
    visible: boolean;
    onClose: () => void;
    post: PostData | null;
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
                        message: `${post.userName || 'Someone'}'s Post: ${post.description || post.postText || ''}\n\nShared via FlyBook`,
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
                Toast.show({ type: 'success', text1: 'Link copied to clipboard!' });
                onClose();
            },
        },
        {
            id: 'save',
            label: 'Save Post',
            icon: 'bookmark-outline',
            color: '#F9A826',
            action: () => {
                Alert.alert('Saved', 'Post added to your bookmarks');
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
                <View style={[styles.bottomSheet, isDark && { backgroundColor: '#0f172a' }]}>
                    <View style={[styles.sheetHandle, isDark && { backgroundColor: '#334155' }]} />
                    <Text style={[styles.sheetTitle, isDark && { color: '#f8fafc' }]}>Share Post</Text>

                    <View style={styles.sheetOptions}>
                        {shareOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[styles.sheetOptionList, isDark && { borderBottomColor: '#1e293b' }]}
                                onPress={option.action}
                            >
                                <View style={[styles.optionIconCircle, { backgroundColor: option.color + '15' }]}>
                                    <Ionicons name={option.icon} size={20} color={option.color} />
                                </View>
                                <Text style={[styles.optionLabelList, isDark && { color: '#cbd5e1' }]}>{option.label}</Text>
                                <Ionicons name="chevron-forward" size={16} color={isDark ? "#475569" : "#DDD"} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={[styles.cancelButton, isDark && { backgroundColor: '#1e293b' }]} onPress={onClose}>
                        <Text style={[styles.cancelButtonText, isDark && { color: '#94a3b8' }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
};

const PostDetails = () => {
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const route = useRoute();
    const navigation = useNavigation();
    const { user } = useAuth();
    const { post: initialPost, postId: passedPostId } = route.params as { post?: PostData; postId?: string };

    const queryClient = useQueryClient();
    const {
        data: postData = initialPost,
        isLoading,
        refetch: refetchFullPost
    } = useQuery<PostData | null>({
        queryKey: ['post-details', initialPost?._id || passedPostId],
        queryFn: async () => {
            const id = initialPost?._id || passedPostId;
            if (!id) return null;
            try {
                // Try home post first
                const response = await get<any>(`/all-home-post/${id}`);
                if (response) return response;
                throw new Error('Not a home post');
            } catch (error) {
                // Fallback for opinions
                const response = await get<any>(`/opinion/posts/${id}`);
                return response?.success ? response.data : (initialPost || null);
            }
        },
        initialData: initialPost || undefined,
        initialDataUpdatedAt: 0,
    });

    if (!postData && isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }, isDark && { backgroundColor: '#0f172a' }]}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [isShareSheetVisible, setShareSheetVisible] = useState(false);

    const handleLike = async () => {
        if (!user || isLiking) return;

        const isLiked = postData.likedBy?.includes(user._id);
        const queryKey = ['post-details', postData._id];
        const previousPostData = queryClient.getQueryData<PostData>(queryKey);

        // Optimistic Update
        queryClient.setQueryData<PostData>(queryKey, (prev) => {
            if (!prev) return prev;
            const newLikedBy = isLiked
                ? (prev.likedBy || []).filter(id => id !== user._id)
                : [...(prev.likedBy || []), user._id];

            return {
                ...prev,
                likes: isLiked ? Math.max(0, (Number(prev.likes) || 0) - 1) : (Number(prev.likes) || 0) + 1,
                likedBy: newLikedBy
            };
        });

        try {
            setIsLiking(true);
            const isOpinion = initialPost.userId ? true : false;
            const endpoint = isOpinion
                ? (isLiked ? '/opinion/unlike' : '/opinion/like')
                : (isLiked ? '/admin-post/unlike' : '/admin-post/like');

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
        if (!commentText.trim() || !user) return;

        try {
            setIsSubmittingComment(true);
            const isOpinion = initialPost.userId ? true : false;
            const endpoint = isOpinion ? '/opinion/comment' : '/admin-post/comment';

            const response = await post<{ success: boolean; comment: Comment }>(
                endpoint,
                { postId: postData._id, comment: commentText.trim() }
            );

            if (response?.success) {
                setCommentText('');
                // Invalidate query to refetch comments
                queryClient.invalidateQueries({ queryKey: ['post-details', postData._id] });
                Toast.show({ type: 'success', text1: 'Comment added' });
            }
        } catch (error) {
            console.error('Comment error:', error);
            Toast.show({ type: 'error', text1: 'Failed to add comment' });
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handlePdfView = (pdfUrl: string) => {
        Linking.openURL(pdfUrl).catch(() => {
            Toast.show({ type: 'error', text1: 'Could not open PDF' });
        });
    };

    const isLiked = user && postData.likedBy?.includes(user._id);
    const displayDescription = postData.description || postData.postText || postData.message;
    const displayImage = postData.image || postData.imageUrl || postData.postImage;

    return (
        <View style={[styles.container, { paddingTop: insets.top }, isDark && { backgroundColor: '#0f172a' }]}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={isDark ? "#0f172a" : "#FFFFFF"}
            />

            {/* Header */}
            <View style={[styles.header, isDark && { borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#111827"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]} numberOfLines={1}>Post Details</Text>
                <TouchableOpacity onPress={() => setShareSheetVisible(true)}>
                    <Ionicons name="share-social-outline" size={24} color={isDark ? "#f8fafc" : "#111827"} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                    {/* User Profile Header (Condition: Show only for Opinion posts) */}
                    {postData.userId ? (
                        <TouchableOpacity
                            style={styles.userSection}
                            onPress={() => {
                                if (postData.userId && postData.userId !== user?._id) {
                                    (navigation as any).navigate('UserProfile', { userId: postData.userId });
                                } else if (postData.userId === user?._id) {
                                    (navigation as any).navigate('Profile');
                                }
                            }}
                        >
                            <Image
                                source={{ uri: postData.userProfileImage || 'https://via.placeholder.com/48' }}
                                style={styles.userImage}
                            />
                            <View style={styles.userInfo}>
                                <Text style={[styles.userName, isDark && { color: '#f8fafc' }]}>{postData.userName || 'FlyBook User'}</Text>
                                <Text style={[styles.postMeta, isDark && { color: '#94a3b8' }]}>
                                    {postData.date || formatTimeAgo(postData.createdAt || '')} {postData.time ? `• ${postData.time}` : ''}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.userSection, { paddingBottom: 10 }]}>
                            <View style={[styles.userInfo, { marginLeft: 0 }]}>
                                <Text style={[styles.postMeta, isDark && { color: '#94a3b8' }]}>
                                    {postData.date || formatTimeAgo(postData.createdAt || '')} {postData.time ? `• ${postData.time}` : ''}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Content */}
                    <View style={styles.contentSection}>
                        {postData.title && <Text style={[styles.postTitle, isDark && { color: '#f8fafc' }]}>{postData.title}</Text>}
                        <Text style={[styles.description, isDark && { color: '#cbd5e1' }]}>{displayDescription}</Text>

                        {postData.pdf && (
                            <TouchableOpacity
                                onPress={() => handlePdfView(postData.pdf!)}
                                style={[styles.pdfCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}
                            >
                                <View style={[styles.pdfIconContainer, isDark && { backgroundColor: '#450a0a' }]}>
                                    <Ionicons name="document-text" size={32} color="#EF4444" />
                                </View>
                                <View style={styles.pdfInfo}>
                                    <Text style={[styles.pdfTitle, isDark && { color: '#f8fafc' }]}>Attached PDF Document</Text>
                                    <Text style={[styles.pdfSubtitle, isDark && { color: '#94a3b8' }]}>Tap to view</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={isDark ? "#475569" : "#9CA3AF"} />
                            </TouchableOpacity>
                        )}

                        {displayImage && (
                            <TouchableOpacity
                                onPress={() => (navigation as any).navigate('FullImageViewer', { imageUrl: displayImage })}
                                activeOpacity={0.9}
                            >
                                <Image
                                    source={{ uri: displayImage }}
                                    style={[styles.postImage, isDark && { backgroundColor: '#1e293b' }]}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Stats */}
                    <View style={[styles.statsRow, isDark && { borderColor: '#1e293b' }]}>
                        <View style={styles.statItem}>
                            <Ionicons name="heart" size={16} color="#EF4444" />
                            <Text style={[styles.statText, isDark && { color: '#94a3b8' }]}>{(typeof postData.likes === 'number' ? postData.likes : (postData.likes?.length || 0))} Likes</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="chatbubble-outline" size={16} color={isDark ? "#94a3b8" : "#6B7280"} />
                            <Text style={[styles.statText, isDark && { color: '#94a3b8' }]}>{postData.comments?.length || 0} Comments</Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={[styles.actionRow, isDark && { borderBottomColor: '#1e293b', borderTopColor: '#1e293b', borderTopWidth: 1 }]}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"}
                                size={22}
                                color={isLiked ? "#EF4444" : (isDark ? "#94a3b8" : "#4B5563")}
                            />
                            <Text style={[styles.actionText, isLiked ? { color: '#EF4444' } : (isDark && { color: '#94a3b8' })]}>Like</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={() => { }}>
                            <Ionicons name="chatbubble-outline" size={22} color={isDark ? "#94a3b8" : "#4B5563"} />
                            <Text style={[styles.actionText, isDark && { color: '#94a3b8' }]}>Comment</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={() => setShareSheetVisible(true)}>
                            <Ionicons name="share-social-outline" size={22} color={isDark ? "#38bdf8" : "#4B5563"} />
                            <Text style={[styles.actionText, isDark && { color: '#38bdf8' }]}>Share</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Comments Section */}
                    <View style={styles.commentsContainer}>
                        <Text style={[styles.commentsHeader, isDark && { color: '#f8fafc' }]}>Comments</Text>

                        {isLoading && !postData.comments ? (
                            <ActivityIndicator size="small" color={isDark ? "#14b8a6" : "#3B82F6"} style={{ marginVertical: 20 }} />
                        ) : postData.comments && postData.comments.length > 0 ? (
                            postData.comments.map((item, index) => (
                                <View key={index} style={styles.commentItem}>
                                    <Image source={{ uri: item.userProfileImage || item.userPhoto || 'https://via.placeholder.com/36' }} style={styles.commentUserImage} />
                                    <View style={styles.commentContent}>
                                        <View style={[styles.commentBubble, isDark && { backgroundColor: '#1e293b' }]}>
                                            <Text style={[styles.commentUserName, isDark && { color: '#f1f5f9' }]}>{item.userName}</Text>
                                            <Text style={[styles.commentText, isDark && { color: '#cbd5e1' }]}>{item.comment}</Text>
                                        </View>
                                        <Text style={[styles.commentTime, isDark && { color: '#64748b' }]}>
                                            {formatTimeAgo(item.timestamp || item.createdAt || '')}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.noComments}>
                                <Ionicons name="chatbubbles-outline" size={40} color={isDark ? "#334155" : "#D1D5DB"} />
                                <Text style={[styles.noCommentsText, isDark && { color: '#64748b' }]}>No comments yet. Be the first to join!</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Comment Input */}
                <View style={[styles.inputContainer, isDark && { backgroundColor: '#0f172a', borderTopColor: '#1e293b' }]}>
                    <Image
                        source={{ uri: user?.profileImage || 'https://via.placeholder.com/36' }}
                        style={styles.inputUserImage}
                    />
                    <View style={[styles.textInputWrapper, isDark && { backgroundColor: '#1e293b' }]}>
                        <TextInput
                            style={[styles.textInput, isDark && { color: '#f8fafc' }]}
                            placeholder="Write a comment..."
                            placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
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
                                <ActivityIndicator size="small" color="#3B82F6" />
                            ) : (
                                <Ionicons
                                    name="send"
                                    size={20}
                                    color={commentText.trim() ? (isDark ? "#38bdf8" : "#3B82F6") : (isDark ? "#334155" : "#D1D5DB")}
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    scrollView: {
        flex: 1,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    userImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    userInfo: {
        flex: 1,
    },
    postMeta: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    contentSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    postTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#374151',
        marginBottom: 16,
    },
    postImage: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    pdfCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
    },
    pdfIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    pdfInfo: {
        flex: 1,
    },
    pdfTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    pdfSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    statText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 4,
    },
    actionRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginLeft: 8,
    },
    commentsContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    commentsHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 20,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    commentUserImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
    },
    commentContent: {
        flex: 1,
    },
    commentBubble: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 16,
        borderTopLeftRadius: 0,
    },
    commentUserName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    commentText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    commentTime: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 4,
        marginLeft: 4,
    },
    noComments: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noCommentsText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },
    inputUserImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    textInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 15,
        minHeight: 40,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        paddingVertical: 8,
    },
    sendButton: {
        marginLeft: 10,
        padding: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingTop: 12,
    },
    sheetHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A2E',
        marginBottom: 20,
        textAlign: 'center',
    },
    sheetOptions: {
        marginBottom: 16,
    },
    sheetOptionList: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    optionIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionLabelList: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A2E',
        fontWeight: '500',
    },
    cancelButton: {
        marginTop: 8,
        backgroundColor: '#F3F4F6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FF6584',
    },
});

export default PostDetails;
