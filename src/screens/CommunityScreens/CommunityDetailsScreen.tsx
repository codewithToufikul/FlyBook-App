import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    FlatList,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import YoutubePlayer from 'react-native-youtube-iframe';
import Video from 'react-native-video';
import {
    getCommunityById,
    getCommunityPosts,
    toggleFollowCommunity,
    getFollowStatus,
    getCommunityPermissions,
    getCourseMapping,
    enrollInCourse,
    checkEnrollmentStatus,
    Community,
    CommunityPost
} from '../../services/communityService';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const CommunityDetailsScreen = ({ route, navigation }: any) => {
    const { communityId } = route.params;
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [community, setCommunity] = useState<Community | null>(null);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('Feed');
    const [permissions, setPermissions] = useState({ isMainAdmin: false, isAdmin: false, isEditor: false });
    const [enrolledPosts, setEnrolledPosts] = useState<Record<string, { enrolled: boolean; courseId: string }>>({});
    const [joinLoading, setJoinLoading] = useState<string | null>(null);

    const checkEnrollments = useCallback(async (loadedPosts: CommunityPost[]) => {
        const coursePosts = loadedPosts.filter(p => p.type === 'course');
        if (coursePosts.length === 0) return;

        const enrollmentStatuses: Record<string, { enrolled: boolean; courseId: string }> = {};
        await Promise.allSettled(coursePosts.map(async (p) => {
            try {
                const mapping = await getCourseMapping(p._id);
                if (mapping.courseId) {
                    const enrolled = await checkEnrollmentStatus(mapping.courseId);
                    // Store courseId even if not enrolled, so admins can open dashboard
                    enrollmentStatuses[p._id] = { enrolled, courseId: mapping.courseId };
                }
            } catch (e) {
                console.error('Enrollment check failed for post:', p._id, e);
            }
        }));
        setEnrolledPosts(prev => ({ ...prev, ...enrollmentStatuses }));
    }, []);

    const fetchDetails = useCallback(async () => {
        try {
            setLoading(true);
            const [commData, postsData, followStatus, permData] = await Promise.all([
                getCommunityById(communityId),
                getCommunityPosts(communityId),
                getFollowStatus(communityId),
                getCommunityPermissions(communityId)
            ]);

            setCommunity(commData);
            setPosts(postsData);
            setIsFollowing(followStatus);
            setPermissions(permData);

            if (postsData.length > 0) {
                checkEnrollments(postsData);
            }
        } catch (error) {
            console.error('Failed to load community details:', error);
            Alert.alert('Error', 'Failed to load community details.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [communityId, checkEnrollments]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchDetails();
        });
        return unsubscribe;
    }, [navigation, fetchDetails]);

    const handleToggleFollow = async () => {
        const result = await toggleFollowCommunity(communityId);
        if (result.success) {
            setIsFollowing(result.followed);
            // Optionally update member count locally
            if (community) {
                setCommunity({
                    ...community,
                    membersCount: result.followed ? community.membersCount + 1 : community.membersCount - 1
                });
            }
        }
    };

    const handleJoinCourse = async (postId: string) => {
        try {
            setJoinLoading(postId);
            const mapping = await getCourseMapping(postId);
            if (!mapping.courseId) throw new Error("Course not found");

            const res = await enrollInCourse(mapping.courseId);
            if (res.success) {
                Alert.alert('Success', 'Enrolled successfully!');
                setEnrolledPosts(prev => ({ ...prev, [postId]: { enrolled: true, courseId: mapping.courseId } }));
            }
        } catch (error) {
            console.error('Enroll failed:', error);
            Alert.alert('Error', 'Enroll failed');
        } finally {
            setJoinLoading(null);
        }
    };

    const handleOpenCourse = (postId: string) => {
        const enrolledData = enrolledPosts[postId];
        if (enrolledData && enrolledData.courseId) {
            navigation.navigate('CommunityCourseDetails', { courseId: enrolledData.courseId });
        } else {
            Alert.alert('Error', 'Course information not available');
        }
    };

    const handleOpenDashboard = (postId: string) => {
        const enrolledData = enrolledPosts[postId];
        if (enrolledData && enrolledData.courseId) {
            navigation.navigate('CommunityStudentDashboard', { courseId: enrolledData.courseId });
        } else {
            // If not enrolled locally but is admin, we might need to fetch courseId freshly or rely on what we have.
            // For now, let's try to get it from enrolledPosts (which holds all course mappings found)
            if (enrolledData?.courseId) {
                navigation.navigate('CommunityStudentDashboard', { courseId: enrolledData.courseId });
            } else {
                // Fallback: try to fetch mapping on fly or show error
                Alert.alert('Error', 'Course info not ready. Please try again.');
            }
        }
    };

    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const renderPostItem = ({ item }: { item: CommunityPost }) => {
        const isCourse = item.type === 'course';
        const isVideo = item.type === 'video';
        const videoUrls = isVideo
            ? (Array.isArray(item.content)
                ? item.content
                : (typeof item.content === 'string' ? item.content : '').split(',').map(u => u.trim()).filter(Boolean))
            : [];

        return (
            <View style={styles.postCard}>
                {/* Header - Matching Web */}
                <View style={[styles.postHeader, { marginBottom: 8 }]}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.authorRow}>
                            <Text style={styles.postCardTitle}>{item.title}</Text>
                            <View style={[styles.typeBadge, (styles as any)[`${item.type}Badge`] || styles.textBadge]}>
                                <Ionicons
                                    name={item.type === 'course' ? 'school' : item.type === 'video' ? 'videocam' : 'document-text'}
                                    size={10}
                                    color="#FFFFFF"
                                />
                                <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
                            </View>
                            {item.visibility === 'private' && (
                                <View style={styles.privateBadge}>
                                    <Ionicons name="lock-closed" size={10} color="#B45309" />
                                    <Text style={styles.privateBadgeText}>Private</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.postMetaRow}>
                            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                            <Text style={styles.postTime}>
                                {new Date(item.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity>
                        <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {item.description ? <Text style={styles.postDescription}>{item.description}</Text> : null}

                {/* Content Area */}
                {item.type === 'text' && item.content && (
                    <View style={styles.textContentBox}>
                        <Text style={styles.postContentMain}>{item.content}</Text>
                    </View>
                )}

                {item.media && item.media.length > 0 && item.type === 'text' && (
                    <Image
                        source={{ uri: item.media[0].url }}
                        style={styles.postMedia}
                        resizeMode="cover"
                    />
                )}

                {isVideo && videoUrls.length > 0 && (
                    <View style={styles.videoListContainer}>
                        {videoUrls.map((url, index) => {
                            const youtubeId = getYoutubeId(url);
                            return (
                                <View key={index} style={styles.videoCard}>
                                    {youtubeId ? (
                                        <YoutubePlayer
                                            height={200}
                                            play={false}
                                            videoId={youtubeId}
                                        />
                                    ) : (
                                        <View style={styles.nativeVideoContainer}>
                                            <Video
                                                source={{ uri: url }}
                                                style={styles.nativeVideo}
                                                controls={true}
                                                paused={true}
                                                resizeMode="contain"
                                            />
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                {isCourse && (
                    <View style={styles.courseEnrollArea}>
                        <TouchableOpacity
                            style={[
                                styles.enrollBtnFull,
                                enrolledPosts[item._id]?.enrolled && styles.enrolledBtn
                            ]}
                            disabled={joinLoading === item._id}
                            onPress={() => enrolledPosts[item._id]?.enrolled ? handleOpenCourse(item._id) : handleJoinCourse(item._id)}
                        >
                            {joinLoading === item._id ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="school" size={20} color="#FFFFFF" />
                                    <Text style={styles.enrollBtnTextFull}>
                                        {enrolledPosts[item._id]?.enrolled ? 'Open Course' : 'Enroll in Course'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {permissions.isMainAdmin && (
                            <TouchableOpacity
                                style={styles.studentDashboardBtn}
                                onPress={() => handleOpenDashboard(item._id)}
                            >
                                <Ionicons name="bar-chart" size={20} color="#FFFFFF" />
                                <Text style={styles.enrollBtnTextFull}>Student Dashboard</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={styles.postFooter}>
                    <TouchableOpacity style={styles.postAction}>
                        <Ionicons
                            name={item.isLiked ? "heart" : "heart-outline"}
                            size={22}
                            color={item.isLiked ? "#EF4444" : "#4B5563"}
                        />
                        <Text style={[styles.postActionText, item.isLiked && { color: "#EF4444" }]}>
                            {item.likesCount}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.postAction}>
                        <Ionicons name="chatbubble-outline" size={20} color="#4B5563" />
                        <Text style={styles.postActionText}>{item.commentsCount}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.postAction}>
                        <Ionicons name="share-social-outline" size={20} color="#4B5563" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderHeader = () => (
        <View>
            {/* Cover and Profile */}
            <View style={styles.coverContainer}>
                <Image
                    source={{ uri: community?.coverImage || 'https://via.placeholder.com/800x400' }}
                    style={styles.coverImage}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.coverGradient}
                />
                <View style={[styles.navHeader, { top: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.profileSection}>
                <View style={styles.profileInfo}>
                    <Image
                        source={{ uri: community?.logo || 'https://via.placeholder.com/150' }}
                        style={styles.logo}
                    />
                    <View style={styles.titleContainer}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name}>{community?.name}</Text>
                            {community?.isVerified && (
                                <Ionicons name="checkmark-circle" size={18} color="#0D9488" style={{ marginLeft: 5 }} />
                            )}
                        </View>
                        <Text style={styles.memberCount}>{community?.membersCount} Members</Text>
                    </View>
                </View>

                {user?._id === community?.mainAdmin ? (
                    <TouchableOpacity
                        style={[styles.followBtn, styles.editBtn]}
                        onPress={() => navigation.navigate('CreateCommunity', { community })}
                    >
                        <Ionicons name="create-outline" size={20} color="#0D9488" />
                        <Text style={[styles.followBtnText, styles.editBtnText]}>Edit Info</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.followBtn, isFollowing && styles.followingBtn]}
                        onPress={handleToggleFollow}
                    >
                        <Ionicons
                            name={isFollowing ? "checkmark" : "add"}
                            size={20}
                            color={isFollowing ? "#0D9488" : "#FFFFFF"}
                        />
                        <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                            {isFollowing ? "Following" : "Join"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.descriptionSection}>
                <Text style={styles.description}>{community?.description}</Text>
                <View style={styles.tagsContainer}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{community?.category}</Text>
                    </View>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                {['Feed', 'Members', 'About'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab === 'Feed' && (permissions.isMainAdmin || permissions.isAdmin || permissions.isEditor) && (
                <TouchableOpacity
                    style={styles.createPostBtn}
                    onPress={() => navigation.navigate('CreatePost', {
                        communityId,
                        communityName: community?.name
                    })}
                >
                    <Image
                        source={{ uri: user?.profileImage || 'https://via.placeholder.com/50' }}
                        style={styles.userSmallAvatar}
                    />
                    <View style={styles.createPostPlaceholderContainer}>
                        <Text style={styles.createPostPlaceholder}>Post something in {community?.name}...</Text>
                    </View>
                    <Ionicons name="image-outline" size={24} color="#0D9488" />
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centerLoader}>
                <ActivityIndicator size="large" color="#0D9488" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <FlatList
                data={activeTab === 'Feed' ? posts : []}
                renderItem={renderPostItem}
                keyExtractor={item => item._id}
                ListHeaderComponent={renderHeader}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={
                    activeTab === 'Feed' ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="newspaper-outline" size={60} color="#D1D5DB" />
                            <Text style={styles.emptyTitle}>No posts yet</Text>
                            <Text style={styles.emptySubtitle}>Be the first to share something in this community!</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    centerLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    coverContainer: {
        height: 200,
        width: '100%',
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    navHeader: {
        position: 'absolute',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileSection: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    profileInfo: {
        flex: 1,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 25,
        borderWidth: 5,
        borderColor: '#FFFFFF',
        marginTop: -50,
        backgroundColor: '#F3F4F6',
    },
    titleContainer: {
        marginTop: 10,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },
    memberCount: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    descriptionSection: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    description: {
        fontSize: 15,
        color: '#4B5563',
        marginTop: 10,
        lineHeight: 22,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    followBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#0D9488',
        marginRight: 10,
    },
    followingBtn: {
        backgroundColor: '#F3F4F6',
    },
    followBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
        marginLeft: 8,
    },
    followingBtnText: {
        color: '#4B5563',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    editBtnText: {
        color: '#4B5563',
        fontWeight: '700',
        fontSize: 15,
    },
    tagsContainer: {
        flexDirection: 'row',
        marginTop: 15,
    },
    tag: {
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tagText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        marginTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tab: {
        paddingVertical: 15,
        paddingHorizontal: 15,
        marginRight: 10,
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: '#0D9488',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#0D9488',
    },
    createPostBtn: {
        backgroundColor: '#FFFFFF',
        margin: 15,
        padding: 12,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    userSmallAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    createPostPlaceholderContainer: {
        flex: 1,
        marginLeft: 12,
    },
    createPostPlaceholder: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    textBadge: {
        backgroundColor: '#F5F3FF', // Purple-50
    },
    videoBadge: {
        backgroundColor: '#EEF2FF', // Indigo-50
    },
    courseBadge: {
        backgroundColor: '#EFF6FF', // Blue-50
    },
    typeBadgeText: {
        color: '#4338CA', // Indigo-700
        fontSize: 10,
        fontWeight: '700',
        marginLeft: 4,
        textTransform: 'capitalize',
    },
    postCardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        flexShrink: 1,
    },
    privateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    privateBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#B45309',
        marginLeft: 4,
    },
    postMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    postTime: {
        fontSize: 12,
        color: '#9CA3AF',
        marginLeft: 4,
    },
    textContentBox: {
        marginTop: 12,
        padding: 15,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    postContentMain: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
    },
    postDescription: {
        fontSize: 15,
        color: '#4B5563',
        marginTop: 8,
        lineHeight: 22,
    },
    videoListContainer: {
        marginTop: 12,
        gap: 12,
    },
    videoCard: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#000000',
    },
    nativeVideoContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000000',
    },
    nativeVideo: {
        width: '100%',
        height: '100%',
    },
    courseEnrollArea: {
        marginTop: 15,
        gap: 10,
    },
    enrollBtnFull: {
        backgroundColor: '#4F46E5',
        paddingVertical: 14,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    enrolledBtn: {
        backgroundColor: '#2563EB',
    },
    studentDashboardBtn: {
        backgroundColor: '#059669',
        paddingVertical: 14,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    enrollBtnTextFull: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
    postTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginHorizontal: 15,
        marginTop: 10,
    },
    videoPlaceholder: {
        height: 200,
        backgroundColor: '#000000',
        marginHorizontal: 15,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    videoHint: {
        color: '#FFFFFF',
        marginTop: 10,
        fontWeight: '600',
    },
    courseIndicator: {
        backgroundColor: '#F0FDFA',
        marginHorizontal: 15,
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#99F6E4',
        marginTop: 12,
    },
    courseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    courseHeaderText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0D9488',
        marginLeft: 6,
    },
    chapterCount: {
        fontSize: 12,
        color: '#4B5563',
        marginTop: 4,
    },
    enrollBtn: {
        backgroundColor: '#0D9488',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 12,
    },
    enrollBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
    },
    postCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 24,
        padding: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    postAuthorImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    postHeaderInfo: {
        flex: 1,
        marginLeft: 12,
    },
    postAuthorName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    postContent: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
        marginBottom: 12,
    },
    postMedia: {
        width: '100%',
        height: 250,
        borderRadius: 20,
        marginTop: 15,
        backgroundColor: '#F3F4F6',
    },
    postFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 20,
        marginTop: 20,
    },
    postAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    postActionText: {
        fontSize: 16,
        color: '#4B5563',
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginTop: 15,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 5,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});

export default CommunityDetailsScreen;
