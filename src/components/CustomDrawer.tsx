import { View, Text, Image, Pressable } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';

export default function CustomDrawer(props: any) {
  const { navigation } = props;

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1 }}
    >
      {/* 🔵 Header / Profile */}
      <View className="bg-teal-600 px-5 py-10 rounded-br-3xl">
        <Image
          source={{
            uri: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
          }}
          className="w-16 h-16 rounded-full border-2 border-white mb-3"
        />
        <Text className="text-white text-lg font-semibold">
          Toufikul Islam
        </Text>
        <Text className="text-teal-100 text-sm">
          @flybook
        </Text>
      </View>

      {/* 🧭 Menu items */}
      <View className="flex-1 px-4 py-6 space-y-4 bg-white">
        <DrawerItem
          label="Home"
          onPress={() => navigation.navigate('MainTabs')}
        />
        <DrawerItem
          label="Profile"
          onPress={() => navigation.navigate('Profile')}
        />
        <DrawerItem
          label="Settings"
          onPress={() => {}}
        />
      </View>

      {/* 🔴 Logout */}
      <View className="px-4 pb-6">
        <Pressable
          onPress={() => {}}
          className="bg-red-500 py-3 rounded-xl"
        >
          <Text className="text-white text-center font-semibold">
            Logout
          </Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}

function DrawerItem({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="py-3 px-4 rounded-xl bg-gray-100"
    >
      <Text className="text-gray-800 font-medium">
        {label}
      </Text>
    </Pressable>
  );
}
