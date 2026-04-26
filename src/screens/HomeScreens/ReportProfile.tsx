import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

const ReportProfile = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { isDark } = useTheme();
    const { userId, userName } = route.params || {};

    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');

    const reportReasons = [
        'Spam',
        'Inappropriate Content',
        'Harassment',
        'Fake Account',
        'Inappropriate Profile Picture',
        'Something Else',
    ];

    const handleReport = () => {
        if (!reason) {
            Toast.show({
                type: 'error',
                text1: 'Required',
                text2: 'Please select a reason for reporting.',
            });
            return;
        }

        if (description.length < 10) {
            Toast.show({
                type: 'error',
                text1: 'Too Short',
                text2: 'Please provide more details (at least 10 characters).',
            });
            return;
        }

        navigation.goBack();
        setTimeout(() => {
            Toast.show({
                type: 'success',
                text1: 'Report Submitted',
                text2: 'Thank you for your report. We will review it shortly.',
            });
        }, 300);
    };

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor="transparent"
                translucent
            />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }, isDark && { borderBottomColor: '#1e293b', backgroundColor: '#0f172a' }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, isDark && { backgroundColor: '#1e293b' }]}
                >
                    <Ionicons name="close" size={24} color={isDark ? "#f8fafc" : "#111827"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Report Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <LinearGradient
                        colors={isDark ? ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)'] : ['#FEF2F2', '#FFF5F5']}
                        style={[styles.infoCard, isDark && { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                    >
                        <View style={[styles.iconBox, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                            <Ionicons name="alert-circle" size={22} color="#EF4444" />
                        </View>
                        <Text style={[styles.infoText, isDark && { color: '#fca5a5' }]}>
                            Reporting <Text style={{ fontWeight: '900', color: isDark ? '#f8fafc' : '#B91C1C' }}>{userName}</Text>.
                            We will investigate this profile based on your report.
                        </Text>
                    </LinearGradient>

                    <Text style={[styles.sectionTitle, isDark && { color: '#cbd5e1' }]}>Why are you reporting this profile?</Text>
                    <View style={styles.reasonsGrid}>
                        {reportReasons.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.reasonItem,
                                    isDark && { backgroundColor: '#1e293b', borderColor: '#334155' },
                                    reason === item && styles.reasonItemActive
                                ]}
                                onPress={() => setReason(item)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.reasonText,
                                    isDark && { color: '#94a3b8' },
                                    reason === item && styles.reasonTextActive
                                ]}>
                                    {item}
                                </Text>
                                {reason === item && (
                                    <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginLeft: 6 }} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.sectionTitle, isDark && { color: '#cbd5e1' }]}>Details</Text>
                    <View style={[styles.inputContainer, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                        <TextInput
                            style={[styles.textArea, isDark && { color: '#f8fafc' }]}
                            placeholder="Please provide specific details about why you are reporting this profile..."
                            placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            value={description}
                            onChangeText={setDescription}
                        />
                        <View style={styles.inputFooter}>
                            <Text style={[styles.charCount, isDark && { color: '#64748b' }]}>{description.length} characters</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleReport}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#EF4444', '#DC2626']}
                            style={styles.submitButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{ marginRight: 10 }} />
                            <Text style={styles.submitButtonText}>Submit Report</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={[styles.footerContainer, isDark && { backgroundColor: 'rgba(30, 41, 59, 0.5)' }]}>
                        <Ionicons name="lock-closed" size={14} color={isDark ? "#64748b" : "#9CA3AF"} />
                        <Text style={[styles.footerNote, isDark && { color: '#64748b' }]}>
                            Reports are handled confidentially. We won't share your identity with the person you're reporting.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#991B1B',
        lineHeight: 20,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#334155',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    reasonsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 30,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 25,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    reasonItemActive: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    reasonText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '700',
    },
    reasonTextActive: {
        color: '#FFF',
    },
    inputContainer: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 20,
        padding: 16,
        marginBottom: 32,
    },
    textArea: {
        fontSize: 16,
        color: '#0F172A',
        minHeight: 180,
        lineHeight: 24,
        paddingTop: 0,
    },
    inputFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 12,
        marginTop: 12,
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
    submitButton: {
        height: 60,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    footerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    footerNote: {
        flex: 1,
        fontSize: 12,
        color: '#94A3B8',
        lineHeight: 18,
        fontWeight: '500',
    },
});

export default ReportProfile;
