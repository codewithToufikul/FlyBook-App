import React, { useState } from 'react';
import { View, Text, Image, Pressable, Alert } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
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
import WalletIcon from '../icons/WalletIcon';
function WalletIconWrapper({ size, color }: { size: number; color: string }) {
  return <WalletIcon size={size} color={color} />;
}
const MENU_SECTIONS = [
  {
    title: 'Main',
    items: [
      { label: 'Home', icon: HomeThinIcon, route: 'MainTabs' },
      {
        label: 'Friends',
        icon: FriendsIcon,
        route: 'MainTabs',
        params: { screen: 'Home', params: { screen: 'Peoples' } }
      },
      { label: 'Library', icon: LibraryIcon, route: 'Library' },
      {
        label: 'Channels',
        icon: ChannelThinIcon,
        route: 'MainTabs',
        params: { screen: 'Home', params: { screen: 'Channels' } }
      },
    ]
  },
  {
    title: 'Services',
    items: [
      {
        label: 'Marketplace',
        icon: MarketThinIcon,
        route: 'MainTabs',
        params: { screen: 'Home', params: { screen: 'Marketplace' } },
      },
      {
        label: 'E-Learning',
        icon: LearningThinIcon,
        route: 'MainTabs',
        params: { screen: 'Home', params: { screen: 'ELearning' } }
      },
      {
        label: 'Audio Books',
        icon: AudioBookIcon,
        route: 'MainTabs',
        params: { screen: 'Home', params: { screen: 'AudioBooks' } }
      },
      {
        label: 'My Wallet',
        icon: WalletIconWrapper,
        route: 'MainTabs',
        params: { screen: 'Home', params: { screen: 'Wallet' } }
      },
      {
        label: 'Wallet Shop',
        icon: WalletShopIcon,
        route: 'MainTabs',
        params: { screen: 'Home', params: { screen: 'WalletShop' } }
      },
      {
        label: 'E-Jobs',
        icon: EJobsIcon,
        route: 'MainTabs',
        params: { screen: 'Home', params: { screen: 'EJobs' } }
      },
    ]
  },
  {
    title: 'Community',
    items: [
      {
        label: 'Communities',
        icon: CommunityIcon,
        route: 'MainTabs',
        params: { screen: 'Home', params: { screen: 'Communities' } }
      },
      {
        label: 'Organizations',
        icon: OrganizationIcon,
        route: 'MainTabs',
        params: { screen: 'Home', params: { screen: 'Organizations' } }
      },
      {
        label: 'Social Response',
        icon: SocialResIcon,
        route: 'MainTabs',
        params: { screen: 'Home', params: { screen: 'Communities', params: { screen: 'SocialResponse' } } }
      },
    ]
  },
  {
    title: 'Support',
    items: [
      { label: 'Settings', icon: SettingIcon, route: 'Settings' },
      // { label: 'Help & Support', icon: HelpIcon, route: 'HelpCenter' },
    ]
  }
];

export default function CustomDrawer(props: any) {
  const { navigation, state } = props;
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  // Helper to get the deeply nested active route name
  const getActiveRouteName = (routeState: any): string => {
    if (!routeState || !routeState.routes) return '';
    const route = routeState.routes[routeState.index];

    if (route.state) {
      // Dive into nested state
      return getActiveRouteName(route.state);
    }

    return route.name;
  };

  const activeRouteName = getActiveRouteName(state);

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

  const handleNavigation = (item: any) => {
    if (item.params) {
      navigation.navigate(item.route, item.params);
    } else {
      navigation.navigate(item.route);
    }
  };

  // Default avatar if user has none
  const defaultAvatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

  return (
    <View className="flex-1 bg-gray-50 dark:bg-slate-950">
      {/* Premium Header with Gradient Effect */}
      <Pressable
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home', params: { screen: 'Profile' } })}
        className="bg-white dark:bg-slate-900 pt-3 pb-4 px-5 rounded-3xl mx-4 mt-20 shadow-lg shadow-gray-200 dark:shadow-none border border-gray-100 dark:border-slate-800"
        android_ripple={{ color: isDark ? '#334155' : '#f3f4f6' }}
      >
        <View className="flex-row items-center gap-4 mt-2">
          {/* Profile Image with Ring */}
          <View className="relative ">
            <Image
              source={{ uri: user?.profileImage || defaultAvatar }}
              className="w-16 h-16 rounded-full border-3 border-white/30 dark:border-slate-700/30"
            />
            <View className="absolute bottom-0 right-0 w-5 h-5 bg-green-400 rounded-full border-2 border-white dark:border-slate-800" />
          </View>

          {/* User Info */}
          <View className="flex-1">
            <Text className="text-black dark:text-slate-50 text-lg font-bold leading-tight">
              {user?.name || 'User'}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {user?.email || 'user@flybook.com'}
            </Text>
            {user?.coins !== undefined && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="wallet-outline" size={14} color="#F59E0B" />
                <Text className="text-amber-500 text-xs font-semibold ml-1">
                  {Number(user.coins || 0).toFixed(2)} coins
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>

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
            <Text className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider px-5 mb-2">
              {section.title}
            </Text>

            {/* Section Items */}
            <View className="bg-white dark:bg-slate-900 mx-3 rounded-2xl overflow-hidden shadow-sm shadow-gray-200 dark:shadow-none border border-gray-100 dark:border-slate-800">
              {section.items.map((item, itemIndex) => {
                // Check if this item is active
                const isActive = item.params
                  ? activeRouteName === item.params.params.screen
                  : activeRouteName === item.route;

                return (
                  <DrawerItem
                    key={itemIndex}
                    label={item.label}
                    Icon={item.icon}
                    active={isActive}
                    onPress={() => handleNavigation(item)}
                    isLast={itemIndex === section.items.length - 1}
                  />
                );
              })}
            </View>
          </View>
        ))}

        {/* App Version & Branding */}
        <View className="items-center mt-6 px-5 pb-6">
          <Text className="text-gray-400 dark:text-slate-500 text-xs">FlyBook v1.0.0</Text>
          <Text className="text-gray-400 dark:text-slate-500 text-xs mt-1">Your Social Learning Platform</Text>
        </View>
      </DrawerContentScrollView>

      {/* Premium Logout Button */}
      <View className="px-5 pb-8 pt-2">
        <Pressable
          onPress={handleLogout}
          disabled={loggingOut}
          className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-sm shadow-red-100 dark:shadow-none"
          android_ripple={{ color: isDark ? '#450a0a' : '#fef2f2' }}
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
  Icon: any;
  onPress: () => void;
  active: boolean;
  isLast: boolean;
}) {
  const { isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-3.5 transition-colors duration-200
        ${active ? (isDark ? 'bg-teal-500/10' : 'bg-teal-50') : (isDark ? 'bg-slate-900' : 'bg-white')}
        ${!isLast ? (isDark ? 'border-b border-slate-800' : 'border-b border-gray-100') : ''}
      `}
      android_ripple={{ color: isDark ? '#115e59' : '#f0fdfa' }}
    >
      {/* Icon Container */}
      <View className={`w-10 h-10 rounded-full items-center justify-center
        ${active ? (isDark ? 'bg-teal-500/20' : 'bg-teal-100') : (isDark ? 'bg-slate-800' : 'bg-gray-100')}
      `}>
        <Icon size={20} color={active ? '#14b8a6' : (isDark ? '#64748b' : '#9ca3af')} />
      </View>

      {/* Label */}
      <Text className={`flex-1 ml-3 font-medium text-base
        ${active ? (isDark ? 'text-teal-400' : 'text-teal-700') : (isDark ? 'text-slate-300' : 'text-gray-700')}
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