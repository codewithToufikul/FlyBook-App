import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { put } from '../../services/api';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'react-native';

const PersonalInformation = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const { user, refreshUser, logout } = useAuth();

    const InfoRow = ({ label, value, onPress, icon, color = '#3b82f6' }: any) => (
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
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1" style={[isDark && { color: '#64748b' }]}>{label}</Text>
                <Text className="text-gray-800 text-base font-semibold" style={[isDark && { color: '#f8fafc' }]}>{value || 'Not Set'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? "#334155" : "#D1D5DB"} />
        </TouchableOpacity>
    );

    const handleStatusUpdate = (status: 'deactivated' | 'deleted') => {
        const title = status === 'deleted' ? 'Delete Account Permanently' : 'Deactivate Account';
        const message = status === 'deleted'
            ? 'WARNING: Your account will be marked for deletion. It will no longer be visible to others. proceed?'
            : 'Your account will be temporarily hidden. You can reactivate it later by logging back in.';

        Alert.alert(title, message, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: status === 'deleted' ? 'Delete' : 'Deactivate',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const response = await put<{ success: boolean; message: string }>(
                            '/api/user/update-status',
                            { status }
                        );
                        if (response.success) {
                            Toast.show({ type: 'success', text1: response.message });
                            await logout();
                        }
                    } catch (error: any) {
                        Toast.show({ type: 'error', text1: error.data?.error || 'Failed to update status' });
                    }
                }
            }
        ]);
    };

    return (
        <View className="flex-1 bg-gray-50" style={[{ paddingTop: insets.top }, isDark && { backgroundColor: '#0f172a' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFFFFF"} />
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100" style={[isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full"
                    style={[isDark && { backgroundColor: '#1e293b' }]}
                >
                    <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#1f2937"} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800" style={[isDark && { color: '#f8fafc' }]}>Personal Info</Text>
                <View className="w-10" />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="px-6 py-8">
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 ml-1" style={[isDark && { color: '#475569' }]}>Basic Details</Text>

                    <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                        <InfoRow
                            label="Full Name"
                            value={user?.name}
                            icon="person-outline"
                            color="#3b82f6"
                            onPress={() => navigation.navigate('UpdateName')}
                        />
                        <InfoRow
                            label="Email Address"
                            value={user?.email}
                            icon="mail-outline"
                            color="#10b981"
                            onPress={() => navigation.navigate('UpdateEmail')}
                        />
                        <InfoRow
                            label="Phone Number"
                            value={user?.phone}
                            icon="call-outline"
                            color="#8b5cf6"
                            onPress={() => navigation.navigate('UpdatePhone')}
                        />
                    </View>

                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-10 mb-4 ml-1" style={[isDark && { color: '#475569' }]}>Privacy & Security</Text>

                    <View className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                        <TouchableOpacity
                            onPress={() => handleStatusUpdate('deactivated')}
                            className="flex-row items-center px-5 py-5 border-b border-gray-50"
                            style={[isDark && { borderBottomColor: '#334155' }]}
                        >
                            <View className="w-10 h-10 bg-amber-50 rounded-xl items-center justify-center mr-4" style={[isDark && { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                                <Ionicons name="moon-outline" size={22} color="#f59e0b" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-800 font-bold" style={[isDark && { color: '#f8fafc' }]}>Deactivate Account</Text>
                                <Text className="text-gray-400 text-[10px] mt-1" style={[isDark && { color: '#64748b' }]}>Temporarily hide your profile</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={isDark ? "#334155" : "#D1D5DB"} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleStatusUpdate('deleted')}
                            className="flex-row items-center px-5 py-5"
                        >
                            <View className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center mr-4" style={[isDark && { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <Ionicons name="trash-outline" size={22} color="#ef4444" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-red-500 font-bold">Delete Account</Text>
                                <Text className="text-gray-400 text-[10px] mt-1" style={[isDark && { color: '#64748b' }]}>Remove your account permanently</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={isDark ? "#334155" : "#D1D5DB"} />
                        </TouchableOpacity>
                    </View>

                    <View className="mt-12 items-center">
                        <Ionicons name="shield-checkmark" size={40} color={isDark ? "#1e293b" : "#E5E7EB"} />
                        <Text className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mt-4" style={[isDark && { color: '#334155' }]}>Verified & Secure Profile</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default PersonalInformation;
