import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    RefreshControl,
    ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getClientProjects } from '../../services/jobService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Project {
    _id: string;
    title: string;
    budgetType: 'fixed' | 'hourly';
    budget?: number;
    hourlyRate?: number;
    status: string;
    category?: string;
    createdAt: string;
    proposalCount?: number;
}

const ClientDashboard = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getClientProjects();
            setProjects(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProjects();
    }, [fetchProjects]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'open':
                return { bg: '#D1FAE5', text: '#065F46' };
            case 'in_progress':
                return { bg: '#FEF3C7', text: '#92400E' };
            case 'completed':
                return { bg: '#DBEAFE', text: '#1E40AF' };
            default:
                return { bg: '#F3F4F6', text: '#374151' };
        }
    };

    const renderProjectItem = ({ item }: { item: Project }) => {
        const statusStyle = getStatusStyle(item.status);

        return (
            <TouchableOpacity
                style={styles.projectCard}
                onPress={() => navigation.navigate('ProjectDetails', { projectId: item._id })}
                activeOpacity={0.8}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.projectTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
                        </Text>
                    </View>
                </View>

                <View style={styles.metaRow}>
                    <View style={[styles.typeBadge, item.budgetType === 'fixed' ? styles.blueBadge : styles.yellowBadge]}>
                        <Text style={item.budgetType === 'fixed' ? styles.blueBadgeText : styles.yellowBadgeText}>
                            {item.budgetType === 'fixed' ? 'Fixed' : 'Hourly'}
                        </Text>
                    </View>
                    {item.category && (
                        <View style={styles.metaItem}>
                            <Ionicons name="folder-outline" size={14} color="#6B7280" />
                            <Text style={styles.metaText}>{item.category}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.budgetRow}>
                    <Ionicons name="cash-outline" size={16} color="#10B981" />
                    <Text style={styles.budgetText}>
                        {item.budgetType === 'fixed'
                            ? `Budget: ৳${item.budget?.toLocaleString()}`
                            : `Rate: ৳${item.hourlyRate?.toLocaleString()}/hr`}
                    </Text>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                        <Ionicons name="people-outline" size={14} color="#6B7280" />
                        <Text style={styles.footerText}>
                            {item.proposalCount || 0} Proposals
                        </Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text style={styles.footerText}>
                            Posted: {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                <View style={styles.viewAction}>
                    <Text style={styles.actionText}>Manage Project</Text>
                    <Ionicons name="arrow-forward" size={16} color="#059669" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Client Dashboard</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('PostProject')}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color="#10B981" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : (
                <FlatList
                    data={projects}
                    renderItem={renderProjectItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
                    }
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <Text style={styles.listTitle}>My Projects</Text>
                            <TouchableOpacity
                                style={styles.postNewButton}
                                onPress={() => navigation.navigate('PostProject')}
                            >
                                <Text style={styles.postNewText}>Post New Project</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="rocket-outline" size={64} color="#D1D5DB" />
                            </View>
                            <Text style={styles.emptyTitle}>No Projects Found</Text>
                            <Text style={styles.emptyText}>
                                You haven't posted any freelance projects yet.
                            </Text>
                            <TouchableOpacity
                                style={styles.postFirstButton}
                                onPress={() => navigation.navigate('PostProject')}
                            >
                                <Text style={styles.postFirstText}>Post Your First Project</Text>
                            </TouchableOpacity>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    backButton: {
        padding: 4,
    },
    addButton: {
        padding: 4,
    },
    centerLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    listTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    postNewButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    postNewText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    projectCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    projectTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    blueBadge: {
        backgroundColor: '#DBEAFE',
    },
    blueBadgeText: {
        color: '#1E40AF',
        fontSize: 10,
        fontWeight: '600',
    },
    yellowBadge: {
        backgroundColor: '#FEF3C7',
    },
    yellowBadgeText: {
        color: '#92400E',
        fontSize: 10,
        fontWeight: '600',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 13,
        color: '#6B7280',
    },
    budgetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    budgetText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#059669',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginBottom: 12,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 12,
        color: '#6B7280',
    },
    viewAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#F0FDF4',
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionText: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: '#6B7280',
        marginBottom: 24,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    postFirstButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    postFirstText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ClientDashboard;
