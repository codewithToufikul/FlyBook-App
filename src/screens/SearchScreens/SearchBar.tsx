
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  getSearchHistory,
  deleteSearchItem,
  clearSearchHistory,
  SearchHistoryItem,
} from '../../utils/searchHistory';

const { width } = Dimensions.get('window');

const TRENDING_SEARCHES = [
  'Recent Books',
  'Programming Tutorials',
  'FlyBook Insights',
  'Top Scholars',
  'Educational PDF',
  'Tech News',
];

const QUICK_FILTERS = [
  { label: 'People', icon: 'people', lightBg: '#EFF6FF', lightIcon: '#2563EB', lightText: '#1D4ED8', darkBg: '#1e3a5f', darkIcon: '#60a5fa', darkText: '#93c5fd' },
  { label: 'Opinions', icon: 'chatbubbles', lightBg: '#FFF7ED', lightIcon: '#EA580C', lightText: '#C2410C', darkBg: '#431407', darkIcon: '#fb923c', darkText: '#fdba74' },
  { label: 'Books', icon: 'book', lightBg: '#F0FDF4', lightIcon: '#16A34A', lightText: '#15803D', darkBg: '#14302b', darkIcon: '#4ade80', darkText: '#86efac' },
  { label: 'Blogs', icon: 'newspaper', lightBg: '#FAF5FF', lightIcon: '#9333EA', lightText: '#7E22CE', darkBg: '#2e1065', darkIcon: '#c084fc', darkText: '#d8b4fe' },
  { label: 'Videos', icon: 'videocam', lightBg: '#FFF1F2', lightIcon: '#DC2626', lightText: '#B91C1C', darkBg: '#450a0a', darkIcon: '#f87171', darkText: '#fca5a5' },
];

const SearchBar = () => {
  const { isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const isFocused = useIsFocused();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isFocused) loadHistory();
  }, [isFocused]);

  const loadHistory = async () => {
    setIsLoading(true);
    const saved = await getSearchHistory();
    setHistory(saved);
    setIsLoading(false);
  };

  const handleDeleteHistory = async (id: string) => {
    const updated = await deleteSearchItem(id);
    setHistory(updated);
  };

  const handleClearAll = async () => {
    await clearSearchHistory();
    setHistory([]);
  };

  const handleSearchClick = (query: string) => {
    navigation.navigate('SearchResult', { query });
  };

  const bg = isDark ? '#0f172a' : '#ffffff';
  const sectionBg = isDark ? '#1e293b' : '#f8fafc';
  const textPrimary = isDark ? '#f1f5f9' : '#111827';
  const textSecondary = isDark ? '#64748b' : '#9ca3af';
  const borderColor = isDark ? '#1e293b' : '#f3f4f6';
  const historyItemBg = isDark ? '#1e293b' : '#f1f5f9';

  // 2-column grid: 48% each with 4% total gap
  const cardW = (width - 32 - 12) / 2; // 16px each side padding, 12px gap

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Recent Header */}
        <View style={styles.recentHeader}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Recent</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
              <Text style={[styles.clearAll, { color: isDark ? '#2dd4bf' : '#3B82F6' }]}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* History List */}
        <View style={styles.historyList}>
          {isLoading ? (
            <ActivityIndicator size="small" color={isDark ? '#14b8a6' : '#3B82F6'} style={{ marginVertical: 16 }} />
          ) : history.length > 0 ? (
            history.map((item) => (
              <View key={item.id} style={[styles.historyRow, { borderBottomColor: borderColor }]}>
                <TouchableOpacity
                  style={styles.historyLeft}
                  onPress={() => handleSearchClick(item.query)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.historyIconBox, { backgroundColor: historyItemBg }]}>
                    <Ionicons name="time-outline" size={18} color={textSecondary} />
                  </View>
                  <Text style={[styles.historyText, { color: textPrimary }]} numberOfLines={1}>
                    {item.query}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteHistory(item.id)} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={18} color={textSecondary} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: textSecondary }]}>No recent searches</Text>
          )}
        </View>

        {/* Trending */}
        <View style={[styles.trendingSection, { backgroundColor: sectionBg }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: 14 }]}>Trending Searches</Text>
          <View style={styles.tagWrap}>
            {TRENDING_SEARCHES.map((tag, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.tag, { backgroundColor: bg, borderColor: isDark ? '#334155' : '#e5e7eb' }]}
                onPress={() => handleSearchClick(tag)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagText, { color: textPrimary }]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Filters */}
        <View style={styles.filtersSection}>
          <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: 14 }]}>Quick Filters</Text>
          <View style={styles.filterGrid}>
            {QUICK_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.label}
                style={[
                  styles.filterCard,
                  {
                    width: cardW,
                    backgroundColor: isDark ? f.darkBg : f.lightBg,
                  },
                ]}
                activeOpacity={0.75}
                onPress={() => handleSearchClick(f.label)}
              >
                <View style={[styles.filterIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                  <Ionicons name={f.icon as any} size={22} color={isDark ? f.darkIcon : f.lightIcon} />
                </View>
                <Text style={[styles.filterLabel, { color: isDark ? f.darkText : f.lightText }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  clearAll: {
    fontSize: 14,
    fontWeight: '700',
  },

  historyList: { paddingHorizontal: 16 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  deleteBtn: { padding: 4 },
  emptyText: { fontSize: 14, paddingVertical: 20 },

  trendingSection: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 10,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },

  filtersSection: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterCard: {
    borderRadius: 20,
    padding: 16,
    justifyContent: 'flex-start',
    minHeight: 100,
  },
  filterIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
});

export default SearchBar;