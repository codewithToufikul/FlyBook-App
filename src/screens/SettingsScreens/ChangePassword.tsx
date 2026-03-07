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
import { useTheme } from '../../contexts/ThemeContext';
import { put } from '../../services/api';
import Toast from 'react-native-toast-message';

const PasswordInput = ({ label, value, onChangeText, show, setShow, placeholder, isDark }: any) => (
    <View className="mb-6">
        <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1" style={[isDark && { color: '#475569' }]}>{label}</Text>
        <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-3.5 shadow-sm" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
            <Ionicons name="lock-closed-outline" size={20} color={isDark ? "#475569" : "#9ca3af"} className="mr-3" />
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={isDark ? "#475569" : "#9ca3af"}
                secureTextEntry={!show}
                className="flex-1 text-gray-800 text-base font-medium"
                style={[isDark && { color: '#f8fafc' }]}
            />
            <TouchableOpacity onPress={() => setShow(!show)} className="p-1">
                <Ionicons name={show ? "eye-outline" : "eye-off-outline"} size={20} color={isDark ? "#475569" : "#9ca3af"} />
            </TouchableOpacity>
        </View>
    </View>
);

const ChangePassword = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleUpdate = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Toast.show({ type: 'error', text1: 'All fields are required' });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
            return;
        }

        try {
            setIsLoading(true);
            const response = await put<{ success: boolean; message: string }>(
                '/api/user/change-password',
                { oldPassword, newPassword }
            );

            if (response.success) {
                Toast.show({ type: 'success', text1: 'Password changed successfully' });
                navigation.goBack();
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error.data?.error || 'Failed to update password'
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
                <Text className="text-xl font-bold text-gray-800" style={[isDark && { color: '#f8fafc' }]}>Change Password</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-8" style={[isDark && { backgroundColor: '#0f172a' }]}>
                <View className="bg-blue-500 p-6 rounded-[32px] mb-8 shadow-lg shadow-blue-200" style={[isDark && { backgroundColor: '#1e293b', shadowColor: '#3b82f620', borderColor: '#334155', borderWidth: 1 }]}>
                    <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mb-4" style={[isDark && { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                        <Ionicons name="shield-checkmark" size={26} color={isDark ? "#3b82f6" : "white"} />
                    </View>
                    <Text className="text-white text-lg font-bold mb-1" style={[isDark && { color: '#f8fafc' }]}>Update Security</Text>
                    <Text className="text-white/80 text-sm leading-5" style={[isDark && { color: '#64748b' }]}>
                        Your new password should be different from your previous passwords to ensure maximum security.
                    </Text>
                </View>

                <PasswordInput
                    label="Current Password"
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    show={showOld}
                    setShow={setShowOld}
                    placeholder="Enter current password"
                    isDark={isDark}
                />

                <PasswordInput
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    show={showNew}
                    setShow={setShowNew}
                    placeholder="Minimum 6 characters"
                    isDark={isDark}
                />

                <PasswordInput
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    show={showConfirm}
                    setShow={setShowConfirm}
                    placeholder="Repeat new password"
                    isDark={isDark}
                />

                <TouchableOpacity
                    onPress={handleUpdate}
                    disabled={isLoading}
                    className="bg-blue-600 py-4.5 rounded-2xl shadow-lg shadow-blue-200 flex-row justify-center items-center mt-4"
                    style={[isDark && { backgroundColor: '#3182ce', shadowColor: '#3182ce' }]}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Update Password</Text>
                    )}
                </TouchableOpacity>

                <View className="mt-10 mb-8 border-t border-gray-200 pt-8" style={[isDark && { borderTopColor: '#1e293b' }]}>
                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest text-center mb-4" style={[isDark && { color: '#475569' }]}>Security Requirements</Text>
                    <View className="flex-row flex-wrap justify-between">
                        <View className="w-[48%] bg-white p-3 rounded-xl border border-gray-100 mb-3" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                            <Text className="text-gray-500 text-[10px] mt-1" style={[isDark && { color: '#64748b' }]}>Min 6 characters</Text>
                        </View>
                        <View className="w-[48%] bg-white p-3 rounded-xl border border-gray-100 mb-3" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                            <Text className="text-gray-500 text-[10px] mt-1" style={[isDark && { color: '#64748b' }]}>Unique from old</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default ChangePassword;
