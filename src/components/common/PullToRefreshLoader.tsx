import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface PullToRefreshLoaderProps {
  /** Color of the loader */
  color?: string;
  /** Size of the loader */
  size?: number;
}

const PullToRefreshLoader: React.FC<PullToRefreshLoaderProps> = ({
  color = '#3B82F6',
  size = 40,
}) => {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);

  useEffect(() => {
    const animateCircle = (sharedValue: Animated.SharedValue<number>, delay: number) => {
      sharedValue.value = withRepeat(
        withSequence(
          withTiming(1, { duration: delay }),
          withTiming(1.5, { duration: 400, easing: Easing.ease }),
          withTiming(1, { duration: 400, easing: Easing.ease }),
          withTiming(1, { duration: 400 - delay })
        ),
        -1,
        false
      );
    };

    animateCircle(scale1, 0);
    animateCircle(scale2, 200);
    animateCircle(scale3, 400);
  }, []);

  const animated1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
  }));

  const animated2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
  }));

  const animated3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
  }));

  const circleSize = size / 4;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.circle,
          animated1,
          { width: circleSize, height: circleSize, backgroundColor: color },
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          animated2,
          { width: circleSize, height: circleSize, backgroundColor: color, marginHorizontal: 6 },
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          animated3,
          { width: circleSize, height: circleSize, backgroundColor: color },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    borderRadius: 9999,
  },
});

export default PullToRefreshLoader;
