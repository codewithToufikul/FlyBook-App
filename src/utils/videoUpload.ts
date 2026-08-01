import { Platform } from 'react-native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { uploadToS3 } from './s3Upload';

const CLOUDINARY_CLOUD_NAME = 'duyrnfagi';
const CLOUDINARY_UPLOAD_PRESET = 'flybook_video';

import { Video } from 'react-native-compressor';

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
 * Upload video to S3 after compression
 */
export const uploadVideoToCloudinary = async (
  videoUri: string,
): Promise<string> => {
  try {
    console.log('Starting native video compression...');
    const compressedUri = await Video.compress(
      videoUri,
      {
        compressionMethod: 'auto',
      },
      progress => {
        console.log(`Video compression progress: ${Math.round(progress * 100)}%`);
      },
    );
    console.log('Video compression complete. Uploading to S3...');

    const result = await uploadToS3(compressedUri, 'video/mp4', 'videos');
    return result.url;
  } catch (error) {
    console.error('Error compressing or uploading video to S3:', error);
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
