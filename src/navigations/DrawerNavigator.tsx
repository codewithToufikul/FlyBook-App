import { createDrawerNavigator } from '@react-navigation/drawer';
import MainTabs from './MainTabs';
import Profile from '../screens/HomeScreens/Profile';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: 280,
        },
      }}
    >
      {/* Bottom Tabs inside Drawer */}
      <Drawer.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ title: 'Home' }}
      />

      {/* Extra drawer-only screen */}
      <Drawer.Screen
        name="Profile"
        component={Profile}
      />
    </Drawer.Navigator>
  );
}
