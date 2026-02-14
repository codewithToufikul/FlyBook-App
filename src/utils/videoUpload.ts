import { Platform } from 'react-native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';

const CLOUDINARY_CLOUD_NAME = 'dljmobi4k';
const CLOUDINARY_UPLOAD_PRESET = 'flybook';

/**
 * Pick video from gallery
 */
export const pickVideoFromGallery = async (): Promise<Asset> => {
  return new Promise((resolve, reject) => {
    launchImageLibrary(
      {
        mediaType: 'video',
        quality: 1,
      },
      response => {
        if (response.didCancel) {
          reject(new Error('User cancelled video picker'));
        } else if (response.errorCode) {
          reject(new Error(response.errorMessage || 'Video picker error'));
        } else if (response.assets && response.assets[0]) {
          resolve(response.assets[0]);
        } else {
          reject(new Error('No video selected'));
        }
      },
    );
  });
};

/**
 * Upload video to Cloudinary
 */
export const uploadVideoToCloudinary = async (
  videoUri: string,
): Promise<string> => {
  try {
    const formData = new FormData();

    // Prepare the file object
    const file: any = {
      uri: Platform.OS === 'ios' ? videoUri.replace('file://', '') : videoUri,
      type: 'video/mp4',
      name: 'upload_video.mp4',
    };

    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    const data = await response.json();

    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.error('Cloudinary error:', data);
      throw new Error(
        data.error?.message || 'Failed to upload video to Cloudinary',
      );
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Handle pick and upload video workflow
 */
export const handleVideoUpload = async (): Promise<string> => {
  try {
    const selectedVideo = await pickVideoFromGallery();
    if (!selectedVideo.uri) throw new Error('No video URI found');

    const videoUrl = await uploadVideoToCloudinary(selectedVideo.uri);
    return videoUrl;
  } catch (error: any) {
    if (error.message === 'User cancelled video picker') {
      throw error;
    }
    console.error('Video upload workflow error:', error);
    throw error;
  }
};
