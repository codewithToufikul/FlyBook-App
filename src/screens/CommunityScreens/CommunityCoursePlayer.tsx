import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    StatusBar,
} from 'react-native';
import Video from 'react-native-video';
import YoutubePlayer from 'react-native-youtube-iframe';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CommunityCoursePlayer = ({ route, navigation }: any) => {
    const { courseId, chapterIndex, videoIndex, videoUrl: paramVideoUrl } = route.params;
    const insets = useSafeAreaInsets();

    // In a real app, we might fetch the full course here again or pass the whole chapter/video list
    // For simplicity, let's assume we receive the URL directly or fetch minimal info.
    // If complex navigation (next/prev) is needed, we should fetch the course structure.

    const [loading, setLoading] = useState(true);
    const [videoUrl, setVideoUrl] = useState<string | null>(paramVideoUrl || null);

    // Mock fetching for now if URL not passed directly
    useEffect(() => {
        if (!videoUrl) {
            // Fetch logic would go here
            // setVideoUrl(...)
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [courseId, chapterIndex, videoIndex]);

    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = videoUrl ? getYoutubeId(videoUrl) : null;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={30} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.playerWrapper}>
                {youtubeId ? (
                    <YoutubePlayer
                        height={240}
                        play={true}
                        videoId={youtubeId}
                    />
                ) : (
                    videoUrl && (
                        <Video
                            source={{ uri: videoUrl }}
                            style={styles.nativeVideo}
                            controls={true}
                            resizeMode="contain"
                            onError={(e) => console.log('Video Error:', e)}
                        />
                    )
                )}
            </View>

            <View style={styles.controls}>
                <Text style={styles.title}>Lesson {videoIndex + 1}</Text>
                {/* Advanced controls: Prev/Next Lesson buttons could be added here */}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    playerWrapper: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
    },
    nativeVideo: {
        width: '100%',
        height: '100%',
    },
    controls: {
        padding: 20,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default CommunityCoursePlayer;
