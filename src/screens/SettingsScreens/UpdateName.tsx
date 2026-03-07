import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { put } from '../../services/api';
import Toast from 'react-native-toast-message';

const UpdateName = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const { user, refreshUser } = useAuth();

    // Split name into first and last
    const nameParts = (user?.name || '').split(' ');
    const initialFirst = nameParts[0] || '';
    const initialLast = nameParts.slice(1).join(' ') || '';

    const [firstName, setFirstName] = useState(initialFirst);
    const [lastName, setLastName] = useState(initialLast);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            Toast.show({ type: 'error', text1: 'Both names are required' });
            return;
        }

        try {
            setIsLoading(true);
            const response = await put<{ success: boolean; message: string }>(
                '/api/user/update-name',
                { firstName, lastName }
            );

            if (response.success) {
                await refreshUser();
                Toast.show({ type: 'success', text1: 'Name updated successfully' });
                navigation.goBack();
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error.data?.error || 'Failed to update name'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-gray-50"
            style={[{ paddingTop: insets.top }, isDark && { backgroundColor: '#0f172a' }]}
        >
            <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100" style={[isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full" style={[isDark && { backgroundColor: '#1e293b' }]}>
                    <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#1f2937"} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800" style={[isDark && { color: '#f8fafc' }]}>Change Name</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-8" style={[isDark && { backgroundColor: '#0f172a' }]}>
                <Text className="text-gray-500 text-sm mb-8 leading-6" style={[isDark && { color: '#64748b' }]}>
                    Professional Tip: Please use your legal name so people can recognize you. You can only change your name once every <Text className="font-bold text-gray-800" style={[isDark && { color: '#94a3b8' }]}>15 days</Text>.
                </Text>

                <View className="mb-6">
                    <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1" style={[isDark && { color: '#475569' }]}>First Name</Text>
                    <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                        <TextInput
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="e.g. Toufikul"
                            placeholderTextColor={isDark ? "#475569" : "#94a3b8"}
                            className="text-gray-800 text-base font-medium"
                            style={[isDark && { color: '#f8fafc' }]}
                        />
                    </View>
                </View>

                <View className="mb-8">
                    <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1" style={[isDark && { color: '#475569' }]}>Last Name</Text>
                    <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                        <TextInput
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="e.g. Islam"
                            placeholderTextColor={isDark ? "#475569" : "#94a3b8"}
                            className="text-gray-800 text-base font-medium"
                            style={[isDark && { color: '#f8fafc' }]}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleUpdate}
                    disabled={isLoading}
                    className="bg-blue-500 py-4 rounded-2xl shadow-lg shadow-blue-200 flex-row justify-center items-center"
                    style={[isDark && { backgroundColor: '#3b82f6', shadowColor: '#3b82f6' }]}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Save Changes</Text>
                    )}
                </TouchableOpacity>

                <View className="mt-8 bg-amber-50 p-4 rounded-2xl border border-amber-100" style={[isDark && { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }]}>
                    <View className="flex-row items-center mb-1">
                        <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                        <Text className="text-amber-700 font-bold text-xs ml-2 uppercase" style={[isDark && { color: '#f59e0b' }]}>Account Rule</Text>
                    </View>
                    <Text className="text-amber-600 text-[11px] leading-4" style={[isDark && { color: '#d97706' }]}>
                        Changing your name frequently is not allowed to prevent identity spoofing and ensure community safety.
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default UpdateName;
