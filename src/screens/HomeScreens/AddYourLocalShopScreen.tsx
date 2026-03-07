
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Dimensions,
    Alert,
    Image,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import LinearGradient from 'react-native-linear-gradient';
import { get, post } from '../../services/api';
import { handleImageUpload } from '../../utils/imageUpload';
import { useTheme } from '../../contexts/ThemeContext';

import { useAuth } from '../../contexts/AuthContext';

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

const AddYourLocalShopScreen = () => {
    const navigation = useNavigation();
    const { isDark } = useTheme();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState<Location[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        shopName: '',
        shopCategory: '',
        paymentPercentage: '',
        shopImage: '',
        shopLocationId: '',
        mapLocation: { lat: 23.8103, lng: 90.4125 }
    });

    // Cascading Location States
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedThana, setSelectedThana] = useState('');
    const [selectedUnion, setSelectedUnion] = useState('');
    const [selectedArea, setSelectedArea] = useState('');

    const [selectorVisible, setSelectorVisible] = useState(false);
    const [activeLevel, setActiveLevel] = useState('Division');

    const mapRef = useRef<MapView>(null);

    useEffect(() => {
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

    const handlePickImage = async () => {
        try {
            setLoading(true);
            const imageUrl = await handleImageUpload();
            if (imageUrl) {
                setFormData(prev => ({ ...prev, shopImage: imageUrl }));
            }
        } catch (error: any) {
            if (error.message !== 'User cancelled' && error.message !== 'User cancelled image picker') {
                Alert.alert('Upload Error', 'Failed to upload image. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePercentageChange = (text: string) => {
        // Only allow numbers
        const numericValue = text.replace(/[^0-9]/g, '');

        if (numericValue === '') {
            setFormData(p => ({ ...p, paymentPercentage: '' }));
            return;
        }

        const val = parseInt(numericValue, 10);
        if (val <= 100) {
            setFormData(p => ({ ...p, paymentPercentage: numericValue }));
        } else {
            setFormData(p => ({ ...p, paymentPercentage: '100' }));
        }
    };

    const findAndSetLocation = (div: string, dist: string, tha: string, uni: string, area: string) => {
        const matchedLoc = locations.find(loc =>
            loc.division === div &&
            loc.district === dist &&
            loc.thana === tha &&
            (!uni || (loc.union || 'N/A') === uni) &&
            (!area || (loc.area || 'N/A') === area)
        );
        if (matchedLoc) {
            setFormData(prev => ({ ...prev, shopLocationId: matchedLoc._id }));
            if (matchedLoc.coordinates) {
                const newPos = {
                    lat: Number(matchedLoc.coordinates.lat),
                    lng: Number(matchedLoc.coordinates.lng)
                };
                setFormData(prev => ({ ...prev, mapLocation: newPos }));
                mapRef.current?.animateToRegion({
                    latitude: newPos.lat,
                    longitude: newPos.lng,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005
                }, 1000);
            }
        }
    };

    const handleLocationSelect = (item: string) => {
        if (activeLevel === 'Division') {
            setSelectedDivision(item);
            setSelectedDistrict(''); setSelectedThana(''); setSelectedUnion(''); setSelectedArea('');
            setFormData(prev => ({ ...prev, shopLocationId: '' }));
            setActiveLevel('District');
        } else if (activeLevel === 'District') {
            setSelectedDistrict(item);
            setSelectedThana(''); setSelectedUnion(''); setSelectedArea('');
            setFormData(prev => ({ ...prev, shopLocationId: '' }));
            setActiveLevel('Thana');
        } else if (activeLevel === 'Thana') {
            setSelectedThana(item);
            setSelectedUnion(''); setSelectedArea('');
            setFormData(prev => ({ ...prev, shopLocationId: '' }));
            setActiveLevel('Union');
        } else if (activeLevel === 'Union') {
            setSelectedUnion(item);
            setSelectedArea('');
            findAndSetLocation(selectedDivision, selectedDistrict, selectedThana, item, '');
            setActiveLevel('Area');
        } else {
            setSelectedArea(item);
            findAndSetLocation(selectedDivision, selectedDistrict, selectedThana, selectedUnion, item);
            setSelectorVisible(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.shopName || !formData.shopImage || !formData.shopLocationId || !formData.paymentPercentage) {
            Alert.alert('Missing Fields', 'Please fill in all required fields marked with *');
            return;
        }

        const payload = {
            ...formData,
            shopOwnerName: user?.name || 'Anonymous',
            contactNumber: user?.phone || '',
        };

        setSubmitting(true);
        try {
            const res = await post('/api/shops/user-add', payload);
            if (res.success) {
                Alert.alert(
                    'Application Submitted',
                    'Your shop has been submitted successfully. It will be visible in the shop list after admin approval.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error: any) {
            console.error('Submit error:', error);
            Alert.alert('Error', error.message || 'Failed to submit shop. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderLocationValue = () => {
        if (!selectedDivision) return 'Select Location';
        return `${selectedArea || selectedUnion || selectedThana || selectedDistrict || selectedDivision}`;
    };

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0F172A' }]}>
            <LinearGradient
                colors={isDark ? ['#0F172A', '#1E293B'] : ['#4F46E5', '#6366F1']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Add Your Shop</Text>
                        <Text style={styles.headerSubtitle}>Submit your shop for partner listing</Text>
                    </View>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.formContent}
                    contentContainerStyle={styles.formScroll}
                    showsVerticalScrollIndicator={false}
                >
                    {/* User Info Bar */}
                    <View style={[styles.userInfoBar, isDark && { backgroundColor: '#1E293B' }]}>
                        <View style={styles.userInfoItem}>
                            <Ionicons name="person" size={16} color="#4F46E5" />
                            <Text style={[styles.userInfoText, isDark && { color: '#CBD5E1' }]}>{user?.name}</Text>
                        </View>
                        <View style={styles.userInfoItem}>
                            <Ionicons name="call" size={16} color="#4F46E5" />
                            <Text style={[styles.userInfoText, isDark && { color: '#CBD5E1' }]}>{user?.phone}</Text>
                        </View>
                    </View>

                    {/* Image Upload Section */}
                    <TouchableOpacity
                        style={[styles.imageUploadCard, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}
                        onPress={handlePickImage}
                    >
                        {formData.shopImage ? (
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: formData.shopImage }} style={styles.previewImage} />
                                <View style={styles.imageOverlay}>
                                    <Ionicons name="camera" size={30} color="#FFF" />
                                    <Text style={styles.changePhotoText}>Change Photo</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                {loading ? (
                                    <ActivityIndicator color="#4F46E5" />
                                ) : (
                                    <>
                                        <View style={styles.uploadIconCircle}>
                                            <Ionicons name="cloud-upload" size={32} color="#4F46E5" />
                                        </View>
                                        <Text style={[styles.uploadText, isDark && { color: '#FFF' }]}>Upload Shop Photo *</Text>
                                        <Text style={styles.uploadSubtext}>JPG or PNG (Max 5MB)</Text>
                                    </>
                                )}
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Basic Info Section */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isDark && { color: '#CBD5E1' }]}>Shop Name *</Text>
                        <View style={[styles.inputContainer, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                            <Ionicons name="storefront-outline" size={20} color="#64748B" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, isDark && { color: '#FFF' }]}
                                placeholder="Enter shop name"
                                placeholderTextColor="#94A3B8"
                                value={formData.shopName}
                                onChangeText={(text) => setFormData(p => ({ ...p, shopName: text }))}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={[styles.label, isDark && { color: '#CBD5E1' }]}>Category</Text>
                            <View style={[styles.inputContainer, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                                <Ionicons name="pricetag-outline" size={18} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, isDark && { color: '#FFF' }]}
                                    placeholder="e.g. Food"
                                    placeholderTextColor="#94A3B8"
                                    value={formData.shopCategory}
                                    onChangeText={(text) => setFormData(p => ({ ...p, shopCategory: text }))}
                                />
                            </View>
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={[styles.label, isDark && { color: '#CBD5E1' }]}>Benefit % (Max 100) *</Text>
                            <View style={[styles.inputContainer, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                                <Ionicons name="sparkles-outline" size={18} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, isDark && { color: '#FFF' }]}
                                    placeholder="0-100"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                    value={formData.paymentPercentage}
                                    onChangeText={handlePercentageChange}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Location Selection Section */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isDark && { color: '#CBD5E1' }]}>Shop Location *</Text>
                        <TouchableOpacity
                            style={[styles.inputContainer, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}
                            onPress={() => setSelectorVisible(true)}
                        >
                            <Ionicons name="location-outline" size={20} color="#64748B" style={styles.inputIcon} />
                            <Text style={[styles.inputText, (selectedDivision ? { color: isDark ? '#FFF' : '#1E293B' } : { color: '#94A3B8' })]}>
                                {renderLocationValue()}
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    {/* Map Selection Section */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, isDark && { color: '#CBD5E1' }]}>Precise Map Location *</Text>
                        <Text style={styles.hint}>Drag the map to pinpoint your shop's exact location</Text>
                        <View style={[styles.mapWrapper, isDark && { borderColor: '#334155' }]}>
                            <MapView
                                ref={mapRef}
                                provider={PROVIDER_GOOGLE}
                                style={styles.map}
                                initialRegion={{
                                    latitude: formData.mapLocation.lat,
                                    longitude: formData.mapLocation.lng,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                onRegionChangeComplete={(region) => {
                                    setFormData(p => ({
                                        ...p,
                                        mapLocation: { lat: region.latitude, lng: region.longitude }
                                    }));
                                }}
                            />
                            <View style={styles.markerContainer} pointerEvents="none">
                                <Ionicons name="location" size={40} color="#4F46E5" />
                            </View>
                        </View>
                        <View style={styles.coordsRow}>
                            <Text style={styles.coordsText}>Lat: {formData.mapLocation.lat.toFixed(6)}</Text>
                            <Text style={styles.coordsText}>Lng: {formData.mapLocation.lng.toFixed(6)}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.submitBtnText}>Submit Shop for Review</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Location Selector Modal */}
            <Modal visible={selectorVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDark && { backgroundColor: '#1E293B' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && { color: '#FFF' }]}>Select {activeLevel}</Text>
                            <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                                <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#333'} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.levelTabs}>
                            {['Division', 'District', 'Thana', 'Union', 'Area'].map(level => (
                                <TouchableOpacity
                                    key={level}
                                    onPress={() => setActiveLevel(level)}
                                    style={[styles.levelTab, activeLevel === level && styles.activeLevelTab]}
                                >
                                    <Text style={[styles.levelTabText, activeLevel === level && styles.activeLevelTabText]}>{level}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <ScrollView style={styles.optionsList}>
                            {(() => {
                                let options: string[] = [];
                                switch (activeLevel) {
                                    case 'Division': options = Array.from(new Set(locations.map(l => l.division))).sort(); break;
                                    case 'District': options = Array.from(new Set(locations.filter(l => l.division === selectedDivision).map(l => l.district))).sort(); break;
                                    case 'Thana': options = Array.from(new Set(locations.filter(l => l.district === selectedDistrict).map(l => l.thana))).sort(); break;
                                    case 'Union': options = Array.from(new Set(locations.filter(l => l.thana === selectedThana).map(l => l.union).filter(Boolean) as string[])).sort(); break;
                                    case 'Area': options = Array.from(new Set(locations.filter(l => l.union === selectedUnion).map(l => l.area).filter(Boolean) as string[])).sort(); break;
                                }
                                return options.map(item => (
                                    <TouchableOpacity
                                        key={item}
                                        style={styles.optionItem}
                                        onPress={() => handleLocationSelect(item)}
                                    >
                                        <Text style={[styles.optionText, isDark && { color: '#F1F5F9' }]}>{item}</Text>
                                        {(activeLevel === 'Division' ? selectedDivision :
                                            activeLevel === 'District' ? selectedDistrict :
                                                activeLevel === 'Thana' ? selectedThana :
                                                    activeLevel === 'Union' ? selectedUnion : selectedArea) === item &&
                                            <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />}
                                    </TouchableOpacity>
                                ));
                            })()}
                        </ScrollView>
                        {(activeLevel === 'Union' || activeLevel === 'Area') && (
                            <TouchableOpacity
                                style={[styles.confirmLocBtn, { backgroundColor: '#4F46E5', margin: 20 }]}
                                onPress={() => setSelectorVisible(false)}
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
    container: {
        flex: 1,
        backgroundColor: '#F8FAF6',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    formContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    formScroll: {
        paddingTop: 20,
    },
    userInfoBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#F1F5F9',
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
    },
    userInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userInfoText: {
        fontSize: 14,
        color: '#475569',
        marginLeft: 8,
        fontWeight: '600',
    },
    imageUploadCard: {
        height: 180,
        backgroundColor: '#FFF',
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#E2E8F0',
        marginBottom: 25,
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    uploadText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    uploadSubtext: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
    },
    imagePreviewContainer: {
        flex: 1,
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    changePhotoText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#475569',
        marginBottom: 8,
        marginLeft: 4,
    },
    hint: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 8,
        marginLeft: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 15,
        height: 55,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1E293B',
    },
    inputText: {
        flex: 1,
        fontSize: 15,
    },
    mapWrapper: {
        height: 200,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    markerContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -20,
        marginTop: -40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    coordsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
        paddingHorizontal: 5,
    },
    coordsText: {
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        color: '#94A3B8',
    },
    submitBtn: {
        backgroundColor: '#4F46E5',
        height: 60,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginTop: 10,
        elevation: 4,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
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
        maxHeight: '80%',
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    levelTabs: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 15,
    },
    levelTab: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 15,
        marginRight: 8,
        backgroundColor: '#F1F5F9',
    },
    activeLevelTab: {
        backgroundColor: '#4F46E5',
    },
    levelTabText: {
        fontSize: 12,
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
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    optionText: {
        fontSize: 16,
        color: '#334155',
    },
    locOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
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

export default AddYourLocalShopScreen;
