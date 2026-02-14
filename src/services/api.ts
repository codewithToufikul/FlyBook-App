import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ============================================
// BASE URL CONFIGURATION
// ============================================
// Choose one based on your setup:

// 1. FOR LOCAL DEVELOPMENT:
// - iOS Simulator: Use 'localhost' or '127.0.0.1'
// - Android Emulator: Use '10.0.2.2' (special Android emulator localhost)
// - Physical Device: Use your computer's IP (e.g., '192.168.1.100')

// 2. FOR PRODUCTION:
// - Use: 'https://fly-book-server-lzu4.onrender.com'

// Current configuration (change as needed):
const USE_LOCAL_SERVER = true; // Set to false for production

const PRODUCTION_URL = 'https://fly-book-server-lzu4.onrender.com';

// For local development - automatically detects platform
const LOCAL_URL = Platform.select({
  ios: 'http://localhost:3000', // iOS Simulator
  android: 'http://10.0.2.2:3000', // Android Emulator
  default: 'http://localhost:3000',
});

// IMPORTANT: If testing on physical device, replace with your computer's IP:
// const LOCAL_URL = 'http://192.168.1.100:3000'; // Replace with your IP

const BASE_URL = USE_LOCAL_SERVER ? LOCAL_URL : PRODUCTION_URL;

console.log('🌐 API Base URL:', BASE_URL);

// Storage keys
const TOKEN_KEY = '@flybook_token';
const USER_KEY = '@flybook_user';

/**
 * Core axios instance with interceptors
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Adds JWT token to all requests
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      // Debug logging
      console.log('🔑 Request Interceptor Debug:');
      console.log('  - URL:', config.url);
      console.log('  - Token exists:', !!token);
      console.log(
        '  - Token preview:',
        token ? `${token.substring(0, 20)}...` : 'null',
      );

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(
          '  - Authorization header set:',
          `Bearer ${token.substring(0, 20)}...`,
        );
      } else {
        console.warn('  - ⚠️ No token found or headers unavailable!');
      }

      return config;
    } catch (error) {
      console.error('❌ Error reading token from storage:', error);
      return config;
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * Response interceptor - Handles errors globally
 */
apiClient.interceptors.response.use(
  response => {
    // Return successful responses as-is
    return response;
  },
  async (error: AxiosError) => {
    if (!error.response) {
      // Network error or timeout
      console.error('Network Error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0,
        error: error.message,
      });
    }

    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Unauthorized - Clear token and redirect to login
        console.warn('Unauthorized access - clearing token');
        await clearAuth();
        return Promise.reject({
          message: 'Session expired. Please login again.',
          status: 401,
          data,
        });

      case 403:
        // Forbidden
        return Promise.reject({
          message: 'You do not have permission to access this resource.',
          status: 403,
          data,
        });

      case 404:
        // Not found
        return Promise.reject({
          message: 'Resource not found.',
          status: 404,
          data,
        });

      case 500:
      case 502:
      case 503:
        // Server errors
        return Promise.reject({
          message: 'Server error. Please try again later.',
          status,
          data,
        });

      default:
        // Other errors
        return Promise.reject({
          message: (data as any)?.message || 'An error occurred.',
          status,
          data,
        });
    }
  },
);

/**
 * Token Management Functions
 */

/**
 * Save authentication token to secure storage
 */
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token:', error);
    throw error;
  }
};

/**
 * Get authentication token from storage
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Remove authentication token from storage
 */
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

/**
 * Save user data to storage
 */
export const saveUser = async (user: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

/**
 * Get user data from storage
 */
export const getUser = async (): Promise<any | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuth = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};

/**
 * API Helper Functions
 */

/**
 * GET request
 */
export const get = async <T = any>(url: string, config?: any): Promise<T> => {
  const response = await apiClient.get<T>(url, config);
  return response.data;
};

/**
 * POST request
 */
export const post = async <T = any>(
  url: string,
  data?: any,
  config?: any,
): Promise<T> => {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
};

/**
 * PUT request
 */
export const put = async <T = any>(
  url: string,
  data?: any,
  config?: any,
): Promise<T> => {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
};

/**
 * PATCH request
 */
export const patch = async <T = any>(
  url: string,
  data?: any,
  config?: any,
): Promise<T> => {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
};

/**
 * DELETE request
 */
export const del = async <T = any>(url: string, config?: any): Promise<T> => {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
};

/**
 * Upload file with multipart/form-data
 */
export const uploadFile = async <T = any>(
  url: string,
  formData: FormData,
  onUploadProgress?: (progressEvent: any) => void,
): Promise<T> => {
  const response = await apiClient.post<T>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

// Export the axios instance for advanced usage
export default apiClient;
