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
    Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getMyApplications } from '../../services/jobService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Application {

    _id: string;
    job: {
        _id: string;
        title: string;
        jobType: string;
        location?: string;
        category?: string;
        salaryMin?: number;
        salaryMax?: number;
    };
    cvUrl: string;
    coverLetter: string;
    createdAt?: string;
    appliedAt?: string;
}

const MyApplications = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchApplications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMyApplications();
            setApplications(data);
        } catch (error) {
            console.error('Failed to load applications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchApplications();
    }, [fetchApplications]);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const openCV = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                console.log("Can't open URL:", url);
            }
        } catch (error) {
            console.error('Error opening CV:', error);
        }
    };

    const formatSalary = (min?: number, max?: number) => {
        if (!min && !max) return null;
        if (min && !max) return `৳${min.toLocaleString()}+`;
        if (!min && max) return `Up to ৳${max.toLocaleString()}`;
        return `৳${min?.toLocaleString()} - ৳${max?.toLocaleString()}`;
    };

    const renderApplicationItem = ({ item }: { item: Application }) => {
        const job = item.job;
        if (!job) return null;

        const isExpanded = expandedId === item._id;
        const salary = formatSalary(job.salaryMin, job.salaryMax);

        return (
            <View style={styles.applicationCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.jobTitle} numberOfLines={1}>
                            {job.title}
                        </Text>
                        <View style={styles.jobTypeBadge}>
                            <Text style={styles.jobTypeText}>{job.jobType}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.metaContainer}>
                    {job.location && (
                        <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={14} color="#6B7280" />
                            <Text style={styles.metaText}>{job.location}</Text>
                        </View>
                    )}
                    {job.category && (
                        <View style={styles.metaItem}>
                            <Ionicons name="folder-outline" size={14} color="#6B7280" />
                            <Text style={styles.metaText}>{job.category}</Text>
                        </View>
                    )}
                    {salary && (
                        <View style={styles.metaItem}>
                            <Ionicons name="cash-outline" size={14} color="#6B7280" />
                            <Text style={styles.metaText}>{salary}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.appliedDateRow}>
                    <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.appliedDateText}>
                        Applied: {new Date(item.createdAt || item.appliedAt || Date.now()).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </Text>
                </View>

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
                        style={styles.viewJobButton}
                        onPress={() => navigation.navigate('JobDetails', { jobId: job._id })}
                    >
                        <Ionicons name="eye-outline" size={16} color="#fff" />
                        <Text style={styles.viewJobButtonText}>View Job</Text>
                    </TouchableOpacity>

                    {item.cvUrl && (
                        <TouchableOpacity
                            style={styles.viewCVButton}
                            onPress={() => openCV(item.cvUrl)}
                        >
                            <Ionicons name="document-text-outline" size={16} color="#3B82F6" />
                            <Text style={styles.viewCVButtonText}>View CV</Text>
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
                <Text style={styles.headerTitle}>My Applications</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('JobBoard')}
                    style={styles.browseButton}
                >
                    <Ionicons name="search-outline" size={20} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    data={applications}
                    renderItem={renderApplicationItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
                            </View>
                            <Text style={styles.emptyTitle}>No Applications Yet</Text>
                            <Text style={styles.emptyText}>
                                You haven't applied to any jobs yet.{'\n'}
                                Start browsing and apply to your dream job!
                            </Text>
                            <TouchableOpacity
                                style={styles.browseJobsButton}
                                onPress={() => navigation.navigate('JobBoard')}
                            >
                                <Ionicons name="search-outline" size={18} color="#fff" />
                                <Text style={styles.browseJobsButtonText}>Browse Available Jobs</Text>
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
    browseJobsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    browseJobsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    applicationCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
    jobTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
    },
    jobTypeBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    jobTypeText: {
        color: '#2563EB',
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
    appliedDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginBottom: 12,
    },
    appliedDateText: {
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
    viewJobButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    viewJobButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    viewCVButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3B82F6',
        gap: 6,
    },
    viewCVButtonText: {
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default MyApplications;
