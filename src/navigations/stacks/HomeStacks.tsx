
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../../screens/HomeScreens/Home';
import Chats from '../../screens/HomeScreens/Chats';
import Profile from '../../screens/HomeScreens/Profile';
import PdfStack from './PdfStack';
import ChannelStack from './ChannelStacks';
import LearningStack from './LearningStack';
import MarketplaceStack from './MarketplaceStack';
import Peoples from '../../screens/CommunityScreens/Peoples';


const Stack = createNativeStackNavigator();

export default function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} >
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Chats" component={Chats} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="PdfStack" component={PdfStack} />
            <Stack.Screen name="Channels" component={ChannelStack} />
            <Stack.Screen name="ELearning" component={LearningStack} />
            <Stack.Screen name="Marketplace" component={MarketplaceStack} />
            <Stack.Screen name="Peoples" component={Peoples} />
        </Stack.Navigator>
    );
}
