import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SearchBar from "../../screens/SearchScreens/SearchBar";
import SearcheResult from "../../screens/SearchScreens/SearcheResult";
import SearchBarComponent from "../../components/SearchBarComponent";

const Stack = createNativeStackNavigator();

const SearchStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen options={{
          headerTitle: () => <SearchBarComponent />, // ✅ header-এ SearchBar
          headerBackVisible: false,
        }} name="SearchBar" component={SearchBar} />
      <Stack.Screen name="SearchResult" component={SearcheResult} />
    </Stack.Navigator>
  )
}

export default SearchStack