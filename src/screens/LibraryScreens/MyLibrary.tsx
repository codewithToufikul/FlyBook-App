import React, { useState, useCallback, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import MyBooks from './MyBooks';
import BookRequests from './BookRequests';
import MyRequests from './MyRequests';
import TransferHistory from './TransferHistory';

type TabKey = 'myBooks' | 'bookRequests' | 'myRequests' | 'transfers';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { key: 'myBooks', label: 'My Books', icon: 'library' },
  { key: 'bookRequests', label: 'Requests', icon: 'git-pull-request' },
  { key: 'myRequests', label: 'My Requests', icon: 'send' },
  { key: 'transfers', label: 'Transfers', icon: 'swap-horizontal' },
];

const MyLibrary = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>(
    (route.params?.initialTab as TabKey) || 'myBooks',
  );

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab as TabKey);
    }
  }, [route.params?.initialTab]);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'myBooks':
        return <MyBooks />;
      case 'bookRequests':
        return <BookRequests />;
      case 'myRequests':
        return <MyRequests />;
      case 'transfers':
        return <TransferHistory />;
      default:
        return <MyBooks />;
    }
  }, [activeTab]);

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0f172a" : "#FFFFFF"}
      />
      <SafeAreaView edges={['top']} style={[styles.header, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, isDark && { backgroundColor: '#1e293b' }]}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#1E293B"} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={[styles.profileImg, isDark && { borderColor: '#1e293b' }]}
              />
            ) : (
              <View style={[styles.profilePlaceholder, isDark && { backgroundColor: '#1e293b' }]}>
                <Ionicons name="person" size={16} color={isDark ? "#f8fafc" : "#fff"} />
              </View>
            )}
            <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>My Library</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('AddBook')}
            style={[styles.addBtn, isDark && { backgroundColor: '#1e293b' }]}
          >
            <Ionicons name="add" size={26} color={isDark ? "#14b8a6" : "#0D9488"} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.tabItem,
                    isDark && { backgroundColor: '#1e293b' },
                    activeTab === tab.key && (isDark ? styles.tabItemActiveDark : styles.tabItemActive),
                  ]}
                >
                  <Ionicons
                    name={activeTab === tab.key ? tab.icon : `${tab.icon}-outline`}
                    size={18}
                    color={activeTab === tab.key ? (isDark ? '#14b8a6' : '#0D9488') : (isDark ? '#64748b' : '#64748B')}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      isDark && { color: '#64748b' },
                      activeTab === tab.key && (isDark ? styles.tabTextActiveDark : styles.tabTextActive),
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {activeTab === tab.key && (
                    <LinearGradient
                      colors={isDark ? ['#14b8a6', '#0f766e'] : ['#0D9488', '#0f766e']}
                      style={styles.activeIndicator}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  profilePlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    paddingBottom: 10,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
  },
  tabItemActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
  },
  tabItemActiveDark: {
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0D9488',
  },
  tabTextActiveDark: {
    color: '#14b8a6',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  content: {
    flex: 1,
  },
});

export default MyLibrary;
