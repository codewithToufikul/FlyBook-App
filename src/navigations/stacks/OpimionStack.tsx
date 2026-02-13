import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OpinionHome from "../../screens/OpinionScreens/OpinionHome";
import CreateOpinion from "../../screens/OpinionScreens/CreateOpinion";
import OpinionDetails from "../../screens/OpinionScreens/OpinionDetails";

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
            <Stack.Screen options={{
                title: "Opinion Details"
            }} name="OpinionDetails" component={OpinionDetails} />
        </Stack.Navigator>
    );
}