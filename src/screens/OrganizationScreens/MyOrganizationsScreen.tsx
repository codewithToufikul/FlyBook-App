import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Image,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getOrganizationsByUser, Organization } from '../../services/orgService';
import { getUser } from '../../services/api';

const { width } = Dimensions.get('window');

const MyOrganizations = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMyOrgs = useCallback(async () => {
        try {
            const user = await getUser();
            if (user && user._id) {
                const data = await getOrganizationsByUser(user._id);
                setOrganizations(data);
            }
        } catch (error) {
            console.error('Failed to load my organizations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchMyOrgs();
    }, [fetchMyOrgs]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMyOrgs();
    }, [fetchMyOrgs]);

    const getStatusStyle = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'aprooved':
            case 'approved':
                return { bg: '#ECFDF5', text: '#10B981', label: 'Approved' };
            case 'pending':
                return { bg: '#FFF7ED', text: '#F97316', label: 'Pending' };
            case 'rejected':
                return { bg: '#FEF2F2', text: '#EF4444', label: 'Rejected' };
            default:
                return { bg: '#F3F4F6', text: '#6B7280', label: status || 'Unknown' };
        }
    };

    const renderOrgItem = ({ item }: { item: Organization }) => {
        const statusStyle = getStatusStyle(item.status);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('OrganizationDetails', { orgId: item._id })}
            >
                <Image source={{ uri: item.profileImage }} style={styles.cardImage} />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.orgName} numberOfLines={1}>{item.orgName}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                {statusStyle.label}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.orgDesc} numberOfLines={2}>{item.description}</Text>

                    <View style={styles.cardFooter}>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Ionicons name="people-outline" size={14} color="#6B7280" />
                                <Text style={styles.statText}>23 Members</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                                <Text style={styles.statText}>
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.manageBtn}
                            onPress={() => navigation.navigate('OrganizationDetails', { orgId: item._id })}
                        >
                            <Text style={styles.manageBtnText}>Manage</Text>
                            <Ionicons name="settings-outline" size={14} color="#6366F1" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Organizations</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddOrganization')}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            ) : (
                <FlatList
                    data={organizations}
                    renderItem={renderOrgItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="business" size={64} color="#D1D5DB" />
                            </View>
                            <Text style={styles.emptyTitle}>No Organizations Yet</Text>
                            <Text style={styles.emptySubtitle}>
                                You haven't created any organizations. Start by adding one today!
                            </Text>
                            <TouchableOpacity
                                style={styles.createBtn}
                                onPress={() => navigation.navigate('AddOrganization')}
                            >
                                <Text style={styles.createBtnText}>Create Organization</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
};

export default MyOrganizations;

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
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
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
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    cardImage: {
        width: '100%',
        height: 140,
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orgName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    orgDesc: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    statDivider: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
    },
    manageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    manageBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6366F1',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#374151',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        paddingHorizontal: 40,
        marginBottom: 24,
        lineHeight: 20,
    },
    createBtn: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        elevation: 4,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    createBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
