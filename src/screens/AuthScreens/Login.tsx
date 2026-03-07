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
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ButtonLoader } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

const Login = () => {
  const navigation = useNavigation();
  const { loginUser } = useAuth();
  const { isDark } = useTheme();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    setLoading(true);
    try {
      const { login } = await import('../../services/authServices');
      const response = await login({ number: phoneNumber, password });
      if (response.success && response.token) {
        if (response.user) await loginUser(response.user);
        Alert.alert('Success', 'Login successful!');
      } else {
        Alert.alert('Error', response.message || 'Login failed');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid phone number or password');
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Title */}
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: titleColor }]}>Welcome Back!</Text>
            <Text style={[styles.subtitle, { color: subtitleColor }]}>Sign in to continue</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Phone */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Phone Number</Text>
              <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: border }]}>
                <Ionicons name="call-outline" size={20} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: inputColor }]}
                  placeholder="Enter your phone number"
                  placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={iconColor} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: inputColor }]}
                  placeholder="Enter your password"
                  placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} disabled={loading}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={iconColor} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity style={[styles.loginButton, loading && styles.loginButtonDisabled]} onPress={handleLogin} disabled={loading}>
              {loading ? <ButtonLoader color="#FFFFFF" size="medium" /> : <Text style={styles.loginButtonText}>Login</Text>}
            </TouchableOpacity>

            {/* Forgot */}
            <TouchableOpacity style={styles.forgotPasswordContainer} onPress={() => Alert.alert('Coming Soon', 'Password recovery feature')} disabled={loading}>
              <Text style={[styles.forgotPasswordText]}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: border }]} />
              <Text style={[styles.dividerText, { color: subtitleColor }]}>OR</Text>
              <View style={[styles.divider, { backgroundColor: border }]} />
            </View>

            {/* Create Account */}
            <TouchableOpacity
              style={[styles.createAccountButton, { backgroundColor: isDark ? '#1e293b' : '#FFFFFF', borderColor: '#3B82F6' }]}
              onPress={() => navigation.navigate('Step1Name' as never)}
              disabled={loading}
            >
              <Ionicons name="person-add-outline" size={20} color="#3B82F6" />
              <Text style={styles.createAccountText}>Create New Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', minHeight: '100%', paddingHorizontal: 24, paddingVertical: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 180, height: 80 },
  headerContainer: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  formContainer: { width: '100%' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16 },
  eyeIcon: { padding: 8 },
  loginButton: {
    backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  forgotPasswordContainer: { alignItems: 'center', marginBottom: 24 },
  forgotPasswordText: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  divider: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 16, fontSize: 14, fontWeight: '500' },
  createAccountButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, paddingVertical: 14, borderRadius: 12, gap: 8 },
  createAccountText: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
});

export default Login;