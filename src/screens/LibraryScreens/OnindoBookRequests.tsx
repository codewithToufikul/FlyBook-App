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
  cancelOnindoBookRequest,
  transferOnindoBook,
  OnindoBook,
} from '../../services/libraryService';

const OnindoBookRequests = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [viewFaceUrl, setViewFaceUrl] = useState<string | null>(null);

  const { data: allBooks = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['allOnindoBooks'],
    queryFn: fetchAllOnindoBooks,
    retry: 2,
  });

  // Books I own that have a pending request
  const requestedBooks = allBooks.filter(
    (book: OnindoBook) => book.userId === user?._id && !!book.requestBy,
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

  const handleTransfer = (book: OnindoBook) => {
    Alert.alert(
      '⚠️ Permanent Transfer',
      `Are you sure you want to permanently give "${book.bookName}" to ${book.requestName}?\n\nThis action CANNOT be undone. Ownership will transfer permanently.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          style: 'destructive',
          onPress: async () => {
            try {
              await transferOnindoBook(book._id, book.requestBy || '', book.requestName || '');
              Toast.show({ type: 'success', text1: 'Book transferred permanently!' });
              emitNotification(
                book.requestBy || '',
                'onindoTransfer',
                `${user?.name} permanently transferred "${book.bookName}" to you!`,
              );
              queryClient.invalidateQueries({ queryKey: ['allOnindoBooks'] });
            } catch (error: any) {
              Toast.show({ type: 'error', text1: 'Transfer failed', text2: error?.message });
            }
          },
        },
      ],
    );
  };

  const handleReject = async (book: OnindoBook) => {
    try {
      await cancelOnindoBookRequest(book._id);
      Toast.show({ type: 'success', text1: 'Request rejected' });
      emitNotification(
        book.requestBy || '',
        'onindoReject',
        `${user?.name} rejected your request for "${book.bookName}"`,
      );
      queryClient.invalidateQueries({ queryKey: ['allOnindoBooks'] });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Failed to reject request', text2: error?.message });
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
        <Text style={[styles.loadingText, { color: subColor }]}>Loading requests...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: OnindoBook }) => (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      {/* Permanent transfer warning banner */}
      <LinearGradient
        colors={['#7c3aed', '#a78bfa']}
        style={styles.warningBanner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Ionicons name="infinite" size={14} color="#fff" />
        <Text style={styles.warningText}>Permanent Transfer Request</Text>
      </LinearGradient>

      <View style={styles.cardContent}>
        <Image
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/70x95/7c3aed/ffffff?text=📚' }}
          style={styles.bookCover}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text style={[styles.bookName, { color: textColor }]} numberOfLines={2}>
            {item.bookName}
          </Text>
          <Text style={[styles.writer, { color: subColor }]}>✍️ {item.writer}</Text>

          {/* Requester info */}
          <View style={[styles.requesterBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
            <Ionicons name="person-circle" size={16} color="#7c3aed" />
            <Text style={[styles.requesterText, { color: textColor }]}>
              {item.requestName} wants this book
            </Text>
            {item.requestFaceUrl ? (
              <TouchableOpacity
                onPress={() => setViewFaceUrl(item.requestFaceUrl || null)}
                style={styles.faceBtn}
              >
                <Image source={{ uri: item.requestFaceUrl }} style={styles.faceThumb} />
                <Ionicons name="eye" size={14} color="#7c3aed" />
              </TouchableOpacity>
            ) : (
              <View style={styles.noFaceBadge}>
                <Ionicons name="warning-outline" size={13} color="#f59e0b" />
                <Text style={styles.noFaceText}>No face</Text>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => handleReject(item)}
            >
              <Ionicons name="close" size={16} color="#ef4444" />
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.transferBtn}
              onPress={() => handleTransfer(item)}
            >
              <LinearGradient
                colors={['#7c3aed', '#a78bfa']}
                style={styles.transferGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="infinite" size={15} color="#fff" />
                <Text style={styles.transferText}>Give Permanently</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
    <FlatList
      data={requestedBooks}
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
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>No pending requests</Text>
          <Text style={[styles.emptyText, { color: subColor }]}>
            When someone requests your Onindo books, they'll appear here.
          </Text>
        </View>
      }
    />

    {/* Face Image Preview Modal */}
    <Modal visible={!!viewFaceUrl} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => setViewFaceUrl(null)}
          activeOpacity={1}
        />
        <View style={[styles.modalContent, isDark && { backgroundColor: '#1e293b' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && { color: '#f8fafc' }]}>Requester Identity</Text>
            <TouchableOpacity
              onPress={() => setViewFaceUrl(null)}
              style={[styles.modalCloseBtn, isDark && { backgroundColor: '#334155' }]}
            >
              <Ionicons name="close" size={20} color={isDark ? '#f8fafc' : '#6B7280'} />
            </TouchableOpacity>
          </View>
          {viewFaceUrl && (
            <Image source={{ uri: viewFaceUrl }} style={styles.previewFaceImage} resizeMode="cover" />
          )}
          <View style={styles.verificationBadge}>
            <Ionicons name="checkmark-seal" size={20} color="#10b981" />
            <Text style={styles.verificationText}>On-Device Face Verified</Text>
          </View>
          <TouchableOpacity onPress={() => setViewFaceUrl(null)} activeOpacity={0.8}>
            <LinearGradient
              colors={['#7c3aed', '#a78bfa']}
              style={styles.closeModalBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.closeModalBtnText}>Close</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '500' },
  list: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  warningText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cardContent: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  bookCover: {
    width: 70,
    height: 95,
    borderRadius: 8,
    backgroundColor: '#e2d9f3',
  },
  info: { flex: 1, gap: 5 },
  bookName: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
  writer: { fontSize: 12, fontWeight: '500' },
  requesterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  requesterText: { fontSize: 13, fontWeight: '600', flex: 1 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  rejectText: { color: '#ef4444', fontSize: 13, fontWeight: '700' },
  transferBtn: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  transferGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  transferText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  faceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  faceThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#7c3aed',
  },
  noFaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  noFaceText: { fontSize: 11, color: '#f59e0b', fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewFaceImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: '#7c3aed',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  closeModalBtn: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  closeModalBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

export default OnindoBookRequests;
