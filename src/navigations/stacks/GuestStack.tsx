
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GuestHome from '../../screens/GuestScreens/GuestHome';
import GeustPostDetails from '../../screens/GuestScreens/GeustPostDetails';
import Login from '../../screens/AuthScreens/Login';

const Stack = createNativeStackNavigator();

export default function GuestStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} >
      <Stack.Screen name="GuestHome" component={GuestHome} />
      <Stack.Screen name="GeustPostDetails" component={GeustPostDetails} />
      <Stack.Screen name="Login" component={Login} />
    </Stack.Navigator>
  );
}
