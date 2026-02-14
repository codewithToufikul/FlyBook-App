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
    FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
    getProjectDetails,
    Project,
    submitProposal,
    getProjectProposals,
    updateProposalStatus,
} from '../../services/jobService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Proposal {
    _id: string;
    freelancer?: {
        _id: string;
        name: string;
        email: string;
    };
    freelancerId: string;
    proposedPrice?: number;
    hourlyRate?: number;
    deliveryTime: string;
    coverLetter: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

const ProjectDetails = ({ route, navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { projectId } = route.params;
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Proposal form
    const [proposedPrice, setProposedPrice] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [message, setMessage] = useState('');

    // Client/Freelancer status
    const [isClient, setIsClient] = useState(false);
    const [isFreelancer, setIsFreelancer] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [showProposals, setShowProposals] = useState(false);

    useEffect(() => {
        fetchProjectDetails();
    }, [projectId]);

    const fetchProjectDetails = async () => {
        try {
            setLoading(true);
            const data = await getProjectDetails(projectId);
            setProject(data);

            // Check if current user is the client
            try {
                const data = await getProjectProposals(projectId);
                setProposals(data || []);
                setIsClient(true);
            } catch {
                // Not the client, check if freelancer
                try {
                    // We don't have a direct service for ALL freelancer proposals yet in ProjectDetails
                    // But we can check if the user is a freelancer for THIS project
                    const myProposals = proposals;
                    const myProposal = myProposals.find((p: any) => p.status === 'accepted' && p.freelancerId === currentUserId);
                    if (myProposal) {
                        setIsFreelancer(true);
                    }
                } catch {
                    // Not authenticated or not freelancer
                }
            }
        } catch (error) {
            console.error("Failed to load project details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitProposal = async () => {
        if (!coverLetter.trim() || !deliveryTime.trim()) {
            setMessage('Please fill in all required fields');
            return;
        }

        if (project?.budgetType === 'fixed' && !proposedPrice.trim()) {
            setMessage('Please enter your proposed price');
            return;
        }

        if (project?.budgetType === 'hourly' && !hourlyRate.trim()) {
            setMessage('Please enter your hourly rate');
            return;
        }

        try {
            setSubmitting(true);
            setMessage('');

            const payload: any = {
                coverLetter,
                deliveryTime,
            };

            if (project?.budgetType === 'fixed') {
                payload.proposedPrice = Number(proposedPrice);
            } else {
                payload.hourlyRate = Number(hourlyRate);
            }

            const response = await submitProposal(projectId, payload);

            if (response.success) {
                setMessage('Proposal submitted successfully!');
                setCoverLetter('');
                setProposedPrice('');
                setHourlyRate('');
                setDeliveryTime('');
                Alert.alert(
                    'Success',
                    'Your proposal has been submitted successfully!',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                setMessage(response.message || 'Failed to submit proposal');
            }
        } catch (error: any) {
            console.error('Error submitting proposal:', error);
            setMessage(error.response?.data?.message || 'Failed to submit proposal');
        } finally {
            setSubmitting(false);
        }
    };

    const handleProposalStatus = async (proposalId: string, status: 'accepted' | 'rejected') => {
        try {
            const response = await updateProposalStatus(proposalId, status);

            if (response.success || response.data?.success) {
                fetchProjectDetails();
                Alert.alert('Success', `Proposal ${status} successfully`);
            }
        } catch (error) {
            console.error('Error updating proposal status:', error);
            Alert.alert('Error', 'Failed to update proposal status');
        }
    };

    if (loading) {
        return (
            <View style={styles.centerLoader}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    if (!project) {
        return (
            <View style={styles.centerLoader}>
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text style={styles.errorText}>Project not found</Text>
                <TouchableOpacity
                    style={styles.backToListButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backToListText}>Back to Marketplace</Text>
                </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Project Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Project Information Card */}
                <View style={styles.projectInfoCard}>
                    <View style={styles.projectHeaderRow}>
                        <Text style={styles.projectTitle}>{project.title}</Text>
                    </View>

                    <View style={styles.badgesRow}>
                        <View style={[styles.badge, project.budgetType === 'fixed' ? styles.badgeFixed : styles.badgeHourly]}>
                            <Text style={styles.badgeText}>
                                {project.budgetType === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                            </Text>
                        </View>
                        <View style={[styles.badge, styles.badgeStatus]}>
                            <Text style={styles.badgeText}>{project.status}</Text>
                        </View>
                    </View>

                    <View style={styles.metaSection}>
                        {project.category && (
                            <View style={styles.metaRow}>
                                <Ionicons name="folder-outline" size={16} color="#6B7280" />
                                <Text style={styles.metaLabel}>Category:</Text>
                                <Text style={styles.metaValue}>{project.category}</Text>
                            </View>
                        )}
                        {project.budgetType === 'fixed' && project.budget && (
                            <View style={styles.metaRow}>
                                <Ionicons name="cash-outline" size={16} color="#10B981" />
                                <Text style={styles.metaLabel}>Budget:</Text>
                                <Text style={styles.metaValue}>৳{project.budget.toLocaleString()}</Text>
                            </View>
                        )}
                        {project.budgetType === 'hourly' && project.hourlyRate && (
                            <View style={styles.metaRow}>
                                <Ionicons name="cash-outline" size={16} color="#10B981" />
                                <Text style={styles.metaLabel}>Hourly Rate:</Text>
                                <Text style={styles.metaValue}>৳{project.hourlyRate.toLocaleString()}/hr</Text>
                            </View>
                        )}
                        {project.postedByUser && (
                            <View style={styles.metaRow}>
                                <Ionicons name="person-outline" size={16} color="#3B82F6" />
                                <Text style={styles.metaLabel}>Posted by:</Text>
                                <Text style={styles.metaValue}>{project.postedByUser.name}</Text>
                            </View>
                        )}
                        {project.deadline && (
                            <View style={styles.metaRow}>
                                <Ionicons name="calendar-outline" size={16} color="#EF4444" />
                                <Text style={styles.metaLabel}>Deadline:</Text>
                                <Text style={styles.metaValue}>
                                    {new Date(project.deadline).toLocaleDateString()}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.descriptionSection}>
                        <Text style={styles.descriptionText}>{project.description}</Text>
                    </View>

                    {/* Skills */}
                    {project.skills && project.skills.length > 0 && (
                        <View style={styles.skillsSection}>
                            <Text style={styles.skillsTitle}>Required Skills</Text>
                            <View style={styles.skillsContainer}>
                                {project.skills.map((skill, index) => (
                                    <View key={index} style={styles.skillChip}>
                                        <Text style={styles.skillText}>{skill}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* Chat Button (if proposal accepted and project in progress) */}
                {project.status === 'in_progress' && project.selectedFreelancer && (
                    <View style={styles.chatCard}>
                        <View style={styles.chatIconContainer}>
                            <Ionicons name="chatbubbles" size={24} color="#10B981" />
                        </View>
                        <View style={styles.chatInfo}>
                            <Text style={styles.chatTitle}>Project in Progress</Text>
                            <Text style={styles.chatText}>
                                You can now chat with {isClient ? 'the freelancer' : 'the client'} about this project.
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.chatButton}
                            onPress={() => {
                                const chatUserId = isClient ? project.selectedFreelancer : project.postedBy;
                                navigation.navigate('Chat', { userId: chatUserId });
                            }}
                        >
                            <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
                            <Text style={styles.chatButtonText}>Chat</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Client View - Proposals */}
                {isClient ? (
                    <View style={styles.proposalsCard}>
                        <View style={styles.proposalsHeader}>
                            <Text style={styles.proposalsTitle}>Proposals ({proposals.length})</Text>
                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => setShowProposals(!showProposals)}
                            >
                                <Text style={styles.toggleButtonText}>
                                    {showProposals ? 'Hide' : 'View'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {showProposals && (
                            <View style={styles.proposalsList}>
                                {proposals.length === 0 ? (
                                    <Text style={styles.noProposalsText}>No proposals yet.</Text>
                                ) : (
                                    proposals.map((proposal) => (
                                        <View key={proposal._id} style={styles.proposalItem}>
                                            <View style={styles.proposalHeader}>
                                                <Text style={styles.freelancerName}>
                                                    {proposal.freelancer?.name || 'Freelancer'}
                                                </Text>
                                                <Text style={styles.proposalDate}>
                                                    {new Date(proposal.createdAt).toLocaleDateString()}
                                                </Text>
                                            </View>

                                            <View style={styles.proposalMeta}>
                                                {proposal.proposedPrice && (
                                                    <Text style={styles.proposalMetaText}>
                                                        💰 Proposed: ৳{proposal.proposedPrice.toLocaleString()}
                                                    </Text>
                                                )}
                                                {proposal.hourlyRate && (
                                                    <Text style={styles.proposalMetaText}>
                                                        💰 Rate: ৳{proposal.hourlyRate.toLocaleString()}/hr
                                                    </Text>
                                                )}
                                                {proposal.deliveryTime && (
                                                    <Text style={styles.proposalMetaText}>
                                                        ⏱️ Delivery: {proposal.deliveryTime}
                                                    </Text>
                                                )}
                                            </View>

                                            {proposal.coverLetter && (
                                                <View style={styles.coverLetterSection}>
                                                    <Text style={styles.coverLetterLabel}>Cover Letter:</Text>
                                                    <Text style={styles.coverLetterText}>{proposal.coverLetter}</Text>
                                                </View>
                                            )}

                                            <View style={styles.proposalActions}>
                                                {proposal.status === 'pending' && (
                                                    <>
                                                        <TouchableOpacity
                                                            style={styles.acceptButton}
                                                            onPress={() => handleProposalStatus(proposal._id, 'accepted')}
                                                        >
                                                            <Text style={styles.acceptButtonText}>Accept</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={styles.rejectButton}
                                                            onPress={() => handleProposalStatus(proposal._id, 'rejected')}
                                                        >
                                                            <Text style={styles.rejectButtonText}>Reject</Text>
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                                {proposal.status === 'accepted' && (
                                                    <View style={styles.statusBadge}>
                                                        <Text style={styles.statusBadgeText}>✓ Accepted</Text>
                                                    </View>
                                                )}
                                                {proposal.status === 'rejected' && (
                                                    <View style={[styles.statusBadge, styles.statusBadgeRejected]}>
                                                        <Text style={styles.statusBadgeTextRejected}>✗ Rejected</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}
                    </View>
                ) : project.status === 'open' ? (
                    // Freelancer View - Proposal Form
                    <View style={styles.proposalFormCard}>
                        <Text style={styles.formTitle}>Submit Proposal</Text>

                        {project.budgetType === 'fixed' ? (
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Your Proposed Price (৳) *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your price"
                                    placeholderTextColor="#9CA3AF"
                                    value={proposedPrice}
                                    onChangeText={setProposedPrice}
                                    keyboardType="numeric"
                                />
                            </View>
                        ) : (
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Your Hourly Rate (৳) *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your hourly rate"
                                    placeholderTextColor="#9CA3AF"
                                    value={hourlyRate}
                                    onChangeText={setHourlyRate}
                                    keyboardType="numeric"
                                />
                            </View>
                        )}

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Delivery Time *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 3 days, 1 week"
                                placeholderTextColor="#9CA3AF"
                                value={deliveryTime}
                                onChangeText={setDeliveryTime}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Cover Letter *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Explain why you're the best fit for this project..."
                                placeholderTextColor="#9CA3AF"
                                value={coverLetter}
                                onChangeText={setCoverLetter}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                            onPress={handleSubmitProposal}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="send-outline" size={18} color="#fff" />
                                    <Text style={styles.submitButtonText}>Submit Proposal</Text>
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
                ) : (
                    <View style={styles.closedCard}>
                        <Ionicons name="lock-closed-outline" size={32} color="#6B7280" />
                        <Text style={styles.closedText}>
                            This project is {project.status} and not accepting new proposals.
                        </Text>
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
        backgroundColor: '#10B981',
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
    projectInfoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    projectHeaderRow: {
        marginBottom: 12,
    },
    projectTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
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
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    metaSection: {
        gap: 12,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    metaValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    descriptionSection: {
        marginBottom: 16,
    },
    descriptionText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
    },
    skillsSection: {
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
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    skillText: {
        fontSize: 13,
        color: '#059669',
        fontWeight: '500',
    },
    chatCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#D1FAE5',
        alignItems: 'center',
        gap: 12,
    },
    chatIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatInfo: {
        flex: 1,
    },
    chatTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    chatText: {
        fontSize: 13,
        color: '#6B7280',
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    chatButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    proposalsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
    },
    proposalsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    proposalsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    toggleButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#3B82F6',
        borderRadius: 6,
    },
    toggleButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    proposalsList: {
        gap: 16,
    },
    noProposalsText: {
        textAlign: 'center',
        color: '#6B7280',
        fontSize: 14,
        paddingVertical: 20,
    },
    proposalItem: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    proposalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    freelancerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    proposalDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    proposalMeta: {
        gap: 4,
        marginBottom: 12,
    },
    proposalMetaText: {
        fontSize: 13,
        color: '#6B7280',
    },
    coverLetterSection: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginBottom: 12,
    },
    coverLetterLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    coverLetterText: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 20,
    },
    proposalActions: {
        flexDirection: 'row',
        gap: 8,
    },
    acceptButton: {
        flex: 1,
        backgroundColor: '#10B981',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    rejectButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    rejectButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    statusBadge: {
        flex: 1,
        backgroundColor: '#D1FAE5',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    statusBadgeRejected: {
        backgroundColor: '#FEE2E2',
    },
    statusBadgeText: {
        color: '#065F46',
        fontSize: 13,
        fontWeight: '600',
    },
    statusBadgeTextRejected: {
        color: '#991B1B',
    },
    proposalFormCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    formTitle: {
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
        height: 140,
        paddingTop: 12,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
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
    closedCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    closedText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 12,
    },
});

export default ProjectDetails;
