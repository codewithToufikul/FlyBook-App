import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Debug utility to check authentication state
 * Use this to troubleshoot authentication issues
 */
export const debugAuthState = async () => {
  try {
    console.log('\n🔍 ===== AUTH STATE DEBUG =====');

    // Check token
    const token = await AsyncStorage.getItem('@flybook_token');
    console.log('Token exists:', !!token);
    if (token) {
      console.log('Token preview:', `${token.substring(0, 30)}...`);
      console.log('Token length:', token.length);
    }

    // Check user data
    const userData = await AsyncStorage.getItem('@flybook_user');
    console.log('User data exists:', !!userData);
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('User ID:', user._id);
        console.log('User name:', user.name || user.userName);
        console.log('User email:', user.email);
        console.log('Complete user object:', JSON.stringify(user, null, 2));
      } catch (e) {
        console.error('Failed to parse user data:', e);
        console.log('Raw user data:', userData);
      }
    }

    // List all AsyncStorage keys
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('All AsyncStorage keys:', allKeys);

    console.log('===== END DEBUG =====\n');
  } catch (error) {
    console.error('Error in debugAuthState:', error);
  }
};

/**
 * Force re-login by clearing auth and showing instructions
 */
export const forceReLogin = async () => {
  try {
    await AsyncStorage.multiRemove(['@flybook_token', '@flybook_user']);
    console.log('✅ Auth data cleared. Please login again.');
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
};
