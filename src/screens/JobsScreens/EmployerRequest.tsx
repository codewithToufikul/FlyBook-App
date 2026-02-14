import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    StatusBar,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    getEmployerStatus,
    applyForEmployer,
} from '../../services/jobService';

interface EmployerStatus {
    success: boolean;
    approved?: boolean;
    status?: 'pending' | 'approved' | 'rejected';
    employer?: any;
}

const EmployerRequest = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [companyName, setCompanyName] = useState('');
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [companyLocation, setCompanyLocation] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<EmployerStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            setChecking(true);
            const data = await getEmployerStatus();
            if (data?.success) {
                setStatus(data);
            }
        } catch (error) {
            console.error('Error checking employer status:', error);
        } finally {
            setChecking(false);
        }
    };

    const handleSubmit = async () => {
        if (!companyName.trim() || !companyLocation.trim() || !description.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            const response = await applyForEmployer({
                companyName,
                companyWebsite,
                companyLocation,
                description,
            });

            if (response.data?.success || response.success) {
                setStatus({
                    success: true,
                    approved: false,
                    status: 'pending',
                    employer: response.data?.data || response.data,
                });
                Alert.alert(
                    'Success',
                    'Your employer request has been submitted successfully! We will review it shortly.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error: any) {
            console.error('Error submitting employer request:', error);
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to submit request. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <View style={styles.centerLoader}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Become an Employer</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Pending Status */}
                {status?.status === 'pending' && (
                    <View style={styles.statusCard}>
                        <View style={styles.statusIconContainer}>
                            <Ionicons name="time-outline" size={48} color="#F59E0B" />
                        </View>
                        <Text style={styles.statusTitle}>Request Pending</Text>
                        <Text style={styles.statusText}>
                            Your employer request is currently under review. We will notify you once it's approved.
                        </Text>
                        <View style={styles.statusBadge}>
                            <Ionicons name="hourglass-outline" size={16} color="#F59E0B" />
                            <Text style={styles.statusBadgeText}>Pending Approval</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.dashboardButton}
                            onPress={() => navigation.navigate('JobBoard')}
                        >
                            <Ionicons name="arrow-back-outline" size={18} color="#3B82F6" />
                            <Text style={styles.dashboardButtonText}>Back to Job Board</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Approved Status */}
                {status?.approved && (
                    <View style={[styles.statusCard, styles.statusCardSuccess]}>
                        <View style={[styles.statusIconContainer, styles.statusIconContainerSuccess]}>
                            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                        </View>
                        <Text style={styles.statusTitle}>You're Approved!</Text>
                        <Text style={styles.statusText}>
                            Congratulations! You are now approved to post jobs and manage applications.
                        </Text>
                        <View style={[styles.statusBadge, styles.statusBadgeSuccess]}>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                            <Text style={[styles.statusBadgeText, styles.statusBadgeTextSuccess]}>
                                Approved Employer
                            </Text>
                        </View>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.postJobButton}
                                onPress={() => navigation.navigate('PostJob')}
                            >
                                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                                <Text style={styles.postJobButtonText}>Post a Job</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.dashboardButtonOutline}
                                onPress={() => navigation.navigate('EmployerDashboard')}
                            >
                                <Ionicons name="briefcase-outline" size={18} color="#3B82F6" />
                                <Text style={styles.dashboardButtonOutlineText}>My Dashboard</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Application Form */}
                {!status?.status && !status?.approved && (
                    <>
                        <View style={styles.infoCard}>
                            <Ionicons name="information-circle" size={24} color="#3B82F6" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoTitle}>Why become an employer?</Text>
                                <Text style={styles.infoText}>
                                    Post job listings, receive applications, and hire talented professionals for your company.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.formCard}>
                            <Text style={styles.formTitle}>Employer Application</Text>
                            <Text style={styles.formSubtitle}>
                                Fill in the details below to request employer access
                            </Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Company Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your company name"
                                    placeholderTextColor="#9CA3AF"
                                    value={companyName}
                                    onChangeText={setCompanyName}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Company Website</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="https://example.com (optional)"
                                    placeholderTextColor="#9CA3AF"
                                    value={companyWebsite}
                                    onChangeText={setCompanyWebsite}
                                    keyboardType="url"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Company Location *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g., Dhaka, Bangladesh"
                                    placeholderTextColor="#9CA3AF"
                                    value={companyLocation}
                                    onChangeText={setCompanyLocation}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Company Description *</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Tell us about your company..."
                                    placeholderTextColor="#9CA3AF"
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="send-outline" size={18} color="#fff" />
                                        <Text style={styles.submitButtonText}>Submit Request</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.noteCard}>
                            <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />
                            <Text style={styles.noteText}>
                                Your request will be reviewed by our team. This usually takes 1-2 business days.
                            </Text>
                        </View>
                    </>
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
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    statusCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEF3C7',
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    statusCardSuccess: {
        borderColor: '#D1FAE5',
        borderLeftColor: '#10B981',
    },
    statusIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    statusIconContainerSuccess: {
        backgroundColor: '#D1FAE5',
    },
    statusTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    statusText: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        marginBottom: 20,
    },
    statusBadgeSuccess: {
        backgroundColor: '#D1FAE5',
    },
    statusBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#F59E0B',
    },
    statusBadgeTextSuccess: {
        color: '#10B981',
    },
    dashboardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3B82F6',
        gap: 8,
    },
    dashboardButtonText: {
        color: '#3B82F6',
        fontSize: 15,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    postJobButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    postJobButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    dashboardButtonOutline: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3B82F6',
        gap: 8,
    },
    dashboardButtonOutlineText: {
        color: '#3B82F6',
        fontSize: 15,
        fontWeight: '600',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E40AF',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#3B82F6',
        lineHeight: 18,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    formSubtitle: {
        fontSize: 14,
        color: '#6B7280',
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
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    noteCard: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    noteText: {
        flex: 1,
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
});

export default EmployerRequest;
