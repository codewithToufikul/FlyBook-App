import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
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
import {
  fetchAllBooks,
  acceptBookRequest,
  transferBook,
  cancelBookRequest,
  Book,
} from '../../services/libraryService';

const BookRequests = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();

  const { data: allBooks = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['allBooks'],
    queryFn: fetchAllBooks,
    retry: 2,
  });

  const requestBooks = allBooks
    .filter(
      (book: Book) =>
        book.userId === user?._id &&
        (book.transfer === 'pending' || book.transfer === 'accept'),
    )
    .reverse();

  const emitNotification = (recipientId: string, type: string, notifyText: string) => {
    if (socket) {
      socket.emit('sendRequest', {
        senderId: user?._id,
        senderName: user?.name,
        senderProfile: user?.profileImage,
        receoientId: recipientId,
        type,
        notifyText,
        roomId: [recipientId],
      });
    }
  };

  const handleAccept = async (book: Book) => {
    try {
      await acceptBookRequest(book._id, book.requestBy || '');
      Toast.show({ type: 'success', text1: 'Book request accepted!' });
      emitNotification(book.requestBy || '', 'bookReqAc', 'Accept Your Book Request');
      queryClient.invalidateQueries({ queryKey: ['allBooks'] });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to accept request', text2: error?.message });
    }
  };

  const handleTransfer = async (book: Book) => {
    Alert.alert(
      'Transfer Book',
      `Are you sure you want to transfer "${book.bookName}" to ${book.requestName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          onPress: async () => {
            try {
              await transferBook(book._id, book.requestBy || '', book.requestName || '');
              Toast.show({ type: 'success', text1: 'Book transferred successfully!' });
              emitNotification(book.requestBy || '', 'bookReqAc', 'Transfer your Book');
              queryClient.invalidateQueries({ queryKey: ['allBooks'] });
            } catch (error: any) {
              Toast.show({ type: 'error', text1: 'Transfer failed', text2: error?.message });
            }
          },
        },
      ],
    );
  };

  const handleCancel = async (book: Book) => {
    try {
      await cancelBookRequest(book._id);
      Toast.show({ type: 'success', text1: 'Request cancelled' });
      emitNotification(book.requestBy || '', 'bookReqCl', 'Cancel your Book Request');
      queryClient.invalidateQueries({ queryKey: ['allBooks'] });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to cancel', text2: error?.message });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#0D9488"} />
        <Text style={[styles.loadingText, isDark && { color: '#64748b' }]}>Loading requests...</Text>
      </View>
    );
  }

  if (requestBooks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconBg, isDark && { backgroundColor: '#1e293b' }]}>
          <Ionicons name="git-pull-request" size={60} color={isDark ? "#14b8a6" : "#0D9488"} />
        </View>
        <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>No Book Requests</Text>
        <Text style={[styles.emptySubtitle, isDark && { color: '#64748b' }]}>
          When someone requests your book, it will appear here.
        </Text>
      </View>
    );
  }

  const renderBook = ({ item }: { item: Book }) => (
    <View style={[styles.card, isDark && { backgroundColor: '#1e293b', shadowColor: '#000' }]}>
      <Image source={{ uri: item.imageUrl }} style={[styles.bookImage, isDark && { backgroundColor: '#0f172a' }]} resizeMode="cover" />

      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent']}
        style={styles.imageOverlay}
      />

      <View style={styles.returnBadge}>
        <Ionicons name="time" size={12} color="#fff" />
        <Text style={styles.returnText}>{item.returnTime}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.bookName, isDark && { color: '#f8fafc' }]} numberOfLines={1}>{item.bookName}</Text>
        <Text style={[styles.writerName, isDark && { color: '#94a3b8' }]} numberOfLines={1}>by {item.writer}</Text>

        <TouchableOpacity
          style={[styles.requesterRow, isDark && { backgroundColor: '#0f172a' }]}
          onPress={() => navigation.navigate('UserProfile', { userId: item.requestBy })}
          activeOpacity={0.7}
        >
          <View style={[styles.requesterIcon, isDark && { backgroundColor: '#1e293b' }]}>
            <Ionicons name="person" size={12} color={isDark ? "#14b8a6" : "#0D9488"} />
          </View>
          <Text style={[styles.requesterText, isDark && { color: '#64748b' }]}>From: </Text>
          <Text style={[styles.requesterName, isDark && { color: '#14b8a6' }]}>{item.requestName}</Text>
          <Ionicons name="chevron-forward" size={12} color={isDark ? "#475569" : "#94A3B8"} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <View style={[styles.statusBadge, isDark && { backgroundColor: '#0f172a' }]}>
          <View style={[styles.statusDot, item.transfer === 'pending' ? styles.dotPending : styles.dotAccepted]} />
          <Text style={[styles.statusText, isDark && { color: '#94a3b8' }]}>
            {item.transfer === 'pending' ? 'Waiting for your approval' : 'Accepted - Tap to Transfer'}
          </Text>
        </View>

        <View style={styles.actionRow}>
          {item.transfer === 'pending' ? (
            <TouchableOpacity
              style={styles.actionBtnWrapper}
              onPress={() => handleAccept(item)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.actionBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Accept</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionBtnWrapper}
              onPress={() => handleTransfer(item)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                style={styles.actionBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="swap-horizontal" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Transfer</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleCancel(item)}
            activeOpacity={0.8}
            style={styles.actionBtnWrapper}
          >
            <LinearGradient
              colors={['#EF4444', '#B91C1C']}
              style={styles.actionBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="close-circle" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Decline</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <FlatList
      data={requestBooks}
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
          <Text style={[styles.sectionTitle, isDark && { color: '#cbd5e1' }]}>Incoming Requests ({requestBooks.length})</Text>
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
  returnText: {
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
  requesterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    gap: 8,
  },
  requesterIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requesterText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  requesterName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D9488',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotPending: {
    backgroundColor: '#F59E0B',
  },
  dotAccepted: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionBtnWrapper: {
    flex: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default BookRequests;
