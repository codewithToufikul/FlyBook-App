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
  fetchUserOnindoBooks,
  requestOnindoBook,
  cancelOnindoBookRequest,
  OnindoBook,
} from '../../services/libraryService';
import { FaceCaptureScreen } from './FaceCaptureScreen';
import { uploadToImgBB, compressImage } from '../../utils/imageUpload';

const { width } = Dimensions.get('window');

const UserLibrary = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();
  const { userId, userName } = route.params || {};
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'library' | 'onindo'>('library');
  const [selectedBook, setSelectedBook] = useState<Book | OnindoBook | null>(null);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [pendingBookForRequest, setPendingBookForRequest] = useState<Book | OnindoBook | null>(null);
  const [isUploadingFace, setIsUploadingFace] = useState(false);

  const { data: allBooks = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['allBooks'],
    queryFn: fetchAllBooks,
    retry: 2,
  });

  const { data: userOnindoResponse, isLoading: isLoadingOnindo, refetch: refetchOnindo, isRefetching: isRefetchingOnindo } = useQuery({
    queryKey: ['userOnindoBooks', userId],
    queryFn: () => fetchUserOnindoBooks(userId),
    enabled: !!userId,
  });

  const userBooks = allBooks
    .filter((book: Book) => book.userId === userId && book.transfer !== 'success')
    .reverse();

  const userOnindoBooks = userOnindoResponse?.data || [];

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

  const handleRequest = async (book: Book | OnindoBook) => {
    const isOnindo = !('returnTime' in book);
    if (!isOnindo && user?.verified === false) {
      Toast.show({ type: 'error', text1: 'Please verify your profile first' });
      return;
    }
    if (book.requestBy) {
      Toast.show({ type: 'error', text1: 'Someone already requested this book' });
      return;
    }

    setPendingBookForRequest(book);
    setShowFaceCapture(true);
  };

  const handleFaceCaptured = async (photoPath: string) => {
    if (!pendingBookForRequest) return;

    setShowFaceCapture(false);
    setIsUploadingFace(true);

    try {
      // 1. Compress face image
      const compressedUri = await compressImage(photoPath, {
        maxWidth: 500,
        maxHeight: 500,
        quality: 75,
      });

      // 2. Upload to ImgBB
      const uploadedFaceUrl = await uploadToImgBB(compressedUri);

      if (!uploadedFaceUrl) {
        throw new Error('Face image upload failed');
      }

      const isOnindo = !('returnTime' in pendingBookForRequest);
      if (isOnindo) {
        // 3. Send Onindo book request
        await requestOnindoBook(pendingBookForRequest._id, uploadedFaceUrl);
        Toast.show({ type: 'success', text1: 'Face verified & Onindo request sent!' });
        emitNotification('onindoReq', 'requested your Onindo book');
        queryClient.invalidateQueries({ queryKey: ['userOnindoBooks', userId] });
      } else {
        // 3. Send book request with face image URL to server
        await requestBook(pendingBookForRequest._id, uploadedFaceUrl);
        Toast.show({ type: 'success', text1: 'Face verified & Book request sent!' });
        emitNotification('bookReq', 'Send a Book Request');
        queryClient.invalidateQueries({ queryKey: ['allBooks'] });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Face Verification failed',
        text2: error?.message || 'Could not complete request.',
      });
    } finally {
      setIsUploadingFace(false);
      setPendingBookForRequest(null);
    }
  };

  const handleCancelRequest = async (book: Book | OnindoBook) => {
    const isOnindo = !('returnTime' in book);
    try {
      if (isOnindo) {
        await cancelOnindoBookRequest(book._id);
        Toast.show({ type: 'success', text1: 'Request cancelled' });
        queryClient.invalidateQueries({ queryKey: ['userOnindoBooks', userId] });
      } else {
        await cancelBookRequest(book._id);
        Toast.show({ type: 'success', text1: 'Request cancelled' });
        emitNotification('bookReqCl', 'Cancel Book Request');
        queryClient.invalidateQueries({ queryKey: ['allBooks'] });
      }
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
                style={[styles.actionBtnInner, { flex: 1, backgroundColor: '#EF4444' }]}
                onPress={() => handleCancelRequest(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={14} color="#fff" />
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtnInner, { flex: 1, backgroundColor: '#3B82F6' }]}
                onPress={() => handleRequest(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="hand-right" size={14} color="#fff" />
                <Text style={styles.btnText}>Request</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderOnindoBook = ({ item }: { item: OnindoBook }) => {
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

        <View style={[styles.returnBadge, { backgroundColor: 'rgba(124, 58, 237, 0.9)' }]}>
          <Ionicons name="infinite" size={12} color="#fff" />
          <Text style={styles.returnText}>Onindo</Text>
        </View>

        <View style={styles.bookInfo}>
          <Text style={[styles.bookName, isDark && { color: '#f8fafc' }]} numberOfLines={1}>{item.bookName}</Text>
          <Text style={[styles.writerName, isDark && { color: '#94a3b8' }]} numberOfLines={1}>{item.writer}</Text>

          <View style={styles.btnRow}>
            {hasMyRequest ? (
              <TouchableOpacity
                style={[styles.actionBtnInner, { flex: 1, backgroundColor: '#EF4444' }]}
                onPress={() => handleCancelRequest(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={14} color="#fff" />
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtnInner, { flex: 1, backgroundColor: '#7c3aed' }]}
                onPress={() => handleRequest(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="hand-right" size={14} color="#fff" />
                <Text style={styles.btnText}>Request</Text>
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

      {/* Tabs */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: isDark ? '#1e293b' : '#E2E8F0', paddingHorizontal: 16 }}>
        <TouchableOpacity
          onPress={() => setActiveTab('library')}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderBottomWidth: activeTab === 'library' ? 3 : 0,
            borderBottomColor: isDark ? '#14b8a6' : '#0D9488',
            alignItems: 'center'
          }}
        >
          <Text style={{ fontWeight: '700', fontSize: 13, color: activeTab === 'library' ? (isDark ? '#14b8a6' : '#0D9488') : '#64748B' }}>Library Books</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('onindo')}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderBottomWidth: activeTab === 'onindo' ? 3 : 0,
            borderBottomColor: '#7c3aed',
            alignItems: 'center'
          }}
        >
          <Text style={{ fontWeight: '700', fontSize: 13, color: activeTab === 'onindo' ? '#7c3aed' : '#64748B' }}>Onindo Books</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'library' ? (
        userBooks.length === 0 ? (
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
        )
      ) : (
        userOnindoBooks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, isDark && { backgroundColor: '#1e293b' }]}>
              <Ionicons name="library" size={60} color={isDark ? "#334155" : "#E5E7EB"} />
            </View>
            <Text style={[styles.emptyTitle, isDark && { color: '#94a3b8' }]}>No Onindo books available</Text>
            <Text style={[styles.emptySub, isDark && { color: '#64748b' }]}>This user hasn't added any Onindo books yet.</Text>
          </View>
        ) : (
          <FlatList
            data={userOnindoBooks}
            renderItem={renderOnindoBook}
            keyExtractor={item => item._id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetchingOnindo}
                onRefresh={refetchOnindo}
                colors={['#7c3aed']}
                tintColor="#7c3aed"
              />
            }
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={[styles.sectionTitle, isDark && { color: '#cbd5e1' }]}>Onindo Collection</Text>
                <View style={[styles.countBadge, isDark && { backgroundColor: '#1e293b' }]}>
                  <Text style={[styles.countText, { color: '#7c3aed' }]}>{userOnindoBooks.length} Books</Text>
                </View>
              </View>
            }
          />
        )
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
                    <Ionicons
                      name={!('returnTime' in selectedBook) ? "infinite" : "time"}
                      size={18}
                      color={!('returnTime' in selectedBook) ? "#7c3aed" : "#14b8a6"}
                    />
                    <View>
                      <Text style={styles.modalStatLabel}>{!('returnTime' in selectedBook) ? "Type" : "Return Time"}</Text>
                      <Text style={[styles.modalStatValue, isDark && { color: '#cbd5e1' }]}>
                        {!('returnTime' in selectedBook) ? "Permanent Sharing" : (selectedBook as Book).returnTime}
                      </Text>
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
                      style={[styles.modalMainBtn, { backgroundColor: '#EF4444' }]}
                    >
                      <Ionicons name="close-circle" size={20} color="#fff" />
                      <Text style={styles.modalBtnText}>Cancel Request</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        handleRequest(selectedBook);
                        setSelectedBook(null);
                      }}
                      activeOpacity={0.8}
                      style={[
                        styles.modalMainBtn,
                        { backgroundColor: !('returnTime' in selectedBook) ? '#7c3aed' : '#10B981' }
                      ]}
                    >
                      <Ionicons name="hand-right" size={20} color="#fff" />
                      <Text style={styles.modalBtnText}>Request This Book</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Face Capture Modal */}
      <Modal visible={showFaceCapture} transparent={false} animationType="slide">
        <FaceCaptureScreen
          onCapture={handleFaceCaptured}
          onClose={() => {
            setShowFaceCapture(false);
            setPendingBookForRequest(null);
          }}
        />
      </Modal>

      {/* Uploading Face Loader */}
      {isUploadingFace && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#14b8a6" />
          <Text style={styles.uploadingText}>Verifying Face & Sending Request...</Text>
        </View>
      )}
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
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  uploadingText: {
    marginTop: 16,
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default UserLibrary;
