/**
 * @format
 */

import 'react-native-gesture-handler';

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

notifee.onBackgroundEvent(async (event) => {
  // General background event handling
});

messaging().setBackgroundMessageHandler(async (msg) => {
  // General Firebase background message handling
});

AppRegistry.registerComponent(appName, () => App);
