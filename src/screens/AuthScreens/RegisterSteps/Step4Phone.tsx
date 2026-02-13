import React, { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

const Step4Phone = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { firstName, lastName, email } = route.params as any;

  const [phoneNumber, setPhoneNumber] = useState('');

  const handleNext = () => {
    // Phone number is now mandatory
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    // Validate Bangladesh phone number format
    const phoneRegex = /^01\d{9}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid 11-digit phone number starting with 01'
      );
      return;
    }

    // Navigate to password step with validated phone number
    navigation.navigate('Step5Password' as never, {
      firstName,
      lastName,
      email,
      phone: phoneNumber.trim(),
    } as never);
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
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Add your phone number</Text>
          <Text style={styles.subtitle}>
            Enter your phone number for account security and recovery (Required)
          </Text>

          {/* Phone Input */}
          <View style={styles.inputContainer}>
            <View style={styles.phoneInputWrapper}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇧🇩 +880</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="1XXXXXXXXX"
                placeholderTextColor="#94A3B8"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={11}
                autoFocus
              />
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.infoText}>
              Enter a valid 11-digit phone number starting with 01 (e.g., 01712345678)
            </Text>
          </View>
        </View>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.nextButton,
              !phoneNumber.trim() && styles.nextButtonDisabled
            ]} 
            onPress={handleNext}
            disabled={!phoneNumber.trim()}
          >
            <Text style={styles.nextButtonText}>Next</Text>
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
    marginBottom: 24,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    paddingBottom: 34,
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Step4Phone;
