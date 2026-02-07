import { View, Text } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import TobNav from '../../components/TobNav'

const Home = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>()
  return (
    <View>
        <TobNav navigation={navigation}/>
      <Text>Home</Text>
    </View>
  )
}

export default Home