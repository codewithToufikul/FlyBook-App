import React from 'react'
import { createStackNavigator } from '@react-navigation/stack';
import GuestStack from './stacks/GuestStack';
import DrawerNavigator from './DrawerNavigator';


const isUserLoggedIn = true;

const Stack = createStackNavigator();

const RootNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isUserLoggedIn ? (
                <Stack.Screen name="Main" component={DrawerNavigator} />
            ) : (
                <Stack.Screen name="Guest" component={GuestStack} />
            )}
        </Stack.Navigator>
    )
}

export default RootNavigator