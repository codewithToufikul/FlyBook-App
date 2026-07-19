import React, { useState } from 'react';
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
  Modal,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  fetchAllOnindoBooks,
  requestOnindoBook,
  cancelOnindoBookRequest,
  OnindoBook,
} from '../../services/libraryService';
import { FaceCaptureScreen } from './FaceCaptureScreen';
import { uploadToImgBB, compressImage } from '../../utils/imageUpload';

const OnindoAllBooks = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [pendingBookForRequest, setPendingBookForRequest] = useState<OnindoBook | null>(null);
  const [isUploadingFace, setIsUploadingFace] = useState(false);

  const { data: allBooks = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['allOnindoBooks'],
    queryFn: fetchAllOnindoBooks,
    retry: 2,
  });

  // Exclude my own books — show others' books only
  const browseBooks = allBooks.filter(
    (book: OnindoBook) => book.userId !== user?._id,
  );

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

  const handleRequest = (book: OnindoBook) => {
    if (book.requestBy) {
      Toast.show({ type: 'error', text1: 'Someone already requested this book' });
      return;
    }
    Alert.alert(
      '📸 Face Verification Required',
      `To request "${book.bookName}", you must first complete a face verification.\n\nOnindo books are permanently transferred — this ensures accountability.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Verify Face & Request',
          onPress: () => {
            setPendingBookForRequest(book);
            setShowFaceCapture(true);
          },
        },
      ],
    );
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
      if (!uploadedFaceUrl) throw new Error('Face image upload failed');

      // 3. Send onindo book request with face URL
      await requestOnindoBook(pendingBookForRequest._id, uploadedFaceUrl);

      Toast.show({ type: 'success', text1: 'Face verified & Request sent! 🎉' });
      emitNotification(
        pendingBookForRequest.userId,
        'onindoReq',
        `${user?.name} requested your book "${pendingBookForRequest.bookName}"`,
      );
      queryClient.invalidateQueries({ queryKey: ['allOnindoBooks'] });
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

  const handleCancelRequest = async (book: OnindoBook) => {
    try {
      await cancelOnindoBookRequest(book._id);
      Toast.show({ type: 'success', text1: 'Request cancelled' });
      queryClient.invalidateQueries({ queryKey: ['allOnindoBooks'] });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to cancel', text2: error?.message });
    }
  };

  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subColor = isDark ? '#64748b' : '#94a3b8';
  const borderColor = isDark ? '#334155' : '#f1f5f9';

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={[styles.loadingText, { color: subColor }]}>Loading books...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: OnindoBook }) => {
    const isMine = item.userId === user?._id;
    const myRequest = item.requestBy?.toString() === user?._id?.toString();
    const isPending = !!item.requestBy;

    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Image
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/80x110/7c3aed/ffffff?text=📚' }}
          style={styles.bookCover}
          resizeMode="cover"
        />
        <View style={styles.cardBody}>
          <Text style={[styles.bookName, { color: textColor }]} numberOfLines={2}>
            {item.bookName}
          </Text>
          <Text style={[styles.writer, { color: subColor }]} numberOfLines={1}>
            ✍️ {item.writer}
          </Text>
          <Text style={[styles.owner, { color: subColor }]} numberOfLines={1}>
            👤 {item.owner}
          </Text>
          <Text style={[styles.details, { color: subColor }]} numberOfLines={2}>
            {item.details}
          </Text>

          {/* Status badge */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: isPending ? '#fef3c7' : '#d1fae5' }]}>
              <Text style={[styles.badgeText, { color: isPending ? '#92400e' : '#065f46' }]}>
                {isPending ? '⏳ Requested' : '✅ Available'}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(124,58,237,0.1)' }]}>
              <Ionicons name="infinite" size={11} color="#7c3aed" />
              <Text style={[styles.badgeText, { color: '#7c3aed' }]}> Onindo</Text>
            </View>
          </View>

          {/* Action buttons */}
          {!isMine && (
            myRequest ? (
              <TouchableOpacity
                style={[styles.cancelBtn]}
                onPress={() => handleCancelRequest(item)}
              >
                <Ionicons name="close-circle-outline" size={15} color="#ef4444" />
                <Text style={styles.cancelBtnText}>Cancel Request</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.requestBtn,
                  isPending && styles.requestBtnDisabled,
                  { backgroundColor: isPending ? '#94a3b8' : '#7c3aed' }
                ]}
                onPress={() => handleRequest(item)}
                disabled={isPending}
              >
                <Ionicons name="send" size={14} color="#fff" />
                <Text style={styles.requestBtnText}>
                  {isPending ? 'Unavailable' : 'Request Book'}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
    <FlatList
      data={browseBooks}
      keyExtractor={item => item._id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={['#7c3aed']}
          tintColor="#7c3aed"
        />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>No books available</Text>
          <Text style={[styles.emptyText, { color: subColor }]}>
            Be the first to share a book in Onindo!
          </Text>
        </View>
      }
    />

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

    {/* Uploading overlay */}
    {isUploadingFace && (
      <View style={styles.uploadingOverlay}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.uploadingText}>Verifying Face & Sending Request...</Text>
      </View>
    )}
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '500' },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    zIndex: 99,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  bookCover: {
    width: 80,
    height: 110,
    borderRadius: 10,
    backgroundColor: '#e2d9f3',
  },
  cardBody: { flex: 1, gap: 4 },
  bookName: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
  writer: { fontSize: 12, fontWeight: '500' },
  owner: { fontSize: 12 },
  details: { fontSize: 12, lineHeight: 17 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  requestBtn: {
    marginTop: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  requestBtnDisabled: { opacity: 0.6 },
  requestBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.08)',
    alignSelf: 'flex-start',
  },
  cancelBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

export default OnindoAllBooks;
