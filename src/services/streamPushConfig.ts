import {
  StreamVideoClient,
  StreamVideoRN,
} from '@stream-io/video-react-native-sdk';
import { AndroidImportance } from '@notifee/react-native';
import { getCachedStreamCredentials } from '../contexts/StreamVideoContext';

export function setupStreamPushConfig() {
  StreamVideoRN.setPushConfig({
    isExpo: false,
    ios: {
      pushProviderName: 'apn-flybook',
    },
    android: {
      pushProviderName: 'firebase-service-account',
      callChannel: {
        id: 'stream_call_notifications',
        name: 'Call notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      },
      incomingCallChannel: {
        id: 'stream_incoming_call',
        name: 'Incoming call notifications',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [500, 200, 500, 200],
      },
      incomingCallNotificationTextGetters: {
        getTitle: (createdUserName: string) =>
          `Incoming call from ${createdUserName}`,
        getBody: (_createdUserName: string) => 'Tap to answer',
      },
    },
    createStreamVideoClient: createStreamVideoClientForPush,
  });
}

/**
 * Creates a StreamVideoClient for background push notification handling.
 *
 * Background JS workers cannot make authenticated HTTP requests (no user
 * session / auth cookies). We use credentials cached in AsyncStorage from
 * the last time the user opened the app.
 *
 * Tokens are generated with a 24-hour expiry on the backend, so push
 * notifications work for the full 24 h after the user last opened the app.
 * If the token is expired, Stream SDK will throw and the push will be skipped
 * silently — the user will see the notification when they reopen the app.
 */
async function createStreamVideoClientForPush(): Promise<StreamVideoClient | undefined> {
  try {
    const credentials = await getCachedStreamCredentials();

    if (!credentials?.apiKey || !credentials?.userId || !credentials?.token) {
      console.warn('Push: No cached Stream credentials found');
      return undefined;
    }

    return StreamVideoClient.getOrCreateInstance({
      apiKey: credentials.apiKey,
      user: {
        id: credentials.userId,
        name: credentials.userName || 'User',
        image: credentials.userImage || undefined,
      },
      // Use a tokenProvider returning the cached token.
      // The background handler is short-lived, so a single token is fine.
      tokenProvider: async () => credentials.token,
    });
  } catch (error) {
    console.error('Push - createStreamVideoClient error:', error);
    return undefined;
  }
}
