import { pick } from '@react-native-documents/picker';
import { Alert, Platform } from 'react-native';

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'dljmobi4k';
const CLOUDINARY_UPLOAD_PRESET = 'flybook';
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;

// Type definition for picked document
interface PickedDocument {
  uri: string;
  name: string;
  type: string;
  size: number;
}

interface PdfUploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  format: string;
  bytes: number;
  originalFilename: string;
}

interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Pick PDF file from device storage
 */
export const pickPdfFile = async (): Promise<PickedDocument> => {
  try {
    const result = await pick({
      type: ['application/pdf'],
      allowMultiSelection: false,
    });

    // @react-native-documents/picker returns array directly
    if (result && result.length > 0) {
      const file = result[0];
      return {
        uri: file.uri,
        name: file.name || 'document.pdf',
        type: file.type || 'application/pdf',
        size: file.size || 0,
      };
    } else {
      throw new Error('No PDF file selected');
    }
  } catch (error: any) {
    // Check if user cancelled
    if (
      error?.message?.includes('cancelled') ||
      error?.code === 'DOCUMENT_PICKER_CANCELED'
    ) {
      throw new Error('User cancelled PDF picker');
    } else {
      console.error('Error picking PDF:', error);
      throw error;
    }
  }
};

/**
 * Validate PDF file size (default max: 10MB)
 */
export const validatePdfSize = (
  fileSize: number,
  maxSizeMB: number = 10,
): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
};

/**
 * Upload PDF to Cloudinary
 */
export const uploadPdfToCloudinary = async (
  pdfFile: PickedDocument,
  onProgress?: UploadProgressCallback,
): Promise<PdfUploadResult> => {
  try {
    // Validate file size (max 10MB)
    if (!validatePdfSize(pdfFile.size || 0, 10)) {
      throw new Error('PDF file size exceeds 10MB limit');
    }

    // Create form data
    const formData = new FormData();

    // Prepare file object for upload
    const file: any = {
      uri:
        Platform.OS === 'ios'
          ? pdfFile.uri.replace('file://', '')
          : pdfFile.uri,
      type: pdfFile.type || 'application/pdf',
      name: pdfFile.name || 'document.pdf',
    };

    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('resource_type', 'raw'); // Important for non-image files

    // Optional: Add folder organization
    formData.append('folder', 'flybook_pdfs');

    // Upload to Cloudinary with progress tracking
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      // Track upload progress
      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      // Handle upload completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);

            if (response.secure_url) {
              resolve({
                url: response.url,
                publicId: response.public_id,
                secureUrl: response.secure_url,
                format: response.format,
                bytes: response.bytes,
                originalFilename: pdfFile.name || 'document.pdf',
              });
            } else {
              reject(new Error('Failed to upload PDF to Cloudinary'));
            }
          } catch (parseError) {
            reject(new Error('Failed to parse Cloudinary response'));
          }
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      });

      // Handle upload errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during PDF upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('PDF upload was aborted'));
      });

      // Send request
      xhr.open('POST', CLOUDINARY_API_URL);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Error uploading PDF to Cloudinary:', error);
    throw error;
  }
};

/**
 * Complete PDF upload workflow with validation
 */
export const handlePdfUpload = async (
  onProgress?: UploadProgressCallback,
): Promise<PdfUploadResult> => {
  try {
    // Pick PDF file
    const selectedPdf = await pickPdfFile();

    if (!selectedPdf) {
      throw new Error('No PDF file selected');
    }

    // Show file info (optional)
    console.log('Selected PDF:', {
      name: selectedPdf.name,
      size: `${((selectedPdf.size || 0) / 1024 / 1024).toFixed(2)} MB`,
      type: selectedPdf.type,
    });

    // Upload to Cloudinary
    const uploadResult = await uploadPdfToCloudinary(selectedPdf, onProgress);

    return uploadResult;
  } catch (error: any) {
    if (error.message === 'User cancelled PDF picker') {
      // User cancelled - don't show error alert
      throw error;
    }

    console.error('Error in PDF upload workflow:', error);
    throw error;
  }
};

/**
 * Delete PDF from Cloudinary (requires backend API call with authentication)
 * This is a placeholder - actual deletion should be done via your backend
 */
export const deletePdfFromCloudinary = async (
  publicId: string,
): Promise<boolean> => {
  console.warn(
    'PDF deletion should be handled via backend API for security reasons',
  );
  console.log('Public ID to delete:', publicId);

  // TODO: Implement backend API call
  // Example: await api.delete(`/pdf/delete/${publicId}`);

  return false;
};

/**
 * Show PDF upload confirmation dialog
 */
export const showPdfUploadConfirmation = (
  fileName: string,
  fileSize: number,
): Promise<boolean> => {
  return new Promise(resolve => {
    Alert.alert(
      'Upload PDF',
      `Do you want to upload "${fileName}" (${(fileSize / 1024 / 1024).toFixed(
        2,
      )} MB)?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Upload',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true },
    );
  });
};
