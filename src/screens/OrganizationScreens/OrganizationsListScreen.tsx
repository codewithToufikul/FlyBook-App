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
import { getApprovedOrganizations, getSocialOrganizations, Organization } from '../../services/orgService';

const { width } = Dimensions.get('window');

const OrganizationsList = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'partner' | 'social'>('partner');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchOrganizations = useCallback(async () => {
        try {
            setLoading(true);
            let data: Organization[] = [];
            if (activeTab === 'partner') {
                data = await getApprovedOrganizations();
            } else {
                data = await getSocialOrganizations();
            }
            setOrganizations(data);
        } catch (error) {
            console.error('Failed to load organizations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchOrganizations();
    }, [fetchOrganizations]);

    const filteredOrganizations = organizations.filter(org =>
        org.orgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderOrgItem = ({ item }: { item: Organization }) => (
        <TouchableOpacity
            style={[styles.orgCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}
            onPress={() => navigation.navigate('OrganizationDetails', { orgId: item._id })}
            activeOpacity={0.9}
        >
            <Image
                source={{ uri: item.profileImage || 'https://via.placeholder.com/300x200' }}
                style={styles.orgImage}
            />
            <View style={styles.orgInfo}>
                <View style={styles.postByRow}>
                    <Image
                        source={{ uri: item.postByProfile || 'https://via.placeholder.com/40x40' }}
                        style={[styles.postByAvatar, isDark && { backgroundColor: '#0f172a' }]}
                    />
                    <View>
                        <Text style={[styles.postByName, isDark && { color: '#f8fafc' }]}>{item.postByName || 'Admin'}</Text>
                        <Text style={[styles.postDate, isDark && { color: '#64748b' }]}>
                            {new Date(item.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </Text>
                    </View>
                </View>
                <Text style={[styles.orgName, isDark && { color: '#f8fafc' }]} numberOfLines={1}>{item.orgName}</Text>
                <Text style={[styles.orgDescription, isDark && { color: '#94a3b8' }]} numberOfLines={2}>
                    {item.description}
                </Text>
                <View style={styles.cardFooter}>
                    <View style={[styles.viewBadge, isDark && { backgroundColor: 'rgba(20, 184, 166, 0.1)' }]}>
                        <Text style={[styles.viewBadgeText, isDark && { color: '#14b8a6' }]}>View Details</Text>
                        <Ionicons name="arrow-forward" size={14} color={isDark ? "#14b8a6" : "#6366F1"} />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }, { paddingTop: insets.top }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFFFFF"} />

            {/* Header */}
            <View style={[styles.header, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <View>
                    <Text style={[styles.headerSubtitle, isDark && { color: '#14b8a6' }]}>Discover & Connect</Text>
                    <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Organizations</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.iconButton, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}
                        onPress={() => navigation.navigate('MyOrganizations')}
                    >
                        <Ionicons name="business-outline" size={24} color={isDark ? "#f8fafc" : "#1F2937"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.iconButton, styles.addBtn, isDark && { backgroundColor: '#14b8a6', borderColor: '#0d9488' }]}
                        onPress={() => navigation.navigate('AddOrganization')}
                    >
                        <Ionicons name="plus" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View style={[styles.tabContainer, isDark && { backgroundColor: '#0f172a' }]}>
                <TouchableOpacity
                    style={[styles.tab, isDark && { backgroundColor: '#1e293b', borderColor: 'transparent' }, activeTab === 'partner' && (isDark ? styles.activeTabDark : styles.activeTab)]}
                    onPress={() => setActiveTab('partner')}
                >
                    <Ionicons
                        name="briefcase"
                        size={18}
                        color={activeTab === 'partner' ? (isDark ? '#14b8a6' : '#6366F1') : (isDark ? '#64748b' : '#6B7280')}
                    />
                    <Text style={[styles.tabText, isDark && { color: '#64748b' }, activeTab === 'partner' && (isDark ? styles.activeTabTextDark : styles.activeTabText)]}>
                        Partners
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, isDark && { backgroundColor: '#1e293b', borderColor: 'transparent' }, activeTab === 'social' && (isDark ? styles.activeTabDark : styles.activeTab)]}
                    onPress={() => setActiveTab('social')}
                >
                    <Ionicons
                        name="people"
                        size={18}
                        color={activeTab === 'social' ? (isDark ? '#14b8a6' : '#6366F1') : (isDark ? '#64748b' : '#6B7280')}
                    />
                    <Text style={[styles.tabText, isDark && { color: '#64748b' }, activeTab === 'social' && (isDark ? styles.activeTabTextDark : styles.activeTabText)]}>
                        Social
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <View style={[styles.searchInputWrapper, isDark && { backgroundColor: '#1e293b' }]}>
                    <Ionicons name="search" size={20} color={isDark ? "#475569" : "#9CA3AF"} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, isDark && { color: '#f8fafc' }]}
                        placeholder="Search organizations..."
                        placeholderTextColor={isDark ? "#475569" : "#9CA3AF"}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={isDark ? "#475569" : "#9CA3AF"} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={[styles.centerLoader, isDark && { backgroundColor: '#0f172a' }]}>
                    <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#6366F1"} />
                    <Text style={[styles.loadingText, isDark && { color: '#94a3b8' }]}>Fetching Organizations...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredOrganizations}
                    renderItem={renderOrgItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[isDark ? '#14b8a6' : '#6366F1']}
                            tintColor={isDark ? '#14b8a6' : '#6366F1'}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="business-outline" size={80} color={isDark ? "#1e293b" : "#D1D5DB"} />
                            <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>No Organizations Found</Text>
                            <Text style={[styles.emptySubtitle, isDark && { color: '#64748b' }]}>
                                We couldn't find any organizations matching your criteria.
                            </Text>
                            <TouchableOpacity
                                style={[styles.retryButton, isDark && { backgroundColor: '#14b8a6' }]}
                                onPress={onRefresh}
                            >
                                <Text style={styles.retryButtonText}>Refresh List</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
};

export default OrganizationsList;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    addBtn: {
        backgroundColor: '#6366F1',
        borderColor: '#4F46E5',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        gap: 12,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        gap: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeTab: {
        backgroundColor: '#EEF2FF',
        borderColor: '#6366F1',
    },
    activeTabDark: {
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        borderColor: '#14b8a6',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#6366F1',
    },
    activeTabTextDark: {
        color: '#14b8a6',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 14,
        paddingHorizontal: 15,
        height: 50,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    orgCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    orgImage: {
        width: '100%',
        height: 180,
        backgroundColor: '#E5E7EB',
    },
    orgInfo: {
        padding: 16,
    },
    postByRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    postByAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
    },
    postByName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
    },
    postDate: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    orgName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 6,
    },
    orgDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    viewBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    viewBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6366F1',
    },
    centerLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#374151',
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
