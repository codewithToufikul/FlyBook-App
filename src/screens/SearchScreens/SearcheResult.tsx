import { View, Text } from 'react-native'
import React, { useEffect } from 'react'

type SearchRoute = { params?: { query?: string } }
const SearcheResult: React.FC<{ route: SearchRoute }> = ({ route }) => {
  const { query } = route.params || {}

  useEffect(() => {
    console.log('Search Query:', query)
  }, [query])

  return (
    <View>
      <Text>SearcheResult</Text>
      <Text>Query: {query}</Text>
    </View>
  )
}

export default SearcheResult
