import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NearByBooks from '../../screens/BookScreens/NearByBooks';
import ProductDetails from '../../screens/MarketplaceScreens/ProductDetails';
import UserLibrary from '../../screens/LibraryScreens/UserLibrary';
import UserProfile from '../../screens/HomeScreens/UserProfile';

const Stack = createNativeStackNavigator();

export default function NearByBookStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="NearByBooks" component={NearByBooks} />
            <Stack.Screen name="ProductDetails" component={ProductDetails} />
            <Stack.Screen name="UserLibrary" component={UserLibrary} />
            <Stack.Screen name="UserProfile" component={UserProfile} />
        </Stack.Navigator>
    );
}
