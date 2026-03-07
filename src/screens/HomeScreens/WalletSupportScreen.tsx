import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Linking,
    Dimensions,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const WalletSupportScreen = () => {
    const navigation = useNavigation();
    const { isDark } = useTheme();

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const handleSendEmail = () => {
        if (!subject || !message) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const email = 'support@flybook.com';
        const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Email app is not available on this device');
            }
        });
    };

    const steps = [
        {
            icon: 'map-outline',
            title: 'Explore Shops',
            desc: 'Use the map to discover partner shops in your area. Look for the store icons!',
            color: '#4F46E5'
        },
        {
            icon: 'card-outline',
            title: 'Know the Benefits',
            desc: 'Tap on any shop to see how much points you can use and what discounts you get.',
            color: '#10B981'
        },
        {
            icon: 'qr-code-outline',
            title: 'Easy Payments',
            desc: 'Visit the shop and transfer points to the merchant username to complete your purchase.',
            color: '#F59E0B'
        },
        {
            icon: 'gift-outline',
            title: 'Earn Rewards',
            desc: 'Get special cashback or loyalty points directly to your flyWallet after every visit.',
            color: '#EC4899'
        }
    ];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, isDark && { backgroundColor: '#0F172A' }]}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <LinearGradient
                    colors={isDark ? ['#1E293B', '#0F172A'] : ['#4F46E5', '#6366F1']}
                    style={styles.header}
                >
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Help & Support</Text>
                    <Text style={styles.headerSubtitle}>How can we help you today?</Text>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Guideline Section */}
                    <Text style={[styles.sectionTitle, isDark && { color: '#F1F5F9' }]}>How to use Wallet Shop</Text>

                    <View style={styles.stepsContainer}>
                        {steps.map((step, index) => (
                            <View key={index} style={[styles.stepCard, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                                <View style={[styles.stepIconBox, { backgroundColor: step.color + '20' }]}>
                                    <Ionicons name={step.icon} size={24} color={step.color} />
                                </View>
                                <View style={styles.stepInfo}>
                                    <Text style={[styles.stepTitle, isDark && { color: '#F1F5F9' }]}>{step.title}</Text>
                                    <Text style={[styles.stepDesc, isDark && { color: '#94A3B8' }]}>{step.desc}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Support Form */}
                    <View style={[styles.formContainer, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                        <Text style={[styles.formTitle, isDark && { color: '#F1F5F9' }]}>Contact Support</Text>
                        <Text style={[styles.formDesc, isDark && { color: '#94A3B8' }]}>
                            If you face any issues, send us a message and we'll get back to you!
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, isDark && { color: '#CBD5E1' }]}>Subject</Text>
                            <TextInput
                                style={[styles.input, isDark && { backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF' }]}
                                placeholder="What's the issue?"
                                placeholderTextColor="#64748B"
                                value={subject}
                                onChangeText={setSubject}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, isDark && { color: '#CBD5E1' }]}>Message</Text>
                            <TextInput
                                style={[styles.textArea, isDark && { backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF' }]}
                                placeholder="Describe your problem in detail..."
                                placeholderTextColor="#64748B"
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                                value={message}
                                onChangeText={setMessage}
                            />
                        </View>

                        <TouchableOpacity style={styles.sendBtn} onPress={handleSendEmail}>
                            <Ionicons name="mail" size={20} color="#FFF" />
                            <Text style={styles.sendBtnText}>Send Message</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{ height: 50 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 30,
        paddingHorizontal: 25,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
    content: { padding: 25 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 20 },
    stepsContainer: { marginBottom: 30 },
    stepCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
    },
    stepIconBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    stepInfo: { flex: 1 },
    stepTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
    stepDesc: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
    formContainer: {
        backgroundColor: '#FFF',
        borderRadius: 25,
        padding: 25,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    formTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 5 },
    formDesc: { fontSize: 14, color: '#64748B', marginBottom: 25 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8, marginLeft: 4 },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 15,
        padding: 15,
        fontSize: 15,
        color: '#1E293B',
    },
    textArea: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 15,
        padding: 15,
        fontSize: 15,
        color: '#1E293B',
        height: 120,
    },
    sendBtn: {
        backgroundColor: '#4F46E5',
        height: 55,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 10,
    },
    sendBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default WalletSupportScreen;
