import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Text,
    ActivityIndicator,
    AppState,
    AppStateStatus,
    Modal,
    StatusBar,
} from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useIsFocused } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
    uri: string;
    height?: number;
    autoPlay?: boolean;
    onFullscreen?: () => void;
    borderRadius?: number;
}

const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const VideoPlayer: React.FC<Props> = ({
    uri,
    height = 220,
    autoPlay = false,
    onFullscreen,
    borderRadius = 0,
}) => {
    const videoRef = useRef<any>(null);
    const isFocused = useIsFocused();

    const [paused, setPaused] = useState(!autoPlay);
    const [muted, setMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [ended, setEnded] = useState(false);
    const [error, setError] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [trackWidth, setTrackWidth] = useState(0);
    useEffect(() => {
        return () => {
            setPaused(true);
        };
    }, []);
    const containerRef = useRef<any>(null);
    const { height: windowHeight } = Dimensions.get('window');
    // Periodically check if video component is visible in viewport
    useEffect(() => {
        const checkVisibility = () => {
            if (!containerRef.current) return;
            containerRef.current.measureInWindow((x: number, y: number, w: number, h: number) => {
                // If component is completely outside the screen vertically, pause it
                if (y + h < 0 || y > windowHeight) {
                    setPaused(true);
                }
            });
        };
        const intervalId = setInterval(checkVisibility, 500);
        return () => clearInterval(intervalId);
    }, []);

    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Pause when screen loses focus
    useEffect(() => {
        if (!isFocused) {
            setPaused(true);
        }
    }, [isFocused]);

    // Pause when app is backgrounded/minimized
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState !== 'active') {
                setPaused(true);
            }
        });
        return () => {
            subscription.remove();
        };
    }, []);

    const scheduleHide = useCallback(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }, []);

    const handleOverlayPress = () => {
        setShowControls(prev => {
            if (!prev) scheduleHide();
            return !prev;
        });
    };

    const handlePlayPause = () => {
        if (ended) {
            videoRef.current?.seek(0);
            setEnded(false);
            setPaused(false);
        } else {
            setPaused(prev => !prev);
        }
        scheduleHide();
    };

    const handleSeek = (event: any) => {
        if (trackWidth <= 0 || duration <= 0) return;
        const { locationX } = event.nativeEvent;
        const ratio = Math.max(0, Math.min(locationX / trackWidth, 1));
        const newTime = ratio * duration;
        setCurrentTime(newTime);
        videoRef.current?.seek(newTime);
        scheduleHide();
    };

    const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

    if (error) {
        return (
            <View style={[styles.container, { height, borderRadius, backgroundColor: '#1a1a2e' }]}>
                <View style={styles.errorBox}>
                    <Ionicons name="videocam-off-outline" size={36} color="#ef4444" />
                    <Text style={styles.errorText}>Unable to load video</Text>
                </View>
            </View>
        );
    }

    const playerContent = (
        <View ref={containerRef} style={isFullscreen ? styles.fullscreenWrapper : [styles.container, { height, borderRadius, overflow: 'hidden' }]}>
            {isFullscreen && <StatusBar hidden={true} />}

            {/* ── The Video ── */}
            <Video
                ref={videoRef}
                source={{ uri }}
                style={styles.video}
                resizeMode={isFullscreen ? "contain" : "cover"}
                paused={paused}
                muted={muted}
                controls={false}
                onLoad={(data: any) => {
                    setDuration(data.duration || 0);
                    setLoading(false);
                    if (currentTime > 0) {
                        videoRef.current?.seek(currentTime);
                    }
                }}
                onProgress={(data: any) => {
                    setCurrentTime(data.currentTime || 0);
                }}
                onEnd={() => {
                    setEnded(true);
                    setPaused(true);
                    setShowControls(true);
                }}
                onLoadStart={() => setLoading(true)}
                onReadyForDisplay={() => setLoading(false)}
                onError={() => {
                    setError(true);
                    setLoading(false);
                }}
                repeat={false}
                playInBackground={false}
                ignoreSilentSwitch="ignore"
            />

            {/* ── Loading overlay ── */}
            {loading && (
                <View style={styles.centerOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}

            {/* ── Tap to toggle controls ── */}
            <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={handleOverlayPress}
            />

            {/* ── Controls ── */}
            {showControls && !loading && (
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    {/* Gradient scrim */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.75)']}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                    />

                    {/* Top bar */}
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            style={styles.smallBtn}
                            onPress={() => { setMuted(v => !v); scheduleHide(); }}
                        >
                            <Ionicons
                                name={muted ? 'volume-mute' : 'volume-high'}
                                size={17}
                                color="#fff"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.smallBtn}
                            onPress={() => {
                                setIsFullscreen(prev => !prev);
                                scheduleHide();
                            }}
                        >
                            <Ionicons
                                name={isFullscreen ? 'contract' : 'expand'}
                                size={17}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Center play/pause */}
                    <View style={styles.centre} pointerEvents="box-none">
                        <TouchableOpacity onPress={handlePlayPause} activeOpacity={0.85}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.1)']}
                                style={styles.playBtn}
                            >
                                <Ionicons
                                    name={ended ? 'refresh' : paused ? 'play' : 'pause'}
                                    size={28}
                                    color="#fff"
                                    style={paused && !ended ? { marginLeft: 3 } : undefined}
                                />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Bottom bar */}
                    <View style={styles.bottomBar}>
                        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>

                        {/* Seekable progress bar */}
                        <TouchableOpacity
                            style={styles.progressTrackWrapper}
                            activeOpacity={1}
                            onPress={handleSeek}
                            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                        >
                            <View style={styles.progressTrack}>
                                {/* Filled part */}
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${progress * 100}%` },
                                    ]}
                                />
                                {/* Thumb */}
                                <View
                                    style={[
                                        styles.progressThumb,
                                        { left: `${progress * 100}%` },
                                    ]}
                                />
                            </View>
                        </TouchableOpacity>

                        <Text style={styles.timeText}>{formatTime(duration)}</Text>
                    </View>
                </View>
            )}

            {/* Mini paused indicator when controls hidden */}
            {!showControls && paused && !ended && !loading && (
                <View style={styles.miniPauseBadge} pointerEvents="none">
                    <Ionicons name="play" size={12} color="#fff" />
                </View>
            )}

            {/* Mini muted indicator */}
            {!showControls && muted && !loading && (
                <View style={styles.miniMuteBadge} pointerEvents="none">
                    <Ionicons name="volume-mute" size={12} color="#fff" />
                </View>
            )}
        </View>
    );

    if (isFullscreen) {
        return (
            <Modal
                visible={isFullscreen}
                transparent={false}
                animationType="fade"
                onRequestClose={() => setIsFullscreen(false)}
                supportedOrientations={['portrait', 'landscape']}
            >
                {playerContent}
            </Modal>
        );
    }

    return playerContent;
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#000',
        width: '100%',
        overflow: 'hidden',
    },
    fullscreenWrapper: {
        flex: 1,
        backgroundColor: '#000',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
    },
    // Important: Video must have an absolute fill OR explicit dimensions
    video: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    centerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    errorBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    errorText: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '600',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 10,
    },
    smallBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centre: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playBtn: {
        width: 62,
        height: 62,
        borderRadius: 31,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.45)',
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 12,
        gap: 8,
    },
    timeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        minWidth: 34,
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowRadius: 4,
        textShadowOffset: { width: 0, height: 1 },
    },
    progressTrackWrapper: {
        flex: 1,
        height: 20,
        justifyContent: 'center',
    },
    progressTrack: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        position: 'relative',
    },
    progressFill: {
        height: 3,
        backgroundColor: '#14b8a6',
        borderRadius: 2,
    },
    progressThumb: {
        position: 'absolute',
        top: -4.5,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#14b8a6',
        marginLeft: -6,
        shadowColor: '#14b8a6',
        shadowOpacity: 0.9,
        shadowRadius: 5,
        elevation: 4,
    },
    miniPauseBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 10,
        padding: 5,
    },
    miniMuteBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 10,
        padding: 5,
    },
});

export default VideoPlayer;
