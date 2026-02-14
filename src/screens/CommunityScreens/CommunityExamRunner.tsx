import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get, post } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSound } from 'react-native-nitro-sound';
import { uploadAudioToCloudinary } from '../../utils/audioUpload';
import { PermissionsAndroid } from 'react-native';

const CommunityExamRunner = ({ route, navigation }: any) => {
    const { courseId, examId, examType } = route.params;
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [exam, setExam] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    // Listening exam audio recording state
    const [recording, setRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [audioPath, setAudioPath] = useState<string | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(false);

    const {
        startRecorder,
        stopRecorder,
        pauseRecorder,
        resumeRecorder,
        startPlayer,
        stopPlayer,
        state: soundState
    } = useSound({
        onRecord: (e) => {
            // recordSecs returns milliseconds, so we convert to seconds
            setRecordingDuration(Math.floor((e.recordSecs || 0) / 1000));
        },
        onPlaybackEnd: () => {
            setIsPlaying(false);
        }
    });

    useEffect(() => {
        fetchExam();
    }, [examId]);

    const fetchExam = async () => {
        try {
            setLoading(true);
            const res = await get<any>(`/exams/${examId}`);
            if (res.success) {
                setExam(res.data);
            } else {
                Alert.alert('Error', 'Failed to load exam details');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Fetch exam error:', error);
            Alert.alert('Error', 'Failed to load exam. Please try again.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (qIdx: number, option: string) => {
        setAnswers(prev => ({ ...prev, [qIdx]: option }));
    };

    const handleTextAnswer = (qIdx: number, text: string) => {
        setAnswers(prev => ({ ...prev, [qIdx]: text }));
    };

    // --- Audio Features ---

    const requestMicPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'FlyBook needs access to your microphone to record exam answers.',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                return false;
            }
        }
        return true;
    };

    const handleStartRecording = async () => {
        const hasPermission = await requestMicPermission();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Microphone permission is required for listening exams.');
            return;
        }

        try {
            const path = await startRecorder();
            setAudioPath(path);
            setRecording(true);
            setIsPaused(false);
            setRecordingDuration(0);
        } catch (error) {
            console.error('Start Recording Error:', error);
            Alert.alert('Error', 'Failed to start recording');
        }
    };

    const handlePauseRecording = async () => {
        try {
            await pauseRecorder();
            setIsPaused(true);
        } catch (error) {
            console.error('Pause Error:', error);
        }
    };

    const handleResumeRecording = async () => {
        try {
            await resumeRecorder();
            setIsPaused(false);
        } catch (error) {
            console.error('Resume Error:', error);
        }
    };

    const handleStopRecording = async () => {
        try {
            const path = await stopRecorder();
            setRecording(false);
            setIsPaused(false);
            if (path) {
                setAudioPath(path);
                // Auto upload
                handleUploadAudio(path);
            }
        } catch (error) {
            console.error('Stop Recording Error:', error);
        }
    };

    const handleUploadAudio = async (path: string) => {
        try {
            setUploadingAudio(true);
            const url = await uploadAudioToCloudinary(path);
            setAudioUrl(url);
            console.log('✅ Cloudinary Audio URL:', url); // Debug log
        } catch (error) {
            Alert.alert('Upload Failed', 'Could not upload your recording. Please try again.');
        } finally {
            setUploadingAudio(false);
        }
    };

    const handlePlayAudio = async () => {
        if (!audioPath || recording) return;
        try {
            if (isPlaying) {
                await stopPlayer();
                setIsPlaying(false);
            } else {
                // For Android, ensure path has file:// prefix if it's a local path
                const playPath = Platform.OS === 'android' && !audioPath.startsWith('http') && !audioPath.startsWith('file://')
                    ? `file://${audioPath}`
                    : audioPath;

                await startPlayer(playPath);
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Playback Error:', error);
            // If local playback fails, try using the uploaded URL if available
            if (audioUrl && !isPlaying) {
                try {
                    await startPlayer(audioUrl);
                    setIsPlaying(true);
                } catch (e) {
                    console.error('Network Playback Error:', e);
                }
            }
        }
    };

    const handleDeleteAudio = () => {
        Alert.alert('Reset Recording', 'Are you sure you want to delete this recording and start over?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setAudioPath(null);
                    setAudioUrl('');
                    setRecordingDuration(0);
                }
            }
        ]);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- End Audio Features ---

    const handleSubmit = async () => {
        // Validate
        if (!exam) return;
        const totalQuestions = exam.questions?.length || 0;
        const answeredCount = Object.keys(answers).length;

        if (answeredCount < totalQuestions) {
            Alert.alert(
                'Incomplete',
                `You have answered ${answeredCount} of ${totalQuestions} questions. Are you sure you want to submit?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Submit', style: 'destructive', onPress: submitExam }
                ]
            );
        } else {
            submitExam();
        }
    };

    const submitExam = async () => {
        if (!exam) return;

        // Validation for listening/speaking exam
        if ((exam.type === 'listening' || exam.type === 'speaking') && !audioUrl) {
            Alert.alert('Wait', 'Please record and upload your audio answer before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            const payload: any = {
                answers: Object.entries(answers).map(([idx, ans]) => ({
                    questionIndex: Number(idx),
                    answer: ans
                })),
                proctoring: {
                    startedAt: Date.now(),
                    endedAt: Date.now(),
                    violations: [],
                    totals: { noFace: 0, multiFace: 0, speech: 0, tab: 0 },
                    blockedSubmission: false
                }
            };

            // Add audioUrl if it's a listening or speaking exam
            if (exam.type === 'listening' || exam.type === 'speaking') {
                payload.audioUrl = audioUrl;
            }

            const res = await post<any>(`/exams/${exam.examId}/attempt`, payload);

            if (res.success) {
                if (exam.type === 'quiz') {
                    const { score, passed } = res;
                    Alert.alert(
                        passed ? 'Passed! 🎉' : 'Failed',
                        `You scored ${score}%. ${passed ? 'Congratulations!' : 'Please try again.'}`,
                        [{ text: 'OK', onPress: () => navigation.goBack() }]
                    );
                } else {
                    Alert.alert(
                        'Submitted',
                        'Your exam has been submitted successfully and is pending grading.',
                        [{ text: 'OK', onPress: () => navigation.goBack() }]
                    );
                }
            } else {
                Alert.alert('Error', res.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Submit exam error:', error);
            Alert.alert('Error', 'Failed to submit exam. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading Exam...</Text>
            </View>
        );
    }

    if (!exam) return null;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {exam.type === 'quiz' ? 'Quiz' :
                        exam.type === 'written' ? 'Written Exam' :
                            exam.type === 'speaking' ? 'Speaking Exam' :
                                exam.type === 'listening' ? 'Listening Exam' : 'Exam'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.examInfo}>
                        <Text style={styles.examTitle}>Passing Score: {exam.passingScore}%</Text>
                        <Text style={styles.questionCount}>{exam.questions?.length || 0} Questions</Text>
                    </View>

                    {(exam.type === 'listening' || exam.type === 'speaking') ? (
                        <View style={styles.listeningContainer}>
                            <View style={styles.recordingCard}>
                                <Ionicons name="mic-circle" size={64} color={recording ? "#EF4444" : "#4F46E5"} />
                                <Text style={styles.recordingTitle}>Listening Response</Text>

                                {audioUrl ? (
                                    <View style={styles.successBadge}>
                                        <Ionicons name="cloud-done" size={16} color="#10B981" />
                                        <Text style={styles.successText}>Audio Uploaded</Text>
                                    </View>
                                ) : uploadingAudio ? (
                                    <View style={styles.uploadingBadge}>
                                        <ActivityIndicator size="small" color="#4F46E5" />
                                        <Text style={styles.uploadingText}>Uploading...</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.recordingSubtitle}>
                                        {recording ? 'Recording in progress...' : 'Press the button below to start'}
                                    </Text>
                                )}

                                <Text style={styles.timerText}>{formatDuration(recordingDuration)}</Text>

                                <View style={styles.recordingActions}>
                                    {!audioPath || recording ? (
                                        <View style={styles.recordingControlsRow}>
                                            <TouchableOpacity
                                                style={[styles.recordBtn, recording && !isPaused ? styles.stopBtnActive : {}]}
                                                onPress={recording ? handleStopRecording : handleStartRecording}
                                            >
                                                <Ionicons name={recording ? "stop" : "mic"} size={24} color="#FFFFFF" />
                                                <Text style={styles.recordBtnText}>{recording ? "Stop" : "Start"}</Text>
                                            </TouchableOpacity>

                                            {recording && (
                                                <TouchableOpacity
                                                    style={styles.pauseBtn}
                                                    onPress={isPaused ? handleResumeRecording : handlePauseRecording}
                                                >
                                                    <Ionicons name={isPaused ? "play" : "pause"} size={24} color="#4F46E5" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ) : (
                                        <View style={styles.playbackActions}>
                                            <TouchableOpacity style={styles.playBtn} onPress={handlePlayAudio}>
                                                <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#FFFFFF" />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAudio}>
                                                <Ionicons name="trash" size={24} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Optional text questions if any */}
                            {exam.questions?.length > 0 && (
                                <View style={styles.questionsList}>
                                    {exam.questions.map((q: any, idx: number) => (
                                        <View key={idx} style={styles.questionCard}>
                                            <Text style={styles.questionText}>{q.question}</Text>
                                            <TextInput
                                                style={styles.textArea}
                                                multiline
                                                numberOfLines={3}
                                                placeholder="Additional notes (optional)..."
                                                value={answers[idx] || ''}
                                                onChangeText={(text) => handleTextAnswer(idx, text)}
                                            />
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.questionsList}>
                            {exam.questions?.map((q: any, idx: number) => (
                                <View key={idx} style={styles.questionCard}>
                                    <View style={styles.questionHeader}>
                                        <Text style={styles.questionNumber}>Q{idx + 1}</Text>
                                        <Text style={styles.questionText}>{q.question}</Text>
                                    </View>

                                    {exam.type === 'quiz' ? (
                                        <View style={styles.optionsList}>
                                            {q.options?.map((opt: string, oIdx: number) => {
                                                const isSelected = answers[idx] === opt;
                                                return (
                                                    <TouchableOpacity
                                                        key={oIdx}
                                                        style={[
                                                            styles.optionBtn,
                                                            isSelected && styles.optionBtnSelected
                                                        ]}
                                                        onPress={() => handleOptionSelect(idx, opt)}
                                                    >
                                                        <View style={[
                                                            styles.radioCircle,
                                                            isSelected && styles.radioCircleSelected
                                                        ]}>
                                                            {isSelected && <View style={styles.radioInner} />}
                                                        </View>
                                                        <Text style={[
                                                            styles.optionText,
                                                            isSelected && styles.optionTextSelected
                                                        ]}>{opt}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    ) : (
                                        <View style={styles.writtenInputContainer}>
                                            <TextInput
                                                style={styles.textArea}
                                                multiline
                                                numberOfLines={4}
                                                placeholder="Write your answer here..."
                                                placeholderTextColor="#9CA3AF"
                                                value={answers[idx] || ''}
                                                onChangeText={(text) => handleTextAnswer(idx, text)}
                                            />
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>

                {/* Footer */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                    <TouchableOpacity
                        style={[
                            styles.submitBtn,
                            ((exam.type === 'listening' || exam.type === 'speaking') && (!audioUrl || uploadingAudio)) && styles.submitBtnDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={submitting || ((exam.type === 'listening' || exam.type === 'speaking') && uploadingAudio)}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitBtnText}>Submit Exam</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: { marginTop: 10, color: '#6B7280' },
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
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    backBtn: { padding: 4 },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    examInfo: {
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        padding: 16,
        borderRadius: 12,
    },
    examTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
    questionCount: {
        fontSize: 14,
        color: '#6B7280',
    },
    questionsList: {
        gap: 20,
    },
    questionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    questionHeader: {
        marginBottom: 16,
    },
    questionNumber: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4F46E5',
        marginBottom: 4,
        backgroundColor: '#EEF2FF',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        lineHeight: 24,
    },
    optionsList: {
        gap: 12,
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
    },
    optionBtnSelected: {
        borderColor: '#4F46E5',
        backgroundColor: '#EEF2FF',
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#9CA3AF',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleSelected: {
        borderColor: '#4F46E5',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4F46E5',
    },
    optionText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
    optionTextSelected: {
        color: '#1F2937',
        fontWeight: '500',
    },
    writtenInputContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    textArea: {
        padding: 12,
        minHeight: 120,
        textAlignVertical: 'top',
        color: '#1F2937',
        fontSize: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    submitBtn: {
        backgroundColor: '#4F46E5',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    warningText: {
        flex: 1,
        color: '#92400E',
        fontSize: 14,
    },
    submitBtnDisabled: {
        backgroundColor: '#9CA3AF',
    },
    // Listening Exam styles
    listeningContainer: {
        paddingBottom: 20,
    },
    recordingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    recordingTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 12,
    },
    recordingSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    timerText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#4F46E5',
        marginVertical: 20,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    recordingActions: {
        width: '100%',
        alignItems: 'center',
    },
    recordingControlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    recordBtn: {
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 30,
        gap: 8,
    },
    pauseBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4F46E5',
    },
    stopBtnActive: {
        backgroundColor: '#EF4444',
    },
    recordBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    playbackActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    playBtn: {
        backgroundColor: '#10B981',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteBtn: {
        backgroundColor: '#FEE2E2',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
        gap: 6,
    },
    uploadingText: {
        fontSize: 12,
        color: '#4F46E5',
        fontWeight: '500',
    },
    successBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
        gap: 6,
    },
    successText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '500',
    },
});

export default CommunityExamRunner;
