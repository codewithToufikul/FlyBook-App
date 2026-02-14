import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StatusBar,
    RefreshControl,
    TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCommunities, getMyCommunities, Community } from '../../services/communityService';

const CommunitiesScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [publicCommunities, setPublicCommunities] = useState<Community[]>([]);
    const [myCommunities, setMyCommunities] = useState<Community[]>([]);
    const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'public' | 'my'>('public');

    const fetchCommunities = useCallback(async () => {
        try {
            setLoading(true);
            const [allData, myData] = await Promise.all([
                getCommunities(),
                getMyCommunities()
            ]);

            // Public communities are all communities except the ones I created
            const userOwnedIds = new Set(myData.map(c => c._id));
            const publicData = allData.filter(c => !userOwnedIds.has(c._id));

            setPublicCommunities(publicData);
            setMyCommunities(myData);
        } catch (error) {
            console.error('Failed to load communities:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchCommunities();
        });
        return unsubscribe;
    }, [navigation, fetchCommunities]);

    useEffect(() => {
        const sourceData = activeTab === 'public' ? publicCommunities : myCommunities;
        const filtered = sourceData.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredCommunities(filtered);
    }, [searchQuery, publicCommunities, myCommunities, activeTab]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchCommunities();
    }, [fetchCommunities]);

    const renderCommunityItem = ({ item }: { item: Community }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('CommunityDetails', { communityId: item._id })}
        >
            <Image
                source={{ uri: item.logo || 'https://via.placeholder.com/150' }}
                style={styles.logo}
            />
            <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    {item.isVerified && (
                        <Ionicons name="checkmark-circle" size={16} color="#0D9488" style={styles.verifiedIcon} />
                    )}
                </View>
                <Text style={styles.category}>{item.category}</Text>
                <View style={styles.stats}>
                    <Ionicons name="people-outline" size={14} color="#6B7280" />
                    <Text style={styles.statsText}>{item.membersCount} members</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.joinBtn}
                onPress={() => navigation.navigate('CommunityDetails', { communityId: item._id })}
            >
                <Text style={styles.joinBtnText}>View</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Communities</Text>
                <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => navigation.navigate('CreateCommunity')}
                >
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Tab System */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'public' && styles.activeTab]}
                    onPress={() => setActiveTab('public')}
                >
                    <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>Public Community</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'my' && styles.activeTab]}
                    onPress={() => setActiveTab('my')}
                >
                    <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>My Community</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search communities..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color="#0D9488" />
                </View>
            ) : (
                <FlatList
                    data={filteredCommunities}
                    renderItem={renderCommunityItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={80} color="#D1D5DB" />
                            <Text style={styles.emptyTitle}>
                                {activeTab === 'public' ? 'No Communities Found' : 'No Created Communities'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {activeTab === 'public'
                                    ? 'Try searching for something else or create your own community.'
                                    : 'You haven\'t created any communities yet. Start one today!'}
                            </Text>
                            {activeTab === 'my' && (
                                <TouchableOpacity
                                    style={styles.startBtn}
                                    onPress={() => navigation.navigate('CreateCommunity')}
                                >
                                    <Text style={styles.startBtnText}>Start Community</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
    },
    createBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#0D9488',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: '#0D9488',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#0D9488',
        fontWeight: '700',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 46,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#1F2937',
        padding: 0,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    logo: {
        width: 70,
        height: 70,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
    },
    cardInfo: {
        flex: 1,
        marginLeft: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        maxWidth: '85%',
    },
    verifiedIcon: {
        marginLeft: 4,
    },
    category: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    statsText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
        fontWeight: '500',
    },
    joinBtn: {
        backgroundColor: '#F0FDFA',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    joinBtnText: {
        color: '#0D9488',
        fontSize: 14,
        fontWeight: '700',
    },
    centerLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#374151',
        marginTop: 20,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    startBtn: {
        marginTop: 20,
        backgroundColor: '#0D9488',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    startBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});

export default CommunitiesScreen;
