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
import { useTheme } from '../../contexts/ThemeContext';
import VideoPlayer from 'react-native-video';
import YoutubePlayer from 'react-native-youtube-iframe';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const extractYouTubeId = (url: string) => {
    if (!url) return null;

    // 1. Handle if it's an iframe tag (extract src)
    let cleanUrl = url;
    if (url.includes('<iframe')) {
        const srcMatch = url.match(/src="([^"]+)"/);
        if (srcMatch && srcMatch[1]) {
            cleanUrl = srcMatch[1];
        }
    }

    // 2. Extract ID from clean URL
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|youtube-nocookie\.com\/embed\/)([^#\&\?]*).*/;
    const match = cleanUrl.match(regExp);

    if (match && match[2] && match[2].length === 11) {
        return match[2];
    }

    // Fallback search for any 11 char string after 'embed/'
    if (cleanUrl.includes('embed/')) {
        const parts = cleanUrl.split('embed/');
        if (parts[1]) {
            const id = parts[1].substring(0, 11);
            if (id.length === 11) return id;
        }
    }

    return null;
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
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isBuffering, setIsBuffering] = useState(false);

    const { data: course, isLoading } = useQuery({
        queryKey: ['course-player', courseId],
        queryFn: () => fetchCoursePlayer(courseId),
    });

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={[styles.loadingText, isDark && { color: '#94A3B8' }]}>Preparing your lesson...</Text>
            </View>
        );
    }

    if (!course || !course.videos) return null;

    const currentVideo = course.videos[currentIndex];

    // Fix for Cloudinary/Direct links
    let videoUrl = currentVideo.videoUrl;
    if (videoUrl) {
        // .webm fix for iOS
        if (videoUrl.toLowerCase().endsWith('.webm')) {
            videoUrl = videoUrl.replace(/\.webm$/i, '.mp4');
        }
        // Force HTTPS for production links to prevent Android cleartext blocks
        if (videoUrl.startsWith('http://') && !videoUrl.includes('192.168.') && !videoUrl.includes('localhost') && !videoUrl.includes('10.0.2.2')) {
            videoUrl = videoUrl.replace('http://', 'https://');
        }
    }

    // Video logic "like web"
    const isYoutube = currentVideo.videoType === 'youtube' ||
        /youtube\.com|youtu\.be|youtube-nocookie\.com/.test(currentVideo.videoUrl || "");
    const youtubeId = isYoutube ? extractYouTubeId(currentVideo.videoUrl) : null;


    // Construct WebView HTML for native videos
    const videoHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <style>
                body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: black; overflow: hidden; display: flex; justify-content: center; align-items: center; }
                video { width: 100%; height: 100%; max-height: 100vh; object-fit: contain; }
            </style>
        </head>
        <body>
            <video id="player" src="${videoUrl}" controls playsinline autoplay></video>
            <script>
                const video = document.getElementById('player');
                video.onplay = () => window.ReactNativeWebView.postMessage('playing');
                video.onwaiting = () => window.ReactNativeWebView.postMessage('buffering');
                video.onplaying = () => window.ReactNativeWebView.postMessage('playing');
                video.onended = () => window.ReactNativeWebView.postMessage('ended');
                video.onerror = (e) => window.ReactNativeWebView.postMessage('error: ' + e);
            </script>
        </body>
        </html>
    `;

    return (
        <View style={[styles.container, isDark && styles.containerDark, { paddingTop: insets.top }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={[styles.header, isDark && { borderBottomColor: '#334155' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={isDark ? "#FFF" : "#1F2937"} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, isDark && styles.textLight]} numberOfLines={1}>{course.title}</Text>
                    <Text style={[styles.headerSubtitle, isDark && { color: '#64748B' }]}>Lesson {currentIndex + 1} of {course.videos.length}</Text>
                </View>
            </View>

            {/* Video Player Section */}
            <View style={styles.playerContainer}>
                {youtubeId ? (
                    <View style={styles.videoWrapper} key={`yt-${youtubeId}`}>
                        <YoutubePlayer
                            height={220}
                            width={width}
                            play={true}
                            videoId={youtubeId}
                            initialPlayerParams={{
                                preventFullScreen: false,
                                cc_load_policy: 0,
                                rel: 0,
                                controls: 1,
                                modestbranding: 1,
                            }}
                            webViewProps={{
                                androidLayerType: 'hardware',
                                opacity: 0.99, // Common fix for black screen in Android WebViews
                            }}
                            onChangeState={(state: string) => {
                                if (state === 'ended') {
                                    if (currentIndex < course.videos.length - 1) {
                                        setCurrentIndex(currentIndex + 1);
                                    }
                                }
                                if (state === 'buffering' || state === 'unstarted') setIsBuffering(true);
                                else setIsBuffering(false);
                            }}
                            onReady={() => {
                                setIsBuffering(false);
                            }}
                            onError={() => {
                                setIsBuffering(false);
                            }}
                        />
                    </View>
                ) : (
                    <View style={styles.videoWrapper} key={`dir-${currentIndex}`}>
                        <VideoPlayer
                            source={{ uri: videoUrl }}
                            style={styles.videoPlayer}
                            controls={true}
                            resizeMode="contain"
                            useTextureView={Platform.OS === 'android'}
                            shutterColor="transparent"
                            onLoadStart={() => {
                                setIsBuffering(true);
                            }}
                            onLoad={() => {
                                setIsBuffering(false);
                            }}
                            onBuffer={({ isBuffering: buffering }) => {
                                setIsBuffering(buffering);
                            }}
                            onError={() => {
                                setIsBuffering(false);
                            }}
                        />
                        {isBuffering && (
                            <View style={styles.loaderOverlay} pointerEvents="none">
                                <ActivityIndicator size="large" color="#3B82F6" />
                            </View>
                        )}
                    </View>
                )}


                {isBuffering && youtubeId && (
                    <View style={styles.loaderOverlay} pointerEvents="none">
                        <ActivityIndicator size="large" color="#3B82F6" />
                    </View>
                )}
            </View>

            {/* Lesson Info */}
            <View style={[styles.lessonInfoSection, isDark && { borderBottomColor: '#334155' }]}>
                <View style={styles.lessonHeader}>
                    <Text style={[styles.lessonTitle, isDark && styles.textLight]}>{currentVideo.videoTitle}</Text>
                    <View style={[styles.durationBadge, isDark && { backgroundColor: '#1E293B' }]}>
                        <Ionicons name="time-outline" size={14} color={isDark ? "#94A3B8" : "#6B7280"} />
                        <Text style={[styles.durationText, isDark && { color: '#94A3B8' }]}>{currentVideo.videoDuration}</Text>
                    </View>
                </View>
                <ScrollView style={styles.descriptionScroll}>
                    <Text style={[styles.descriptionText, isDark && { color: '#94A3B8' }]}>{currentVideo.videoDescription}</Text>
                </ScrollView>
            </View>

            {/* Curriculum List */}
            <View style={[styles.curriculumSection, isDark && { backgroundColor: '#0f172a' }]}>
                <View style={styles.curriculumHeader}>
                    <Text style={[styles.curriculumTitle, isDark && styles.textLight]}>Course Content</Text>
                    <Text style={[styles.curriculumProgress, isDark && { color: '#64748B' }]}>{currentIndex + 1}/{course.videos.length} Completed</Text>
                </View>

                <ScrollView contentContainerStyle={styles.listContent}>
                    {course.videos.map((video, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.lessonRow,
                                isDark && styles.lessonRowDark,
                                currentIndex === index && (isDark ? { borderLeftWidth: 4, borderLeftColor: '#3B82F6', backgroundColor: '#1E293B' } : styles.activeLessonRow)
                            ]}
                            onPress={() => setCurrentIndex(index)}
                        >
                            <View style={[
                                styles.indexBox,
                                isDark && { backgroundColor: '#1E293B' },
                                currentIndex === index && styles.activeIndexBox
                            ]}>
                                {currentIndex > index ? (
                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                ) : (
                                    <Text style={[
                                        styles.indexText,
                                        isDark && { color: '#64748B' },
                                        currentIndex === index && styles.activeIndexText
                                    ]}>{index + 1}</Text>
                                )}
                            </View>
                            <View style={styles.lessonRowInfo}>
                                <Text style={[
                                    styles.lessonRowTitle,
                                    isDark && styles.textLight,
                                    currentIndex === index && (isDark ? { color: '#3B82F6' } : styles.activeLessonRowTitle)
                                ]} numberOfLines={1}>{video.videoTitle}</Text>
                                <Text style={[styles.lessonRowMeta, isDark && { color: '#64748B' }]}>{video.videoDuration}</Text>
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
            <View style={[styles.navigationBar, isDark && styles.navigationBarDark, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={[styles.navBtn, isDark && { borderColor: '#334155' }, currentIndex === 0 && (isDark ? { borderColor: '#1E293B' } : styles.disabledBtn)]}
                    onPress={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                    disabled={currentIndex === 0}
                >
                    <Ionicons name="arrow-back" size={20} color={currentIndex === 0 ? "#9CA3AF" : "#3B82F6"} />
                    <Text style={[styles.navBtnText, currentIndex === 0 && (isDark ? { color: '#334155' } : styles.disabledBtnText)]}>Previous</Text>
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
    containerDark: {
        backgroundColor: '#0f172a',
    },
    textLight: {
        color: '#F8FAFC',
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
    videoWrapper: {
        width: '100%',
        height: '100%',
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
    lessonRowDark: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
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
    navigationBarDark: {
        backgroundColor: '#1e293b',
        borderTopColor: '#334155',
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
