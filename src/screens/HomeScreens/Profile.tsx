import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
  Modal,
  Pressable,
  Share,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { get, post, put, del } from '../../services/api';
import { handleImageUpload } from '../../utils/imageUpload';
import CustomHeader from '../../components/common/CustomHeader';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import Clipboard from '@react-native-clipboard/clipboard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../contexts/ThemeContext';
import VideoPlayer from '../../components/VideoPlayer';

const { width } = Dimensions.get('window');

interface Post {
  _id: string;
  userId: string;
  userName?: string;
  userProfileImage?: string;
  description: string;
  image?: string;
  imageUrl?: string; // Some apis use imageUrl, some use image
  images?: string[];
  pdf?: string;
  likes: any; // Can be count or array of IDs depending on endpoint
  likedBy: string[];
  comments: any[];
  video?: string;
  isShared?: boolean;
  shares?: number;
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
  createdAt: string;
  date?: string;
  time?: string;
}

interface Friend {
  _id: string;
  name: string;
  profileImage: string;
  email: string;
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
      id: 'share_profile',
      label: 'Share to Profile',
      icon: 'repeat-outline',
      color: '#10b981',
      action: async () => {
        try {
          const res = await post<{ success: boolean }>('/opinion/share', {
            postId: postItem._id,
            postType: postItem.originalPostData?.postType || 'opinion'
          });
          if (res?.success) {
            Toast.show({ type: 'success', text1: 'Shared to your profile!' });
            onClose();
          }
        } catch { Alert.alert('Error', 'Failed to share to profile'); }
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
            message: `${postItem.userName || 'Someone'}'s Opinion: ${postItem.description}\n\nShared via FlyBook`,
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
        Clipboard.setString(`https://flybook.com.bd/opinion-post/${postItem._id}`);
        Toast.show({ type: 'success', text1: 'Link copied!' });
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
          <Text style={[styles.sheetTitle, isDark && { color: '#f8fafc' }]}>Share Opinion</Text>

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
const PostOptionsSheet = ({
  visible,
  onClose,
  post,
  onEdit,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  post: Post | null;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
}) => {
  const { isDark } = useTheme();
  if (!post) return null;

  const options = [
    {
      id: 'edit',
      label: 'Edit Post',
      icon: 'create-outline',
      color: '#3B82F6',
      action: () => {
        onEdit(post);
        onClose();
      },
    },
    {
      id: 'delete',
      label: 'Delete Post',
      icon: 'trash-outline',
      color: '#EF4444',
      action: () => {
        onDelete(post);
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
          <Text style={[styles.sheetTitle, isDark && { color: '#f8fafc' }]}>Post Options</Text>

          <View style={styles.sheetOptions}>
            {options.map((option) => (
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

const Profile = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'posts' | 'friends' | 'about'>('posts');
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isShareSheetVisible, setShareSheetVisible] = useState(false);
  const [isOptionsSheetVisible, setOptionsSheetVisible] = useState(false);


  // Default images
  const defaultAvatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
  const defaultCover = 'https://i.ibb.co.com/xmyN9fT/freepik-expand-75906-min.png';

  const {
    data: postsData,
    isLoading: loadingPosts,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['profile-posts', user?._id],
    queryFn: async () => {
      if (!user?._id) return [];
      const response = await get<{ success: boolean; data: Post[] }>(`/opinion/posts?userId=${user._id}`);
      return response?.data || [];
    },
    enabled: !!user?._id,
  });

  const {
    data: friendsData,
    isLoading: loadingFriends,
    refetch: refetchFriends
  } = useQuery({
    queryKey: ['profile-friends'],
    queryFn: async () => {
      const response = await get<Friend[]>('/all-friends');
      return Array.isArray(response) ? response : [];
    },
  });

  const posts = postsData || [];
  const friends = friendsData || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshUser(),
      refetchPosts(),
      refetchFriends()
    ]);
    setRefreshing(false);
  };

  const handleProfileImageUpload = async () => {
    try {
      setUploadingProfile(true);
      const imageUrl = await handleImageUpload(undefined, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 85,
      });
      await put('/profile/update', { profileImageUrl: imageUrl });
      await refreshUser();
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error: any) {
      if (error.message !== 'User cancelled' &&
        error.message !== 'User cancelled image picker' &&
        error.message !== 'User cancelled camera') {
        console.error('Error uploading profile image:', error);
        Alert.alert('Error', 'Failed to upload profile photo. Please try again.');
      }
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleCoverImageUpload = async () => {
    try {
      setUploadingCover(true);
      const imageUrl = await handleImageUpload(undefined, {
        maxWidth: 1200,
        maxHeight: 600,
        quality: 85,
      });
      await put('/profile/cover/update', { coverImageUrl: imageUrl });
      await refreshUser();
      Alert.alert('Success', 'Cover photo updated successfully!');
    } catch (error: any) {
      if (error.message !== 'User cancelled' &&
        error.message !== 'User cancelled image picker' &&
        error.message !== 'User cancelled camera') {
        console.error('Error uploading cover image:', error);
        Alert.alert('Error', 'Failed to upload cover photo. Please try again.');
      }
    } finally {
      setUploadingCover(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    if (time.length < 5) return time;
    return time.slice(0, -6) + time.slice(-3);
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
    if (!user?._id) return;

    // Optimistic Update with React Query
    const queryKey = ['profile-posts', user?._id];
    const previousPosts = queryClient.getQueryData<Post[]>(queryKey);

    if (previousPosts) {
      queryClient.setQueryData<Post[]>(queryKey, (old) => {
        return old?.map((p: Post) => {
          if (p._id === postId) {
            return {
              ...p,
              likes: isLiked ? Math.max(0, (Number(p.likes) || 0) - 1) : (Number(p.likes) || 0) + 1,
              likedBy: isLiked
                ? (p.likedBy || []).filter((id: string) => id !== user._id)
                : [...(p.likedBy || []), user._id]
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

  const navigateToOriginalPost = (originalData: any) => {
    if (!originalData) return;
    if (originalData.postType === 'home') {
      navigation.navigate('PostDetails', { post: { _id: originalData.postId } });
    } else {
      navigation.navigate('OpinionDetails', { post: { _id: originalData.postId } });
    }
  };

  const handlePostOptions = (postItem: Post) => {
    setSelectedPost(postItem);
    setOptionsSheetVisible(true);
  };

  const handlePostEdit = (postItem: Post) => {
    navigation.navigate('EditOpinion', { post: postItem });
  };

  const handlePostDelete = (postItem: Post) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await del<{ success: boolean }>(`/opinion/delete/${postItem._id}`);
              if (response?.success) {
                queryClient.invalidateQueries({ queryKey: ['profile-posts', user?._id] });
                Toast.show({ type: 'success', text1: 'Post deleted successfully' });
              } else {
                Toast.show({ type: 'error', text1: 'Failed to delete post' });
              }
            } catch (error) {
              console.error('Delete error:', error);
              Toast.show({ type: 'error', text1: 'An error occurred' });
            }
          }
        }
      ]
    );
  };


  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}>
      <CustomHeader title='Profile' showSettingsIcon={true} />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[isDark ? '#2dd4bf' : '#0f766e']}
            tintColor={isDark ? '#2dd4bf' : '#0f766e'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo */}
        <View className="relative">
          <TouchableOpacity
            onPress={() => navigation.navigate('FullImageViewer', { imageUrl: user.coverImage || defaultCover })}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: user.coverImage || defaultCover }}
              className="w-full h-48 bg-slate-200 dark:bg-slate-800"
              resizeMode="cover"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCoverImageUpload}
            disabled={uploadingCover}
            className="absolute bottom-3 right-3 bg-white dark:bg-slate-800 rounded-full p-2.5 shadow-lg"
            activeOpacity={0.7}
          >
            {uploadingCover ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Ionicons name="camera" size={20} color={isDark ? "#94A3B8" : "#3B82F6"} />
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View className="px-4 -mt-16">
          <View className="items-center">
            <View className="relative">
              <TouchableOpacity
                onPress={() => navigation.navigate('FullImageViewer', { imageUrl: user.profileImage || defaultAvatar })}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: user.profileImage || defaultAvatar }}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800"
                />
              </TouchableOpacity>
              {user.verified && (
                <View className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1">
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
              <TouchableOpacity
                onPress={handleProfileImageUpload}
                disabled={uploadingProfile}
                className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-2"
                activeOpacity={0.7}
              >
                {uploadingProfile ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="camera" size={16} color="white" />
                )}
              </TouchableOpacity>
            </View>

            <Text className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-3">{user.name}</Text>
            {user.userName && <Text className="text-sm text-gray-500 dark:text-slate-400 mt-1">@{user.userName}</Text>}

            <View className="flex-row items-center gap-6 mt-4">
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-900 dark:text-slate-100">{posts.length}</Text>
                <Text className="text-xs text-gray-500 dark:text-slate-400">Posts</Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveTab('friends')}
                className="items-center"
                activeOpacity={0.7}
              >
                <Text className="text-xl font-bold text-gray-900 dark:text-slate-100">{friends.length}</Text>
                <Text className="text-xs text-gray-500 dark:text-slate-400">Friends</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Wallet')}
                className="items-center"
                activeOpacity={0.7}
              >
                <Text className="text-xl font-bold text-gray-900 dark:text-slate-100">{Number(user.flyWallet || user.coins || 0).toFixed(2)}</Text>
                <Text className="text-xs text-gray-500 dark:text-slate-400">Wallet</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <View className={`flex-row border-b ${isDark ? 'border-slate-800' : 'border-gray-200'} mt-6`}>
            {(['posts', 'friends', 'about'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 ${activeTab === tab ? `border-b-2 ${isDark ? 'border-teal-500' : 'border-blue-500'}` : ''}`}
              >
                <Text className={`text-center font-semibold capitalize ${activeTab === tab ? (isDark ? 'text-teal-500' : 'text-blue-500') : 'text-gray-500 dark:text-slate-400'}`}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <View className="mt-4">
            {activeTab === 'posts' && (
              <View>
                {loadingPosts ? (
                  <View className="py-8"><ActivityIndicator size="large" color="#3B82F6" /></View>
                ) : posts.length === 0 ? (
                  <View className="bg-white dark:bg-slate-900 rounded-xl p-8 items-center border border-gray-100 dark:border-slate-800">
                    <Ionicons name="document-text-outline" size={48} color={isDark ? "#475569" : "#9CA3AF"} />
                    <Text className="text-gray-500 dark:text-slate-400 mt-3 text-center">No posts yet</Text>
                  </View>
                ) : (
                  posts.map((postItem) => (
                    <View key={postItem._id} style={[styles.postCard, isDark && { backgroundColor: '#1e293b', borderBottomWidth: 0, shadowOpacity: 0 }]}>
                      {/* User Header */}
                      <View style={[styles.userHeader, isDark && { borderBottomColor: '#334155' }]}>
                        <Image
                          source={{ uri: postItem.userProfileImage || user.profileImage || defaultAvatar }}
                          style={styles.userImage}
                        />
                        <View style={styles.userInfo}>
                          <Text style={[styles.userName, isDark && { color: '#f8fafc' }]}>{postItem.userName || user.name}</Text>
                          <Text style={[styles.postTime, isDark && { color: '#94a3b8' }]}>
                            {postItem.date || formatDate(postItem.createdAt)} {postItem.time ? `at ${formatTime(postItem.time)}` : ''}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handlePostOptions(postItem)}
                          className="p-2"
                        >
                          <Ionicons name="ellipsis-horizontal" size={20} color={isDark ? "#94a3b8" : "#6B7280"} />
                        </TouchableOpacity>
                      </View>

                      {/* Description */}
                      <TouchableOpacity
                        style={styles.descriptionContainer}
                        onPress={() => navigateToPostDetail(postItem)}
                        activeOpacity={0.8}
                      >
                        {postItem.isShared && <Text style={[styles.sharedText, { color: isDark ? '#94a3b8' : '#64748B' }]}><Ionicons name="repeat" size={14} /> Shared a post</Text>}
                        <Text style={[styles.description, isDark && { color: '#cbd5e1' }]}>
                          {truncateText(postItem.description, 180)}
                        </Text>
                        {postItem.description.length > 180 && (
                          <TouchableOpacity
                            onPress={() => navigateToPostDetail(postItem)}
                            style={styles.readMoreButton}
                          >
                            <Text style={[styles.readMoreText, isDark && { color: '#2dd4bf' }]}>Read More</Text>
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>

                      {/* Original Post Content (if Shared) */}
                      {postItem.isShared && postItem.originalPostData && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => navigateToOriginalPost(postItem.originalPostData)}
                          style={[styles.originalPostContainer, { borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor: isDark ? '#0f172a' : '#F8FAFC' }]}
                        >
                          <View style={styles.originalAuthorRow}>
                            <Image source={{ uri: postItem.originalPostData.authorImage }} style={styles.originalAvatar} />
                            <View>
                              <Text style={[styles.originalAuthorName, { color: isDark ? '#f8fafc' : '#1e293b' }]}>{postItem.originalPostData.authorName}</Text>
                              <Text style={[styles.originalMetaText, { color: isDark ? '#64748b' : '#94a3b8' }]}>{postItem.originalPostData.createdAt ? new Date(postItem.originalPostData.createdAt).toLocaleDateString() : ''}</Text>
                            </View>
                          </View>
                          <Text style={[styles.originalBodyText, { color: isDark ? '#cbd5e1' : '#334155' }]} numberOfLines={3}>
                            {postItem.originalPostData.description}
                          </Text>
                          {/* Shared Post Multiple Images */}
                          {postItem.originalPostData.images && postItem.originalPostData.images.length > 1 ? (
                            <View style={[styles.originalPostImg, { overflow: 'hidden' }]}>
                              <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled>
                                {postItem.originalPostData.images.map((img, idx) => (
                                  <View key={idx}>
                                    <Image source={{ uri: img }} style={styles.originalPostImg} resizeMode="cover" />
                                    <View style={styles.imgBadge}>
                                      <Text style={styles.imgBadgeText}>{idx + 1}/{postItem.originalPostData?.images?.length}</Text>
                                    </View>
                                  </View>
                                ))}
                              </ScrollView>
                            </View>
                          ) : (postItem.originalPostData.images && postItem.originalPostData.images[0]) || postItem.originalPostData.image ? (
                            <Image source={{ uri: (postItem.originalPostData.images && postItem.originalPostData.images[0]) || postItem.originalPostData.image }} style={styles.originalPostImg} resizeMode="cover" />
                          ) : null}
                          {postItem.originalPostData.video && (
                            <View style={styles.originalVideoHint}>
                              <Ionicons name="play-circle" size={20} color={isDark ? '#64748b' : '#94a3b8'} />
                              <Text style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 12 }}>Contains video</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* PDF */}
                      {postItem.pdf && (
                        <TouchableOpacity
                          onPress={() => handlePdfView(postItem.pdf!)}
                          style={[styles.pdfContainer, isDark && { backgroundColor: '#334155' }]}
                        >
                          <Ionicons name="document-text" size={24} color="#ef4444" />
                          <Text style={[styles.pdfText, isDark && { color: '#f8fafc' }]}>View PDF</Text>
                        </TouchableOpacity>
                      )}

                      {/* Image */}
                      {postItem.images && postItem.images.length > 1 ? (
                        <View style={styles.multiImgWrap}>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled>
                            {postItem.images.map((img, idx) => (
                              <TouchableOpacity key={idx} onPress={() => navigation.navigate('FullImageViewer', { imageUrl: img })} activeOpacity={0.95}>
                                <Image source={{ uri: img }} style={styles.multiPostImg} resizeMode="cover" />
                                <View style={styles.imgBadge}>
                                  <Text style={styles.imgBadgeText}>{idx + 1}/{postItem.images?.length}</Text>
                                </View>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      ) : (postItem.images && postItem.images.length === 1) || postItem.image || postItem.imageUrl ? (
                        <TouchableOpacity
                          onPress={() => navigation.navigate('FullImageViewer', { imageUrl: (postItem.images && postItem.images[0]) || postItem.image || postItem.imageUrl })}
                          activeOpacity={0.9}
                          style={[styles.imageContainer, isDark && { backgroundColor: '#0f172a' }]}
                        >
                          <Image
                            source={{ uri: (postItem.images && postItem.images[0]) || postItem.image || postItem.imageUrl }}
                            style={styles.postImage}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ) : null}

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
                      <View style={[styles.actionsContainer, isDark && { borderTopColor: '#334155' }]}>
                        <View style={styles.likeContainer}>
                          <TouchableOpacity
                            onPress={() => handleLikeToggle(postItem._id, !!(user && postItem.likedBy?.includes(user._id)))}
                            style={styles.likeButton}
                          >
                            <Ionicons
                              name={user && postItem.likedBy?.includes(user._id) ? "heart" : "heart-outline"}
                              size={28}
                              color={user && postItem.likedBy?.includes(user._id) ? "#ef4444" : (isDark ? "#94a3b8" : "#6B7280")}
                            />
                          </TouchableOpacity>
                          <Text style={[styles.likesText, isDark && { color: '#cbd5e1' }]}>{postItem.likes || 0} Likes</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.commentIconContainer}
                          onPress={() => navigateToPostDetail(postItem)}
                        >
                          <Ionicons name="chatbubble-outline" size={24} color={isDark ? "#94a3b8" : "#6B7280"} />
                          <Text style={[styles.commentCountText, isDark && { color: '#cbd5e1' }]}>{postItem.comments?.length || 0} Comments</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleShare(postItem)}
                          style={styles.shareButton}
                        >
                          <Ionicons name="share-social-outline" size={24} color={isDark ? "#94a3b8" : "#6B7280"} />
                          <Text style={[styles.shareText, isDark && { color: '#cbd5e1' }]}>{postItem.shares || 0} Shares</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Comments Preview */}
                      {postItem.comments && postItem.comments.length > 0 && (
                        <TouchableOpacity
                          style={styles.commentsPreview}
                          onPress={() => navigateToPostDetail(postItem)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.commentDivider, isDark && { backgroundColor: '#334155' }]} />
                          <View style={[styles.recentCommentsContainer, isDark && { backgroundColor: '#1e293b' }]}>
                            {postItem.comments.slice(0, 2).map((comment: any, idx: number) => (
                              <View key={idx} style={styles.miniCommentRow}>
                                <Image
                                  source={{ uri: comment.userProfileImage || defaultAvatar }}
                                  style={styles.miniCommentUserImage}
                                />
                                <Text style={[styles.miniCommentText, isDark && { color: '#94a3b8' }]} numberOfLines={1}>
                                  <Text style={[styles.miniCommentUserName, isDark && { color: '#f1f5f9' }]}>{comment.userName}: </Text>
                                  {comment.comment}
                                </Text>
                              </View>
                            ))}
                            {postItem.comments.length > 2 && (
                              <Text style={[styles.viewMoreCommentsLink, isDark && { color: '#2dd4bf' }]}>
                                View {postItem.comments.length - 2} more comments...
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {activeTab === 'friends' && (
              <View>
                {loadingFriends ? (
                  <View className="py-8"><ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#3B82F6"} /></View>
                ) : friends.length === 0 ? (
                  <View className="bg-white dark:bg-slate-900 rounded-xl p-8 items-center border border-gray-100 dark:border-slate-800">
                    <Ionicons name="people-outline" size={48} color={isDark ? "#475569" : "#9CA3AF"} />
                    <Text className="text-gray-500 dark:text-slate-400 mt-3 text-center">No friends yet</Text>
                  </View>
                ) : (
                  friends.map((friend) => (
                    <TouchableOpacity
                      key={friend._id}
                      onPress={() => navigation.push('UserProfile', { userId: friend._id })}
                      activeOpacity={0.7}
                      className="bg-white dark:bg-slate-900 rounded-xl p-4 mb-3 flex-row items-center border border-gray-50 dark:border-slate-800 shadow-sm"
                    >
                      <Image source={{ uri: friend.profileImage || defaultAvatar }} className="w-14 h-14 rounded-full" />
                      <View className="flex-1 ml-3">
                        <Text className="text-gray-900 dark:text-slate-100 font-semibold text-base">{friend.name}</Text>
                        <Text className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">{friend.email}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={isDark ? "#475569" : "#9CA3AF"} />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {activeTab === 'about' && (
              <View className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-100 dark:border-slate-800 mb-6">
                <View className="mb-6">
                  <Text className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">Contact Information</Text>
                  {user.email && (
                    <View className="flex-row items-center py-3 border-b border-gray-100 dark:border-slate-800">
                      <Ionicons name="mail-outline" size={20} color={isDark ? "#94a3b8" : "#6B7280"} />
                      <Text className="ml-3 text-gray-700 dark:text-slate-300 flex-1">{user.email}</Text>
                    </View>
                  )}
                  {user.phone && (
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${user.phone}`)} className="flex-row items-center py-3 border-b border-gray-100 dark:border-slate-800">
                      <Ionicons name="call-outline" size={20} color={isDark ? "#94a3b8" : "#6B7280"} />
                      <Text className="ml-3 text-gray-700 dark:text-slate-300 flex-1">{user.phone}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {(user.work || user.studies) && (
                  <View>
                    <Text className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">Work & Education</Text>
                    {user.work && (
                      <View className="flex-row items-center py-3 border-b border-gray-100 dark:border-slate-800">
                        <Ionicons name="briefcase-outline" size={20} color={isDark ? "#94a3b8" : "#6B7280"} />
                        <Text className="ml-3 text-gray-700 dark:text-slate-300 flex-1">{user.work}</Text>
                      </View>
                    )}
                    {user.studies && (
                      <View className="flex-row items-center py-3 border-b border-gray-100 dark:border-slate-800">
                        <Ionicons name="school-outline" size={20} color={isDark ? "#94a3b8" : "#6B7280"} />
                        <Text className="ml-3 text-gray-700 dark:text-slate-300 flex-1">{user.studies}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <ShareSheet
        visible={isShareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        post={selectedPost}
      />
      <PostOptionsSheet
        visible={isOptionsSheetVisible}
        onClose={() => setOptionsSheetVisible(false)}
        post={selectedPost}
        onEdit={handlePostEdit}
        onDelete={handlePostDelete}
      />
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
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
  videoContainer: {
    width: '100%',
    marginBottom: 10,
    overflow: 'hidden',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  sheetOptions: {
    marginBottom: 10,
  },
  sheetOptionList: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionLabelList: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  cancelButton: {
    marginTop: 10,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6584',
  },
  sharedText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPostContainer: {
    margin: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  originalAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  originalAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  originalAuthorName: {
    fontSize: 13,
    fontWeight: '700',
  },
  originalMetaText: {
    fontSize: 10,
  },
  originalBodyText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  originalPostImg: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  originalVideoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  multiImgWrap: {
    width: width - 32,
    height: 300,
    overflow: 'hidden',
  },
  multiPostImg: {
    width: width - 32,
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
});

export default Profile;
