import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ButtonLoader } from '../../components/common';
import { useTheme } from '../../contexts/ThemeContext';
import { findUserByEmail, sendForgotPasswordOTP, resetPasswordWithOTP } from '../../services/authServices';
import { SafeAreaView } from 'react-native-safe-area-context';

type Step = 'SEARCH' | 'VERIFY' | 'OTP' | 'PASSWORD';

const ForgotPassword = () => {
    const navigation = useNavigation();
    const { isDark } = useTheme();

    const [step, setStep] = useState<Step>('SEARCH');
    const [email, setEmail] = useState('');
    const [foundUser, setFoundUser] = useState<any>(null);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSearch = async () => {
        if (!email.trim() || !email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }
        setLoading(true);
        try {
            const response = await findUserByEmail(email.trim());
            if (response.success && response.user) {
                setFoundUser(response.user);
                setStep('VERIFY');
            } else {
                Alert.alert('Not Found', response.message || 'No account found with this email');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to search for user');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        setLoading(true);
        try {
            const response = await sendForgotPasswordOTP(email.trim());
            if (response.success) {
                Alert.alert('Code Sent', 'A 6-digit verification code has been sent to your email.');
                setStep('OTP');
            } else {
                Alert.alert('Error', response.message || 'Failed to send code');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = () => {
        if (otp.length !== 6) {
            Alert.alert('Error', 'Please enter the 6-digit code');
            return;
        }
        setStep('PASSWORD');
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const response = await resetPasswordWithOTP(email.trim(), otp, newPassword);
            if (response.success) {
                Alert.alert('Success', 'Your password has been reset successfully. You can now login with your new password.', [
                    { text: 'Login Now', onPress: () => navigation.navigate('Login' as never) }
                ]);
            } else {
                Alert.alert('Error', response.message || 'Failed to reset password');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const bg = isDark ? '#0f172a' : '#FFFFFF';
    const cardBg = isDark ? '#1e293b' : '#F8FAFC';
    const border = isDark ? '#334155' : '#E2E8F0';
    const titleColor = isDark ? '#f8fafc' : '#1E293B';
    const subtitleColor = isDark ? '#64748b' : '#64748B';
    const labelColor = isDark ? '#94a3b8' : '#334155';
    const inputColor = isDark ? '#f1f5f9' : '#1E293B';
    const iconColor = isDark ? '#475569' : '#64748B';

    const renderStepContent = () => {
        switch (step) {
            case 'SEARCH':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.title, { color: titleColor }]}>Find Your Account</Text>
                        <Text style={[styles.subtitle, { color: subtitleColor }]}>Enter your email to search for your FlyBook account</Text>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: labelColor }]}>Email Address</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: border, paddingLeft: 12 }]}>
                                <Ionicons name="mail-outline" size={20} color={iconColor} />
                                <TextInput
                                    style={[styles.input, { color: inputColor }]}
                                    placeholder="name@example.com"
                                    placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleSearch} disabled={loading}>
                            {loading ? <ButtonLoader color="#FFFFFF" size="medium" /> : <Text style={styles.buttonText}>Search Account</Text>}
                        </TouchableOpacity>
                    </View>
                );

            case 'VERIFY':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.title, { color: titleColor }]}>Is this you?</Text>
                        <Text style={[styles.subtitle, { color: subtitleColor }]}>We found this account associated with your email</Text>

                        <View style={[styles.userCard, { backgroundColor: cardBg, borderColor: border }]}>
                            <Image
                                source={
                                    foundUser?.profileImage
                                        ? { uri: foundUser.profileImage }
                                        : { uri: "https://i.ibb.co/mcL9L2t/f10ff70a7155e5ab666bcdd1b45b726d.jpg" }
                                }
                                style={styles.avatar}
                            />
                            <View style={styles.userInfo}>
                                <Text style={[styles.userName, { color: titleColor }]}>{foundUser?.name}</Text>
                                <Text style={[styles.userPhone, { color: subtitleColor }]}>{foundUser?.phone}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleSendOTP} disabled={loading}>
                            {loading ? <ButtonLoader color="#FFFFFF" size="medium" /> : <Text style={styles.buttonText}>Confirm & Send Code</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('SEARCH')} disabled={loading}>
                            <Text style={[styles.secondaryButtonText, { color: subtitleColor }]}>Not my account</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'OTP':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.title, { color: titleColor }]}>Verify Identity</Text>
                        <Text style={[styles.subtitle, { color: subtitleColor }]}>Enter the 6-digit code sent to {email}</Text>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: labelColor }]}>Verification Code</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: border, paddingLeft: 12 }]}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={iconColor} />
                                <TextInput
                                    style={[styles.input, { color: inputColor, letterSpacing: 8, textAlign: 'center', fontWeight: 'bold' }]}
                                    placeholder="000000"
                                    placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                                    value={otp}
                                    onChangeText={setOtp}
                                    maxLength={6}
                                    keyboardType="number-pad"
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOTP} disabled={loading}>
                            <Text style={styles.buttonText}>Verify Code</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={handleSendOTP} disabled={loading}>
                            <Text style={[styles.secondaryButtonText, { color: '#3B82F6' }]}>Resend Code</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'PASSWORD':
                return (
                    <View style={styles.stepContainer}>
                        <Text style={[styles.title, { color: titleColor }]}>Reset Password</Text>
                        <Text style={[styles.subtitle, { color: subtitleColor }]}>Set a strong password for your security</Text>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: labelColor }]}>New Password</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: border, paddingLeft: 12 }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={iconColor} />
                                <TextInput
                                    style={[styles.input, { color: inputColor }]}
                                    placeholder="At least 6 characters"
                                    placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    editable={!loading}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={iconColor} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: labelColor }]}>Confirm Password</Text>
                            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: border, paddingLeft: 12 }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={iconColor} />
                                <TextInput
                                    style={[styles.input, { color: inputColor }]}
                                    placeholder="Repeat new password"
                                    placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleResetPassword} disabled={loading}>
                            {loading ? <ButtonLoader color="#FFFFFF" size="medium" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                        </TouchableOpacity>
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={titleColor} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {renderStepContent()}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    keyboardView: { flex: 1 },
    header: { paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { padding: 8 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
    stepContainer: { flex: 1 },
    title: { fontSize: 26, fontWeight: 'bold', marginBottom: 12 },
    subtitle: { fontSize: 16, lineHeight: 22, marginBottom: 32 },
    inputContainer: { marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
    input: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16 },
    eyeIcon: { padding: 12 },
    primaryButton: {
        backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', marginTop: 8,
        shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    secondaryButton: { alignItems: 'center', paddingVertical: 16, marginTop: 12 },
    secondaryButtonText: { fontSize: 15, fontWeight: '600' },
    userCard: {
        flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 32,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
    userInfo: { flex: 1 },
    userName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    userPhone: { fontSize: 14 },
});

export default ForgotPassword;
