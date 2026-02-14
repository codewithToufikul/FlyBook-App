import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Animated,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { AudioBook, Chapter } from '../../services/audioBookService';

const { width } = Dimensions.get('window');

const AudioPlayer = ({ route, navigation }: any) => {
    const { book, chapterId } = route.params as { book: AudioBook, chapterId: string };

    // State
    const [currentChapterIndex, setCurrentChapterIndex] = useState(
        book.chapters.findIndex(c => c.id === chapterId)
    );
    const [isPlaying, setIsPlaying] = useState(true); // Auto-play
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const videoRef = useRef<any>(null);
    const currentChapter = book.chapters[currentChapterIndex];

    // Format time (seconds -> MM:SS)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handlePrev = () => {
        if (currentChapterIndex > 0) {
            setCurrentChapterIndex(currentChapterIndex - 1);
            setIsPlaying(true);
        }
    };

    const handleNext = () => {
        if (currentChapterIndex < book.chapters.length - 1) {
            setCurrentChapterIndex(currentChapterIndex + 1);
            setIsPlaying(true);
        }
    };

    const onProgress = (data: { currentTime: number; playableDuration: number; seekableDuration: number }) => {
        setCurrentTime(data.currentTime);
        setIsLoading(false);
    };

    const onLoad = (data: { duration: number }) => {
        setDuration(data.duration);
        setIsLoading(false);
    };

    const onEnd = () => {
        setIsPlaying(false);
        if (currentChapterIndex < book.chapters.length - 1) {
            // Auto-play next chapter
            handleNext();
        } else {
            // End of book
            setCurrentTime(0);
        }
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="chevron-down" size={32} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Now Playing</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Image source={{ uri: book.coverImage }} style={styles.coverImage} />

                <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle}>{currentChapter.title}</Text>
                    <Text style={styles.trackArtist}>{book.author}</Text>
                </View>

                {/* Custom Progress Bar (Slider Replacement) */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBarBackground}>
                        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
                        <View style={[styles.progressBarThumb, { left: `${progressPercentage}%` }]} />
                    </View>
                    <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                        <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <TouchableOpacity onPress={handlePrev} disabled={currentChapterIndex === 0} style={styles.controlButton}>
                        <Ionicons name="play-skip-back" size={32} color={currentChapterIndex === 0 ? '#6B7280' : '#fff'} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseButton}>
                        {isLoading ? (
                            <ActivityIndicator color="#0D9488" />
                        ) : (
                            <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#0D9488" style={{ marginLeft: isPlaying ? 0 : 4 }} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleNext} disabled={currentChapterIndex === book.chapters.length - 1} style={styles.controlButton}>
                        <Ionicons name="play-skip-forward" size={32} color={currentChapterIndex === book.chapters.length - 1 ? '#6B7280' : '#fff'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Invisible Video Component for Audio */}
            {/* Using react-native-video to play audio URLs */}
            <Video
                ref={videoRef}
                source={{ uri: currentChapter.url }}
                rate={1.0}
                volume={1.0}
                muted={false}
                resizeMode="cover"
                paused={!isPlaying}
                onProgress={onProgress}
                onLoad={onLoad}
                onEnd={onEnd}
                onError={(e) => console.log('Audio Error:', e)}
                style={{ width: 0, height: 0 }} // Invisible
                playInBackground={true} // Enable background audio (iOS requires specific capability settings)
                playWhenInactive={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827', // Dark background for player
        paddingTop: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 40,
    },
    iconButton: {
        padding: 8,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    coverImage: {
        width: width - 80,
        height: width - 80,
        borderRadius: 20,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    trackInfo: {
        alignItems: 'center',
        marginBottom: 40,
    },
    trackTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    trackArtist: {
        color: '#9CA3AF',
        fontSize: 16,
    },
    progressContainer: {
        width: '100%',
        marginBottom: 40,
    },
    progressBarBackground: {
        height: 4,
        backgroundColor: '#374151',
        borderRadius: 2,
        marginBottom: 8,
        position: 'relative',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#0D9488',
        borderRadius: 2,
    },
    progressBarThumb: {
        position: 'absolute',
        top: -6, // Center vertically (4/2 - 16/2 = -6)
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        marginLeft: -8, // Center horizontally
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeText: {
        color: '#9CA3AF',
        fontSize: 12,
        fontVariant: ['tabular-nums'],
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
    },
    controlButton: {
        padding: 10,
    },
    playPauseButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
});

export default AudioPlayer;
