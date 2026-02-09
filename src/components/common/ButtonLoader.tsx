import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface ButtonLoaderProps {
  /** Size of the loader */
  size?: 'small' | 'medium' | 'large';
  /** Color of the loader */
  color?: string;
}

const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  size = 'medium',
  color = '#FFFFFF',
}) => {
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 800, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotate.value}deg` }],
    };
  });

  const spinnerSize = size === 'small' ? 16 : size === 'large' ? 28 : 20;
  const borderWidth = size === 'small' ? 2 : size === 'large' ? 3 : 2.5;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          animatedStyle,
          {
            width: spinnerSize,
            height: spinnerSize,
            borderWidth,
            borderTopColor: color,
            borderRightColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderColor: 'transparent',
    borderRadius: 9999,
  },
});

export default ButtonLoader;
