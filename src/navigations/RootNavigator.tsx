import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';
import MainTabs from './MainTabs';
import GuestStack from './stacks/GuestStack';


const isUserLoggedIn = true;

const Stack = createStackNavigator();

const RootNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isUserLoggedIn ? (
                <Stack.Screen name="Main" component={MainTabs} />
            ) : (
                <Stack.Screen name="Guest" component={GuestStack} />
            )}
        </Stack.Navigator>
    )
}

export default RootNavigator