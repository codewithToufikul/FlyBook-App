import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, Alert, KeyboardAvoidingView, Platform, ScrollView,
  SafeAreaView, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import { ButtonLoader } from '../../components/common';
import { post } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

interface LocationType { latitude: number; longitude: number; }

const Register = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referrerUsername, setReferrerUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const requestLocation = useCallback(() => {
    Geolocation.getCurrentPosition(
      (position) => { setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setLocationLoading(false); },
      (error) => {
        Alert.alert('Location Required', 'FlyBook needs your location to provide nearby features. Please enable location services.', [
          { text: 'Cancel', style: 'cancel', onPress: () => setLocationLoading(false) },
          { text: 'Retry', onPress: requestLocation },
        ]);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  useEffect(() => { requestLocation(); }, [requestLocation]);

  const validateInputs = (): boolean => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter your name'); return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) { Alert.alert('Error', 'Please enter a valid email address'); return false; }
    const phoneRegex = /^01\d{9}$/;
    if (!phoneNumber.trim() || !phoneRegex.test(phoneNumber)) { Alert.alert('Error', 'Invalid phone number! Must be 11 digits and start with 01'); return false; }
    if (!password.trim() || password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters long'); return false; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return false; }
    if (!userLocation) { Alert.alert('Location Required', 'Please allow location access to continue', [{ text: 'Cancel', style: 'cancel' }, { text: 'Enable', onPress: requestLocation }]); return false; }
    return true;
  };

  const handleRegister = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    try {
      const response = await post('/users/register', { name: name.trim(), email: email.trim().toLowerCase(), number: phoneNumber, password, userLocation, referrerUsername: referrerUsername.trim() || '' });
      if (response.success) {
        Alert.alert('Success', 'Registration successful! Please login to continue.', [{ text: 'OK', onPress: () => navigation.navigate('Login' as never) }]);
      } else {
        Alert.alert('Error', response.message || 'Registration failed');
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong. Please try again.');
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

  const InputField = ({ icon, placeholder, value, onChange, keyboardType = 'default', secure = false, showToggle = false, toggleState = false, onToggle = () => { }, editable = true }: any) => (
    <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: border }]}>
      <Ionicons name={icon} size={20} color={iconColor} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { color: inputColor }]}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'none'}
        secureTextEntry={secure && !toggleState}
        editable={!loading && editable}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggle} style={styles.eyeIcon} disabled={loading}>
          <Ionicons name={toggleState ? 'eye-outline' : 'eye-off-outline'} size={20} color={iconColor} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: titleColor }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: subtitleColor }]}>Join FlyBook today!</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Full Name *</Text>
              <InputField icon="person-outline" placeholder="Enter your full name" value={name} onChange={setName} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Email *</Text>
              <InputField icon="mail-outline" placeholder="Enter your email" value={email} onChange={setEmail} keyboardType="email-address" />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Phone Number *</Text>
              <InputField icon="call-outline" placeholder="01XXXXXXXXX" value={phoneNumber} onChange={setPhoneNumber} keyboardType="phone-pad" />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Password *</Text>
              <InputField icon="lock-closed-outline" placeholder="Minimum 6 characters" value={password} onChange={setPassword} secure showToggle toggleState={showPassword} onToggle={() => setShowPassword(!showPassword)} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Confirm Password *</Text>
              <InputField icon="lock-closed-outline" placeholder="Re-enter your password" value={confirmPassword} onChange={setConfirmPassword} secure showToggle toggleState={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: labelColor }]}>Referrer Username (Optional)</Text>
              <InputField icon="people-outline" placeholder="Enter referrer username" value={referrerUsername} onChange={setReferrerUsername} />
            </View>

            {/* Location Status */}
            {locationLoading ? (
              <View style={[styles.locationContainer, { backgroundColor: cardBg }]}>
                <Ionicons name="location-outline" size={16} color="#F59E0B" />
                <Text style={[styles.locationText, { color: subtitleColor }]}>Getting your location...</Text>
              </View>
            ) : userLocation ? (
              <View style={[styles.locationContainer, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#F8FAFC' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={[styles.locationText, { color: '#10B981' }]}>Location enabled</Text>
              </View>
            ) : (
              <TouchableOpacity style={[styles.locationContainer, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2' }]} onPress={requestLocation}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={[styles.locationText, { color: '#EF4444' }]}>Tap to enable location</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.registerButton, loading && styles.registerButtonDisabled]} onPress={handleRegister} disabled={loading || locationLoading}>
              {loading ? <ButtonLoader color="#FFFFFF" size="medium" /> : <Text style={styles.registerButtonText}>Create Account</Text>}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: subtitleColor }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login' as never)} disabled={loading}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', minHeight: '100%', paddingHorizontal: 24, paddingVertical: 30 },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 150, height: 70 },
  headerContainer: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  formContainer: { flex: 1 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16 },
  eyeIcon: { padding: 8 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginBottom: 16 },
  locationText: { marginLeft: 8, fontSize: 14 },
  registerButton: {
    backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  registerButtonDisabled: { opacity: 0.6 },
  registerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
});

export default Register;
