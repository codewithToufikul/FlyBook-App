import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StreamVideoClient,
  StreamVideo,
  User as StreamUser,
} from '@stream-io/video-react-native-sdk';
import { useAuth } from './AuthContext';
import { get } from '../services/api';
import { notificationService } from '../services/notificationService';
import RingingCallHandler from '../screens/CallScreens/RingingCallHandler';

const STREAM_CREDENTIALS_KEY = '@stream_video_credentials';

interface StreamVideoContextType {
  client: StreamVideoClient | null;
  isReady: boolean;
}

const StreamVideoContext = createContext<StreamVideoContextType>({
  client: null,
  isReady: false,
});

export const cacheStreamCredentials = async (
  apiKey: string,
  userId: string,
  userName: string,
  userImage: string,
  token: string,
) => {
  try {
    await AsyncStorage.setItem(
      STREAM_CREDENTIALS_KEY,
      JSON.stringify({ apiKey, userId, userName, userImage, token }),
    );
  } catch (e) {
    console.error('Failed to cache stream credentials:', e);
  }
};

export const getCachedStreamCredentials = async () => {
  try {
    const raw = await AsyncStorage.getItem(STREAM_CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearStreamCredentials = async () => {
  try {
    await AsyncStorage.removeItem(STREAM_CREDENTIALS_KEY);
  } catch { }
};

export const StreamVideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [isReady, setIsReady] = useState(false);
  const clientRef = useRef<StreamVideoClient | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      if (clientRef.current) {
        clientRef.current.disconnectUser();
        clientRef.current = null;
        setClient(null);
        setIsReady(false);
      }
      clearStreamCredentials();
      return;
    }

    let cancelled = false;

    const initStream = async () => {
      try {
        const response: any = await get('/api/stream/token');

        if (cancelled || !response.success) return;

        const { token, apiKey, userId } = response;
        const userName = user.name || 'User';
        const userImage = user.profileImage || '';

        await cacheStreamCredentials(apiKey, userId, userName, userImage, token);

        const streamUser: StreamUser = {
          id: userId,
          name: userName,
          image: userImage || undefined,
        };

        // tokenProvider is called automatically by the SDK whenever the current
        // token is about to expire (or already has). This means the client can
        // stay connected across the 24-hour expiry without any user interaction.
        const videoClient = StreamVideoClient.getOrCreateInstance({
          apiKey,
          user: streamUser,
          tokenProvider: async () => {
            const refreshResponse: any = await get('/api/stream/token');
            if (!refreshResponse?.success) {
              throw new Error('Failed to refresh Stream token');
            }
            const newToken = refreshResponse.token;
            await cacheStreamCredentials(
              apiKey,
              refreshResponse.userId,
              userName,
              userImage,
              newToken,
            );
            return newToken;
          },
        });

        if (cancelled) {
          videoClient.disconnectUser();
          return;
        }

        clientRef.current = videoClient;
        setClient(videoClient);
        setIsReady(true);

        notificationService.syncFcmTokenAfterAuth().catch(() => { });
      } catch (error) {
        console.error('Stream Video init error:', error);
      }
    };

    initStream();

    return () => {
      cancelled = true;
      if (clientRef.current) {
        clientRef.current.disconnectUser();
        clientRef.current = null;
        setClient(null);
        setIsReady(false);
      }
    };
  }, [isAuthenticated, user?._id]);

  if (!client) {
    return <>{children}</>;
  }

  return (
    <StreamVideoContext.Provider value={{ client, isReady }}>
      <StreamVideo client={client}>
        {children}
        <RingingCallHandler />
      </StreamVideo>
    </StreamVideoContext.Provider>
  );
};

export const useStreamVideo = () => useContext(StreamVideoContext);
