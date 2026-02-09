import React, { useState } from 'react';
import { View, Text, Image, Pressable, Alert } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../hooks/useAuth';
import { ButtonLoader } from './common';
import ArrowRightIcon from '../icons/ArrowRightIcon';
import HomeThinIcon from '../icons/HomeThinIcon';
import FriendsIcon from '../icons/FriendsIcon';
import LibraryIcon from '../icons/LibraryIcon';
import ChannelThinIcon from '../icons/ChannelThinIcon';
import MarketThinIcon from '../icons/MarketThinIcon';
import LearningThinIcon from '../icons/LearningThinIcon';
import AudioBookIcon from '../icons/AudioBookIcon';
import WalletShopIcon from '../icons/WalletShopIcon';
import EJobsIcon from '../icons/EJobsIcon';
import OrganizationIcon from '../icons/OrganizationIcon';
import CommunityIcon from '../icons/CommunityIcon';
import SocialResIcon from '../icons/SocialResIcon';
import SettingIcon from '../icons/SettingIcon';
import HelpIcon from '../icons/HelpIcon';
const MENU_SECTIONS = [
  {
    title: 'Main',
    items: [
      { label: 'Home', icon: HomeThinIcon, route: 'MainTabs' },
      { label: 'Friends', icon: FriendsIcon, route: 'Friends' },
      { label: 'Library', icon: LibraryIcon, route: 'Library' },
      { label: 'Channels', icon: ChannelThinIcon, route: 'Channels' },
    ]
  },
  {
    title: 'Services',
    items: [
      { label: 'Marketplace', icon: MarketThinIcon, route: 'Marketplace' },
      { label: 'E-Learning', icon: LearningThinIcon, route: 'ELearning' },
      { label: 'Audio Books', icon: AudioBookIcon, route: 'AudioBooks' },
      { label: 'Wallet Shop', icon: WalletShopIcon, route: 'WalletShop' },
      { label: 'E-Jobs', icon: EJobsIcon, route: 'EJobs' },
    ]
  },
  {
    title: 'Community',
    items: [
    {label: 'Communities', icon: CommunityIcon, route: 'Communities' },
      { label: 'Organizations', icon: OrganizationIcon, route: 'Organizations' },
      { label: 'Social Response', icon: SocialResIcon, route: 'SocialResponse' },
    ]
  },
  {
    title: 'Support',
    items: [
      { label: 'Settings', icon: SettingIcon, route: 'Settings' },
      { label: 'Help & Support', icon: HelpIcon, route: 'Help' },
    ]
  }
];

export default function CustomDrawer(props: any) {
  const { navigation, state } = props;
  const activeRouteName = state.routeNames[state.index];
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
              // Navigation will automatically happen via RootNavigator
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  // Default avatar if user has none
  const defaultAvatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

  return (
    <View className="flex-1 bg-gray-50">
      {/* Premium Header with Gradient Effect */}
      <View className="bg-white pt-3 pb-4 px-5 rounded-3xl mx-4 mt-20 shadow-lg shadow-gray-200">
        <View className="flex-row items-center gap-4 mt-2">
          {/* Profile Image with Ring */}
          <View className="relative ">
            <Image
              source={{ uri: user?.profileImage || defaultAvatar }}
              className="w-16 h-16 rounded-full border-3 border-white/30"
            />
            <View className="absolute bottom-0 right-0 w-5 h-5 bg-green-400 rounded-full border-2 border-white" />
          </View>
          
          {/* User Info */}
          <View className="flex-1">
            <Text className="text-black text-lg font-bold leading-tight">
              {user?.name || 'User'}
            </Text>
            <Text className="text-slate-500 text-sm mt-0.5">
              {user?.email || 'user@flybook.com'}
            </Text>
            {user?.coins !== undefined && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="wallet-outline" size={14} color="#F59E0B" />
                <Text className="text-amber-500 text-xs font-semibold ml-1">
                  {user.coins} coins
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Menu Content */}
      <DrawerContentScrollView
        {...props}
        className="flex-1 "
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} className="mb-6">
            {/* Section Header */}
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider px-5 mb-2">
              {section.title}
            </Text>
            
            {/* Section Items */}
            <View className="bg-white mx-3 rounded-2xl overflow-hidden shadow-sm shadow-gray-200">
              {section.items.map((item, itemIndex) => (
                <DrawerItem
                  key={item.route}
                  label={item.label}
                  Icon={item.icon}
                  active={activeRouteName === item.route}
                  onPress={() => navigation.navigate(item.route)}
                  isLast={itemIndex === section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        {/* App Version & Branding */}
        <View className="items-center mt-6 px-5">
          <Text className="text-gray-400 text-xs">FlyBook v1.0.0</Text>
          <Text className="text-gray-400 text-xs mt-1">Your Social Learning Platform</Text>
        </View>
      </DrawerContentScrollView>

      {/* Premium Logout Button */}
      <View className="px-5 pb-8 pt-2">
        <Pressable
          onPress={handleLogout}
          disabled={loggingOut}
          className="bg-white border border-red-200 py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-sm shadow-red-100"
          android_ripple={{ color: '#fef2f2' }}
        >
          {loggingOut ? (
            <ButtonLoader color="#EF4444" size="small" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text className="text-red-500 font-semibold text-base">Logout</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}



// Enhanced Drawer Item Component
function DrawerItem({
  label,
  Icon,
  onPress,
  active,
  isLast,
}: {
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  onPress: () => void;
  active: boolean;
  isLast: boolean;
}) {

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-3.5 transition-colors duration-200
        ${active ? 'bg-teal-50' : 'bg-white hover:bg-gray-50'}
        ${!isLast ? 'border-b border-gray-100' : ''}
      `}
      android_ripple={{ color: '#f0fdfa' }}
    >
      {/* Icon Container */}
      <View className={`w-10 h-10 rounded-full items-center justify-center
        ${active ? 'bg-teal-100' : 'bg-gray-100'}
      `}>
        <Icon size={20} color={active ? '#14b8a6' : '#9ca3af'} />
      </View>

      {/* Label */}
      <Text className={`flex-1 ml-3 font-medium text-base
        ${active ? 'text-teal-700' : 'text-gray-700'}
      `}>
        {label}
      </Text>

      {/* Active Indicator */}
      <View className="flex-row items-center gap-2">
        {active && (
          <View className="w-2 h-2 rounded-full bg-teal-500" />
        )}
        <ArrowRightIcon size={20} color={active ? '#14b8a6' : '#d1d5db'} />
      </View>
    </Pressable>
  );
}