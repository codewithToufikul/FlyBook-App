import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  ScrollView,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  fetchAllBooks,
  requestBook,
  cancelBookRequest,
  Book,
} from '../../services/libraryService';

const { width } = Dimensions.get('window');

const UserLibrary = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();
  const { userId, userName } = route.params || {};
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const { data: allBooks = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['allBooks'],
    queryFn: fetchAllBooks,
    retry: 2,
  });

  const userBooks = allBooks
    .filter((book: Book) => book.userId === userId && book.transfer !== 'success')
    .reverse();

  const emitNotification = (type: string, notifyText: string) => {
    if (socket && userId) {
      socket.emit('sendRequest', {
        senderId: user?._id,
        senderName: user?.name,
        senderProfile: user?.profileImage,
        receoientId: userId,
        type,
        notifyText,
        roomId: [userId],
      });
    }
  };

  const handleRequest = async (book: Book) => {
    if (user?.verified === false) {
      Toast.show({ type: 'error', text1: 'Please verify your profile first' });
      return;
    }
    if (book.requestBy) {
      Toast.show({ type: 'error', text1: 'Someone already requested this book' });
      return;
    }

    try {
      await requestBook(book._id);
      Toast.show({ type: 'success', text1: 'Book request sent!' });
      emitNotification('bookReq', 'Send a Book Request');
      queryClient.invalidateQueries({ queryKey: ['allBooks'] });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Request failed', text2: error?.message });
    }
  };

  const handleCancelRequest = async (book: Book) => {
    try {
      await cancelBookRequest(book._id);
      Toast.show({ type: 'success', text1: 'Request cancelled' });
      emitNotification('bookReqCl', 'Cancel Book Request');
      queryClient.invalidateQueries({ queryKey: ['allBooks'] });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to cancel', text2: error?.message });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <SafeAreaView edges={['top']} style={[styles.header, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, isDark && { backgroundColor: '#1e293b' }]}>
            <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#1E293B"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>{userName ? `${userName}'s Library` : 'User Library'}</Text>
          <View style={{ width: 44 }} />
        </SafeAreaView>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#0D9488"} />
        </View>
      </View>
    );
  }

  const renderBook = ({ item }: { item: Book }) => {
    const hasMyRequest = item.requestBy === user?._id;

    return (
      <TouchableOpacity
        style={[styles.bookCard, isDark && { backgroundColor: '#1e293b', shadowColor: '#000' }]}
        onPress={() => setSelectedBook(item)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: item.imageUrl }} style={[styles.bookImage, isDark && { backgroundColor: '#0f172a' }]} resizeMode="cover" />

        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.imageOverlay}
        />

        <View style={styles.returnBadge}>
          <Ionicons name="time" size={12} color="#fff" />
          <Text style={styles.returnText}>{item.returnTime}</Text>
        </View>

        <View style={styles.bookInfo}>
          <Text style={[styles.bookName, isDark && { color: '#f8fafc' }]} numberOfLines={1}>{item.bookName}</Text>
          <Text style={[styles.writerName, isDark && { color: '#94a3b8' }]} numberOfLines={1}>{item.writer}</Text>

          <View style={styles.btnRow}>
            {hasMyRequest ? (
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => handleCancelRequest(item)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#EF4444', '#B91C1C']}
                  style={styles.actionBtnInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="close-circle" size={14} color="#fff" />
                  <Text style={styles.btnText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => handleRequest(item)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  style={styles.actionBtnInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="hand-right" size={14} color="#fff" />
                  <Text style={styles.btnText}>Request</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <SafeAreaView edges={['top']} style={[styles.header, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, isDark && { backgroundColor: '#1e293b' }]}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#1E293B"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]} numberOfLines={1}>
          {userName ? `${userName}'s Library` : 'User Library'}
        </Text>
        <View style={{ width: 44 }} />
      </SafeAreaView>

      {userBooks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, isDark && { backgroundColor: '#1e293b' }]}>
            <Ionicons name="book" size={60} color={isDark ? "#334155" : "#E5E7EB"} />
          </View>
          <Text style={[styles.emptyTitle, isDark && { color: '#94a3b8' }]}>No books available</Text>
          <Text style={[styles.emptySub, isDark && { color: '#64748b' }]}>This user hasn't added any books to their collection yet.</Text>
        </View>
      ) : (
        <FlatList
          data={userBooks}
          renderItem={renderBook}
          keyExtractor={item => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
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
              <Text style={[styles.sectionTitle, isDark && { color: '#cbd5e1' }]}>Collection</Text>
              <View style={[styles.countBadge, isDark && { backgroundColor: '#1e293b' }]}>
                <Text style={[styles.countText, isDark && { color: '#14b8a6' }]}>{userBooks.length} Books</Text>
              </View>
            </View>
          }
        />
      )}

      {/* Book Detail Modal */}
      <Modal visible={!!selectedBook} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedBook(null)}
            activeOpacity={1}
          />
          <View style={[styles.modalContent, isDark && { backgroundColor: '#1e293b' }]}>
            <View style={[styles.modalHandle, isDark && { backgroundColor: '#334155' }]} />

            <TouchableOpacity
              style={[styles.modalCloseBtn, isDark && { backgroundColor: '#334155' }]}
              onPress={() => setSelectedBook(null)}
            >
              <Ionicons name="close" size={24} color={isDark ? "#f8fafc" : "#6B7280"} />
            </TouchableOpacity>

            {selectedBook && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                <View style={styles.modalImageContainer}>
                  <Image
                    source={{ uri: selectedBook.imageUrl }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)']}
                    style={styles.modalImageOverlay}
                  />
                </View>

                <Text style={[styles.modalBookName, isDark && { color: '#f8fafc' }]}>{selectedBook.bookName}</Text>
                <Text style={[styles.modalWriter, isDark && { color: '#94a3b8' }]}>by {selectedBook.writer}</Text>

                <View style={styles.modalStatsRow}>
                  <View style={[styles.modalStatItem, isDark && { backgroundColor: '#0f172a' }]}>
                    <Ionicons name="time" size={18} color="#14b8a6" />
                    <View>
                      <Text style={styles.modalStatLabel}>Return Time</Text>
                      <Text style={[styles.modalStatValue, isDark && { color: '#cbd5e1' }]}>{selectedBook.returnTime}</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.modalInfoCard, isDark && { backgroundColor: '#0f172a', borderColor: '#334155' }]}>
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="calendar" size={18} color={isDark ? "#64748b" : "#6B7280"} />
                    <Text style={[styles.modalInfoText, isDark && { color: '#94a3b8' }]}>
                      Added {selectedBook.currentDate}
                      {selectedBook.currentTime
                        ? ` at ${selectedBook.currentTime.slice(0, -6)}${selectedBook.currentTime.slice(-3)}`
                        : ''}
                    </Text>
                  </View>

                  {selectedBook.details && (
                    <View style={styles.modalDetailsBox}>
                      <Text style={[styles.detailsLabel, isDark && { color: '#f8fafc' }]}>About this book</Text>
                      <Text style={[styles.detailsText, isDark && { color: '#94a3b8' }]}>{selectedBook.details}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalActions}>
                  {selectedBook.requestBy === user?._id ? (
                    <TouchableOpacity
                      onPress={() => {
                        handleCancelRequest(selectedBook);
                        setSelectedBook(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#EF4444', '#991B1B']}
                        style={styles.modalMainBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="close-circle" size={20} color="#fff" />
                        <Text style={styles.modalBtnText}>Cancel Request</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        handleRequest(selectedBook);
                        setSelectedBook(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.modalMainBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Ionicons name="hand-right" size={20} color="#fff" />
                        <Text style={styles.modalBtnText}>Request This Book</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#334155',
  },
  emptySub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0D9488',
  },
  row: {
    justifyContent: 'space-between',
  },
  bookCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  bookImage: {
    width: '100%',
    height: 200,
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
  bookInfo: {
    padding: 14,
  },
  bookName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  writerName: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  btnRow: {
    marginTop: 12,
  },
  actionBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
  },
  btnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    padding: 24,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalImageContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    marginBottom: 24,
  },
  modalImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F8FAFC',
  },
  modalImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 220,
  },
  modalBookName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  modalWriter: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  modalStatsRow: {
    marginTop: 20,
  },
  modalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalStatValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  modalInfoCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  modalDetailsBox: {
    marginTop: 4,
  },
  detailsLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    fontWeight: '500',
  },
  modalActions: {
    marginTop: 30,
  },
  modalMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
});

export default UserLibrary;
