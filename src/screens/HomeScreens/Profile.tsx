import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { get, post } from '../../services/api';
import { handleImageUpload } from '../../utils/imageUpload';
import CustomHeader from '../../components/common/CustomHeader';

interface Post {
  _id: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  likes: string[];
  comments: any[];
  createdAt: string;
}

interface Friend {
  _id: string;
  name: string;
  profileImage: string;
  email: string;
}

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'friends' | 'about'>('posts');
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Default images
  const defaultAvatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
  const defaultCover = 'https://i.ibb.co.com/xmyN9fT/freepik-expand-75906-min.png';

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    await Promise.all([fetchPosts(), fetchFriends()]);
  };

  const fetchPosts = async () => {
    if (!user?._id) {
      setPosts([]);
      return;
    }

    setLoadingPosts(true);
    try {
      const response = await get<{ data: Post[] }>('/opinion/posts');
      if (response?.data && Array.isArray(response.data)) {
        // Filter posts by current user's _id
        const myPosts = response.data.filter((post: any) => post.userId === user._id);
        setPosts(myPosts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]); // Set empty array on error
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      // Backend /all-friends endpoint returns array directly, uses token to identify user
      const response = await get<Friend[]>('/all-friends');

      // Response is directly an array of friends
      if (Array.isArray(response)) {
        setFriends(response);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]); // Set empty array on error to prevent UI issues
    } finally {
      setLoadingFriends(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    await fetchUserData();
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

      // Update profile image on server
      await post('/profile/update', { profileImage: imageUrl });

      // Refresh user data
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

      // Update cover image on server
      await post('/profile/cover/update', { coverImageUrl: imageUrl });

      // Refresh user data
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

  if (!user) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <CustomHeader title='Profile' />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo */}
        <View className="relative">
          <Image
            source={{ uri: user.coverImage || defaultCover }}
            className="w-full h-48"
            resizeMode="cover"
          />

          {/* Upload Cover Photo Button */}
          <TouchableOpacity
            onPress={handleCoverImageUpload}
            disabled={uploadingCover}
            className="absolute bottom-3 right-3 bg-white rounded-full p-2.5 shadow-lg"
            activeOpacity={0.7}
          >
            {uploadingCover ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Ionicons name="camera" size={20} color="#3B82F6" />
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View className="px-4 -mt-16">
          {/* Profile Picture */}
          <View className="items-center">
            <View className="relative">
              <Image
                source={{ uri: user.profileImage || defaultAvatar }}
                className="w-32 h-32 rounded-full border-4 border-white"
              />

              {/* Verified Badge */}
              {user.verified && (
                <View className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1">
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}

              {/* Upload Profile Photo Button */}
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

            {/* User Info */}
            <Text className="text-2xl font-bold text-gray-900 mt-3">
              {user.name}
            </Text>

            {user.userName && (
              <Text className="text-sm text-gray-500 mt-1">
                @{user.userName}
              </Text>
            )}

            {/* Stats */}
            <View className="flex-row items-center gap-6 mt-4">
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-900">{posts.length}</Text>
                <Text className="text-xs text-gray-500">Posts</Text>
              </View>
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-900">{friends.length}</Text>
                <Text className="text-xs text-gray-500">Friends</Text>
              </View>
              <View className="items-center">
                <Text className="text-xl font-bold text-gray-900">{user.coins || 0}</Text>
                <Text className="text-xs text-gray-500">Coins</Text>
              </View>
            </View>

            {/* Wallet Info */}
            {user.flyWallet !== undefined && (
              <View className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl px-6 py-3 mt-4 flex-row items-center gap-2">
                <Ionicons name="wallet" size={20} color="white" />
                <Text className="text-white font-semibold text-base">
                  FlyWallet: {user.flyWallet} coins
                </Text>
              </View>
            )}
          </View>

          {/* Tabs */}
          <View className="flex-row border-b border-gray-200 mt-6">
            <TouchableOpacity
              onPress={() => setActiveTab('posts')}
              className={`flex-1 py-3 ${activeTab === 'posts' ? 'border-b-2 border-blue-500' : ''
                }`}
            >
              <Text
                className={`text-center font-semibold ${activeTab === 'posts' ? 'text-blue-500' : 'text-gray-500'
                  }`}
              >
                Posts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('friends')}
              className={`flex-1 py-3 ${activeTab === 'friends' ? 'border-b-2 border-blue-500' : ''
                }`}
            >
              <Text
                className={`text-center font-semibold ${activeTab === 'friends' ? 'text-blue-500' : 'text-gray-500'
                  }`}
              >
                Friends
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('about')}
              className={`flex-1 py-3 ${activeTab === 'about' ? 'border-b-2 border-blue-500' : ''
                }`}
            >
              <Text
                className={`text-center font-semibold ${activeTab === 'about' ? 'text-blue-500' : 'text-gray-500'
                  }`}
              >
                About
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View className="mt-4">
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <View>
                {loadingPosts ? (
                  <View className="py-8">
                    <ActivityIndicator size="large" color="#3B82F6" />
                  </View>
                ) : posts.length === 0 ? (
                  <View className="bg-white rounded-xl p-8 items-center">
                    <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-3 text-center">
                      No posts yet
                    </Text>
                  </View>
                ) : (
                  posts.map((post) => (
                    <View
                      key={post._id}
                      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                    >
                      <Text className="text-gray-800 mb-3">{post.description}</Text>

                      {post.imageUrl && (
                        <Image
                          source={{ uri: post.imageUrl }}
                          className="w-full h-64 rounded-lg"
                          resizeMode="cover"
                        />
                      )}

                      <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="heart-outline" size={18} color="#6B7280" />
                          <Text className="text-gray-600 text-sm">
                            {post.likes?.length || 0}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
                          <Text className="text-gray-600 text-sm">
                            {post.comments?.length || 0}
                          </Text>
                        </View>
                        <Text className="text-gray-400 text-xs ml-auto">
                          {formatDate(post.createdAt)}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <View>
                {loadingFriends ? (
                  <View className="py-8">
                    <ActivityIndicator size="large" color="#3B82F6" />
                  </View>
                ) : friends.length === 0 ? (
                  <View className="bg-white rounded-xl p-8 items-center">
                    <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-3 text-center">
                      No friends yet
                    </Text>
                  </View>
                ) : (
                  friends.map((friend) => (
                    <View
                      key={friend._id}
                      className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm"
                    >
                      <Image
                        source={{ uri: friend.profileImage || defaultAvatar }}
                        className="w-14 h-14 rounded-full"
                      />
                      <View className="flex-1 ml-3">
                        <Text className="text-gray-900 font-semibold text-base">
                          {friend.name}
                        </Text>
                        <Text className="text-gray-500 text-sm mt-0.5">
                          {friend.email}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>
                  ))
                )}
              </View>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <View className="bg-white rounded-xl p-4">
                {/* Contact Info */}
                <View className="mb-6">
                  <Text className="text-lg font-bold text-gray-900 mb-3">
                    Contact Information
                  </Text>

                  {user.email && (
                    <View className="flex-row items-center py-3 border-b border-gray-100">
                      <Ionicons name="mail-outline" size={20} color="#6B7280" />
                      <Text className="ml-3 text-gray-700 flex-1">{user.email}</Text>
                    </View>
                  )}

                  {user.phone && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${user.phone}`)}
                      className="flex-row items-center py-3 border-b border-gray-100"
                    >
                      <Ionicons name="call-outline" size={20} color="#6B7280" />
                      <Text className="ml-3 text-gray-700 flex-1">{user.phone}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Work & Education */}
                {(user.work || user.studies) && (
                  <View className="mb-6">
                    <Text className="text-lg font-bold text-gray-900 mb-3">
                      Work & Education
                    </Text>

                    {user.work && (
                      <View className="flex-row items-center py-3 border-b border-gray-100">
                        <Ionicons name="briefcase-outline" size={20} color="#6B7280" />
                        <Text className="ml-3 text-gray-700 flex-1">{user.work}</Text>
                      </View>
                    )}

                    {user.studies && (
                      <View className="flex-row items-center py-3 border-b border-gray-100">
                        <Ionicons name="school-outline" size={20} color="#6B7280" />
                        <Text className="ml-3 text-gray-700 flex-1">{user.studies}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Location */}
                {(user.currentCity || user.hometown) && (
                  <View className="mb-6">
                    <Text className="text-lg font-bold text-gray-900 mb-3">
                      Location
                    </Text>

                    {user.currentCity && (
                      <View className="flex-row items-center py-3 border-b border-gray-100">
                        <Ionicons name="location-outline" size={20} color="#6B7280" />
                        <View className="ml-3 flex-1">
                          <Text className="text-gray-500 text-xs">Current City</Text>
                          <Text className="text-gray-700">{user.currentCity}</Text>
                        </View>
                      </View>
                    )}

                    {user.hometown && (
                      <View className="flex-row items-center py-3 border-b border-gray-100">
                        <Ionicons name="home-outline" size={20} color="#6B7280" />
                        <View className="ml-3 flex-1">
                          <Text className="text-gray-500 text-xs">Hometown</Text>
                          <Text className="text-gray-700">{user.hometown}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Account Info */}
                <View className="mb-4">
                  <Text className="text-lg font-bold text-gray-900 mb-3">
                    Account Details
                  </Text>

                  <View className="flex-row items-center py-3 border-b border-gray-100">
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-500 text-xs">Joined</Text>
                      <Text className="text-gray-700">
                        {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {user.verified && (
                    <View className="flex-row items-center py-3 border-b border-gray-100">
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text className="ml-3 text-green-600 font-semibold">
                        Verified Account
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;
