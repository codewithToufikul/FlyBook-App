import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SearchBar from "../../screens/SearchScreens/SearchBar";
import SearchResult from "../../screens/SearchScreens/SearchResult";
import SearchBarComponent from "../../components/SearchBarComponent";
import Profile from "../../screens/HomeScreens/Profile";
import OpinionDetails from "../../screens/OpinionScreens/OpinionDetails";

const Stack = createNativeStackNavigator();

const SearchStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SearchBar"
        component={SearchBar}
        options={{
          headerTitle: () => <SearchBarComponent />,
          title: "Search" // এটা back text হিসেবে কাজ করবে
        }}
      />
      <Stack.Screen name="SearchResult" options={{
        title: "Search Result"
      }} component={SearchResult} />
      <Stack.Screen options={{ headerShown: false }} name="Profile" component={Profile} />
      <Stack.Screen name="OpinionDetails" component={OpinionDetails} />
    </Stack.Navigator>
  )
}

export default SearchStack