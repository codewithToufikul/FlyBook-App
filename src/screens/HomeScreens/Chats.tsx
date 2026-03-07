import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { get } from '../../services/api';
import { format, isToday, isYesterday } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import ChatSkeleton from '../../components/ChatSkeleton';

interface ChatUser {
  _id: string;
  name: string;
  profileImage?: string;
  isOnline: boolean;
  lastSeen?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  sender?: string;
  unreadCount?: number;
}

const Chats = () => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    data: chatUsers = [],
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['chat-users'],
    queryFn: async () => {
      const response = await get<any>('/api/chat-users');
      return response?.success ? response.users as ChatUser[] : [];
    },
    staleTime: 1000 * 30, // 30 seconds for active chat list
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  });

  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      // Only refetch if we have data to keep it updated, but don't force a full reload UI
      refetch();
    }, [refetch])
  );

  const onRefresh = () => {
    refetch();
  };

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMM d');
  };

  const filteredUsers = chatUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatItem = ({ item, index }: { item: ChatUser, index: number }) => {
    const hasUnread = (item.unreadCount || 0) > 0;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.chatItem}
        onPress={() => (navigation as any).navigate('ChatRoom', { chatUser: item })}
      >
        <TouchableOpacity
          onPress={() => {
            if (item._id === user?._id) {
              (navigation as any).navigate('Home', { screen: 'Profile' });
            } else {
              (navigation as any).navigate('UserProfile', { userId: item._id });
            }
          }}
          style={styles.avatarWrapper}
        >
          <Image
            source={{ uri: item.profileImage || `https://ui-avatars.com/api/?name=${item.name}&background=random` }}
            style={[styles.avatar, isDark && { borderColor: '#334155' }]}
          />
          {item.isOnline && <View style={[styles.onlineStatus, isDark && { borderColor: '#0f172a' }]} />}
        </TouchableOpacity>

        <View style={styles.chatInfo}>
          <View style={styles.rowBetween}>
            <Text style={[styles.userName, isDark && { color: '#f8fafc' }, hasUnread && styles.unreadText]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.timeText, isDark && { color: '#94a3b8' }, hasUnread && styles.unreadTime]}>
              {formatTimestamp(item.lastMessageTime)}
            </Text>
          </View>

          <View style={styles.rowBetween}>
            <Text
              style={[styles.lastMsg, isDark && { color: '#94a3b8' }, hasUnread && styles.unreadLastMsg, hasUnread && isDark && { color: '#f8fafc' }]}
              numberOfLines={1}
            >
              {item.sender === 'You' ? (
                <Text style={[styles.youPrefix, isDark && { color: '#64748b' }]}>You: </Text>
              ) : null}
              {item.lastMessage || 'Start a conversation'}
            </Text>

            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }, isDark && { backgroundColor: '#0f172a' }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0f172a" : "#ffffff"}
      />

      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, isDark && { backgroundColor: '#1e293b' }]}>
            <Ionicons name="chevron-back" size={28} color={isDark ? "#f8fafc" : "#111827"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDark && { color: '#f8fafc' }]}>Messages</Text>
        </View>
        <TouchableOpacity style={[styles.iconBtn, isDark && { backgroundColor: '#1e293b' }]} onPress={() => (navigation as any).navigate('Peoples')}>
          <Ionicons name="create-outline" size={24} color={isDark ? "#14b8a6" : "#0f766e"} />
        </TouchableOpacity>
      </View>

      {/* Seamless Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, isDark && { backgroundColor: '#1e293b' }]}>
          <Ionicons name="search" size={20} color={isDark ? "#94a3b8" : "#9CA3AF"} />
          <TextInput
            style={[styles.input, isDark && { color: '#f8fafc' }]}
            placeholder="Search friends..."
            placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={isDark ? "#94a3b8" : "#9CA3AF"} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading && chatUsers.length === 0 ? (
        <ChatSkeleton />
      ) : filteredUsers.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIllustration, isDark && { backgroundColor: '#1e293b' }]}>
            <Ionicons name="chatbubbles-outline" size={80} color={isDark ? "#334155" : "#E5E7EB"} />
          </View>
          <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>No messages yet</Text>
          <Text style={[styles.emptyDesc, isDark && { color: '#94a3b8' }]}>Start a professional conversation with your friends now.</Text>
          <TouchableOpacity
            style={[styles.primaryBtn, isDark && { backgroundColor: '#14b8a6', shadowColor: '#14b8a6' }]}
            onPress={() => (navigation as any).navigate('Peoples')}
          >
            <Text style={styles.primaryBtnText}>Find People</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderChatItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={isDark ? '#2dd4bf' : '#0f766e'}
              colors={[isDark ? '#2dd4bf' : '#0f766e']}
            />
          }
        />
      )}
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
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 8,
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#111827',
  },
  listContent: {
    paddingBottom: 40,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  unreadText: {
    fontWeight: '800',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  unreadTime: {
    color: '#0f766e',
    fontWeight: '700',
  },
  lastMsg: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  unreadLastMsg: {
    color: '#111827',
    fontWeight: '600',
  },
  youPrefix: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  unreadBadge: {
    backgroundColor: '#0f766e',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIllustration: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default Chats;