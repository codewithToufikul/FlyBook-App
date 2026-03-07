import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SearchBar from "../../screens/SearchScreens/SearchBar";
import SearchResult from "../../screens/SearchScreens/SearchResult";
import SearchBarComponent from "../../components/SearchBarComponent";
import Profile from "../../screens/HomeScreens/Profile";
import OpinionDetails from "../../screens/OpinionScreens/OpinionDetails";
import EditOpinion from "../../screens/OpinionScreens/EditOpinion";
import UserProfile from "../../screens/HomeScreens/UserProfile";
import UserFriends from "../../screens/HomeScreens/UserFriends";
import ReportProfile from "../../screens/HomeScreens/ReportProfile";
import FullImageViewer from "../../screens/HomeScreens/FullImageViewer";
import UserLibrary from "../../screens/LibraryScreens/UserLibrary";


const Stack = createNativeStackNavigator();

const SearchStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SearchBar"
        component={SearchBar}
        options={{
          headerTitle: () => <SearchBarComponent />,
          title: "Search"
        }}
      />
      <Stack.Screen name="SearchResult" options={{
        title: "Search Result"
      }} component={SearchResult} />
      <Stack.Screen options={{ headerShown: false }} name="Profile" component={Profile} />
      <Stack.Screen name="OpinionDetails" component={OpinionDetails} options={{ headerShown: false }} />
      <Stack.Screen name="EditOpinion" component={EditOpinion} />
      <Stack.Screen name="UserProfile" component={UserProfile} options={{ headerShown: false }} />
      <Stack.Screen name="UserFriends" component={UserFriends} options={{ headerShown: false }} />
      <Stack.Screen name="ReportProfile" component={ReportProfile} options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="FullImageViewer" component={FullImageViewer} options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="UserLibrary" component={UserLibrary} options={{ headerShown: false }} />

    </Stack.Navigator>
  )
}

export default SearchStack