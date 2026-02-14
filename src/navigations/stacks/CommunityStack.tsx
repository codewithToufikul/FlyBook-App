import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommunitiesScreen from '../../screens/CommunityScreens/CommunitiesScreen';
import CommunityDetailsScreen from '../../screens/CommunityScreens/CommunityDetailsScreen';
import CreateCommunityScreen from '../../screens/CommunityScreens/CreateCommunityScreen';

import CreatePostScreen from '../../screens/CommunityScreens/CreatePostScreen';
import CommunityCourseDetails from '../../screens/CommunityScreens/CommunityCourseDetails';
import CommunityCoursePlayer from '../../screens/CommunityScreens/CommunityCoursePlayer';
import CommunityStudentDashboard from '../../screens/CommunityScreens/CommunityStudentDashboard';
import CommunityExamRunner from '../../screens/CommunityScreens/CommunityExamRunner';
import CommunityExamGrading from '../../screens/CommunityScreens/CommunityExamGrading';

const Stack = createNativeStackNavigator();

const CommunityStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CommunitiesList" component={CommunitiesScreen} />
            <Stack.Screen name="CommunityDetails" component={CommunityDetailsScreen} />
            <Stack.Screen name="CreateCommunity" component={CreateCommunityScreen} />
            <Stack.Screen
                name="CreatePost"
                component={CreatePostScreen}
                options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="CommunityCourseDetails" component={CommunityCourseDetails} />
            <Stack.Screen name="CommunityCoursePlayer" component={CommunityCoursePlayer} />
            <Stack.Screen name="CommunityStudentDashboard" component={CommunityStudentDashboard} />
            <Stack.Screen
                name="CommunityExamRunner"
                component={CommunityExamRunner}
                options={{ presentation: 'fullScreenModal' }}
            />
            <Stack.Screen name="CommunityExamGrading" component={CommunityExamGrading} />
        </Stack.Navigator>
    );
};

export default CommunityStack;
