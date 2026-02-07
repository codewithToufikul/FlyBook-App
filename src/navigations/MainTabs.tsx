import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabBarIcon from '../components/TabBarIcon';
import HomeStack from './stacks/HomeStacks';
import SearchStack from './stacks/SearchStacks';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={({ route }) => ({
                headerShown: false,

                tabBarShowLabel: true, // ✅ label ON

                tabBarStyle: {
                    height: 64 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 6,
                },

                tabBarLabelStyle: {
                    fontSize: 10,
                    marginTop: 4,
                    fontWeight: '500',
                },

                tabBarActiveTintColor: '#0f766e',
                tabBarInactiveTintColor: '#9ca3af',

                tabBarIcon: ({ focused }) => (
                    <TabBarIcon name={route.name} focused={focused} />
                ),
            })}
        >
            <Tab.Screen name="NearBooks" component={HomeStack} />
            <Tab.Screen name="Notifications" component={SearchStack} />
            <Tab.Screen name="Search" component={SearchStack} />
            <Tab.Screen name="Opinion" component={HomeStack} />
            <Tab.Screen name="Home" component={HomeStack} />
        </Tab.Navigator>
    );
}
