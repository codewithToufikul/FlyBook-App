import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    Linking,
    Alert,
    Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import YoutubePlayer from 'react-native-youtube-iframe';
import { get, post } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CommunityCourseDetails = ({ route, navigation }: any) => {
    const { courseId } = route.params;
    const insets = useSafeAreaInsets();

    // State
    const [loading, setLoading] = useState(true);
    const [outline, setOutline] = useState<any>(null);
    const [progress, setProgress] = useState<any>({ completedLessons: [], attempts: [] });
    // active: { chapterIdx, lessonIdx }
    const [active, setActive] = useState<{ chapterIdx: number, lessonIdx: number }>({ chapterIdx: 0, lessonIdx: 0 });
    const [refreshing, setRefreshing] = useState(false);

    // Player State
    const [playing, setPlaying] = useState(false);

    // Fetch Data
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [outlineRes, progressRes] = await Promise.all([
                get<any>(`/courses/${courseId}/outline`),
                get<any>(`/courses/${courseId}/progress`)
            ]);

            // Handle different potential response structures
            const outlineData = outlineRes.data?.data || outlineRes.data || {};
            const progressData = progressRes.data?.data || progressRes.data || { completedLessons: [], attempts: [] };

            setOutline(outlineData);
            setProgress(progressData);

            // Initial Active Lesson Logic (find first uncompleted)
            if (outlineData.chapters || outlineData.outline) {
                const chapters = outlineData.chapters || outlineData.outline || [];
                const compl = new Set((progressData.completedLessons || []).map((x: any) => x.toString()));
                let found: { chapterIdx: number, lessonIdx: number } | null = null;

                // Try to find first uncompleted lesson
                chapters.forEach((ch: any, ci: number) => {
                    const lessons = ch.lessons || ch.videos || []; // Fallback for diff structures
                    lessons.forEach((l: any, li: number) => {
                        // Lesson ID might be different depending on backend mapping
                        const lid = l.lessonId || l._id || l;
                        if (!found && !compl.has(lid.toString())) {
                            found = { chapterIdx: ci, lessonIdx: li };
                        }
                    });
                });

                if (found) {
                    setActive(found);
                }
            }
        } catch (error) {
            console.error('Failed to load course details:', error);
            Alert.alert('Error', 'Failed to load course content');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [courseId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Helpers
    const getOutlineChapters = () => outline?.chapters || outline?.outline || [];

    const isLessonCompleted = (lessonId: string) => {
        const ids = (progress.completedLessons || []).map((x: any) => x.toString());
        return ids.includes(lessonId.toString());
    };

    const getLatestAttemptPassed = (examId: string) => {
        const attempts = progress.attempts || [];
        const relevant = attempts.filter((a: any) => {
            const attemptExamId = a.examId?.toString() || a.exam?.toString();
            return attemptExamId === examId.toString();
        });
        if (relevant.length === 0) return false;
        // Sort by date desc
        relevant.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latest = relevant[0];
        if (latest.graded === false) return false;
        return !!latest.passed;
    };

    const calculateProgress = () => {
        const chapters = getOutlineChapters();
        if (!chapters.length) return 0;

        const compl = new Set((progress.completedLessons || []).map((x: any) => x.toString()));
        let total = 0;
        let completed = 0;

        chapters.forEach((ch: any) => {
            const lessons = ch.lessons || ch.videos || [];
            lessons.forEach((l: any) => {
                total++;
                const lid = l.lessonId || l._id || l;
                if (compl.has(lid.toString())) completed++;
            });
        });
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    // Actions
    const handleCompleteLesson = async (lessonId: string) => {
        try {
            await post(`/courses/${courseId}/lessons/${lessonId}/complete`, {});
            // Optimistic update
            setProgress((prev: any) => ({
                ...prev,
                completedLessons: [...(prev.completedLessons || []), lessonId]
            }));
            // Reload to sync
            // loadData(); 
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to mark complete');
        }
    };

    const goNext = () => {
        const chapters = getOutlineChapters();
        const { chapterIdx, lessonIdx } = active;
        const ch = chapters[chapterIdx];
        if (!ch) return;

        const lessons = ch.lessons || ch.videos || [];
        const currentLesson = lessons[lessonIdx];
        const currentLessonId = currentLesson?.lessonId || currentLesson?._id;

        if (currentLessonId && !isLessonCompleted(currentLessonId)) {
            Alert.alert('Info', 'Mark this lesson complete first');
            return;
        }

        if (lessonIdx + 1 < lessons.length) {
            setActive({ chapterIdx, lessonIdx: lessonIdx + 1 });
            return;
        }

        // Check if all lessons done in chapter
        const allLessonsDone = lessons.every((l: any) => isLessonCompleted(l.lessonId || l._id));

        if (ch.exam && allLessonsDone) {
            // Check if passed
            const passed = getLatestAttemptPassed(ch.exam.examId || ch.exam._id);
            if (!passed) {
                // Open Exam Modal
                navigation.navigate('CommunityExamRunner', {
                    courseId,
                    examId: ch.exam.examId || ch.exam._id,
                    examType: ch.exam.type
                });
                return;
            }
        }

        if (chapterIdx + 1 < chapters.length) {
            setActive({ chapterIdx: chapterIdx + 1, lessonIdx: 0 });
            return;
        }

        Alert.alert('Congratulations', 'Course content completed!');
    };

    const requestCertificate = async () => {
        const percent = calculateProgress();
        // Check exams logic if needed, simplifed here check percent
        if (percent < 100) {
            Alert.alert('Locked', 'Complete all lessons and pass all exams first.');
            return;
        }

        try {
            const res = await post<any>(`/courses/${courseId}/certificate`, {});
            if (res.success) {
                const url = res.certificateUrl;
                Alert.alert('Certificate Issued', `Certificate ID: ${res.certificateNumber}`, [
                    { text: 'View', onPress: () => url && Linking.openURL(url) },
                    { text: 'OK' }
                ]);
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Certificate request failed');
        }
    };

    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url?.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Render Logic
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading course...</Text>
            </View>
        );
    }

    // Determine current active content
    const chapters = getOutlineChapters();
    const activeChapter = chapters[active.chapterIdx];
    const lessons = activeChapter?.lessons || activeChapter?.videos || [];
    const activeLessonData = lessons[active.lessonIdx];

    const progressPercent = calculateProgress();
    const activeLessonId = activeLessonData?.lessonId || activeLessonData?._id;
    const isCompleted = activeLessonId ? isLessonCompleted(activeLessonId) : false;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header / Nav */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{outline?.title || 'Course'}</Text>
                <TouchableOpacity onPress={requestCertificate}>
                    <Ionicons name="ribbon-outline" size={24} color={progressPercent === 100 ? "#059669" : "#9CA3AF"} />
                </TouchableOpacity>
            </View>

            {/* Video Player Area */}
            <View style={styles.playerContainer}>
                {activeLessonData ? (
                    <>
                        {(() => {
                            const url = activeLessonData.videoUrl;
                            const ytId = getYoutubeId(url);

                            if (ytId) {
                                return (
                                    <YoutubePlayer
                                        height={width * 0.56}
                                        play={playing}
                                        videoId={ytId}
                                        onChangeState={(state: string) => {
                                            if (state === 'ended') setPlaying(false);
                                        }}
                                    />
                                );
                            } else if (url && (url.includes('vimeo.com') || url.includes('player.vimeo.com'))) {
                                // Handle Vimeo embed
                                const embedUrl = url.includes('player.vimeo.com')
                                    ? url
                                    : url.replace('vimeo.com/', 'player.vimeo.com/video/');
                                return (
                                    <View style={{ width: '100%', aspectRatio: 16 / 9 }}>
                                        <WebView
                                            source={{ uri: embedUrl }}
                                            allowsFullscreenVideo
                                            scrollEnabled={false}
                                            style={{ flex: 1 }}
                                        />
                                    </View>
                                );
                            } else if (url) {
                                return (
                                    <Video
                                        source={{ uri: url }}
                                        style={{ width: '100%', aspectRatio: 16 / 9 }}
                                        controls={true}
                                        resizeMode="contain"
                                        paused={!playing}
                                    />
                                );
                            } else {
                                return (
                                    <View style={styles.noVideoPlaceholder}>
                                        <Text style={styles.noVideoText}>No video available for this lesson</Text>
                                    </View>
                                );
                            }
                        })()}

                        {/* Playback Controls */}
                        <View style={styles.playerControls}>
                            <View>
                                <Text style={styles.lessonMeta}>Chapter {active.chapterIdx + 1} • Lesson {active.lessonIdx + 1}</Text>
                                <Text style={styles.lessonTitle}>{activeLessonData.title || `Lesson ${active.lessonIdx + 1}`}</Text>
                            </View>

                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, isCompleted ? styles.completedBtn : styles.markBtn]}
                                    onPress={() => handleCompleteLesson(activeLessonId)}
                                    disabled={isCompleted}
                                >
                                    <Ionicons name={isCompleted ? "checkmark-circle" : "checkmark-circle-outline"} size={20} color="#FFFFFF" />
                                    <Text style={styles.actionBtnText}>{isCompleted ? "Completed" : "Mark Done"}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
                                    <Text style={styles.nextBtnText}>Next</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                ) : (
                    <View style={styles.noContentPlaceholder}>
                        <Text style={styles.noContentText}>Select a lesson to start learning</Text>
                        <Text style={styles.progressText}>Course Progress: {progressPercent}%</Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                        </View>
                    </View>
                )}
            </View>

            {/* Syllabus List */}
            <ScrollView style={styles.syllabusContainer}>
                <Text style={styles.sectionHeader}>Course Content</Text>
                {chapters.map((ch: any, cIdx: number) => {
                    const chLessons = ch.lessons || ch.videos || [];
                    const isActiveChapter = active.chapterIdx === cIdx;

                    return (
                        <View key={cIdx} style={styles.chapterCard}>
                            <View style={styles.chapterHeader}>
                                <Text style={styles.chapterTitle}>{ch.title}</Text>
                                <Text style={styles.chapterMeta}>{chLessons.length} Lessons</Text>
                            </View>

                            <View style={styles.lessonList}>
                                {chLessons.map((l: any, lIdx: number) => {
                                    const lid = l.lessonId || l._id || l;
                                    const isDone = isLessonCompleted(lid);
                                    const isActive = isActiveChapter && active.lessonIdx === lIdx;

                                    return (
                                        <TouchableOpacity
                                            key={lIdx}
                                            style={[styles.lessonRow, isActive && styles.activeLessonRow]}
                                            onPress={() => setActive({ chapterIdx: cIdx, lessonIdx: lIdx })}
                                        >
                                            <Ionicons
                                                name={isDone ? "checkmark-circle" : (isActive ? "play-circle" : "play-circle-outline")}
                                                size={20}
                                                color={isDone ? "#059669" : (isActive ? "#4F46E5" : "#9CA3AF")}
                                            />
                                            <Text
                                                style={[styles.lessonRowTitle, isActive && styles.activeLessonTitle]}
                                                numberOfLines={1}
                                            >
                                                {l.title || `Lesson ${lIdx + 1}`}
                                            </Text>
                                            {isActive && <View style={styles.playingIndicator} />}
                                        </TouchableOpacity>
                                    );
                                })}

                                {/* Exam in Chapter */}
                                {ch.exam && (
                                    <View style={styles.examRow}>
                                        {(() => {
                                            const passed = getLatestAttemptPassed(ch.exam.examId || ch.exam._id);
                                            return (
                                                <TouchableOpacity
                                                    style={styles.examBtn}
                                                    onPress={() => navigation.navigate('CommunityExamRunner', {
                                                        courseId,
                                                        examId: ch.exam.examId || ch.exam._id,
                                                        examType: ch.exam.type
                                                    })}
                                                >
                                                    <Ionicons name="document-text" size={18} color="#D97706" />
                                                    <Text style={styles.examText}>
                                                        {ch.exam.type === 'quiz' ? 'Quiz' : 'Exam'}
                                                    </Text>
                                                    {passed && <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginLeft: 'auto' }} />}
                                                </TouchableOpacity>
                                            );
                                        })()}
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
        </View >
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
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
        textAlign: 'center',
    },
    backBtn: { padding: 4 },
    playerContainer: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    noVideoPlaceholder: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#1F2937',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noVideoText: { color: '#9CA3AF' },
    noContentPlaceholder: {
        padding: 24,
        alignItems: 'center',
    },
    noContentText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    progressText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    progressBarBg: {
        width: '100%',
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4F46E5',
        borderRadius: 4,
    },
    playerControls: {
        padding: 16,
    },
    lessonMeta: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    lessonTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6,
        flex: 1,
        justifyContent: 'center',
    },
    markBtn: { backgroundColor: '#1F2937' },
    completedBtn: { backgroundColor: '#E5E7EB' },
    actionBtnText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4F46E5',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6,
        flex: 1,
        justifyContent: 'center',
    },
    nextBtnText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    syllabusContainer: {
        flex: 1,
        padding: 16,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    chapterCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chapterHeader: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chapterTitle: {
        fontWeight: '700',
        color: '#374151',
        fontSize: 14,
    },
    chapterMeta: {
        fontSize: 12,
        color: '#6B7280',
    },
    lessonList: {
        // paddingVertical: 4,
    },
    lessonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 10,
    },
    activeLessonRow: {
        backgroundColor: '#EEF2FF',
    },
    lessonRowTitle: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
    },
    activeLessonTitle: {
        color: '#4F46E5',
        fontWeight: '600',
    },
    playingIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4F46E5',
    },
    examRow: {
        padding: 12,
        backgroundColor: '#FFFBEB',
    },
    examBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    examText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#92400E',
    },
});

export default CommunityCourseDetails;
