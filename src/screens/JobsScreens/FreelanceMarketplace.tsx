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
    ScrollView,
    RefreshControl,
    Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getProjects, Project } from '../../services/jobService';
import { formatDistanceToNow } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FreelanceMarketplace = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 10;

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('');
    const [budgetType, setBudgetType] = useState('');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const filters: any = { page, limit };
            if (searchQuery) filters.q = searchQuery;
            if (category) filters.category = category;
            if (budgetType) filters.budgetType = budgetType;
            if (budgetMin) filters.budgetMin = budgetMin;
            if (budgetMax) filters.budgetMax = budgetMax;

            const data = await getProjects(filters);
            setProjects(data);
            setTotal(data.length);
        } catch (error) {
            console.error("Failed to load projects:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, searchQuery, category, budgetType, budgetMin, budgetMax]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setPage(1);
        fetchProjects();
    }, [fetchProjects]);

    const applyFilters = () => {
        setPage(1);
        setShowFilters(false);
        fetchProjects();
    };

    const clearFilters = () => {
        setSearchQuery('');
        setCategory('');
        setBudgetType('');
        setBudgetMin('');
        setBudgetMax('');
        setPage(1);
    };

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const formatBudget = (project: Project) => {
        if (project.budgetType === 'fixed') {
            return `৳${project.budget?.toLocaleString()}`;
        }
        return `৳${project.hourlyRate?.toLocaleString()}/hr`;
    };

    const renderProjectItem = ({ item }: { item: Project }) => (
        <TouchableOpacity
            style={styles.projectCard}
            onPress={() => navigation.navigate('ProjectDetails', { projectId: item._id })}
            activeOpacity={0.9}
        >
            <View style={styles.cardHeader}>
                <View style={styles.headerInfo}>
                    <Text style={styles.projectTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.clientName}>Client: {item.postedByUser?.name || 'Unknown'}</Text>
                </View>
                <View style={styles.badgesContainer}>
                    <View style={[styles.badge, item.budgetType === 'fixed' ? styles.badgeFixed : styles.badgeHourly]}>
                        <Text style={styles.badgeText}>
                            {item.budgetType === 'fixed' ? 'Fixed' : 'Hourly'}
                        </Text>
                    </View>
                    <View style={[styles.badge, styles.badgeStatus]}>
                        <Text style={styles.badgeText}>{item.status}</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.descriptionText} numberOfLines={2}>
                {item.description}
            </Text>

            <View style={styles.metaRow}>
                {item.category && (
                    <View style={styles.metaItem}>
                        <Ionicons name="folder-outline" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{item.category}</Text>
                    </View>
                )}
                <View style={styles.metaItem}>
                    <Ionicons name="cash-outline" size={14} color="#10B981" />
                    <Text style={styles.metaText}>{formatBudget(item)}</Text>
                </View>
                {item.deadline && (
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color="#EF4444" />
                        <Text style={styles.metaText}>
                            {new Date(item.deadline).toLocaleDateString()}
                        </Text>
                    </View>
                )}
            </View>

            {item.skills && item.skills.length > 0 && (
                <View style={styles.tagsContainer}>
                    {item.skills.slice(0, 4).map((skill, index) => (
                        <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{skill}</Text>
                        </View>
                    ))}
                    {item.skills.length > 4 && (
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>+{item.skills.length - 4}</Text>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.cardFooter}>
                <View style={styles.proposalRow}>
                    <Ionicons name="people-outline" size={14} color="#6B7280" />
                    <Text style={styles.proposalText}>
                        {item.proposalCount !== undefined ? `${item.proposalCount} Proposals` : 'Be first'}
                    </Text>
                </View>
                <Text style={styles.postedTime}>
                    {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : 'Recently'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const FiltersModal = () => (
        <Modal
            visible={showFilters}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowFilters(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Filters</Text>
                        <TouchableOpacity onPress={() => setShowFilters(false)}>
                            <Ionicons name="close" size={24} color="#1F2937" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.filtersList} showsVerticalScrollIndicator={false}>
                        <Text style={styles.filterLabel}>Search</Text>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="Search by title or skill"
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <Text style={styles.filterLabel}>Category/Skill</Text>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="e.g., Web Development, Design"
                            placeholderTextColor="#9CA3AF"
                            value={category}
                            onChangeText={setCategory}
                        />

                        <Text style={styles.filterLabel}>Budget Type</Text>
                        <View style={styles.pickerContainer}>
                            {['', 'fixed', 'hourly'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.pickerOption,
                                        budgetType === type && styles.pickerOptionActive
                                    ]}
                                    onPress={() => setBudgetType(type)}
                                >
                                    <Text style={[
                                        styles.pickerOptionText,
                                        budgetType === type && styles.pickerOptionTextActive
                                    ]}>
                                        {type === '' ? 'All' : type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {budgetType === 'fixed' && (
                            <>
                                <Text style={styles.filterLabel}>Budget Range (৳)</Text>
                                <View style={styles.budgetRow}>
                                    <TextInput
                                        style={[styles.filterInput, styles.budgetInput]}
                                        placeholder="Min"
                                        placeholderTextColor="#9CA3AF"
                                        value={budgetMin}
                                        onChangeText={setBudgetMin}
                                        keyboardType="numeric"
                                    />
                                    <Text style={styles.budgetSeparator}>to</Text>
                                    <TextInput
                                        style={[styles.filterInput, styles.budgetInput]}
                                        placeholder="Max"
                                        placeholderTextColor="#9CA3AF"
                                        value={budgetMax}
                                        onChangeText={setBudgetMax}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </>
                        )}
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={clearFilters}
                        >
                            <Text style={styles.clearButtonText}>Clear All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={applyFilters}
                        >
                            <Text style={styles.applyButtonText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Freelance Marketplace</Text>
                <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filterButton}>
                    <Ionicons name="options-outline" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsList}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('PostProject')}
                    >
                        <Ionicons name="add-circle-outline" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>Post Project</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonGreen]}
                        onPress={() => navigation.navigate('FreelancerDashboard')}
                    >
                        <Ionicons name="document-text-outline" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>My Proposals</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonPurple]}
                        onPress={() => navigation.navigate('ClientDashboard')}
                    >
                        <Ionicons name="briefcase-outline" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>My Projects</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Projects List */}
            {loading && page === 1 ? (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : (
                <FlatList
                    data={projects}
                    renderItem={renderProjectItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="briefcase-outline" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No projects found</Text>
                            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
                        </View>
                    }
                    ListFooterComponent={
                        projects.length > 0 ? (
                            <View style={styles.pagination}>
                                <TouchableOpacity
                                    style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
                                    onPress={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                >
                                    <Ionicons name="chevron-back" size={20} color={page <= 1 ? '#D1D5DB' : '#10B981'} />
                                    <Text style={[styles.pageButtonText, page <= 1 && styles.pageButtonTextDisabled]}>
                                        Previous
                                    </Text>
                                </TouchableOpacity>

                                <Text style={styles.pageInfo}>
                                    Page {page} of {totalPages}
                                </Text>

                                <TouchableOpacity
                                    style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
                                    onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                >
                                    <Text style={[styles.pageButtonText, page >= totalPages && styles.pageButtonTextDisabled]}>
                                        Next
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color={page >= totalPages ? '#D1D5DB' : '#10B981'} />
                                </TouchableOpacity>
                            </View>
                        ) : null
                    }
                />
            )}

            <FiltersModal />
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
    filterButton: {
        padding: 4,
    },
    actionsContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingVertical: 12,
    },
    actionsList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    actionButtonGreen: {
        backgroundColor: '#10B981',
    },
    actionButtonPurple: {
        backgroundColor: '#8B5CF6',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    centerLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 4,
    },
    projectCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    headerInfo: {
        flex: 1,
        marginRight: 12,
    },
    projectTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
        lineHeight: 22,
    },
    clientName: {
        fontSize: 13,
        color: '#6B7280',
    },
    badgesContainer: {
        gap: 4,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignItems: 'center',
    },
    badgeFixed: {
        backgroundColor: '#DBEAFE',
    },
    badgeHourly: {
        backgroundColor: '#FEF3C7',
    },
    badgeStatus: {
        backgroundColor: '#D1FAE5',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#374151',
    },
    descriptionText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 12,
    },
    metaRow: {
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
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    tag: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        color: '#059669',
        fontSize: 11,
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    proposalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    proposalText: {
        fontSize: 12,
        color: '#6B7280',
    },
    postedTime: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    pageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#10B981',
        gap: 4,
    },
    pageButtonDisabled: {
        borderColor: '#E5E7EB',
    },
    pageButtonText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '600',
    },
    pageButtonTextDisabled: {
        color: '#D1D5DB',
    },
    pageInfo: {
        fontSize: 14,
        color: '#6B7280',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    filtersList: {
        padding: 16,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 12,
    },
    filterInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#1F2937',
    },
    pickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pickerOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    pickerOptionActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    pickerOptionText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    pickerOptionTextActive: {
        color: '#fff',
    },
    budgetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    budgetInput: {
        flex: 1,
    },
    budgetSeparator: {
        fontSize: 14,
        color: '#6B7280',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    clearButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#6B7280',
        fontSize: 15,
        fontWeight: '600',
    },
    applyButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#10B981',
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default FreelanceMarketplace;
