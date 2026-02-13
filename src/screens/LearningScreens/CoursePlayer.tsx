import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Platform,
    Linking,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VideoPlayer from 'react-native-video';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width } = Dimensions.get('window');

const extractYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

interface Video {
    videoTitle: string;
    videoDescription: string;
    videoUrl: string;
    videoType: string;
    videoDuration: string;
}

interface Course {
    _id: string;
    title: string;
    videos: Video[];
}

const fetchCoursePlayer = async (courseId: string): Promise<Course> => {
    const response = await get<Course>(`/api/courses/${courseId}`);
    return response;
};

const CoursePlayer = ({ route, navigation }: any) => {
    const { courseId, initialIndex = 0 } = route.params;
    const insets = useSafeAreaInsets();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const [isBuffering, setIsBuffering] = useState(false);

    const { data: course, isLoading } = useQuery({
        queryKey: ['course-player', courseId],
        queryFn: () => fetchCoursePlayer(courseId),
    });

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Preparing your lesson...</Text>
            </View>
        );
    }

    if (!course || !course.videos) return null;

    const currentVideo = course.videos[currentIndex];
    const youtubeId = extractYouTubeId(currentVideo.videoUrl);

    // Fix for Cloudinary/Direct links that might be in .webm (not supported by iOS)
    let videoUrl = currentVideo.videoUrl;
    if (videoUrl && videoUrl.toLowerCase().endsWith('.webm')) {
        videoUrl = videoUrl.replace(/\.webm$/i, '.mp4');
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{course.title}</Text>
                    <Text style={styles.headerSubtitle}>Lesson {currentIndex + 1} of {course.videos.length}</Text>
                </View>
            </View>

            {/* Video Player */}
            <View style={styles.playerContainer}>
                {youtubeId ? (
                    <YoutubePlayer
                        height={220}
                        play={true}
                        videoId={youtubeId}
                        onChangeState={(state: string) => {
                            if (state === 'ended') {
                                if (currentIndex < course.videos.length - 1) {
                                    setCurrentIndex(currentIndex + 1);
                                }
                            }
                        }}
                    />
                ) : (
                    <>
                        <VideoPlayer
                            source={{ uri: videoUrl }}
                            style={styles.videoPlayer}
                            controls={true}
                            resizeMode="contain"
                            onLoadStart={() => setIsBuffering(true)}
                            onLoad={() => setIsBuffering(false)}
                            onError={(error) => console.log('Video Error:', error)}
                        />
                        {isBuffering && (
                            <View style={styles.loaderOverlay}>
                                <ActivityIndicator size="large" color="#3B82F6" />
                            </View>
                        )}
                    </>
                )}
            </View>

            {/* Lesson Info */}
            <View style={styles.lessonInfoSection}>
                <View style={styles.lessonHeader}>
                    <Text style={styles.lessonTitle}>{currentVideo.videoTitle}</Text>
                    <View style={styles.durationBadge}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.durationText}>{currentVideo.videoDuration}</Text>
                    </View>
                </View>
                <ScrollView style={styles.descriptionScroll}>
                    <Text style={styles.descriptionText}>{currentVideo.videoDescription}</Text>
                </ScrollView>
            </View>

            {/* Curriculum List */}
            <View style={styles.curriculumSection}>
                <View style={styles.curriculumHeader}>
                    <Text style={styles.curriculumTitle}>Course Content</Text>
                    <Text style={styles.curriculumProgress}>{currentIndex + 1}/{course.videos.length} Completed</Text>
                </View>

                <ScrollView contentContainerStyle={styles.listContent}>
                    {course.videos.map((video, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.lessonRow,
                                currentIndex === index && styles.activeLessonRow
                            ]}
                            onPress={() => setCurrentIndex(index)}
                        >
                            <View style={[
                                styles.indexBox,
                                currentIndex === index && styles.activeIndexBox
                            ]}>
                                {currentIndex > index ? (
                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                ) : (
                                    <Text style={[
                                        styles.indexText,
                                        currentIndex === index && styles.activeIndexText
                                    ]}>{index + 1}</Text>
                                )}
                            </View>
                            <View style={styles.lessonRowInfo}>
                                <Text style={[
                                    styles.lessonRowTitle,
                                    currentIndex === index && styles.activeLessonRowTitle
                                ]} numberOfLines={1}>{video.videoTitle}</Text>
                                <Text style={styles.lessonRowMeta}>{video.videoDuration}</Text>
                            </View>
                            {currentIndex === index && (
                                <View style={styles.playingIndicator}>
                                    <Text style={styles.playingText}>Playing</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Navigation Buttons */}
            <View style={[styles.navigationBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={[styles.navBtn, currentIndex === 0 && styles.disabledBtn]}
                    onPress={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                    disabled={currentIndex === 0}
                >
                    <Ionicons name="arrow-back" size={20} color={currentIndex === 0 ? "#9CA3AF" : "#3B82F6"} />
                    <Text style={[styles.navBtnText, currentIndex === 0 && styles.disabledBtnText]}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.navBtn, styles.nextBtn, currentIndex === course.videos.length - 1 && styles.finishBtn]}
                    onPress={() => {
                        if (currentIndex < course.videos.length - 1) {
                            setCurrentIndex(currentIndex + 1);
                        } else {
                            navigation.goBack();
                        }
                    }}
                >
                    <Text style={styles.nextBtnText}>{currentIndex === course.videos.length - 1 ? 'Finish' : 'Next Lesson'}</Text>
                    <Ionicons
                        name={currentIndex === course.videos.length - 1 ? "checkmark-done" : "arrow-forward"}
                        size={20}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>
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
        paddingHorizontal: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        padding: 5,
    },
    headerTitleContainer: {
        marginLeft: 15,
        flex: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    playerContainer: {
        width: '100%',
        height: 220,
        backgroundColor: '#000',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoPlayer: {
        width: '100%',
        height: '100%',
    },
    loaderOverlay: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        width: '100%',
        height: '100%',
    },
    lessonInfoSection: {
        padding: 20,
        height: 140,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    lessonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    lessonTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
        marginRight: 10,
    },
    durationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    durationText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
        fontWeight: '500',
    },
    descriptionScroll: {
        flex: 1,
    },
    descriptionText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    curriculumSection: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    curriculumHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    curriculumTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    curriculumProgress: {
        fontSize: 12,
        color: '#6B7280',
    },
    listContent: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    lessonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeLessonRow: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    indexBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    activeIndexBox: {
        backgroundColor: '#3B82F6',
    },
    indexText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6B7280',
    },
    activeIndexText: {
        color: '#FFFFFF',
    },
    lessonRowInfo: {
        flex: 1,
    },
    lessonRowTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    activeLessonRowTitle: {
        color: '#1E40AF',
    },
    lessonRowMeta: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    playingIndicator: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    playingText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    navigationBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    navBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 10,
    },
    navBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
        marginLeft: 8,
    },
    nextBtn: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        marginRight: 0,
        marginLeft: 10,
    },
    nextBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginRight: 8,
    },
    finishBtn: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    disabledBtn: {
        borderColor: '#F3F4F6',
    },
    disabledBtnText: {
        color: '#9CA3AF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 15,
        color: '#6B7280',
    },
});

export default CoursePlayer;
