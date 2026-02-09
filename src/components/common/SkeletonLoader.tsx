import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SkeletonLoaderProps {
  /** Width of skeleton */
  width?: number | string;
  /** Height of skeleton */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Custom style */
  style?: ViewStyle;
  /** Variant: 'text' | 'circle' | 'rect' */
  variant?: 'text' | 'circle' | 'rect';
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  variant = 'rect',
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.ease }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const skeletonStyle = [
    styles.skeleton,
    {
      width,
      height,
      borderRadius: variant === 'circle' ? height / 2 : borderRadius,
    },
    style,
  ];

  return <Animated.View style={[skeletonStyle, animatedStyle]} />;
};

// Predefined skeleton layouts
export const PostSkeleton: React.FC = () => (
  <View style={styles.postContainer}>
    <View style={styles.postHeader}>
      <SkeletonLoader variant="circle" width={40} height={40} />
      <View style={styles.postHeaderText}>
        <SkeletonLoader width="60%" height={16} />
        <SkeletonLoader width="40%" height={12} style={{ marginTop: 6 }} />
      </View>
    </View>
    <SkeletonLoader width="100%" height={200} style={{ marginTop: 12 }} />
    <View style={styles.postContent}>
      <SkeletonLoader width="100%" height={14} />
      <SkeletonLoader width="90%" height={14} style={{ marginTop: 6 }} />
      <SkeletonLoader width="70%" height={14} style={{ marginTop: 6 }} />
    </View>
  </View>
);

export const ProductCardSkeleton: React.FC = () => (
  <View style={styles.productCard}>
    <SkeletonLoader width="100%" height={150} borderRadius={8} />
    <View style={styles.productContent}>
      <SkeletonLoader width="80%" height={16} />
      <SkeletonLoader width="60%" height={14} style={{ marginTop: 6 }} />
      <SkeletonLoader width="40%" height={20} style={{ marginTop: 8 }} />
    </View>
  </View>
);

export const ListItemSkeleton: React.FC = () => (
  <View style={styles.listItem}>
    <SkeletonLoader variant="circle" width={50} height={50} />
    <View style={styles.listContent}>
      <SkeletonLoader width="70%" height={16} />
      <SkeletonLoader width="50%" height={12} style={{ marginTop: 6 }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E2E8F0',
  },
  postContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  postContent: {
    marginTop: 12,
  },
  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  productContent: {
    padding: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  listContent: {
    marginLeft: 12,
    flex: 1,
  },
});

export default SkeletonLoader;
