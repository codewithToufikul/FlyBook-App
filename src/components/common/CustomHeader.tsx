import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CustomHeaderProps {
  title: string;
  showMenuIcon?: boolean;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ title, showMenuIcon = true }) => {
  const navigation = useNavigation();

  const handleMenuPress = () => {
    navigation.getParent()?.dispatch(DrawerActions.openDrawer());
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.leftSection}>
        {showMenuIcon && (
          <TouchableOpacity 
            onPress={handleMenuPress}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={28} color="#333" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.centerSection}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      
      <View style={styles.rightSection}>
        {/* এখানে চাইলে অন্য icon যোগ করতে পারবেন */}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  menuButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});

export default CustomHeader