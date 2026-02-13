import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Marketplace from "../../screens/MarketplaceScreens/Marketplace";
import ProductDetails from "../../screens/MarketplaceScreens/ProductDetails";
import CategoryProducts from "../../screens/MarketplaceScreens/CategoryProducts";

const Stack = createNativeStackNavigator();

const MarketplaceStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MarketplaceHome" component={Marketplace} />
            <Stack.Screen name="ProductDetails" component={ProductDetails} />
            <Stack.Screen name="CategoryProducts" component={CategoryProducts} />
        </Stack.Navigator>
    );
};

export default MarketplaceStack;
