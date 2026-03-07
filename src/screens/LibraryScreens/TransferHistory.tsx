import React from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchTransferHistory, TransferRecord } from '../../services/libraryService';

const TransferHistory = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigation = useNavigation<any>();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['transferHistory'],
    queryFn: fetchTransferHistory,
    retry: 2,
  });

  const allTransfers = data?.data || [];
  const myTransfers = allTransfers
    .filter(
      (t: TransferRecord) => t.sendId === user?._id || t.receiveId === user?._id,
    )
    .reverse();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#0D9488"} />
        <Text style={[styles.loadingText, isDark && { color: '#64748b' }]}>Loading transfer history...</Text>
      </View>
    );
  }

  if (myTransfers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconBg, isDark && { backgroundColor: '#1e293b' }]}>
          <Ionicons name="swap-horizontal" size={60} color={isDark ? "#14b8a6" : "#0D9488"} />
        </View>
        <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>No Transfer History</Text>
        <Text style={[styles.emptySubtitle, isDark && { color: '#64748b' }]}>
          Your book transfer and return history will appear here.
        </Text>
      </View>
    );
  }

  const renderTransfer = ({ item }: { item: TransferRecord }) => {
    const isSender = item.sendId === user?._id;
    const isReturn = item.return === 'return';
    const otherUserId = isSender ? item.receiveId : item.sendId;
    const otherUserName = item.transName || item.receiveName || item.sendName || 'Unknown';
    const formattedTime = item.transTime
      ? `${item.transTime.slice(0, -6)}${item.transTime.slice(-3)}`
      : '';

    return (
      <View style={[styles.card, isDark && { backgroundColor: '#1e293b', shadowColor: '#000' }]}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.bookImage }}
            style={[styles.bookThumbnail, isDark && { backgroundColor: '#0f172a' }]}
            resizeMode="cover"
          />
          <View style={[styles.typeBadge, { backgroundColor: isReturn ? '#F59E0B' : '#3B82F6' }]}>
            <Ionicons
              name={isReturn ? 'return-down-back' : 'swap-horizontal'}
              size={12}
              color="#fff"
            />
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.bookName, isDark && { color: '#f8fafc' }]} numberOfLines={1}>{item.bookName}</Text>

          <View style={styles.directionRow}>
            <View style={[styles.directionIcon, isDark && { backgroundColor: '#0f172a' }]}>
              <Ionicons
                name={isSender ? 'arrow-forward' : 'arrow-back'}
                size={10}
                color={isDark ? "#94a3b8" : "#6B7280"}
              />
            </View>
            <Text style={[styles.directionText, isDark && { color: '#64748b' }]}>
              {isSender ? 'Sent to' : 'Received from'}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('UserProfile', { userId: otherUserId })}
              activeOpacity={0.7}
            >
              <Text style={[styles.userName, isDark && { color: '#14b8a6' }]}>{otherUserName}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.statusInfo, { backgroundColor: isReturn ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]}>
              <Text style={[styles.statusText, { color: isReturn ? '#F59E0B' : '#3B82F6' }]}>
                {isReturn ? 'Returned' : 'Transferred'}
              </Text>
            </View>
            <View style={styles.dateInfo}>
              <Ionicons name="calendar-outline" size={12} color={isDark ? "#475569" : "#94A3B8"} />
              <Text style={[styles.dateText, isDark && { color: '#475569' }]}>{item.transDate}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={myTransfers}
      renderItem={renderTransfer}
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
          <Text style={[styles.sectionTitle, isDark && { color: '#cbd5e1' }]}>Activity History ({myTransfers.length})</Text>
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
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    padding: 12,
    gap: 14,
  },
  imageContainer: {
    position: 'relative',
  },
  bookThumbnail: {
    width: 80,
    height: 110,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  bookName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  directionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  directionIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  userName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D9488',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statusInfo: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
});

export default TransferHistory;
