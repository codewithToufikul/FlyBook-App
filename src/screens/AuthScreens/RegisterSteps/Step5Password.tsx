import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import { ButtonLoader } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';

interface LocationType { latitude: number; longitude: number; }

const Step5Password = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { loginUser } = useAuth();
  const { isDark } = useTheme();
  const { firstName, lastName, email, phone, referrerUsername } = route.params as any;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);

  useEffect(() => { requestLocation(); }, []);

  const requestLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => setUserLocation({ latitude: 0, longitude: 0 }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleCreateAccount = async () => {
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters long'); return; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (!userLocation) { Alert.alert('Error', 'Please wait while we get your location'); return; }

    setLoading(true);
    try {
      const { register } = await import('../../../services/authServices');
      const response = await register({ name: `${firstName} ${lastName}`, email, number: phone || '', password, userLocation, referrerUsername: referrerUsername || '' });
      if (response.success && response.token) {
        if (response.user) await loginUser(response.user);
        Alert.alert('Success!', 'Your account has been created successfully!', [{ text: 'OK', onPress: () => { } }]);
      } else {
        Alert.alert('Error', response.message || 'Registration failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account');
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
  const backBtnBg = isDark ? '#1e293b' : '#F1F5F9';
  const requireBg = isDark ? '#1e293b' : '#F8FAFC';
  const dotInactive = isDark ? '#334155' : '#E2E8F0';
  const eyeColor = isDark ? '#475569' : '#64748B';

  const passLengthMet = password.length >= 6;
  const passMatchMet = !!(password && confirmPassword && password === confirmPassword);

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
              <View key={i} style={[styles.progressDot, { backgroundColor: '#3B82F6', width: 24 }]} />
            ))}
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: titleColor }]}>Create a password</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>Create a secure password with at least 6 characters</Text>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: labelColor }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: border }]}>
              <TextInput
                style={[styles.input, { color: inputColor }]}
                placeholder="Enter password"
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoFocus
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} disabled={loading}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={eyeColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: labelColor }]}>Confirm Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: border }]}>
              <TextInput
                style={[styles.input, { color: inputColor }]}
                placeholder="Re-enter password"
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon} disabled={loading}>
                <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={eyeColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Requirements */}
          <View style={[styles.requirementsBox, { backgroundColor: requireBg }]}>
            <View style={styles.requirement}>
              <Ionicons name={passLengthMet ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={passLengthMet ? '#10B981' : (isDark ? '#334155' : '#CBD5E1')} />
              <Text style={[styles.requirementText, { color: passLengthMet ? '#10B981' : subtitleColor }]}>At least 6 characters</Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons name={passMatchMet ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={passMatchMet ? '#10B981' : (isDark ? '#334155' : '#CBD5E1')} />
              <Text style={[styles.requirementText, { color: passMatchMet ? '#10B981' : subtitleColor }]}>Passwords match</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.createButton, (password.length < 6 || password !== confirmPassword) && styles.createButtonDisabled]}
            onPress={handleCreateAccount}
            disabled={password.length < 6 || password !== confirmPassword || loading}
          >
            {loading ? <ButtonLoader color="#FFFFFF" size="medium" /> : <Text style={styles.createButtonText}>Create Account</Text>}
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
  subtitle: { fontSize: 16, marginBottom: 32, lineHeight: 24 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12 },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16 },
  eyeIcon: { padding: 12 },
  requirementsBox: { padding: 16, borderRadius: 12, gap: 12 },
  requirement: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  requirementText: { fontSize: 14 },
  footer: { padding: 24, paddingBottom: 34 },
  createButton: {
    backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  createButtonDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default Step5Password;
