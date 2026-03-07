/**
 * @format
 */

import 'react-native-gesture-handler';

import { AppRegistry, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidCategory } from '@notifee/react-native';
import {
  isFirebaseStreamVideoMessage,
  firebaseDataHandler,
  isNotifeeStreamVideoEvent,
  onAndroidNotifeeEvent,
  oniOSNotifeeEvent,
} from '@stream-io/video-react-native-sdk';
import { setupStreamPushConfig } from './src/services/streamPushConfig';
import App from './App';
import { name as appName } from './app.json';

setupStreamPushConfig();

notifee.onBackgroundEvent(async (event) => {
  if (isNotifeeStreamVideoEvent(event)) {
    if (Platform.OS === 'android') {
      await onAndroidNotifeeEvent({ event, isBackground: true });
    } else {
      await oniOSNotifeeEvent({ event, isBackground: true });
    }
  }
});

messaging().setBackgroundMessageHandler(async (msg) => {
  if (isFirebaseStreamVideoMessage(msg)) {
    try {
      await firebaseDataHandler(msg.data);
    } catch (error) {
      console.error('firebaseDataHandler failed, showing fallback:', error);
      await showFallbackCallNotification(msg);
    }
  }
});

async function showFallbackCallNotification(msg) {
  try {
    const channelId = await notifee.createChannel({
      id: 'stream_incoming_call_fallback',
      name: 'Incoming Calls',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [500, 200, 500, 200],
    });

    const callerName =
      msg.data?.created_by_display_name ||
      msg.data?.sender_name ||
      'Someone';

    await notifee.displayNotification({
      title: `Incoming call from ${callerName}`,
      body: 'Tap to open the app',
      android: {
        channelId,
        category: AndroidCategory.CALL,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
        fullScreenAction: { id: 'default' },
        sound: 'default',
        lightUpScreen: true,
      },
    });
  } catch (e) {
    console.error('Fallback notification failed:', e);
  }
}

AppRegistry.registerComponent(appName, () => App);
