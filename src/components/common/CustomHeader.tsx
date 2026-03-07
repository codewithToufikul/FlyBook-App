import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

interface CustomHeaderProps {
  title: string;
  showMenuIcon?: boolean;
  showBackButton?: boolean;
  showSettingsIcon?: boolean;
  rightComponent?: React.ReactNode;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  showMenuIcon = true,
  showBackButton = false,
  showSettingsIcon = false,
  rightComponent
}) => {
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const handleMenuPress = () => {
    navigation.getParent()?.dispatch(DrawerActions.openDrawer());
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const iconColor = isDark ? '#f8fafc' : '#334155';
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#e0e0e0';
  const textColor = isDark ? '#f8fafc' : '#0f172a';

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: bgColor, borderBottomColor: borderColor }]}>
      <View style={styles.leftSection}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color={iconColor} />
          </TouchableOpacity>
        ) : showMenuIcon ? (
          <TouchableOpacity
            onPress={handleMenuPress}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={28} color={iconColor} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.centerSection}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.rightSection}>
        {rightComponent ? (
          rightComponent
        ) : showSettingsIcon ? (
          <TouchableOpacity
            onPress={handleSettingsPress}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color={iconColor} />
          </TouchableOpacity>
        ) : null}
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
    borderBottomWidth: 1,
    elevation: 4,
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
    textAlign: 'center',
  },
});

export default CustomHeader;