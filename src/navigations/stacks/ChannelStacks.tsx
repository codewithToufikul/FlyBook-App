import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Channels from "../../screens/ChannelScreens/Channels";
import ChannelChat from "../../screens/ChannelScreens/ChannelChat";


const Stack = createNativeStackNavigator();

export default function ChannelStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ChannelList" component={Channels} />
            <Stack.Screen name="ChannelChat" component={ChannelChat} />
        </Stack.Navigator>
    );
}
