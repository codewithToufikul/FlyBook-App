import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import NotificationScreen from "../../screens/NotificationScreens/NotificationScreen";
import Profile from "../../screens/HomeScreens/Profile";
import UserProfile from "../../screens/HomeScreens/UserProfile";
import OpinionDetails from "../../screens/OpinionScreens/OpinionDetails";
import FullImageViewer from "../../screens/HomeScreens/FullImageViewer";
import UserLibrary from "../../screens/LibraryScreens/UserLibrary";
import MyLibrary from "../../screens/LibraryScreens/MyLibrary";

const Stack = createNativeStackNavigator();

const NotificationStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="NotificationHome"
                component={NotificationScreen}
            />
            {/* Add shared screens that might be navigated to from notifications */}
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="UserProfile" component={UserProfile} />
            <Stack.Screen name="OpinionDetails" component={OpinionDetails} />
            <Stack.Screen name="FullImageViewer" component={FullImageViewer} />
            <Stack.Screen name="UserLibrary" component={UserLibrary} />
            <Stack.Screen name="MyLibrary" component={MyLibrary} />
        </Stack.Navigator>
    );
};

export default NotificationStack;
