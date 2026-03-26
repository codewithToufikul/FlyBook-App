import { TextInput, View, Platform, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Ionicons from 'react-native-vector-icons/Ionicons'

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
        <View style={{ width: '100%', padding: 0, justifyContent: 'center' }}>
            <View style={{
                height: 38,
                backgroundColor: '#f3f4f6',
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
            }}>
                <Ionicons name="search" size={16} color="#9ca3af" />
                <TextInput
                    placeholder="Search Flybook"
                    style={{
                        flex: 1,
                        marginLeft: 8,
                        fontSize: 14,
                        color: '#111827',
                        padding: 0,
                        height: '100%',
                    }}
                    placeholderTextColor="#9ca3af"
                    value={searchText}
                    onChangeText={setSearchText}
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                    autoFocus={true}
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                        <Ionicons
                            name="close-circle"
                            size={16}
                            color="#9ca3af"
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )
}

export default SearchBarComponent
