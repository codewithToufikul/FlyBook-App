import ImageResizer from 'react-native-image-resizer';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { Alert, Platform } from 'react-native';

const IMG_BB_API_KEY = '8b86a561b76cd59e16d93c1098c5018a'; // Replace with your ImgBB API key

interface ImagePickerOptions {
  mediaType: 'photo';
  quality: number;
  includeBase64?: boolean;
}

interface CompressOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

/**
 * Compress image using react-native-image-resizer
 */
export const compressImage = async (
  imageUri: string,
  options: CompressOptions = { maxWidth: 1024, maxHeight: 1024, quality: 80 },
): Promise<string> => {
  try {
    const { maxWidth, maxHeight, quality } = options;

    const compressed = await ImageResizer.createResizedImage(
      imageUri,
      maxWidth,
      maxHeight,
      'JPEG',
      quality,
      0,
      undefined,
      false,
      { mode: 'contain' },
    );

    return compressed.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

/**
 * Pick image from gallery
 */
export const pickImageFromGallery = async (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const options: ImagePickerOptions = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        reject(new Error('User cancelled image picker'));
      } else if (response.errorCode) {
        reject(new Error(response.errorMessage || 'Image picker error'));
      } else if (response.assets && response.assets[0]) {
        resolve(response.assets[0]);
      } else {
        reject(new Error('No image selected'));
      }
    });
  });
};

/**
 * Take photo using camera
 */
export const takePhotoWithCamera = async (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const options: ImagePickerOptions = {
      mediaType: 'photo',
      quality: 1,
    };

    launchCamera(options, response => {
      if (response.didCancel) {
        reject(new Error('User cancelled camera'));
      } else if (response.errorCode) {
        reject(new Error(response.errorMessage || 'Camera error'));
      } else if (response.assets && response.assets[0]) {
        resolve(response.assets[0]);
      } else {
        reject(new Error('No photo taken'));
      }
    });
  });
};

/**
 * Show image source selection (Gallery or Camera)
 */
export const showImageSourceSelector = (): Promise<'gallery' | 'camera'> => {
  return new Promise((resolve, reject) => {
    Alert.alert(
      'Upload Photo',
      'Choose photo source',
      [
        {
          text: 'Camera',
          onPress: () => resolve('camera'),
        },
        {
          text: 'Gallery',
          onPress: () => resolve('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => reject(new Error('User cancelled')),
        },
      ],
      { cancelable: true },
    );
  });
};

/**
 * Upload image to ImgBB
 */
export const uploadToImgBB = async (imageUri: string): Promise<string> => {
  try {
    // Create form data
    const formData = new FormData();

    // Get filename from uri
    const filename = imageUri.split('/').pop() || 'image.jpg';

    // Prepare file object
    const file: any = {
      uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
      type: 'image/jpeg',
      name: filename,
    };

    formData.append('image', file);

    // Upload to ImgBB
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMG_BB_API_KEY}`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    const data = await response.json();

    if (data.success && data.data?.url) {
      return data.data.url;
    } else {
      throw new Error('Failed to upload image to ImgBB');
    }
  } catch (error) {
    console.error('Error uploading to ImgBB:', error);
    throw error;
  }
};

/**
 * Complete image upload workflow with compression
 */
export const handleImageUpload = async (
  source?: 'gallery' | 'camera',
  compressOptions?: CompressOptions,
): Promise<string> => {
  try {
    // Get source if not provided
    let imageSource = source;
    if (!imageSource) {
      imageSource = await showImageSourceSelector();
    }

    // Pick or take image
    let selectedImage;
    if (imageSource === 'camera') {
      selectedImage = await takePhotoWithCamera();
    } else {
      selectedImage = await pickImageFromGallery();
    }

    if (!selectedImage?.uri) {
      throw new Error('No image selected');
    }

    // Compress image
    const compressedUri = await compressImage(
      selectedImage.uri,
      compressOptions || { maxWidth: 1024, maxHeight: 1024, quality: 80 },
    );

    // Upload to ImgBB
    const imageUrl = await uploadToImgBB(compressedUri);

    return imageUrl;
  } catch (error: any) {
    if (
      error.message === 'User cancelled' ||
      error.message === 'User cancelled image picker' ||
      error.message === 'User cancelled camera'
    ) {
      // User cancelled - don't show error
      throw error;
    }
    console.error('Error in image upload workflow:', error);
    throw error;
  }
};
