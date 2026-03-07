import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { addBook } from '../../services/libraryService';
import {
  handleImageUpload,
  uploadToImgBB,
  compressImage,
  pickImageFromGallery,
  takePhotoWithCamera,
  showImageSourceSelector,
} from '../../utils/imageUpload';

const RETURN_OPTIONS = ['3 days', '7 days', '15 days', '30 days'];

const AddBook = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();

  const [bookName, setBookName] = useState('');
  const [writer, setWriter] = useState('');
  const [details, setDetails] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickImage = async () => {
    try {
      const source = await showImageSourceSelector();
      let selectedImage;
      if (source === 'camera') {
        selectedImage = await takePhotoWithCamera();
      } else {
        selectedImage = await pickImageFromGallery();
      }
      if (selectedImage?.uri) {
        const compressed = await compressImage(selectedImage.uri, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 70,
        });
        setImageUri(compressed);
      }
    } catch (err: any) {
      if (!err.message?.includes('cancelled')) {
        Toast.show({ type: 'error', text1: 'Failed to pick image' });
      }
    }
  };

  const getLocation = (): Promise<{ type: string; coordinates: [number, number] } | null> => {
    return new Promise(resolve => {
      const requestAndGet = async () => {
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
          position => {
            const { latitude, longitude } = position.coords;
            resolve({ type: 'Point', coordinates: [longitude, latitude] });
          },
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
        );
      };
      requestAndGet();
    });
  };

  const handleSubmit = async () => {
    if (!bookName.trim() || !writer.trim() || !details.trim() || !returnTime || !imageUri) {
      Toast.show({ type: 'error', text1: 'Please fill all fields and add an image' });
      return;
    }

    if (user?.verified === false) {
      Toast.show({ type: 'error', text1: 'Please verify your profile first' });
      return;
    }

    setIsSubmitting(true);

    try {
      Toast.show({ type: 'info', text1: 'Getting your location...' });
      const locationInfo = await getLocation();

      Toast.show({ type: 'info', text1: 'Uploading book image...' });
      const imageUrl = await uploadToImgBB(imageUri);

      const bookData = {
        bookName: bookName.trim(),
        writer: writer.trim(),
        details: details.trim(),
        returnTime,
        imageUrl,
        userId: user?._id || '',
        currentDate: new Date().toLocaleDateString(),
        currentTime: new Date().toLocaleTimeString(),
        location: locationInfo,
      };

      await addBook(bookData);
      Toast.show({ type: 'success', text1: 'Book added successfully!' });
      queryClient.invalidateQueries({ queryKey: ['allBooks'] });
      navigation.goBack();
    } catch (error: any) {
      console.error('Add book error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to add book',
        text2: error?.message || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#fff"} />
      <SafeAreaView edges={['top']} style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, isDark && { backgroundColor: '#1e293b' }]}>
          <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#1E293B"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.textLight]}>Add a Book</Text>
        <View style={{ width: 32 }} />
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.locationNotice, isDark && { backgroundColor: 'rgba(20, 184, 166, 0.05)', borderColor: '#1e293b' }]}>
            <Ionicons name="location" size={18} color={isDark ? "#14b8a6" : "#0D9488"} />
            <Text style={[styles.locationNoticeText, isDark && { color: '#94a3b8' }]}>
              Your location will be saved with the book to help others find it nearby.
            </Text>
          </View>

          <Text style={[styles.label, isDark && styles.textLight]}>Book Name</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Enter book name"
            placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
            value={bookName}
            onChangeText={setBookName}
          />

          <Text style={[styles.label, isDark && styles.textLight]}>Writer</Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Enter writer name"
            placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
            value={writer}
            onChangeText={setWriter}
          />

          <Text style={[styles.label, isDark && styles.textLight]}>Short Details</Text>
          <TextInput
            style={[styles.input, styles.textArea, isDark && styles.inputDark]}
            placeholder="Write short details about the book..."
            placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={[styles.label, isDark && styles.textLight]}>Return Time</Text>
          <View style={styles.returnRow}>
            {RETURN_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.returnOption,
                  isDark && styles.returnOptionDark,
                  returnTime === option && styles.returnOptionActive,
                  returnTime === option && isDark && { backgroundColor: 'rgba(20, 184, 166, 0.1)' }
                ]}
                onPress={() => setReturnTime(option)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.returnOptionText,
                    isDark && { color: '#64748b' },
                    returnTime === option && styles.returnOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, isDark && styles.textLight]}>Book Image</Text>
          <TouchableOpacity
            style={[styles.imagePicker, isDark && styles.inputDark, isDark && { borderStyle: 'solid' }]}
            onPress={handlePickImage}
            activeOpacity={0.7}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Ionicons name="camera-outline" size={40} color={isDark ? "#334155" : "#9CA3AF"} />
                <Text style={[styles.imagePickerText, isDark && { color: '#334155' }]}>Tap to select image</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>Add Book</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  textLight: {
    color: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerDark: {
    backgroundColor: '#0f172a',
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  form: {
    padding: 20,
    paddingBottom: 60,
  },
  locationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDFA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  locationNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#0F766E',
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  inputDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    color: '#f8fafc',
  },
  textArea: {
    minHeight: 100,
  },
  returnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  returnOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  returnOptionDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  returnOptionActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0D9488',
  },
  returnOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  returnOptionTextActive: {
    color: '#0D9488',
    fontWeight: '600',
  },
  imagePicker: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 200,
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 24,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddBook;
