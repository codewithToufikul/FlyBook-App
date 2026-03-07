import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { isFirebaseStreamVideoMessage } from '@stream-io/video-react-native-sdk';
import { put } from './api';
import * as NavigationService from './NavigationService';

const FCM_TOKEN_KEY = '@fcm_token';

class NotificationService {
  async registerAppWithFCM() {
    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
    }
  }

  async requestUserPermission() {
    // Android 13+ permission request
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      await this.getFcmToken();
    }
  }

  async getFcmToken() {
    try {
      const token = await messaging().getToken();
      if (token) {
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        await this.updateTokenOnServer(token);
      }
    } catch (error) {}
  }

  async updateTokenOnServer(token: string) {
    try {
      await put('/api/update-fcm-token', { fcmToken: token });
    } catch (error) {}
  }

  async syncFcmTokenAfterAuth() {
    try {
      let token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (!token) {
        token = await messaging().getToken();
        if (token) {
          await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        }
      }
      if (token) {
        await this.updateTokenOnServer(token);
      }
    } catch (error) {
      console.error('❌ Error syncing FCM token after auth:', error);
    }
  }

  private navigateNested(tab: string, screen: string, params?: object) {
    NavigationService.navigate('Main' as any, {
      screen: 'MainTabs',
      params: {
        screen: tab,
        params: { screen, ...(params ? { params } : {}) },
      },
    });
  }

  private navigateToLibraryTab(initialTab: string) {
    this.navigateNested('Home', 'Library', {
      screen: 'MyLibraryHome',
      params: { initialTab },
    });
  }

  handleNotificationNavigation(remoteMessage: any) {
    if (!remoteMessage?.data) return;

    const { type, senderId, senderName, postId } = remoteMessage.data;

    switch (type) {
      case 'MESSAGE':
        if (senderId) {
          this.navigateNested('Home', 'ChatRoom', {
            chatUser: {
              _id: senderId,
              name: senderName || 'User',
              isOnline: false,
            },
          });
        }
        break;

      case 'bookReq':
      case 'bookReqCl':
        this.navigateToLibraryTab('bookRequests');
        break;

      case 'bookReqAc':
        this.navigateToLibraryTab('myRequests');
        break;

      case 'bookReturn':
        this.navigateToLibraryTab('myBooks');
        break;

      case 'LIKE':
      case 'COMMENT':
      case 'OPINION_LIKE':
      case 'OPINION_COMMENT':
        if (postId) {
          this.navigateNested('Opinion', 'OpinionDetails', { postId });
        }
        break;

      case 'FOLLOW':
      case 'PROFILE_VIEW':
      case 'FRIEND_REQUEST':
        if (senderId) {
          this.navigateNested('Home', 'UserProfile', { userId: senderId });
        }
        break;

      case 'transfer_received':
      case 'transfer_sent':
      case 'withdraw_status':
        this.navigateNested('Home', 'Wallet');
        break;

      default:
        if (postId) {
          this.navigateNested('Opinion', 'OpinionDetails', { postId });
        } else if (senderId) {
          this.navigateNested('Home', 'UserProfile', { userId: senderId });
        }
        break;
    }
  }

  private waitForNavigationAndNavigate(remoteMessage: any, attempt = 0) {
    const maxAttempts = 10;
    const delay = attempt < 3 ? 500 : 1000;

    if (NavigationService.navigationRef.isReady()) {
      this.handleNotificationNavigation(remoteMessage);
      return;
    }

    if (attempt < maxAttempts) {
      setTimeout(() => {
        this.waitForNavigationAndNavigate(remoteMessage, attempt + 1);
      }, delay);
    }
  }

  setupNotificationListeners() {
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      try {
        if (isFirebaseStreamVideoMessage(remoteMessage)) return;

        const type = remoteMessage.data?.type as string | undefined;
        const isMessage = type === 'MESSAGE';
        const isBookEvent = [
          'bookReq',
          'bookReqCl',
          'bookReqAc',
          'bookReturn',
        ].includes(type || '');

        let toastType = 'socialNotification';
        if (isMessage) {
          toastType = 'incomingMessage';

          // Check if user is already in ChatRoom with this sender
          const currentRoute =
            NavigationService.navigationRef.getCurrentRoute();
          const chatUserId = (currentRoute?.params as any)?.chatUser?._id;

          if (
            currentRoute?.name === 'ChatRoom' &&
            chatUserId === remoteMessage.data?.senderId
          ) {
            return;
          }
        }

        Toast.show({
          type: toastType,
          text1:
            remoteMessage.notification?.title ||
            (isMessage
              ? 'New Message'
              : isBookEvent
              ? 'Library Update'
              : 'Notification'),
          text2: remoteMessage.notification?.body || '',
          onPress: () => {
            try {
              this.handleNotificationNavigation(remoteMessage);
            } catch (e) {
              console.error('Navigation from toast failed:', e);
            }
            Toast.hide();
          },
          visibilityTime: isBookEvent ? 5000 : 4000,
          autoHide: true,
          topOffset: 50,
        });
      } catch (error) {
        console.error('Error handling foreground notification:', error);
      }
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      try {
        this.handleNotificationNavigation(remoteMessage);
      } catch (error) {
        console.error('Error navigating from background notification:', error);
      }
    });

    // Handle when notification is clicked (quit state)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          this.waitForNavigationAndNavigate(remoteMessage);
        }
      });

    return () => {
      unsubscribeForeground();
    };
  }
}

export const notificationService = new NotificationService();
