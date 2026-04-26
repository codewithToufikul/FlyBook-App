import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ButtonLoader } from '../../../components/common';
import { post } from '../../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';

const Step3Verify = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { firstName, lastName, email } = route.params as any;
  const { isDark } = useTheme();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      const otpArray = value.slice(0, 6).split('');
      const newOtp = [...otp];
      otpArray.forEach((digit, idx) => { if (index + idx < 6) newOtp[index + idx] = digit; });
      setOtp(newOtp);
      const lastIndex = Math.min(index + otpArray.length, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) { Alert.alert('Error', 'Please enter the complete 6-digit code'); return; }
    setLoading(true);
    try {
      const response = await post('/users/verify-otp', { email, otp: otpCode });
      if (response.success) {
        (navigation as any).navigate('Step4Phone', { firstName, lastName, email, otpVerified: true });
      } else {
        Alert.alert('Error', response.message || 'Invalid verification code');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Verification failed');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const response = await post('/users/send-otp', { email });
      if (response.success) { Alert.alert('Success', 'Verification code sent again!'); setOtp(['', '', '', '', '', '']); inputRefs.current[0]?.focus(); }
      else Alert.alert('Error', response.message || 'Failed to resend code');
    } catch (error: any) { Alert.alert('Error', error.message || 'Failed to resend code'); }
    finally { setResending(false); }
  };

  const bg = isDark ? '#0f172a' : '#FFFFFF';
  const cardBg = isDark ? '#1e293b' : '#F8FAFC';
  const border = isDark ? '#334155' : '#E2E8F0';
  const titleColor = isDark ? '#f8fafc' : '#1E293B';
  const subtitleColor = isDark ? '#64748b' : '#64748B';
  const inputColor = isDark ? '#f1f5f9' : '#1E293B';
  const backBtnBg = isDark ? '#1e293b' : '#F1F5F9';
  const dotInactive = isDark ? '#334155' : '#E2E8F0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: backBtnBg }]} onPress={() => navigation.goBack()} disabled={loading}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#1E293B'} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <View key={i} style={[styles.progressDot, { backgroundColor: i <= 2 ? '#3B82F6' : dotInactive, width: i <= 2 ? 24 : 8 }]} />
            ))}
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: titleColor }]}>Enter verification code</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>

          {/* OTP Inputs */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[styles.otpInput, { backgroundColor: cardBg, borderColor: border, color: inputColor }, digit && { borderColor: '#3B82F6', backgroundColor: isDark ? '#1e293b' : '#FFFFFF' }]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
                editable={!loading && !resending}
              />
            ))}
          </View>

          {/* Resend */}
          <TouchableOpacity style={styles.resendContainer} onPress={handleResend} disabled={resending || loading}>
            {resending ? (
              <Text style={[styles.resendText, { color: subtitleColor }]}>Sending...</Text>
            ) : (
              <Text style={[styles.resendText, { color: subtitleColor }]}>
                Didn't receive code?{' '}<Text style={styles.resendLink}>Resend</Text>
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.verifyButton, otp.join('').length !== 6 && styles.verifyButtonDisabled]}
            onPress={handleVerify}
            disabled={otp.join('').length !== 6 || loading}
          >
            {loading ? <ButtonLoader color="#FFFFFF" size="medium" /> : <Text style={styles.verifyButtonText}>Verify</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  progressContainer: { flexDirection: 'row', gap: 8 },
  progressDot: { height: 8, borderRadius: 4 },
  placeholder: { width: 40 },
  formContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 40, lineHeight: 24 },
  email: { color: '#3B82F6', fontWeight: '600' },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  otpInput: { width: 50, height: 60, borderWidth: 2, borderRadius: 12, textAlign: 'center', fontSize: 24, fontWeight: 'bold' },
  resendContainer: { alignItems: 'center' },
  resendText: { fontSize: 14 },
  resendLink: { color: '#3B82F6', fontWeight: '600' },
  footer: { padding: 24, paddingBottom: 34 },
  verifyButton: {
    backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  verifyButtonDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  verifyButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default Step3Verify;
