import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSound } from 'react-native-nitro-sound';
import { post } from '../../services/api';

const CommunityExamGrading = ({ route, navigation }: any) => {
    const { attempt, studentName } = route.params;
    const insets = useSafeAreaInsets();

    const [score, setScore] = useState(attempt.score?.toString() || '');
    const [feedback, setFeedback] = useState(attempt.feedback || '');
    const [submitting, setSubmitting] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const { startPlayer, stopPlayer } = useSound({
        onPlaybackEnd: () => setIsPlaying(false)
    });

    const handlePlayAudio = async () => {
        if (!attempt.audioUrl) return;
        try {
            if (isPlaying) {
                await stopPlayer();
                setIsPlaying(false);
            } else {
                await startPlayer(attempt.audioUrl);
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Playback Error:', error);
            Alert.alert('Error', 'Failed to play audio');
        }
    };

    const handleSubmitGrade = async () => {
        if (!score || isNaN(Number(score))) {
            Alert.alert('Invalid Score', 'Please enter a valid numeric score (0-100)');
            return;
        }

        const numScore = Number(score);
        if (numScore < 0 || numScore > 100) {
            Alert.alert('Invalid Score', 'Score must be between 0 and 100');
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
                Alert.alert('Success', 'Exam graded successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert('Error', res.message || 'Failed to submit grade');
            }
        } catch (error) {
            console.error('Grading Error:', error);
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Grade Exam</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.studentInfoCard}>
                        <Text style={styles.label}>Student</Text>
                        <Text style={styles.studentName}>{studentName}</Text>
                        <View style={styles.divider} />
                        <Text style={styles.label}>Exam Type</Text>
                        <Text style={styles.examType}>{attempt.type?.toUpperCase()}</Text>
                    </View>

                    {attempt.audioUrl && (
                        <View style={styles.audioCard}>
                            <Text style={styles.cardTitle}>Audio Response</Text>
                            <TouchableOpacity style={styles.playBtn} onPress={handlePlayAudio}>
                                <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#FFFFFF" />
                                <Text style={styles.playBtnText}>{isPlaying ? "Stop" : "Play Recording"}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {attempt.answers && attempt.answers.length > 0 && (
                        <View style={styles.answersCard}>
                            <Text style={styles.cardTitle}>Additional Answers</Text>
                            {attempt.answers.map((ans: any, idx: number) => (
                                <View key={idx} style={styles.answerItem}>
                                    <Text style={styles.questionNum}>Question {ans.questionIndex + 1}</Text>
                                    <Text style={styles.answerText}>{ans.answer || '(No answer provided)'}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.gradingForm}>
                        <Text style={styles.formLabel}>Score (0-100)</Text>
                        <TextInput
                            style={styles.scoreInput}
                            placeholder="75"
                            keyboardType="numeric"
                            value={score}
                            onChangeText={setScore}
                        />

                        <Text style={styles.formLabel}>Feedback (Optional)</Text>
                        <TextInput
                            style={styles.feedbackInput}
                            placeholder="Great job! Your pronunciation is improving."
                            multiline
                            numberOfLines={4}
                            value={feedback}
                            onChangeText={setFeedback}
                        />
                    </View>
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && styles.disabledBtn]}
                        onPress={handleSubmitGrade}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitBtnText}>Submit Grade</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
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
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    scrollContent: {
        padding: 16,
    },
    studentInfoCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    label: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    studentName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    examType: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    audioCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    playBtn: {
        backgroundColor: '#10B981',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        gap: 10,
    },
    playBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    answersCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    answerItem: {
        marginBottom: 12,
    },
    questionNum: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    answerText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    gradingForm: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    scoreInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
        marginBottom: 16,
    },
    feedbackInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#111827',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    footer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    submitBtn: {
        backgroundColor: '#4F46E5',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    disabledBtn: {
        backgroundColor: '#9CA3AF',
    }
});

export default CommunityExamGrading;
