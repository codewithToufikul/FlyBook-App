import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Platform,
    Linking,
    ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { post } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { StatusBar } from 'react-native';

const SocialResponseScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const [selectedService, setSelectedService] = useState<'doctor' | 'lawyer' | 'complaint' | null>(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [complaintForm, setComplaintForm] = useState({
        name: '',
        phone: '',
        location: '',
        message: '',
        priority: 'medium'
    });

    const doctors = [
        {
            id: 1,
            name: 'Dr. Rahman Ahmed',
            specialty: 'General Medicine',
            available: true,
            rating: 4.8,
            experience: '15 Years',
            phone: '+8801234567890',
            location: 'Dhaka Medical College'
        },
        {
            id: 2,
            name: 'Dr. Fatema Khatun',
            specialty: 'Pediatrics',
            available: true,
            rating: 4.9,
            experience: '12 Years',
            phone: '+8801234567891',
            location: 'BSMMU, Dhaka'
        }
    ];

    const lawyers = [
        {
            id: 1,
            name: 'Advocate Md. Ali Hossain',
            specialty: 'Criminal Law',
            available: true,
            rating: 4.9,
            experience: '18 Years',
            phone: '+8801234567894',
            location: 'Supreme Court, Dhaka'
        },
        {
            id: 2,
            name: 'Advocate Roksana Begum',
            specialty: 'Family Law',
            available: true,
            rating: 4.8,
            experience: '14 Years',
            phone: '+8801234567895',
            location: 'Judge Court, Dhaka'
        }
    ];

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const handleComplaintSubmit = async () => {
        if (!complaintForm.name || !complaintForm.phone || !complaintForm.message) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const res = await post<any>('/social-response/complaint', complaintForm);
            if (res.success) {
                Alert.alert('Success', 'Your complaint has been submitted successfully and an email has been sent to our support team!');
                setComplaintForm({ name: '', phone: '', location: '', message: '', priority: 'medium' });
                setSelectedService(null);
            } else {
                Alert.alert('Error', res.message || 'Failed to submit complaint');
            }
        } catch (error) {
            console.error('Complaint Submit Error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const renderHeader = () => (
        <View style={[styles.header, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }, { paddingTop: insets.top }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#1F2937"} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Social Responsibility</Text>
            <View style={{ width: 40 }} />
        </View>
    );

    const renderServiceCards = () => (
        <View style={styles.serviceGrid}>
            <TouchableOpacity
                style={[styles.serviceCard, { borderTopColor: '#10B981' }, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}
                onPress={() => setSelectedService('doctor')}
            >
                <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }]}>
                    <Ionicons name="call" size={32} color="#10B981" />
                </View>
                <Text style={[styles.serviceTitle, isDark && { color: '#f8fafc' }]}>Doctor 24/7</Text>
                <Text style={[styles.serviceDesc, isDark && { color: '#94a3b8' }]}>Connect with licensed professionals</Text>
                <View style={styles.statusBadge}>
                    <Ionicons name="time" size={14} color="#10B981" />
                    <Text style={[styles.statusText, isDark && { color: '#10B981' }]}>Available Now</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.serviceCard, { borderTopColor: '#3B82F6' }, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}
                onPress={() => setSelectedService('lawyer')}
            >
                <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#DBEAFE' }]}>
                    <Ionicons name="document-text" size={32} color="#3B82F6" />
                </View>
                <Text style={[styles.serviceTitle, isDark && { color: '#f8fafc' }]}>Lawyer 24/7</Text>
                <Text style={[styles.serviceDesc, isDark && { color: '#94a3b8' }]}>Get legal advice anytime</Text>
                <View style={styles.statusBadge}>
                    <Ionicons name="time" size={14} color="#3B82F6" />
                    <Text style={[styles.statusText, { color: '#3B82F6' }]}>Available Now</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.serviceCard, { borderTopColor: '#EF4444' }, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}
                onPress={() => setSelectedService('complaint')}
            >
                <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}>
                    <Ionicons name="alert-circle" size={32} color="#EF4444" />
                </View>
                <Text style={[styles.serviceTitle, isDark && { color: '#f8fafc' }]}>File Complaint</Text>
                <Text style={[styles.serviceDesc, isDark && { color: '#94a3b8' }]}>Report issues for quick resolution</Text>
                <View style={styles.statusBadge}>
                    <Ionicons name="chatbubble" size={14} color="#EF4444" />
                    <Text style={[styles.statusText, { color: '#EF4444' }]}>Report Now</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    const renderProfessionalList = (data: typeof doctors, type: 'doctor' | 'lawyer') => (
        <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
                <Ionicons
                    name={type === 'doctor' ? 'medical' : 'briefcase'}
                    size={28}
                    color={type === 'doctor' ? '#10B981' : '#3B82F6'}
                />
                <Text style={[styles.sectionTitle, isDark && { color: '#f8fafc' }]}>Available {type === 'doctor' ? 'Doctors' : 'Lawyers'}</Text>
            </View>
            {data.map((item) => (
                <View key={item.id} style={[styles.itemCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                    <View style={styles.itemHeader}>
                        <View style={[styles.avatarContainer, isDark && { backgroundColor: '#0f172a' }]}>
                            <Ionicons
                                name="person"
                                size={24}
                                color={type === 'doctor' ? '#10B981' : '#3B82F6'}
                            />
                        </View>
                        <View style={styles.itemInfo}>
                            <Text style={[styles.itemName, isDark && { color: '#f8fafc' }]}>{item.name}</Text>
                            <Text style={[styles.itemSubName, isDark && { color: '#94a3b8' }]}>{item.specialty}</Text>
                            <Text style={[styles.experienceText, isDark && { color: '#64748b' }]}>{item.experience} Experience</Text>
                        </View>
                        <View style={[styles.availabilityBadge, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <Text style={[styles.availabilityText, isDark && { color: '#10B981' }]}>Available</Text>
                        </View>
                    </View>

                    <View style={styles.itemDetails}>
                        <View style={styles.detailRow}>
                            <Ionicons name="location" size={14} color={isDark ? "#64748b" : "#6B7280"} />
                            <Text style={[styles.detailValue, isDark && { color: '#64748b' }]}>{item.location}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="call" size={14} color={isDark ? "#64748b" : "#6B7280"} />
                            <Text style={[styles.detailValue, isDark && { color: '#64748b' }]}>{item.phone}</Text>
                        </View>
                    </View>

                    <View style={[styles.itemActions, isDark && { borderTopColor: '#334155' }]}>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={16} color="#F59E0B" />
                            <Text style={[styles.ratingText, isDark && { color: '#f8fafc' }]}>{item.rating}</Text>
                        </View>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.callBtn, { backgroundColor: type === 'doctor' ? '#10B981' : '#3B82F6' }]}
                                onPress={() => handleCall(item.phone)}
                            >
                                <Text style={styles.btnText}>Call Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.msgBtn, isDark ? { borderColor: '#14b8a6' } : { borderColor: type === 'doctor' ? '#10B981' : '#3B82F6' }]}>
                                <Text style={[styles.btnText, { color: isDark ? '#14b8a6' : (type === 'doctor' ? '#10B981' : '#3B82F6') }]}>Message</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderComplaintForm = () => (
        <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
                <Ionicons name="alert-circle" size={28} color="#EF4444" />
                <Text style={[styles.sectionTitle, isDark && { color: '#f8fafc' }]}>File a Complaint</Text>
            </View>
            <View style={[styles.formCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                <Text style={[styles.label, isDark && { color: '#f8fafc' }]}>Full Name *</Text>
                <TextInput
                    style={[styles.input, isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }]}
                    placeholder="Enter your name"
                    placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
                    value={complaintForm.name}
                    onChangeText={(text) => setComplaintForm({ ...complaintForm, name: text })}
                />

                <Text style={[styles.label, isDark && { color: '#f8fafc' }]}>Phone Number *</Text>
                <TextInput
                    style={[styles.input, isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }]}
                    placeholder="+8801XXXXXXXXX"
                    placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
                    keyboardType="phone-pad"
                    value={complaintForm.phone}
                    onChangeText={(text) => setComplaintForm({ ...complaintForm, phone: text })}
                />

                <Text style={[styles.label, isDark && { color: '#f8fafc' }]}>Location</Text>
                <TextInput
                    style={[styles.input, isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }]}
                    placeholder="District, Upazila"
                    placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
                    value={complaintForm.location}
                    onChangeText={(text) => setComplaintForm({ ...complaintForm, location: text })}
                />

                <Text style={[styles.label, isDark && { color: '#f8fafc' }]}>Complaint Details *</Text>
                <TextInput
                    style={[styles.input, styles.textArea, isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }]}
                    placeholder="Describe your complaint in detail..."
                    placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
                    multiline
                    numberOfLines={4}
                    value={complaintForm.message}
                    onChangeText={(text) => setComplaintForm({ ...complaintForm, message: text })}
                />

                <TouchableOpacity
                    style={[styles.submitBtn, isDark && { backgroundColor: '#EF4444', shadowColor: '#EF4444' }]}
                    onPress={handleComplaintSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitBtnText}>Submit Complaint</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : (Platform.OS === 'ios' ? '#FFFFFF' : '#FFFFFF')} />
            {renderHeader()}
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.heroSection, isDark && { backgroundColor: '#0f172a' }]}>
                    <Text style={[styles.heroTitle, isDark && { color: '#f8fafc' }]}>Support Services</Text>
                    <Text style={[styles.heroSubtitle, isDark && { color: '#94a3b8' }]}>24/7 Emergency Support • We're Here to Help</Text>
                </View>

                {renderServiceCards()}

                {selectedService === 'doctor' && renderProfessionalList(doctors, 'doctor')}
                {selectedService === 'lawyer' && renderProfessionalList(lawyers, 'lawyer')}
                {selectedService === 'complaint' && renderComplaintForm()}

                {!selectedService && (
                    <View style={styles.emptyState}>
                        <Ionicons name="chatbox-ellipses-outline" size={80} color={isDark ? "#1e293b" : "#D1D5DB"} />
                        <Text style={[styles.emptyText, isDark && { color: '#64748b' }]}>Select a service above to get started</Text>
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
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#FFFFFF',
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 8,
    },
    serviceGrid: {
        paddingHorizontal: 20,
        gap: 16,
    },
    serviceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderTopWidth: 4,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    serviceTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    serviceDesc: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
    },
    contentSection: {
        marginTop: 30,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    itemCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    itemSubName: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 2,
    },
    experienceText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    availabilityBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    availabilityText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#065F46',
    },
    itemDetails: {
        marginVertical: 12,
        gap: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailValue: {
        fontSize: 13,
        color: '#4B5563',
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    callBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    msgBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4F46E5',
    },
    btnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111827',
        marginBottom: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitBtn: {
        backgroundColor: '#EF4444',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    emptyState: {
        marginTop: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: '#9CA3AF',
    },
});

export default SocialResponseScreen;
