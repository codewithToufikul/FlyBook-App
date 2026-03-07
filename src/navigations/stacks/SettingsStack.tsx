import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Settings from '../../screens/SettingsScreens/Settings';
import PersonalInformation from '../../screens/SettingsScreens/PersonalInformation';
import UpdateName from '../../screens/SettingsScreens/UpdateName';
import UpdateEmail from '../../screens/SettingsScreens/UpdateEmail';
import UpdatePhone from '../../screens/SettingsScreens/UpdatePhone';
import SecurityPrivacy from '../../screens/SettingsScreens/SecurityPrivacy';
import ChangePassword from '../../screens/SettingsScreens/ChangePassword';
import ForgotPasswordReset from '../../screens/SettingsScreens/ForgotPasswordReset';
import PrivacyPolicy from '../../screens/SettingsScreens/PrivacyPolicy';
import HelpCenter from '../../screens/SettingsScreens/HelpCenter';

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} >
            <Stack.Screen name="SettingsMain" component={Settings} />
            <Stack.Screen name="PersonalInformation" component={PersonalInformation} />
            <Stack.Screen name="UpdateName" component={UpdateName} />
            <Stack.Screen name="UpdateEmail" component={UpdateEmail} />
            <Stack.Screen name="UpdatePhone" component={UpdatePhone} />
            <Stack.Screen name="SecurityPrivacy" component={SecurityPrivacy} />
            <Stack.Screen name="ChangePassword" component={ChangePassword} />
            <Stack.Screen name="ForgotPasswordReset" component={ForgotPasswordReset} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
            <Stack.Screen name="HelpCenter" component={HelpCenter} />
        </Stack.Navigator>
    );
}
