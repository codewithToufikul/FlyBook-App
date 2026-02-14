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
    Linking,
    ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getEmployerJobs, getJobApplications } from '../../services/jobService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Applicant {
    _id: string;
    name: string;
    email: string;
}

interface Application {
    _id: string;
    applicant?: Applicant;
    applicantName?: string;
    cvUrl?: string;
    coverLetter?: string;
    appliedAt?: string;
    createdAt?: string;
}

interface Job {
    _id: string;
    title: string;
    jobType: string;
    status: string;
    location?: string;
    category?: string;
    salaryMin?: number;
    salaryMax?: number;
    createdAt: string;
}

const EmployerDashboard = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<{ [key: string]: Application[] }>({});
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getEmployerJobs();
            setJobs(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const fetchApplications = async (jobId: string) => {
        try {
            const data = await getJobApplications(jobId);
            setApplications((prev) => ({ ...prev, [jobId]: data || [] }));
        } catch (e) {
            console.error(e);
        }
    };

    const toggleExpand = (jobId: string) => {
        if (expandedJobId === jobId) {
            setExpandedJobId(null);
        } else {
            setExpandedJobId(jobId);
            if (!applications[jobId]) {
                fetchApplications(jobId);
            }
        }
    };

    const openURL = async (url: string) => {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            console.log("Don't know how to open URI: " + url);
        }
    };

    const renderApplication = (app: Application) => (
        <View key={app._id} style={styles.applicationItem}>
            <View style={styles.applicationHeader}>
                <View style={styles.applicantInfo}>
                    <Text style={styles.applicantName}>
                        {app.applicant?.name || app.applicantName || 'Anonymous'}
                    </Text>
                    {app.applicant?.email && <Text style={styles.applicantEmail}>{app.applicant.email}</Text>}
                    <Text style={styles.appliedDate}>
                        Applied: {new Date(app.appliedAt || app.createdAt || '').toLocaleDateString()}
                    </Text>
                </View>
                {app.cvUrl && (
                    <TouchableOpacity
                        style={styles.viewCVButton}
                        onPress={() => openURL(app.cvUrl!)}
                    >
                        <Text style={styles.viewCVText}>View CV</Text>
                    </TouchableOpacity>
                )}
            </View>
            {app.coverLetter && (
                <View style={styles.coverLetterBox}>
                    <Text style={styles.coverLetterLabel}>Cover Letter:</Text>
                    <Text style={styles.coverLetterText}>{app.coverLetter}</Text>
                </View>
            )}
        </View>
    );

    const renderJobItem = ({ item }: { item: Job }) => {
        const isExpanded = expandedJobId === item._id;
        const apps = applications[item._id] || [];

        return (
            <View style={styles.jobCard}>
                <View style={styles.jobMainContent}>
                    <View style={styles.jobHeaderRow}>
                        <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={styles.statusBadges}>
                            <View style={[styles.typeBadge, styles.blueBadge]}>
                                <Text style={styles.blueBadgeText}>{item.jobType}</Text>
                            </View>
                            <View style={[styles.typeBadge, item.status === 'active' ? styles.greenBadge : styles.grayBadge]}>
                                <Text style={item.status === 'active' ? styles.greenBadgeText : styles.grayBadgeText}>
                                    {item.status === 'active' ? 'Active' : 'Inactive'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.jobMeta}>
                        {item.location && (
                            <View style={styles.metaItem}>
                                <Ionicons name="location-outline" size={14} color="#6B7280" />
                                <Text style={styles.metaText}>{item.location}</Text>
                            </View>
                        )}
                        {item.category && (
                            <View style={styles.metaItem}>
                                <Ionicons name="folder-outline" size={14} color="#6B7280" />
                                <Text style={styles.metaText}>{item.category}</Text>
                            </View>
                        )}
                        <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                            <Text style={styles.metaText}>
                                Posted: {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.jobActions}>
                        <TouchableOpacity
                            style={styles.expandButton}
                            onPress={() => toggleExpand(item._id)}
                        >
                            <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={18}
                                color="#3B82F6"
                            />
                            <Text style={styles.expandButtonText}>
                                {isExpanded ? 'Hide' : 'View'} Applications ({apps.length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.viewLink}
                            onPress={() => navigation.navigate('JobDetails', { jobId: item._id })}
                        >
                            <Text style={styles.viewLinkText}>View Job</Text>
                            <Ionicons name="arrow-forward" size={14} color="#4B5563" />
                        </TouchableOpacity>
                    </View>
                </View>

                {isExpanded && (
                    <View style={styles.applicationsList}>
                        <Text style={styles.applicationsTitle}>Applications ({apps.length})</Text>
                        {apps.length === 0 ? (
                            <View style={styles.noAppsBox}>
                                <Text style={styles.noAppsText}>No applications yet.</Text>
                            </View>
                        ) : (
                            apps.map(renderApplication)
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Employer Dashboard</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('PostJob')}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    data={jobs}
                    renderItem={renderJobItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                    }
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <Text style={styles.listTitle}>My Jobs</Text>
                            <TouchableOpacity
                                style={styles.postNewButton}
                                onPress={() => navigation.navigate('PostJob')}
                            >
                                <Text style={styles.postNewText}>Post New Job</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="briefcase-outline" size={64} color="#D1D5DB" />
                            </View>
                            <Text style={styles.emptyTitle}>No Jobs Posted</Text>
                            <Text style={styles.emptyText}>
                                You haven't posted any job listings yet.
                            </Text>
                            <TouchableOpacity
                                style={styles.postFirstButton}
                                onPress={() => navigation.navigate('PostJob')}
                            >
                                <Text style={styles.postFirstText}>Post Your First Job</Text>
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
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    postNewText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    jobCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
        overflow: 'hidden',
    },
    jobMainContent: {
        padding: 16,
    },
    jobHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
        marginRight: 10,
    },
    statusBadges: {
        flexDirection: 'row',
        gap: 4,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    blueBadge: {
        backgroundColor: '#EFF6FF',
    },
    blueBadgeText: {
        color: '#3B82F6',
        fontSize: 10,
        fontWeight: '600',
    },
    greenBadge: {
        backgroundColor: '#F0FDF4',
    },
    greenBadgeText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '600',
    },
    grayBadge: {
        backgroundColor: '#F9FAFB',
    },
    grayBadgeText: {
        color: '#6B7280',
        fontSize: 10,
        fontWeight: '600',
    },
    jobMeta: {
        gap: 6,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        color: '#6B7280',
    },
    jobActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    expandButtonText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
    viewLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewLinkText: {
        fontSize: 14,
        color: '#4B5563',
    },
    applicationsList: {
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        padding: 16,
    },
    applicationsTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 12,
    },
    noAppsBox: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    noAppsText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    applicationItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 12,
        marginBottom: 12,
    },
    applicationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    applicantInfo: {
        flex: 1,
        marginRight: 10,
    },
    applicantName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    applicantEmail: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    appliedDate: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 4,
    },
    viewCVButton: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    viewCVText: {
        color: '#3B82F6',
        fontSize: 11,
        fontWeight: '600',
    },
    coverLetterBox: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    coverLetterLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 4,
    },
    coverLetterText: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
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
    },
    postFirstButton: {
        backgroundColor: '#3B82F6',
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

export default EmployerDashboard;
