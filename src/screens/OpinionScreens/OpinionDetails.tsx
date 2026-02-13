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
    Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { get, post } from '../../services/api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

// Helper for relative time (since moment is not installed)
const formatTimeAgo = (date: string | Date) => {
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
    userProfileImage: string;
    comment: string;
    timestamp: string;
}

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
    comments?: Comment[];
    date: string;
    time: string;
}

const OpinionDetails = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { user } = useAuth();
    const { post: initialPost } = route.params as { post: Post };

    const [postData, setPostData] = useState<Post>(initialPost);
    const [isLoading, setIsLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isLiking, setIsLiking] = useState(false);

    useEffect(() => {
        fetchFullPost();
    }, []);

    const fetchFullPost = async () => {
        try {
            setIsLoading(true);
            const response = await get<{ success: boolean; data: Post }>(`/opinion/posts/${initialPost._id}`);
            if (response?.success) {
                setPostData(response.data);
            }
        } catch (error) {
            console.error('Error fetching post details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async () => {
        if (!user) {
            return;
        }

        try {
            setIsLiking(true);
            const isLiked = postData.likedBy?.includes(user._id);
            const endpoint = isLiked ? '/opinion/unlike' : '/opinion/like';

            const response = await post<{ success: boolean }>(endpoint, { postId: postData._id });

            if (response?.success) {
                // Optimistic update or refetch
                fetchFullPost();
            }
        } catch (error) {
            console.error('Like error:', error);
        } finally {
            setIsLiking(false);
        }
    };

    const handleComment = async () => {
        if (!commentText.trim()) return;
        if (!user) {
            return;
        }

        try {
            setIsSubmittingComment(true);
            const response = await post<{ success: boolean; comment: Comment }>(
                '/opinion/comment',
                { postId: postData._id, comment: commentText.trim() }
            );

            if (response?.success) {
                setCommentText('');
                fetchFullPost();
            }
        } catch (error) {
            console.error('Comment error:', error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `${postData.userName}'s Opinion: ${postData.description}\n\nRead more on FlyBook!`,
            });
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    const handlePdfView = (pdfUrl: string) => {
        Linking.openURL(pdfUrl).catch(() => {
            Toast.show({ type: 'error', text1: 'Could not open PDF' });
        });
    };

    const isLiked = user && postData.likedBy?.includes(user._id);

    return (
        <View style={styles.container}>
            {/* Header */}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                    {/* User Info */}
                    <View style={styles.userSection}>
                        <Image source={{ uri: postData.userProfileImage }} style={styles.userImage} />
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{postData.userName}</Text>
                            <Text style={styles.postMeta}>
                                {postData.date} • {postData.time}
                            </Text>
                        </View>
                    </View>

                    {/* Content */}
                    <View style={styles.contentSection}>
                        <Text style={styles.description}>{postData.description}</Text>

                        {postData.pdf && (
                            <TouchableOpacity
                                onPress={() => handlePdfView(postData.pdf!)}
                                style={styles.pdfCard}
                            >
                                <View style={styles.pdfIconContainer}>
                                    <Ionicons name="document-text" size={32} color="#EF4444" />
                                </View>
                                <View style={styles.pdfInfo}>
                                    <Text style={styles.pdfTitle}>Attached PDF Document</Text>
                                    <Text style={styles.pdfSubtitle}>Tap to view</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}

                        {postData.image && (
                            <Image
                                source={{ uri: postData.image }}
                                style={styles.postImage}
                                resizeMode="contain"
                            />
                        )}
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Ionicons name="heart" size={16} color="#EF4444" />
                            <Text style={styles.statText}>{postData.likes || 0} Likes</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
                            <Text style={styles.statText}>{postData.comments?.length || 0} Comments</Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"}
                                size={22}
                                color={isLiked ? "#EF4444" : "#4B5563"}
                            />
                            <Text style={[styles.actionText, isLiked && { color: '#EF4444' }]}>Like</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={() => { }}>
                            <Ionicons name="chatbubble-outline" size={22} color="#4B5563" />
                            <Text style={styles.actionText}>Comment</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                            <Ionicons name="share-social-outline" size={22} color="#4B5563" />
                            <Text style={styles.actionText}>Share</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Comments Section */}
                    <View style={styles.commentsContainer}>
                        <Text style={styles.commentsHeader}>Comments</Text>

                        {isLoading ? (
                            <ActivityIndicator size="small" color="#3B82F6" style={{ marginVertical: 20 }} />
                        ) : postData.comments && postData.comments.length > 0 ? (
                            postData.comments.map((item, index) => (
                                <View key={index} style={styles.commentItem}>
                                    <Image source={{ uri: item.userProfileImage }} style={styles.commentUserImage} />
                                    <View style={styles.commentContent}>
                                        <View style={styles.commentBubble}>
                                            <Text style={styles.commentUserName}>{item.userName}</Text>
                                            <Text style={styles.commentText}>{item.comment}</Text>
                                        </View>
                                        <Text style={styles.commentTime}>
                                            {formatTimeAgo(item.timestamp)}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.noComments}>
                                <Ionicons name="chatbubbles-outline" size={40} color="#D1D5DB" />
                                <Text style={styles.noCommentsText}>No comments yet. Be the first to reply!</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Comment Input */}
                <View style={styles.inputContainer}>
                    <Image
                        source={{ uri: user?.profileImage || 'https://via.placeholder.com/40' }}
                        style={styles.inputUserImage}
                    />
                    <View style={styles.textInputWrapper}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Write a comment..."
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
                                    color={commentText.trim() ? "#3B82F6" : "#D1D5DB"}
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
            <Toast />
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
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
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
        paddingBottom: Platform.OS === 'ios' ? 30 : 12,
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
});

export default OpinionDetails;