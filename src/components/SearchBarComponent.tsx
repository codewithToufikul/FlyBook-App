import { TextInput, View } from 'react-native'
import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { saveSearchQuery } from '../utils/searchHistory'

type RootStackParamList = {
    SearchResult: { query: string }
}

const SearchBarComponent = () => {
    const [searchText, setSearchText] = useState('')
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'SearchResult'>>()

    const handleSearch = async () => {
        if (!searchText.trim()) return

        await saveSearchQuery(searchText)
        navigation.navigate('SearchResult', {
            query: searchText
        })
    }

    return (
        <View className="flex-1 justify-center">
            <View className="h-10 my-2 rounded-xl bg-gray-100 px-3 py-0 justify-center">
                <TextInput
                    placeholder="Search Flybook"
                    className="text-base text-gray-900"
                    placeholderTextColor="#9ca3af"
                    value={searchText}
                    onChangeText={setSearchText}
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                />
            </View>
        </View>
    )
}

export default SearchBarComponent
