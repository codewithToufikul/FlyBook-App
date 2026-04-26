import 'react-native-gesture-handler';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { SocketProvider } from './src/contexts/SocketContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { CoinEarningProvider } from './src/contexts/CoinEarningContext';
import { CartProvider } from './src/contexts/CartContext';
import RootNavigator from './src/navigations/RootNavigator';
import './global.css';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Toast, { ToastConfig } from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import notifee from '@notifee/react-native';
import { navigationRef } from './src/services/NavigationService';
import { notificationService } from './src/services/notificationService';
import ErrorBoundary from './src/components/ErrorBoundary';

const toastConfig: ToastConfig = {
  incomingMessage: ({ text1, text2, onPress }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.messageToastContainer}
    >
      <View style={styles.toastInner}>
        <View style={styles.iconCircle}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#0f766e" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.toastTitle}>{text1}</Text>
          <Text style={styles.toastBody} numberOfLines={1}>{text2}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  ),
  socialNotification: ({ text1, text2, onPress }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.socialToastContainer}
    >
      <View style={styles.toastInner}>
        <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="notifications" size={24} color="#EF4444" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.toastTitle}>{text1}</Text>
          <Text style={styles.toastBody} numberOfLines={1}>{text2}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  )
};

const styles = StyleSheet.create({
  messageToastContainer: {
    height: 70,
    width: '92%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderLeftWidth: 6,
    borderLeftColor: '#0f766e',
    marginTop: 10,
  },
  socialToastContainer: {
    height: 70,
    width: '92%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderLeftWidth: 6,
    borderLeftColor: '#EF4444',
    marginTop: 10,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  toastBody: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 10,
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

const AppDefaultTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: '#0f766e', // teal-700
    background: '#f8fafc', // slate-50
    card: '#ffffff',
    text: '#0f172a', // slate-900
    border: '#e2e8f0', // slate-200
  },
};

const AppDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: '#14b8a6', // teal-500
    background: '#0f172a', // slate-900
    card: '#1e293b', // slate-800
    text: '#f8fafc', // slate-50
    border: '#334155', // slate-700
  },
};

function AppContent() {
  const { isDark } = useTheme();

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={isDark ? AppDarkTheme : AppDefaultTheme}
    >
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    const setupNotifications = async () => {
      await notificationService.registerAppWithFCM();
      await notificationService.requestUserPermission();
    };

    setupNotifications();
    const unsubscribe = notificationService.setupNotificationListeners();

    const unsubscribeNotifee = notifee.onForegroundEvent((event) => {
      // General foreground event handling
    });

    return () => {
      unsubscribe();
      unsubscribeNotifee();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary fallbackMessage="The app encountered an unexpected error. Tap retry to reload.">
        <SafeAreaProvider>
          <AuthProvider>
            <ThemeProvider>
              <SocketProvider>
                <CoinEarningProvider>
                  <CartProvider>
                    <PersistQueryClientProvider
                      client={queryClient}
                      persistOptions={{ persister: asyncStoragePersister }}
                    >
                      <AppContent />
                      <Toast config={toastConfig} />
                    </PersistQueryClientProvider>
                  </CartProvider>
                </CoinEarningProvider>
              </SocketProvider>
            </ThemeProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
