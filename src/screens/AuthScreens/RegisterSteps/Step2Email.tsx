import React, { useState } from 'react';
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

const Step2Email = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { firstName, lastName } = route.params as any;
  const { isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const response = await post('/users/send-otp', { email: email.trim().toLowerCase() });
      if (response.success) {
        (navigation as any).navigate('Step3Verify', { firstName, lastName, email: email.trim().toLowerCase() });
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
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
            <View style={[styles.progressDot, { backgroundColor: '#3B82F6', width: 24 } ]} />
            <View style={[styles.progressDot, { backgroundColor: '#3B82F6', width: 24 } ]} />
            <View style={[styles.progressDot, { backgroundColor: dotInactive } ]} />
            <View style={[styles.progressDot, { backgroundColor: dotInactive } ]} />
            <View style={[styles.progressDot, { backgroundColor: dotInactive } ]} />
            <View style={[styles.progressDot, { backgroundColor: dotInactive } ]} />
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: titleColor }]}>What's your email?</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            Enter the email where you can be reached. We'll send you a verification code.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, borderColor: border, color: inputColor }]}
              placeholder="Email address"
              placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
              editable={!loading}
            />
          </View>

          <Text style={[styles.hint, { color: subtitleColor }]}>💡 Make sure you have access to this email</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, !email.trim() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!email.trim() || loading}
          >
            {loading ? <ButtonLoader color="#FFFFFF" size="medium" /> : <Text style={styles.nextButtonText}>Send Code</Text>}
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
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  placeholder: { width: 40 },
  formContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 32, lineHeight: 24 },
  inputContainer: { marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16 },
  hint: { fontSize: 14, marginTop: 8 },
  footer: { padding: 24, paddingBottom: 34 },
  nextButton: {
    backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  nextButtonDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default Step2Email;
