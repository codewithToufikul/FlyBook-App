import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';

const Step1Name = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleNext = () => {
    if (!firstName.trim()) { Alert.alert('Error', 'Please enter your first name'); return; }
    if (!lastName.trim()) { Alert.alert('Error', 'Please enter your last name'); return; }
    navigation.navigate('Step2Email' as never, { firstName: firstName.trim(), lastName: lastName.trim() } as never);
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
          <TouchableOpacity style={[styles.backButton, { backgroundColor: backBtnBg }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#1E293B'} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, { backgroundColor: '#3B82F6', width: 24 }]} />
            <View style={[styles.progressDot, { backgroundColor: dotInactive }]} />
            <View style={[styles.progressDot, { backgroundColor: dotInactive }]} />
            <View style={[styles.progressDot, { backgroundColor: dotInactive }]} />
            <View style={[styles.progressDot, { backgroundColor: dotInactive }]} />
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: titleColor }]}>What's your name?</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>Enter the name you use in real life</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, borderColor: border, color: inputColor }]}
              placeholder="First name"
              placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoFocus
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: cardBg, borderColor: border, color: inputColor }]}
              placeholder="Last name"
              placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, (!firstName.trim() || !lastName.trim()) && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!firstName.trim() || !lastName.trim()}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 0, paddingBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  progressContainer: { flexDirection: 'row', gap: 8 },
  progressDot: { width: 8, height: 8, borderRadius: 4 },
  placeholder: { width: 40 },
  formContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 32 },
  inputContainer: { marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16 },
  footer: { padding: 24, paddingBottom: 34 },
  nextButton: {
    backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  nextButtonDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default Step1Name;
