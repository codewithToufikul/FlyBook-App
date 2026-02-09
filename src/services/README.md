# FlyBook API Services

API integration layer for the FlyBook React Native application.

## Configuration

- **Base URL**: `https://fly-book-server-lzu4.onrender.com`
- **Authentication**: JWT Bearer tokens
- **Storage**: AsyncStorage for secure token management
- **Timeout**: 30 seconds

## Features

✅ Automatic JWT token injection via request interceptors  
✅ Global error handling with user-friendly messages  
✅ Token storage with AsyncStorage  
✅ TypeScript support with full type definitions  
✅ Automatic 401 handling (clears auth and redirects to login)  
✅ Network error handling  
✅ File upload support with progress tracking

---

## Usage Examples

### Authentication

```typescript
import { login, register, logout, getProfile } from '@/services';

// Login
try {
  const response = await login({
    email: 'user@example.com',
    password: 'password123',
  });
  
  if (response.success) {
    console.log('Logged in:', response.user);
    // Token is automatically saved
  }
} catch (error) {
  console.error('Login failed:', error.message);
}

// Register
try {
  const response = await register({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '+8801234567890',
  });
  
  if (response.success) {
    console.log('Registered:', response.user);
  }
} catch (error) {
  console.error('Registration failed:', error.message);
}

// Get Profile
try {
  const user = await getProfile();
  console.log('Current user:', user);
} catch (error) {
  console.error('Failed to get profile:', error.message);
}

// Logout
await logout();
```

### Making API Calls

```typescript
import { get, post, put, del } from '@/services';

// GET request
const books = await get('/books');

// POST request
const newBook = await post('/books', {
  title: 'My Book',
  author: 'John Doe',
});

// PUT request
const updatedBook = await put('/books/123', {
  title: 'Updated Title',
});

// DELETE request
await del('/books/123');
```

### File Uploads

```typescript
import { uploadFile } from '@/services';

const formData = new FormData();
formData.append('file', {
  uri: 'file://path/to/image.jpg',
  type: 'image/jpeg',
  name: 'image.jpg',
});

try {
  const response = await uploadFile(
    '/upload',
    formData,
    (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      console.log(`Upload progress: ${percentCompleted}%`);
    }
  );
  
  console.log('Upload successful:', response);
} catch (error) {
  console.error('Upload failed:', error.message);
}
```

### Token Management

```typescript
import { 
  getToken, 
  saveToken, 
  removeToken, 
  isAuthenticated 
} from '@/services';

// Check if authenticated
const authenticated = await isAuthenticated();

// Get token
const token = await getToken();

// Save token manually (usually done automatically by auth services)
await saveToken('your-jwt-token');

// Remove token
await removeToken();
```

### User Data Management

```typescript
import { getUser, saveUser, clearAuth } from '@/services';

// Get stored user
const user = await getUser();

// Save user data
await saveUser({
  _id: '123',
  name: 'John Doe',
  email: 'john@example.com',
});

// Clear all auth data
await clearAuth();
```

### Advanced Usage with Direct API Client

```typescript
import apiClient from '@/services/api';

// Use axios directly for custom requests
const response = await apiClient.get('/custom-endpoint', {
  params: { page: 1, limit: 10 },
  headers: { 'X-Custom-Header': 'value' },
});
```

---

## Error Handling

All API functions throw standardized error objects:

```typescript
{
  message: string;  // User-friendly error message
  status: number;   // HTTP status code
  data?: any;       // Raw error response from server
}
```

Common status codes:
- **0**: Network error / timeout
- **401**: Unauthorized (token cleared automatically)
- **403**: Forbidden
- **404**: Not found
- **500/502/503**: Server error

Example error handling:

```typescript
try {
  const data = await get('/some-endpoint');
} catch (error) {
  if (error.status === 401) {
    // User needs to login again
    navigation.navigate('Login');
  } else if (error.status === 0) {
    // Network issue
    Alert.alert('Network Error', 'Please check your internet connection');
  } else {
    // Other errors
    Alert.alert('Error', error.message);
  }
}
```

---

## TypeScript Types

### User

```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  coverImage?: string;
  role?: string;
  verified?: boolean;
  coins?: number;
  createdAt?: string;
}
```

### AuthResponse

```typescript
interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}
```

### LoginCredentials

```typescript
interface LoginCredentials {
  email: string;
  password: string;
}
```

### RegisterData

```typescript
interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}
```

---

## Environment Variables

No environment variables needed for basic setup. The base URL is hardcoded to:
```
https://fly-book-server-lzu4.onrender.com
```

To use a different backend URL (e.g., for development), modify the `BASE_URL` constant in `api.ts`.

---

## AsyncStorage Keys

- `@flybook_token` - JWT authentication token
- `@flybook_user` - User profile data

---

## Notes

- All authenticated requests automatically include the JWT token in the `Authorization` header
- Tokens are stored securely using AsyncStorage
- Network timeout is set to 30 seconds
- 401 responses automatically clear authentication data
- All API responses are typed with TypeScript
