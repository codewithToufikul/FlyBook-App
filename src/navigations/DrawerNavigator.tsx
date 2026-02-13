import { createDrawerNavigator } from '@react-navigation/drawer';
import MainTabs from './MainTabs';
import Profile from '../screens/HomeScreens/Profile';
import CustomDrawer from '../components/CustomDrawer';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: {
          width: '80%',
          backgroundColor: 'transparent',
        },
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ title: 'Home' }}
      />
      <Drawer.Screen
        name="Profile"
        component={Profile}
        options={{ title: 'Profile' }}
      />
    </Drawer.Navigator>
  );
}
