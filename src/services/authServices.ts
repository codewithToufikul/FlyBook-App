import { post, get, saveToken, saveUser, clearAuth } from './api';

/**
 * Authentication API Services
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface User {
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

/**
 * User login
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await post<AuthResponse>('/users/login', credentials);
    
    // Save token and user data if login successful
    if (response.success && response.token) {
      await saveToken(response.token);
      if (response.user) {
        await saveUser(response.user);
      }
    }
    
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    throw {
      success: false,
      message: error.message || 'Login failed. Please try again.',
    };
  }
};

/**
 * User registration
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await post<AuthResponse>('/users/register', data);
    
    // Save token and user data if registration successful
    if (response.success && response.token) {
      await saveToken(response.token);
      if (response.user) {
        await saveUser(response.user);
      }
    }
    
    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    throw {
      success: false,
      message: error.message || 'Registration failed. Please try again.',
    };
  }
};

/**
 * User logout
 */
export const logout = async (): Promise<void> => {
  try {
    // Clear local authentication data
    await clearAuth();
    
    // Optionally call backend logout endpoint if it exists
    // await post('/users/logout');
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local data even if backend call fails
    await clearAuth();
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<User> => {
  try {
    const response = await get<{ user: User }>('/profile');
    
    // Update local user data
    if (response.user) {
      await saveUser(response.user);
    }
    
    return response.user;
  } catch (error: any) {
    console.error('Get profile error:', error);
    throw {
      message: error.message || 'Failed to fetch profile.',
    };
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (data: Partial<User>): Promise<User> => {
  try {
    const response = await post<{ success: boolean; user: User }>('/profile/update', data);
    
    // Update local user data
    if (response.user) {
      await saveUser(response.user);
    }
    
    return response.user;
  } catch (error: any) {
    console.error('Update profile error:', error);
    throw {
      message: error.message || 'Failed to update profile.',
    };
  }
};

/**
 * Update profile image
 */
export const updateProfileImage = async (imageUri: string): Promise<User> => {
  try {
    // Create FormData for image upload
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);
    
    const response = await post<{ success: boolean; user: User }>(
      '/profile/update',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    // Update local user data
    if (response.user) {
      await saveUser(response.user);
    }
    
    return response.user;
  } catch (error: any) {
    console.error('Update profile image error:', error);
    throw {
      message: error.message || 'Failed to update profile image.',
    };
  }
};

/**
 * Update cover image
 */
export const updateCoverImage = async (imageUri: string): Promise<User> => {
  try {
    // Create FormData for image upload
    const formData = new FormData();
    formData.append('coverImage', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'cover.jpg',
    } as any);
    
    const response = await post<{ success: boolean; user: User }>(
      '/profile/cover/update',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    // Update local user data
    if (response.user) {
      await saveUser(response.user);
    }
    
    return response.user;
  } catch (error: any) {
    console.error('Update cover image error:', error);
    throw {
      message: error.message || 'Failed to update cover image.',
    };
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await post<{ success: boolean; message: string }>(
      '/users/forgot-password',
      { email }
    );
    return response;
  } catch (error: any) {
    console.error('Password reset request error:', error);
    throw {
      success: false,
      message: error.message || 'Failed to request password reset.',
    };
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await post<{ success: boolean; message: string }>(
      '/users/reset-password',
      { token, newPassword }
    );
    return response;
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw {
      success: false,
      message: error.message || 'Failed to reset password.',
    };
  }
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await post<{ success: boolean; message: string }>(
      '/users/verify-email',
      { token }
    );
    return response;
  } catch (error: any) {
    console.error('Email verification error:', error);
    throw {
      success: false,
      message: error.message || 'Failed to verify email.',
    };
  }
};

/**
 * Check if email exists
 */
export const checkEmailExists = async (email: string): Promise<{ exists: boolean }> => {
  try {
    const response = await post<{ exists: boolean }>('/users/check-email', { email });
    return response;
  } catch (error: any) {
    console.error('Check email error:', error);
    throw {
      message: error.message || 'Failed to check email.',
    };
  }
};

/**
 * Refresh user token (if backend supports it)
 */
export const refreshToken = async (): Promise<{ token: string }> => {
  try {
    const response = await post<{ token: string }>('/users/refresh-token');
    
    if (response.token) {
      await saveToken(response.token);
    }
    
    return response;
  } catch (error: any) {
    console.error('Token refresh error:', error);
    throw {
      message: error.message || 'Failed to refresh token.',
    };
  }
};

/**
 * Delete user account
 */
export const deleteAccount = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await post<{ success: boolean; message: string }>(
      '/users/delete-account'
    );
    
    // Clear local data after successful deletion
    if (response.success) {
      await clearAuth();
    }
    
    return response;
  } catch (error: any) {
    console.error('Delete account error:', error);
    throw {
      success: false,
      message: error.message || 'Failed to delete account.',
    };
  }
};
