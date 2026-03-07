import React, { useState, useEffect } from 'react';
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
import { post } from '../../services/api';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'react-native';

const ForgotPasswordReset = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Password
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [showNew, setShowNew] = useState(false);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendOtp = async () => {
        if (!email.trim()) {
            Toast.show({ type: 'error', text1: 'Email is required' });
            return;
        }

        try {
            setIsLoading(true);
            const response = await post<{ success: boolean; message: string }>(
                '/api/user/forgot-password-otp',
                { email: email.toLowerCase().trim() }
            );

            if (response.success) {
                Toast.show({ type: 'success', text1: 'Reset code sent to your email' });
                setStep(2);
                setTimer(60);
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error.data?.message || 'Failed to send reset code'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (otp.length < 6) {
            Toast.show({ type: 'error', text1: 'Enter 6-digit code' });
            return;
        }

        if (!newPassword || newPassword !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
            return;
        }

        try {
            setIsLoading(true);
            const response = await post<{ success: boolean; message: string }>(
                '/api/user/reset-password-otp',
                { email: email.toLowerCase().trim(), otp, newPassword }
            );

            if (response.success) {
                Toast.show({ type: 'success', text1: 'Password reset successful' });
                navigation.goBack();
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error.data?.message || 'Reset failed'
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
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFFFFF"} />
            <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100" style={[isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full" style={[isDark && { backgroundColor: '#1e293b' }]}>
                    <Ionicons name="arrow-back" size={22} color={isDark ? "#f8fafc" : "#1f2937"} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800" style={[isDark && { color: '#f8fafc' }]}>Reset Password</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-8" style={[isDark && { backgroundColor: '#0f172a' }]}>
                <View className="bg-red-500 p-6 rounded-[32px] mb-8 shadow-lg shadow-red-200" style={[isDark && { backgroundColor: '#1e293b', shadowColor: '#ef444420', borderColor: '#334155', borderWidth: 1 }]}>
                    <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mb-4" style={[isDark && { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                        <Ionicons name="help-buoy" size={26} color={isDark ? "#ef4444" : "white"} />
                    </View>
                    <Text className="text-white text-lg font-bold mb-1" style={[isDark && { color: '#f8fafc' }]}>Forgot Password?</Text>
                    <Text className="text-white/80 text-sm leading-5" style={[isDark && { color: '#64748b' }]}>
                        Don't worry! It happens. Enter your email and we'll help you reset your password.
                    </Text>
                </View>

                {step === 1 ? (
                    <View>
                        <View className="mb-6">
                            <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1" style={[isDark && { color: '#475569' }]}>Account Email</Text>
                            <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 shadow-sm" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                <Ionicons name="mail-outline" size={20} color={isDark ? "#475569" : "#9ca3af"} className="mr-3" />
                                <TextInput
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="yourname@gmail.com"
                                    placeholderTextColor={isDark ? "#475569" : "#9ca3af"}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className="flex-1 text-gray-800 text-base font-medium"
                                    style={[isDark && { color: '#f8fafc' }]}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSendOtp}
                            disabled={isLoading}
                            className="bg-red-500 py-4.5 rounded-2xl shadow-lg shadow-red-100 flex-row justify-center items-center"
                            style={[isDark && { backgroundColor: '#ef4444', shadowColor: '#ef4444' }]}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Send Reset Code</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <View className="mb-6">
                            <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1" style={[isDark && { color: '#475569' }]}>6-Digit Reset Code</Text>
                            <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                <TextInput
                                    value={otp}
                                    onChangeText={setOtp}
                                    placeholder="Enter OTP"
                                    placeholderTextColor={isDark ? "#475569" : "#9ca3af"}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    className="text-gray-800 text-center text-2xl font-bold tracking-[10px]"
                                    style={[isDark && { color: '#f8fafc' }]}
                                />
                            </View>
                            {timer > 0 ? (
                                <Text className="text-gray-400 text-xs mt-3 text-center" style={[isDark && { color: '#475569' }]}>Resend in <Text className="text-red-500 font-bold" style={[isDark && { color: '#ef4444' }]}>{timer}s</Text></Text>
                            ) : (
                                <TouchableOpacity onPress={handleSendOtp} className="mt-3">
                                    <Text className="text-red-600 text-xs font-bold text-center" style={[isDark && { color: '#ef4444' }]}>Resend Code</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View className="mb-6">
                            <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1" style={[isDark && { color: '#475569' }]}>New Password</Text>
                            <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-3.5 shadow-sm" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                <TextInput
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Enter new password"
                                    placeholderTextColor={isDark ? "#475569" : "#9ca3af"}
                                    secureTextEntry={!showNew}
                                    className="flex-1 text-gray-800 text-base font-medium"
                                    style={[isDark && { color: '#f8fafc' }]}
                                />
                                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                                    <Ionicons name={showNew ? "eye-outline" : "eye-off-outline"} size={20} color={isDark ? "#475569" : "#9ca3af"} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="mb-8">
                            <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1" style={[isDark && { color: '#475569' }]}>Confirm New Password</Text>
                            <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 shadow-sm" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                <TextInput
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Confirm new password"
                                    placeholderTextColor={isDark ? "#475569" : "#9ca3af"}
                                    secureTextEntry={true}
                                    className="flex-1 text-gray-800 text-base font-medium"
                                    style={[isDark && { color: '#f8fafc' }]}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleResetPassword}
                            disabled={isLoading}
                            className="bg-red-500 py-4.5 rounded-2xl shadow-lg shadow-red-100 flex-row justify-center items-center"
                            style={[isDark && { backgroundColor: '#ef4444', shadowColor: '#ef4444' }]}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Reset Password</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setStep(1)} className="mt-6">
                            <Text className="text-gray-400 text-sm font-medium text-center italic underline" style={[isDark && { color: '#64748b' }]}>Try different email</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default ForgotPasswordReset;
