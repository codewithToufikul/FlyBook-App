import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { isAuthenticated, getUser, clearAuth } from '../services/api';
import { User, getProfile } from '../services/authServices';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  loginUser: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const hasToken = await isAuthenticated();
      if (hasToken) {
        const userData = await getProfile();
        setUser(userData);
        setAuthenticated(true);
      } else {
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

  const loginUser = async (userData: User) => {
    setIsLoading(true);
    try {
      setUser(userData);
      setAuthenticated(true);
      // Fetch fresh profile data in background to ensure all fields are mapped
      const freshData = await getProfile();
      setUser(freshData);
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
