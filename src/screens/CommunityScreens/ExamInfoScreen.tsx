import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ExamInfoScreen = ({ route, navigation }: any) => {
    const { courseId, examId, examType, chapterIdx } = route.params;
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<any>(null);
    const [identityNumber, setIdentityNumber] = useState('');

    useEffect(() => {
        fetchExamDetails();
    }, [examId]);

    const fetchExamDetails = async () => {
        try {
            setLoading(true);
            const res = await get<any>(`/exams/${examId}`);
            if (res.success) {
                setExam(res.data);
            } else {
                Alert.alert('Error', 'Failed to load exam information');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Fetch exam details error:', error);
            Alert.alert('Error', 'Failed to load exam details. Please check your connection.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleStartExam = () => {
        if (!identityNumber.trim()) {
            Alert.alert('Required', 'Please enter your Roll/ID Number to continue.');
            return;
        }

        // Navigate to Exam Runner with the identity param
        navigation.navigate('CommunityExamRunner', {
            courseId,
            examId,
            examType,
            identityNumber: identityNumber.trim(),
            chapterIdx: chapterIdx ?? 0
        });
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, isDark && { backgroundColor: '#0f172a' }]}>
                <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#4F46E5"} />
                <Text style={[styles.loadingText, isDark && { color: '#94a3b8' }]}>Loading exam info...</Text>
            </View>
        );
    }

    const totalQuestions = exam?.questions?.length || 0;
    const timeLimit = exam?.timeLimitMinutes;
    const passingScore = exam?.passingScore || 0;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}
        >
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFFFFF"} />

            {/* Header */}
            <View style={[
                styles.header,
                isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' },
                { paddingTop: insets.top + 10 }
            ]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={isDark ? "#f8fafc" : "#1F2937"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Exam Portal</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Intro Card */}
                <View style={[styles.card, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                    <View style={styles.badgeContainer}>
                        <View style={[styles.typeBadge, { backgroundColor: examType === 'quiz' ? '#eff6ff' : '#fef3c7' }, isDark && { backgroundColor: examType === 'quiz' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)' }]}>
                            <Text style={[styles.typeBadgeText, { color: examType === 'quiz' ? '#1e40af' : '#b45309' }]}>
                                {examType === 'quiz' ? '⚡ QUIZ EXAM' : '📝 WRITTEN EXAM'}
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.title, isDark && { color: '#f8fafc' }]}>Ready to start your exam?</Text>
                    <Text style={[styles.subtitle, isDark && { color: '#94a3b8' }]}>
                        Please review the exam guidelines and enter your identity number before launching.
                    </Text>

                    {/* Stats List */}
                    <View style={styles.statsList}>
                        <View style={[styles.statRow, isDark && { borderBottomColor: '#334155' }]}>
                            <View style={styles.statIconName}>
                                <Ionicons name="help-circle-outline" size={20} color={isDark ? "#94a3b8" : "#4F46E5"} />
                                <Text style={[styles.statLabel, isDark && { color: '#e2e8f0' }]}>Total Questions</Text>
                            </View>
                            <Text style={[styles.statValue, isDark && { color: '#f8fafc' }]}>{totalQuestions} Questions</Text>
                        </View>

                        <View style={[styles.statRow, isDark && { borderBottomColor: '#334155' }]}>
                            <View style={styles.statIconName}>
                                <Ionicons name="time-outline" size={20} color={isDark ? "#94a3b8" : "#4F46E5"} />
                                <Text style={[styles.statLabel, isDark && { color: '#e2e8f0' }]}>Time Limit</Text>
                            </View>
                            <Text style={[styles.statValue, isDark && { color: '#f8fafc' }]}>
                                {timeLimit ? `${timeLimit} Minutes` : 'No Time Limit'}
                            </Text>
                        </View>

                        <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
                            <View style={styles.statIconName}>
                                <Ionicons name="ribbon-outline" size={20} color={isDark ? "#94a3b8" : "#4F46E5"} />
                                <Text style={[styles.statLabel, isDark && { color: '#e2e8f0' }]}>Passing Score</Text>
                            </View>
                            <Text style={[styles.statValue, isDark && { color: '#10b981' }]}>{passingScore}% or higher</Text>
                        </View>
                    </View>
                </View>

                {/* Identity Input section */}
                <View style={[styles.card, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                    <Text style={[styles.sectionTitle, isDark && { color: '#f8fafc' }]}>🪪 Candidate Identity</Text>
                    <Text style={[styles.inputHint, isDark && { color: '#94a3b8' }]}>
                        Enter your official student identity number (Roll No / ID No / Reg No) to record your exam attempt.
                    </Text>

                    <TextInput
                        style={[
                            styles.input,
                            isDark && {
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                color: '#f8fafc'
                            }
                        ]}
                        placeholder="e.g. Roll: 2026-CS-043"
                        placeholderTextColor={isDark ? '#64748b' : '#9CA3AF'}
                        value={identityNumber}
                        onChangeText={setIdentityNumber}
                        autoCapitalize="characters"
                        autoCorrect={false}
                    />
                </View>

                {/* Notice Box */}
                <View style={[styles.noticeBox, isDark && { backgroundColor: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }]}>
                    <Ionicons name="warning" size={20} color="#b45309" />
                    <Text style={[styles.noticeText, isDark && { color: '#f59e0b' }]}>
                        Once you start the exam, the timer will begin. Closing the screen or switching apps may affect your final score or trigger proctoring alerts.
                    </Text>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={[
                styles.footer,
                isDark && { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
                { paddingBottom: insets.bottom + 16 }
            ]}>
                <TouchableOpacity
                    style={[
                        styles.startBtn,
                        !identityNumber.trim() && styles.disabledBtn,
                        identityNumber.trim() && { backgroundColor: isDark ? '#14b8a6' : '#4F46E5' }
                    ]}
                    onPress={handleStartExam}
                    disabled={!identityNumber.trim()}
                >
                    <Text style={styles.startBtnText}>🚀 Start Exam Now</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: { marginTop: 10, color: '#6B7280', fontWeight: '500' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backBtn: { padding: 4 },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    scrollContent: {
        padding: 16,
        gap: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    badgeContainer: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    typeBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    typeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 20,
    },
    statsList: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    statIconName: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    inputHint: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        color: '#111827',
        backgroundColor: '#F9FAFB',
        fontWeight: '500',
    },
    noticeBox: {
        flexDirection: 'row',
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 12,
        padding: 14,
        gap: 10,
    },
    noticeText: {
        flex: 1,
        fontSize: 12,
        color: '#92400E',
        lineHeight: 18,
        fontWeight: '500',
    },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    startBtn: {
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledBtn: {
        backgroundColor: '#E5E7EB',
    },
    startBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ExamInfoScreen;
