import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    Linking,
    Share,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { get, post } from '../../services/api';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-clipboard/clipboard';
import TobNav from '../../components/TobNav';

const { width } = Dimensions.get('window');

interface Post {
    _id: string;
    userId: string;
    userName: string;
    userProfileImage: string;
    description: string;
    image?: string;
    pdf?: string;
    likes: number;
    likedBy: string[];
    comments?: any[];
    date: string;
    time: string;
}

const fetchOpinionPosts = async (): Promise<Post[]> => {
    try {
        const response = await get<{ success: boolean; data: Post[] }>('/opinion/posts');
        return Array.isArray(response?.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
};

const OpinionHome = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const { user } = useAuth();
    const [likingPosts, setLikingPosts] = useState<{ [key: string]: boolean }>({});
    const [refreshing, setRefreshing] = useState(false);

    const { data: posts = [], isLoading, refetch } = useQuery<Post[]>({
        queryKey: ['opinion-posts'],
        queryFn: fetchOpinionPosts,
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
    });

    // Handle post like
    const handlePostLike = async (postId: string) => {
        if (!user) {
            return;
        }

        try {
            setLikingPosts((prev) => ({ ...prev, [postId]: true }));

            const response = await post<{ success: boolean; message?: string }>(
                '/opinion/like',
                { postId }
            );

            if (response?.success) {
                refetch();
            }
        } catch (error: any) {
            console.error('Error liking post:', error);
        } finally {
            setLikingPosts((prev) => ({ ...prev, [postId]: false }));
        }
    };

    // Handle post unlike
    const handleUnlike = async (postId: string) => {
        try {
            setLikingPosts((prev) => ({ ...prev, [postId]: true }));

            const response = await post<{ success: boolean; message?: string }>(
                '/opinion/unlike',
                { postId }
            );

            if (response?.success) {
                refetch();
            }
        } catch (error: any) {
            console.error('Error unliking post:', error);
        } finally {
            setLikingPosts((prev) => ({ ...prev, [postId]: false }));
        }
    };

    // Handle share
    const handleShare = async (postId: string) => {
        try {
            const postUrl = `https://yourapp.com/opinion-post/${postId}`;
            await Share.share({
                message: postUrl,
            });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    };

    // Handle copy link
    const handleCopyLink = async (postId: string) => {
        const postUrl = `https://yourapp.com/opinion-post/${postId}`;
        Clipboard.setString(postUrl);
        Toast.show({
            type: 'success',
            text1: 'Post link copied!',
        });
    };

    // Truncate text
    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };

    // Format time
    const formatTime = (time: string) => {
        return time.slice(0, -6) + time.slice(-3);
    };

    // Handle PDF view
    const handlePdfView = (pdfUrl: string) => {
        Linking.openURL(pdfUrl).catch((err) => {
            Toast.show({
                type: 'error',
                text1: 'Failed to open PDF',
            });
        });
    };

    // Handle refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    // Navigate to profile
    const navigateToProfile = (userId: string) => {
        if (user?._id === userId) {
            navigation.navigate('MyProfile');
        } else {
            navigation.navigate('Profile', { userId });
        }
    };

    // Navigate to post detail
    const navigateToPostDetail = (post: Post) => {
        navigation.navigate('OpinionDetails', { post });
    };

    // Loading state
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading posts...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TobNav navigation={navigation} />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Create Post Section - Facebook Style */}
                <View style={styles.createPostSection}>
                    <TouchableOpacity
                        style={styles.createPostCard}
                        onPress={() => navigation.navigate('CreateOpinion')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.createPostContent}>
                            {/* User Profile Image */}
                            <Image
                                source={{
                                    uri: user?.profileImage || 'https://via.placeholder.com/50',
                                }}
                                style={styles.createPostUserImage}
                            />

                            {/* Input Placeholder */}
                            <View style={styles.createPostInputContainer}>
                                <Text style={styles.createPostPlaceholder}>
                                    Share your opinion...
                                </Text>
                            </View>

                            {/* Image Icon */}
                            <TouchableOpacity
                                style={styles.createPostImageButton}
                                onPress={() => navigation.navigate('CreateOpinion')}
                            >
                                <Ionicons name="image-outline" size={24} color="#65676B" />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>

                    {/* Action Buttons Row */}
                    <View style={styles.createPostActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('CreateOpinion')}
                        >
                            <Ionicons name="videocam" size={22} color="#F02849" />
                            <Text style={styles.actionButtonText}>Video</Text>
                        </TouchableOpacity>

                        <View style={styles.actionDivider} />

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('CreateOpinion')}
                        >
                            <Ionicons name="images" size={22} color="#45BD62" />
                            <Text style={styles.actionButtonText}>Photo</Text>
                        </TouchableOpacity>

                        <View style={styles.actionDivider} />

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('CreateOpinion')}
                        >
                            <Ionicons name="document-text" size={22} color="#F7B928" />
                            <Text style={styles.actionButtonText}>PDF</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.postsContainer}>
                    {posts
                        .slice()
                        .reverse()
                        .map((post) => (
                            <View key={post._id} style={styles.postCard}>
                                {/* User Info Header */}
                                <TouchableOpacity
                                    onPress={() => navigateToProfile(post.userId)}
                                    style={styles.userHeader}
                                >
                                    <Image
                                        source={{ uri: post.userProfileImage }}
                                        style={styles.userImage}
                                    />
                                    <View style={styles.userInfo}>
                                        <Text style={styles.userName}>{post.userName}</Text>
                                        <Text style={styles.postTime}>
                                            {post.date} at {formatTime(post.time)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Post Description */}
                                <TouchableOpacity
                                    style={styles.descriptionContainer}
                                    onPress={() => navigateToPostDetail(post)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.description}>
                                        {truncateText(post.description, 180)}
                                    </Text>

                                    {/* Read More Button */}
                                    {post.description.length > 180 && (
                                        <TouchableOpacity
                                            onPress={() => navigateToPostDetail(post)}
                                            style={styles.readMoreButton}
                                        >
                                            <Text style={styles.readMoreText}>Read More</Text>
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>

                                {/* PDF Attachment */}
                                {post.pdf && (
                                    <TouchableOpacity
                                        onPress={() => handlePdfView(post.pdf!)}
                                        style={styles.pdfContainer}
                                    >
                                        <Ionicons name="document-text" size={24} color="#DC2626" />
                                        <Text style={styles.pdfText}>View PDF</Text>
                                    </TouchableOpacity>
                                )}

                                {/* Post Image */}
                                {post.image && (
                                    <View style={styles.imageContainer}>
                                        <Image
                                            source={{ uri: post.image }}
                                            style={styles.postImage}
                                            resizeMode="cover"
                                        />
                                    </View>
                                )}

                                {/* Action Buttons */}
                                <View style={styles.actionsContainer}>
                                    {/* Like Button */}
                                    <View style={styles.likeContainer}>
                                        {likingPosts[post._id] ? (
                                            <ActivityIndicator size="small" color="#EF4444" />
                                        ) : user && post.likedBy?.includes(user._id) ? (
                                            <TouchableOpacity
                                                onPress={() => handleUnlike(post._id)}
                                                style={styles.likeButton}
                                            >
                                                <Ionicons name="heart" size={28} color="#EF4444" />
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => handlePostLike(post._id)}
                                                style={styles.likeButton}
                                            >
                                                <Ionicons name="heart-outline" size={28} color="#000" />
                                            </TouchableOpacity>
                                        )}
                                        <Text style={styles.likesText}>{post.likes} Likes</Text>
                                    </View>

                                    {/* Comment Count */}
                                    <TouchableOpacity
                                        style={styles.commentIconContainer}
                                        onPress={() => navigateToPostDetail(post)}
                                    >
                                        <Ionicons name="chatbubble-outline" size={24} color="#000" />
                                        <Text style={styles.commentCountText}>{post.comments?.length || 0} Comments</Text>
                                    </TouchableOpacity>

                                    {/* Share Button */}
                                    <TouchableOpacity
                                        onPress={() => handleShare(post._id)}
                                        style={styles.shareButton}
                                    >
                                        <Ionicons name="share-social-outline" size={24} color="#000" />
                                        <Text style={styles.shareText}>Share</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Comments Preview Section */}
                                {post.comments && post.comments.length > 0 && (
                                    <TouchableOpacity
                                        style={styles.commentsPreview}
                                        onPress={() => navigateToPostDetail(post)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.commentDivider} />
                                        <View style={styles.recentCommentsContainer}>
                                            {post.comments.slice(0, 2).map((comment: any, idx) => (
                                                <View key={idx} style={styles.miniCommentRow}>
                                                    <Image
                                                        source={{ uri: comment.userProfileImage || 'https://via.placeholder.com/24' }}
                                                        style={styles.miniCommentUserImage}
                                                    />
                                                    <Text style={styles.miniCommentText} numberOfLines={1}>
                                                        <Text style={styles.miniCommentUserName}>{comment.userName}: </Text>
                                                        {comment.comment}
                                                    </Text>
                                                </View>
                                            ))}
                                            {post.comments.length > 2 && (
                                                <Text style={styles.viewMoreCommentsLink}>
                                                    View {post.comments.length - 2} more comments...
                                                </Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                </View>

                {/* Empty State */}
                {posts.length === 0 && !isLoading && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={80} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No posts yet</Text>
                        <Text style={styles.emptySubtext}>Be the first to share your opinion!</Text>
                    </View>
                )}

                <View style={styles.bottomSpacing} />
            </ScrollView>

            <Toast />
        </View>
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
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    scrollView: {
        flex: 1,
    },
    // Create Post Section Styles
    createPostSection: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 12,
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    createPostCard: {
        padding: 12,
    },
    createPostContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    createPostUserImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
    },
    createPostInputContainer: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        justifyContent: 'center',
    },
    createPostPlaceholder: {
        fontSize: 15,
        color: '#65676B',
    },
    createPostImageButton: {
        padding: 8,
    },
    createPostActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#65676B',
        marginLeft: 6,
    },
    actionDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#E5E7EB',
    },
    postsContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    postCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    userImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    postTime: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    descriptionContainer: {
        padding: 16,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        color: '#374151',
    },
    readMoreButton: {
        marginTop: 8,
    },
    readMoreText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
    pdfContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
    },
    pdfText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '500',
    },
    imageContainer: {
        width: '100%',
        backgroundColor: '#F3F4F6',
    },
    postImage: {
        width: '100%',
        height: 300,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    likeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    likeButton: {
        marginRight: 8,
    },
    likesText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    shareText: {
        marginLeft: 6,
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
    },
    bottomSpacing: {
        height: 20,
    },
    commentIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    commentCountText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    commentsPreview: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    commentDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 12,
    },
    recentCommentsContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 10,
    },
    miniCommentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    miniCommentUserImage: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    miniCommentText: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
    },
    miniCommentUserName: {
        fontWeight: '700',
        color: '#111827',
    },
    viewMoreCommentsLink: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '600',
        marginTop: 4,
    },
});

export default OpinionHome;