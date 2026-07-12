import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Image,
  Platform,
  PermissionsAndroid,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchDefaulters, Defaulter } from '../../services/libraryService';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';

const { height } = Dimensions.get('window');

// Haversine formula to compute distance in km
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

const BreachOfContract = () => {
  const { isDark } = useTheme();
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);

  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 23.8103, // Default to Dhaka coordinates
    longitude: 90.4125,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  
  const [selectedDefaulter, setSelectedDefaulter] = useState<Defaulter | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    requestLocationPermission();
    loadDefaulters();
  }, []);

  useEffect(() => {
    if (userLocation && mapRef.current && mapReady) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }, 1000);
    }
  }, [userLocation, mapReady]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 3) {
      setSearchSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=bd`,
        {
          headers: {
            'User-Agent': 'FlyBook-App',
          },
        }
      );
      const data = await response.json();
      setSearchSuggestions(data || []);
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    const newRegion = {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    setMapRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
    setSearchSuggestions([]);
    setSearchQuery(item.display_name.split(',')[0]); // Use short name
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization();
      getCurrentUserLocation();
    } else {
      try {
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        const fineGranted = results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
        const coarseGranted = results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION];

        if (
          fineGranted === PermissionsAndroid.RESULTS.GRANTED ||
          coarseGranted === PermissionsAndroid.RESULTS.GRANTED
        ) {
          getCurrentUserLocation();
        } else {
          Alert.alert('Permission Denied', 'Location permission is required to view nearby defaulters on the map.');
          getCurrentUserLocation(); // Try fallback/default location if denied
        }
      } catch (err) {
        console.warn('Location permission request error:', err);
      }
    }
  };

  const getCurrentUserLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };
        setMapRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
      },
      (error) => {
        console.warn('Geolocation error:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const loadDefaulters = async () => {
    setLoading(true);
    try {
      const response = await fetchDefaulters();
      if (response && response.success) {
        setDefaulters(response.data);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch defaulters list.' });
      }
    } catch (err: any) {
      console.error('Error fetching defaulters:', err);
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to fetch data.' });
    } finally {
      setLoading(false);
    }
  };

  // Filter out any defaulters who don't have valid coordinates
  const validDefaulters = defaulters.filter(
    (d) => d.location && d.location.coordinates && d.location.coordinates.length === 2
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#1e293b" : "#fff"}
      />

      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1e293b', '#0f172a'] : ['#ffffff', '#f8fafc']}
        style={[styles.header, isDark && styles.headerDark]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, isDark && styles.backBtnDark]}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#1E293B"} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Breach of Contract</Text>
          <Text style={styles.headerSubtitle}>Public Defaulters Registry Map</Text>
        </View>
        <TouchableOpacity
          onPress={loadDefaulters}
          style={[styles.refreshBtn, isDark && styles.refreshBtnDark]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Ionicons name="refresh" size={20} color="#ef4444" />
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* Map Content */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          onMapReady={() => setMapReady(true)}
        >
          {/* User Marker */}
          {userLocation && (
            <Marker coordinate={userLocation} zIndex={10}>
              <View style={styles.userIndicatorContainer}>
                <View style={styles.userIndicatorOuter} />
                <View style={styles.userIndicatorBadge}>
                  <Ionicons name="person" size={16} color="#0D9488" />
                </View>
              </View>
            </Marker>
          )}

          {/* Defaulter Markers */}
          {validDefaulters.map((defaulter) => {
            const lat = defaulter.location!.coordinates[1];
            const lng = defaulter.location!.coordinates[0];

            return (
              <Marker
                key={defaulter.bookId}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => setSelectedDefaulter(defaulter)}
              >
                <View style={styles.defaulterMarker}>
                  <View style={styles.markerBadge}>
                    <Ionicons name="warning" size={10} color="#fff" />
                  </View>
                  <Image
                    source={{ uri: defaulter.faceVerificationUrl || 'https://via.placeholder.com/150' }}
                    style={styles.defaulterMarkerImage}
                  />
                  <View style={styles.markerArrow} />
                </View>
              </Marker>
            );
          })}
        </MapView>

        {/* Floating Search Bar */}
        <View style={styles.searchBarContainer}>
          <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
            <Ionicons name="search" size={20} color={isDark ? '#94a3b8' : '#64748b'} style={styles.searchIcon} />
            <TextInput
              placeholder="Search location..."
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={searchQuery}
              onChangeText={handleSearch}
              style={[styles.searchInput, isDark && styles.searchInputDark]}
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchSuggestions([]);
                }}
              >
                <Ionicons name="close-circle" size={20} color={isDark ? '#94a3b8' : '#64748b'} style={{ marginRight: 5 }} />
              </TouchableOpacity>
            ) : null}
            {searching ? <ActivityIndicator size="small" color="#ef4444" style={{ marginLeft: 5 }} /> : null}
          </View>

          {/* Suggestions Dropdown */}
          {searchSuggestions.length > 0 && (
            <View style={[styles.suggestionsContainer, isDark && styles.suggestionsContainerDark]}>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
                {searchSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.suggestionItem, isDark && styles.suggestionItemDark]}
                    onPress={() => selectLocation(item)}
                  >
                    <Ionicons name="location-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text
                      numberOfLines={1}
                      style={[styles.suggestionText, isDark && styles.suggestionTextDark]}
                    >
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Floating Actions */}
        <TouchableOpacity
          style={styles.nearMeBtn}
          onPress={getCurrentUserLocation}
        >
          <Ionicons name="locate" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Selected Defaulter Panel */}
      {selectedDefaulter && (
        <View style={[styles.detailPanel, isDark && styles.detailPanelDark]}>
          <View style={styles.panelHeader}>
            <Text style={[styles.panelTitle, isDark && styles.panelTitleDark]}>Defaulter Profile</Text>
            <TouchableOpacity onPress={() => setSelectedDefaulter(null)}>
              <Ionicons name="close-circle" size={24} color={isDark ? "#94a3b8" : "#64748b"} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelScroll}>
            <View style={styles.defaulterCard}>
              <View style={styles.defaulterProfileSection}>
                <Image
                  source={{ uri: selectedDefaulter.faceVerificationUrl || 'https://via.placeholder.com/150' }}
                  style={styles.defaulterFaceImage}
                />
                <View style={styles.defaulterMainInfo}>
                  <Text style={[styles.defaulterName, isDark && styles.defaulterNameDark]}>
                    {selectedDefaulter.defaulterName}
                  </Text>
                  <View style={styles.badgeOverdue}>
                    <Ionicons name="alert-circle" size={14} color="#FFF" />
                    <Text style={styles.badgeOverdueText}>
                      Overdue by {selectedDefaulter.daysOverdue} Day{selectedDefaulter.daysOverdue > 1 ? 's' : ''}
                    </Text>
                  </View>
                  {selectedDefaulter.defaulterPhone ? (
                    <Text style={styles.defaulterPhone}>Phone: {selectedDefaulter.defaulterPhone}</Text>
                  ) : null}
                  {userLocation && (
                    <Text style={styles.defaulterDistance}>
                      Distance:{' '}
                      {getDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        selectedDefaulter.location!.coordinates[1],
                        selectedDefaulter.location!.coordinates[0]
                      ).toFixed(2)}{' '}
                      km away
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.bookDetailsSection}>
                <Text style={styles.sectionHeader}>Overdue Book Details</Text>
                <View style={styles.bookInfoRow}>
                  <Image source={{ uri: selectedDefaulter.imageUrl }} style={styles.bookThumbnail} />
                  <View style={styles.bookTextInfo}>
                    <Text style={[styles.bookNameText, isDark && styles.bookNameTextDark]}>
                      {selectedDefaulter.bookName}
                    </Text>
                    <Text style={styles.bookWriterText}>by {selectedDefaulter.writer}</Text>
                    <Text style={styles.bookOwnerText}>Owner: {selectedDefaulter.ownerName}</Text>
                  </View>
                </View>
              </View>

              {selectedDefaulter.conditionPhotos && selectedDefaulter.conditionPhotos.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.conditionPhotosSection}>
                    <Text style={styles.sectionHeader}>Borrowing Condition Photos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.conditionPhotosContainer}>
                      {selectedDefaulter.conditionPhotos.map((photoUrl, index) => (
                        <Image key={index} source={{ uri: photoUrl }} style={styles.conditionPhoto} />
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}

              <View style={styles.divider} />

              <View style={styles.metaInfoSection}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Borrowed Date:</Text>
                  <Text style={[styles.metaValue, isDark && styles.metaValueDark]}>
                    {new Date(selectedDefaulter.transferredAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Return Deadline:</Text>
                  <Text style={[styles.metaValue, styles.textRed]}>
                    {new Date(selectedDefaulter.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerDark: {
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnDark: {
    backgroundColor: '#1e293b',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerTitleDark: {
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshBtnDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  userIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  userIndicatorOuter: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 148, 136, 0.25)',
  },
  userIndicatorBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  defaulterMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 60,
  },
  markerBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  defaulterMarkerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#EF4444',
    backgroundColor: '#FFF',
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#EF4444',
    transform: [{ rotate: '180deg' }],
    marginTop: -2,
  },
  nearMeBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  detailPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.45,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  detailPanelDark: {
    backgroundColor: '#1e293b',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  panelTitleDark: {
    color: '#F8FAFC',
  },
  panelScroll: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  defaulterCard: {
    marginTop: 10,
  },
  defaulterProfileSection: {
    flexDirection: 'row',
    gap: 16,
  },
  defaulterFaceImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#EF4444',
  },
  defaulterMainInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  defaulterName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  defaulterNameDark: {
    color: '#F8FAFC',
  },
  badgeOverdue: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 2,
  },
  badgeOverdueText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  defaulterPhone: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  defaulterDistance: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 15,
  },
  bookDetailsSection: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookInfoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  bookThumbnail: {
    width: 50,
    height: 70,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  bookTextInfo: {
    flex: 1,
    gap: 2,
  },
  bookNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  bookNameTextDark: {
    color: '#F8FAFC',
  },
  bookWriterText: {
    fontSize: 13,
    color: '#64748B',
  },
  bookOwnerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D9488',
  },
  metaInfoSection: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  metaValueDark: {
    color: '#F8FAFC',
  },
  textRed: {
    color: '#EF4444',
  },
  searchBarContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  searchBarDark: {
    backgroundColor: '#1E293B',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    paddingVertical: 8,
  },
  searchInputDark: {
    color: '#F8FAFC',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  suggestionsContainerDark: {
    backgroundColor: '#1E293B',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionItemDark: {
    borderBottomColor: '#334155',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
  },
  suggestionTextDark: {
    color: '#CBD5E1',
  },
  conditionPhotosSection: {
    gap: 8,
  },
  conditionPhotosContainer: {
    gap: 12,
    paddingVertical: 4,
  },
  conditionPhoto: {
    width: 100,
    height: 140,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});

export default BreachOfContract;
