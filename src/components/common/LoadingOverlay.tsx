import React from 'react';
import { Modal, View, StyleSheet, Text, Pressable } from 'react-native';
import Loader from './Loader';

interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Loading message */
  message?: string;
  /** Allow backdrop press to dismiss (default: false) */
  dismissable?: boolean;
  /** Callback when backdrop is pressed */
  onDismiss?: () => void;
  /** Transparent background */
  transparent?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  dismissable = false,
  onDismiss,
  transparent = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissable ? onDismiss : undefined}
    >
      <Pressable
        style={[
          styles.overlay,
          transparent && styles.transparentOverlay,
        ]}
        onPress={dismissable ? onDismiss : undefined}
        disabled={!dismissable}
      >
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.content}>
            <Loader
              message={message}
              size="large"
              variant="inline"
              showLogo={true}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transparentOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default LoadingOverlay;
