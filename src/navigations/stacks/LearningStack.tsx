import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ELearning from "../../screens/LearningScreens/ELearning";
import CourseDetails from "../../screens/LearningScreens/CourseDetails";
import CoursePlayer from "../../screens/LearningScreens/CoursePlayer";


const Stack = createNativeStackNavigator();

export default function LearningStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ELearningList" component={ELearning} />
            <Stack.Screen name="CourseDetails" component={CourseDetails} />
            <Stack.Screen name="CoursePlayer" component={CoursePlayer} />
        </Stack.Navigator>
    );
}
