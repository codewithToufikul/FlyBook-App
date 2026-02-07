
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../../screens/HomeScreens/Home';
import Chats from '../../screens/HomeScreens/Chats';
import Profile from '../../screens/HomeScreens/Profile';


const Stack = createNativeStackNavigator();

export default function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} >
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Chats" component={Chats} />
            <Stack.Screen name="Profile" component={Profile} />
        </Stack.Navigator>
    );
}
