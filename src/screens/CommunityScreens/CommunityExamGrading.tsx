import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Alert, KeyboardAvoidingView,
    Platform, StatusBar, Linking
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSound } from 'react-native-nitro-sound';
import { post, get } from '../../services/api';
import Video from 'react-native-video';

const CommunityExamGrading = ({ route, navigation }: any) => {
    const { attempt: initialAttempt, studentName } = route.params;
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();

    const [attempt, setAttempt] = useState<any>(initialAttempt);
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState(initialAttempt.score?.toString() || '');
    const [feedback, setFeedback] = useState(initialAttempt.feedback || '');
    const [submitting, setSubmitting] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [showVideo, setShowVideo] = useState(false);

    useEffect(() => {
        const fetchAttempt = async () => {
            const attemptId = initialAttempt.attemptId || initialAttempt._id;
            if (!attemptId) {
                setLoading(false);
                return;
            }
            try {
                const res = await get<any>(`/exams/attempts/${attemptId}`);
                if (res.success && res.data) {
                    setAttempt(res.data);
                    setScore(res.data.score?.toString() || '');
                    setFeedback(res.data.feedback || '');
                } else {
                    Alert.alert('Error', 'Failed to load attempt details');
                }
            } catch (e) {
                Alert.alert('Error', 'Failed to load attempt details');
            } finally {
                setLoading(false);
            }
        };
        fetchAttempt();
    }, [initialAttempt]);

    const examType: string = attempt?.exam?.type || attempt?.type || 'written';
    const questions: any[] = attempt?.exam?.questions || attempt?.questions || [];
    const answers: any[] = attempt?.answers || [];

    const { startPlayer, stopPlayer } = useSound({
        onPlaybackEnd: () => setIsPlayingAudio(false)
    });

    const handlePlayAudio = async () => {
        if (!attempt.audioUrl) return;
        try {
            if (isPlayingAudio) {
                await stopPlayer();
                setIsPlayingAudio(false);
            } else {
                await startPlayer(attempt.audioUrl);
                setIsPlayingAudio(true);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to play audio');
        }
    };

    const getAnswerForQuestion = useCallback((qIdx: number) => {
        return answers.find((a: any) => a.questionIndex === qIdx);
    }, [answers]);

    const getCorrectIcon = (isCorrect: boolean | null) => {
        if (isCorrect === true) return { name: 'checkmark-circle', color: '#10B981' };
        if (isCorrect === false) return { name: 'close-circle', color: '#EF4444' };
        return { name: 'ellipse-outline', color: '#9CA3AF' };
    };

    const handleSubmitGrade = async () => {
        if (!score || isNaN(Number(score))) {
            Alert.alert('Invalid Score', 'Please enter a valid numeric score (0-100)');
            return;
        }
        const numScore = Number(score);
        if (numScore < 0 || numScore > 100) {
            Alert.alert('Out of Range', 'Score must be between 0 and 100');
            return;
        }
        setSubmitting(true);
        const attemptId = attempt.attemptId || attempt._id;
        try {
            const res = await post<any>(`/exams/attempts/${attemptId}/grade`, {
                score: numScore,
                feedback
            });
            if (res.success) {
                Alert.alert(
                    res.passed ? '✅ Passed' : '❌ Failed',
                    `Score: ${numScore}% — ${res.passed ? 'Student has passed this exam.' : 'Student did not meet the passing threshold.'}`,
                    [{ text: 'Done', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Error', res.message || 'Failed to submit grade');
            }
        } catch (e) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const typeBadge: Record<string, { label: string; bg: string; text: string }> = {
        quiz: { label: '⚡ QUIZ', bg: '#eff6ff', text: '#1e40af' },
        written: { label: '✏️ WRITTEN', bg: '#f0fdf4', text: '#166534' },
        listening: { label: '🎧 LISTENING', bg: '#fef3c7', text: '#b45309' },
        speaking: { label: '🎤 SPEAKING', bg: '#fdf4ff', text: '#7e22ce' },
    };
    const badge = typeBadge[examType] || typeBadge.written;

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }, { paddingTop: insets.top }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0f172a' : '#FFFFFF'} />

            {/* Header */}
            <View style={[styles.header, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#1F2937'} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Grade Exam</Text>
                    <Text style={[styles.headerSub, isDark && { color: '#64748b' }]} numberOfLines={1}>{studentName}</Text>
                </View>
                <View style={[styles.typePill, { backgroundColor: isDark ? `${badge.bg}33` : badge.bg }]}>
                    <Text style={[styles.typePillText, { color: badge.text }]}>{badge.label}</Text>
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#0f172a' : '#FFFFFF' }}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                        {/* Student Info Card */}
                        <View style={[styles.card, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                            <View style={styles.cardRow}>
                                <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(79,70,229,0.15)' : '#EEF2FF' }]}>
                                    <Ionicons name="person" size={18} color="#4F46E5" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.cardLabel, isDark && { color: '#64748b' }]}>Student Name</Text>
                                    <Text style={[styles.cardValue, isDark && { color: '#f8fafc' }]}>{studentName}</Text>
                                </View>
                            </View>
                            {attempt.identityNumber && (
                                <View style={[styles.cardRow, { marginTop: 10 }]}>
                                    <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7' }]}>
                                        <Ionicons name="card" size={18} color="#F59E0B" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.cardLabel, isDark && { color: '#64748b' }]}>Roll / ID</Text>
                                        <Text style={[styles.cardValue, isDark && { color: '#f8fafc' }]}>{attempt.identityNumber}</Text>
                                    </View>
                                </View>
                            )}
                            <View style={[styles.cardRow, { marginTop: 10 }]}>
                                <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5' }]}>
                                    <Ionicons name="time" size={18} color="#10B981" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.cardLabel, isDark && { color: '#64748b' }]}>Submitted At</Text>
                                    <Text style={[styles.cardValue, isDark && { color: '#f8fafc' }]}>
                                        {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'N/A'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Audio Response */}
                        {attempt.audioUrl && (
                            <View style={[styles.card, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                <Text style={[styles.sectionTitle, isDark && { color: '#f8fafc' }]}>🎵 Audio Response</Text>
                                <TouchableOpacity
                                    style={[styles.audioBtn, isPlayingAudio && styles.audioBtnActive, isDark && !isPlayingAudio && { backgroundColor: 'rgba(20,184,166,0.15)', borderColor: '#14b8a6' }]}
                                    onPress={handlePlayAudio}
                                >
                                    <Ionicons name={isPlayingAudio ? 'pause-circle' : 'play-circle'} size={28} color={isPlayingAudio ? '#EF4444' : (isDark ? '#14b8a6' : '#4F46E5')} />
                                    <Text style={[styles.audioBtnText, isDark && { color: '#14b8a6' }]}>
                                        {isPlayingAudio ? 'Pause Audio' : 'Play Audio Response'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Video Response */}
                        {attempt.videoUrl && (
                            <View style={[styles.card, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                <Text style={[styles.sectionTitle, isDark && { color: '#f8fafc' }]}>🎥 Video Response</Text>
                                {showVideo ? (
                                    <View style={styles.videoWrapper}>
                                        <Video
                                            source={{ uri: attempt.videoUrl }}
                                            style={styles.videoPlayer}
                                            controls={true}
                                            resizeMode="contain"
                                        />
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.audioBtn, isDark && { backgroundColor: 'rgba(20,184,166,0.15)', borderColor: '#14b8a6' }]}
                                        onPress={() => setShowVideo(true)}
                                    >
                                        <Ionicons name="videocam" size={26} color={isDark ? '#14b8a6' : '#4F46E5'} />
                                        <Text style={[styles.audioBtnText, isDark && { color: '#14b8a6' }]}>Load & Play Video</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Questions & Answers */}
                        {questions.length > 0 && (
                            <View style={[styles.card, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                <Text style={[styles.sectionTitle, isDark && { color: '#f8fafc' }]}>📝 Questions & Answers</Text>
                                {questions.map((q: any, idx: number) => {
                                    const studentAns = getAnswerForQuestion(idx);
                                    const isMcq = examType === 'quiz' || q.type === 'mcq';
                                    const isCorrect = isMcq
                                        ? (studentAns ? studentAns.answer === q.answer : false)
                                        : studentAns?.isCorrect;
                                    const icon = getCorrectIcon(isCorrect);

                                    return (
                                        <View key={idx} style={[styles.questionBox, idx > 0 && { borderTopWidth: 1, borderTopColor: isDark ? '#334155' : '#E5E7EB', paddingTop: 16 }]}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Text style={[styles.questionText, isDark && { color: '#f8fafc' }]}>
                                                    Q{idx + 1}. {q.question || q.text}
                                                </Text>
                                                {isMcq && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                        <Ionicons name={icon.name} size={18} color={icon.color} />
                                                        <Text style={[styles.correctText, { color: icon.color }]}>
                                                            {isCorrect ? 'Correct' : isCorrect === false ? 'Incorrect' : 'Pending'}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            {isMcq ? (
                                                <View style={{ gap: 8, marginTop: 12 }}>
                                                    {q.options?.map((opt: string, optIdx: number) => {
                                                        const isSelected = studentAns?.answer === opt;
                                                        const isCorrectOpt = q.answer === opt;
                                                        let optBg = 'transparent';
                                                        let optBorder = isDark ? '#334155' : '#E5E7EB';

                                                        if (isSelected) {
                                                            optBg = isCorrectOpt ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
                                                            optBorder = isCorrectOpt ? '#10B981' : '#EF4444';
                                                        } else if (isCorrectOpt) {
                                                            optBg = 'rgba(16,185,129,0.05)';
                                                            optBorder = '#10B981';
                                                        }

                                                        return (
                                                            <View
                                                                key={optIdx}
                                                                style={[
                                                                    styles.optionRow,
                                                                    { backgroundColor: optBg, borderColor: optBorder },
                                                                    isDark && { backgroundColor: optBg === 'transparent' ? 'transparent' : optBg }
                                                                ]}
                                                            >
                                                                <Text style={[styles.optionText, isDark && { color: '#f8fafc' }]}>
                                                                    {String.fromCharCode(65 + optIdx)}. {opt}
                                                                </Text>
                                                                {isCorrectOpt && <Ionicons name="checkmark" size={16} color="#10B981" />}
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            ) : (
                                                <View style={{ marginTop: 12, gap: 10 }}>
                                                    <View style={[styles.writtenAnswer, isDark && { backgroundColor: '#0f172a', borderColor: '#334155' }]}>
                                                        <Text style={[styles.writtenLabel, isDark && { color: '#64748b' }]}>Student's Answer:</Text>
                                                        <Text style={[styles.writtenText, isDark && { color: '#f8fafc' }]}>
                                                            {studentAns?.type === 'image' ? '🖼️ [Photo Uploaded]' :
                                                             studentAns?.type === 'pdf' ? '📄 [PDF Document Uploaded]' :
                                                             (studentAns?.answer || '(No answer submitted)')}
                                                        </Text>
                                                    </View>

                                                    {/* File/Link attachments if any */}
                                                    {(studentAns?.type === 'image' || studentAns?.type === 'pdf' || studentAns?.fileUrl) && (
                                                        <TouchableOpacity
                                                            style={[styles.attachmentLink, isDark && { backgroundColor: 'rgba(79,70,229,0.15)', borderColor: '#4f46e5' }]}
                                                            onPress={() => Linking.openURL((studentAns?.type === 'image' || studentAns?.type === 'pdf') ? studentAns.answer : studentAns.fileUrl)}
                                                        >
                                                            <Ionicons 
                                                                name={studentAns?.type === 'pdf' ? "document" : "image"} 
                                                                size={18} 
                                                                color="#4F46E5" 
                                                            />
                                                            <Text style={styles.attachmentText}>
                                                                View Attached {studentAns?.type === 'pdf' ? 'PDF Document' : 'Photo'}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* Grading Area */}
                        {['written', 'listening', 'speaking'].includes(examType) && (
                            <View style={[styles.card, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                <Text style={[styles.sectionTitle, isDark && { color: '#f8fafc' }]}>⭐ Grading & Evaluation</Text>

                                <View style={{ gap: 12, marginTop: 8 }}>
                                    <View>
                                        <Text style={[styles.inputLabel, isDark && { color: '#f8fafc' }]}>Marks / Score (0 - 100)</Text>
                                        <TextInput
                                            style={[styles.input, isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }]}
                                            placeholder="Enter score (e.g. 85)"
                                            placeholderTextColor={isDark ? '#475569' : '#9CA3AF'}
                                            keyboardType="numeric"
                                            value={score}
                                            onChangeText={setScore}
                                        />
                                    </View>

                                    <View>
                                        <Text style={[styles.inputLabel, isDark && { color: '#f8fafc' }]}>Feedback / Comments</Text>
                                        <TextInput
                                            style={[styles.input, styles.textArea, isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }]}
                                            placeholder="Provide constructive feedback for the student..."
                                            placeholderTextColor={isDark ? '#475569' : '#9CA3AF'}
                                            multiline
                                            numberOfLines={4}
                                            value={feedback}
                                            onChangeText={setFeedback}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.submitBtn, isDark && { backgroundColor: '#14b8a6' }, submitting && styles.disabledBtn]}
                                    onPress={handleSubmitGrade}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-done" size={20} color="#fff" />
                                            <Text style={styles.submitBtnText}>Submit Grade</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingBottom: 12,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
        gap: 12,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
    headerSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
    typePill: {
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    typePillText: { fontSize: 11, fontWeight: '700' },
    scroll: { padding: 16, gap: 16 },
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: '#F3F4F6',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
        gap: 16
    },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconWrap: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center'
    },
    cardLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase' },
    cardValue: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginTop: 2 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
    audioBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
        backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#818CF8',
        gap: 8
    },
    audioBtnActive: { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
    audioBtnText: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
    videoWrapper: { width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
    videoPlayer: { width: '100%', height: 200 },
    questionBox: { gap: 12 },
    questionText: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, lineHeight: 22 },
    correctText: { fontSize: 12, fontWeight: '700' },
    optionRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1,
        borderColor: '#E5E7EB', backgroundColor: '#FFFFFF'
    },
    optionText: { fontSize: 14, color: '#374151', flex: 1 },
    writtenAnswer: {
        padding: 12, borderRadius: 12, backgroundColor: '#F9FAFB',
        borderWidth: 1, borderColor: '#F3F4F6'
    },
    writtenLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
    writtenText: { fontSize: 14, color: '#1F2937', lineHeight: 20 },
    attachmentLink: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        padding: 12, borderRadius: 12, backgroundColor: '#EEF2FF',
        borderWidth: 1, borderColor: '#C7D2FE'
    },
    attachmentText: { fontSize: 13, fontWeight: '600', color: '#4F46E5', textDecorationLine: 'underline' },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
    input: {
        borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB',
        paddingVertical: 10, paddingHorizontal: 14, fontSize: 15, color: '#111827',
        backgroundColor: '#F9FAFB'
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, borderRadius: 12, backgroundColor: '#4F46E5',
        shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
        gap: 8, marginTop: 12
    },
    submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    disabledBtn: { opacity: 0.6 }
});

export default CommunityExamGrading;
