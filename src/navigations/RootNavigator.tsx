import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import AuthStack from './stacks/AuthStack';
import DrawerNavigator from './DrawerNavigator';
import SplashScreen from '../screens/AuthScreens/SplashScreen';
import ChatRoom from '../screens/HomeScreens/ChatRoom';
import FullImageViewer from '../screens/HomeScreens/FullImageViewer';
import VideoPlayer from '../screens/HomeScreens/VideoPlayer';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={DrawerNavigator} />
          <Stack.Screen name="ChatRoom" component={ChatRoom} />
          <Stack.Screen name="FullImageViewer" component={FullImageViewer} options={{ animation: 'fade' }} />
          <Stack.Screen name="VideoPlayer" component={VideoPlayer} options={{ animation: 'fade' }} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
