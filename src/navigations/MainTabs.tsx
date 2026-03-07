import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import TabBarIcon from '../components/TabBarIcon';
import ErrorBoundary from '../components/ErrorBoundary';
import HomeStack from './stacks/HomeStacks';
import SearchStack from './stacks/SearchStacks';
import OpinionStack from './stacks/OpimionStack';
import NearByBookStack from './stacks/NearByBookStack';
import NotificationStack from './stacks/NotificationStack';

const Tab = createBottomTabNavigator();

const withErrorBoundary = (Component: React.ComponentType<any>, name: string) => {
    const WrappedScreen = (props: any) => (
        <ErrorBoundary fallbackMessage={`Something went wrong in ${name}. Tap retry to reload.`}>
            <Component {...props} />
        </ErrorBoundary>
    );
    WrappedScreen.displayName = `ErrorBoundary(${name})`;
    return WrappedScreen;
};

const SafeNearBooks = withErrorBoundary(NearByBookStack, 'Near Books');
const SafeNotifications = withErrorBoundary(NotificationStack, 'Notifications');
const SafeSearch = withErrorBoundary(SearchStack, 'Search');
const SafeOpinion = withErrorBoundary(OpinionStack, 'Opinions');
const SafeHome = withErrorBoundary(HomeStack, 'Home');

export default function MainTabs() {
    const insets = useSafeAreaInsets();
    const { unreadNotifyCount } = useSocket();
    const { isDark } = useTheme();

    const activeColor = isDark ? '#14b8a6' : '#0f766e'; // teal-500 : teal-700
    const inactiveColor = isDark ? '#94a3b8' : '#9ca3af'; // slate-400 : gray-400
    const bgColor = isDark ? '#1e293b' : '#ffffff'; // slate-800 : white

    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={({ route }) => ({
                headerShown: false,

                tabBarShowLabel: true,

                tabBarStyle: {
                    height: 64 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 6,
                    backgroundColor: bgColor,
                    borderTopColor: isDark ? '#334155' : '#e5e7eb',
                },

                tabBarLabelStyle: {
                    fontSize: 10,
                    marginTop: 4,
                    fontWeight: '500',
                },

                tabBarActiveTintColor: '#0f766e',
                tabBarInactiveTintColor: '#9ca3af',

                tabBarIcon: ({ focused }) => (
                    <TabBarIcon name={route.name} focused={focused} />
                ),

                tabBarBadge: route.name === 'Notifications' && unreadNotifyCount > 0
                    ? (unreadNotifyCount > 99 ? '99+' : unreadNotifyCount)
                    : undefined,

                tabBarBadgeStyle: {
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: 'bold',
                }
            })}
        >
            <Tab.Screen name="NearBooks" component={SafeNearBooks} />
            <Tab.Screen name="Notifications" component={SafeNotifications} />
            <Tab.Screen name="Search" component={SafeSearch} />
            <Tab.Screen name="Opinion" component={SafeOpinion} />
            <Tab.Screen name="Home" component={SafeHome} />
        </Tab.Navigator>
    );
}
