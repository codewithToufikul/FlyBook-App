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
  Dimensions,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchAllBooks, deleteBook, Book } from '../../services/libraryService';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const MyBooks = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();

  const { data: allBooks = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['allBooks'],
    queryFn: fetchAllBooks,
    retry: 2,
  });

  const myBooks = allBooks
    .filter((book: Book) => book.userId === user?._id && book.transfer !== 'success')
    .reverse();

  const handleRemoveBook = (bookId: string) => {
    Alert.alert(
      'Remove Book',
      'Are you sure you want to remove this book from your library?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteBook(bookId);
              if ((res as any).success) {
                Toast.show({ type: 'success', text1: 'Book removed successfully!' });
                queryClient.invalidateQueries({ queryKey: ['allBooks'] });
              }
            } catch (error: any) {
              const msg = error?.data?.message || error?.message || 'Failed to remove book';
              Toast.show({ type: 'error', text1: 'Error', text2: msg });
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#0D9488"} />
        <Text style={[styles.loadingText, isDark && { color: '#64748b' }]}>Loading your books...</Text>
      </View>
    );
  }

  if (myBooks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconBg, isDark && { backgroundColor: '#1e293b' }]}>
          <Ionicons name="library" size={60} color={isDark ? "#14b8a6" : "#0D9488"} />
        </View>
        <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>No Books Yet</Text>
        <Text style={[styles.emptySubtitle, isDark && { color: '#64748b' }]}>
          Add your first book to start sharing with others!
        </Text>
      </View>
    );
  }

  const renderBook = ({ item }: { item: Book }) => (
    <View style={[styles.bookCard, isDark && { backgroundColor: '#1e293b', shadowColor: '#000' }]}>
      <Image
        source={{ uri: item.imageUrl }}
        style={[styles.bookImage, isDark && { backgroundColor: '#0f172a' }]}
        resizeMode="cover"
      />

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
        <Text style={[styles.writerName, isDark && { color: '#94a3b8' }]} numberOfLines={1}>by {item.writer}</Text>
        <Text style={[styles.dateText, isDark && { color: '#64748b' }]}>Added: {item.currentDate}</Text>
      </View>

      <TouchableOpacity
        onPress={() => handleRemoveBook(item._id)}
        activeOpacity={0.8}
        style={styles.removeBtnWrapper}
      >
        <LinearGradient
          colors={['#EF4444', '#B91C1C']}
          style={styles.removeBtn}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.removeBtnText}>Remove</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={myBooks}
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
          <Text style={[styles.sectionTitle, isDark && { color: '#cbd5e1' }]}>Collection ({myBooks.length})</Text>
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
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
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
    height: 180,
    backgroundColor: '#F8FAFC',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: 70,
  },
  returnBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
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
    padding: 12,
  },
  bookName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  writerName: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '500',
  },
  removeBtnWrapper: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default MyBooks;
