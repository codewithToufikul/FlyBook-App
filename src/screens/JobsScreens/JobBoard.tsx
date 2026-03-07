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
import { useTheme } from '../../contexts/ThemeContext';

const JobBoard = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
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
            style={[styles.jobCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155', shadowOpacity: 0 }]}
            onPress={() => navigation.navigate('JobDetails', { jobId: item._id })}
            activeOpacity={0.9}
        >
            <View style={styles.cardHeader}>
                <View style={styles.headerInfo}>
                    <Text style={[styles.jobTitle, isDark && { color: '#f8fafc' }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.companyName, isDark && { color: '#94a3b8' }]}>{item.postedByUser?.name || 'Company'}</Text>
                </View>
                <View style={[styles.jobTypeBadge, isDark && { backgroundColor: 'rgba(20, 184, 166, 0.1)' }]}>
                    <Text style={[styles.jobTypeText, isDark && { color: '#14b8a6' }]}>{item.jobType}</Text>
                </View>
            </View>

            <Text style={[styles.description, isDark && { color: '#94a3b8' }]} numberOfLines={2}>
                {item.description}
            </Text>

            <View style={styles.tagsContainer}>
                {item.location && (
                    <View style={[styles.tag, isDark && { backgroundColor: '#0f172a' }]}>
                        <Ionicons name="location-outline" size={12} color={isDark ? "#94a3b8" : "#6B7280"} />
                        <Text style={[styles.tagText, isDark && { color: '#94a3b8' }]}>{item.location}</Text>
                    </View>
                )}
                {item.experienceLevel && (
                    <View style={[styles.tag, isDark && { backgroundColor: '#0f172a' }]}>
                        <Ionicons name="briefcase-outline" size={12} color={isDark ? "#94a3b8" : "#6B7280"} />
                        <Text style={[styles.tagText, isDark && { color: '#94a3b8' }]}>{item.experienceLevel}</Text>
                    </View>
                )}
                {(item.salaryMin || item.salaryMax) && (
                    <View style={[styles.tag, isDark && { backgroundColor: '#0f172a' }]}>
                        <Ionicons name="cash-outline" size={12} color={isDark ? "#94a3b8" : "#6B7280"} />
                        <Text style={[styles.tagText, isDark && { color: '#94a3b8' }]}>{formatSalary(item.salaryMin, item.salaryMax)}</Text>
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
                <View style={[styles.modalContent, isDark && { backgroundColor: '#1e293b' }]}>
                    <View style={[styles.modalHeader, isDark && { borderBottomColor: '#334155' }]}>
                        <Text style={[styles.modalTitle, isDark && { color: '#f8fafc' }]}>Filters</Text>
                        <TouchableOpacity onPress={() => setShowFilters(false)}>
                            <Ionicons name="close" size={24} color={isDark ? "#f8fafc" : "#1F2937"} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.filtersList} showsVerticalScrollIndicator={false}>
                        <Text style={[styles.filterLabel, isDark && { color: '#f8fafc' }]}>Search</Text>
                        <TextInput
                            style={[styles.filterInput, isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }]}
                            placeholder="Search title or keyword"
                            placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        <Text style={[styles.filterLabel, isDark && { color: '#f8fafc' }]}>Category</Text>
                        <TextInput
                            style={[styles.filterInput, isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }]}
                            placeholder="e.g., IT, Marketing"
                            placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
                            value={category}
                            onChangeText={setCategory}
                        />

                        <Text style={[styles.filterLabel, isDark && { color: '#f8fafc' }]}>Location</Text>
                        <TextInput
                            style={[styles.filterInput, isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }]}
                            placeholder="e.g., Dhaka, Remote"
                            placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
                            value={location}
                            onChangeText={setLocation}
                        />

                        <Text style={[styles.filterLabel, isDark && { color: '#f8fafc' }]}>Job Type</Text>
                        <View style={styles.pickerContainer}>
                            {['', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.pickerOption,
                                        isDark && { backgroundColor: '#0f172a', borderColor: '#334155' },
                                        jobType === type && [styles.pickerOptionActive, isDark && { backgroundColor: '#14b8a6', borderColor: '#14b8a6' }]
                                    ]}
                                    onPress={() => setJobType(type)}
                                >
                                    <Text style={[
                                        styles.pickerOptionText,
                                        isDark && { color: '#94a3b8' },
                                        jobType === type && [styles.pickerOptionTextActive, { color: '#fff' }]
                                    ]}>
                                        {type || 'All'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.filterLabel, isDark && { color: '#f8fafc' }]}>Experience Level</Text>
                        <View style={styles.pickerContainer}>
                            {['', 'Any', 'Entry', 'Mid', 'Senior', 'Lead'].map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.pickerOption,
                                        isDark && { backgroundColor: '#0f172a', borderColor: '#334155' },
                                        experienceLevel === level && [styles.pickerOptionActive, isDark && { backgroundColor: '#14b8a6', borderColor: '#14b8a6' }]
                                    ]}
                                    onPress={() => setExperienceLevel(level)}
                                >
                                    <Text style={[
                                        styles.pickerOptionText,
                                        isDark && { color: '#94a3b8' },
                                        experienceLevel === level && [styles.pickerOptionTextActive, { color: '#fff' }]
                                    ]}>
                                        {level || 'All'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    <View style={[styles.modalFooter, isDark && { borderTopColor: '#334155' }]}>
                        <TouchableOpacity
                            style={[styles.clearButton, isDark && { borderColor: '#334155' }]}
                            onPress={clearFilters}
                        >
                            <Text style={[styles.clearButtonText, isDark && { color: '#94a3b8' }]}>Clear All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.applyButton, isDark && { backgroundColor: '#14b8a6' }]}
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
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }, { paddingTop: insets.top }]}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={isDark ? "#0f172a" : "#fff"}
            />

            {/* Header */}
            <View style={[styles.header, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#1F2937"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Flybook Job Board</Text>
                <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filterButton}>
                    <Ionicons name="options-outline" size={24} color={isDark ? "#f8fafc" : "#1F2937"} />
                </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={[styles.actionsContainer, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsList}>
                    <TouchableOpacity
                        style={[styles.actionButton, isDark && { backgroundColor: '#14b8a6' }]}
                        onPress={() => navigation.navigate('MyApplications')}
                    >
                        <Ionicons name="document-text-outline" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>My Applications</Text>
                    </TouchableOpacity>

                    {employerInfo.approved ? (
                        <>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonGreen, isDark && { backgroundColor: '#10B981' }]}
                                onPress={() => navigation.navigate('EmployerDashboard')}
                            >
                                <Ionicons name="briefcase-outline" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Manage Jobs</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonBlue, isDark && { backgroundColor: '#3B82F6' }]}
                                onPress={() => navigation.navigate('PostJob')}
                            >
                                <Ionicons name="add-circle-outline" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Post Job</Text>
                            </TouchableOpacity>
                        </>
                    ) : employerInfo.status === 'pending' ? (
                        <View style={[styles.pendingBadge, isDark && { backgroundColor: 'rgba(254, 243, 199, 0.1)', borderColor: '#D97706' }]}>
                            <Text style={[styles.pendingText, isDark && { color: '#D97706' }]}>Employer approval pending</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.actionButtonOutline, isDark && { backgroundColor: 'transparent', borderColor: '#14b8a6' }]}
                            onPress={() => navigation.navigate('EmployerRequest')}
                        >
                            <Ionicons name="business-outline" size={16} color={isDark ? "#14b8a6" : "#3B82F6"} />
                            <Text style={[styles.actionButtonText, { color: isDark ? "#14b8a6" : "#3B82F6" }]}>Become Employer</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            {/* Info Banner */}
            {!employerInfo.approved && employerInfo.status !== 'pending' && (
                <View style={[styles.infoBanner, isDark && { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3B82F6' }]}>
                    <Text style={[styles.infoBannerText, isDark && { color: '#94a3b8' }]}>
                        You're viewing the employee portal. Browse jobs and apply. Want to post jobs?{' '}
                        <Text
                            style={[styles.infoBannerLink, isDark && { color: '#14b8a6' }]}
                            onPress={() => navigation.navigate('EmployerRequest')}
                        >
                            Apply to become an employer
                        </Text>
                    </Text>
                </View>
            )}

            {employerInfo.approved && (
                <View style={[styles.infoBanner, styles.infoBannerSuccess, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10B981' }]}>
                    <Text style={[styles.infoBannerText, isDark && { color: '#94a3b8' }]}>
                        You're approved as an employer. You can post jobs and manage applications.{' '}
                        <Text
                            style={[styles.infoBannerLink, isDark && { color: '#14b8a6' }]}
                            onPress={() => navigation.navigate('EmployerDashboard')}
                        >
                            Go to Dashboard
                        </Text>
                    </Text>
                </View>
            )}

            {/* Jobs List */}
            {loading && page === 1 ? (
                <View style={[styles.centerLoader, isDark && { backgroundColor: '#0f172a' }]}>
                    <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#3B82F6"} />
                </View>
            ) : (
                <FlatList
                    data={jobs}
                    renderItem={renderJobItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[isDark ? '#14b8a6' : '#3B82F6']} tintColor={isDark ? '#14b8a6' : '#3B82F6'} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="briefcase-outline" size={64} color={isDark ? "#334155" : "#D1D5DB"} />
                            <Text style={[styles.emptyText, isDark && { color: '#f8fafc' }]}>No jobs found</Text>
                            <Text style={[styles.emptySubtext, isDark && { color: '#64748b' }]}>Try adjusting your filters</Text>
                        </View>
                    }
                    ListFooterComponent={
                        jobs.length > 0 ? (
                            <View style={[styles.pagination, isDark && { borderTopColor: '#1e293b' }]}>
                                <TouchableOpacity
                                    style={[styles.pageButton, isDark && { borderColor: '#334155' }, page <= 1 && styles.pageButtonDisabled]}
                                    onPress={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                >
                                    <Ionicons name="chevron-back" size={20} color={page <= 1 ? (isDark ? '#334155' : '#D1D5DB') : (isDark ? '#14b8a6' : '#3B82F6')} />
                                    <Text style={[styles.pageButtonText, isDark && { color: '#14b8a6' }, page <= 1 && styles.pageButtonTextDisabled]}>
                                        Previous
                                    </Text>
                                </TouchableOpacity>

                                <Text style={[styles.pageInfo, isDark && { color: '#94a3b8' }]}>
                                    Page {page} of {totalPages}
                                </Text>

                                <TouchableOpacity
                                    style={[styles.pageButton, isDark && { borderColor: '#334155' }, page >= totalPages && styles.pageButtonDisabled]}
                                    onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                >
                                    <Text style={[styles.pageButtonText, isDark && { color: '#14b8a6' }, page >= totalPages && styles.pageButtonTextDisabled]}>
                                        Next
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color={page >= totalPages ? (isDark ? '#334155' : '#D1D5DB') : (isDark ? '#14b8a6' : '#3B82F6')} />
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
