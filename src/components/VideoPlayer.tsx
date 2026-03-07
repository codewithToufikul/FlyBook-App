import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Text,
    ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

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

    const [paused, setPaused] = useState(!autoPlay);
    const [muted, setMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [ended, setEnded] = useState(false);
    const [error, setError] = useState(false);

    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    return (
        <View style={[styles.container, { height, borderRadius, overflow: 'hidden' }]}>

            {/* ── The Video ── */}
            <Video
                ref={videoRef}
                source={{ uri }}
                style={styles.video}
                resizeMode="cover"
                paused={paused}
                muted={muted}
                controls={false}
                onLoad={(data: any) => {
                    setDuration(data.duration || 0);
                    setLoading(false);
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

                        {onFullscreen && (
                            <TouchableOpacity style={styles.smallBtn} onPress={onFullscreen}>
                                <Ionicons name="expand" size={17} color="#fff" />
                            </TouchableOpacity>
                        )}
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
                        <View style={styles.progressTrackWrapper}>
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
                        </View>

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
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#000',
        width: '100%',
        overflow: 'hidden',
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
