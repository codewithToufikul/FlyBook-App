
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import LinearGradient from 'react-native-linear-gradient';
import { get, put, del } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { handleImageUpload } from '../../utils/imageUpload';

const { width } = Dimensions.get('window');

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
    status: 'pending' | 'active' | 'rejected';
    paymentPercentage: number;
    shopOwnerName: string;
    contactNumber: string;
    shopLocationId: string;
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
    createdAt: string;
}

const ManageUserShopsScreen = () => {
    const navigation = useNavigation();
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [locations, setLocations] = useState<Location[]>([]);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingShop, setEditingShop] = useState<Shop | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editFormData, setEditFormData] = useState({
        shopName: '',
        shopCategory: '',
        paymentPercentage: '',
        shopImage: '',
        contactNumber: '',
        shopLocationId: '',
        mapLocation: { lat: 23.8103, lng: 90.4125 }
    });

    const editMapRef = useRef<MapView>(null);

    // Cascading Location States for Edit
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedThana, setSelectedThana] = useState('');
    const [selectedUnion, setSelectedUnion] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [locSelectorVisible, setLocSelectorVisible] = useState(false);
    const [activeLocLevel, setActiveLocLevel] = useState('Division');

    useEffect(() => {
        fetchMyShops();
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const res = await get<{ success: boolean; data: Location[] }>('/api/locations');
            if (res?.success) {
                setLocations(res.data);
            }
        } catch (error) {
            console.error('Error fetching locations:', error);
        }
    };

    const fetchMyShops = async () => {
        if (!user?._id) return;
        try {
            const res = await get<{ success: boolean; data: Shop[] }>(`/api/shops?submittedBy=${user._id}`);
            if (res?.success) {
                setShops(res.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
        } catch (error) {
            console.error('Error fetching user shops:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDelete = (shopId: string) => {
        Alert.alert(
            'Delete Shop',
            'Are you sure you want to delete this shop? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await del(`/api/shops/${shopId}`);
                            if (res.success) {
                                setShops(prev => prev.filter(s => s._id !== shopId));
                                Alert.alert('Deleted', 'Shop deleted successfully');
                            }
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to delete shop');
                        }
                    }
                }
            ]
        );
    };

    const openEditModal = (shop: Shop) => {
        setEditingShop(shop);
        setEditFormData({
            shopName: shop.shopName,
            shopCategory: shop.shopCategory,
            paymentPercentage: String(shop.paymentPercentage),
            shopImage: shop.shopImage,
            contactNumber: shop.contactNumber,
            shopLocationId: shop.shopLocationId,
            mapLocation: shop.mapLocation
        });

        if (shop.locationDetails) {
            setSelectedDivision(shop.locationDetails.division || '');
            setSelectedDistrict(shop.locationDetails.district || '');
            setSelectedThana(shop.locationDetails.thana || '');
            setSelectedUnion(shop.locationDetails.union || '');
            setSelectedArea(shop.locationDetails.area || '');
        }

        setEditModalVisible(true);

        // Timeout to allow map to mount
        setTimeout(() => {
            editMapRef.current?.animateToRegion({
                latitude: shop.mapLocation.lat,
                longitude: shop.mapLocation.lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005
            }, 500);
        }, 800);
    };

    const handleUpdate = async () => {
        if (!editingShop) return;
        if (!editFormData.shopName || !editFormData.shopImage || !editFormData.shopLocationId || !editFormData.paymentPercentage || !editFormData.contactNumber) {
            Alert.alert('Missing Fields', 'Please fill in all required fields');
            return;
        }

        setEditLoading(true);
        try {
            const res = await put(`/api/shops/${editingShop._id}`, editFormData);
            if (res.success) {
                Alert.alert('Updated', 'Shop updated successfully and resubmitted for approval');
                setEditModalVisible(false);
                fetchMyShops();
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update shop');
        } finally {
            setEditLoading(false);
        }
    };

    const handlePickImage = async () => {
        try {
            const imageUrl = await handleImageUpload();
            if (imageUrl) {
                setEditFormData(prev => ({ ...prev, shopImage: imageUrl }));
            }
        } catch (error: any) {
            if (error.message !== 'User cancelled') {
                Alert.alert('Upload Error', 'Failed to upload image');
            }
        }
    };

    const handlePercentageChange = (text: string) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        if (numericValue === '') {
            setEditFormData(p => ({ ...p, paymentPercentage: '' }));
            return;
        }
        const val = parseInt(numericValue, 10);
        setEditFormData(p => ({ ...p, paymentPercentage: val <= 100 ? numericValue : '100' }));
    };

    const findAndSetEditLocation = (div: string, dist: string, tha: string, uni: string, area: string) => {
        const matched = locations.find(l =>
            l.division === div && l.district === dist &&
            l.thana === tha && (!uni || (l.union || 'N/A') === uni) && (!area || (l.area || 'N/A') === area)
        );
        if (matched) {
            setEditFormData(p => ({ ...p, shopLocationId: matched._id }));
            if (matched.coordinates) {
                const newPos = { lat: Number(matched.coordinates.lat), lng: Number(matched.coordinates.lng) };
                setEditFormData(p => ({ ...p, mapLocation: newPos }));
                editMapRef.current?.animateToRegion({
                    latitude: newPos.lat, longitude: newPos.lng, latitudeDelta: 0.005, longitudeDelta: 0.005
                }, 1000);
            }
        }
    };

    const handleLocSelect = (item: string) => {
        if (activeLocLevel === 'Division') {
            setSelectedDivision(item); setSelectedDistrict(''); setSelectedThana(''); setSelectedUnion(''); setSelectedArea('');
            setEditFormData(p => ({ ...p, shopLocationId: '' }));
            setActiveLocLevel('District');
        } else if (activeLocLevel === 'District') {
            setSelectedDistrict(item); setSelectedThana(''); setSelectedUnion(''); setSelectedArea('');
            setEditFormData(p => ({ ...p, shopLocationId: '' }));
            setActiveLocLevel('Thana');
        } else if (activeLocLevel === 'Thana') {
            setSelectedThana(item); setSelectedUnion(''); setSelectedArea('');
            setEditFormData(p => ({ ...p, shopLocationId: '' }));
            setActiveLocLevel('Union');
        } else if (activeLocLevel === 'Union') {
            setSelectedUnion(item); setSelectedArea('');
            findAndSetEditLocation(selectedDivision, selectedDistrict, selectedThana, item, '');
            setActiveLocLevel('Area');
        } else {
            setSelectedArea(item);
            findAndSetEditLocation(selectedDivision, selectedDistrict, selectedThana, selectedUnion, item);
            setLocSelectorVisible(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyShops();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#10B981';
            case 'pending': return '#F59E0B';
            case 'rejected': return '#EF4444';
            default: return '#64748B';
        }
    };

    const renderShopCard = (shop: Shop) => (
        <View key={shop._id} style={[styles.shopCard, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
            <Image source={{ uri: shop.shopImage }} style={styles.shopImage} />

            <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shop.status) + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(shop.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(shop.status) }]}>
                        {shop.status.charAt(0) + shop.status.slice(1)}
                    </Text>
                </View>
                <Text style={styles.dateText}>{new Date(shop.createdAt).toLocaleDateString()}</Text>
            </View>

            <View style={styles.cardBody}>
                <Text style={[styles.shopName, isDark && { color: '#FFF' }]}>{shop.shopName}</Text>

                <View style={styles.infoRow}>
                    <View style={styles.infoTag}>
                        <Ionicons name="pricetag-outline" size={12} color="#64748B" />
                        <Text style={styles.infoTagText}>{shop.shopCategory || 'No Category'}</Text>
                    </View>
                    <View style={[styles.infoTag, { backgroundColor: '#EEF2FF' }]}>
                        <Ionicons name="sparkles" size={12} color="#4F46E5" />
                        <Text style={[styles.infoTagText, { color: '#4F46E5' }]}>{shop.paymentPercentage}% Benefit</Text>
                    </View>
                </View>

                {shop.locationDetails && (
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={14} color="#64748B" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {shop.locationDetails.area || shop.locationDetails.union || shop.locationDetails.thana}, {shop.locationDetails.district}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#4F46E5' }]}
                    onPress={() => openEditModal(shop)}
                >
                    <Ionicons name="create-outline" size={16} color="#FFF" />
                    <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => (navigation.navigate as any)('ShopProducts', { shopId: shop._id, shopName: shop.shopName })}
                >
                    <Ionicons name="cube-outline" size={16} color="#FFF" />
                    <Text style={styles.actionBtnText}>Products</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                    onPress={() => handleDelete(shop._id)}
                >
                    <Ionicons name="trash-outline" size={16} color="#FFF" />
                    <Text style={styles.actionBtnText}>Delete</Text>
                </TouchableOpacity>
            </View>

            {shop.status === 'pending' && (
                <View style={styles.pendingNotice}>
                    <Ionicons name="time-outline" size={14} color="#F59E0B" />
                    <Text style={styles.pendingNoticeText}>Waiting for admin approval</Text>
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0F172A' }]}>
            <LinearGradient
                colors={isDark ? ['#0F172A', '#1E293B'] : ['#4F46E5', '#6366F1']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Shops</Text>
                    <View style={{ width: 40 }} />
                </View>
                <Text style={styles.headerSubtitle}>Manage and track your shop submissions</Text>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
                }
            >
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                    </View>
                ) : shops.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="storefront-outline" size={50} color="#CBD5E1" />
                        </View>
                        <Text style={[styles.emptyTitle, isDark && { color: '#FFF' }]}>No Shops Yet</Text>
                        <Text style={styles.emptyDesc}>You haven't submitted any shops for listing yet.</Text>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => navigation.navigate('AddYourLocalShop' as never)}
                        >
                            <Text style={styles.addBtnText}>Add Your First Shop</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    shops.map(renderShopCard)
                )}
                <View style={{ height: 50 }} />
            </ScrollView>

            {/* Edit Modal */}
            <Modal visible={editModalVisible} animationType="slide" transparent>
                <View style={styles.fullModalOverlay}>
                    <View style={[styles.editModalContent, isDark && { backgroundColor: '#0F172A' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && { color: '#FFF' }]}>Edit Shop Details</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#333'} />
                            </TouchableOpacity>
                        </View>

                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ flex: 1 }}
                        >
                            <ScrollView style={styles.editForm} showsVerticalScrollIndicator={false}>
                                <TouchableOpacity style={styles.editImageBtn} onPress={handlePickImage}>
                                    <View style={styles.editImageContainer}>
                                        <Image source={{ uri: editFormData.shopImage }} style={styles.editPreviewImage} />
                                        <View style={styles.editImageOverlay}>
                                            <Ionicons name="camera" size={24} color="#FFF" />
                                            <Text style={styles.editImageText}>Change Photo</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, isDark && { color: '#CBD5E1' }]}>Shop Name *</Text>
                                    <TextInput
                                        style={[styles.modalInput, isDark && { backgroundColor: '#1E293B', color: '#FFF', borderColor: '#334155' }]}
                                        value={editFormData.shopName}
                                        onChangeText={t => setEditFormData(p => ({ ...p, shopName: t }))}
                                        placeholder="Enter shop name"
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>

                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                        <Text style={[styles.inputLabel, isDark && { color: '#CBD5E1' }]}>Category</Text>
                                        <TextInput
                                            style={[styles.modalInput, isDark && { backgroundColor: '#1E293B', color: '#FFF', borderColor: '#334155' }]}
                                            value={editFormData.shopCategory}
                                            onChangeText={t => setEditFormData(p => ({ ...p, shopCategory: t }))}
                                            placeholder="e.g. Food"
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={[styles.inputLabel, isDark && { color: '#CBD5E1' }]}>Benefit % *</Text>
                                        <TextInput
                                            style={[styles.modalInput, isDark && { backgroundColor: '#1E293B', color: '#FFF', borderColor: '#334155' }]}
                                            value={editFormData.paymentPercentage}
                                            onChangeText={handlePercentageChange}
                                            keyboardType="numeric"
                                            placeholder="0-100"
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, isDark && { color: '#CBD5E1' }]}>Contact Number *</Text>
                                    <TextInput
                                        style={[styles.modalInput, isDark && { backgroundColor: '#1E293B', color: '#FFF', borderColor: '#334155' }]}
                                        value={editFormData.contactNumber}
                                        onChangeText={t => setEditFormData(p => ({ ...p, contactNumber: t }))}
                                        keyboardType="phone-pad"
                                        placeholder="Owner's phone"
                                        placeholderTextColor="#94A3B8"
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, isDark && { color: '#CBD5E1' }]}>Shop Location *</Text>
                                    <TouchableOpacity
                                        style={[styles.modalInput, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }, { justifyContent: 'center' }]}
                                        onPress={() => {
                                            setActiveLocLevel('Division');
                                            setLocSelectorVisible(true);
                                        }}
                                    >
                                        <Text style={{ color: editFormData.shopLocationId ? (isDark ? '#FFF' : '#333') : '#94A3B8' }}>
                                            {selectedArea || selectedUnion || selectedThana || selectedDistrict || selectedDivision || 'Select Location'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, isDark && { color: '#CBD5E1' }]}>Precise Map Location *</Text>
                                    <View style={styles.editMapWrapper}>
                                        <MapView
                                            ref={editMapRef}
                                            provider={PROVIDER_GOOGLE}
                                            style={styles.editMap}
                                            initialRegion={{
                                                latitude: editFormData.mapLocation.lat,
                                                longitude: editFormData.mapLocation.lng,
                                                latitudeDelta: 0.01,
                                                longitudeDelta: 0.01,
                                            }}
                                            onRegionChangeComplete={(region) => {
                                                setEditFormData(p => ({
                                                    ...p,
                                                    mapLocation: { lat: region.latitude, lng: region.longitude }
                                                }));
                                            }}
                                        />
                                        <View style={styles.editMarkerIcon} pointerEvents="none">
                                            <Ionicons name="location" size={36} color="#4F46E5" />
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.updateBtn, editLoading && { opacity: 0.7 }]}
                                    onPress={handleUpdate}
                                    disabled={editLoading}
                                >
                                    {editLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.updateBtnText}>Save Changes</Text>}
                                </TouchableOpacity>

                                <View style={{ height: 100 }} />
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </View>
            </Modal>

            {/* Location Selector Modal for Edit */}
            <Modal visible={locSelectorVisible} transparent animationType="slide">
                <View style={styles.fullModalOverlay}>
                    <View style={[styles.locModalContent, isDark && { backgroundColor: '#1E293B' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && { color: '#FFF' }]}>Select {activeLocLevel}</Text>
                            <TouchableOpacity onPress={() => setLocSelectorVisible(false)}>
                                <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#333'} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {(() => {
                                let options: string[] = [];
                                switch (activeLocLevel) {
                                    case 'Division': options = Array.from(new Set(locations.map(l => l.division))).sort(); break;
                                    case 'District': options = Array.from(new Set(locations.filter(l => l.division === selectedDivision).map(l => l.district))).sort(); break;
                                    case 'Thana': options = Array.from(new Set(locations.filter(l => l.district === selectedDistrict).map(l => l.thana))).sort(); break;
                                    case 'Union': options = Array.from(new Set(locations.filter(l => l.thana === selectedThana).map(l => l.union).filter(Boolean) as string[])).sort(); break;
                                    case 'Area': options = Array.from(new Set(locations.filter(l => l.union === selectedUnion).map(l => l.area).filter(Boolean) as string[])).sort(); break;
                                }
                                return options.map(item => (
                                    <TouchableOpacity key={item} style={styles.locOption} onPress={() => handleLocSelect(item)}>
                                        <Text style={[styles.locOptionText, isDark && { color: '#F1F5F9' }]}>{item}</Text>
                                    </TouchableOpacity>
                                ));
                            })()}
                        </ScrollView>
                        {(activeLocLevel === 'Union' || activeLocLevel === 'Area') && (
                            <TouchableOpacity
                                style={[styles.confirmLocBtn, { backgroundColor: '#4F46E5', margin: 20 }]}
                                onPress={() => setLocSelectorVisible(false)}
                            >
                                <Text style={styles.confirmLocBtnText}>Confirm {selectedUnion ? 'Selection' : 'without Area'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAF6' },
    header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
    content: { flex: 1 },
    scrollContent: { padding: 20 },
    centerBox: { marginTop: 100, alignItems: 'center' },
    shopCard: { backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
    shopImage: { width: '100%', height: 150, backgroundColor: '#F1F5F9' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: 15 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    dateText: { fontSize: 11, color: '#94A3B8' },
    cardBody: { padding: 15 },
    shopName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
    infoRow: { flexDirection: 'row', marginBottom: 12 },
    infoTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
    infoTagText: { fontSize: 12, color: '#64748B', marginLeft: 4, fontWeight: '600' },
    locationContainer: { flexDirection: 'row', alignItems: 'center' },
    locationText: { fontSize: 13, color: '#64748B', marginLeft: 4, flex: 1 },
    actionRow: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 10 },
    actionBtn: { flex: 1, height: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    actionBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    pendingNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 12, borderTopWidth: 1, borderTopColor: '#FEF3C7' },
    pendingNoticeText: { fontSize: 12, color: '#D97706', marginLeft: 6, fontStyle: 'italic' },
    emptyState: { marginTop: 60, alignItems: 'center', paddingHorizontal: 40 },
    emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 },
    emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
    addBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 },
    addBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },

    fullModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    editModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    editForm: { padding: 20 },
    editImageBtn: { alignSelf: 'center', marginBottom: 20 },
    editImageContainer: { width: 120, height: 120, borderRadius: 20, overflow: 'hidden', backgroundColor: '#F1F5F9' },
    editPreviewImage: { width: '100%', height: '100%' },
    editImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
    editImageText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
    inputGroup: { marginBottom: 15 },
    inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 6 },
    modalInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 15, height: 50, fontSize: 15, color: '#1E293B' },
    row: { flexDirection: 'row' },
    editMapWrapper: { height: 180, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
    editMap: { ...StyleSheet.absoluteFillObject },
    editMarkerIcon: { position: 'absolute', top: '50%', left: '50%', marginLeft: -18, marginTop: -36 },
    updateBtn: { backgroundColor: '#4F46E5', height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    updateBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    locModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '60%' },
    locOption: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    locOptionText: { fontSize: 16, color: '#334155' },
    confirmLocBtn: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    confirmLocBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ManageUserShopsScreen;
