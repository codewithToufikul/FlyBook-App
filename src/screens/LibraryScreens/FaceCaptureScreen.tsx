import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

// react-native-vision-camera-face-detector uses GoogleMLKit/FaceDetection which
// conflicts with Firebase iOS SDK 12.x (GoogleDataTransport version incompatibility).
// On iOS we fall back to the standard Camera without automatic face detection.
let FaceCamera: any;
if (Platform.OS === 'android') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  FaceCamera = require('react-native-vision-camera-face-detector').Camera;
} else {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  FaceCamera = require('react-native-vision-camera').Camera;
}

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;

interface FaceCaptureScreenProps {
  onCapture: (photoPath: string) => void;
  onClose: () => void;
}

export const FaceCaptureScreen: React.FC<FaceCaptureScreenProps> = ({
  onCapture,
  onClose,
}) => {
  const cameraRef = useRef<any>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [statusText, setStatusText] = useState(
    Platform.OS === 'ios'
      ? 'Position your face and tap Capture'
      : 'Position your face inside the circle',
  );
  const [loading, setLoading] = useState(true);
  const isCapturing = useRef(false);

  useEffect(() => {
    (async () => {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            'Camera Permission Required',
            'Please enable camera permissions in settings to complete the face verification.',
            [{ text: 'OK', onPress: onClose }],
          );
        }
      }
      setLoading(false);
    })();
  }, [hasPermission]);

  // Android only — auto-capture when face is detected via GoogleMLKit
  const handleFaceDetection = async (faces: any[]) => {
    if (isCapturing.current) return;

    if (faces && faces.length > 0) {
      setIsFaceDetected(true);
      setStatusText('Face Detected! Keep still...');

      isCapturing.current = true;
      setTimeout(async () => {
        try {
          if (cameraRef.current) {
            const photo = await cameraRef.current.takePhoto({
              flash: 'off',
              enableShutterSound: true,
            });
            if (photo && photo.path) {
              onCapture(`file://${photo.path}`);
            } else {
              throw new Error('Failed to take picture');
            }
          }
        } catch (error) {
          console.error('Auto capture failed:', error);
          isCapturing.current = false;
          setIsFaceDetected(false);
          setStatusText('Failed to capture. Please try again.');
        }
      }, 1200);
    } else {
      setIsFaceDetected(false);
      setStatusText('Position your face inside the circle');
    }
  };

  // iOS fallback — manual capture button
  const handleManualCapture = async () => {
    if (isCapturing.current) return;
    isCapturing.current = true;
    setStatusText('Capturing...');
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePhoto({
          flash: 'off',
          enableShutterSound: true,
        });
        if (photo && photo.path) {
          onCapture(photo.path);
        } else {
          throw new Error('Failed to take picture');
        }
      }
    } catch (error) {
      console.error('Manual capture failed:', error);
      isCapturing.current = false;
      setStatusText('Failed to capture. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Front camera device not found</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Build camera props — face detection only available on Android
  const cameraProps: any = {
    ref: cameraRef,
    style: StyleSheet.absoluteFill,
    device,
    isActive: true,
    photo: true,
  };
  if (Platform.OS === 'android') {
    cameraProps.faceDetectionCallback = handleFaceDetection;
    cameraProps.faceDetectionOptions = {
      performanceMode: 'fast',
      classificationMode: 'none',
      landmarkMode: 'none',
    };
  }

  return (
    <View style={styles.container}>
      <FaceCamera {...cameraProps} />

      {/* KYC Custom Cutout Overlay */}
      <View style={styles.overlayContainer}>
        <View style={styles.topMask} />
        <View style={styles.middleRow}>
          <View style={styles.sideMask} />
          <View
            style={[
              styles.cutoutCircle,
              isFaceDetected && styles.cutoutCircleSuccess,
            ]}
          />
          <View style={styles.sideMask} />
        </View>
        <View style={styles.bottomMask}>
          <Text
            style={[
              styles.statusLabel,
              isFaceDetected && styles.statusLabelSuccess,
            ]}>
            {statusText}
          </Text>

          {isFaceDetected && (
            <View style={styles.successIndicator}>
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
            </View>
          )}

          {/* Manual capture button — iOS only fallback */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleManualCapture}>
              <LinearGradient
                colors={['#14b8a6', '#0d9488']}
                style={styles.captureGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                <Ionicons
                  name="camera"
                  size={22}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.captureText}>Capture</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <LinearGradient
              colors={['#EF4444', '#B91C1C']}
              style={styles.cancelGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Face Verification</Text>
        <View style={{ width: 44 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 12,
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topMask: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.8)',
  },
  middleRow: {
    flexDirection: 'row',
    height: CIRCLE_SIZE,
  },
  sideMask: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.8)',
  },
  cutoutCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 3,
    borderColor: '#3b82f6',
    backgroundColor: 'transparent',
  },
  cutoutCircleSuccess: {
    borderColor: '#10b981',
  },
  bottomMask: {
    flex: 1.5,
    backgroundColor: 'rgba(9, 13, 22, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 16,
  },
  statusLabelSuccess: {
    color: '#10b981',
  },
  successIndicator: {
    marginBottom: 24,
  },
  captureButton: {
    width: '100%',
    maxWidth: 200,
    marginBottom: 12,
  },
  captureGradient: {
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelButton: {
    width: '100%',
    maxWidth: 200,
    marginTop: 10,
  },
  cancelGradient: {
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
});
