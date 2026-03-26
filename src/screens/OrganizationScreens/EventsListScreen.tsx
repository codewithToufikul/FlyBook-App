import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Image,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { getAllActivities, OrgActivity } from '../../services/orgService';

const { width } = Dimensions.get('window');

const EventsListScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const [events, setEvents] = useState<OrgActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllActivities();
            setEvents(data);
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchEvents();
    }, [fetchEvents]);

    const filteredEvents = events.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.orgName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderEventItem = ({ item }: { item: OrgActivity }) => (
        <TouchableOpacity
            style={[styles.eventCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}
            onPress={() => navigation.navigate('ActivityDetails', { activityId: item._id })}
            activeOpacity={0.9}
        >
            <View style={styles.cardHeader}>
                <Image
                    source={{ uri: item.orgImage || 'https://via.placeholder.com/40x40' }}
                    style={styles.orgAvatar}
                />
                <View style={styles.headerText}>
                    <Text style={[styles.orgName, isDark && { color: '#f8fafc' }]}>{item.orgName}</Text>
                    <Text style={[styles.eventDate, isDark && { color: '#64748b' }]}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
                <View style={[styles.typeBadge, isDark && { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                    <Text style={styles.typeBadgeText}>Event</Text>
                </View>
            </View>

            {item.image && (
                <Image source={{ uri: item.image }} style={styles.eventImage} />
            )}

            <View style={styles.eventContent}>
                <Text style={[styles.eventTitle, isDark && { color: '#f8fafc' }]} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={[styles.eventDetails, isDark && { color: '#94a3b8' }]} numberOfLines={3}>
                    {item.details}
                </Text>

                <View style={styles.footerRow}>
                    <View style={styles.infoItem}>
                        <Ionicons name="location-outline" size={16} color="#3B82F6" />
                        <Text style={[styles.infoText, isDark && { color: '#94a3b8' }]}>{item.place || 'TBD'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="calendar-outline" size={16} color="#3B82F6" />
                        <Text style={[styles.infoText, isDark && { color: '#94a3b8' }]}>{item.date || 'Soon'}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }, { paddingTop: insets.top }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFFFFF"} />

            <View style={[styles.header, isDark && { borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#1F2937"} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerSubtitle, isDark && { color: '#3B82F6' }]}>Join & Explore</Text>
                    <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Upcoming Events</Text>
                </View>
            </View>

            <View style={[styles.searchContainer, isDark && { borderBottomColor: '#1e293b' }]}>
                <View style={[styles.searchInputWrapper, isDark && { backgroundColor: '#1e293b' }]}>
                    <Ionicons name="search" size={20} color={isDark ? "#475569" : "#9CA3AF"} />
                    <TextInput
                        style={[styles.searchInput, isDark && { color: '#f8fafc' }]}
                        placeholder="Search events or organizations..."
                        placeholderTextColor={isDark ? "#475569" : "#9CA3AF"}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    data={filteredEvents}
                    renderItem={renderEventItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContent}>
                            <Ionicons name="calendar-outline" size={80} color={isDark ? "#1e293b" : "#D1D5DB"} />
                            <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>No Events Found</Text>
                            <Text style={[styles.emptySubtitle, isDark && { color: '#64748b' }]}>There are no upcoming events at the moment.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    backBtn: { marginRight: 15 },
    headerTitleContainer: { flex: 1 },
    headerSubtitle: { fontSize: 12, fontWeight: '700', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: 1 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
    searchContainer: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 15, height: 46 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1F2937' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20 },
    eventCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    orgAvatar: { width: 40, height: 40, borderRadius: 20 },
    headerText: { flex: 1, marginLeft: 12 },
    orgName: { fontSize: 15, fontWeight: '700', color: '#374151' },
    eventDate: { fontSize: 12, color: '#6B7280' },
    typeBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#3B82F6' },
    eventImage: { width: '100%', height: 180 },
    eventContent: { padding: 15 },
    eventTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
    eventDetails: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 15 },
    footerRow: { flexDirection: 'row', gap: 15 },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    infoText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
    emptyContent: { alignItems: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 20 },
    emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 },
});

export default EventsListScreen;
