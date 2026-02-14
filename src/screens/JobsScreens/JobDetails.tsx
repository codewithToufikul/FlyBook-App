import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getJobDetails, Job, applyToJob, getEmployerStatus } from '../../services/jobService';

const JobDetails = ({ route, navigation }: any) => {
    const { jobId } = route.params;
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);

    // Application form
    const [cvUrl, setCvUrl] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [message, setMessage] = useState('');

    // Employer status
    const [employerInfo, setEmployerInfo] = useState({ approved: false, status: 'none' });

    useEffect(() => {
        fetchJobDetails();
        checkStatus();
    }, [jobId]);

    const fetchJobDetails = async () => {
        try {
            const data = await getJobDetails(jobId);
            setJob(data || null);
        } catch (error) {
            console.error("Failed to load job details:", error);
        } finally {
            setLoading(false);
        }
    };

    const checkStatus = async () => {
        try {
            const data = await getEmployerStatus();
            if (data?.success) {
                setEmployerInfo({
                    approved: !!data.approved,
                    status: data.status || 'none'
                });
            }
        } catch (error) {
            console.log('Not an employer or error fetching status');
        }
    };

    const handleApply = async () => {
        if (!cvUrl.trim() || !coverLetter.trim()) {
            setMessage('Please provide both CV URL and cover letter');
            return;
        }

        try {
            setApplying(true);
            setMessage('');

            const response = await applyToJob(jobId, { cvUrl, coverLetter });

            if (response.success) {
                setMessage('Applied successfully!');
                setCvUrl('');
                setCoverLetter('');
                Alert.alert(
                    'Success',
                    'Your application has been submitted successfully!',
                    [
                        { text: 'View My Applications', onPress: () => navigation.navigate('MyApplications') },
                        { text: 'OK', style: 'cancel' }
                    ]
                );
            } else {
                setMessage(response.message || 'Failed to apply');
            }
        } catch (error: any) {
            console.error('Error applying:', error);
            setMessage(error.response?.data?.message || 'Failed to apply');
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerLoader}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (!job) {
        return (
            <View style={styles.centerLoader}>
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text style={styles.errorText}>Job not found</Text>
                <TouchableOpacity
                    style={styles.backToListButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backToListText}>Back to Job Board</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Job Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Job Information Card */}
                <View style={styles.jobInfoCard}>
                    <View style={styles.jobHeaderRow}>
                        <Text style={styles.jobTitle}>{job.title}</Text>
                        <View style={styles.jobTypeBadge}>
                            <Text style={styles.jobTypeText}>{job.jobType}</Text>
                        </View>
                    </View>

                    <View style={styles.metaRow}>
                        {job.location && (
                            <View style={styles.metaItem}>
                                <Ionicons name="location-outline" size={14} color="#6B7280" />
                                <Text style={styles.metaText}>{job.location}</Text>
                            </View>
                        )}
                        {job.experienceLevel && (
                            <View style={styles.metaItem}>
                                <Ionicons name="briefcase-outline" size={14} color="#6B7280" />
                                <Text style={styles.metaText}>{job.experienceLevel}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.descriptionSection}>
                        <Text style={styles.descriptionText}>{job.description}</Text>
                    </View>

                    {/* Additional Info */}
                    {(job.salaryMin || job.salaryMax || job.category || job.deadline) && (
                        <View style={styles.additionalInfo}>
                            {(job.salaryMin || job.salaryMax) && (
                                <View style={styles.infoRow}>
                                    <Ionicons name="cash-outline" size={16} color="#10B981" />
                                    <Text style={styles.infoLabel}>Salary:</Text>
                                    <Text style={styles.infoValue}>
                                        {job.salaryMin && job.salaryMax
                                            ? `৳${job.salaryMin.toLocaleString()} - ৳${job.salaryMax.toLocaleString()}`
                                            : job.salaryMin
                                                ? `৳${job.salaryMin.toLocaleString()}+`
                                                : `Up to ৳${job.salaryMax?.toLocaleString()}`
                                        }
                                    </Text>
                                </View>
                            )}
                            {job.category && (
                                <View style={styles.infoRow}>
                                    <Ionicons name="folder-outline" size={16} color="#3B82F6" />
                                    <Text style={styles.infoLabel}>Category:</Text>
                                    <Text style={styles.infoValue}>{job.category}</Text>
                                </View>
                            )}
                            {job.deadline && (
                                <View style={styles.infoRow}>
                                    <Ionicons name="calendar-outline" size={16} color="#EF4444" />
                                    <Text style={styles.infoLabel}>Deadline:</Text>
                                    <Text style={styles.infoValue}>
                                        {new Date(job.deadline).toLocaleDateString()}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Skills */}
                    {job.skills && job.skills.length > 0 && (
                        <View style={styles.skillsSection}>
                            <Text style={styles.skillsTitle}>Required Skills</Text>
                            <View style={styles.skillsContainer}>
                                {job.skills.map((skill, index) => (
                                    <View key={index} style={styles.skillChip}>
                                        <Text style={styles.skillText}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Employer View or Application Form */}
                {employerInfo.approved ? (
                    <View style={styles.employerViewCard}>
                        <View style={styles.employerIconContainer}>
                            <Ionicons name="business" size={32} color="#10B981" />
                        </View>
                        <Text style={styles.employerViewTitle}>Employer View</Text>
                        <Text style={styles.employerViewText}>
                            As an employer, you cannot apply to jobs. Manage your posted jobs and view applications from your dashboard.
                        </Text>
                        <TouchableOpacity
                            style={styles.dashboardButton}
                            onPress={() => navigation.navigate('EmployerDashboard')}
                        >
                            <Ionicons name="briefcase-outline" size={18} color="#fff" />
                            <Text style={styles.dashboardButtonText}>Go to My Jobs Dashboard</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.applicationCard}>
                        <Text style={styles.applicationTitle}>Apply Now</Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>CV URL (Drive/Cloud link) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="https://drive.google.com/..."
                                placeholderTextColor="#9CA3AF"
                                value={cvUrl}
                                onChangeText={setCvUrl}
                                autoCapitalize="none"
                                keyboardType="url"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Cover Letter *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Explain why you're the best fit for this position..."
                                placeholderTextColor="#9CA3AF"
                                value={coverLetter}
                                onChangeText={setCoverLetter}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.applyButton, applying && styles.applyButtonDisabled]}
                            onPress={handleApply}
                            disabled={applying}
                        >
                            {applying ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="send-outline" size={18} color="#fff" />
                                    <Text style={styles.applyButtonText}>Submit Application</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {message && (
                            <View style={[
                                styles.messageContainer,
                                message.includes('success') ? styles.messageSuccess : styles.messageError
                            ]}>
                                <Ionicons
                                    name={message.includes('success') ? 'checkmark-circle' : 'alert-circle'}
                                    size={16}
                                    color={message.includes('success') ? '#10B981' : '#EF4444'}
                                />
                                <Text style={[
                                    styles.messageText,
                                    message.includes('success') ? styles.messageTextSuccess : styles.messageTextError
                                ]}>
                                    {message}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
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
    centerLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    backToListButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
    },
    backToListText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    jobInfoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    jobHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    jobTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
        marginRight: 12,
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
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
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
    descriptionSection: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    descriptionText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
    },
    additionalInfo: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        gap: 12,
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
    skillsSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    skillsTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillChip: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    skillText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    },
    employerViewCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    employerIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    employerViewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    employerViewText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    dashboardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    dashboardButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    applicationCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    applicationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 20,
    },
    formGroup: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#1F2937',
    },
    textArea: {
        height: 120,
        paddingTop: 12,
    },
    applyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    applyButtonDisabled: {
        opacity: 0.6,
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        gap: 8,
    },
    messageSuccess: {
        backgroundColor: '#D1FAE5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    messageError: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    messageText: {
        fontSize: 14,
        flex: 1,
    },
    messageTextSuccess: {
        color: '#065F46',
    },
    messageTextError: {
        color: '#991B1B',
    },
});

export default JobDetails;
