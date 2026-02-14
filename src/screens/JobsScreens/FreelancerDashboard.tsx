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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getMyProposals } from '../../services/jobService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProposalWithProject {
    _id: string;
    projectId: {
        _id: string;
        title: string;
        budgetType: 'fixed' | 'hourly';
        budget?: number;
        hourlyRate?: number;
        category?: string;
        status: string;
    };
    proposedPrice?: number;
    hourlyRate?: number;
    deliveryTime: string;
    coverLetter: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

const FreelancerDashboard = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [proposals, setProposals] = useState<ProposalWithProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchProposals = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMyProposals();
            setProposals(data);
        } catch (error) {
            console.error('Failed to load proposals:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProposals();
    }, [fetchProposals]);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const filteredProposals = proposals.filter(p => {
        if (filter === 'all') return true;
        return p.status === filter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted':
                return '#10B981';
            case 'rejected':
                return '#EF4444';
            case 'pending':
                return '#F59E0B';
            default:
                return '#6B7280';
        }
    };

    const getStatusBgColor = (status: string) => {
        switch (status) {
            case 'accepted':
                return '#D1FAE5';
            case 'rejected':
                return '#FEE2E2';
            case 'pending':
                return '#FEF3C7';
            default:
                return '#F3F4F6';
        }
    };

    const renderProposalItem = ({ item }: { item: ProposalWithProject }) => {
        const project = item.projectId;
        if (!project) return null;

        const isExpanded = expandedId === item._id;

        return (
            <View style={styles.proposalCard}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('ProjectDetails', { projectId: project._id })}
                    activeOpacity={0.9}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.projectTitle} numberOfLines={1}>
                                {project.title}
                            </Text>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusBgColor(item.status) }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: getStatusColor(item.status) }
                                ]}>
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.metaContainer}>
                        {project.category && (
                            <View style={styles.metaItem}>
                                <Ionicons name="folder-outline" size={14} color="#6B7280" />
                                <Text style={styles.metaText}>{project.category}</Text>
                            </View>
                        )}
                        {project.budgetType && (
                            <View style={styles.metaItem}>
                                <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
                                <Text style={styles.metaText}>
                                    {project.budgetType === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.proposalInfo}>
                        {item.proposedPrice && (
                            <View style={styles.infoRow}>
                                <Ionicons name="cash-outline" size={16} color="#10B981" />
                                <Text style={styles.infoLabel}>Your Bid:</Text>
                                <Text style={styles.infoValue}>৳{item.proposedPrice.toLocaleString()}</Text>
                            </View>
                        )}
                        {item.hourlyRate && (
                            <View style={styles.infoRow}>
                                <Ionicons name="cash-outline" size={16} color="#10B981" />
                                <Text style={styles.infoLabel}>Your Rate:</Text>
                                <Text style={styles.infoValue}>৳{item.hourlyRate.toLocaleString()}/hr</Text>
                            </View>
                        )}
                        {item.deliveryTime && (
                            <View style={styles.infoRow}>
                                <Ionicons name="time-outline" size={16} color="#3B82F6" />
                                <Text style={styles.infoLabel}>Delivery:</Text>
                                <Text style={styles.infoValue}>{item.deliveryTime}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.submittedDateRow}>
                        <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.submittedDateText}>
                            Submitted: {new Date(item.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Cover Letter Section */}
                {item.coverLetter && (
                    <View style={styles.coverLetterSection}>
                        <TouchableOpacity
                            style={styles.coverLetterHeader}
                            onPress={() => toggleExpand(item._id)}
                        >
                            <Text style={styles.coverLetterTitle}>Your Cover Letter</Text>
                            <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color="#6B7280"
                            />
                        </TouchableOpacity>

                        {isExpanded && (
                            <Text style={styles.coverLetterText}>{item.coverLetter}</Text>
                        )}
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.viewProjectButton}
                        onPress={() => navigation.navigate('ProjectDetails', { projectId: project._id })}
                    >
                        <Ionicons name="eye-outline" size={16} color="#fff" />
                        <Text style={styles.viewProjectButtonText}>View Project</Text>
                    </TouchableOpacity>

                    {item.status === 'accepted' && project.status === 'in_progress' && (
                        <TouchableOpacity
                            style={styles.chatButton}
                            onPress={() => navigation.navigate('Chat', { userId: project._id })}
                        >
                            <Ionicons name="chatbubbles-outline" size={16} color="#10B981" />
                            <Text style={styles.chatButtonText}>Chat</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Proposals</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('FreelanceMarketplace')}
                    style={styles.browseButton}
                >
                    <Ionicons name="search-outline" size={20} color="#10B981" />
                </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
                        All ({proposals.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
                    onPress={() => setFilter('pending')}
                >
                    <Text style={[styles.filterTabText, filter === 'pending' && styles.filterTabTextActive]}>
                        Pending ({proposals.filter(p => p.status === 'pending').length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'accepted' && styles.filterTabActive]}
                    onPress={() => setFilter('accepted')}
                >
                    <Text style={[styles.filterTabText, filter === 'accepted' && styles.filterTabTextActive]}>
                        Accepted ({proposals.filter(p => p.status === 'accepted').length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterTab, filter === 'rejected' && styles.filterTabActive]}
                    onPress={() => setFilter('rejected')}
                >
                    <Text style={[styles.filterTabText, filter === 'rejected' && styles.filterTabTextActive]}>
                        Rejected ({proposals.filter(p => p.status === 'rejected').length})
                    </Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : (
                <FlatList
                    data={filteredProposals}
                    renderItem={renderProposalItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
                            </View>
                            <Text style={styles.emptyTitle}>No Proposals Yet</Text>
                            <Text style={styles.emptyText}>
                                You haven't submitted any proposals yet.{'\n'}
                                Browse projects and submit your first proposal!
                            </Text>
                            <TouchableOpacity
                                style={styles.browseProjectsButton}
                                onPress={() => navigation.navigate('FreelanceMarketplace')}
                            >
                                <Ionicons name="search-outline" size={18} color="#fff" />
                                <Text style={styles.browseProjectsButtonText}>Browse Projects</Text>
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
        flex: 1,
        textAlign: 'center',
    },
    backButton: {
        padding: 4,
    },
    browseButton: {
        padding: 4,
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 8,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
    },
    filterTabActive: {
        backgroundColor: '#10B981',
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    filterTabTextActive: {
        color: '#fff',
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
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 32,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
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
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    browseProjectsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    browseProjectsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    proposalCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    projectTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    metaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    proposalInfo: {
        gap: 8,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    submittedDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    submittedDateText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    coverLetterSection: {
        marginBottom: 12,
    },
    coverLetterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    coverLetterTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    coverLetterText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    viewProjectButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    viewProjectButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    chatButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#10B981',
        gap: 6,
    },
    chatButtonText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default FreelancerDashboard;
