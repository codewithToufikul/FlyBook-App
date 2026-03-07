
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    Alert,
    Image,
    Modal,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import { get, post } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';
import { KeyboardAvoidingView, Platform, TextInput } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Location {
    _id: string;
    division: string;
    district: string;
    thana: string;
    union?: string;
    area?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

interface Shop {
    _id: string;
    shopName: string;
    shopImage: string;
    shopCategory: string;
    paymentPercentage: number;
    mapLocation: {
        lat: number;
        lng: number;
    };
    locationDetails?: {
        division: string;
        district: string;
        thana: string;
        union?: string;
        area?: string;
    };
    shopOwnerName?: string;
    contactNumber?: string;
}

const WalletShopScreen = () => {
    const navigation = useNavigation();
    const { isDark } = useTheme();
    const { user, refreshUser } = useAuth();
    const mapRef = useRef<MapView>(null);

    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState<Location[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [filteredShops, setFilteredShops] = useState<Shop[]>([]);

    // Cascading Location States
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedThana, setSelectedThana] = useState('');
    const [selectedUnion, setSelectedUnion] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const [mapRegion, setMapRegion] = useState({
        latitude: 23.8103,
        longitude: 90.4125,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    const [selectorVisible, setSelectorVisible] = useState(false);
    const [activeLevel, setActiveLevel] = useState('Division');

    // Advanced features states
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
    const [isNavigating, setIsNavigating] = useState(false);
    const [isMinimizedList, setIsMinimizedList] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    // Points Transfer Feature States
    const { hasPermission, requestPermission } = useCameraPermission();
    const [showScanner, setShowScanner] = useState(false);
    const device = useCameraDevice('back');
    const [pointTransferModalVisible, setPointTransferModalVisible] = useState(false);
    const [showMyQR, setShowMyQR] = useState(false);
    const [pointTransferAmount, setPointTransferAmount] = useState('');
    const [receiverUsernamePoints, setReceiverUsernamePoints] = useState('');
    const [isSubmittingPointTransfer, setIsSubmittingPointTransfer] = useState(false);

    const codeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned: (codes) => {
            if (codes.length > 0 && showScanner) {
                const scannedValue = codes[0].value;
                if (scannedValue) {
                    setReceiverUsernamePoints(scannedValue);
                    setShowScanner(false);
                    Toast.show({
                        type: 'success',
                        text1: 'QR Scanned',
                        text2: `Username: ${scannedValue}`,
                    });
                }
            }
        }
    });

    const handleOpenScanner = async () => {
        if (!hasPermission) {
            const granted = await requestPermission();
            if (!granted) {
                Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes');
                return;
            }
        }
        setShowScanner(true);
    };

    const handlePointTransferSubmit = async () => {
        if (!pointTransferAmount || Number(pointTransferAmount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        if (Number(pointTransferAmount) > (user?.flyWallet || 0)) {
            Alert.alert('Error', 'Insufficient FlyWallet (Points) balance');
            return;
        }

        if (!receiverUsernamePoints.trim()) {
            Alert.alert('Error', 'Please enter receiver username');
            return;
        }

        setIsSubmittingPointTransfer(true);
        try {
            const response = await post<{ success: boolean; message: string }>('/api/transfer-coins', {
                amount: Number(pointTransferAmount),
                receiverUsername: receiverUsernamePoints.trim(),
                walletType: 'flyWallet'
            });

            if (response?.success) {
                Alert.alert('Success', 'Points transferred successfully!');
                setPointTransferModalVisible(false);
                setPointTransferAmount('');
                setReceiverUsernamePoints('');
                refreshUser();
            } else {
                Alert.alert('Error', response?.message || 'Transfer failed');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'An error occurred');
        } finally {
            setIsSubmittingPointTransfer(false);
        }
    };

    const GOOGLE_MAPS_API_KEY = 'AIzaSyDcZJXvw3g1rN1eXF6QkepgvXniAYZvVn8';

    const memoizedMarkers = useMemo(() => filteredShops.map((shop) => (
        <Marker
            key={shop._id}
            coordinate={{
                latitude: shop.mapLocation.lat,
                longitude: shop.mapLocation.lng,
            }}
            tracksViewChanges={true}
        >
            <View style={styles.customMarker} collapsable={false}>
                <View style={styles.markerBadge}>
                    <Text style={styles.markerBadgeText}>{shop.paymentPercentage}%</Text>
                </View>
                <View style={styles.markerIconContainer}>
                    <Ionicons name="storefront" size={20} color="#FFF" />
                </View>
                <View style={styles.markerArrow} />
            </View>
            <Callout tooltip onPress={() => { }}>
                <View style={styles.customCallout}>
                    <View style={styles.calloutCard}>
                        <Image
                            source={{ uri: shop.shopImage }}
                            style={styles.calloutImg}
                            resizeMode="cover"
                        />
                        <View style={styles.calloutInfo}>
                            <Text style={styles.calloutTitle}>{shop.shopName}</Text>
                            <View style={styles.calloutBenefitRow}>
                                <Ionicons name="sparkles" size={14} color="#166534" />
                                <Text style={styles.calloutBenefit}>{shop.paymentPercentage}% Cash Benefit</Text>
                            </View>
                            <Text style={styles.calloutCategory}>{shop.shopCategory}</Text>
                        </View>
                    </View>
                    <View style={styles.calloutArrow} />
                </View>
            </Callout>
        </Marker>
    )), [filteredShops, isDark]);

    useEffect(() => {
        fetchData();

        // Get initial position and focus map
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const initialRegion = {
                    ...mapRegion,
                    latitude,
                    longitude,
                    latitudeDelta: 0.002,
                    longitudeDelta: 0.002,
                };
                setUserLocation({ latitude, longitude });
                setMapRegion(initialRegion);
                mapRef.current?.animateToRegion(initialRegion, 1000);
            },
            (error) => { },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );

        // Continuous location tracking for indicator
        const watchId = Geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude });
            },
            (error) => { },
            { enableHighAccuracy: true, distanceFilter: 10, interval: 5000, fastestInterval: 2000 }
        );

        return () => Geolocation.clearWatch(watchId);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [locRes, shopRes] = await Promise.all([
                get<{ success: boolean; data: Location[] }>('/api/locations'),
                get<{ success: boolean; data: Shop[] }>('/api/shops?status=active')
            ]);

            if (locRes?.success) setLocations(locRes.data);
            if (shopRes?.success) {
                setShops(shopRes.data);
                setFilteredShops(shopRes.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to load shop data');
        } finally {
            setLoading(false);
        }
    };

    const handleNearMe = () => {
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude });
                const newRegion = {
                    ...mapRegion,
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                };
                setMapRegion(newRegion);
                mapRef.current?.animateToRegion(newRegion, 1000);

                // Filter shops within 3km (approximate)
                const nearby = shops.filter(shop => {
                    const dist = getDistance(latitude, longitude, shop.mapLocation.lat, shop.mapLocation.lng);
                    return dist <= 3;
                });
                setFilteredShops(nearby);
            },
            (error) => Alert.alert('Error', 'Could not get your location. Please check permissions.'),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    const handleNavigate = async (shop: Shop) => {
        if (!userLocation) {
            Alert.alert('Location Required', 'Waiting for your current location...');
            return;
        }

        setIsNavigating(true);
        try {
            const coords = await fetchDirections(
                userLocation.latitude,
                userLocation.longitude,
                shop.mapLocation.lat,
                shop.mapLocation.lng
            );

            if (coords && coords.length > 0) {
                setRouteCoords(coords);

                // Fit map to show both user and shop
                mapRef.current?.fitToCoordinates([
                    { latitude: userLocation.latitude, longitude: userLocation.longitude },
                    { latitude: shop.mapLocation.lat, longitude: shop.mapLocation.lng }
                ], {
                    edgePadding: { top: 100, right: 100, bottom: 300, left: 100 },
                    animated: true,
                });
            } else {
                Alert.alert('Error', 'Could not find a route to this shop.');
            }
        } catch (error) {
            console.error('Navigation error:', error);
            Alert.alert('Error', 'An error occurred while fetching directions.');
        } finally {
            setIsNavigating(false);
        }
    };

    const fetchDirections = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&key=${GOOGLE_MAPS_API_KEY}`
            );
            const json = await response.json();

            if (json.routes.length > 0) {
                const points = decodePolyline(json.routes[0].overview_polyline.points);
                return points;
            }
            return [];
        } catch (error) {
            console.error('Directions API error:', error);
            return [];
        }
    };

    const decodePolyline = (t: string) => {
        let points = [];
        let index = 0, len = t.length;
        let lat = 0, lng = 0;
        while (index < len) {
            let b, shift = 0, result = 0;
            do {
                b = t.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;
            shift = 0;
            result = 0;
            do {
                b = t.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;
            points.push({ latitude: (lat / 1E5), longitude: (lng / 1E5) });
        }
        return points;
    };

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const deg2rad = (deg: number) => deg * (Math.PI / 180);

    const applyFilter = () => {
        if (!selectedDivision || !selectedDistrict || !selectedThana) {
            Alert.alert('Selection Required', 'Please select at least Division, District, and Thana');
            return;
        }

        const filtered = shops.filter(shop => {
            const loc = shop.locationDetails;
            if (!loc) return false;

            const matchesCategory = selectedCategory === 'All' || shop.shopCategory === selectedCategory;
            if (!matchesCategory) return false;

            const matchBase = loc.division === selectedDivision &&
                loc.district === selectedDistrict &&
                loc.thana === selectedThana;

            if (!matchBase) return false;

            const matchUnion = selectedUnion ? loc.union === selectedUnion : true;
            const matchArea = selectedArea ? loc.area === selectedArea : true;

            return matchUnion && matchArea;
        });

        setFilteredShops(filtered);
        setSelectorVisible(false);

        // Move map to the selected area center if available
        const matchedLoc = locations.find(loc =>
            loc.division === selectedDivision &&
            loc.district === selectedDistrict &&
            loc.thana === selectedThana &&
            (!selectedUnion || loc.union === selectedUnion) &&
            (!selectedArea || loc.area === selectedArea)
        );

        if (matchedLoc?.coordinates) {
            const newRegion = {
                ...mapRegion,
                latitude: Number(matchedLoc.coordinates.lat),
                longitude: Number(matchedLoc.coordinates.lng),
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
            };
            setMapRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 1000);
        }
    };

    const LocationSelector = () => {
        const getOptions = () => {
            switch (activeLevel) {
                case 'Division':
                    return Array.from(new Set(locations.map(l => l.division))).sort();
                case 'District':
                    return Array.from(new Set(locations.filter(l => l.division === selectedDivision).map(l => l.district))).sort();
                case 'Thana':
                    return Array.from(new Set(locations.filter(l => l.district === selectedDistrict).map(l => l.thana))).sort();
                case 'Union':
                    return Array.from(new Set(locations.filter(l => l.thana === selectedThana).map(l => l.union).filter(Boolean) as string[])).sort();
                case 'Area':
                    return Array.from(new Set(locations.filter(l => l.union === selectedUnion).map(l => l.area).filter(Boolean) as string[])).sort();
                default:
                    return [];
            }
        };

        const handleSelect = (item: string) => {
            if (activeLevel === 'Division') {
                setSelectedDivision(item);
                setSelectedDistrict('');
                setSelectedThana('');
                setSelectedUnion('');
                setSelectedArea('');
                setActiveLevel('District');
            } else if (activeLevel === 'District') {
                setSelectedDistrict(item);
                setSelectedThana('');
                setSelectedUnion('');
                setSelectedArea('');
                setActiveLevel('Thana');
            } else if (activeLevel === 'Thana') {
                setSelectedThana(item);
                setSelectedUnion('');
                setSelectedArea('');
                setActiveLevel('Union');
            } else if (activeLevel === 'Union') {
                setSelectedUnion(item);
                setSelectedArea('');
                setActiveLevel('Area');
            } else {
                setSelectedArea(item);
            }
        };

        return (
            <Modal visible={selectorVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDark && { backgroundColor: '#1E293B' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && { color: '#FFF' }]}>Select {activeLevel}</Text>
                            <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                                <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#333'} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.selectorTabWrapper}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.levelTabsContainer}
                            >
                                {['Division', 'District', 'Thana', 'Union', 'Area', 'Category'].map(level => (
                                    <TouchableOpacity
                                        key={level}
                                        onPress={() => setActiveLevel(level)}
                                        style={[styles.levelTab, activeLevel === level && styles.activeLevelTab]}
                                    >
                                        <Text style={[styles.levelTabText, activeLevel === level && styles.activeLevelTabText]}>{level}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <ScrollView style={styles.optionsList}>
                            {activeLevel === 'Category' ? (
                                ['All', ...Array.from(new Set(shops.map(s => s.shopCategory)))].sort().map((cat: string) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={styles.optionItem}
                                        onPress={() => setSelectedCategory(cat)}
                                    >
                                        <Text style={[styles.optionText, isDark && { color: '#F1F5F9' }]}>{cat}</Text>
                                        {selectedCategory === cat &&
                                            <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                getOptions().map((item: any) => (
                                    <TouchableOpacity
                                        key={item}
                                        style={styles.optionItem}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Text style={[styles.optionText, isDark && { color: '#F1F5F9' }]}>{item}</Text>
                                        {(activeLevel === 'Division' ? selectedDivision :
                                            activeLevel === 'District' ? selectedDistrict :
                                                activeLevel === 'Thana' ? selectedThana :
                                                    activeLevel === 'Union' ? selectedUnion : selectedArea) === item &&
                                            <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>

                        <TouchableOpacity style={styles.applyBtn} onPress={applyFilter}>
                            <Text style={styles.applyBtnText}>Apply Filter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    const DetailModal = () => {
        if (!selectedShop) return null;

        return (
            <Modal
                visible={detailModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.detailModalContent, isDark && { backgroundColor: '#1E293B' }]}>
                        <Image source={{ uri: selectedShop.shopImage }} style={styles.detailShopImg} />

                        <TouchableOpacity
                            style={styles.closeModalBtn}
                            onPress={() => setDetailModalVisible(false)}
                        >
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>

                        <View style={styles.detailInfoContainer}>
                            <View style={styles.detailHeaderRow}>
                                <Text style={[styles.detailShopName, isDark && { color: '#FFF' }]}>
                                    {selectedShop.shopName}
                                </Text>
                                <View style={styles.detailBenefitBadge}>
                                    <Text style={styles.detailBenefitText}>
                                        {selectedShop.paymentPercentage}% Benefit
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.detailCategory}>{selectedShop.shopCategory}</Text>

                            <View style={styles.detailDivider} />

                            <View style={styles.detailRow}>
                                <Ionicons name="person-outline" size={20} color="#64748B" />
                                <Text style={[styles.detailRowText, isDark && { color: '#CBD5E1' }]}>
                                    Owner: {selectedShop.shopOwnerName || 'N/A'}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Ionicons name="call-outline" size={20} color="#64748B" />
                                <Text style={[styles.detailRowText, isDark && { color: '#CBD5E1' }]}>
                                    {selectedShop.contactNumber || 'No contact provided'}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Ionicons name="location-outline" size={20} color="#64748B" />
                                <Text style={[styles.detailRowText, isDark && { color: '#CBD5E1' }]}>
                                    {selectedShop.locationDetails?.thana}, {selectedShop.locationDetails?.district}
                                </Text>
                            </View>

                            <View style={styles.detailActions}>
                                <TouchableOpacity
                                    style={[styles.actionBtnPrimary, { backgroundColor: '#10B981', marginBottom: 10 }]}
                                    onPress={() => {
                                        setDetailModalVisible(false);
                                        (navigation.navigate as any)('ShopDetails', { shop: selectedShop });
                                    }}
                                >
                                    <Ionicons name="eye-outline" size={20} color="#FFF" />
                                    <Text style={styles.actionBtnText}>View Products</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionBtnPrimary}
                                    onPress={() => {
                                        setDetailModalVisible(false);
                                        handleNavigate(selectedShop);
                                    }}
                                >
                                    <Ionicons name="navigate" size={20} color="#FFF" />
                                    <Text style={styles.actionBtnText}>Get Directions</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    const MenuModal = () => (
        <Modal
            visible={menuVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setMenuVisible(false)}
        >
            <TouchableOpacity
                style={styles.menuOverlay}
                activeOpacity={1}
                onPress={() => setMenuVisible(false)}
            >
                <View style={[styles.menuContent, isDark && { backgroundColor: '#1E293B' }]}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            setMenuVisible(false);
                            navigation.navigate('AddYourLocalShop' as never);
                        }}
                    >
                        <Ionicons name="add-circle-outline" size={20} color={isDark ? '#CBD5E1' : '#475569'} />
                        <Text style={[styles.menuItemText, isDark && { color: '#F1F5F9' }]}>Add Your Shop</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            setMenuVisible(false);
                            navigation.navigate('ManageUserShops' as never);
                        }}
                    >
                        <Ionicons name="briefcase-outline" size={20} color={isDark ? '#CBD5E1' : '#475569'} />
                        <Text style={[styles.menuItemText, isDark && { color: '#F1F5F9' }]}>Manage Your Shop</Text>
                    </TouchableOpacity>
                    <View style={styles.menuDivider} />
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            setMenuVisible(false);
                            (navigation.navigate as any)('WalletSupport');
                        }}
                    >
                        <Ionicons name="help-circle-outline" size={20} color={isDark ? '#CBD5E1' : '#475569'} />
                        <Text style={[styles.menuItemText, isDark && { color: '#F1F5F9' }]}>Help & Support</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const PointTransferModal = () => (
        <Modal
            visible={pointTransferModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setPointTransferModalVisible(false)}
        >
            <View style={styles.fullModalOverlay}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => setPointTransferModalVisible(false)} />
                <View style={[styles.premiumModalSheet, isDark && { backgroundColor: '#1E293B' }]}>
                    <View style={styles.modalDragIndicator} />
                    <Text style={[styles.modalHeading, isDark && { color: '#F1F5F9' }]}>Transfer Points</Text>

                    <View style={styles.modalInputGroup}>
                        <Text style={[styles.modalLabel, isDark && { color: '#94A3B8' }]}>Recipient Username</Text>
                        <View style={styles.inputWithScanner}>
                            <TextInput
                                style={[styles.premiumInput, { flex: 1 }, isDark && { backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF' }]}
                                placeholder="e.g. johndoe"
                                placeholderTextColor="#64748B"
                                autoCapitalize="none"
                                value={receiverUsernamePoints}
                                onChangeText={setReceiverUsernamePoints}
                            />
                            <TouchableOpacity style={styles.scannerIconBtn} onPress={handleOpenScanner}>
                                <Ionicons name="scan" size={24} color="#4F46E5" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.modalInputGroup}>
                        <Text style={[styles.modalLabel, isDark && { color: '#94A3B8' }]}>Points to Send</Text>
                        <TextInput
                            style={[styles.premiumInput, isDark && { backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF' }]}
                            placeholder="0.00"
                            placeholderTextColor="#64748B"
                            keyboardType="numeric"
                            value={pointTransferAmount}
                            onChangeText={setPointTransferAmount}
                        />
                    </View>

                    <View style={styles.infoAlert}>
                        <Ionicons name="information-circle" size={18} color="#4F46E5" />
                        <Text style={styles.infoAlertText}>Transfers are instant and cannot be reversed.</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.primaryActionBtn}
                        onPress={handlePointTransferSubmit}
                        disabled={isSubmittingPointTransfer}
                    >
                        {isSubmittingPointTransfer ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryActionBtnText}>Send Points Now</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.showMyQrBtn}
                        onPress={() => setShowMyQR(true)}
                    >
                        <Ionicons name="qr-code-outline" size={16} color="#64748B" />
                        <Text style={styles.showMyQrBtnText}>Show My QR Code</Text>
                    </TouchableOpacity>
                    <View style={{ height: 40 }} />
                </View>
            </View>
        </Modal>
    );

    const MyQRModal = () => (
        <Modal visible={showMyQR} transparent animationType="fade">
            <View style={styles.blurModalOverlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowMyQR(false)} />
                <View style={[styles.qrPremiumContainer, isDark && { backgroundColor: '#1E293B' }]}>
                    <Text style={[styles.modalHeading, { marginBottom: 10 }, isDark && { color: '#F1F5F9' }]}>My QR Code</Text>
                    <Text style={styles.qrDesc}>Show this code to others to receive points</Text>

                    <View style={styles.qrWhiteBox}>
                        <QRCode
                            value={user?.userName || ''}
                            size={220}
                            color={isDark ? '#0F172A' : '#000'}
                            backgroundColor="#FFF"
                        />
                    </View>

                    <View style={styles.qrIdentity}>
                        <View style={styles.identityBadge}>
                            <Text style={styles.identityText}>@{user?.userName}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.closeBtnCircle} onPress={() => setShowMyQR(false)}>
                        <Ionicons name="close" size={30} color="#64748B" />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const CameraOverlay = () => (
        showScanner && device ? (
            <View style={StyleSheet.absoluteFill}>
                <Camera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={true}
                    codeScanner={codeScanner}
                />
                <View style={styles.cameraOverlay}>
                    <View style={styles.cameraHeader}>
                        <TouchableOpacity onPress={() => setShowScanner(false)} style={styles.cameraBackBtn}>
                            <Ionicons name="arrow-back" size={28} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.cameraTitle}>Scan QR Code</Text>
                    </View>
                    <View style={styles.cameraGuideContainer}>
                        <View style={styles.cameraFrame} />
                        <Text style={styles.cameraHint}>Align QR code with the frame</Text>
                    </View>
                </View>
            </View>
        ) : null
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center, isDark && { backgroundColor: '#0F172A' }]}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={[styles.loadingText, isDark && { color: '#94A3B8' }]}>Loading shops...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0F172A' }]}>
            <LinearGradient
                colors={isDark ? ['#1E293B', '#0F172A'] : ['#4F46E5', '#6366F1']}
                style={styles.headerPremium}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnPremium}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.premiumTitle}>Partner Shops</Text>
                        <View style={styles.pointsBadgeDisplay}>
                            <Ionicons name="gift" size={14} color="#FBBF24" />
                            <Text style={styles.pointsValueText}>{Number(user?.flyWallet || 0).toFixed(2)} PTS</Text>
                        </View>
                    </View>
                    <View style={styles.headerRightPremium}>
                        <TouchableOpacity onPress={() => setPointTransferModalVisible(true)} style={styles.headerActionBtn}>
                            <Ionicons name="send" size={20} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectorVisible(true)} style={styles.headerActionBtn}>
                            <Ionicons name="options" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerActionBtn}>
                            <Ionicons name="ellipsis-vertical" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={mapRegion}
                    showsUserLocation={false} // Using custom indicator
                    showsMyLocationButton={false}
                >
                    {/* Directions Polyline */}
                    {routeCoords.length > 0 && (
                        <Polyline
                            coordinates={routeCoords}
                            strokeWidth={4}
                            strokeColor="#4F46E5"
                        />
                    )}

                    {/* Custom User Indicator */}
                    {userLocation && (
                        <Marker
                            coordinate={userLocation}
                            anchor={{ x: 0.5, y: 0.5 }}
                            zIndex={10}
                        >
                            <View style={styles.userIndicatorContainer}>
                                <View style={styles.userIndicatorOuter} />
                                <View style={styles.userIndicatorBadge}>
                                    <Ionicons name="person" size={16} color="#4F46E5" />
                                </View>
                            </View>
                        </Marker>
                    )}

                    {memoizedMarkers}
                </MapView>

                <TouchableOpacity style={styles.nearMeBtn} onPress={handleNearMe}>
                    <Ionicons name="navigate" size={20} color="#FFF" />
                    <Text style={styles.nearMeText}>Near Me</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.fullScreenToggleBtn, isMinimizedList && { backgroundColor: '#EEF2FF' }]}
                    onPress={() => setIsMinimizedList(!isMinimizedList)}
                >
                    <Ionicons name={isMinimizedList ? "chevron-up" : "expand"} size={22} color={isMinimizedList ? "#4F46E5" : "#FFF"} />
                </TouchableOpacity>

                {isNavigating && (
                    <View style={styles.navigationOverlay}>
                        <ActivityIndicator color="#FFF" />
                        <Text style={styles.navigationText}>Finding best route...</Text>
                    </View>
                )}

                {LocationSelector()}
                {DetailModal()}
                {MenuModal()}
                {PointTransferModal()}
                {MyQRModal()}
                {CameraOverlay()}

                <Toast />
            </View>

            <View style={[styles.resultsPanel, isDark && { backgroundColor: '#1E293B' }, isMinimizedList && { height: 100, paddingBottom: 0 }]}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsMinimizedList(!isMinimizedList)}
                    style={styles.resultsHeader}
                >
                    <View>
                        <Text style={[styles.resultsTitle, isDark && { color: '#FFF' }]}>
                            {filteredShops.length} Partner Shops
                        </Text>
                        <Text style={styles.resultsSubtext}>
                            {selectedThana ? `${selectedThana}${selectedCategory !== 'All' ? ` • ${selectedCategory}` : ''}` : 'Showing all shops nearby'}
                        </Text>
                    </View>
                    <View style={styles.resultsBadge}>
                        <Ionicons name="flash" size={14} color="#4F46E5" />
                        <Text style={styles.badgeText}>Best Deals</Text>
                    </View>
                </TouchableOpacity>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.shopScroll}
                    contentContainerStyle={styles.shopScrollContent}
                >
                    {filteredShops.map(shop => (
                        <TouchableOpacity
                            key={shop._id}
                            activeOpacity={0.9}
                            style={[styles.shopCard, isDark && { backgroundColor: '#0F172A', borderColor: '#334155' }]}
                            onPress={() => {
                                mapRef.current?.animateToRegion({
                                    latitude: shop.mapLocation.lat,
                                    longitude: shop.mapLocation.lng,
                                    latitudeDelta: 0.005,
                                    longitudeDelta: 0.005,
                                }, 1000);
                            }}
                        >
                            <View style={styles.shopImageContainer}>
                                <Image source={{ uri: shop.shopImage }} style={styles.shopImg} />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                                    style={styles.shopImageGradient}
                                >
                                    <View style={styles.shopCardBenefit}>
                                        <Text style={styles.shopCardBenefitText}>{shop.paymentPercentage}% OFF</Text>
                                    </View>
                                </LinearGradient>
                            </View>

                            <View style={styles.shopCardInfo}>
                                <Text style={[styles.shopCardTitle, isDark && { color: '#FFF' }]} numberOfLines={1}>
                                    {shop.shopName}
                                </Text>
                                <View style={styles.shopCardRow}>
                                    <Ionicons name="pricetag-outline" size={12} color="#64748B" />
                                    <Text style={styles.shopCardCategory}>{shop.shopCategory}</Text>
                                </View>

                                <View style={styles.shopCardFooter}>
                                    <TouchableOpacity
                                        style={styles.shopBtnDetails}
                                        onPress={() => {
                                            setSelectedShop(shop);
                                            setDetailModalVisible(true);
                                        }}
                                    >
                                        <Text style={styles.shopBtnDetailsText}>Details</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.shopBtnNav}
                                        onPress={() => handleNavigate(shop)}
                                    >
                                        <Ionicons name="navigate" size={16} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAF6',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingTop: 50,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748B',
    },
    headerRight: {
        flexDirection: 'row',
        gap: 10,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    mapContainer: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    nearMeBtn: {
        position: 'absolute',
        bottom: height * 0.35,
        right: 20,
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    nearMeText: {
        color: '#FFF',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    resultsPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingTop: 25,
        paddingBottom: 35,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        marginBottom: 20,
    },
    resultsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    resultsSubtext: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    resultsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4F46E5',
        marginLeft: 4,
    },
    shopScroll: {
        paddingLeft: 25,
    },
    shopScrollContent: {
        paddingRight: 40,
    },
    shopCard: {
        width: width * 0.65,
        backgroundColor: '#FFF',
        borderRadius: 24,
        marginRight: 18,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },
    shopImageContainer: {
        width: '100%',
        height: 140,
        position: 'relative',
    },
    shopImg: {
        width: '100%',
        height: '100%',
    },
    shopImageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        justifyContent: 'flex-end',
        padding: 12,
    },
    shopCardBenefit: {
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    shopCardBenefitText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    shopCardInfo: {
        padding: 15,
    },
    shopCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    shopCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    shopCardCategory: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 4,
    },
    shopCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    shopBtnDetails: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    shopBtnDetailsText: {
        color: '#4F46E5',
        fontSize: 13,
        fontWeight: 'bold',
    },
    shopBtnNav: {
        width: 40,
        height: 40,
        backgroundColor: '#4F46E5',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userIndicatorContainer: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userIndicatorOuter: {
        position: 'absolute',
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderWidth: 1.5,
        borderColor: 'rgba(79, 70, 229, 0.4)',
    },
    userIndicatorBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        borderWidth: 2,
        borderColor: '#4F46E5',
    },
    navigationOverlay: {
        position: 'absolute',
        top: 110,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 20,
        zIndex: 100,
    },
    navigationText: {
        color: '#FFF',
        fontWeight: 'bold',
        marginLeft: 12,
    },
    detailModalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        overflow: 'hidden',
    },
    detailShopImg: {
        width: '100%',
        height: 280,
    },
    closeModalBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailInfoContainer: {
        padding: 25,
    },
    detailHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    detailShopName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        flex: 1,
        marginRight: 10,
    },
    detailBenefitBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    detailBenefitText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: 'bold',
    },
    detailCategory: {
        fontSize: 16,
        color: '#64748B',
        marginBottom: 20,
    },
    detailDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    detailRowText: {
        fontSize: 15,
        color: '#475569',
        marginLeft: 15,
    },
    detailActions: {
        marginTop: 10,
    },
    actionBtnPrimary: {
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 18,
        elevation: 4,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        maxHeight: '85%',
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    levelTabs: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    levelTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#F1F5F9',
    },
    activeLevelTab: {
        backgroundColor: '#4F46E5',
    },
    levelTabText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748B',
    },
    activeLevelTabText: {
        color: '#FFF',
    },
    optionsList: {
        maxHeight: 400,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    optionText: {
        fontSize: 16,
        color: '#334155',
    },
    applyBtn: {
        backgroundColor: '#4F46E5',
        marginHorizontal: 30,
        marginTop: 20,
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: 'center',
        elevation: 2,
    },
    applyBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    menuContent: {
        position: 'absolute',
        top: 50,
        right: 10,
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 8,
        width: 220,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    customCallout: {
        width: 250,
        backgroundColor: 'transparent',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
    },
    menuItemText: {
        fontSize: 15,
        color: '#475569',
        marginLeft: 12,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 4,
    },
    customMarker: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 90,
    },
    markerBadge: {
        position: 'absolute',
        top: 0,
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        zIndex: 10,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    markerBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    markerIconContainer: {
        backgroundColor: '#4F46E5',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    markerArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#FFF',
        transform: [{ rotate: '180deg' }],
        marginTop: -2,
    },
    // Premium Header Styles
    headerPremium: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 10,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    backBtnPremium: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    premiumTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
    },
    pointsBadgeDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    pointsValueText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
        marginLeft: 4,
    },
    headerRightPremium: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerActionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Transfer Modal Styles
    fullModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    premiumModalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: height * 0.85 },
    modalDragIndicator: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
    modalHeading: { fontSize: 22, fontWeight: '900', color: '#1E293B', textAlign: 'center', marginBottom: 25 },
    modalInputGroup: { marginBottom: 20 },
    modalLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginLeft: 4, marginBottom: 8 },
    premiumInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, fontSize: 16, color: '#1E293B' },
    primaryActionBtn: { backgroundColor: '#4F46E5', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    primaryActionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    inputWithScanner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    scannerIconBtn: { width: 55, height: 55, borderRadius: 16, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
    infoAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', padding: 12, borderRadius: 12, marginBottom: 20, gap: 10 },
    infoAlertText: { fontSize: 12, color: '#4F46E5', flex: 1, fontWeight: '600' },
    blurModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    qrPremiumContainer: { width: width * 0.85, backgroundColor: '#FFF', borderRadius: 36, padding: 30, alignItems: 'center', position: 'relative' },
    qrDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 25 },
    qrWhiteBox: { padding: 15, backgroundColor: '#FFF', borderRadius: 24, elevation: 10, shadowOpacity: 0.1 },
    qrIdentity: { marginTop: 25 },
    identityBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 },
    identityText: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    closeBtnCircle: { position: 'absolute', top: -15, right: -15, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', elevation: 5 },
    cameraOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    cameraHeader: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
    cameraBackBtn: { padding: 10 },
    cameraTitle: { flex: 1, textAlign: 'center', color: '#FFF', fontSize: 18, fontWeight: '800', marginRight: 48 },
    cameraGuideContainer: { alignItems: 'center' },
    cameraFrame: { width: width * 0.7, height: width * 0.7, borderWidth: 3, borderColor: '#818CF8', borderRadius: 30 },
    cameraHint: { color: '#FFF', fontSize: 14, fontWeight: '600', marginTop: 30, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    showMyQrBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        gap: 8,
    },
    showMyQrBtnText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
    calloutCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        flexDirection: 'row',
        padding: 12,
        width: '100%',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    calloutImg: {
        width: 70,
        height: 70,
        borderRadius: 12,
    },
    calloutInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    calloutTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    calloutBenefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    calloutBenefit: {
        color: '#166534',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    calloutCategory: {
        color: '#64748B',
        fontSize: 11,
    },
    calloutArrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 15,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#FFF',
        transform: [{ rotate: '180deg' }],
        marginTop: -1,
    },
    selectorTabWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    levelTabsContainer: {
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    fullScreenToggleBtn: {
        position: 'absolute',
        bottom: height * 0.35,
        left: 20,
        backgroundColor: '#4F46E5',
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});

export default WalletShopScreen;
