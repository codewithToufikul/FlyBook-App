import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Text,
    View,
    StyleSheet,
} from 'react-native';

interface CoinEarnedToastProps {
    visible: boolean;
    coinsAdded: number;
    onHide: () => void;
}

const CoinEarnedToast: React.FC<CoinEarnedToastProps> = ({ visible, coinsAdded, onHide }) => {
    const translateY = useRef(new Animated.Value(80)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.85)).current;
    const coinSpin = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Slide in + fade in
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 15,
                    stiffness: 200,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    useNativeDriver: true,
                    damping: 12,
                    stiffness: 180,
                }),
            ]).start();

            // Coin pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(coinSpin, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(coinSpin, {
                        toValue: 0,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ]),
                { iterations: 2 }
            ).start();

            // Auto hide after 2.5s
            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(translateY, {
                        toValue: 80,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scale, {
                        toValue: 0.85,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    onHide();
                });
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    const coinScale = coinSpin.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.25, 1],
    });

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }, { scale }],
                    opacity,
                },
            ]}
        >
            <View style={styles.pill}>
                <Animated.Text style={[styles.coinEmoji, { transform: [{ scale: coinScale }] }]}>
                    🪙
                </Animated.Text>
                <View style={styles.textGroup}>
                    <Text style={styles.label}>Points Earned</Text>
                    <Text style={styles.value}>+{coinsAdded.toFixed(1)} <Text style={styles.unit}>pts</Text></Text>
                </View>
                <View style={styles.glow} />
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90,
        alignSelf: 'center',
        zIndex: 9999,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#0F172A',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.4)',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(99,102,241,0.06)',
        borderRadius: 50,
    },
    coinEmoji: {
        fontSize: 22,
    },
    textGroup: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    label: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    value: {
        color: '#A5B4FC',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    unit: {
        color: '#6366F1',
        fontSize: 11,
        fontWeight: '600',
    },
});

export default CoinEarnedToast;
