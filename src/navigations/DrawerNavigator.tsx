import { createDrawerNavigator } from '@react-navigation/drawer';
import MainTabs from './MainTabs';
import Profile from '../screens/HomeScreens/Profile';
import CustomDrawer from '../components/CustomDrawer';

import SettingsStack from './stacks/SettingsStack';
import EditOpinion from '../screens/OpinionScreens/EditOpinion';


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
      <Drawer.Screen
        name="Settings"
        component={SettingsStack}
        options={{ title: 'Settings' }}
      />
      <Drawer.Screen
        name="EditOpinion"
        component={EditOpinion}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
    </Drawer.Navigator>

  );
}
