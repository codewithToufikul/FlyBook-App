import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MyLibrary from '../../screens/LibraryScreens/MyLibrary';
import AddBook from '../../screens/LibraryScreens/AddBook';
import UserLibrary from '../../screens/LibraryScreens/UserLibrary';
import BreachOfContract from '../../screens/LibraryScreens/BreachOfContract';
import BookConditionCameraScreen from '../../screens/LibraryScreens/BookConditionCameraScreen';

const Stack = createNativeStackNavigator();

export default function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyLibraryHome" component={MyLibrary} />
      <Stack.Screen name="AddBook" component={AddBook} />
      <Stack.Screen name="UserLibrary" component={UserLibrary} />
      <Stack.Screen name="BreachOfContract" component={BreachOfContract} />
      <Stack.Screen name="BookConditionCamera" component={BookConditionCameraScreen} />
    </Stack.Navigator>
  );
}
