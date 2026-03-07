import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Marketplace from "../../screens/MarketplaceScreens/Marketplace";
import ProductDetails from "../../screens/MarketplaceScreens/ProductDetails";
import CategoryProducts from "../../screens/MarketplaceScreens/CategoryProducts";
import Cart from "../../screens/MarketplaceScreens/Cart";
import MarketplaceSearch from "../../screens/MarketplaceScreens/MarketplaceSearch";
import Checkout from "../../screens/MarketplaceScreens/Checkout";
import MarketUser from "../../screens/MarketplaceScreens/MarketUser";
import SellerDashboard from "../../screens/MarketplaceScreens/SellerDashboard";

const Stack = createNativeStackNavigator();

const MarketplaceStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MarketplaceHome" component={Marketplace} />
            <Stack.Screen name="ProductDetails" component={ProductDetails} />
            <Stack.Screen name="CategoryProducts" component={CategoryProducts} />
            <Stack.Screen name="Cart" component={Cart} />
            <Stack.Screen name="MarketplaceSearch" component={MarketplaceSearch} />
            <Stack.Screen name="Checkout" component={Checkout} />
            <Stack.Screen name="MarketUser" component={MarketUser} />
            <Stack.Screen name="SellerDashboard" component={SellerDashboard} />
        </Stack.Navigator>
    );
};

export default MarketplaceStack;
