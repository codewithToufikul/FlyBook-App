# PDF Upload Utility for FlyBook App

This utility provides a complete solution for uploading PDF files to Cloudinary in React Native applications.

## 📦 Features

- ✅ PDF file picking from device storage
- ✅ File size validation (default: 10MB max)
- ✅ Upload progress tracking
- ✅ Cloudinary integration with preset configuration
- ✅ Error handling and user feedback
- ✅ TypeScript support
- ✅ Similar API to imageUpload utility

## 🚀 Installation

The required package `react-native-document-picker` has already been installed.

### iOS Setup (if needed)

```bash
cd ios && pod install && cd ..
```

### Android Setup

No additional setup required for Android.

## 📖 Usage

### Basic Usage (Recommended)

```typescript
import { handlePdfUpload } from '../utils/pdfupload';

const MyComponent = () => {
  const [uploading, setUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const uploadPdf = async () => {
    setUploading(true);
    try {
      const result = await handlePdfUpload(progress => {
        console.log(`Upload: ${progress}%`);
      });

      setPdfUrl(result.secureUrl);
      // Save to your backend
      // await api.post('/save-pdf', { url: result.secureUrl });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <TouchableOpacity onPress={uploadPdf} disabled={uploading}>
      <Text>{uploading ? 'Uploading...' : 'Upload PDF'}</Text>
    </TouchableOpacity>
  );
};
```

### With Progress Bar

```typescript
import { handlePdfUpload } from '../utils/pdfupload';

const [uploadProgress, setUploadProgress] = useState(0);

const uploadWithProgress = async () => {
  try {
    const result = await handlePdfUpload(progress => {
      setUploadProgress(progress);
    });

    Alert.alert('Success', 'PDF uploaded!');
  } catch (error) {
    Alert.alert('Error', 'Upload failed');
  }
};

// In your JSX:
<View>
  <ProgressBar progress={uploadProgress / 100} />
  <Text>{uploadProgress}%</Text>
</View>;
```

### Manual Control (Advanced)

```typescript
import {
  pickPdfFile,
  uploadPdfToCloudinary,
  validatePdfSize,
} from '../utils/pdfupload';

const manualUpload = async () => {
  try {
    // Step 1: Pick file
    const pdf = await pickPdfFile();

    // Step 2: Validate
    if (!validatePdfSize(pdf.size || 0, 5)) {
      Alert.alert('Error', 'File too large (max 5MB)');
      return;
    }

    // Step 3: Upload
    const result = await uploadPdfToCloudinary(pdf, progress => {
      console.log(`Progress: ${progress}%`);
    });

    console.log('Uploaded:', result.secureUrl);
  } catch (error) {
    console.error(error);
  }
};
```

## 🔧 API Reference

### `handlePdfUpload(onProgress?)`

Complete workflow: pick → validate → upload

**Parameters:**

- `onProgress?: (progress: number) => void` - Progress callback (0-100)

**Returns:** `Promise<PdfUploadResult>`

**Example:**

```typescript
const result = await handlePdfUpload(progress => {
  console.log(`${progress}%`);
});
```

---

### `pickPdfFile()`

Opens device file picker for PDF selection

**Returns:** `Promise<DocumentPickerResponse>`

**Example:**

```typescript
const pdf = await pickPdfFile();
console.log(pdf.name, pdf.size);
```

---

### `uploadPdfToCloudinary(pdfFile, onProgress?)`

Uploads PDF to Cloudinary

**Parameters:**

- `pdfFile: DocumentPickerResponse` - File from picker
- `onProgress?: (progress: number) => void` - Progress callback

**Returns:** `Promise<PdfUploadResult>`

**Example:**

```typescript
const result = await uploadPdfToCloudinary(pdfFile);
console.log(result.secureUrl);
```

---

### `validatePdfSize(fileSize, maxSizeMB?)`

Validates PDF file size

**Parameters:**

- `fileSize: number` - File size in bytes
- `maxSizeMB?: number` - Max size in MB (default: 10)

**Returns:** `boolean`

**Example:**

```typescript
if (!validatePdfSize(file.size, 5)) {
  Alert.alert('File too large');
}
```

---

### `showPdfUploadConfirmation(fileName, fileSize)`

Shows confirmation dialog before upload

**Parameters:**

- `fileName: string` - Name of the file
- `fileSize: number` - Size in bytes

**Returns:** `Promise<boolean>`

**Example:**

```typescript
const confirmed = await showPdfUploadConfirmation('doc.pdf', 1024000);
if (confirmed) {
  // Upload...
}
```

## 📊 Response Format

```typescript
interface PdfUploadResult {
  url: string; // HTTP URL
  publicId: string; // Cloudinary public ID (for deletion)
  secureUrl: string; // HTTPS URL (use this!)
  format: string; // File format (pdf)
  bytes: number; // File size in bytes
  originalFilename: string; // Original file name
}
```

## ⚙️ Configuration

Current Cloudinary settings:

- **Cloud Name:** `dljmobi4k`
- **Upload Preset:** `flybook`
- **Folder:** `flybook_pdfs`
- **Max Size:** 10MB (configurable)

To change settings, edit `/src/utils/pdfupload.ts`:

```typescript
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name';
const CLOUDINARY_UPLOAD_PRESET = 'your_preset';
```

## 🛡️ Error Handling

```typescript
try {
  const result = await handlePdfUpload();
} catch (error: any) {
  if (error.message === 'User cancelled PDF picker') {
    // User cancelled - no action needed
  } else if (error.message.includes('size exceeds')) {
    Alert.alert('Error', 'File too large');
  } else {
    Alert.alert('Error', 'Upload failed');
  }
}
```

## 📝 Common Use Cases

### 1. Upload with Size Limit

```typescript
const pdf = await pickPdfFile();
if (!validatePdfSize(pdf.size || 0, 5)) {
  Alert.alert('Error', 'Max 5MB allowed');
  return;
}
const result = await uploadPdfToCloudinary(pdf);
```

### 2. Upload Multiple PDFs

```typescript
const uploadMultiple = async () => {
  const urls = [];
  for (let i = 0; i < 3; i++) {
    const result = await handlePdfUpload();
    urls.push(result.secureUrl);
  }
  return urls;
};
```

### 3. Save to Backend

```typescript
const result = await handlePdfUpload();
await api.post('/documents', {
  title: 'My Document',
  pdfUrl: result.secureUrl,
  publicId: result.publicId,
  fileSize: result.bytes,
});
```

## 🔗 Related Files

- **Main Utility:** `/src/utils/pdfupload.ts`
- **Examples:** `/src/utils/pdfUploadExamples.ts`
- **Image Upload:** `/src/utils/imageUpload.ts` (similar pattern)

## 📱 Platform Support

- ✅ iOS (tested)
- ✅ Android (tested)

## 🐛 Troubleshooting

**Issue:** "No PDF file selected"

- **Solution:** User cancelled the picker. Handle this gracefully.

**Issue:** "File size exceeds limit"

- **Solution:** Compress PDF or increase limit in `validatePdfSize()`.

**Issue:** "Network error during upload"

- **Solution:** Check internet connection and Cloudinary credentials.

## 📄 License

Part of FlyBook App - Internal Use Only
