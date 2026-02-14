import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AudioBookHome from '../../screens/AudioBookScreens/AudioBookHome';
import AudioBookDetails from '../../screens/AudioBookScreens/AudioBookDetails';
import AudioPlayer from '../../screens/AudioBookScreens/AudioPlayer';

const Stack = createNativeStackNavigator();

const AudioBookStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AudioBookHome" component={AudioBookHome} />
            <Stack.Screen name="AudioBookDetails" component={AudioBookDetails} />
            <Stack.Screen
                name="AudioPlayer"
                component={AudioPlayer}
                options={{ presentation: 'modal' }} // Optional: show player as modal
            />
        </Stack.Navigator>
    );
};

export default AudioBookStack;
