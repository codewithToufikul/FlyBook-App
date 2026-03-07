import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const ChatSkeleton = () => {
    const { isDark } = useTheme();
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startShimmer = () => {
            shimmerAnim.setValue(0);
            Animated.loop(
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                })
            ).start();
        };

        startShimmer();
    }, [shimmerAnim]);

    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    const ShimmerOverlay = () => (
        <Animated.View
            style={[
                StyleSheet.absoluteFill,
                {
                    transform: [{ translateX: shimmerTranslate }],
                },
            ]}
        >
            <View style={[styles.shimmerGradient, isDark && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
        </Animated.View>
    );

    const SkeletonItem = () => (
        <View style={styles.item}>
            <View style={[styles.avatar, isDark && { backgroundColor: '#334155' }]}>
                <ShimmerOverlay />
            </View>
            <View style={styles.content}>
                <View style={styles.row}>
                    <View style={[styles.name, isDark && { backgroundColor: '#334155' }]}>
                        <ShimmerOverlay />
                    </View>
                    <View style={[styles.time, isDark && { backgroundColor: '#334155' }]}>
                        <ShimmerOverlay />
                    </View>
                </View>
                <View style={[styles.message, isDark && { backgroundColor: '#334155' }]}>
                    <ShimmerOverlay />
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SkeletonItem key={i} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    item: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    avatar: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: '#F3F4F6',
        overflow: 'hidden',
    },
    content: {
        flex: 1,
        marginLeft: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        width: '40%',
        height: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    time: {
        width: '15%',
        height: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    message: {
        width: '75%',
        height: 14,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    shimmerGradient: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        opacity: 0.5,
    },
});

export default ChatSkeleton;
