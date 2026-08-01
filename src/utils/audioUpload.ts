import { Platform } from 'react-native';
import { uploadToS3 } from './s3Upload';

export const uploadAudioToCloudinary = async (
  fileUri: string,
): Promise<string> => {
  try {
    const extension = fileUri.split('.').pop() || 'm4a';
    const result = await uploadToS3(fileUri, `audio/${extension}`, 'audios');
    return result.url;
  } catch (error: any) {
    console.error('Upload Audio Error to S3:', error);
    throw error;
  }
};
