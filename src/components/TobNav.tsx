import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StoreIcon from '../icons/StoreIcon';
import LearningIcon from '../icons/LearningIcon';
import FileIcon from '../icons/FileIcon';
import MenuIcon from '../icons/MenuIcon';
import WalletIcon from '../icons/WalletIcon';
import ChannelIcon from '../icons/ChannelIcon';
import MessageIcon from '../icons/MessageIcon';
import CommunityIcon from '../icons/CommunityIcon';
import logo from '../assets/logo.png';

type TopNavProps = {
  navigation: NativeStackNavigationProp<any>;
};

const TopNav = ({ navigation }: TopNavProps) => {
  const [messageCount] = useState(5);

  // User data - API থেকে আসবে
  const user = {
    profileImage: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
    name: 'John Doe'
  };


  return (
    <SafeAreaView edges={['top']} className="bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Main Header */}
      <View className="bg-white border-b border-gray-200 ">
        <View className="flex-row items-center justify-between px-3 py-2.5">
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            className="flex-1"
            activeOpacity={0.7}
          >
            <Image
              source={logo}
              className="w-36 h-11"
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View className="flex-row items-center gap-4 ml-3">


            {/* Community Button */}
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center"
              onPress={() => navigation.navigate('Community')}
              activeOpacity={0.7}
            >
              <CommunityIcon size={32} color="#4B5563" />
            </TouchableOpacity>

            {/* Messages with Badge */}
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center relative"
              onPress={() => navigation.navigate('Chats')}
              activeOpacity={0.7}
            >
              <MessageIcon size={36} color="#4B5563" />
              {messageCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1 border-2 border-white">
                  <Text className="text-white text-[10px] font-bold">
                    {messageCount > 99 ? '99+' : messageCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Profile or Login */}
            {user ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('MyProfile')}
                activeOpacity={0.7}
                className="w-11 h-11 rounded-full border-2 border-green-200 overflow-hidden"
              >
                <Image
                  source={{ uri: user.profileImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                className="bg-blue-300 px-3 py-1.5 rounded-full"
                activeOpacity={0.7}
              >
                <Text className="text-white text-xs font-medium">Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className=" border-gray-100 py-2">
          <View className="flex-row items-center justify-around px-1">
            <TouchableOpacity
              onPress={() => {
                navigation.getParent()?.dispatch(DrawerActions.openDrawer());
              }}
              className="items-center"
              activeOpacity={0.7}
            >
              <View className="items-center justify-center">
                <MenuIcon size={32} color="#4B5563" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Marketplace')}
              className="items-center"
              activeOpacity={0.7}
            >
              <View className="items-center w-12 h-12 justify-center">
                <StoreIcon size={32} color="#4B5563" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('ELearning')}
              className="items-center"
              activeOpacity={0.7}
            >
              <View className=" items-center justify-center  ">
                <LearningIcon size={32} color="#4B5563" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('PdfBook')}
              className="items-center"
              activeOpacity={0.7}
            >
              <View className="items-center justify-center  ">
                <FileIcon size={32} color="#4B5563" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Library')}
              className="items-center"
              activeOpacity={0.7}
            >
              <View className="items-center justify-center ">
                <WalletIcon size={32} color="#4B5563" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Channels')}
              className="items-center"
              activeOpacity={0.7}
            >
              <ChannelIcon size={32} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TopNav;