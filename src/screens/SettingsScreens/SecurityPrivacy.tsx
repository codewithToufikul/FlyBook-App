import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { StatusBar } from 'react-native';

const SecurityPrivacy = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();

    const SecurityItem = ({ icon, label, subtitle, onPress, color = '#3b82f6' }: any) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.6}
            style={[isDark && { backgroundColor: '#1e293b', borderBottomColor: '#334155' }]}
            className="flex-row items-center bg-white px-5 py-5 border-b border-gray-50"
        >
            <View className="w-10 h-10 rounded-xl items-center justify-center mr-4" style={{ backgroundColor: color + (isDark ? '20' : '10') }}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View className="flex-1">
                <Text className="text-gray-800 text-base font-semibold" style={[isDark && { color: '#f8fafc' }]}>{label}</Text>
                {subtitle && <Text className="text-gray-400 text-[11px] mt-0.5" style={[isDark && { color: '#64748b' }]}>{subtitle}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? "#334155" : "#D1D5DB"} />
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50" style={[{ paddingTop: insets.top }, isDark && { backgroundColor: '#0f172a' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFFFFF"} />
            <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100" style={[isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full"
                    style={[isDark && { backgroundColor: '#1e293b' }]}
                >
                    <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#1f2937"} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800" style={[isDark && { color: '#f8fafc' }]}>Security & Privacy</Text>
                <View className="w-10" />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1" style={[isDark && { backgroundColor: '#0f172a' }]}>
                <View className="px-6 py-8">
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 ml-1" style={[isDark && { color: '#475569' }]}>Password Management</Text>

                    <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                        <SecurityItem
                            label="Change Password"
                            subtitle="Update your account password regularly"
                            icon="key-outline"
                            color="#3b82f6"
                            onPress={() => navigation.navigate('ChangePassword')}
                        />
                        <SecurityItem
                            label="Forgot Password"
                            subtitle="Reset password via email verification"
                            icon="help-circle-outline"
                            color="#ef4444"
                            onPress={() => navigation.navigate('ForgotPasswordReset')}
                        />
                    </View>

                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-10 mb-4 ml-1" style={[isDark && { color: '#475569' }]}>Privacy Settings</Text>

                    <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                        <SecurityItem
                            label="Login Activity"
                            subtitle="Review where you're currently logged in"
                            icon="list-outline"
                            color="#10b981"
                        />
                        <SecurityItem
                            label="Two-factor Authentication"
                            subtitle="Add an extra layer of security"
                            icon="shield-checkmark-outline"
                            color="#8b5cf6"
                            onPress={() => { }}
                        />
                    </View>

                    <View className="mt-12 bg-blue-50 p-6 rounded-[32px] border border-blue-100 items-center" style={[isDark && { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
                        <View className="w-16 h-16 bg-white rounded-full items-center justify-center mb-4 shadow-sm" style={[isDark && { backgroundColor: '#1e293b' }]}>
                            <Ionicons name="lock-closed" size={30} color="#3b82f6" />
                        </View>
                        <Text className="text-blue-900 font-bold text-base mb-1" style={[isDark && { color: '#f8fafc' }]}>Your Account is Secure</Text>
                        <Text className="text-blue-700/60 text-center text-xs px-4" style={[isDark && { color: '#64748b' }]}>
                            FlyBook uses industry standard encryption to protect your data and privacy.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default SecurityPrivacy;
