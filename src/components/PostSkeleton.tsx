import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const PostSkeleton = () => {
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

    return (
        <View style={[styles.card, isDark && { backgroundColor: '#1e293b', borderBottomWidth: 0 }]}>
            {/* Header Skeleton */}
            <View style={styles.header}>
                <View style={[styles.metaBox, isDark && { backgroundColor: '#334155' }]}>
                    <View style={styles.skeletonTextSmall} />
                    <ShimmerOverlay />
                </View>
                <View style={[styles.skeletonBadge, isDark && { backgroundColor: '#334155' }]} />
            </View>

            {/* Title Skeleton */}
            <View style={[styles.skeletonTitle, isDark && { backgroundColor: '#334155' }]}>
                <ShimmerOverlay />
            </View>
            <View style={[styles.skeletonTitle, { width: '60%' }, isDark && { backgroundColor: '#334155' }]}>
                <ShimmerOverlay />
            </View>

            {/* Body Skeleton */}
            <View style={[styles.skeletonBody, isDark && { backgroundColor: '#334155' }]}>
                <ShimmerOverlay />
            </View>

            {/* Image Skeleton */}
            <View style={[styles.skeletonImage, isDark && { backgroundColor: '#334155' }]}>
                <ShimmerOverlay />
            </View>

            {/* Footer Skeleton */}
            <View style={[styles.footer, isDark && { borderTopColor: '#334155' }]}>
                <View style={styles.actionGroup}>
                    <View style={[styles.skeletonIcon, isDark && { backgroundColor: '#334155' }]} />
                    <View style={[styles.skeletonIcon, isDark && { backgroundColor: '#334155' }]} />
                </View>
                <View style={[styles.skeletonIcon, isDark && { backgroundColor: '#334155' }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    metaBox: {
        width: 80,
        height: 14,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    skeletonTextSmall: {
        width: '100%',
        height: '100%',
    },
    skeletonBadge: {
        width: 60,
        height: 20,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    skeletonTitle: {
        width: '90%',
        height: 18,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    skeletonBody: {
        width: '100%',
        height: 40,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        marginTop: 8,
        marginBottom: 16,
        overflow: 'hidden',
    },
    skeletonImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    actionGroup: {
        flexDirection: 'row',
        gap: 20,
    },
    skeletonIcon: {
        width: 40,
        height: 20,
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

export default PostSkeleton;
