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
import { put, saveToken } from '../../services/api';
import Toast from 'react-native-toast-message';

const UpdatePhone = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const { user, refreshUser } = useAuth();

    const [newPhone, setNewPhone] = useState(user?.phone || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdate = async () => {
        if (!newPhone.trim()) {
            Toast.show({ type: 'error', text1: 'Phone number is required' });
            return;
        }

        if (newPhone === user?.phone) {
            Toast.show({ type: 'error', text1: 'Enter a new phone number' });
            return;
        }

        try {
            setIsLoading(true);
            const response = await put<{ success: boolean; message: string; token?: string }>(
                '/api/user/update-phone',
                { number: newPhone }
            );

            if (response.success) {
                if (response.token) {
                    await saveToken(response.token);
                }
                await refreshUser();
                Toast.show({ type: 'success', text1: 'Phone number updated successfully' });
                navigation.goBack();
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error.data?.error || 'Failed to update phone'
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
                <Text className="text-xl font-bold text-gray-800" style={[isDark && { color: '#f8fafc' }]}>Update Phone</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-8" style={[isDark && { backgroundColor: '#0f172a' }]}>
                <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                    <View className="w-12 h-12 bg-purple-50 rounded-2xl items-center justify-center mb-4" style={[isDark && { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                        <Ionicons name="call" size={24} color="#8b5cf6" />
                    </View>
                    <Text className="text-gray-800 text-lg font-bold mb-2" style={[isDark && { color: '#f8fafc' }]}>Phone Number</Text>
                    <Text className="text-gray-500 text-sm leading-5" style={[isDark && { color: '#64748b' }]}>
                        Ensure your phone number is correct. It might be used for account recovery or security purposes.
                    </Text>
                </View>

                <View className="mb-8">
                    <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1" style={[isDark && { color: '#475569' }]}>New Phone Number</Text>
                    <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                        <TextInput
                            value={newPhone}
                            onChangeText={setNewPhone}
                            placeholder="e.g. 01700000000"
                            placeholderTextColor={isDark ? "#475569" : "#9ca3af"}
                            keyboardType="phone-pad"
                            className="text-gray-800 text-base font-medium"
                            style={[isDark && { color: '#f8fafc' }]}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleUpdate}
                    disabled={isLoading}
                    className="bg-purple-600 py-4 rounded-2xl shadow-lg shadow-purple-100 flex-row justify-center items-center"
                    style={[isDark && { backgroundColor: '#8b5cf6', shadowColor: '#8b5cf6' }]}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Update Phone Number</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default UpdatePhone;
