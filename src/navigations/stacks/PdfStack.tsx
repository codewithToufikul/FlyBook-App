import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PdfHome from "../../screens/PdfScreens/PdfHome";
import ViewPdfBook from "../../screens/PdfScreens/ViewPdfBook";


const Stack = createNativeStackNavigator();

export default function PdfStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PdfHome" component={PdfHome} />
            <Stack.Screen name="ViewPdfBook" component={ViewPdfBook} />
        </Stack.Navigator>
    );
}