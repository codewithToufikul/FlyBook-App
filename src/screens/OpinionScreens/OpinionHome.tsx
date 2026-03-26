import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    Linking,
    Share,
    Dimensions,
    Modal,
    Pressable,
    Alert,
    Platform,
    StatusBar,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { get, post } from '../../services/api';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-clipboard/clipboard';
import TobNav from '../../components/TobNav';
import PostSkeleton from '../../components/PostSkeleton';
import VideoPlayer from '../../components/VideoPlayer';

const { width } = Dimensions.get('window');

interface Post {
    _id: string;
    userId: string;
    userName: string;
    userProfileImage: string;
    description: string;
    image?: string;
    images?: string[];
    video?: string;
    pdf?: string;
    likes: number;
    likedBy: string[];
    comments?: any[];
    date: string;
    time: string;
    shares?: number;
    isShared?: boolean;
    originalPostData?: {
        postId: string;
        postType: 'opinion' | 'home';
        authorName: string;
        authorImage: string;
        description: string;
        image?: string;
        images?: string[];
        video?: string;
        pdf?: string;
        createdAt?: string;
    };
    createdAt?: string;
}

interface FetchOpinionPostsResponse {
    data: Post[];
    hasMore: boolean;
    page: number;
}

const fetchOpinionPosts = async ({ pageParam = 1 }): Promise<FetchOpinionPostsResponse> => {
    try {
        const response = await get<FetchOpinionPostsResponse>(`/api/opinion/fast-posts?page=${pageParam}&limit=10`);
        return response || { data: [], hasMore: false, page: 1 };
    } catch (error) {
        console.error('Error fetching posts:', error);
        return { data: [], hasMore: false, page: 1 };
    }
};

// ─── Share Bottom Sheet ──────────────────────────────────────────────────────
const ShareSheet = ({
    visible,
    onClose,
    post: postItem,
}: {
    visible: boolean;
    onClose: () => void;
    post: Post | null;
}) => {
    const { isDark } = useTheme();
    if (!postItem) return null;

    const options = [
        {
            id: 'profile',
            label: 'Share to Profile',
            icon: 'repeat',
            color: '#10b981',
            bg: 'rgba(16,185,129,0.12)',
            action: async () => {
                try {
                    const res = await post<{ success: boolean }>('/opinion/share', {
                        postId: postItem._id,
                        postType: 'opinion'
                    });
                    if (res?.success) {
                        Toast.show({ type: 'success', text1: 'Shared to your profile!' });
                        onClose();
                    }
                } catch { Alert.alert('Error', 'Failed to share to profile'); }
            },
        },
        {
            id: 'native',
            label: 'Share via...',
            icon: 'share-social',
            color: '#6366f1',
            bg: 'rgba(99,102,241,0.12)',
            action: async () => {
                try {
                    await Share.share({ message: `${postItem.userName}'s Opinion:\n${postItem.description}\n\n— Shared via FlyBook` });
                    onClose();
                } catch { Alert.alert('Error', 'Failed to share'); }
            },
        },
        {
            id: 'copy',
            label: 'Copy Link',
            icon: 'link',
            color: '#06b6d4',
            bg: 'rgba(6,182,212,0.12)',
            action: () => {
                Clipboard.setString(`https://flybook.app/opinion/${postItem._id}`);
                Toast.show({ type: 'success', text1: '✓ Link copied!' });
                onClose();
            },
        },
        {
            id: 'save',
            label: 'Save Post',
            icon: 'bookmark',
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.12)',
            action: () => { Alert.alert('Saved', 'Added to bookmarks'); onClose(); },
        },
        {
            id: 'report',
            label: 'Report Post',
            icon: 'flag',
            color: '#ef4444',
            bg: 'rgba(239,68,68,0.12)',
            action: () => { Alert.alert('Reported', 'Thank you for the report.'); onClose(); },
        },
    ];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={ss.overlay} onPress={onClose}>
                <View style={[ss.sheet, isDark && ss.sheetDark]}>
                    <View style={[ss.pill, isDark && { backgroundColor: '#334155' }]} />
                    <Text style={[ss.sheetTitle, isDark && { color: '#f1f5f9' }]}>Share Opinion</Text>
                    {options.map(opt => (
                        <TouchableOpacity key={opt.id} style={[ss.optRow, isDark && { borderBottomColor: '#1e293b' }]} onPress={opt.action} activeOpacity={0.7}>
                            <View style={[ss.optIcon, { backgroundColor: opt.bg }]}>
                                <Ionicons name={opt.icon} size={20} color={opt.color} />
                            </View>
                            <Text style={[ss.optLabel, isDark && { color: '#cbd5e1' }]}>{opt.label}</Text>
                            <Ionicons name="chevron-forward" size={16} color={isDark ? '#475569' : '#cbd5e1'} />
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={[ss.cancelBtn, isDark && { backgroundColor: '#1e293b' }]} onPress={onClose}>
                        <Text style={ss.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
};

const ss = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    sheetDark: { backgroundColor: '#0f172a' },
    pill: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 16, letterSpacing: -0.3 },
    optRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    optIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    optLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1e293b' },
    cancelBtn: { marginTop: 16, backgroundColor: '#f8fafc', paddingVertical: 15, borderRadius: 16, alignItems: 'center' },
    cancelText: { fontSize: 15, fontWeight: '800', color: '#ef4444' },
});

// ─── Main Component ──────────────────────────────────────────────────────────
const OpinionHome = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const queryClient = useQueryClient();
    const [sharePost, setSharePost] = useState<Post | null>(null);

    const bg = isDark ? '#070d1a' : '#f0f4f8';
    const cardBg = isDark ? '#111827' : '#ffffff';
    const borderColor = isDark ? '#1e293b' : '#f1f5f9';
    const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
    const textSecondary = isDark ? '#64748b' : '#94a3b8';
    const textMuted = isDark ? '#475569' : '#cbd5e1';
    const inputBg = isDark ? '#1a2332' : '#f8fafc';

    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch, isRefetching } =
        useInfiniteQuery({
            queryKey: ['opinion-posts'],
            queryFn: fetchOpinionPosts,
            initialPageParam: 1,
            getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
            staleTime: 1000 * 60 * 5,
        });

    const allPosts = useMemo(() => {
        const posts = data?.pages.flatMap(p => p.data) || [];
        return [...posts].sort((a, b) => {
            const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return db - da;
        });
    }, [data]);

    const handleLike = async (postId: string, isLiked: boolean) => {
        if (!user?._id) return;
        const prev = queryClient.getQueryData<any>(['opinion-posts']);
        if (prev) {
            const updated = { ...prev, pages: prev.pages.map((page: any) => ({ ...page, data: page.data.map((p: Post) => p._id !== postId ? p : { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1, likedBy: isLiked ? p.likedBy.filter(id => id !== user._id) : [...(p.likedBy || []), user._id] }) })) };
            queryClient.setQueryData(['opinion-posts'], updated);
        }
        try {
            const res = await post<{ success: boolean }>(isLiked ? '/opinion/unlike' : '/opinion/like', { postId });
            if (!res?.success) queryClient.setQueryData(['opinion-posts'], prev);
        } catch { queryClient.setQueryData(['opinion-posts'], prev); }
    };

    const fmtTime = (t: string) => t?.slice(0, -6) + t?.slice(-3);
    const truncate = (s: string, n = 220) => s?.length > n ? s.slice(0, n) + '…' : s;
    const openPdf = (url: string) => Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: 'Cannot open PDF' }));
    const goProfile = (uid: string) => uid === user?._id ? navigation.navigate('Home', { screen: 'Profile' }) : navigation.navigate('UserProfile', { userId: uid });
    const goDetail = (p: Post) => navigation.navigate('OpinionDetails', { post: p });

    const navigateToOriginalPost = (originalData: any) => {
        if (!originalData) return;
        if (originalData.postType === 'home') {
            navigation.navigate('PostDetails', { post: { _id: originalData.postId } });
        } else {
            navigation.navigate('OpinionDetails', { post: { _id: originalData.postId } });
        }
    };

    const renderPost = ({ item: p }: { item: Post }) => {
        const liked = !!(user && p.likedBy?.includes(user._id));
        return (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                {/* ── Author Row ── */}
                <View style={[styles.authorRow, { borderBottomColor: borderColor }]}>
                    <TouchableOpacity onPress={() => goProfile(p.userId)} activeOpacity={0.8}>
                        <View style={styles.avatarWrap}>
                            <Image source={{ uri: p.userProfileImage }} style={styles.avatar} />
                            <View style={styles.avatarRing} />
                        </View>
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <TouchableOpacity onPress={() => goProfile(p.userId)}>
                            <Text style={[styles.authorName, { color: textPrimary }]}>{p.userName}</Text>
                        </TouchableOpacity>
                        <View style={styles.metaRow}>
                            <Ionicons name="earth-outline" size={11} color={textSecondary} />
                            <Text style={[styles.metaText, { color: textSecondary }]}>  {p.date}  ·  {fmtTime(p.time)}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.moreBtn, { backgroundColor: inputBg }]}>
                        <Ionicons name="ellipsis-horizontal" size={18} color={textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* ── Body ── */}
                <TouchableOpacity onPress={() => goDetail(p)} activeOpacity={0.9} style={styles.bodyPad}>
                    {p.isShared && <Text style={[styles.sharedText, { color: textSecondary }]}><Ionicons name="repeat" size={14} /> Shared a post</Text>}
                    <Text style={[styles.bodyText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                        {truncate(p.description)}
                    </Text>
                    {p.description?.length > 220 && (
                        <Text style={[styles.seeMore, { color: isDark ? '#38bdf8' : '#0D9488' }]}>See more</Text>
                    )}
                </TouchableOpacity>

                {/* ── Original Post Content (if Shared) ── */}
                {p.isShared && p.originalPostData && (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => navigateToOriginalPost(p.originalPostData)}
                        style={[styles.originalPostContainer, { borderColor, backgroundColor: inputBg }]}
                    >
                        <View style={styles.originalAuthorRow}>
                            <Image source={{ uri: p.originalPostData.authorImage }} style={styles.originalAvatar} />
                            <View>
                                <Text style={[styles.originalAuthorName, { color: textPrimary }]}>{p.originalPostData.authorName}</Text>
                                <Text style={[styles.originalMetaText, { color: textSecondary }]}>{p.originalPostData.createdAt ? new Date(p.originalPostData.createdAt).toLocaleDateString() : ''}</Text>
                            </View>
                        </View>
                        <Text style={[styles.originalBodyText, { color: isDark ? '#cbd5e1' : '#334155' }]} numberOfLines={3}>
                            {p.originalPostData.description}
                        </Text>
                        {/* Shared Post Multiple Images */}
                        {p.originalPostData.images && p.originalPostData.images.length > 1 ? (
                            <View style={[styles.originalPostImg, { overflow: 'hidden' }]}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled>
                                    {p.originalPostData.images.map((img, idx) => (
                                        <View key={idx}>
                                            <Image source={{ uri: img }} style={styles.originalPostImg} resizeMode="cover" />
                                            <View style={styles.imgBadge}>
                                                <Text style={styles.imgBadgeText}>{idx + 1}/{p.originalPostData?.images?.length}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        ) : (p.originalPostData.images && p.originalPostData.images[0]) || p.originalPostData.image ? (
                            <Image source={{ uri: (p.originalPostData.images && p.originalPostData.images[0]) || p.originalPostData.image }} style={styles.originalPostImg} resizeMode="cover" />
                        ) : null}
                        {p.originalPostData.video && (
                            <View style={styles.originalVideoHint}>
                                <Ionicons name="play-circle" size={20} color={textSecondary} />
                                <Text style={{ color: textSecondary, fontSize: 12 }}>Contains video</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}

                {/* ── PDF ── */}
                {p.pdf && (
                    <TouchableOpacity onPress={() => openPdf(p.pdf!)} style={[styles.pdfRow, { backgroundColor: inputBg, borderColor }]} activeOpacity={0.8}>
                        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.pdfIconBox}>
                            <Ionicons name="document-text" size={20} color="#fff" />
                        </LinearGradient>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.pdfTitle, { color: textPrimary }]}>Opinion Document</Text>
                            <Text style={[styles.pdfSub, { color: textSecondary }]}>Tap to view PDF</Text>
                        </View>
                        <Ionicons name="open-outline" size={18} color={textMuted} />
                    </TouchableOpacity>
                )}

                {/* ── Multiple Images ── */}
                {p.images && p.images.length > 1 ? (
                    <View style={styles.multiImgWrap}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled>
                            {p.images.map((img, idx) => (
                                <TouchableOpacity key={idx} onPress={() => goDetail(p)} activeOpacity={0.95}>
                                    <Image source={{ uri: img }} style={styles.multiPostImg} resizeMode="cover" />
                                    <View style={styles.imgBadge}>
                                        <Text style={styles.imgBadgeText}>{idx + 1}/{p.images?.length}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                ) : (p.images && p.images.length === 1) || p.image ? (
                    <TouchableOpacity onPress={() => goDetail(p)} activeOpacity={0.95} style={styles.imgWrap}>
                        <Image source={{ uri: (p.images && p.images[0]) || p.image }} style={styles.postImg} resizeMode="cover" />
                        <LinearGradient
                            colors={['transparent', isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)']}
                            style={StyleSheet.absoluteFill}
                        />
                    </TouchableOpacity>
                ) : null}

                {/* ── Video ── */}
                {p.video && (
                    <View style={styles.videoWrap}>
                        {/* Label */}
                        <View style={styles.videoLabelRow}>
                            <LinearGradient colors={['#f43f5e', '#e11d48']} style={styles.videoLabelDot} />
                            <Text style={[styles.videoLabelText, { color: textSecondary }]}>Video</Text>
                        </View>
                        <VideoPlayer
                            uri={p.video}
                            height={230}
                            borderRadius={0}
                            autoPlay={false}
                            onFullscreen={() => goDetail(p)}
                        />
                    </View>
                )}

                {/* ── Stat Bar ── */}
                <View style={[styles.statBar, { borderTopColor: borderColor }]}>
                    <View style={styles.statLeft}>
                        <LinearGradient colors={['#f43f5e', '#ef4444']} style={styles.statHeart}>
                            <Ionicons name="heart" size={11} color="#fff" />
                        </LinearGradient>
                        <Text style={[styles.statCount, { color: textSecondary }]}>{p.likes}</Text>
                    </View>
                    <View style={styles.statRight}>
                        <Text style={[styles.statCount, { color: textSecondary }]}>{p.comments?.length || 0} comments</Text>
                        <View style={[styles.statDot, { backgroundColor: textMuted }]} />
                        <Text style={[styles.statCount, { color: textSecondary }]}>{p.shares || 0} shares</Text>
                    </View>
                </View>

                {/* ── Actions ── */}
                <View style={[styles.actionBar, { borderTopColor: borderColor }]}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleLike(p._id, liked)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={liked ? 'heart' : 'heart-outline'}
                            size={21}
                            color={liked ? '#f43f5e' : textSecondary}
                        />
                        <Text style={[styles.actionLabel, { color: liked ? '#f43f5e' : textSecondary }]}>Like</Text>
                    </TouchableOpacity>

                    <View style={[styles.actionDiv, { backgroundColor: borderColor }]} />

                    <TouchableOpacity style={styles.actionBtn} onPress={() => goDetail(p)} activeOpacity={0.7}>
                        <Ionicons name="chatbubble-outline" size={19} color={textSecondary} />
                        <Text style={[styles.actionLabel, { color: textSecondary }]}>Comment</Text>
                    </TouchableOpacity>

                    <View style={[styles.actionDiv, { backgroundColor: borderColor }]} />

                    <TouchableOpacity style={styles.actionBtn} onPress={() => setSharePost(p)} activeOpacity={0.7}>
                        <Ionicons name="arrow-redo-outline" size={20} color={textSecondary} />
                        <Text style={[styles.actionLabel, { color: textSecondary }]}>Share</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Comment Preview ── */}
                {p.comments && p.comments.length > 0 && (
                    <TouchableOpacity onPress={() => goDetail(p)} style={[styles.commentPreview, { borderTopColor: borderColor }]} activeOpacity={0.8}>
                        <Image
                            source={{ uri: p.comments[0].userProfileImage || 'https://via.placeholder.com/28' }}
                            style={styles.commentAvatar}
                        />
                        <View style={[styles.commentBubble, { backgroundColor: inputBg }]}>
                            <Text style={[styles.commentAuthor, { color: textPrimary }]}>{p.comments[0].userName}</Text>
                            <Text style={[styles.commentBody, { color: isDark ? '#94a3b8' : '#475569' }]} numberOfLines={2}>
                                {p.comments[0].comment}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.root, { backgroundColor: bg }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />
            <TobNav navigation={navigation} />

            <FlatList
                data={allPosts}
                keyExtractor={item => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={isDark ? '#38bdf8' : '#0D9488'}
                        colors={['#0D9488']}
                    />
                }
                ListHeaderComponent={
                    <>
                        {/* ── Create Post Card ── */}
                        <View style={[styles.createCard, { backgroundColor: cardBg, borderColor }]}>
                            <View style={styles.createRow}>
                                <View style={styles.avatarWrap}>
                                    <Image
                                        source={{ uri: user?.profileImage || 'https://via.placeholder.com/44' }}
                                        style={styles.avatar}
                                    />
                                    <View style={styles.onlineDot} />
                                </View>
                                <TouchableOpacity
                                    style={[styles.createInput, { backgroundColor: inputBg }]}
                                    onPress={() => navigation.navigate('CreateOpinion')}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.createPlaceholder, { color: textSecondary }]}>
                                        Share your opinion..
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.createActions, { borderTopColor: borderColor }]}>
                                {[
                                    { icon: 'videocam', label: 'Video', color: '#f43f5e' },
                                    { icon: 'image', label: 'Photo', color: '#10b981' },
                                    { icon: 'document-text', label: 'PDF', color: '#f59e0b' },
                                ].map((item, idx, arr) => (
                                    <React.Fragment key={item.icon}>
                                        <TouchableOpacity
                                            style={styles.createActionBtn}
                                            onPress={() => navigation.navigate('CreateOpinion')}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[styles.createActionIcon, { backgroundColor: item.color + '18' }]}>
                                                <Ionicons name={item.icon} size={18} color={item.color} />
                                            </View>
                                            <Text style={[styles.createActionLabel, { color: textSecondary }]}>{item.label}</Text>
                                        </TouchableOpacity>
                                        {idx < arr.length - 1 && <View style={[styles.createDiv, { backgroundColor: borderColor }]} />}
                                    </React.Fragment>
                                ))}
                            </View>
                        </View>

                        {/* ── Skeleton ── */}
                        {isLoading && allPosts.length === 0 && (
                            <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
                                {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                            </View>
                        )}
                    </>
                }
                renderItem={renderPost}
                onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
                onEndReachedThreshold={0.6}
                ListFooterComponent={() =>
                    isFetchingNextPage ? (
                        <View style={{ paddingVertical: 24 }}>
                            <ActivityIndicator size="small" color={isDark ? '#38bdf8' : '#0D9488'} />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.empty}>
                            <LinearGradient
                                colors={isDark ? ['#1e293b', '#111827'] : ['#f0f9ff', '#e0f2fe']}
                                style={styles.emptyIconBox}
                            >
                                <Ionicons name="chatbubbles-outline" size={44} color={isDark ? '#334155' : '#bae6fd'} />
                            </LinearGradient>
                            <Text style={[styles.emptyTitle, { color: textPrimary }]}>No opinions yet</Text>
                            <Text style={[styles.emptySub, { color: textSecondary }]}>Be the first to share your thoughts!</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('CreateOpinion')} activeOpacity={0.8}>
                                <LinearGradient
                                    colors={isDark ? ['#0f766e', '#0D9488'] : ['#0D9488', '#0f766e']}
                                    style={styles.emptyBtn}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                >
                                    <Ionicons name="add" size={18} color="#fff" />
                                    <Text style={styles.emptyBtnText}>Create Opinion</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />

            <ShareSheet visible={!!sharePost} onClose={() => setSharePost(null)} post={sharePost} />
        </View>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    // Create Card
    createCard: {
        marginHorizontal: 12,
        marginBottom: 10,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
    },
    createRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 10,
    },
    createInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 24,
    },
    createPlaceholder: {
        fontSize: 14,
        fontWeight: '600',
    },
    createActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        paddingVertical: 8,
    },
    createActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        gap: 6,
    },
    createActionIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createActionLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    createDiv: {
        width: 1,
        height: 28,
        alignSelf: 'center',
    },
    // Post Card
    card: {
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.07,
        shadowRadius: 14,
        elevation: 5,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    avatarWrap: {
        position: 'relative',
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
    },
    avatarRing: {
        position: 'absolute',
        inset: -2,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#0D9488',
        opacity: 0.6,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 13,
        height: 13,
        borderRadius: 6.5,
        backgroundColor: '#22c55e',
        borderWidth: 2,
        borderColor: '#fff',
    },
    authorName: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    metaText: {
        fontSize: 11.5,
        fontWeight: '600',
    },
    moreBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bodyPad: {
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    bodyText: {
        fontSize: 15,
        lineHeight: 24,
        fontWeight: '500',
    },
    seeMore: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 6,
    },
    pdfRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 14,
        marginBottom: 12,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
    },
    pdfIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pdfTitle: {
        fontSize: 13,
        fontWeight: '800',
    },
    pdfSub: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 1,
    },
    imgWrap: {
        position: 'relative',
        overflow: 'hidden',
    },
    postImg: {
        width: '100%',
        height: 300,
    },
    multiImgWrap: {
        width: width - 24,
        height: 300,
        overflow: 'hidden',
    },
    multiPostImg: {
        width: width - 24,
        height: 300,
    },
    imgBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    imgBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },
    videoWrap: {
        overflow: 'hidden',
    },
    videoLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 8,
    },
    videoLabelDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    videoLabelText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    statBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    statLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statHeart: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statCount: {
        fontSize: 12,
        fontWeight: '700',
    },
    statDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
    actionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        gap: 7,
    },
    actionDiv: {
        width: 1,
        height: 22,
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    commentPreview: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 14,
        paddingBottom: 14,
        paddingTop: 10,
        borderTopWidth: 1,
        gap: 8,
    },
    commentAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginTop: 2,
    },
    commentBubble: {
        flex: 1,
        padding: 10,
        borderRadius: 14,
        borderTopLeftRadius: 4,
    },
    commentAuthor: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 2,
    },
    commentBody: {
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
    },
    sharedText: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    originalPostContainer: {
        marginHorizontal: 14,
        marginBottom: 14,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    originalAuthorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    originalAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    originalAuthorName: {
        fontSize: 13,
        fontWeight: '700',
    },
    originalMetaText: {
        fontSize: 10,
    },
    originalBodyText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    originalPostImg: {
        width: '100%',
        height: 180,
        borderRadius: 12,
    },
    originalVideoHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 4,
    },
    // Empty
    empty: {
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
        gap: 12,
    },
    emptyIconBox: {
        width: 110,
        height: 110,
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    emptySub: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 8,
    },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 13,
        paddingHorizontal: 28,
        borderRadius: 24,
        marginTop: 4,
    },
    emptyBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
});

export default OpinionHome;