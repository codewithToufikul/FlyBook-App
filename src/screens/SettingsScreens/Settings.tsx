import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Switch,
    Image,
    Alert,
    Platform,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

const Settings = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuth();
    const { theme, setTheme, isDark } = useTheme();

    // Settings States
    const [pushNotifications, setPushNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [dataSaver, setDataSaver] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout from FlyBook?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                    }
                },
            ]
        );
    };

    const SettingItem = ({
        icon,
        label,
        subtitle,
        value,
        type = 'link',
        onPress,
        onValueChange,
        color = '#4b5563',
        isLast = false
    }: any) => (
        <TouchableOpacity
            onPress={onPress}
            disabled={type === 'toggle'}
            activeOpacity={0.6}
            className={`flex-row items-center py-4 px-4 ${!isLast ? 'border-b border-gray-100' : ''}`}
            style={[!isLast && isDark && { borderBottomColor: '#334155' }]}
        >
            <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: color + '15' }}
            >
                <Ionicons name={icon} size={22} color={color} />
            </View>

            <View className="flex-1">
                <Text className="text-gray-800 text-base font-semibold" style={[isDark && { color: '#f8fafc' }]}>{label}</Text>
                {subtitle && <Text className="text-gray-400 text-xs mt-1" style={[isDark && { color: '#64748b' }]}>{subtitle}</Text>}
            </View>

            {type === 'link' && (
                <View className="flex-row items-center">
                    {value && <Text className="text-gray-400 text-sm mr-2" style={[isDark && { color: '#475569' }]}>{value}</Text>}
                    <Ionicons name="chevron-forward" size={18} color={isDark ? "#334155" : "#D1D5DB"} />
                </View>
            )}

            {type === 'toggle' && (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: '#E5E7EB', true: '#14b8a6' }}
                    thumbColor={Platform.OS === 'ios' ? undefined : '#fff'}
                />
            )}
        </TouchableOpacity>
    );

    const Section = ({ title, children }: any) => (
        <View className="mb-8">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest px-1 mb-3 ml-2" style={[isDark && { color: '#475569' }]}>
                {title}
            </Text>
            <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                {children}
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50" style={[{ paddingTop: insets.top }, isDark && { backgroundColor: '#0f172a' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFFFFF"} />

            {/* Custom Header */}
            <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100" style={[isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 items-center justify-center bg-gray-50 rounded-full"
                    style={[isDark && { backgroundColor: '#1e293b' }]}
                >
                    <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#1f2937"} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800" style={[isDark && { color: '#f8fafc' }]}>Settings</Text>
                <TouchableOpacity className="w-10 h-10 items-center justify-center">
                    <Ionicons name="search-outline" size={22} color={isDark ? "#f8fafc" : "#1f2937"} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 }}
            >

                {/* Account Settings */}
                <Section title="Account Settings">
                    <SettingItem
                        icon="person-outline"
                        label="Personal Information"
                        subtitle="Name, email, and basic details"
                        color="#3b82f6"
                        onPress={() => navigation.navigate('PersonalInformation')}
                    />
                    <SettingItem
                        icon="shield-checkmark-outline"
                        label="Security & Privacy"
                        subtitle="Password and 2FA settings"
                        color="#10b981"
                        onPress={() => navigation.navigate('SecurityPrivacy')}
                    />
                    <SettingItem
                        icon="notifications-outline"
                        label="Push Notifications"
                        subtitle="Manage all your app alerts"
                        color="#f59e0b"
                        type="toggle"
                        value={pushNotifications}
                        onValueChange={setPushNotifications}
                    />
                    <SettingItem
                        icon="mail-unread-outline"
                        label="Email Alerts"
                        subtitle="Weekly news and updates"
                        color="#8b5cf6"
                        type="toggle"
                        value={emailNotifications}
                        onValueChange={setEmailNotifications}
                        isLast={true}
                    />
                </Section>

                {/* App Preferences */}
                <Section title="App Preferences">
                    <SettingItem
                        icon="moon-outline"
                        label="Dark Theme"
                        subtitle="Reduce eye strain at night"
                        color="#6366f1"
                        type="toggle"
                        value={isDark}
                        onValueChange={(val: boolean) => setTheme(val ? 'dark' : 'light')}
                    />
                    {/* <SettingItem
                        icon="language-outline"
                        label="App Language"
                        subtitle="Change app's default language"
                        value="English (US)"
                        color="#ec4899"
                        onPress={() => { }}
                    /> */}
                    <SettingItem
                        icon="speedometer-outline"
                        label="Data Saver"
                        subtitle="Lower quality images on mobile"
                        color="#06b6d4"
                        type="toggle"
                        value={dataSaver}
                        onValueChange={setDataSaver}
                        isLast={true}
                    />
                </Section>

                {/* Integration & Data */}
                {/* <Section title="Integration & Data">
                    <SettingItem
                        icon="link-outline"
                        label="Connected Apps"
                        subtitle="Google, Facebook, and more"
                        color="#f97316"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="cloud-upload-outline"
                        label="Backup & Restore"
                        subtitle="Never lose your learning progress"
                        color="#14b8a6"
                        onPress={() => { }}
                    />
                    <SettingItem
                        icon="server-outline"
                        label="Clear Cache"
                        subtitle="Free up 124 MB of space"
                        color="#64748b"
                        onPress={() => { }}
                        isLast={true}
                    />
                </Section> */}

                {/* Support & Legal */}
                <Section title="Support & Legal">
                    {/* <SettingItem
                        icon="chatbubble-ellipses-outline"
                        label="Send Feedback"
                        color="#f43f5e"
                        onPress={() => { }}
                    /> */}
                    <SettingItem
                        icon="help-buoy-outline"
                        label="Help Center"
                        color="#3b82f6"
                        onPress={() => navigation.navigate('HelpCenter')}
                    />
                    <SettingItem
                        icon="document-text-outline"
                        label="Privacy Policy"
                        color="#9ca3af"
                        onPress={() => navigation.navigate('PrivacyPolicy')}
                        isLast={true}
                    />
                </Section>

                {/* Logout Button */}
                <TouchableOpacity
                    onPress={handleLogout}
                    className="bg-white border border-red-100 py-5 rounded-3xl flex-row items-center justify-center mb-6 shadow-sm"
                    style={[isDark && { backgroundColor: '#1e293b', borderColor: 'rgba(239, 68, 68, 0.2)' }]}
                >
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <Text className="text-red-500 font-bold text-base ml-2">Log Out</Text>
                </TouchableOpacity>



                {/* Footer */}
                <View className="items-center">
                    <Image
                        source={require('../../assets/logo.png')}
                        className="w-10 h-10 opacity-10 mb-2"
                        resizeMode="contain"
                    />
                    <Text className="text-gray-300 text-[10px] font-bold uppercase tracking-widest" style={[isDark && { color: '#334155' }]}>FlyBook Version 1.0.0</Text>
                    <Text className="text-gray-200 text-[8px] mt-1" style={[isDark && { color: '#1e293b' }]}>© 2026 FlyBook Inc. All rights reserved.</Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default Settings;
