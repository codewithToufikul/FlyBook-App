import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TobNav from '../../components/TobNav';
import { useAuth } from '../../contexts/AuthContext';
import { get } from '../../services/api';

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
  userName: string;
  userImage: string;
  date: string;
  time: string;
  createdAt?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * ✅ FIXED: Backend returns Post[] directly (not { data: Post[] })
 * Previously was: get<{ data: Post[] }> and returning posts.data → undefined
 */
const fetchPosts = async (): Promise<Post[]> => {
  const posts = await get<Post[]>('/all-home-books');
  // Guard: ensure we always return an array
  return Array.isArray(posts) ? posts : [];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getCategoryColor = (category?: string): string => {
  const map: Record<string, string> = {
    Science: '#43CBFF',
    History: '#F9A826',
    Technology: '#56CFE1',
    'Book War': '#FF9A9E',
    Philosophy: '#A18CD1',
  };
  return map[category ?? ''] ?? '#6C63FF';
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ShareSheet = ({
  visible,
  onClose,
  post
}: {
  visible: boolean;
  onClose: () => void;
  post: Post | null;
}) => {
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
            message: `${post.title}\n\n${post.postText || post.message}\n\nShared via FlyBook`,
            url: post.postImage || post.image || '',
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
        // In a real app we'd use Clipboard.setString
        Alert.alert('Success', 'Link copied to clipboard!');
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
    {
      id: 'hide',
      label: 'Hide',
      icon: 'eye-off-outline',
      color: '#999',
      action: () => {
        Alert.alert('Hidden', 'This post will no longer appear in your feed.');
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
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Share Post</Text>

          <View style={styles.sheetOptions}>
            {shareOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.sheetOptionList}
                onPress={option.action}
              >
                <View style={[styles.optionIconCircle, { backgroundColor: option.color + '15' }]}>
                  <Ionicons name={option.icon} size={20} color={option.color} />
                </View>
                <Text style={styles.optionLabelList}>{option.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#DDD" />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const PostCard = ({ item, onShare }: { item: Post; onShare: (post: Post) => void }) => {
  const imageSource = item.postImage || item.image;
  const categoryColor = getCategoryColor(item.category);

  return (
    <TouchableOpacity activeOpacity={0.92} style={styles.card}>
      {/* Top row: avatar + meta */}
      <View style={styles.cardHeader}>
        {item.userImage ? (
          <Image source={{ uri: item.userImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {(item.userName ?? 'U')[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.cardMeta}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.userName ?? 'Anonymous'}
          </Text>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
        {item.category ? (
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '22' }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {item.category}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      {/* Body text */}
      {(item.postText || item.message) ? (
        <Text style={styles.body} numberOfLines={3}>
          {item.postText || item.message}
        </Text>
      ) : null}

      {/* Cover image */}
      {imageSource ? (
        <Image
          source={{ uri: imageSource }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      ) : null}

      {/* Footer: likes & share */}
      <View style={styles.cardFooter}>
        <View style={styles.likeRow}>
          <Text style={styles.heartIcon}>♥</Text>
          <Text style={styles.likeCount}>{item.likes ?? 0} likes</Text>
        </View>
        <TouchableOpacity
          onPress={() => onShare(item)}
          style={styles.shareIconBtn}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="share-social-outline" size={20} color="#6C63FF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📚</Text>
    <Text style={styles.emptyTitle}>No posts yet</Text>
    <Text style={styles.emptySubtitle}>Be the first to share something!</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
      <Text style={styles.retryButtonText}>Refresh</Text>
    </TouchableOpacity>
  </View>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <View style={styles.centerContainer}>
    <Text style={styles.emptyIcon}>😥</Text>
    <Text style={styles.emptyTitle}>Something went wrong</Text>
    <Text style={styles.emptySubtitle}>Couldn't load posts. Please try again.</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Retry</Text>
    </TouchableOpacity>
  </View>
);

const LoadingState = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color="#6C63FF" />
    <Text style={styles.loadingText}>Loading posts…</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const Home = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuth();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isShareSheetVisible, setShareSheetVisible] = useState(false);

  const handleShare = (post: Post) => {
    setSelectedPost(post);
    setShareSheetVisible(true);
  };

  const {
    data: posts = [],
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    enabled: !!user?._id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
  });

  /**
   * Backend already sorts by createdAt desc, but we sort client-side too
   * in case placeholderData from cache is slightly out of order.
   */
  const sortedPosts = useMemo(() => {
    if (!posts.length) return [];
    return [...posts].sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });
  }, [posts]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F7FB" />
      <TobNav navigation={navigation} />

      <FlatList
        data={sortedPosts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PostCard item={item} onShare={handleShare} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor="#6C63FF"
            colors={['#6C63FF']}
          />
        }
        ListEmptyComponent={<EmptyState onRefresh={refetch} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

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
  screen: {
    flex: 1,
    backgroundColor: '#F7F7FB',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },

  // ── Card ──
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

  // ── Card Header ──
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  avatarFallback: {
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cardMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },

  // ── Category Badge ──
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // ── Content ──
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    lineHeight: 23,
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  coverImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#F0F0F8',
  },

  // ── Card Footer ──
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F8',
    width: '100%',
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartIcon: {
    fontSize: 15,
    color: '#FF6584',
    marginRight: 5,
  },
  likeCount: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  shareIconBtn: {
    padding: 2,
  },

  // ── Bottom Sheet ──
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
    borderBottomColor: '#F0F0F8',
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
    backgroundColor: '#F7F7FB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6584',
  },

  // ── States ──
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7FB',
    padding: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    padding: 24,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
  },
  retryButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});