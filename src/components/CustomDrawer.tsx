import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';

import ArrowRightIcon from '../icons/ArrowRightIcon';
import HomeIcon from '../icons/HomeIcon';
const MENU_SECTIONS = [
  {
    title: 'Main',
    items: [
      { label: 'Home', icon: HomeIcon, route: 'MainTabs' },
    //   { label: 'Friends', icon: fndsIcon, route: 'Friends' },
    //   { label: 'Library', icon: libraryIcon, route: 'Library' },
    //   { label: 'Groups', icon: groupIcon, route: 'Groups' },
    ]
  },
  {
    title: 'Services',
    items: [
    //   { label: 'Marketplace', icon: marketIcon, route: 'Marketplace' },
    //   { label: 'E-Learning', icon: elngIcon, route: 'ELearning' },
    //   { label: 'Live Channel', icon: channelIcon, route: 'LiveChannel' },
    //   { label: 'Audio Books', icon: audioBookIcon, route: 'AudioBooks' },
    ]
  },
  {
    title: 'Community',
    items: [
    //   { label: 'Donated Books', icon: donetBookIcon, route: 'DonatedBooks' },
    //   { label: 'Nearby', icon: nearIcon, route: 'Nearby' },
    //   { label: 'Breach Alert', icon: breachIcon, route: 'BreachAlert' },
    ]
  },
  {
    title: 'Support',
    items: [
    //   { label: 'Settings', icon: settingsIcon, route: 'Settings' },
    //   { label: 'Help & Support', icon: helpIcon, route: 'Help' },
    ]
  }
];

// User data (would come from API in real app)
const USER_DATA = {
  name: 'Toufikul Islam',
  username: '@toufikulislam',
  avatar: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
  stats: {
    books: 24,
    friends: 156,
    groups: 12
  }
};

export default function CustomDrawer(props: any) {
  const { navigation, state } = props;
  const activeRouteName = state.routeNames[state.index];

  const handleLogout = () => {
    // Implement logout logic here
    console.log('Logout pressed');
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Premium Header with Gradient Effect */}
      <View className="bg-white pt-4 pb-6 px-5 rounded-3xl mx-2 mt-20 shadow-xl shadow-gray-400">
        <View className="flex-row items-center gap-4 mt-2">
          {/* Profile Image with Ring */}
          <View className="relative ">
            <Image
              source={{ uri: USER_DATA.avatar }}
              className="w-16 h-16 rounded-full border-3 border-white/30"
            />
            <View className="absolute bottom-0 right-0 w-5 h-5 bg-green-400 rounded-full border-2 border-white" />
          </View>
          
          {/* User Info */}
          <View className="flex-1">
            <Text className="text-black text-lg font-bold leading-tight">
              {USER_DATA.name}
            </Text>
            <Text className="text-slate-500 text-sm mt-0.5">
              {USER_DATA.username}
            </Text>
            
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
          className="bg-white border border-red-200 py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-sm shadow-red-100"
          android_ripple={{ color: '#fef2f2' }}
        >
          {/* <Image source={logoutIcon} className="w-5 h-5 tint-red-500" />
          <Text className="text-red-500 text-center font-semibold">
            Logout
          </Text> */}
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