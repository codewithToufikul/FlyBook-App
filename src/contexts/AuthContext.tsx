import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { isAuthenticated, getUser, clearAuth, getToken } from '../services/api';
import { User, getProfile } from '../services/authServices';
import * as Keychain from 'react-native-keychain';
import { Linking } from 'react-native';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  loginUser: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const syncToKeychain = async (userData: User, tokenData: string) => {
    try {
      console.log('🔄 Attempting to sync to keychain...', { name: userData.name });
      const keychainData = JSON.stringify({
        token: tokenData,
        name: userData.name,
        profileImage: userData.profileImage,
        id: userData._id || (userData as any).id
      });
      console.log('📦 Keychain Data String:', keychainData);
      
      await Keychain.setGenericPassword('flybook_auth', keychainData);
      console.log('✅ Keychain.setGenericPassword Success');
    } catch (e) {
      console.error('❌ Keychain Sync Failed Error:', e);
    }
  };

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const hasToken = await isAuthenticated();
      if (hasToken) {
        const tokenData = await getToken();
        setToken(tokenData);
        const userData = await getProfile();
        setUser(userData);
        setAuthenticated(true);
        if (tokenData && userData) {
          syncToKeychain(userData, tokenData);
        }
      } else {
        setToken(null);
        setUser(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Try fallback to cached data if API fails
      const cachedUser = await getUser();
      if (cachedUser) {
        setUser(cachedUser);
        setAuthenticated(true);
      } else {
        setUser(null);
        setAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Deep Linking SSO Listener ---
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      console.log('🔗 [SSO] Incoming Link:', url);
      
      if (url.includes('flybook://sso-auth')) {
        // Extract target screen if provided (e.g. flybook://sso-auth?callback=flyconnect&target=chat:123)
        const targetMatch = url.match(/target=([^&]*)/);
        const target = targetMatch ? targetMatch[1] : null;

        if (authenticated && user && token) {
          try {
            const ssoDataRaw = {
              token,
              name: user.name,
              profileImage: user.profileImage,
              id: user._id || (user as any).id,
              target // Pass the target screen back to FlyConnect
            };
            const encodedData = encodeURIComponent(JSON.stringify(ssoDataRaw));
            const redirectUrl = `flyconnect://auth?data=${encodedData}`;
            
            console.log(`🚀 [SSO] Redirecting back to FlyConnect${target ? ' with target: ' + target : ''}...`);
            await Linking.openURL(redirectUrl);
          } catch (err) {
            console.error('❌ [SSO] Redirect Error:', err);
          }
        } else {
          console.warn('⚠️ [SSO] Shared Auth requested but user not logged into FlyBook');
        }
      }
    };

    // Handle background launch
    Linking.getInitialURL().then(url => {
        if (url) handleDeepLink({ url });
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [authenticated, user, token]);

  const loginUser = async (userData: User) => {
    setIsLoading(true);
    try {
      setUser(userData);
      setAuthenticated(true);
      const tokenData = await getToken();
      setToken(tokenData);
      const freshData = await getProfile();
      setUser(freshData);
      if (tokenData && freshData) {
        syncToKeychain(freshData, tokenData);
      }
    } catch (error) {
      console.error('Initial profile fetch failed, using login data');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await clearAuth();
      await Keychain.resetGenericPassword({
        service: 'com.flybook.shared'
      });
      setToken(null);
      setUser(null);
      setAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      const hasToken = await isAuthenticated();
      if (hasToken) {
        const tokenData = await getToken();
        setToken(tokenData);
        const userData = await getProfile();
        setUser(userData);
        setAuthenticated(true);
      }
    } catch (error) {
      console.error('Silent refresh failed:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: authenticated,
    setUser: (newUser) => {
      setUser(newUser);
      setAuthenticated(!!newUser);
    },
    loginUser,
    logout,
    refreshUser: refreshUserData,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
