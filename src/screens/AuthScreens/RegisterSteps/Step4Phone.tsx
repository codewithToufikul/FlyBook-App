import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, StatusBar,
  Modal, FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';
import { countries, Country } from '../../../utils/countries';

const Step4Phone = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { firstName, lastName, email } = route.params as any;
  const { isDark } = useTheme();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const handleNext = () => {
    let cleanPhone = phoneNumber.trim().replace(/^0+/, '');
    if (!cleanPhone) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    // Combine dial code and phone number
    const fullPhoneNumber = `${selectedCountry.dialCode}${cleanPhone}`;

    // Basic length validation (most international numbers are between 7-15 digits after dial code)
    if (cleanPhone.length < 6 || cleanPhone.length > 15) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    (navigation as any).navigate('Step5Password', {
      firstName,
      lastName,
      email,
      phone: fullPhoneNumber
    });
  };

  const bg = isDark ? '#0f172a' : '#FFFFFF';
  const cardBg = isDark ? '#1e293b' : '#F8FAFC';
  const border = isDark ? '#334155' : '#E2E8F0';
  const titleColor = isDark ? '#f8fafc' : '#1E293B';
  const subtitleColor = isDark ? '#64748b' : '#64748B';
  const inputColor = isDark ? '#f1f5f9' : '#1E293B';
  const backBtnBg = isDark ? '#1e293b' : '#F1F5F9';
  const dotInactive = isDark ? '#334155' : '#E2E8F0';
  const infoBg = isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF';
  const infoText = isDark ? '#60A5FA' : '#1E40AF';

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={[styles.countryItem, { borderBottomColor: border }]}
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryPicker(false);
      }}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={[styles.countryName, { color: titleColor }]}>{item.name}</Text>
      <Text style={[styles.countryDialCode, { color: subtitleColor }]}>{item.dialCode}</Text>
    </TouchableOpacity>
  );

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
            {[0, 1, 2, 3, 4].map(i => (
              <View key={i} style={[styles.progressDot, { backgroundColor: i <= 3 ? '#3B82F6' : dotInactive, width: i <= 3 ? 24 : 8 }]} />
            ))}
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: titleColor }]}>Add your phone number</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>Enter your phone number for account security and recovery.</Text>

          <View style={styles.inputContainer}>
            <View style={[styles.phoneInputWrapper, { backgroundColor: cardBg, borderColor: border }]}>
              <TouchableOpacity
                style={[styles.countryCode, { borderRightColor: border }]}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={[styles.countryCodeText, { color: inputColor }]}>
                  {selectedCountry.flag} {selectedCountry.dialCode}
                </Text>
                <Ionicons name="chevron-down" size={14} color={iconColor} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
              <TextInput
                style={[styles.phoneInput, { color: inputColor }]}
                placeholder="Phone number"
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoFocus
              />
            </View>
          </View>

          <View style={[styles.infoBox, { backgroundColor: infoBg }]}>
            <Ionicons name="information-circle-outline" size={20} color={infoText} />
            <Text style={[styles.infoText, { color: infoText }]}>
              We'll use this for your FlyBook account security.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextButton, !phoneNumber.trim() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!phoneNumber.trim()}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>

        {/* Country Picker Modal */}
        <Modal visible={showCountryPicker} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: bg }]}>
              <View style={[styles.modalHeader, { borderBottomColor: border }]}>
                <Text style={[styles.modalTitle, { color: titleColor }]}>Select Country</Text>
                <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                  <Ionicons name="close" size={28} color={titleColor} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={countries}
                renderItem={renderCountryItem}
                keyExtractor={(item) => item.code}
                contentContainerStyle={styles.countryList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const iconColor = '#64748B';

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
  inputContainer: { marginBottom: 24 },
  phoneInputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  countryCode: { paddingHorizontal: 12, paddingVertical: 16, borderRightWidth: 1, flexDirection: 'row', alignItems: 'center' },
  countryCodeText: { fontSize: 16, fontWeight: '500' },
  phoneInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16 },
  infoBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12 },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  footer: { padding: 24, paddingBottom: 34 },
  nextButton: {
    backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  nextButtonDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { height: '70%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  countryList: { paddingHorizontal: 20 },
  countryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  countryFlag: { fontSize: 24, marginRight: 16 },
  countryName: { flex: 1, fontSize: 16, fontWeight: '500' },
  countryDialCode: { fontSize: 16 },
});

export default Step4Phone;
