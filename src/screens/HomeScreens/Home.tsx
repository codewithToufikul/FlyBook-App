import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Modal,
  Share,
  Alert,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TobNav from '../../components/TobNav';
import PostSkeleton from '../../components/PostSkeleton';
import { useAuth } from '../../contexts/AuthContext';
import { get, post } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Post {
  _id: string;
  title: string;
  message: string;
  postText: string;
  postImage: string;
  image: string;
  category: string;
  likes: number;
  likedBy: string[];
  comments?: any[];
  userName: string;
  userImage: string;
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
    video?: string;
    pdf?: string;
    createdAt?: string;
  };
  createdAt?: string;
}

interface Category {
  _id: string;
  category: string;
}

// ─── Category color palette ───────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  All: { bg: '#6C63FF', text: '#fff', glow: '#6C63FF44' },
  Science: { bg: '#43CBFF', text: '#0a2540', glow: '#43CBFF44' },
  History: { bg: '#F9A826', text: '#2d1a00', glow: '#F9A82644' },
  Technology: { bg: '#56CFE1', text: '#0a2540', glow: '#56CFE144' },
  'Book War': { bg: '#FF9A9E', text: '#3b0000', glow: '#FF9A9E44' },
  Philosophy: { bg: '#A18CD1', text: '#1a0040', glow: '#A18CD144' },
  Literature: { bg: '#FDDB92', text: '#3b2a00', glow: '#FDDB9244' },
  Economics: { bg: '#84FAB0', text: '#0a3020', glow: '#84FAB044' },
};

const getChipColor = (cat: string) =>
  CATEGORY_COLORS[cat] ?? { bg: '#6C63FF', text: '#fff', glow: '#6C63FF44' };

// ─── API ──────────────────────────────────────────────────────────────────────

interface FetchPostsResponse {
  posts: Post[];
  hasMore: boolean;
  page: number;
}

const fetchPosts = (activeCategory: string) =>
  async ({ pageParam = 1 }): Promise<FetchPostsResponse> => {
    const categoryParam =
      activeCategory !== 'All' ? `&category=${encodeURIComponent(activeCategory)}` : '';
    const data = await get<FetchPostsResponse>(
      `/api/home/fast-posts?page=${pageParam}&limit=10${categoryParam}`,
    );
    return data || { posts: [], hasMore: false, page: 1 };
  };

const fetchCategories = async (): Promise<Category[]> => {
  const resp = await get<{ success: boolean; categories: Category[] }>('/home-category');
  if (resp?.success) return resp.categories;
  return [];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const getCategoryColor = (category?: string): string => {
  const map: Record<string, string> = {
    Science: '#43CBFF', History: '#F9A826', Technology: '#56CFE1',
    'Book War': '#FF9A9E', Philosophy: '#A18CD1',
  };
  return map[category ?? ''] ?? '#6C63FF';
};

// ─── Category Filter Bar ──────────────────────────────────────────────────────

const FILTER_BAR_HEIGHT = 54;

const CategoryFilterBar = ({
  categories,
  activeCategory,
  onSelect,
  isDark,
  translateY,
  top,
}: {
  categories: Category[];
  activeCategory: string;
  onSelect: (cat: string) => void;
  isDark: boolean;
  translateY: Animated.Value;
  top: number;
}) => {
  const scaleAnims = useRef<Record<string, Animated.Value>>({});

  const getAnim = (key: string) => {
    if (!scaleAnims.current[key]) {
      scaleAnims.current[key] = new Animated.Value(1);
    }
    return scaleAnims.current[key];
  };

  const handlePress = (cat: string) => {
    const anim = getAnim(cat);
    Animated.sequence([
      Animated.spring(anim, { toValue: 0.88, useNativeDriver: true, damping: 10, stiffness: 300 }),
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 200 }),
    ]).start();
    onSelect(cat);
  };

  const allCategories: Category[] = [
    ...categories,
  ];

  return (
    <Animated.View
      style={[
        filterStyles.wrapper,
        isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' },
        { top, transform: [{ translateY }] },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={filterStyles.scrollContent}
      >
        {allCategories.map((cat) => {
          const isActive = activeCategory === cat.category;
          const colors = getChipColor(cat.category);
          const anim = getAnim(cat.category);

          return (
            <Animated.View key={cat._id} style={{ transform: [{ scale: anim }] }}>
              <TouchableOpacity
                onPress={() => handlePress(cat.category)}
                activeOpacity={0.8}
                style={[
                  filterStyles.chip,
                  isActive
                    ? {
                      backgroundColor: colors.bg,
                      shadowColor: colors.bg,
                      shadowOpacity: 0.5,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 6,
                      borderColor: 'transparent',
                    }
                    : {
                      backgroundColor: isDark ? '#1e293b' : '#F1F5F9',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      shadowOpacity: 0,
                      elevation: 0,
                    },
                ]}
              >
                {isActive && (
                  <View
                    style={[
                      filterStyles.activeGlow,
                      { backgroundColor: colors.glow },
                    ]}
                  />
                )}
                <Text
                  style={[
                    filterStyles.chipText,
                    isActive
                      ? { color: colors.text, fontWeight: '700' }
                      : { color: isDark ? '#94a3b8' : '#64748B', fontWeight: '500' },
                  ]}
                >
                  {cat.category}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
};

const filterStyles = StyleSheet.create({
  wrapper: {
    // Absolutely positioned as a floating bar over the FlatList
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#F7F7FB',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    // Subtle shadow so it feels elevated
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 50,
    borderWidth: 1.2,
    overflow: 'hidden',
    marginRight: 1,
  },
  activeGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 50,
  },
  chipText: {
    fontSize: 13,
    letterSpacing: 0.1,
  },
});

// ─── Sub-components ───────────────────────────────────────────────────────────

const ShareSheet = ({
  visible,
  onClose,
  post: sharedPost,
}: {
  visible: boolean;
  onClose: () => void;
  post: Post | null;
}) => {
  const { isDark } = useTheme();
  if (!sharedPost) return null;

  const shareOptions = [
    {
      id: 'share_profile',
      label: 'Share to Profile',
      icon: 'repeat-outline',
      color: '#10b981',
      action: async () => {
        try {
          const res = await post<{ success: boolean }>('/opinion/share', {
            postId: sharedPost._id,
            postType: 'home'
          });
          if (res?.success) {
            Toast.show({ type: 'success', text1: 'Shared to your profile!' });
            onClose();
          }
        } catch {
          Alert.alert('Error', 'Failed to share to profile');
        }
      },
    },
    {
      id: 'share_native',
      label: 'Share via...',
      icon: 'share-social-outline',
      color: '#6C63FF',
      action: async () => {
        try {
          await Share.share({
            message: `${sharedPost.title}\n\n${sharedPost.postText || sharedPost.message}\n\nShared via FlyBook`,
          });
          onClose();
        } catch {
          Alert.alert('Error', 'Failed to share post');
        }
      },
    },
    {
      id: 'copy_link',
      label: 'Copy Link',
      icon: 'copy-outline',
      color: '#43CBFF',
      action: () => { Alert.alert('Success', 'Link copied to clipboard!'); onClose(); },
    },
    {
      id: 'save',
      label: 'Save Post',
      icon: 'bookmark-outline',
      color: '#F9A826',
      action: () => { Alert.alert('Saved', 'Post added to your bookmarks'); onClose(); },
    },
    {
      id: 'report',
      label: 'Report',
      icon: 'flag-outline',
      color: '#FF6584',
      action: () => { Alert.alert('Reported', 'Thank you for reporting this post.'); onClose(); },
    },
    {
      id: 'hide',
      label: 'Hide',
      icon: 'eye-off-outline',
      color: '#999',
      action: () => { Alert.alert('Hidden', 'This post will no longer appear in your feed.'); onClose(); },
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#475569' : '#DDD'} />
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

const PostCard = ({
  item,
  onShare,
  onLike,
  isLiking,
  currentUserId,
}: {
  item: Post;
  onShare: (post: Post) => void;
  onLike: (postId: string, isLiked: boolean) => void;
  isLiking: boolean;
  currentUserId?: string;
}) => {
  const { isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const imageSource = item.postImage || item.image;
  const categoryColor = getCategoryColor(item.category);
  const isLiked = currentUserId && item.likedBy?.includes(currentUserId);
  const commentCount = item.comments?.length || 0;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={[styles.card, isDark && { backgroundColor: '#1e293b', shadowColor: '#000' }]}
      onPress={() => navigation.navigate('PostDetails', { post: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardMeta}>
          <Text style={[styles.dateText, isDark && { color: '#64748b' }]}>{formatDate(item.createdAt)}</Text>
        </View>
        {item.category ? (
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '22' }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>{item.category}</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.title, isDark && { color: '#f8fafc' }]} numberOfLines={2}>
        {item.title}
      </Text>

      {(item.postText || item.message) ? (
        <Text style={[styles.body, isDark && { color: '#94a3b8' }]} numberOfLines={3}>
          {item.postText || item.message}
        </Text>
      ) : null}

      {imageSource ? (
        <TouchableOpacity
          onPress={() => navigation.navigate('FullImageViewer', { imageUrl: imageSource })}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: imageSource }}
            style={[styles.coverImage, isDark && { backgroundColor: '#334155' }]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ) : null}

      <View style={[styles.cardFooter, isDark && { borderTopColor: '#334155' }]}>
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => onLike(item._id, !!isLiked)}
            disabled={isLiking}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? '#FF6584' : (isDark ? '#94a3b8' : '#6B7280')}
            />
            <Text style={[styles.actionText, isLiked ? { color: '#FF6584' } : (isDark && { color: '#94a3b8' })]}>
              {item.likes ?? 0}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionItem}>
            <Ionicons name="chatbubble-outline" size={20} color={isDark ? '#94a3b8' : '#6B7280'} />
            <Text style={[styles.actionText, isDark && { color: '#94a3b8' }]}>{commentCount}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onShare(item)}
          style={styles.shareIconBtn}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          className="flex-row items-center space-x-1"
        >
          <Ionicons name="share-social-outline" size={20} color={isDark ? '#38bdf8' : '#6C63FF'} />
          <Text style={[styles.shareText, isDark && { color: '#38bdf8' }]}>{item.shares || 0}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const EmptyState = ({ activeCategory, onReset, onRefresh }: { activeCategory: string; onReset: () => void; onRefresh: () => void }) => {
  const { isDark } = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{activeCategory === 'All' ? '📚' : '🔍'}</Text>
      <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>
        {activeCategory === 'All' ? 'No posts yet' : `No "${activeCategory}" posts`}
      </Text>
      <Text style={[styles.emptySubtitle, isDark && { color: '#94a3b8' }]}>
        {activeCategory === 'All'
          ? 'Be the first to share something!'
          : 'No posts in this category yet.'}
      </Text>
      {activeCategory !== 'All' && (
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: '#6C63FF', marginBottom: 12 }]} onPress={onReset}>
          <Text style={styles.retryButtonText}>View All Posts</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[styles.retryButton, isDark && { backgroundColor: '#0f766e' }]} onPress={onRefresh}>
        <Text style={styles.retryButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

const ErrorState = ({ onRetry }: { onRetry: () => void }) => {
  const { isDark } = useTheme();
  return (
    <View style={[styles.centerContainer, isDark && { backgroundColor: '#0f172a' }]}>
      <Text style={styles.emptyIcon}>😥</Text>
      <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>Something went wrong</Text>
      <Text style={[styles.emptySubtitle, isDark && { color: '#94a3b8' }]}>Couldn't load posts. Please try again.</Text>
      <TouchableOpacity style={[styles.retryButton, isDark && { backgroundColor: '#0f766e' }]} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const LoadingState = () => (
  <View style={styles.listContent}>
    {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const Home = () => {
  const { isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isShareSheetVisible, setShareSheetVisible] = useState(false);
  const [likingPosts, setLikingPosts] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState('All');
  const [tobNavHeight, setTobNavHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  useScrollToTop(flatListRef);

  // Scroll-aware filter bar
  const filterTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isFilterVisible = useRef(true);

  const handleScroll = useCallback(
    (event: any) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      // Only trigger after scrolled past initial area
      if (currentY < 10) {
        // Always show at top
        if (!isFilterVisible.current) {
          isFilterVisible.current = true;
          Animated.spring(filterTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 18,
            stiffness: 200,
          }).start();
        }
        return;
      }

      if (diff > 3 && isFilterVisible.current) {
        // Scrolling DOWN → hide filter
        isFilterVisible.current = false;
        Animated.timing(filterTranslateY, {
          toValue: -FILTER_BAR_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }).start();
      } else if (diff < -3 && !isFilterVisible.current) {
        // Scrolling UP → show filter
        isFilterVisible.current = true;
        Animated.spring(filterTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 200,
        }).start();
      }
    },
    [filterTranslateY],
  );

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['homeCategories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 10,
  });

  const categories = categoriesData ?? [];

  const handleShare = (p: Post) => {
    setSelectedPost(p);
    setShareSheetVisible(true);
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user?._id) return;

    const queryKey = ['posts', activeCategory];
    const previousData = queryClient.getQueryData<any>(queryKey);

    if (previousData) {
      const newPages = previousData.pages.map((page: any) => ({
        ...page,
        posts: page.posts.map((p: Post) =>
          p._id === postId
            ? {
              ...p,
              likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1,
              likedBy: isLiked
                ? p.likedBy.filter((id) => id !== user._id)
                : [...(p.likedBy || []), user._id],
            }
            : p,
        ),
      }));
      queryClient.setQueryData(queryKey, { ...previousData, pages: newPages });
    }

    try {
      const endpoint = isLiked ? '/admin-post/unlike' : '/admin-post/like';
      const response = await post<{ success: boolean }>(endpoint, { postId });
      if (!response?.success) queryClient.setQueryData(queryKey, previousData);
    } catch {
      queryClient.setQueryData(queryKey, previousData);
    }
  };

  const handleCategorySelect = useCallback((cat: string) => {
    if (cat === activeCategory) return;
    setActiveCategory(cat);
    // Reset the infinite query for the new category
    queryClient.removeQueries({ queryKey: ['posts', cat] });
  }, [activeCategory, queryClient]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
    error,
  } = useInfiniteQuery({
    queryKey: ['posts', activeCategory],
    queryFn: fetchPosts(activeCategory),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: !!user?._id,
    staleTime: 1000 * 60 * 5,
  });

  const allPosts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) || [],
    [data],
  );

  const showSkeleton = isLoading && allPosts.length === 0;

  return (
    <View style={[styles.screen, isDark && { backgroundColor: '#0f172a' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#0f172a' : '#F7F7FB'}
      />
      {/* Measure TobNav height dynamically so the absolute filter bar sits exactly below it */}
      <View
        style={{ zIndex: 20, elevation: 20 }}
        onLayout={(e) => setTobNavHeight(e.nativeEvent.layout.height)}
      >
        <TobNav navigation={navigation} />
      </View>

      {/* ── Filter bar: absolutely positioned floating over content ── */}
      {showSkeleton ? (
        <LoadingState />
      ) : error && allPosts.length === 0 ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={allPosts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PostCard
              item={item}
              onShare={handleShare}
              onLike={handleLike}
              isLiking={!!likingPosts[item._id]}
              currentUserId={user?._id}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: tobNavHeight > 0 ? FILTER_BAR_HEIGHT + 4 : FILTER_BAR_HEIGHT + 4 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={isDark ? '#2dd4bf' : '#6C63FF'}
              colors={[isDark ? '#2dd4bf' : '#6C63FF']}
            />
          }
          ListEmptyComponent={
            <EmptyState
              activeCategory={activeCategory}
              onReset={() => setActiveCategory('All')}
              onRefresh={refetch}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={isDark ? '#2dd4bf' : '#6C63FF'} />
              </View>
            ) : null
          }
        />
      )}

      {/* Absolutely-positioned filter bar — floats below TobNav, hides on scroll down */}
      {tobNavHeight > 0 && (
        <CategoryFilterBar
          categories={categories}
          activeCategory={activeCategory}
          onSelect={handleCategorySelect}
          isDark={isDark}
          translateY={filterTranslateY}
          top={tobNavHeight}
        />
      )}

      <ShareSheet
        visible={isShareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        post={selectedPost}
      />
    </View>
  );
};

export default Home;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F7FB' },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, flexGrow: 1 },
  separator: { height: 12 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, marginRight: 10 },
  avatarFallback: { backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cardMeta: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  dateText: { fontSize: 12, color: '#999', marginTop: 1 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  categoryText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  title: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', lineHeight: 23, marginBottom: 6 },
  body: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 10 },
  coverImage: { width: '100%', height: 180, borderRadius: 10, marginBottom: 12, backgroundColor: '#F0F0F8' },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F8', width: '100%',
  },
  likeRow: { flexDirection: 'row', alignItems: 'center' },
  heartIcon: { fontSize: 15, color: '#FF6584', marginRight: 5 },
  likeCount: { fontSize: 13, color: '#888', fontWeight: '500' },
  shareIconBtn: { padding: 8 },
  shareText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  actionGroup: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4 },
  actionText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 12,
  },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 20, textAlign: 'center' },
  sheetOptions: { marginBottom: 16 },
  sheetOptionList: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F8' },
  optionIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  optionLabelList: { flex: 1, fontSize: 15, color: '#1A1A2E', fontWeight: '500' },
  cancelButton: { marginTop: 8, backgroundColor: '#F7F7FB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: '#FF6584' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F7FB', padding: 24 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, padding: 24 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#888' },
  retryButton: { backgroundColor: '#6C63FF', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24 },
  retryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});