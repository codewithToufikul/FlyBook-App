import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnindoLibrary from '../../screens/LibraryScreens/OnindoLibrary';
import AddOnindoBook from '../../screens/LibraryScreens/AddOnindoBook';

const Stack = createNativeStackNavigator();

export default function OnindoStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnindoLibraryHome" component={OnindoLibrary} />
      <Stack.Screen name="AddOnindoBook" component={AddOnindoBook} />
    </Stack.Navigator>
  );
}
