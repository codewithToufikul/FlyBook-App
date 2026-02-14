import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import JobHome from '../../screens/JobsScreens/JobHome';
import JobBoard from '../../screens/JobsScreens/JobBoard';
import FreelanceMarketplace from '../../screens/JobsScreens/FreelanceMarketplace';
import JobDetails from '../../screens/JobsScreens/JobDetails';
import MyApplications from '../../screens/JobsScreens/MyApplications';
import PostJob from '../../screens/JobsScreens/PostJob';
import EmployerDashboard from '../../screens/JobsScreens/EmployerDashboard';
import ClientDashboard from '../../screens/JobsScreens/ClientDashboard';
import EmployerRequest from '../../screens/JobsScreens/EmployerRequest';
import ProjectDetails from '../../screens/JobsScreens/ProjectDetails';
import PostProject from '../../screens/JobsScreens/PostProject';
import FreelancerDashboard from '../../screens/JobsScreens/FreelancerDashboard';

const Stack = createNativeStackNavigator();

const JobStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="JobHome" component={JobHome} />
            <Stack.Screen name="JobBoard" component={JobBoard} />
            <Stack.Screen name="FreelanceMarketplace" component={FreelanceMarketplace} />
            <Stack.Screen
                name="JobDetails"
                component={JobDetails}
                options={{ presentation: 'modal' }} // Optional: show details as modal
            />
            <Stack.Screen name="MyApplications" component={MyApplications} />
            <Stack.Screen name="PostJob" component={PostJob} />
            <Stack.Screen name="EmployerDashboard" component={EmployerDashboard} />
            <Stack.Screen name="ClientDashboard" component={ClientDashboard} />
            <Stack.Screen name="EmployerRequest" component={EmployerRequest} />
            <Stack.Screen name="ProjectDetails" component={ProjectDetails} />
            <Stack.Screen name="PostProject" component={PostProject} />
            <Stack.Screen name="FreelancerDashboard" component={FreelancerDashboard} />

        </Stack.Navigator>
    );
};

export default JobStack;
