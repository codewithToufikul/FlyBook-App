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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getJobs, Job, getEmployerStatus } from '../../services/jobService';
import { formatDistanceToNow } from 'date-fns';

const JobBoard = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const limit = 10;

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('');
    const [location, setLocation] = useState('');
    const [jobType, setJobType] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Employer status
    const [employerInfo, setEmployerInfo] = useState({ approved: false, status: 'none' });

    const fetchJobs = useCallback(async () => {
        try {
            setLoading(true);
            const filters: any = { page, limit };
            if (searchQuery) filters.q = searchQuery;
            if (category) filters.category = category;
            if (location) filters.location = location;
            if (jobType) filters.jobType = jobType;
            if (experienceLevel) filters.experienceLevel = experienceLevel;

            const data = await getJobs(filters);
            setJobs(data);
            // Note: API should return pagination info, for now using data length
            setTotal(data.length);
        } catch (error) {
            console.error("Failed to load jobs:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, searchQuery, category, location, jobType, experienceLevel]);

    const fetchEmployerStatus = useCallback(async () => {
        try {
            const data = await getEmployerStatus();
            if (data?.success) {
                setEmployerInfo({
                    approved: !!data.approved,
                    status: data.status || 'none'
                });
            }
        } catch (error) {
            // User not authenticated or not an employer
            console.log('Not an employer or error fetching status');
        }
    }, []);

    useEffect(() => {
        fetchJobs();
        fetchEmployerStatus();
    }, [fetchJobs]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setPage(1);
        fetchJobs();
    }, [fetchJobs]);

    const applyFilters = () => {
        setPage(1);
        setShowFilters(false);
        fetchJobs();
    };

    const clearFilters = () => {
        setSearchQuery('');
        setCategory('');
        setLocation('');
        setJobType('');
        setExperienceLevel('');
        setPage(1);
    };

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const formatSalary = (min?: number, max?: number) => {
        if (!min && !max) return 'Negotiable';
        if (min && !max) return `৳${min.toLocaleString()}+`;
        if (!min && max) return `Up to ৳${max.toLocaleString()}`;
        return `৳${min?.toLocaleString()} - ৳${max?.toLocaleString()}`;
    };

    const renderJobItem = ({ item }: { item: Job }) => (
        <TouchableOpacity
            style={styles.jobCard}
            onPress={() => navigation.navigate('JobDetails', { jobId: item._id })}
            activeOpacity={0.9}
        >
            <View style={styles.cardHeader}>
                <View style={styles.headerInfo}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.companyName}>{item.postedByUser?.name || 'Company'}</Text>
                </View>
                <View style={styles.jobTypeBadge}>
                    <Text style={styles.jobTypeText}>{item.jobType}</Text>
                </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>
                {item.description}
            </Text>

            <View style={styles.tagsContainer}>
                {item.location && (
                    <View style={styles.tag}>
                        <Ionicons name="location-outline" size={12} color="#6B7280" />
                        <Text style={styles.tagText}>{item.location}</Text>
                    </View>
                )}
                {item.experienceLevel && (
                    <View style={styles.tag}>
                        <Ionicons name="briefcase-outline" size={12} color="#6B7280" />
                        <Text style={styles.tagText}>{item.experienceLevel}</Text>
                    </View>
                )}
                {(item.salaryMin || item.salaryMax) && (
                    <View style={styles.tag}>
                        <Ionicons name="cash-outline" size={12} color="#6B7280" />
                        <Text style={styles.tagText}>{formatSalary(item.salaryMin, item.salaryMax)}</Text>
                    </View>
                )}
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
                            placeholder="Search title or keyword"
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <Text style={styles.filterLabel}>Category</Text>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="e.g., IT, Marketing"
                            placeholderTextColor="#9CA3AF"
                            value={category}
                            onChangeText={setCategory}
                        />

                        <Text style={styles.filterLabel}>Location</Text>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="e.g., Dhaka, Remote"
                            placeholderTextColor="#9CA3AF"
                            value={location}
                            onChangeText={setLocation}
                        />

                        <Text style={styles.filterLabel}>Job Type</Text>
                        <View style={styles.pickerContainer}>
                            {['', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.pickerOption,
                                        jobType === type && styles.pickerOptionActive
                                    ]}
                                    onPress={() => setJobType(type)}
                                >
                                    <Text style={[
                                        styles.pickerOptionText,
                                        jobType === type && styles.pickerOptionTextActive
                                    ]}>
                                        {type || 'All'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.filterLabel}>Experience Level</Text>
                        <View style={styles.pickerContainer}>
                            {['', 'Any', 'Entry', 'Mid', 'Senior', 'Lead'].map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.pickerOption,
                                        experienceLevel === level && styles.pickerOptionActive
                                    ]}
                                    onPress={() => setExperienceLevel(level)}
                                >
                                    <Text style={[
                                        styles.pickerOptionText,
                                        experienceLevel === level && styles.pickerOptionTextActive
                                    ]}>
                                        {level || 'All'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
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
                <Text style={styles.headerTitle}>Flybook Job Board</Text>
                <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filterButton}>
                    <Ionicons name="options-outline" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsList}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('MyApplications')}
                    >
                        <Ionicons name="document-text-outline" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>My Applications</Text>
                    </TouchableOpacity>

                    {employerInfo.approved ? (
                        <>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonGreen]}
                                onPress={() => navigation.navigate('EmployerDashboard')}
                            >
                                <Ionicons name="briefcase-outline" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Manage Jobs</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonBlue]}
                                onPress={() => navigation.navigate('PostJob')}
                            >
                                <Ionicons name="add-circle-outline" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Post Job</Text>
                            </TouchableOpacity>
                        </>
                    ) : employerInfo.status === 'pending' ? (
                        <View style={styles.pendingBadge}>
                            <Text style={styles.pendingText}>Employer approval pending</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.actionButtonOutline]}
                            onPress={() => navigation.navigate('EmployerRequest')}
                        >
                            <Ionicons name="business-outline" size={16} color="#3B82F6" />
                            <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>Become Employer</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            {/* Info Banner */}
            {!employerInfo.approved && employerInfo.status !== 'pending' && (
                <View style={styles.infoBanner}>
                    <Text style={styles.infoBannerText}>
                        You're viewing the employee portal. Browse jobs and apply. Want to post jobs?{' '}
                        <Text
                            style={styles.infoBannerLink}
                            onPress={() => navigation.navigate('EmployerRequest')}
                        >
                            Apply to become an employer
                        </Text>
                    </Text>
                </View>
            )}

            {employerInfo.approved && (
                <View style={[styles.infoBanner, styles.infoBannerSuccess]}>
                    <Text style={styles.infoBannerText}>
                        You're approved as an employer. You can post jobs and manage applications.{' '}
                        <Text
                            style={styles.infoBannerLink}
                            onPress={() => navigation.navigate('EmployerDashboard')}
                        >
                            Go to Dashboard
                        </Text>
                    </Text>
                </View>
            )}

            {/* Jobs List */}
            {loading && page === 1 ? (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    data={jobs}
                    renderItem={renderJobItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="briefcase-outline" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No jobs found</Text>
                            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
                        </View>
                    }
                    ListFooterComponent={
                        jobs.length > 0 ? (
                            <View style={styles.pagination}>
                                <TouchableOpacity
                                    style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
                                    onPress={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                >
                                    <Ionicons name="chevron-back" size={20} color={page <= 1 ? '#D1D5DB' : '#3B82F6'} />
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
                                    <Ionicons name="chevron-forward" size={20} color={page >= totalPages ? '#D1D5DB' : '#3B82F6'} />
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
    actionButtonBlue: {
        backgroundColor: '#3B82F6',
    },
    actionButtonOutline: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    pendingBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    pendingText: {
        color: '#92400E',
        fontSize: 12,
        fontWeight: '600',
    },
    infoBanner: {
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 8,
    },
    infoBannerSuccess: {
        backgroundColor: '#F0FDF4',
        borderColor: '#BBF7D0',
    },
    infoBannerText: {
        fontSize: 13,
        color: '#1F2937',
        lineHeight: 18,
    },
    infoBannerLink: {
        color: '#3B82F6',
        fontWeight: '600',
        textDecorationLine: 'underline',
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
    jobCard: {
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
        borderColor: '#F3F4F6',
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
    jobTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    companyName: {
        fontSize: 14,
        color: '#6B7280',
    },
    jobTypeBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    jobTypeText: {
        color: '#2563EB',
        fontSize: 12,
        fontWeight: '600',
    },
    description: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    tagText: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '500',
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
        borderColor: '#3B82F6',
        gap: 4,
    },
    pageButtonDisabled: {
        borderColor: '#E5E7EB',
    },
    pageButtonText: {
        color: '#3B82F6',
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
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    pickerOptionText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    pickerOptionTextActive: {
        color: '#fff',
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
        backgroundColor: '#3B82F6',
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default JobBoard;
