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
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  fetchAllOnindoBooks,
  deleteOnindoBook,
  OnindoBook,
} from '../../services/libraryService';

const OnindoMyBooks = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();

  const { data: allBooks = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['allOnindoBooks'],
    queryFn: fetchAllOnindoBooks,
    retry: 2,
  });

  // My books = books where userId matches current user
  const myBooks = allBooks.filter(
    (book: OnindoBook) => book.userId === user?._id,
  );

  const handleDelete = (book: OnindoBook) => {
    Alert.alert(
      'Delete Book',
      `Are you sure you want to delete "${book.bookName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOnindoBook(book._id);
              Toast.show({ type: 'success', text1: 'Book deleted successfully' });
              queryClient.invalidateQueries({ queryKey: ['allOnindoBooks'] });
            } catch (error: any) {
              Toast.show({ type: 'error', text1: 'Failed to delete book', text2: error?.message });
            }
          },
        },
      ],
    );
  };

  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subColor = isDark ? '#64748b' : '#94a3b8';
  const borderColor = isDark ? '#334155' : '#f1f5f9';

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={[styles.loadingText, { color: subColor }]}>Loading your books...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: OnindoBook }) => {
    const hasPendingRequest = !!item.requestBy;

    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Image
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/80x110/7c3aed/ffffff?text=📚' }}
          style={styles.bookCover}
          resizeMode="cover"
        />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={[styles.bookName, { color: textColor }]} numberOfLines={2}>
              {item.bookName}
            </Text>
            {/* Only show delete button if the book was uploaded by me (not transferred) */}
            {!(item.uploaderId ? (item.uploaderId !== user?._id) : (item.transfer === 'success' || !!item.transferredAt)) && (
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.writer, { color: subColor }]}>✍️ {item.writer}</Text>
          <Text style={[styles.details, { color: subColor }]} numberOfLines={2}>
            {item.details}
          </Text>
          <Text style={[styles.date, { color: subColor }]}>
            📅 Added {item.currentDate}
          </Text>

          {/* Status */}
          <View style={styles.badgeRow}>
            {hasPendingRequest ? (
              <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="time-outline" size={12} color="#92400e" />
                <Text style={[styles.badgeText, { color: '#92400e' }]}>
                  {' '}Request from {item.requestName}
                </Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: '#d1fae5' }]}>
                <Ionicons name="checkmark-circle" size={12} color="#065f46" />
                <Text style={[styles.badgeText, { color: '#065f46' }]}> Available</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={myBooks}
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
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>No books shared yet</Text>
          <Text style={[styles.emptyText, { color: subColor }]}>
            Share a book to the Onindo library by tapping the + button above.
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '500' },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bookName: { fontSize: 15, fontWeight: '800', flex: 1, lineHeight: 20 },
  deleteBtn: { padding: 4 },
  writer: { fontSize: 12, fontWeight: '500' },
  details: { fontSize: 12, lineHeight: 17 },
  date: { fontSize: 11 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

export default OnindoMyBooks;
