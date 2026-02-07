import HomeIcon from "../icons/HomeIcon";
import NearByIcon from "../icons/NearByIcon";
import NotificationIcon from "../icons/NotificationIcon";
import OpinionIcon from "../icons/OpinionIcon";
import SearchIcon from "../icons/SearchIcon";



type Props = {
    name: string;
    focused: boolean;
};

export default function TabBarIcon({ name, focused }: Props) {
    const color = focused ? '#0f766e' : '#9ca3af';

    switch (name) {
        case 'Home':
            return <HomeIcon size={26} color={color} />;

        case 'Opinion':
            return <OpinionIcon size={26} color={color} />;

        case 'Search':
            return <SearchIcon size={26} color={color} />;
        case 'Notifications':
            return <NotificationIcon size={26} color={color} />;
        case 'NearBooks':
            return <NearByIcon size={26} color={color} />;

        default:
            return <HomeIcon size={26} color={color} />;
    }
}
