
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface User {
  _id: string;
  name: string;
  userName: string;
  profileImage: string;
  number: string;
}

interface Opinion {
  _id: string;
  userId: string;
  userName: string;
  userProfileImage: string;
  description: string;
  date: string;
  time: string;
  image?: string;
}

interface SearchData {
  aiResult: string;
  websiteResults: {
    users: User[];
    opinions: Opinion[];
    books: any[];
    pdfBooks: any[];
  };
  googleResults: {
    items: any[];
  };
}

const SearchResult = () => {
  const { isDark } = useTheme();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { query } = (route.params as { query: string }) || {};

  const [isLoading, setIsLoading] = useState(false);
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'People', 'Opinions', 'Blogs', 'Web'];

  useEffect(() => {
    if (query) fetchResults();
  }, [query]);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      const response = await get<SearchData>(`/search?q=${encodeURIComponent(query)}`);
      setSearchData(response);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToProfile = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };

  // Colors
  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textPrimary = isDark ? '#f1f5f9' : '#111827';
  const textSecondary = isDark ? '#64748b' : '#6b7280';
  const textMuted = isDark ? '#475569' : '#9ca3af';
  const borderColor = isDark ? '#334155' : '#f1f5f9';
  const aiBg = isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff';
  const aiBorder = isDark ? '#1e40af' : '#bfdbfe';
  const aiText = isDark ? '#93c5fd' : '#1d4ed8';
  const aiBody = isDark ? '#e2e8f0' : '#1f2937';

  const renderAiResult = () => (
    <View style={[styles.aiCard, { backgroundColor: aiBg, borderColor: aiBorder }]}>
      <View style={styles.aiHeader}>
        <Ionicons name="sparkles" size={18} color={aiText} />
        <Text style={[styles.aiLabel, { color: aiText }]}>AI Insight</Text>
      </View>
      <Text style={[styles.aiBody, { color: aiBody }]}>{searchData?.aiResult}</Text>
    </View>
  );

  const renderUsers = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: textPrimary }]}>People</Text>
      {(searchData?.websiteResults?.users || []).map((user) => (
        <TouchableOpacity
          key={user._id}
          style={[styles.userRow, { backgroundColor: cardBg, borderBottomColor: borderColor }]}
          onPress={() => navigateToProfile(user._id)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: user.profileImage || 'https://via.placeholder.com/50' }}
            style={styles.userAvatar}
          />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: textPrimary }]}>{user.name}</Text>
            <Text style={[styles.userHandle, { color: textSecondary }]}>@{user.userName}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOpinions = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: textPrimary }]}>Opinions</Text>
      {(searchData?.websiteResults.opinions || []).map((opinion) => (
        <TouchableOpacity
          key={opinion._id}
          style={[styles.opinionCard, { backgroundColor: cardBg, borderColor }]}
          onPress={() => navigation.navigate('OpinionDetails', { post: opinion })}
          activeOpacity={0.7}
        >
          <TouchableOpacity style={styles.opinionAuthorRow} onPress={() => navigateToProfile(opinion.userId)} activeOpacity={0.8}>
            <Image source={{ uri: opinion.userProfileImage || 'https://via.placeholder.com/30' }} style={styles.opinionAvatar} />
            <View style={{ marginLeft: 8 }}>
              <Text style={[styles.opinionAuthor, { color: textPrimary }]}>{opinion.userName}</Text>
              <Text style={[styles.opinionDate, { color: textSecondary }]}>{opinion.date} • {opinion.time}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.opinionBody}>
            <Text style={[styles.opinionText, { color: isDark ? '#cbd5e1' : '#374151' }]} numberOfLines={3}>
              {opinion.description}
            </Text>
            {opinion.image && (
              <Image source={{ uri: opinion.image }} style={[styles.opinionThumb, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBooks = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: textPrimary }]}>Books & PDFs</Text>
      {[...(searchData?.websiteResults.books || []), ...(searchData?.websiteResults.pdfBooks || [])].map((book, idx) => (
        <TouchableOpacity
          key={book._id || idx}
          style={[styles.bookRow, { backgroundColor: cardBg, borderBottomColor: borderColor }]}
          onPress={() => book.pdf ? Linking.openURL(book.pdf) : null}
          activeOpacity={0.7}
        >
          <View style={[styles.bookIcon, { backgroundColor: book.pdf ? (isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2') : (isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff') }]}>
            <Ionicons name={book.pdf ? 'document-text' : 'book'} size={22} color={book.pdf ? (isDark ? '#f87171' : '#ef4444') : (isDark ? '#60a5fa' : '#3b82f6')} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.bookTitle, { color: textPrimary }]} numberOfLines={1}>{book.bookName}</Text>
            <Text style={[styles.bookAuthor, { color: textSecondary }]}>{book.writerName || book.owner || 'Unknown'}</Text>
            {book.pdf && <Text style={[styles.pdfBadge, { color: isDark ? '#f87171' : '#ef4444' }]}>PDF Available</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderGoogleResults = () => (
    <View style={[styles.section, { paddingBottom: 20 }]}>
      <Text style={[styles.sectionTitle, { color: textPrimary }]}>Web Results</Text>
      {(searchData?.googleResults?.items || []).map((item, idx) => (
        <TouchableOpacity
          key={idx}
          style={[styles.webCard, { backgroundColor: cardBg, borderColor }]}
          onPress={() => Linking.openURL(item.link)}
          activeOpacity={0.7}
        >
          <Text style={[styles.webTitle, { color: isDark ? '#60a5fa' : '#2563eb' }]} numberOfLines={2}>{item.title}</Text>
          <Text style={[styles.webUrl, { color: isDark ? '#4ade80' : '#15803d' }]} numberOfLines={1}>{item.displayLink}</Text>
          <Text style={[styles.webSnippet, { color: textSecondary }]} numberOfLines={3}>{item.snippet}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={isDark ? '#14b8a6' : '#3B82F6'} />
        <Text style={[styles.loadingText, { color: textSecondary }]}>Searching Flybook...</Text>
      </View>
    );
  }

  const hasUsers = (searchData?.websiteResults?.users?.length || 0) > 0;
  const hasOpinions = (searchData?.websiteResults?.opinions?.length || 0) > 0;
  const hasBooks = (searchData?.websiteResults?.books?.length || 0) > 0 || (searchData?.websiteResults?.pdfBooks?.length || 0) > 0;
  const hasGoogle = (searchData?.googleResults?.items?.length || 0) > 0;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabBtn,
                activeTab === tab
                  ? { backgroundColor: isDark ? '#0d9488' : '#2563eb' }
                  : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? '#fff' : textSecondary }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {activeTab === 'All' && (
          <>
            {searchData?.aiResult && searchData.aiResult !== 'No AI result found' && renderAiResult()}
            {hasUsers && renderUsers()}
            {hasOpinions && renderOpinions()}
            {hasBooks && renderBooks()}
            {hasGoogle && renderGoogleResults()}
          </>
        )}
        {activeTab === 'People' && renderUsers()}
        {activeTab === 'Opinions' && renderOpinions()}
        {activeTab === 'Blogs' && renderBooks()}
        {activeTab === 'Web' && renderGoogleResults()}

        {!isLoading && !hasUsers && !hasOpinions && !hasBooks && !hasGoogle &&
          (!searchData?.aiResult || searchData.aiResult === 'No AI result found') && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={70} color={isDark ? '#1e293b' : '#d1d5db'} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>No results found for "{query}"</Text>
            </View>
          )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '500' },

  tabBar: { borderBottomWidth: 1 },
  tabScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 },
  tabText: { fontSize: 13, fontWeight: '700' },

  // AI Card
  aiCard: {
    margin: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aiLabel: { marginLeft: 8, fontSize: 14, fontWeight: '800' },
  aiBody: { fontSize: 14, lineHeight: 22 },

  // Section
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', paddingHorizontal: 16, marginBottom: 10 },

  // Users
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e5e7eb' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  userHandle: { fontSize: 13 },

  // Opinions
  opinionCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  opinionAuthorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  opinionAvatar: { width: 36, height: 36, borderRadius: 18 },
  opinionAuthor: { fontSize: 14, fontWeight: '700' },
  opinionDate: { fontSize: 11, marginTop: 2 },
  opinionBody: { flexDirection: 'row', alignItems: 'flex-start' },
  opinionText: { flex: 1, fontSize: 14, lineHeight: 20 },
  opinionThumb: { width: 70, height: 70, borderRadius: 10, marginLeft: 12 },

  // Books
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  bookIcon: { width: 48, height: 60, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bookTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  bookAuthor: { fontSize: 12, marginBottom: 3 },
  pdfBadge: { fontSize: 11, fontWeight: '800' },

  // Web
  webCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  webTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4, lineHeight: 20 },
  webUrl: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  webSnippet: { fontSize: 13, lineHeight: 19 },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { marginTop: 16, fontSize: 15, fontWeight: '500', textAlign: 'center', paddingHorizontal: 32 },
});

export default SearchResult;
