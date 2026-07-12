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
  Image,
  FlatList,
  PermissionsAndroid,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Geolocation from '@react-native-community/geolocation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../contexts/ThemeContext';
import { uploadToImgBB } from '../../utils/imageUpload';
import { confirmBookTransfer } from '../../services/libraryService';

const { width, height } = Dimensions.get('window');

export default function BookConditionCameraScreen({ route, navigation }: any) {
  const { bookId, bookName } = route.params || {};
  const cameraRef = useRef<Camera>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const { isDark } = useTheme();
  const queryClient = useQueryClient();

  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [cameraLoading, setCameraLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            'Camera Permission Required',
            'Please enable camera permissions in settings to document the book condition.',
            [{ text: 'OK', onPress: () => navigation.goBack() }],
          );
        }
      }
      setCameraLoading(false);
    })();
  }, [hasPermission]);

  const handleCapture = async () => {
    if (isCapturing) return;
    if (capturedPhotos.length >= 3) {
      Alert.alert('Maximum Limit Reached', 'You can take up to 3 photos.');
      return;
    }

    setIsCapturing(true);
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePhoto({
          flash: 'off',
          enableShutterSound: true,
        });

        if (photo && photo.path) {
          const formattedPath = Platform.OS === 'ios' ? photo.path : `file://${photo.path}`;
          setCapturedPhotos((prev) => [...prev, formattedPath]);
        } else {
          throw new Error('Failed to capture photo path');
        }
      }
    } catch (error) {
      console.error('Failed to capture photo:', error);
      Alert.alert('Capture Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const getCoordinates = (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      const requestLocation = async () => {
        if (Platform.OS === 'android') {
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              resolve(null);
              return;
            }
          } catch {
            resolve(null);
            return;
          }
        } else {
          Geolocation.requestAuthorization();
        }

        Geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
        );
      };
      requestLocation();
    });
  };

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
        {
          headers: {
            'User-Agent': 'FlyBook-App',
          },
        },
      );
      const data = await res.json();
      const addr = data.address;
      if (!addr) return 'Dhaka';
      const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.city || addr.town || 'Dhaka';
      const city = addr.city || addr.state || 'Dhaka';
      return `${area}, ${city}`;
    } catch (error) {
      console.error('Reverse geocode failed:', error);
      return 'Dhaka';
    }
  };

  const handleConfirmTransfer = async () => {
    if (capturedPhotos.length === 0) {
      Alert.alert('Required', 'You must capture at least 1 photo of the book condition.');
      return;
    }

    setIsUploading(true);
    try {
      setUploadProgress('Getting your location...');
      const coords = await getCoordinates();
      let locationObj = null;
      if (coords) {
        setUploadProgress('Identifying your area...');
        const locationName = await reverseGeocode(coords.latitude, coords.longitude);
        locationObj = {
          type: 'Point',
          coordinates: [coords.longitude, coords.latitude] as [number, number],
          locationName,
        };
      }

      const uploadedUrls: string[] = [];
      for (let i = 0; i < capturedPhotos.length; i++) {
        setUploadProgress(`Uploading photo ${i + 1} of ${capturedPhotos.length}...`);
        const url = await uploadToImgBB(capturedPhotos[i]);
        uploadedUrls.push(url);
      }

      setUploadProgress('Confirming transfer...');
      await confirmBookTransfer(bookId, uploadedUrls, locationObj);

      Toast.show({
        type: 'success',
        text1: 'Transfer Confirmed!',
        text2: `You successfully accepted "${bookName}"`,
      });

      queryClient.invalidateQueries({ queryKey: ['allBooks'] });
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to confirm transfer:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to complete book transfer. Please try again.',
      );
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  if (cameraLoading) {
    return (
      <View style={[styles.centerContainer, isDark && styles.darkBg]}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={[styles.loadingText, isDark && styles.darkText]}>Initializing camera...</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.centerContainer, isDark && styles.darkBg]}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={[styles.errorText, isDark && styles.darkText]}>Back camera device not found</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!isUploading}
        photo={true}
      />

      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} disabled={isUploading}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>Document Condition</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{bookName}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Guide overlay */}
      <View style={styles.overlayGuide}>
        <Text style={styles.guideText}>
          Take clear photos of any existing damage or book cover (Min 1, Max 3)
        </Text>
      </View>

      {/* Bottom control panel */}
      <View style={styles.bottomPanel}>
        {/* Photo Previews */}
        {capturedPhotos.length > 0 && (
          <View style={styles.previewContainer}>
            <FlatList
              horizontal
              data={capturedPhotos}
              keyExtractor={(_, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previewList}
              renderItem={({ item, index }) => (
                <View style={styles.previewWrapper}>
                  <Image source={{ uri: item }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemovePhoto(index)}
                    disabled={isUploading}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}

        <View style={styles.actionsRow}>
          {/* Capture Trigger */}
          <TouchableOpacity
            style={[
              styles.captureBtn,
              (isCapturing || capturedPhotos.length >= 3 || isUploading) && styles.disabledBtn,
            ]}
            onPress={handleCapture}
            disabled={isCapturing || capturedPhotos.length >= 3 || isUploading}
          >
            <View style={styles.captureInner}>
              <Ionicons name="camera" size={32} color="#7C3AED" />
            </View>
          </TouchableOpacity>

          {/* Confirm Button */}
          {capturedPhotos.length > 0 && (
            <TouchableOpacity
              style={[styles.confirmBtn, isUploading && styles.disabledBtn]}
              onPress={handleConfirmTransfer}
              disabled={isUploading}
            >
              <LinearGradient
                colors={['#7C3AED', '#6D28D9']}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.confirmBtnText}>Accept Book</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.photoCountText}>
          {capturedPhotos.length} / 3 Photos captured
        </Text>
      </View>

      {/* Uploading progress modal-like overlay */}
      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.uploadingText}>{uploadProgress}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  darkBg: {
    backgroundColor: '#0f172a',
  },
  darkText: {
    color: '#cbd5e1',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  closeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
  },
  overlayGuide: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 90,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 5,
  },
  guideText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  previewContainer: {
    height: 90,
    width: '100%',
    marginBottom: 16,
  },
  previewList: {
    paddingHorizontal: 4,
    gap: 12,
  },
  previewWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'visible',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 7,
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 10,
    zIndex: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    gap: 20,
    marginBottom: 12,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#7C3AED',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtn: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  photoCountText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
