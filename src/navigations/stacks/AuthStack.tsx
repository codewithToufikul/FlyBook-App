import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '../../screens/AuthScreens/Login';
import Step1Name from '../../screens/AuthScreens/RegisterSteps/Step1Name';
import Step2Email from '../../screens/AuthScreens/RegisterSteps/Step2Email';
import Step3Verify from '../../screens/AuthScreens/RegisterSteps/Step3Verify';
import Step4Phone from '../../screens/AuthScreens/RegisterSteps/Step4Phone';
import Step5Password from '../../screens/AuthScreens/RegisterSteps/Step5Password';

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swipe back during registration
      }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen 
        name="Step1Name" 
        component={Step1Name}
        options={{ gestureEnabled: true }}
      />
      <Stack.Screen name="Step2Email" component={Step2Email} />
      <Stack.Screen name="Step3Verify" component={Step3Verify} />
      <Stack.Screen name="Step4Phone" component={Step4Phone} />
      <Stack.Screen name="Step5Password" component={Step5Password} />
    </Stack.Navigator>
  );
};

export default AuthStack;
