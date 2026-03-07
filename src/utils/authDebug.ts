import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Debug utility to check authentication state
 * Use this to troubleshoot authentication issues
 */
export const debugAuthState = async () => {
  try {
    // Check user data
    const userData = await AsyncStorage.getItem('@flybook_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }

    // List all AsyncStorage keys
    const allKeys = await AsyncStorage.getAllKeys();
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
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
};
