import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get } from '../../services/api';

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
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { query } = (route.params as { query: string }) || {};

  const [isLoading, setIsLoading] = useState(false);
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'People', 'Opinions', 'Books', 'Web'];

  useEffect(() => {
    if (query) {
      fetchResults();
    }
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
    navigation.navigate('Profile', { userId });
  };

  const renderAiResult = () => (
    <View className="mx-4 mt-4 bg-blue-50 p-4 rounded-2xl border border-blue-100">
      <View className="flex-row items-center mb-2">
        <Ionicons name="sparkles" size={20} color="#3B82F6" />
        <Text className="ml-2 text-blue-600 font-bold">AI Insight</Text>
      </View>
      <Text className="text-gray-800 leading-6">{searchData?.aiResult}</Text>
    </View>
  );

  const renderUsers = () => (
    <View className="mt-4">
      <View className="px-4 flex-row justify-between items-center mb-3">
        <Text className="text-gray-900 font-bold text-lg">People</Text>
      </View>
      {(searchData?.websiteResults?.users || []).map((user) => (
        <TouchableOpacity
          key={user._id}
          onPress={() => navigateToProfile(user._id)}
          className="flex-row items-center px-4 py-3 bg-white mb-1"
        >
          <Image
            source={{ uri: user.profileImage || 'https://via.placeholder.com/50' }}
            className="w-14 h-14 rounded-full bg-gray-200"
          />
          <View className="ml-3 flex-1">
            <Text className="text-gray-900 font-bold text-base">{user.name}</Text>
            <Text className="text-gray-500 text-sm">@{user.userName}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOpinions = () => (
    <View className="mt-4">
      <Text className="px-4 text-gray-900 font-bold text-lg mb-3">Opinions</Text>
      {(searchData?.websiteResults.opinions || []).map((opinion) => (
        <TouchableOpacity
          key={opinion._id}
          onPress={() => navigation.navigate('OpinionDetails', { post: opinion })}
          className="bg-white p-4 mb-2 border-b border-gray-100"
        >
          <View className="flex-row items-center mb-3">
            <Image
              source={{ uri: opinion.userProfileImage || 'https://via.placeholder.com/30' }}
              className="w-8 h-8 rounded-full"
            />
            <View className="ml-2">
              <Text className="font-bold text-gray-800">{opinion.userName}</Text>
              <Text className="text-gray-400 text-xs">{opinion.date} • {opinion.time}</Text>
            </View>
          </View>

          <View className="flex-row">
            <Text className="text-gray-700 leading-5 flex-1" numberOfLines={3}>
              {opinion.description}
            </Text>
            {opinion.image && (
              <Image
                source={{ uri: opinion.image }}
                className="w-16 h-16 rounded-lg ml-3 bg-gray-100"
              />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBooks = () => (
    <View className="mt-4">
      <Text className="px-4 text-gray-900 font-bold text-lg mb-3">Books & PDFs</Text>
      {[...(searchData?.websiteResults.books || []), ...(searchData?.websiteResults.pdfBooks || [])].map((book, idx) => (
        <TouchableOpacity
          key={book._id || idx}
          onPress={() => book.pdf ? Linking.openURL(book.pdf) : null}
          className="flex-row items-center px-4 py-3 bg-white mb-2"
        >
          <View className={`w-12 h-16 rounded-md items-center justify-center ${book.pdf ? 'bg-red-50' : 'bg-blue-50'}`}>
            <Ionicons name={book.pdf ? "document-text" : "book"} size={24} color={book.pdf ? "#EF4444" : "#3B82F6"} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-gray-900 font-bold text-base" numberOfLines={1}>{book.bookName}</Text>
            <Text className="text-gray-500 text-sm">{book.writerName || book.owner || 'Unknown'}</Text>
            {book.pdf && <Text className="text-red-500 text-xs font-bold mt-1">PDF Available</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderGoogleResults = () => (
    <View className="mt-4 pb-10">
      <Text className="px-4 text-gray-900 font-bold text-lg mb-3">Web Results</Text>
      {(searchData?.googleResults?.items || []).map((item, idx) => (
        <TouchableOpacity
          key={idx}
          onPress={() => Linking.openURL(item.link)}
          className="bg-white p-4 mb-2"
        >
          <Text className="text-blue-600 font-bold text-base mb-1" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-green-700 text-xs mb-1" numberOfLines={1}>
            {item.displayLink}
          </Text>
          <Text className="text-gray-600 text-sm leading-5" numberOfLines={2}>
            {item.snippet}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-500">Searching Flybook...</Text>
      </View>
    );
  }

  const hasUsers = (searchData?.websiteResults?.users?.length || 0) > 0;
  const hasOpinions = (searchData?.websiteResults?.opinions?.length || 0) > 0;
  const hasBooks = (searchData?.websiteResults?.books?.length || 0) > 0 || (searchData?.websiteResults?.pdfBooks?.length || 0) > 0;
  const hasGoogle = (searchData?.googleResults?.items?.length || 0) > 0;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Tab Bar */}
      <View className="bg-white border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2 py-2">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full mr-2 ${activeTab === tab ? 'bg-blue-600' : 'bg-gray-100'
                }`}
            >
              <Text
                className={`font-semibold ${activeTab === tab ? 'text-white' : 'text-gray-600'
                  }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {activeTab === 'All' && (
          <>
            {searchData?.aiResult && searchData.aiResult !== "No AI result found" && renderAiResult()}
            {hasUsers && renderUsers()}
            {hasOpinions && renderOpinions()}
            {hasBooks && renderBooks()}
            {hasGoogle && renderGoogleResults()}
          </>
        )}

        {activeTab === 'People' && renderUsers()}
        {activeTab === 'Opinions' && renderOpinions()}
        {activeTab === 'Books' && renderBooks()}
        {activeTab === 'Web' && renderGoogleResults()}

        {!isLoading && !hasUsers && !hasOpinions && !hasBooks && !hasGoogle && (!searchData?.aiResult || searchData.aiResult === "No AI result found") && (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="search-outline" size={80} color="#D1D5DB" />
            <Text className="mt-4 text-gray-500 text-lg">No results found for "{query}"</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default SearchResult;
