import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Alert,
    RefreshControl,
    Platform,
    PermissionsAndroid,
    Modal,
    ScrollView,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { get, post } from '../../services/api';
import CustomHeader from '../../components/common/CustomHeader';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

interface NearbyBook {
    _id: string;
    bookName: string;
    writer: string;
    details: string;
    imageUrl: string;
    owner: string;
    userId: string;
    distance: number; // in meters
    location: {
        type: string;
        coordinates: [number, number]; // [lng, lat]
    };
    currentDate: string;
    returnTime?: string;
}

const NearByBooks = ({ navigation }: any) => {
    const { isDark } = useTheme();
    const [books, setBooks] = useState<NearbyBook[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [selectedBook, setSelectedBook] = useState<NearbyBook | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [requesting, setRequesting] = useState(false);

    const requestLocationPermission = async () => {
        if (Platform.OS === 'ios') {
            Geolocation.requestAuthorization();
            getUserLocation();
        } else {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Permission',
                        message: 'FlyBook needs access to your location to find books near you.',
                        buttonPositive: 'OK',
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    getUserLocation();
                } else {
                    setError('Location permission denied');
                }
            } catch (err) {
                console.warn(err);
            }
        }
    };

    const getUserLocation = () => {
        setLoading(true);
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude });
                fetchNearbyBooks(latitude, longitude);
            },
            (error) => {
                setError('Failed to get your location. Make sure GPS is on.');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    const fetchNearbyBooks = async (lat: number, lng: number) => {
        try {
            setError(null);
            const response = await get<{ success: boolean; data: NearbyBook[] }>(
                `/books/nearby?latitude=${lat}&longitude=${lng}&maxDistance=50000` // 50km radius
            );

            if (response?.success) {
                setBooks(response.data);
            } else {
                setBooks([]);
            }
        } catch (err) {
            console.error('Fetch Nearby Books Error:', err);
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        if (location) {
            fetchNearbyBooks(location.latitude, location.longitude);
        } else {
            getUserLocation();
        }
    }, [location]);

    useEffect(() => {
        requestLocationPermission();
    }, []);

    const formatDistance = (meters: number) => {
        if (meters < 1000) {
            return `${Math.round(meters)}m away`;
        }
        return `${(meters / 1000).toFixed(1)} km away`;
    };

    const handleOpenDetails = (book: NearbyBook) => {
        setSelectedBook(book);
        setIsModalVisible(true);
    };

    const handleViewLibrary = (userId: string, userName: string) => {
        setIsModalVisible(false);
        navigation.navigate('UserLibrary', { userId, userName });
    };

    const renderBookItem = ({ item }: { item: NearbyBook }) => (
        <TouchableOpacity
            style={[styles.bookCard, isDark && styles.darkBookCard]}
            onPress={() => handleOpenDetails(item)}
            activeOpacity={0.9}
        >
            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
                    style={styles.bookImage}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.imageOverlay}
                />
                <View style={styles.distanceBadge}>
                    <Ionicons name="location" size={12} color="#FFFFFF" />
                    <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
                </View>
            </View>

            <View style={styles.bookContent}>
                <Text style={[styles.bookTitle, isDark && styles.darkText]} numberOfLines={1}>{item.bookName}</Text>
                <Text style={[styles.writerName, isDark && styles.darkSubText]} numberOfLines={1}>by {item.writer}</Text>

                <View style={[styles.ownerInfo, isDark && styles.darkBorder]}>
                    <View style={styles.ownerAvatar}>
                        <Text style={styles.ownerInitial}>{item.owner?.charAt(0) || 'U'}</Text>
                    </View>
                    <Text style={[styles.ownerName, isDark && styles.darkText]}>{item.owner}</Text>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.dateInfo}>
                        <Ionicons name="calendar-outline" size={14} color={isDark ? "#94A3B8" : "#6B7280"} />
                        <Text style={[styles.dateText, isDark && styles.darkSubText]}>{item.currentDate}</Text>
                    </View>
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={[styles.detailsBtn, isDark && styles.darkDetailsBtn]}
                            onPress={() => handleOpenDetails(item)}
                        >
                            <Text style={[styles.detailsBtnText, isDark && styles.darkDetailsBtnText]}>Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.libraryBtn}
                            onPress={() => handleViewLibrary(item.userId, item.owner)}
                        >
                            <Text style={styles.libraryBtnText}>Library</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, isDark && styles.darkContainer]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFFFFF"} />
            <CustomHeader title="Nearby Books" />

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#0D9488" />
                    <Text style={[styles.loadingText, isDark && styles.darkSubText]}>Finding books near you...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                    <Text style={[styles.errorTitle, isDark && styles.darkText]}>Oops!</Text>
                    <Text style={[styles.errorText, isDark && styles.darkSubText]}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                        <Text style={styles.retryBtnText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={books}
                    renderItem={renderBookItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} tintColor={isDark ? "#0D9488" : "#0D9488"} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconBg, isDark && styles.darkEmptyIconBg]}>
                                <Ionicons name="book-outline" size={80} color="#0D9488" />
                            </View>
                            <Text style={[styles.emptyTitle, isDark && styles.darkText]}>No books nearby</Text>
                            <Text style={[styles.emptySubtitle, isDark && styles.darkSubText]}>Try increasing the search radius or be the first to share a book!</Text>
                            <TouchableOpacity
                                style={styles.shareBookBtn}
                                onPress={() => navigation.navigate('ELearning', { screen: 'AddBook' })}
                            >
                                <Text style={styles.shareBookBtnText}>Share a Book</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* Book Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Book Details</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={isDark ? "#FFF" : "#000"} />
                            </TouchableOpacity>
                        </View>

                        {selectedBook && (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
                                <Image
                                    source={{ uri: selectedBook.imageUrl || 'https://via.placeholder.com/300' }}
                                    style={styles.modalBookImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.modalInfoContainer}>
                                    <Text style={[styles.modalBookName, isDark && styles.darkText]}>{selectedBook.bookName}</Text>
                                    <View style={styles.modalWriterContainer}>
                                        <Ionicons name="person-outline" size={16} color={isDark ? "#94A3B8" : "#6B7280"} />
                                        <Text style={[styles.modalWriterName, isDark && styles.darkSubText]}>{selectedBook.writer}</Text>
                                    </View>

                                    <View style={[styles.modalDivider, isDark && styles.darkBorder]} />

                                    <Text style={[styles.detailsLabel, isDark && styles.darkText]}>About this book</Text>
                                    <Text style={[styles.detailsText, isDark && styles.darkSubText]}>{selectedBook.details || 'No additional details available for this book.'}</Text>

                                    <View style={[styles.modalDivider, isDark && styles.darkBorder]} />

                                    <View style={styles.modalOwnerRow}>
                                        <Text style={[styles.detailsLabel, isDark && styles.darkText]}>Shared by</Text>
                                        <View style={styles.ownerInfo}>
                                            <View style={styles.ownerAvatar}>
                                                <Text style={styles.ownerInitial}>{selectedBook.owner?.charAt(0) || 'U'}</Text>
                                            </View>
                                            <Text style={[styles.ownerName, isDark && styles.darkText]}>{selectedBook.owner}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.modalDistanceRow}>
                                        <Ionicons name="navigate-outline" size={18} color="#0D9488" />
                                        <Text style={[styles.modalDistanceText, isDark && styles.darkText]}>{formatDistance(selectedBook.distance)}</Text>
                                    </View>
                                </View>
                            </ScrollView>
                        )}

                        <View style={[styles.modalFooter, isDark && styles.darkBorder]}>
                            <TouchableOpacity
                                style={[styles.modalCloseAction, isDark && { backgroundColor: '#334155' }]}
                                onPress={() => setIsModalVisible(false)}
                            >
                                <Text style={[styles.modalCloseText, isDark && { color: '#e2e8f0' }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalLibraryBtn}
                                onPress={() => selectedBook && handleViewLibrary(selectedBook.userId, selectedBook.owner)}
                            >
                                <Ionicons name="library-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.modalLibraryBtnText}>View Library</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    darkContainer: {
        backgroundColor: '#0f172a',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 40,
        flexGrow: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    bookCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginBottom: 20,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 6,
        overflow: 'hidden',
    },
    darkBookCard: {
        backgroundColor: '#1e293b',
        shadowColor: '#000',
        elevation: 0,
    },
    imageWrapper: {
        width: '100%',
        height: 220,
        position: 'relative',
    },
    bookImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    distanceBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(13, 148, 136, 0.95)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    distanceText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
        marginLeft: 4,
    },
    bookContent: {
        padding: 20,
    },
    bookTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    darkText: {
        color: '#f8fafc',
    },
    writerName: {
        fontSize: 15,
        color: '#64748B',
        marginTop: 4,
        fontWeight: '500',
    },
    darkSubText: {
        color: '#94a3b8',
    },
    ownerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    darkBorder: {
        borderBottomColor: '#334155',
    },
    ownerAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#0D9488',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    ownerInitial: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    ownerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 13,
        color: '#64748B',
        marginLeft: 6,
        fontWeight: '500',
    },
    actionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailsBtn: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginRight: 8,
    },
    darkDetailsBtn: {
        backgroundColor: '#334155',
    },
    detailsBtnText: {
        color: '#475569',
        fontSize: 13,
        fontWeight: '700',
    },
    darkDetailsBtnText: {
        color: '#e2e8f0',
    },
    requestBtn: {
        backgroundColor: '#0D9488',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    requestBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    errorTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#1E293B',
        marginTop: 16,
    },
    errorText: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 24,
        lineHeight: 22,
    },
    retryBtn: {
        backgroundColor: '#0D9488',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 16,
    },
    retryBtnText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 15,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyIconBg: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#F0FDFA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    darkEmptyIconBg: {
        backgroundColor: '#134e4a20',
        borderColor: '#134e4a',
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 50,
        marginBottom: 32,
        lineHeight: 22,
    },
    shareBookBtn: {
        borderWidth: 2,
        borderColor: '#0D9488',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 16,
    },
    shareBookBtnText: {
        color: '#0D9488',
        fontWeight: '800',
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        width: '100%',
    },
    darkModalContent: {
        backgroundColor: '#0f172a',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    closeBtn: {
        padding: 4,
    },
    modalBody: {
        paddingBottom: 40,
    },
    modalBookImage: {
        width: '100%',
        height: 350,
    },
    modalInfoContainer: {
        padding: 24,
    },
    modalBookName: {
        fontSize: 26,
        fontWeight: '900',
        color: '#1E293B',
        lineHeight: 32,
    },
    modalWriterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    modalWriterName: {
        fontSize: 16,
        color: '#64748B',
        marginLeft: 6,
        fontWeight: '600',
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 20,
    },
    detailsLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    detailsText: {
        fontSize: 16,
        color: '#475569',
        lineHeight: 26,
    },
    modalOwnerRow: {
        marginTop: 10,
    },
    modalDistanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDFA',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginTop: 24,
        alignSelf: 'flex-start',
    },
    modalDistanceText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0D9488',
        marginLeft: 8,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: 'transparent',
    },
    modalCloseAction: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginRight: 12,
    },
    modalCloseText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#475569',
    },
    libraryBtn: {
        backgroundColor: '#0D9488',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    libraryBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
    modalLibraryBtn: {
        flex: 2,
        backgroundColor: '#0D9488',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    modalLibraryBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});

export default NearByBooks;
