import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native'
import React from 'react'

// Demo search history data - Facebook style
const DEMO_HISTORY = [
  { 
    id: 1, 
    type: 'person',
    name: 'Sakib Al Hasan', 
    subtitle: 'Mutual friend • Dhaka',
    avatar: 'https://i.pravatar.cc/150?img=12',
    time: '2 min ago' 
  },
  { 
    id: 2, 
    type: 'person',
    name: 'Tasnia Ahmed', 
    subtitle: '5 mutual friends',
    avatar: 'https://i.pravatar.cc/150?img=45',
    time: '1 hour ago' 
  },
  { 
    id: 3, 
    type: 'page',
    name: 'Programming Hero',
    subtitle: '125K followers • Education',
    avatar: 'https://i.pravatar.cc/150?img=60',
    time: '3 hours ago' 
  },
  { 
    id: 4, 
    type: 'group',
    name: 'Bangladesh Developers Community',
    subtitle: '45K members • Public group',
    avatar: 'https://i.pravatar.cc/150?img=25',
    time: '1 day ago' 
  },
  { 
    id: 5, 
    type: 'person',
    name: 'Rahim Khan',
    subtitle: 'Works at Google • Chittagong',
    avatar: 'https://i.pravatar.cc/150?img=33',
    time: '2 days ago' 
  },
  { 
    id: 6, 
    type: 'page',
    name: 'Tech News Bangladesh',
    subtitle: '89K followers • Media',
    avatar: 'https://i.pravatar.cc/150?img=70',
    time: '3 days ago' 
  },
  { 
    id: 7, 
    type: 'person',
    name: 'Nadia Islam',
    subtitle: 'Lives in Sylhet',
    avatar: 'https://i.pravatar.cc/150?img=47',
    time: '4 days ago' 
  },
  { 
    id: 8, 
    type: 'group',
    name: 'React Native Developers BD',
    subtitle: '32K members • Private group',
    avatar: 'https://i.pravatar.cc/150?img=55',
    time: '5 days ago' 
  },
]

const TRENDING_SEARCHES = [
  'Movies 2024',
  'Restaurants near me',
  'Job opportunities',
  'Gaming setup',
  'iPhone 15',
  'Travel destinations',
]

const SearchBar = () => {
  const handleDeleteHistory = (id: number) => {
    console.log('Delete:', id)
  }

  const handleClearAll = () => {
    console.log('Clear all history')
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Recent Searches Header */}
        <View className="bg-white px-4 pt-5 pb-3 border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-900 font-bold text-2xl">Recent</Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text className="text-blue-600 font-semibold text-base">Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* History Items */}
        <View className="bg-white">
          {DEMO_HISTORY.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                className="flex-row items-center px-4 py-3.5 active:bg-gray-50"
                onPress={() => console.log('Search:', item.name)}
              >
                {/* Avatar */}
                <Image
                  source={{ uri: item.avatar }}
                  className="w-14 h-14 rounded-full bg-gray-300"
                />

                {/* Info */}
                <View className="flex-1 ml-3.5">
                  <Text className="text-gray-900 font-semibold text-base mb-0.5">
                    {item.name}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {item.subtitle}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    {item.time}
                  </Text>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={() => handleDeleteHistory(item.id)}
                  className="p-2 ml-2"
                >
                  <Text className="text-gray-400 text-xl font-light">×</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              
              {/* Divider */}
              {index < DEMO_HISTORY.length - 1 && (
                <View className="h-px bg-gray-100 ml-20" />
              )}
            </View>
          ))}
        </View>

        {/* Trending Searches */}
        <View className="mt-4 bg-white px-4 py-5">
          <Text className="text-gray-900 font-bold text-xl mb-4">
            Trending Searches
          </Text>
          <View className="flex-row flex-wrap">
            {TRENDING_SEARCHES.map((tag, index) => (
              <TouchableOpacity
                key={index}
                className="bg-gray-100 px-5 py-2.5 rounded-full mr-2 mb-2.5 active:bg-gray-200"
                onPress={() => console.log('Trending search:', tag)}
              >
                <Text className="text-gray-800 font-medium text-sm">
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Categories */}
        <View className="mt-4 bg-white px-4 py-5 mb-6">
          <Text className="text-gray-900 font-bold text-xl mb-4">
            Quick Filters
          </Text>
          <View className="space-y-2">
            {[
              { label: 'People', color: 'bg-blue-50', textColor: 'text-blue-600' },
              { label: 'Pages', color: 'bg-orange-50', textColor: 'text-orange-600' },
              { label: 'Groups', color: 'bg-green-50', textColor: 'text-green-600' },
              { label: 'Photos', color: 'bg-purple-50', textColor: 'text-purple-600' },
              { label: 'Videos', color: 'bg-red-50', textColor: 'text-red-600' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.label}
                className={`${filter.color} px-5 py-4 rounded-2xl active:opacity-70 mb-2`}
              >
                <Text className={`${filter.textColor} font-semibold text-base`}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default SearchBar