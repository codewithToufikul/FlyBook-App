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
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

type TopNavProps = {
  navigation: NativeStackNavigationProp<any>;
};

const TopNav = ({ navigation }: TopNavProps) => {
  const { user } = useAuth();
  const { unreadCount } = useSocket();
  const { isDark } = useTheme();

  const iconColor = isDark ? '#94A3B8' : '#4B5563'; // slate-400 : slate-600

  return (
    <SafeAreaView edges={['top']} className="bg-white dark:bg-slate-900 transition-colors duration-200">
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0f172a" : "#FFFFFF"}
      />

      {/* Main Header */}
      <View className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <View className="flex-row items-center justify-between px-3 py-2.5">
          <TouchableOpacity
            onPress={() => navigation.navigate('Home', { screen: 'HomeScreen' })}
            className="flex-1"
            activeOpacity={0.7}
          >
            <Image
              source={logo}
              className="w-40 h-14"
              resizeMode="contain"
              style={isDark ? { tintColor: '#F8FAFC' } : undefined}
            />
          </TouchableOpacity>
          <View className="flex-row items-center gap-4 ml-3">


            {/* Community Button */}
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800"
              onPress={() => navigation.navigate('Home', { screen: 'Communities' })}
              activeOpacity={0.7}
            >
              <CommunityIcon size={36} color={iconColor} />
            </TouchableOpacity>

            {/* FlyBot AI Button */}
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center rounded-full active:bg-indigo-100 dark:active:bg-slate-800"
              onPress={() => navigation.navigate('Home', { screen: 'AiAssistant' })}
              activeOpacity={0.7}
            >
              <Ionicons name="sparkles" size={24} color="#6366f1" />
            </TouchableOpacity>

            {/* Messages with Badge */}
            <TouchableOpacity
              className="w-10 h-10 items-center justify-center relative rounded-full active:bg-slate-100 dark:active:bg-slate-800"
              onPress={() => navigation.navigate('Home', { screen: 'Chats' })}
              activeOpacity={0.7}
            >
              <MessageIcon size={36} color={iconColor} />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1 border-2 border-white dark:border-slate-900">
                  <Text className="text-white text-[10px] font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Profile or Login */}
            {user ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('Home', { screen: 'Profile' })}
                activeOpacity={0.7}
                className="w-11 h-11 rounded-full border-2 border-teal-200 dark:border-teal-900 overflow-hidden"
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
                className="bg-teal-600 dark:bg-teal-500 px-4 py-1.5 rounded-full shadow-sm"
                activeOpacity={0.7}
              >
                <Text className="text-white text-xs font-semibold uppercase tracking-wider">Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="py-2">
          <View className="flex-row items-center justify-around px-1">
            <TouchableOpacity
              onPress={() => {
                navigation.getParent()?.dispatch(DrawerActions.openDrawer());
              }}
              className="items-center w-12 h-12 justify-center rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
              activeOpacity={0.7}
            >
              <MenuIcon size={32} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Marketplace')}
              className="items-center w-12 h-12 justify-center rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
              activeOpacity={0.7}
            >
              <StoreIcon size={32} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Home', { screen: 'ELearning' })}
              className="items-center w-12 h-12 justify-center rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
              activeOpacity={0.7}
            >
              <LearningIcon size={34} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Home', { screen: 'PdfStack' })}
              className="items-center w-12 h-12 justify-center rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
              activeOpacity={0.7}
            >
              <FileIcon size={28} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Home', { screen: 'Library' })}
              className="items-center w-12 h-12 justify-center rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
              activeOpacity={0.7}
            >
              <WalletIcon size={32} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Home', { screen: 'Channels' })}
              className="items-center w-12 h-12 justify-center rounded-xl active:bg-slate-100 dark:active:bg-slate-800"
              activeOpacity={0.7}
            >
              <ChannelIcon size={32} color={iconColor} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TopNav;