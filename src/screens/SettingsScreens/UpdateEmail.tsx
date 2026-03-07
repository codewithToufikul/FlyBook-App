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
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { put, post } from '../../services/api';
import Toast from 'react-native-toast-message';

const UpdateEmail = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const { user, refreshUser } = useAuth();

    const [newEmail, setNewEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendOtp = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            Toast.show({ type: 'error', text1: 'Invalid email format' });
            return;
        }

        if (newEmail.toLowerCase() === user?.email?.toLowerCase()) {
            Toast.show({ type: 'error', text1: 'Please enter a different email' });
            return;
        }

        try {
            setIsLoading(true);
            const response = await post<{ success: boolean; message: string }>(
                '/users/send-otp',
                { email: newEmail.toLowerCase().trim() }
            );

            if (response.success) {
                Toast.show({ type: 'success', text1: 'OTP sent to your new email' });
                setStep(2);
                setTimer(60);
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error.data?.message || 'Failed to send OTP'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndUpdate = async () => {
        if (otp.length < 6) {
            Toast.show({ type: 'error', text1: 'Enter 6-digit OTP' });
            return;
        }

        try {
            setIsLoading(true);
            // 1. Verify OTP
            const verifyRes = await post<{ success: boolean }>(
                '/users/verify-otp',
                { email: newEmail.toLowerCase().trim(), otp }
            );

            if (verifyRes.success) {
                // 2. Update Email in Profile
                const updateRes = await put<{ success: boolean }>(
                    '/api/user/update-email',
                    { email: newEmail.toLowerCase().trim() }
                );

                if (updateRes.success) {
                    await refreshUser();
                    Toast.show({ type: 'success', text1: 'Email updated successfully' });
                    navigation.goBack();
                }
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error.data?.message || error.data?.error || 'Verification failed'
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
                <Text className="text-xl font-bold text-gray-800" style={[isDark && { color: '#f8fafc' }]}>Update Email</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-6 pt-8" style={[isDark && { backgroundColor: '#0f172a' }]}>
                <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                    <View className="w-12 h-12 bg-teal-50 rounded-2xl items-center justify-center mb-4" style={[isDark && { backgroundColor: 'rgba(20, 184, 166, 0.1)' }]}>
                        <Ionicons name="mail" size={24} color="#14b8a6" />
                    </View>
                    <Text className="text-gray-800 text-lg font-bold mb-2" style={[isDark && { color: '#f8fafc' }]}>Secure Email Update</Text>
                    <Text className="text-gray-500 text-sm leading-5" style={[isDark && { color: '#64748b' }]}>
                        {step === 1
                            ? "Enter your new email address. We'll send a verification code to ensure you own it."
                            : `We've sent a 6-digit code to ${newEmail.toLowerCase()}. Please enter it below.`}
                    </Text>
                </View>

                {step === 1 ? (
                    <View>
                        <View className="mb-6">
                            <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1" style={[isDark && { color: '#475569' }]}>New Email Address</Text>
                            <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                <TextInput
                                    value={newEmail}
                                    onChangeText={setNewEmail}
                                    placeholder="e.g. yourname@gmail.com"
                                    placeholderTextColor={isDark ? "#475569" : "#9ca3af"}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    className="text-gray-800 text-base font-medium"
                                    style={[isDark && { color: '#f8fafc' }]}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSendOtp}
                            disabled={isLoading}
                            className="bg-teal-500 py-4 rounded-2xl shadow-lg shadow-teal-100 flex-row justify-center items-center"
                            style={[isDark && { backgroundColor: '#14b8a6', shadowColor: '#14b8a6' }]}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <Text className="text-white font-bold text-lg">Send Verification Code</Text>
                                    <Ionicons name="arrow-forward" size={20} color="white" className="ml-2" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <View className="mb-6">
                            <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1" style={[isDark && { color: '#475569' }]}>Verification Code (OTP)</Text>
                            <View className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm" style={[isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                <TextInput
                                    value={otp}
                                    onChangeText={setOtp}
                                    placeholder="Enter 6-digit code"
                                    placeholderTextColor={isDark ? "#475569" : "#9ca3af"}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    className="text-gray-800 text-center text-2xl font-bold tracking-[10px]"
                                    style={[isDark && { color: '#f8fafc' }]}
                                />
                            </View>
                            {timer > 0 ? (
                                <Text className="text-gray-400 text-xs mt-3 text-center" style={[isDark && { color: '#475569' }]}>Resend code in <Text className="text-teal-500 font-bold" style={[isDark && { color: '#14b8a6' }]}>{timer}s</Text></Text>
                            ) : (
                                <TouchableOpacity onPress={handleSendOtp} className="mt-3">
                                    <Text className="text-teal-600 text-xs font-bold text-center" style={[isDark && { color: '#14b8a6' }]}>Resend Verification Code</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={handleVerifyAndUpdate}
                            disabled={isLoading}
                            className="bg-teal-500 py-4 rounded-2xl shadow-lg shadow-teal-100 flex-row justify-center items-center"
                            style={[isDark && { backgroundColor: '#14b8a6', shadowColor: '#14b8a6' }]}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Verify & Update Email</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setStep(1)} className="mt-6">
                            <Text className="text-gray-400 text-sm font-medium text-center">Use a different email address</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default UpdateEmail;
