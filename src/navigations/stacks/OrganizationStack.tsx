import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OrganizationsList from '../../screens/OrganizationScreens/OrganizationsListScreen';
import OrganizationDetails from '../../screens/OrganizationScreens/OrganizationDetailsScreen';
import AddOrganization from '../../screens/OrganizationScreens/AddOrganizationScreen';
import MyOrganizations from '../../screens/OrganizationScreens/MyOrganizationsScreen';
import OrgActivities from '../../screens/OrganizationScreens/OrgActivitiesScreen';
import AddActivity from '../../screens/OrganizationScreens/AddActivityScreen';
import ActivityDetails from '../../screens/OrganizationScreens/ActivityDetailsScreen';

const Stack = createNativeStackNavigator();

const OrganizationStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="OrganizationsList" component={OrganizationsList} />
            <Stack.Screen name="OrganizationDetails" component={OrganizationDetails} />
            <Stack.Screen name="AddOrganization" component={AddOrganization} />
            <Stack.Screen name="MyOrganizations" component={MyOrganizations} />
            <Stack.Screen name="OrgActivities" component={OrgActivities} />
            <Stack.Screen name="AddActivity" component={AddActivity} />
            <Stack.Screen name="ActivityDetails" component={ActivityDetails} />
        </Stack.Navigator>
    );
};

export default OrganizationStack;
