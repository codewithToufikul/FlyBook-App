import { Platform } from 'react-native';

const CLOUDINARY_CLOUD_NAME = 'dljmobi4k';
const CLOUDINARY_UPLOAD_PRESET = 'flybook';

export const uploadAudioToCloudinary = async (
  fileUri: string,
): Promise<string> => {
  try {
    const formData = new FormData();

    // Prepare the file object
    const uri =
      Platform.OS === 'android' ? fileUri : fileUri.replace('file://', '');
    const extension = fileUri.split('.').pop() || 'm4a';

    const file: any = {
      uri: uri,
      type: `audio/${extension}`,
      name: `recording.${extension}`,
    };

    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('resource_type', 'video'); // Cloudinary uses 'video' for audio

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
      console.error('Cloudinary Error:', data);
      throw new Error(data.error?.message || 'Upload failed');
    }
  } catch (error: any) {
    console.error('Upload Audio Error:', error);
    throw error;
  }
};
