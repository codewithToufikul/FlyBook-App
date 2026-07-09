import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import OnindoAllBooks from './OnindoAllBooks';
import OnindoMyBooks from './OnindoMyBooks';
import OnindoBookRequests from './OnindoBookRequests';

type TabKey = 'allBooks' | 'myBooks' | 'requests';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { key: 'allBooks', label: 'All Books', icon: 'library' },
  { key: 'myBooks', label: 'My Books', icon: 'bookmark' },
  { key: 'requests', label: 'Requests', icon: 'git-pull-request' },
];

const OnindoLibrary = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('allBooks');

  const bg = isDark ? '#0f172a' : '#F8FAFC';
  const headerBg = isDark ? '#0f172a' : '#FFFFFF';
  const borderColor = isDark ? '#1e293b' : '#F1F5F9';
  const titleColor = isDark ? '#f8fafc' : '#0F172A';
  const btnBg = isDark ? '#1e293b' : '#F1F5F9';
  const activeColor = isDark ? '#a78bfa' : '#7c3aed';

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'allBooks':
        return <OnindoAllBooks />;
      case 'myBooks':
        return <OnindoMyBooks />;
      case 'requests':
        return <OnindoBookRequests />;
      default:
        return <OnindoAllBooks />;
    }
  }, [activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={headerBg}
      />
      <SafeAreaView
        edges={['top']}
        style={[styles.header, { backgroundColor: headerBg, borderBottomColor: borderColor }]}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.iconBtn, { backgroundColor: btnBg }]}
          >
            <Ionicons name="arrow-back" size={22} color={isDark ? '#f8fafc' : '#1E293B'} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <LinearGradient
              colors={['#7c3aed', '#a78bfa']}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="infinite" size={18} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={[styles.headerTitle, { color: titleColor }]}>Onindo</Text>
              <Text style={[styles.headerSubtitle, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                Permanent Book Sharing
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('AddOnindoBook')}
            style={[styles.iconBtn, { backgroundColor: btnBg }]}
          >
            <Ionicons name="add" size={26} color={activeColor} />
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.tabItem,
                      { backgroundColor: isDark ? '#1e293b' : '#F1F5F9' },
                      isActive && {
                        backgroundColor: isDark
                          ? 'rgba(124, 58, 237, 0.15)'
                          : 'rgba(124, 58, 237, 0.08)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={isActive ? tab.icon : `${tab.icon}-outline`}
                      size={17}
                      color={isActive ? activeColor : isDark ? '#64748b' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        { color: isActive ? activeColor : isDark ? '#64748b' : '#64748B' },
                        isActive && { fontWeight: '800' },
                      ]}
                    >
                      {tab.label}
                    </Text>
                    {isActive && (
                      <LinearGradient
                        colors={['#7c3aed', '#a78bfa']}
                        style={styles.activeIndicator}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoGradient: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabContainer: {
    paddingBottom: 10,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  content: { flex: 1 },
});

export default OnindoLibrary;
