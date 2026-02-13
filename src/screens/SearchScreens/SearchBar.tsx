import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  getSearchHistory,
  deleteSearchItem,
  clearSearchHistory,
  SearchHistoryItem
} from '../../utils/searchHistory';

const TRENDING_SEARCHES = [
  'Recent Books',
  'Programming Tutorials',
  'FlyBook Insights',
  'Top Scholars',
  'Educational PDF',
  'Tech News',
];

const QUICK_FILTERS = [
  { label: 'People', color: 'bg-blue-50', textColor: 'text-blue-600', icon: 'people', iconColor: '#2563EB' },
  { label: 'Opinions', color: 'bg-orange-50', textColor: 'text-orange-600', icon: 'chatbubbles', iconColor: '#EA580C' },
  { label: 'Books', color: 'bg-green-50', textColor: 'text-green-600', icon: 'book', iconColor: '#16A34A' },
  { label: 'Pages', color: 'bg-purple-50', textColor: 'text-purple-600', icon: 'flag', iconColor: '#9333EA' },
  { label: 'Videos', color: 'bg-red-50', textColor: 'text-red-600', icon: 'videocam', iconColor: '#DC2626' },
];

const SearchBar = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const isFocused = useIsFocused();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isFocused) {
      loadHistory();
    }
  }, [isFocused]);

  const loadHistory = async () => {
    setIsLoading(true);
    const savedHistory = await getSearchHistory();
    setHistory(savedHistory);
    setIsLoading(false);
  };

  const handleDeleteHistory = async (id: string) => {
    const updatedHistory = await deleteSearchItem(id);
    setHistory(updatedHistory);
  };

  const handleClearAll = async () => {
    await clearSearchHistory();
    setHistory([]);
  };

  const handleSearchClick = (query: string) => {
    navigation.navigate('SearchResult', { query });
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Recent Searches Header */}
        <View className="px-4 pt-5 pb-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-900 font-bold text-2xl">Recent</Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={handleClearAll}>
                <Text className="text-blue-600 font-semibold text-base">Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* History Items */}
        <View className="px-4">
          {isLoading ? (
            <ActivityIndicator size="small" color="#3B82F6" className="py-4" />
          ) : history.length > 0 ? (
            history.map((item, index) => (
              <View key={item.id} className="flex-row items-center py-3 border-b border-gray-50">
                <TouchableOpacity
                  className="flex-row items-center flex-1"
                  onPress={() => handleSearchClick(item.query)}
                >
                  <View className="bg-gray-100 p-2 rounded-full">
                    <Ionicons name="time-outline" size={20} color="#6B7280" />
                  </View>
                  <Text className="text-gray-900 font-medium text-lg ml-3 flex-1">
                    {item.query}
                  </Text>
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={() => handleDeleteHistory(item.id)}
                  className="p-2"
                >
                  <Ionicons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text className="text-gray-400 text-base py-4">No recent searches</Text>
          )}
        </View>

        {/* Trending Searches */}
        <View className="mt-6 px-4 py-5 bg-gray-50">
          <Text className="text-gray-900 font-bold text-xl mb-4">
            Trending Searches
          </Text>
          <View className="flex-row flex-wrap">
            {TRENDING_SEARCHES.map((tag, index) => (
              <TouchableOpacity
                key={index}
                className="bg-white px-5 py-2.5 rounded-full mr-2 mb-2.5 border border-gray-200 active:bg-gray-100"
                onPress={() => handleSearchClick(tag)}
              >
                <Text className="text-gray-800 font-medium text-sm">
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Categories */}
        <View className="mt-2 px-4 py-5 mb-10">
          <Text className="text-gray-900 font-bold text-xl mb-4">
            Quick Filters
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {QUICK_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.label}
                className={`${filter.color} w-[48%] p-5 rounded-2xl active:opacity-70 mb-3`}
              >
                <Ionicons name={filter.icon as any} size={24} color={filter.iconColor} style={{ marginBottom: 8 }} />
                <Text className={`${filter.textColor} font-bold text-lg`}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SearchBar;