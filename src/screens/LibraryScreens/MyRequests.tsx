import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchAllBooks, returnBook, Book } from '../../services/libraryService';

const MyRequests = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const [returningId, setReturningId] = useState<string | null>(null);

  const { data: allBooks = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['allBooks'],
    queryFn: fetchAllBooks,
    retry: 2,
  });

  const myRequestedBooks = allBooks
    .filter((book: Book) => book.requestBy === user?._id)
    .reverse();

  const handleReturn = async (book: Book) => {
    setReturningId(book._id);
    try {
      await returnBook(
        book._id,
        book.requestBy || '',
        book.requestName || '',
        book.userId,
      );
      Toast.show({ type: 'success', text1: 'Book returned successfully!' });

      if (socket) {
        socket.emit('sendRequest', {
          senderId: user?._id,
          senderName: user?.name,
          senderProfile: user?.profileImage,
          receoientId: book.userId,
          type: 'bookReturn',
          notifyText: 'Return Your Book',
          roomId: [book.userId],
        });
      }

      queryClient.invalidateQueries({ queryKey: ['allBooks'] });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Return failed',
        text2: error?.message || 'Please try again',
      });
    } finally {
      setReturningId(null);
    }
  };

  const getStatusInfo = (transfer?: string) => {
    switch (transfer) {
      case 'pending':
        return {
          label: 'Request Pending',
          color: '#F59E0B',
          icon: 'hourglass' as const,
          bgColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB'
        };
      case 'accept':
        return {
          label: 'Request Accepted',
          color: '#3B82F6',
          icon: 'checkmark-circle' as const,
          bgColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF'
        };
      case 'success':
        return {
          label: 'Currently with you',
          color: '#10B981',
          icon: 'book' as const,
          bgColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5'
        };
      default:
        return {
          label: 'Unknown',
          color: '#6B7280',
          icon: 'help-circle' as const,
          bgColor: isDark ? '#1e293b' : '#F9FAFB'
        };
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#0D9488"} />
        <Text style={[styles.loadingText, isDark && { color: '#64748b' }]}>Loading your requests...</Text>
      </View>
    );
  }

  if (myRequestedBooks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconBg, isDark && { backgroundColor: '#1e293b' }]}>
          <Ionicons name="send" size={60} color={isDark ? "#14b8a6" : "#0D9488"} />
        </View>
        <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>No Requested Books</Text>
        <Text style={[styles.emptySubtitle, isDark && { color: '#64748b' }]}>
          Books you request from other users will appear here.
        </Text>
      </View>
    );
  }

  const renderBook = ({ item }: { item: Book }) => {
    const status = getStatusInfo(item.transfer);
    const isReturning = returningId === item._id;

    return (
      <View style={[styles.card, isDark && { backgroundColor: '#1e293b', shadowColor: '#000' }]}>
        <Image source={{ uri: item.imageUrl }} style={[styles.bookImage, isDark && { backgroundColor: '#0f172a' }]} resizeMode="cover" />

        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent']}
          style={styles.imageOverlay}
        />

        <View style={styles.returnBadge}>
          <Ionicons name="time" size={12} color="#fff" />
          <Text style={styles.returnBadgeText}>{item.returnTime}</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.bookName, isDark && { color: '#f8fafc' }]} numberOfLines={1}>{item.bookName}</Text>
          <Text style={[styles.writerName, isDark && { color: '#94a3b8' }]} numberOfLines={1}>by {item.writer}</Text>

          <TouchableOpacity
            style={[styles.ownerRow, isDark && { backgroundColor: '#0f172a' }]}
            onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
            activeOpacity={0.7}
          >
            <View style={[styles.ownerIcon, isDark && { backgroundColor: '#1e293b' }]}>
              <Ionicons name="person" size={12} color={isDark ? "#94a3b8" : "#6B7280"} />
            </View>
            <Text style={[styles.ownerLabel, isDark && { color: '#64748b' }]}>Owner: </Text>
            <Text style={[styles.ownerName, isDark && { color: '#cbd5e1' }]}>{item.owner}</Text>
            <Ionicons name="chevron-forward" size={12} color={isDark ? "#475569" : "#94A3B8"} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <View style={[styles.statusBadge, isDark && { backgroundColor: '#0f172a' }]}>
            <Ionicons name={status.icon} size={16} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>

          <View style={styles.actionSection}>
            {item.transfer === 'success' ? (
              <TouchableOpacity
                onPress={() => handleReturn(item)}
                disabled={isReturning}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={[styles.returnBtn, isReturning && styles.returnBtnDisabled]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isReturning ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="return-down-back" size={18} color="#fff" />
                      <Text style={styles.returnBtnText}>Return Book</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : item.transfer === 'pending' ? (
              <View style={[styles.pendingInfo, isDark && { backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <Ionicons name="hourglass" size={16} color="#F59E0B" />
                <Text style={[styles.pendingInfoText, isDark && { color: '#F59E0B' }]}>Waiting for owner approval</Text>
              </View>
            ) : (
              <View style={[styles.transferSoonInfo, isDark && { backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Ionicons name="swap-horizontal" size={16} color="#3B82F6" />
                <Text style={[styles.transferSoonText, isDark && { color: '#3B82F6' }]}>Owner has accepted - Transfer soon</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={myRequestedBooks}
      renderItem={renderBook}
      keyExtractor={item => item._id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[isDark ? "#14b8a6" : '#0D9488']}
          tintColor={isDark ? "#14b8a6" : '#0D9488'}
        />
      }
      ListHeaderComponent={
        <View style={styles.listHeader}>
          <Text style={[styles.sectionTitle, isDark && { color: '#cbd5e1' }]}>Requested Items ({myRequestedBooks.length})</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  bookImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F8FAFC',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: 80,
  },
  returnBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20, 184, 166, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  returnBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  cardContent: {
    padding: 16,
  },
  bookName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  writerName: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 14,
  },
  ownerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  ownerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  actionSection: {
    marginTop: 16,
  },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  returnBtnDisabled: {
    opacity: 0.6,
  },
  returnBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingInfoText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '700',
  },
  transferSoonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  transferSoonText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default MyRequests;
