import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import { ButtonLoader } from '../../../components/common';
import { useAuth } from '../../../hooks/useAuth';
import { post, saveToken, saveUser } from '../../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LocationType {
  latitude: number;
  longitude: number;
}

const Step5Password = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { loginUser } = useAuth();
  const { firstName, lastName, email, phone } = route.params as any;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Location error:', error);
        // Continue without location
        setUserLocation({
          latitude: 0,
          longitude: 0,
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const validatePassword = () => {
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleCreateAccount = async () => {
    if (!validatePassword()) {
      return;
    }

    if (!userLocation) {
      Alert.alert('Error', 'Please wait while we get your location');
      return;
    }

    setLoading(true);
    try {
      const { register } = await import('../../../services/authServices');

      const response = await register({
        name: `${firstName} ${lastName}`,
        email: email,
        number: phone || '',
        password: password,
        userLocation: userLocation,
        referrerUsername: '',
      });

      if (response.success && response.token) {
        // Log successful registration
        console.log('✅ Registration successful and user logged in');

        // Use loginUser from context to ensure immediate state sync
        if (response.user) {
          await loginUser(response.user);
        }

        Alert.alert(
          'Success!',
          'Your account has been created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigation will happen automatically via RootNavigator
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create a password</Text>
          <Text style={styles.subtitle}>
            Create a secure password with at least 6 characters
          </Text>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoFocus
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
                disabled={loading}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsBox}>
            <View style={styles.requirement}>
              <Ionicons
                name={password.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={password.length >= 6 ? '#10B981' : '#CBD5E1'}
              />
              <Text
                style={[
                  styles.requirementText,
                  password.length >= 6 && styles.requirementTextMet,
                ]}
              >
                At least 6 characters
              </Text>
            </View>
            <View style={styles.requirement}>
              <Ionicons
                name={
                  password && confirmPassword && password === confirmPassword
                    ? 'checkmark-circle'
                    : 'ellipse-outline'
                }
                size={20}
                color={
                  password && confirmPassword && password === confirmPassword
                    ? '#10B981'
                    : '#CBD5E1'
                }
              />
              <Text
                style={[
                  styles.requirementText,
                  password &&
                  confirmPassword &&
                  password === confirmPassword &&
                  styles.requirementTextMet,
                ]}
              >
                Passwords match
              </Text>
            </View>
          </View>
        </View>

        {/* Create Account Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              (password.length < 6 || password !== confirmPassword) &&
              styles.createButtonDisabled,
            ]}
            onPress={handleCreateAccount}
            disabled={
              password.length < 6 || password !== confirmPassword || loading
            }
          >
            {loading ? (
              <ButtonLoader color="#FFFFFF" size="medium" />
            ) : (
              <Text style={styles.createButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  progressDotActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  eyeIcon: {
    padding: 12,
  },
  requirementsBox: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requirementText: {
    fontSize: 14,
    color: '#64748B',
  },
  requirementTextMet: {
    color: '#10B981',
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    paddingBottom: 34,
  },
  createButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Step5Password;
