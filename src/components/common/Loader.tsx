import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface LoaderProps {
  /** Loading message to display */
  message?: string;
  /** Size of the loader: 'small' | 'medium' | 'large' */
  size?: 'small' | 'medium' | 'large';
  /** Variant: 'fullscreen' | 'inline' | 'overlay' */
  variant?: 'fullscreen' | 'inline' | 'overlay';
  /** Show logo animation */
  showLogo?: boolean;
  /** Custom color for spinner */
  color?: string;
}

const Loader: React.FC<LoaderProps> = ({
  message = 'Loading...',
  size = 'medium',
  variant = 'fullscreen',
  showLogo = true,
  color = '#3B82F6',
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Pulse animation for logo
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.ease }),
        withTiming(1, { duration: 800, easing: Easing.ease })
      ),
      -1,
      false
    );

    // Fade animation
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000, easing: Easing.ease }),
        withTiming(1, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      false
    );

    // Rotation animation for spinner
    rotate.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const animatedSpinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotate.value}deg` }],
    };
  });

  const logoSize = size === 'small' ? 40 : size === 'large' ? 100 : 70;
  const spinnerSize = size === 'small' ? 20 : size === 'large' ? 40 : 30;

  const containerStyle = [
    styles.container,
    variant === 'fullscreen' && styles.fullscreen,
    variant === 'overlay' && styles.overlay,
    variant === 'inline' && styles.inline,
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.content}>
        {showLogo && (
          <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
            <Image
              source={require('../../assets/logo.png')}
              style={[styles.logo, { width: logoSize, height: logoSize }]}
              resizeMode="contain"
            />
          </Animated.View>
        )}

        <View style={styles.spinnerContainer}>
          <Animated.View style={animatedSpinnerStyle}>
            <View
              style={[
                styles.spinner,
                {
                  width: spinnerSize * 2,
                  height: spinnerSize * 2,
                  borderTopColor: color,
                  borderRightColor: color,
                },
              ]}
            />
          </Animated.View>
        </View>

        {message && (
          <Text
            style={[
              styles.message,
              { color: variant === 'fullscreen' ? '#64748B' : '#475569' },
              size === 'small' && styles.messageSmall,
              size === 'large' && styles.messageLarge,
            ]}
          >
            {message}
          </Text>
        )}

        {/* Animated dots */}
        <View style={styles.dotsContainer}>
          <AnimatedDot delay={0} color={color} />
          <AnimatedDot delay={200} color={color} />
          <AnimatedDot delay={400} color={color} />
        </View>
      </View>
    </View>
  );
};

// Animated dot component for loading indicator
const AnimatedDot: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(0, { duration: delay }),
        withTiming(-8, { duration: 300, easing: Easing.ease }),
        withTiming(0, { duration: 300, easing: Easing.ease }),
        withTiming(0, { duration: 400 - delay })
      ),
      -1,
      false
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[styles.dot, animatedStyle, { backgroundColor: color }]} />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 9999,
  },
  inline: {
    padding: 20,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
  },
  spinnerContainer: {
    marginVertical: 16,
  },
  spinner: {
    borderWidth: 3,
    borderColor: 'transparent',
    borderRadius: 9999,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  messageSmall: {
    fontSize: 14,
    marginTop: 12,
  },
  messageLarge: {
    fontSize: 18,
    marginTop: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default Loader;