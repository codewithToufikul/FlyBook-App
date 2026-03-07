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
import { useTheme } from '../../contexts/ThemeContext';

const CommunitiesScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
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
            style={[styles.card, isDark && { backgroundColor: '#1e293b', shadowColor: '#000' }]}
            onPress={() => navigation.navigate('CommunityDetails', { communityId: item._id })}
        >
            <Image
                source={{ uri: item.logo || 'https://via.placeholder.com/150' }}
                style={[styles.logo, isDark && { backgroundColor: '#0f172a' }]}
            />
            <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.name, isDark && { color: '#f8fafc' }]} numberOfLines={1}>{item.name}</Text>
                    {item.isVerified && (
                        <Ionicons name="checkmark-circle" size={16} color={isDark ? "#14b8a6" : "#0D9488"} style={styles.verifiedIcon} />
                    )}
                </View>
                <Text style={[styles.category, isDark && { color: '#94a3b8' }]}>{item.category}</Text>
                <View style={styles.stats}>
                    <Ionicons name="people-outline" size={14} color={isDark ? "#64748b" : "#6B7280"} />
                    <Text style={[styles.statsText, isDark && { color: '#64748b' }]}>{item.membersCount} members</Text>
                </View>
            </View>
            <TouchableOpacity
                style={[styles.joinBtn, isDark && { backgroundColor: 'rgba(20, 184, 166, 0.1)', borderColor: '#14b8a6' }]}
                onPress={() => navigation.navigate('CommunityDetails', { communityId: item._id })}
            >
                <Text style={[styles.joinBtnText, isDark && { color: '#14b8a6' }]}>View</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }, { paddingTop: insets.top }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFFFFF"} />

            <View style={[styles.header, isDark && { backgroundColor: '#0f172a' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#1F2937"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Communities</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={[styles.createBtn, { backgroundColor: '#4F46E5', marginRight: 8 }]}
                        onPress={() => navigation.navigate('SocialResponse')}
                    >
                        <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.createBtn, isDark && { backgroundColor: '#14b8a6', shadowColor: '#14b8a6' }]}
                        onPress={() => navigation.navigate('CreateCommunity')}
                    >
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tab System */}
            <View style={[styles.tabContainer, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'public' && [styles.activeTab, isDark && { borderBottomColor: '#14b8a6' }]]}
                    onPress={() => setActiveTab('public')}
                >
                    <Text style={[styles.tabText, isDark && { color: '#64748b' }, activeTab === 'public' && [styles.activeTabText, isDark && { color: '#14b8a6' }]]}>Public Community</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'my' && [styles.activeTab, isDark && { borderBottomColor: '#14b8a6' }]]}
                    onPress={() => setActiveTab('my')}
                >
                    <Text style={[styles.tabText, isDark && { color: '#64748b' }, activeTab === 'my' && [styles.activeTabText, isDark && { color: '#14b8a6' }]]}>My Community</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, isDark && { backgroundColor: '#0f172a' }]}>
                <View style={[styles.searchBar, isDark && { backgroundColor: '#1e293b' }]}>
                    <Ionicons name="search-outline" size={20} color={isDark ? "#94a3b8" : "#9CA3AF"} />
                    <TextInput
                        style={[styles.searchInput, isDark && { color: '#f8fafc' }]}
                        placeholder="Search communities..."
                        placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={isDark ? "#94a3b8" : "#9CA3AF"} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={[styles.centerLoader, isDark && { backgroundColor: '#0f172a' }]}>
                    <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#0D9488"} />
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
                            <Ionicons name="people-outline" size={80} color={isDark ? "#1e293b" : "#D1D5DB"} />
                            <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>
                                {activeTab === 'public' ? 'No Communities Found' : 'No Created Communities'}
                            </Text>
                            <Text style={[styles.emptySubtitle, isDark && { color: '#94a3b8' }]}>
                                {activeTab === 'public'
                                    ? 'Try searching for something else or create your own community.'
                                    : 'You haven\'t created any communities yet. Start one today!'}
                            </Text>
                            {activeTab === 'my' && (
                                <TouchableOpacity
                                    style={[styles.startBtn, isDark && { backgroundColor: '#14b8a6' }]}
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
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
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
