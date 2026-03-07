import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OpinionHome from "../../screens/OpinionScreens/OpinionHome";
import CreateOpinion from "../../screens/OpinionScreens/CreateOpinion";
import OpinionDetails from "../../screens/OpinionScreens/OpinionDetails";
import EditOpinion from "../../screens/OpinionScreens/EditOpinion";
import UserProfile from "../../screens/HomeScreens/UserProfile";
import UserFriends from "../../screens/HomeScreens/UserFriends";
import ReportProfile from "../../screens/HomeScreens/ReportProfile";
import FullImageViewer from "../../screens/HomeScreens/FullImageViewer";
import UserLibrary from "../../screens/LibraryScreens/UserLibrary";
import PostDetails from "../../screens/HomeScreens/PostDetails";


const Stack = createNativeStackNavigator();

export default function OpinionStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen options={{ headerShown: false, title: "Opinions" }} name="Opinion" component={OpinionHome} />
            <Stack.Screen name="CreateOpinion"
                component={CreateOpinion}
                options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    headerShown: false,
                    title: "Create Opinion"
                }} />
            <Stack.Screen name="EditOpinion"
                component={EditOpinion}
                options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                    headerShown: false,
                    title: "Edit Opinion"
                }} />
            <Stack.Screen options={{
                headerShown: false,
                title: "Opinion Details"
            }} name="OpinionDetails" component={OpinionDetails} />
            <Stack.Screen name="UserProfile" component={UserProfile} options={{ headerShown: false }} />
            <Stack.Screen name="UserFriends" component={UserFriends} options={{ headerShown: false }} />
            <Stack.Screen name="ReportProfile" component={ReportProfile} options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="FullImageViewer" component={FullImageViewer} options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="UserLibrary" component={UserLibrary} options={{ headerShown: false }} />
            <Stack.Screen name="PostDetails" component={PostDetails} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}