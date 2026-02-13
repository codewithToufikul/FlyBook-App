import { post, get, saveToken, saveUser, clearAuth } from './api';

/**
 * Authentication API Services
 */

export interface LoginCredentials {
  number: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  number: string;
  password: string;
  userLocation: {
    latitude: number;
    longitude: number;
  };
  referrerUsername?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

/**
 * Map backend user data to frontend User interface
 * This ensures consistent field mapping regardless of backend response format
 */
const mapUserData = (userData: any): User => {
  console.log('🔄 Mapping user data:', JSON.stringify(userData, null, 2));

  // Try multiple possible field names for ID (Backend registration uses _id, login uses id)
  const userId = userData._id || userData.id || userData.userId || userData.ID;

  if (!userId) {
    console.error('❌ No user ID found in data!');
    console.error('Available fields:', Object.keys(userData));
    // Check if we can extract it from nested objects if applicable
    throw new Error('User ID not found in user data');
  }

  const mappedUser: User = {
    _id: userId,
    name: userData.name || userData.fullName || userData.userName || '',
    email: userData.email || userData.emailAddress || '',
    phone: userData.number || userData.phone || userData.phoneNumber || '',
    profileImage:
      userData.profileImage || userData.profile_image || userData.avatar || '',
    coverImage: userData.coverImage || userData.cover_image || '',
    role: userData.role || 'user',
    verified: userData.verificationStatus || userData.verified || false,
    coins: userData.flyWallet || userData.coins || 0,
    createdAt: userData.createdAt || userData.created_at || '',
    userName: userData.userName || userData.username || userData.name || '',
    work: userData.work || userData.occupation || '',
    studies: userData.studies || userData.education || '',
    currentCity: userData.currentCity || userData.current_city || '',
    hometown: userData.hometown || userData.home_town || '',
    flyWallet: userData.flyWallet || userData.fly_wallet || 0,
    wallet: userData.wallet || 0,
    friendRequestsSent: userData.friendRequestsSent || [],
    friendRequestsReceived: userData.friendRequestsReceived || [],
    friends: userData.friends || [],
    referrerId: userData.referrerId || userData.referrer_id || null,
    referrerName: userData.referrerName || userData.referrer_name || null,
  };

  console.log('✅ Mapped user:', {
    _id: mappedUser._id,
    name: mappedUser.name,
    email: mappedUser.email,
  });

  return mappedUser;
};

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
  userName?: string;
  work?: string;
  studies?: string;
  currentCity?: string;
  hometown?: string;
  flyWallet?: number;
  wallet?: number;
  friendRequestsSent?: string[];
  friendRequestsReceived?: string[];
  friends?: string[];
  referrerId?: string | null;
  referrerName?: string | null;
}

/**
 * User login
 */
export const login = async (
  credentials: LoginCredentials,
): Promise<AuthResponse> => {
  try {
    const response = await post<AuthResponse>('/users/login', credentials);

    // Save token and user data if login successful
    if (response.success && response.token) {
      await saveToken(response.token);

      // Fetch fresh user data from backend using the new token
      try {
        const userData = await getProfile();
        const mappedUser = mapUserData(userData);
        await saveUser(mappedUser);
      } catch (profileError) {
        console.error('Failed to fetch profile after login:', profileError);
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

      // Fetch fresh user data from backend using the new token
      try {
        const userData = await getProfile();
        // User data already saved in getProfile()
      } catch (profileError) {
        console.error(
          'Failed to fetch profile after registration:',
          profileError,
        );
        // If profile fetch fails, use data from registration response as fallback
        if (response.user) {
          console.log('📝 Using registration response user data as fallback');
          const mappedUser = mapUserData(response.user);
          await saveUser(mappedUser);
        }
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
 * Get current user profile from backend
 */
export const getProfile = async (): Promise<User> => {
  try {
    // Backend returns user data directly (not wrapped in {user: ...})
    const userData = await get<any>('/profile');

    // Debug: Log the raw backend response
    console.log(
      '🔍 Backend /profile response:',
      JSON.stringify(userData, null, 2),
    );
    console.log('🔍 Available fields:', Object.keys(userData));

    // Map backend response to User interface
    // Try multiple possible field names for ID
    const userId =
      userData._id || userData.id || userData.userId || userData.ID;

    if (!userId) {
      console.error('❌ No user ID found in backend response!');
      console.error('Backend data:', userData);
      throw new Error('User ID not found in profile response');
    }

    const user: User = {
      _id: userId,
      name: userData.name || userData.fullName || userData.userName || '',
      email: userData.email || userData.emailAddress || '',
      phone: userData.number || userData.phone || userData.phoneNumber || '',
      profileImage:
        userData.profileImage ||
        userData.profile_image ||
        userData.avatar ||
        '',
      coverImage: userData.coverImage || userData.cover_image || '',
      role: userData.role || 'user',
      verified: userData.verificationStatus || userData.verified || false,
      coins: userData.flyWallet || userData.coins || 0,
      createdAt: userData.createdAt || userData.created_at || '',
      userName: userData.userName || userData.username || userData.name || '',
      work: userData.work || userData.occupation || '',
      studies: userData.studies || userData.education || '',
      currentCity: userData.currentCity || userData.current_city || '',
      hometown: userData.hometown || userData.home_town || '',
      flyWallet: userData.flyWallet || userData.fly_wallet || 0,
      wallet: userData.wallet || 0,
      friendRequestsSent: userData.friendRequestsSent || [],
      friendRequestsReceived: userData.friendRequestsReceived || [],
      friends: userData.friends || [],
      referrerId: userData.referrerId || userData.referrer_id || null,
      referrerName: userData.referrerName || userData.referrer_name || null,
    };

    console.log('✅ Mapped user object:', {
      _id: user._id,
      name: user.name,
      email: user.email,
      userName: user.userName,
    });

    // Update local user data
    await saveUser(user);

    return user;
  } catch (error: any) {
    console.error('❌ Get profile error:', error);
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
    const response = await post<{ success: boolean; user: User }>(
      '/profile/update',
      data,
    );

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
      },
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
      },
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
export const requestPasswordReset = async (
  email: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await post<{ success: boolean; message: string }>(
      '/users/forgot-password',
      { email },
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
  newPassword: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await post<{ success: boolean; message: string }>(
      '/users/reset-password',
      { token, newPassword },
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
export const verifyEmail = async (
  token: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await post<{ success: boolean; message: string }>(
      '/users/verify-email',
      { token },
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
export const checkEmailExists = async (
  email: string,
): Promise<{ exists: boolean }> => {
  try {
    const response = await post<{ exists: boolean }>('/users/check-email', {
      email,
    });
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
export const deleteAccount = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await post<{ success: boolean; message: string }>(
      '/users/delete-account',
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
