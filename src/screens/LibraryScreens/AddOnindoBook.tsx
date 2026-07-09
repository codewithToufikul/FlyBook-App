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
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { addOnindoBook } from '../../services/libraryService';
import {
  uploadToImgBB,
  compressImage,
  pickImageFromGallery,
  takePhotoWithCamera,
  showImageSourceSelector,
} from '../../utils/imageUpload';

const AddOnindoBook = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();

  const [bookName, setBookName] = useState('');
  const [writer, setWriter] = useState('');
  const [details, setDetails] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bg = isDark ? '#0f172a' : '#F8FAFC';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subColor = isDark ? '#64748b' : '#94a3b8';
  const inputBg = isDark ? '#0f172a' : '#f8fafc';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

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

  const handleSubmit = async () => {
    if (!bookName.trim() || !writer.trim() || !details.trim() || !imageUri) {
      Toast.show({ type: 'error', text1: 'Please fill all fields and add an image' });
      return;
    }

    setIsSubmitting(true);
    try {
      Toast.show({ type: 'info', text1: 'Uploading book image...' });
      const imageUrl = await uploadToImgBB(imageUri);

      const bookData = {
        bookName: bookName.trim(),
        writer: writer.trim(),
        details: details.trim(),
        imageUrl,
        userId: user?._id || '',
        currentDate: new Date().toLocaleDateString(),
        currentTime: new Date().toLocaleTimeString(),
      };

      await addOnindoBook(bookData);
      Toast.show({ type: 'success', text1: 'Book added to Onindo Library! 🎉' });
      queryClient.invalidateQueries({ queryKey: ['allOnindoBooks'] });
      navigation.goBack();
    } catch (error: any) {
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
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#0f172a' : '#fff'}
      />
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: isDark ? '#0f172a' : '#fff', borderBottomColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
        >
          <Ionicons name="arrow-back" size={22} color={isDark ? '#f8fafc' : '#1E293B'} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <LinearGradient colors={['#7c3aed', '#a78bfa']} style={styles.logoGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="infinite" size={16} color="#fff" />
          </LinearGradient>
          <Text style={[styles.headerTitle, { color: textColor }]}>Add to Onindo</Text>
        </View>
        <View style={{ width: 44 }} />
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info banner */}
          <View style={[styles.infoBanner, { backgroundColor: 'rgba(124,58,237,0.08)', borderColor: isDark ? '#4c1d95' : '#ddd6fe' }]}>
            <Ionicons name="infinite" size={18} color="#7c3aed" />
            <Text style={[styles.infoText, { color: isDark ? '#c4b5fd' : '#6d28d9' }]}>
              Onindo books are permanently transferred to the receiver. Unlike regular library books, they don't come back.
            </Text>
          </View>

          {/* Book Cover Image */}
          <Text style={[styles.label, { color: textColor }]}>Book Cover Photo</Text>
          <TouchableOpacity onPress={handlePickImage} style={[styles.imagePicker, { backgroundColor: cardBg, borderColor }]}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <LinearGradient colors={['#7c3aed', '#a78bfa']} style={styles.imageIconBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="camera" size={28} color="#fff" />
                </LinearGradient>
                <Text style={[styles.imagePickerText, { color: textColor }]}>Tap to add book cover</Text>
                <Text style={[styles.imagePickerSub, { color: subColor }]}>Camera or Gallery</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Book Name */}
          <Text style={[styles.label, { color: textColor }]}>Book Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
            placeholder="Enter book name"
            placeholderTextColor={subColor}
            value={bookName}
            onChangeText={setBookName}
          />

          {/* Writer */}
          <Text style={[styles.label, { color: textColor }]}>Writer / Author</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
            placeholder="Enter writer name"
            placeholderTextColor={subColor}
            value={writer}
            onChangeText={setWriter}
          />

          {/* Details */}
          <Text style={[styles.label, { color: textColor }]}>About This Book</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor, color: textColor }]}
            placeholder="A short description about the book..."
            placeholderTextColor={subColor}
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={styles.submitBtn}
          >
            <LinearGradient
              colors={isSubmitting ? ['#94a3b8', '#94a3b8'] : ['#7c3aed', '#a78bfa']}
              style={styles.submitGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.submitText}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="infinite" size={20} color="#fff" />
                  <Text style={styles.submitText}>Share to Onindo</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoGrad: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  form: { padding: 20, gap: 6, paddingBottom: 50 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  label: { fontSize: 14, fontWeight: '700', marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: { minHeight: 100 },
  imagePicker: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: { width: '100%', height: 200 },
  imagePlaceholder: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  imageIconBg: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: { fontSize: 15, fontWeight: '700' },
  imagePickerSub: { fontSize: 13 },
  submitBtn: { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
  submitGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default AddOnindoBook;
