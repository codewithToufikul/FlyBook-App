import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';
import { get } from '../../../services/api';

const Step4bAffiliate = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { firstName, lastName, email, phone } = route.params as any;
  const { isDark } = useTheme();

  const [affiliateId, setAffiliateId] = useState('');
  const [validationState, setValidationState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [referrerName, setReferrerName] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bg = isDark ? '#0f172a' : '#FFFFFF';
  const cardBg = isDark ? '#1e293b' : '#F8FAFC';
  const border = isDark ? '#334155' : '#E2E8F0';
  const titleColor = isDark ? '#f8fafc' : '#1E293B';
  const subtitleColor = isDark ? '#64748b' : '#64748B';
  const inputColor = isDark ? '#f1f5f9' : '#1E293B';
  const backBtnBg = isDark ? '#1e293b' : '#F1F5F9';
  const dotInactive = isDark ? '#334155' : '#E2E8F0';

  const handleAffiliateChange = (text: string) => {
    const cleaned = text.trim().toLowerCase();
    setAffiliateId(cleaned);
    setReferrerName('');

    if (!cleaned) {
      setValidationState('idle');
      return;
    }

    setValidationState('checking');

    // Debounce validation — 600ms পর চেক করবে
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await get<{ exists: boolean; name?: string }>(`/users/check-username?userName=${cleaned}`);
        if (res?.exists) {
          setValidationState('valid');
          setReferrerName(res.name || '');
        } else {
          setValidationState('invalid');
        }
      } catch {
        setValidationState('invalid');
      }
    }, 600);
  };

  const handleNext = () => {
    (navigation as any).navigate('Step5Password', {
      firstName,
      lastName,
      email,
      phone,
      referrerUsername: validationState === 'valid' ? affiliateId : '',
    });
  };

  const handleSkip = () => {
    (navigation as any).navigate('Step5Password', {
      firstName,
      lastName,
      email,
      phone,
      referrerUsername: '',
    });
  };

  const getBorderColor = () => {
    if (validationState === 'valid') return '#10B981';
    if (validationState === 'invalid') return '#EF4444';
    return border;
  };

  const getStatusIcon = () => {
    if (validationState === 'checking') return <ActivityIndicator size="small" color="#3B82F6" />;
    if (validationState === 'valid') return <Ionicons name="checkmark-circle" size={22} color="#10B981" />;
    if (validationState === 'invalid') return <Ionicons name="close-circle" size={22} color="#EF4444" />;
    return <Ionicons name="people-outline" size={22} color={isDark ? '#475569' : '#94A3B8'} />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: backBtnBg }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#1E293B'} />
          </TouchableOpacity>

          {/* Progress Dots — 6 steps এখন */}
          <View style={styles.progressContainer}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  { backgroundColor: i <= 4 ? '#3B82F6' : dotInactive, width: i <= 4 ? 24 : 8 },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipText, { color: subtitleColor }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.formContainer}>

          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF' }]}>
            <Ionicons name="gift-outline" size={36} color="#6366F1" />
          </View>

          <Text style={[styles.title, { color: titleColor }]}>Got a referral?</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            Enter your friend's FlyBook username to connect. This step is optional.
          </Text>

          {/* Input */}
          <View style={[styles.inputWrapper, { backgroundColor: cardBg, borderColor: getBorderColor() }]}>
            <TextInput
              style={[styles.input, { color: inputColor }]}
              placeholder="Enter affiliate username"
              placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
              value={affiliateId}
              onChangeText={handleAffiliateChange}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.statusIcon}>
              {getStatusIcon()}
            </View>
          </View>

          {/* Validation Message */}
          {validationState === 'valid' && referrerName && (
            <View style={[styles.validMsg, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#F0FDF4' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.validMsgText}>Referred by <Text style={{ fontWeight: '700' }}>{referrerName}</Text></Text>
            </View>
          )}
          {validationState === 'invalid' && affiliateId.length > 0 && (
            <View style={[styles.invalidMsg, { backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2' }]}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text style={styles.invalidMsgText}>Username not found. Check and try again.</Text>
            </View>
          )}

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#EEF2FF' }]}>
            <Ionicons name="information-circle-outline" size={18} color="#6366F1" />
            <Text style={[styles.infoText, { color: isDark ? '#818CF8' : '#4338CA' }]}>
              Your friend will be notified when you join using their affiliate ID.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              validationState !== 'valid' && styles.nextButtonSecondary,
            ]}
            onPress={handleNext}
            disabled={validationState === 'checking'}
          >
            <Text style={[
              styles.nextButtonText,
              validationState !== 'valid' && { color: isDark ? '#94a3b8' : '#64748B' },
            ]}>
              {validationState === 'valid' ? 'Continue with Referral' : 'Continue without Referral'}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={validationState === 'valid' ? '#FFFFFF' : (isDark ? '#94a3b8' : '#64748B')}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 20,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  progressContainer: { flexDirection: 'row', gap: 6 },
  progressDot: { height: 8, borderRadius: 4 },
  skipText: { fontSize: 14, fontWeight: '600' },
  formContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 32, lineHeight: 24 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 12, marginBottom: 12,
  },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16 },
  statusIcon: { paddingHorizontal: 14 },
  validMsg: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginBottom: 16,
  },
  validMsgText: { fontSize: 14, color: '#10B981' },
  invalidMsg: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginBottom: 16,
  },
  invalidMsgText: { fontSize: 14, color: '#EF4444' },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, borderRadius: 12, marginTop: 8,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  footer: { padding: 24, paddingBottom: 34 },
  nextButton: {
    backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  nextButtonSecondary: {
    backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#CBD5E1',
    shadowOpacity: 0, elevation: 0,
  },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default Step4bAffiliate;
