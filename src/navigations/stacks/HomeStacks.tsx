
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from '../../screens/HomeScreens/Home';
import Chats from '../../screens/HomeScreens/Chats';
import Profile from '../../screens/HomeScreens/Profile';
import PostDetails from '../../screens/HomeScreens/PostDetails';
import EditOpinion from '../../screens/OpinionScreens/EditOpinion';
import UserProfile from '../../screens/HomeScreens/UserProfile';
import UserFriends from '../../screens/HomeScreens/UserFriends';
import ReportProfile from '../../screens/HomeScreens/ReportProfile';
import OpinionDetails from '../../screens/OpinionScreens/OpinionDetails';
import WalletScreen from '../../screens/HomeScreens/WalletScreen';
import WalletShopScreen from '../../screens/HomeScreens/WalletShopScreen';
import AddYourLocalShopScreen from '../../screens/HomeScreens/AddYourLocalShopScreen';
import ManageUserShopsScreen from '../../screens/HomeScreens/ManageUserShopsScreen';
import ShopProductsScreen from '../../screens/HomeScreens/ShopProductsScreen';
import ShopDetailsScreen from '../../screens/HomeScreens/ShopDetailsScreen';
import WalletSupportScreen from '../../screens/HomeScreens/WalletSupportScreen';
import AiAssistantScreen from '../../screens/HomeScreens/AiAssistantScreen';


import PdfStack from './PdfStack';
import ChannelStack from './ChannelStacks';
import LearningStack from './LearningStack';
import MarketplaceStack from './MarketplaceStack';
import Peoples from '../../screens/CommunityScreens/Peoples';
import AudioBookStack from './AudioBookStack';
import JobStack from './JobStack';
import OrganizationStack from './OrganizationStack';
import CommunityStack from './CommunityStack';
import LibraryStack from './LibraryStack';
import UserLibrary from '../../screens/LibraryScreens/UserLibrary';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} >
            <Stack.Screen name="HomeScreen" component={Home} />
            <Stack.Screen name="Chats" component={Chats} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="PostDetails" component={PostDetails} />
            <Stack.Screen name="EditOpinion" component={EditOpinion} />
            <Stack.Screen name="UserProfile" component={UserProfile} />
            <Stack.Screen name="UserFriends" component={UserFriends} options={{ headerShown: false }} />
            <Stack.Screen name="ReportProfile" component={ReportProfile} options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="OpinionDetails" component={OpinionDetails} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="WalletShop" component={WalletShopScreen} />
            <Stack.Screen name="AddYourLocalShop" component={AddYourLocalShopScreen} />
            <Stack.Screen name="ManageUserShops" component={ManageUserShopsScreen} />
            <Stack.Screen name="ShopProducts" component={ShopProductsScreen} />
            <Stack.Screen name="ShopDetails" component={ShopDetailsScreen} />
            <Stack.Screen name="WalletSupport" component={WalletSupportScreen} />
            <Stack.Screen name="AiAssistant" component={AiAssistantScreen} />

            <Stack.Screen name="PdfStack" component={PdfStack} />
            <Stack.Screen name="Channels" component={ChannelStack} />
            <Stack.Screen name="ELearning" component={LearningStack} />
            <Stack.Screen name="Marketplace" component={MarketplaceStack} />
            <Stack.Screen name="Peoples" component={Peoples} />
            <Stack.Screen name="AudioBooks" component={AudioBookStack} />
            <Stack.Screen name="EJobs" component={JobStack} />
            <Stack.Screen name="Organizations" component={OrganizationStack} />
            <Stack.Screen name="Communities" component={CommunityStack} />
            <Stack.Screen name="Library" component={LibraryStack} />
            <Stack.Screen name="UserLibrary" component={UserLibrary} />

        </Stack.Navigator>
    );
}
