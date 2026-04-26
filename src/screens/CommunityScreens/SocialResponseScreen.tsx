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
    Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { post, get, patch } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { StatusBar } from 'react-native';

type TabType = 'doctor' | 'lawyer' | 'complaint' | 'appointments' | 'apply';

const TABS = [
    { id: 'doctor', label: 'Doctor', icon: 'medkit', color: '#10B981', bg: '#ECFDF5', darkBg: 'rgba(16,185,129,0.12)' },
    { id: 'lawyer', label: 'Lawyer', icon: 'briefcase', color: '#3B82F6', bg: '#EFF6FF', darkBg: 'rgba(59,130,246,0.12)' },
    { id: 'complaint', label: 'Complaint', icon: 'warning', color: '#EF4444', bg: '#FFF1F1', darkBg: 'rgba(239,68,68,0.12)' },
    { id: 'appointments', label: 'My Bookings', icon: 'calendar', color: '#8B5CF6', bg: '#F5F3FF', darkBg: 'rgba(139,92,246,0.12)' },
    { id: 'apply', label: 'Join Us', icon: 'person-add', color: '#F59E0B', bg: '#FFFBEB', darkBg: 'rgba(245,158,11,0.12)' },
];

const SocialResponseScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const [activeTab, setActiveTab] = useState<TabType>('doctor');
    const [loading, setLoading] = useState(false);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [bookingItem, setBookingItem] = useState<any>(null);
    const [bookingForm, setBookingForm] = useState({ date: '', time: '', reason: '' });
    const [myAppointments, setMyAppointments] = useState<any[]>([]);

    // Professional dashboard state
    const [isProfessional, setIsProfessional] = useState(false);
    const [myProfessionalData, setMyProfessionalData] = useState<any>(null);
    const [showDashboard, setShowDashboard] = useState(false);
    const [dashboardAppointments, setDashboardAppointments] = useState<any[]>([]);
    const [dashboardStats, setDashboardStats] = useState<any>({ total: 0, pending: 0, approved: 0, cancelled: 0, finished: 0 });
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [dashboardFilter, setDashboardFilter] = useState<'all' | 'pending' | 'approved' | 'cancelled' | 'finished'>('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Date/Time Picker state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());

    const [applyForm, setApplyForm] = useState({
        name: '', specialty: '', experience: '', phone: '', location: '', type: 'doctor' as 'doctor' | 'lawyer'
    });

    const [complaintForm, setComplaintForm] = useState({
        name: '', phone: '', location: '', message: '', priority: 'medium'
    });

    // Check professional status on mount
    React.useEffect(() => {
        checkProfessionalStatus();
    }, []);

    React.useEffect(() => {
        if (activeTab === 'doctor' || activeTab === 'lawyer') {
            fetchProfessionals(activeTab);
        } else if (activeTab === 'appointments') {
            fetchMyAppointments();
        }
    }, [activeTab]);

    const checkProfessionalStatus = async () => {
        try {
            const res = await get<any>('/api/social-response/my-professional-status');
            if (res.success && res.isProfessional && res.data?.status === 'approved') {
                setIsProfessional(true);
                setMyProfessionalData(res.data);
                setShowDashboard(true); // ✅ directly show dashboard
                fetchDashboardData();  // ✅ fetch data immediately
            }
        } catch (error) {
            console.error('Professional status check error:', error);
        }
    };

    const fetchDashboardData = async () => {
        setDashboardLoading(true);
        try {
            const res = await get<any>('/api/social-response/professional-dashboard');
            if (res.success) {
                setDashboardAppointments(res.data);
                setDashboardStats(res.stats);
            }
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setDashboardLoading(false);
        }
    };

    const handleUpdateAppointmentStatus = async (appointmentId: string, status: 'approved' | 'cancelled' | 'finished') => {
        setUpdatingId(appointmentId);
        try {
            const res = await patch<any>(
                `/api/social-response/appointments/${appointmentId}/status`,
                { status }
            );
            if (res.success) {
                // find previous status to decrement
                const prevStatus = dashboardAppointments.find(a => a._id === appointmentId)?.status;
                setDashboardAppointments(prev =>
                    prev.map(a => a._id === appointmentId ? { ...a, status } : a)
                );
                setDashboardStats((prev: any) => ({
                    ...prev,
                    ...(prevStatus ? { [prevStatus]: Math.max(0, (prev[prevStatus] || 0) - 1) } : {}),
                    [status]: (prev[status] || 0) + 1,
                }));
                const msg = status === 'approved' ? 'Appointment approved!' :
                    status === 'finished' ? 'Appointment marked as finished!' : 'Appointment declined.';
                Alert.alert('Success', msg);
            }
        } catch {
            Alert.alert('Error', 'Failed to update appointment status');
        } finally {
            setUpdatingId(null);
        }
    };


    const fetchMyAppointments = async () => {
        try {
            const res = await get<any>('/api/social-response/my-appointments');
            if (res.success) setMyAppointments(res.data);
        } catch (error) {
            console.error('Fetch My Appointments Error:', error);
        }
    };

    const fetchProfessionals = async (type: string) => {
        setLoading(true);
        try {
            const res = await get<any>(`/api/social-response/professionals?type=${type}`);
            if (res.success) setProfessionals(res.data);
        } catch (error) {
            console.error('Fetch Professionals Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyAsProfessional = async () => {
        if (!applyForm.name || !applyForm.specialty || !applyForm.phone) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        setLoading(true);
        try {
            const res = await post<any>('/api/social-response/apply', applyForm);
            if (res.success) {
                Alert.alert('Success', 'Your application has been submitted for approval!');
                setApplyForm({ name: '', specialty: '', experience: '', phone: '', location: '', type: 'doctor' });
            } else {
                Alert.alert('Error', res.message || 'Failed to submit application');
            }
        } catch {
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleBookAppointment = async () => {
        if (!bookingForm.date || !bookingForm.time || !bookingForm.reason) {
            Alert.alert('Error', 'Please fill in all booking details');
            return;
        }
        setLoading(true);
        try {
            const res = await post<any>('/api/social-response/book', {
                professionalId: bookingItem._id,
                ...bookingForm
            });
            if (res.success) {
                Alert.alert('Success', 'Appointment request sent! You will be notified once accepted.');
                setBookingItem(null);
                setBookingForm({ date: '', time: '', reason: '' });
            }
        } catch {
            Alert.alert('Error', 'Failed to book appointment');
        } finally {
            setLoading(false);
        }
    };

    const handleChatWithProfessional = async (profUserId: string) => {
        if (!profUserId) {
            Alert.alert('Error', 'Professional contact details not found');
            return;
        }
        try {
            const target = `chat:${profUserId}`;
            const data = encodeURIComponent(JSON.stringify({ target }));
            const url = `flyconnect://auth?data=${data}`;
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Installation Required', 'Please install FlyConnect app to chat with professionals.');
            }
        } catch {
            Alert.alert('Error', 'Could not open chat application');
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setTempDate(selectedDate);
            const dateStr = selectedDate.toISOString().split('T')[0];
            setBookingForm({ ...bookingForm, date: dateStr });
        }
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const hours = selectedDate.getHours();
            const minutes = selectedDate.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
            const timeStr = `${displayHours}:${displayMinutes} ${ampm}`;
            setBookingForm({ ...bookingForm, time: timeStr });
        }
    };

    const handleComplaintSubmit = async () => {
        if (!complaintForm.name || !complaintForm.phone || !complaintForm.message) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        setLoading(true);
        try {
            const res = await post<any>('/api/social-response/complaint', complaintForm);
            if (res.success) {
                Alert.alert('Success', 'Complaint submitted successfully!');
                setComplaintForm({ name: '', phone: '', location: '', message: '', priority: 'medium' });
            } else {
                Alert.alert('Error', res.message || 'Failed to submit complaint');
            }
        } catch {
            Alert.alert('Error', 'Something went wrong. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const activeTabData = TABS.find(t => t.id === activeTab)!;

    // ─── Header ───────────────────────────────────────────────────────────────
    const renderHeader = () => (
        <View style={[
            styles.header,
            isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' },
            { paddingTop: insets.top }
        ]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color={isDark ? '#f1f5f9' : '#1e293b'} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
                <Text style={[styles.headerTitle, isDark && { color: '#f1f5f9' }]}>Support Services</Text>
                <View style={styles.livePill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>24/7 Live</Text>
                </View>
            </View>
            <View style={{ width: 40 }} />
        </View>
    );

    // ─── Hero Banner ──────────────────────────────────────────────────────────
    const renderHero = () => (
        <View style={[styles.heroBanner, isDark && { backgroundColor: '#0f172a' }]}>
            <View style={[styles.heroIconWrap, { backgroundColor: isDark ? activeTabData.darkBg : activeTabData.bg }]}>
                <Ionicons name={activeTabData.icon as any} size={28} color={activeTabData.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.heroTitle, isDark && { color: '#f1f5f9' }]}>
                    {activeTab === 'doctor' ? 'Doctor on Call' :
                        activeTab === 'lawyer' ? 'Legal Advice' :
                            activeTab === 'complaint' ? 'File a Complaint' :
                                activeTab === 'appointments' ? 'My Appointments' :
                                    'Join as Professional'}
                </Text>
                <Text style={[styles.heroSub, isDark && { color: '#64748b' }]}>
                    {activeTab === 'doctor' ? 'Licensed doctors available now' :
                        activeTab === 'lawyer' ? 'Get legal help anytime' :
                            activeTab === 'complaint' ? 'We resolve issues quickly' :
                                activeTab === 'appointments' ? 'Track your bookings' :
                                    'Apply to serve your community'}
                </Text>
            </View>
        </View>
    );

    // ─── Tab Bar ──────────────────────────────────────────────────────────────
    const renderTabs = () => (
        <View style={[styles.tabWrapper, isDark && { backgroundColor: '#0f172a' }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabScroll}
            >
                {TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => setActiveTab(tab.id as TabType)}
                            style={[
                                styles.tab,
                                isActive && { backgroundColor: isDark ? tab.darkBg : tab.bg, borderBottomWidth: 2.5, borderBottomColor: tab.color },
                                !isActive && isDark && { borderBottomColor: 'transparent' },
                            ]}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={tab.icon as any}
                                size={16}
                                color={isActive ? tab.color : (isDark ? '#475569' : '#9CA3AF')}
                            />
                            <Text style={[
                                styles.tabLabel,
                                { color: isActive ? tab.color : (isDark ? '#475569' : '#9CA3AF') },
                                isActive && { fontWeight: '700' }
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    // ─── Professional List ────────────────────────────────────────────────────
    const renderProfessionalList = () => {
        const type = activeTab as 'doctor' | 'lawyer';
        const color = type === 'doctor' ? '#10B981' : '#3B82F6';
        const bgLight = type === 'doctor' ? '#ECFDF5' : '#EFF6FF';
        const bgDark = type === 'doctor' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)';

        if (loading) {
            return (
                <View style={styles.centeredLoader}>
                    <ActivityIndicator size="large" color={color} />
                    <Text style={[styles.loadingText, isDark && { color: '#64748b' }]}>Finding available {type}s...</Text>
                </View>
            );
        }

        return (
            <View style={styles.listContainer}>
                {professionals.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Ionicons name="person-outline" size={56} color={isDark ? '#1e293b' : '#E5E7EB'} />
                        <Text style={[styles.emptyTitle, isDark && { color: '#334155' }]}>No {type}s available</Text>
                        <Text style={[styles.emptyDesc, isDark && { color: '#475569' }]}>Check back soon</Text>
                    </View>
                ) : (
                    professionals.map(item => (
                        <View key={item._id} style={[styles.profCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                            {/* Top strip */}
                            <View style={[styles.profCardStrip, { backgroundColor: color }]} />

                            <View style={styles.profCardBody}>
                                {/* Avatar + Info */}
                                <View style={styles.profRow}>
                                    <View style={[styles.avatar, { backgroundColor: isDark ? bgDark : bgLight }]}>
                                        <Ionicons name="person" size={22} color={color} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.profName, isDark && { color: '#f1f5f9' }]}>{item.name}</Text>
                                        <Text style={[styles.profSpecialty, isDark && { color: '#94a3b8' }]}>{item.specialty}</Text>
                                        <View style={styles.infoRow}>
                                            <Ionicons name="time-outline" size={12} color={isDark ? '#64748b' : '#9CA3AF'} />
                                            <Text style={[styles.infoText, isDark && { color: '#64748b' }]}>{item.experience} exp.</Text>
                                            <View style={styles.dot} />
                                            <Ionicons name="location-outline" size={12} color={isDark ? '#64748b' : '#9CA3AF'} />
                                            <Text style={[styles.infoText, isDark && { color: '#64748b' }]}>{item.location}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.availBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5' }]}>
                                        <View style={styles.greenDot} />
                                        <Text style={styles.availText}>Online</Text>
                                    </View>
                                </View>

                                {/* Rating + Actions */}
                                <View style={[styles.profFooter, isDark && { borderTopColor: '#334155' }]}>
                                    <View style={styles.ratingRow}>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Ionicons key={i} name="star" size={13} color="#F59E0B" style={{ marginRight: 1 }} />
                                        ))}
                                        <Text style={[styles.ratingNum, isDark && { color: '#94a3b8' }]}>{item.rating || '5.0'}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.bookBtn, { backgroundColor: color }]}
                                        onPress={() => setBookingItem(item)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="calendar-outline" size={14} color="#FFF" />
                                        <Text style={styles.bookBtnText}>Book Now</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </View>
        );
    };

    // ─── Booking Modal ────────────────────────────────────────────────────────
    const renderBookingModal = () => (
        bookingItem && (
            <View style={styles.modalOverlay}>
                <View style={[styles.modalBox, isDark && { backgroundColor: '#1e293b' }]}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={[styles.modalTitle, isDark && { color: '#f1f5f9' }]}>Book Appointment</Text>
                            <Text style={[styles.modalSub, isDark && { color: '#64748b' }]}>with {bookingItem.name}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setBookingItem(null)} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color={isDark ? '#94a3b8' : '#6B7280'} />
                        </TouchableOpacity>
                    </View>

                    {/* Fields */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>
                            <Ionicons name="calendar-outline" size={13} /> Date
                        </Text>
                        <Pressable
                            style={[styles.fieldInput, styles.pickerTrigger, isDark && { backgroundColor: '#0f172a', borderColor: '#334155' }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={[styles.pickerValue, !bookingForm.date && { color: isDark ? '#475569' : '#9CA3AF' }, isDark && bookingForm.date && { color: '#f1f5f9' }]}>
                                {bookingForm.date || "Select Date"}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={isDark ? '#475569' : '#9CA3AF'} />
                        </Pressable>
                        {showDatePicker && (
                            <DateTimePicker
                                value={tempDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                minimumDate={new Date()}
                                onChange={onDateChange}
                            />
                        )}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>
                            <Ionicons name="time-outline" size={13} /> Time
                        </Text>
                        <Pressable
                            style={[styles.fieldInput, styles.pickerTrigger, isDark && { backgroundColor: '#0f172a', borderColor: '#334155' }]}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <Text style={[styles.pickerValue, !bookingForm.time && { color: isDark ? '#475569' : '#9CA3AF' }, isDark && bookingForm.time && { color: '#f1f5f9' }]}>
                                {bookingForm.time || "Select Time"}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={isDark ? '#475569' : '#9CA3AF'} />
                        </Pressable>
                        {showTimePicker && (
                            <DateTimePicker
                                value={tempDate}
                                mode="time"
                                is24Hour={false}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onTimeChange}
                            />
                        )}
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>
                            <Ionicons name="document-text-outline" size={13} /> Reason
                        </Text>
                        <TextInput
                            style={[styles.fieldInput, styles.fieldTextarea, isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }]}
                            placeholder="Brief reason for appointment..."
                            placeholderTextColor={isDark ? '#475569' : '#9CA3AF'}
                            multiline
                            numberOfLines={3}
                            value={bookingForm.reason}
                            onChangeText={t => setBookingForm({ ...bookingForm, reason: t })}
                        />
                    </View>

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalCancelBtn, isDark && { borderColor: '#334155' }]}
                            onPress={() => setBookingItem(null)}
                        >
                            <Text style={[styles.modalCancelText, isDark && { color: '#94a3b8' }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalConfirmBtn, { backgroundColor: activeTab === 'lawyer' ? '#3B82F6' : '#10B981' }]}
                            onPress={handleBookAppointment}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator size="small" color="#FFF" /> : (
                                <>
                                    <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
                                    <Text style={styles.modalConfirmText}>Confirm</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        )
    );

    // ─── Complaint Form ───────────────────────────────────────────────────────
    const renderComplaintForm = () => (
        <View style={styles.listContainer}>
            {/* Priority Selector */}
            <View style={[styles.formCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                <Text style={[styles.formCardTitle, isDark && { color: '#f1f5f9' }]}>Priority Level</Text>
                <View style={styles.priorityRow}>
                    {['low', 'medium', 'high'].map(p => (
                        <TouchableOpacity
                            key={p}
                            onPress={() => setComplaintForm({ ...complaintForm, priority: p })}
                            style={[
                                styles.priorityBtn,
                                complaintForm.priority === p && {
                                    backgroundColor: p === 'high' ? '#EF4444' : p === 'medium' ? '#F59E0B' : '#10B981',
                                    borderColor: 'transparent',
                                },
                                isDark && complaintForm.priority !== p && { borderColor: '#334155' }
                            ]}
                        >
                            <Text style={[
                                styles.priorityLabel,
                                complaintForm.priority === p ? { color: '#FFF', fontWeight: '700' } :
                                    (isDark ? { color: '#64748b' } : { color: '#6B7280' })
                            ]}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={[styles.formCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                <InputField label="Full Name *" placeholder="Your full name" value={complaintForm.name}
                    onChangeText={t => setComplaintForm({ ...complaintForm, name: t })} isDark={isDark} />
                <InputField label="Phone Number *" placeholder="+8801XXXXXXXXX" value={complaintForm.phone}
                    onChangeText={t => setComplaintForm({ ...complaintForm, phone: t })} isDark={isDark} keyboardType="phone-pad" />
                <InputField label="Location" placeholder="District, Upazila" value={complaintForm.location}
                    onChangeText={t => setComplaintForm({ ...complaintForm, location: t })} isDark={isDark} />
                <InputField label="Complaint Details *" placeholder="Describe your complaint in detail..." value={complaintForm.message}
                    onChangeText={t => setComplaintForm({ ...complaintForm, message: t })} isDark={isDark} multiline />

                <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: '#EF4444' }]}
                    onPress={handleComplaintSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? <ActivityIndicator size="small" color="#FFF" /> : (
                        <>
                            <Ionicons name="send" size={16} color="#FFF" />
                            <Text style={styles.submitBtnText}>Submit Complaint</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    // ─── Professional Dashboard ───────────────────────────────────────────────
    const renderProfessionalDashboard = () => {
        const filteredAppts = dashboardFilter === 'all'
            ? dashboardAppointments
            : dashboardAppointments.filter(a => a.status === dashboardFilter);

        return (
            <View style={styles.listContainer}>
                {/* Dashboard Header Card */}
                <View style={[styles.dashboardHeader, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                    <View style={styles.dashboardBadge}>
                        <Ionicons name={myProfessionalData?.type === 'doctor' ? 'medkit' : 'briefcase'} size={18} color="#FFF" />
                        <Text style={styles.dashboardBadgeText}>{myProfessionalData?.type === 'doctor' ? 'Doctor' : 'Lawyer'} Dashboard</Text>
                    </View>
                    <Text style={[styles.dashboardName, isDark && { color: '#f1f5f9' }]}>{myProfessionalData?.name}</Text>
                    <Text style={[styles.dashboardSpec, isDark && { color: '#94a3b8' }]}>{myProfessionalData?.specialty}</Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    {[
                        { label: 'Total', value: dashboardStats.total, color: '#8B5CF6', icon: 'list' },
                        { label: 'Pending', value: dashboardStats.pending, color: '#F59E0B', icon: 'time' },
                        { label: 'Approved', value: dashboardStats.approved, color: '#10B981', icon: 'checkmark-circle' },
                        { label: 'Finished', value: dashboardStats.finished, color: '#64748b', icon: 'checkmark-done-circle' },
                        { label: 'Declined', value: dashboardStats.cancelled, color: '#EF4444', icon: 'close-circle' },
                    ].map(stat => (
                        <View key={stat.label} style={[styles.statCard, isDark && { backgroundColor: '#1e293b' }]}>
                            <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                            <Text style={[styles.statValue, { color: stat.color, fontSize: 18 }]}>{stat.value}</Text>
                            <Text style={[styles.statLabel, isDark && { color: '#64748b' }]}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Filter Buttons */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
                    {(['all', 'pending', 'approved', 'finished', 'cancelled'] as const).map(f => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setDashboardFilter(f)}
                            style={[styles.filterBtn, dashboardFilter === f && styles.filterBtnActive, isDark && dashboardFilter !== f && { borderColor: '#334155' }]}
                        >
                            <Text style={[styles.filterBtnText, dashboardFilter === f && styles.filterBtnTextActive, isDark && dashboardFilter !== f && { color: '#64748b' }]}>
                                {f === 'cancelled' ? 'Declined' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Appointments List */}
                {dashboardLoading ? (
                    <View style={styles.centeredLoader}>
                        <ActivityIndicator size="large" color="#8B5CF6" />
                        <Text style={[styles.loadingText, isDark && { color: '#64748b' }]}>Loading appointments...</Text>
                    </View>
                ) : filteredAppts.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Ionicons name="calendar-outline" size={56} color={isDark ? '#1e293b' : '#E5E7EB'} />
                        <Text style={[styles.emptyTitle, isDark && { color: '#334155' }]}>No {dashboardFilter === 'all' ? '' : dashboardFilter} appointments</Text>
                        <Text style={[styles.emptyDesc, isDark && { color: '#475569' }]}>Patients will book appointments here</Text>
                    </View>
                ) : (
                    filteredAppts.map(item => {
                        const statusColor = item.status === 'approved' ? '#10B981' : item.status === 'pending' ? '#F59E0B' : '#EF4444';
                        const statusBg = item.status === 'approved' ? (isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5') :
                            item.status === 'pending' ? (isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7') :
                                (isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2');

                        return (
                            <View key={item._id} style={[styles.apptCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                <View style={styles.apptRow}>
                                    <View style={[styles.apptIcon, { backgroundColor: isDark ? 'rgba(139,92,246,0.12)' : '#F5F3FF' }]}>
                                        <Ionicons name="person" size={20} color="#8B5CF6" />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.apptName, isDark && { color: '#f1f5f9' }]}>{item.patientName}</Text>
                                        <Text style={[styles.apptType, isDark && { color: '#94a3b8' }]}>
                                            {item.date} at {item.time}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                                        <Text style={[styles.statusText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
                                    </View>
                                </View>

                                <Text style={[styles.apptReason, isDark && { color: '#64748b', borderTopColor: '#334155' }]}>
                                    📋 {item.reason}
                                </Text>

                                {item.status === 'pending' && (
                                    <View style={styles.actionRow}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2', borderColor: '#EF4444' }]}
                                            onPress={() => handleUpdateAppointmentStatus(item._id, 'cancelled')}
                                            disabled={updatingId === item._id}
                                        >
                                            {updatingId === item._id ? <ActivityIndicator size="small" color="#EF4444" /> : (
                                                <>
                                                    <Ionicons name="close" size={15} color="#EF4444" />
                                                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Decline</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5', borderColor: '#10B981' }]}
                                            onPress={() => handleUpdateAppointmentStatus(item._id, 'approved')}
                                            disabled={updatingId === item._id}
                                        >
                                            {updatingId === item._id ? <ActivityIndicator size="small" color="#10B981" /> : (
                                                <>
                                                    <Ionicons name="checkmark" size={15} color="#10B981" />
                                                    <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Accept</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {item.status === 'approved' && (
                                    <View style={styles.actionRow}>
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(100,116,139,0.15)' : '#F1F5F9', borderColor: '#64748b', flex: 1 }]}
                                            onPress={() => handleUpdateAppointmentStatus(item._id, 'finished')}
                                            disabled={updatingId === item._id}
                                        >
                                            {updatingId === item._id ? <ActivityIndicator size="small" color="#64748b" /> : (
                                                <>
                                                    <Ionicons name="checkmark-done" size={15} color="#64748b" />
                                                    <Text style={[styles.actionBtnText, { color: '#64748b' }]}>Mark as Finished</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </View>
        );
    };

    // ─── My Appointments ──────────────────────────────────────────────────────
    const renderMyAppointments = () => (
        <View style={styles.listContainer}>
            {myAppointments.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Ionicons name="calendar-outline" size={56} color={isDark ? '#1e293b' : '#E5E7EB'} />
                    <Text style={[styles.emptyTitle, isDark && { color: '#334155' }]}>No appointments yet</Text>
                    <Text style={[styles.emptyDesc, isDark && { color: '#475569' }]}>Book a doctor or lawyer to get started</Text>
                </View>
            ) : (
                myAppointments.map(item => {
                    const statusColor = item.status === 'approved' ? '#10B981' : 
                                      item.status === 'finished' ? '#64748b' :
                                      item.status === 'pending' ? '#F59E0B' : '#EF4444';
                    const statusBg = item.status === 'approved' ? (isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5') :
                                    item.status === 'finished' ? (isDark ? 'rgba(100,116,139,0.15)' : '#F1F5F9') :
                                    item.status === 'pending' ? (isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7') :
                                    (isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2');

                    return (
                        <View key={item._id} style={[styles.apptCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                            <View style={styles.apptRow}>
                                <View style={[styles.apptIcon, { backgroundColor: item.type === 'doctor' ? (isDark ? 'rgba(16,185,129,0.12)' : '#ECFDF5') : (isDark ? 'rgba(59,130,246,0.12)' : '#EFF6FF') }]}>
                                    <Ionicons name={item.type === 'doctor' ? 'medkit' : 'briefcase'} size={20}
                                        color={item.type === 'doctor' ? '#10B981' : '#3B82F6'} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.apptName, isDark && { color: '#f1f5f9' }]}>{item.professionalName}</Text>
                                    <Text style={[styles.apptType, isDark && { color: '#94a3b8' }]}>
                                        {item.type === 'doctor' ? 'Doctor' : 'Lawyer'} • {item.date} at {item.time}
                                    </Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                                    <Text style={[styles.statusText, { color: statusColor }]}>
                                        {item.status.toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            <Text style={[styles.apptReason, isDark && { color: '#64748b', borderTopColor: '#334155' }]}>
                                {item.reason}
                            </Text>

                            {item.status === 'approved' && (
                                <TouchableOpacity
                                    style={styles.chatBtn}
                                    onPress={() => handleChatWithProfessional(item.professionalUserId || item.professionalId)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="chatbubble-ellipses" size={16} color="#FFF" />
                                    <Text style={styles.chatBtnText}>Chat with Professional</Text>
                                </TouchableOpacity>
                            )}

                            {item.status === 'finished' && (
                                <View style={[styles.finishedBadge, isDark && { backgroundColor: 'rgba(100,116,139,0.1)' }]}>
                                    <Ionicons name="checkmark-done-circle" size={16} color="#64748b" />
                                    <Text style={styles.finishedText}>This consultation has ended</Text>
                                </View>
                            )}
                        </View>
                    );
                })
            )}
        </View>
    );

    // ─── Apply Form ───────────────────────────────────────────────────────────
    const renderApplyForm = () => (
        <View style={styles.listContainer}>
            {/* Type selector */}
            <View style={[styles.formCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                <Text style={[styles.formCardTitle, isDark && { color: '#f1f5f9' }]}>I am a</Text>
                <View style={styles.priorityRow}>
                    {[{ id: 'doctor', label: 'Doctor', color: '#10B981' }, { id: 'lawyer', label: 'Lawyer', color: '#3B82F6' }].map(t => (
                        <TouchableOpacity
                            key={t.id}
                            onPress={() => setApplyForm({ ...applyForm, type: t.id as 'doctor' | 'lawyer' })}
                            style={[
                                styles.priorityBtn, { flex: 1 },
                                applyForm.type === t.id && { backgroundColor: t.color, borderColor: 'transparent' },
                                isDark && applyForm.type !== t.id && { borderColor: '#334155' }
                            ]}
                        >
                            <Text style={[
                                styles.priorityLabel,
                                applyForm.type === t.id ? { color: '#FFF', fontWeight: '700' } : (isDark ? { color: '#64748b' } : { color: '#6B7280' })
                            ]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={[styles.formCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                <InputField label="Full Name *" placeholder="Dr. / Adv. Your Name" value={applyForm.name}
                    onChangeText={t => setApplyForm({ ...applyForm, name: t })} isDark={isDark} />
                <InputField label="Specialty *" placeholder="e.g. Cardiologist / Criminal Law" value={applyForm.specialty}
                    onChangeText={t => setApplyForm({ ...applyForm, specialty: t })} isDark={isDark} />
                <InputField label="Experience (Years)" placeholder="e.g. 5 years" value={applyForm.experience}
                    onChangeText={t => setApplyForm({ ...applyForm, experience: t })} isDark={isDark} />
                <InputField label="Phone *" placeholder="+8801XXXXXXXXX" value={applyForm.phone}
                    onChangeText={t => setApplyForm({ ...applyForm, phone: t })} isDark={isDark} keyboardType="phone-pad" />
                <InputField label="Location" placeholder="City, District" value={applyForm.location}
                    onChangeText={t => setApplyForm({ ...applyForm, location: t })} isDark={isDark} />

                <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={handleApplyAsProfessional}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? <ActivityIndicator size="small" color="#FFF" /> : (
                        <>
                            <Ionicons name="checkmark-done-circle" size={16} color="#FFF" />
                            <Text style={styles.submitBtnText}>Submit Application</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    // ─── Main Render ──────────────────────────────────────────────────────────
    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={isDark ? '#0f172a' : '#FFFFFF'}
            />

            {/* ── Professional View ── */}
            {isProfessional ? (
                <>
                    {/* Custom header for professional */}
                    <View style={[
                        styles.header,
                        isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' },
                        { paddingTop: insets.top }
                    ]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={22} color={isDark ? '#f1f5f9' : '#1e293b'} />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={[styles.headerTitle, isDark && { color: '#f1f5f9' }]}>My Dashboard</Text>
                            <View style={[styles.livePill, { backgroundColor: isDark ? 'rgba(139,92,246,0.2)' : '#EDE9FE' }]}>
                                <View style={[styles.liveDot, { backgroundColor: '#8B5CF6' }]} />
                                <Text style={[styles.liveText, { color: '#8B5CF6' }]}>Professional</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={fetchDashboardData} style={styles.backBtn}>
                            <Ionicons name="refresh" size={20} color={isDark ? '#8B5CF6' : '#8B5CF6'} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {renderProfessionalDashboard()}
                    </ScrollView>
                </>
            ) : (
                /* ── Normal User View ── */
                <>
                    {renderHeader()}
                    {renderTabs()}

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {renderHero()}
                        {activeTab === 'doctor' && renderProfessionalList()}
                        {activeTab === 'lawyer' && renderProfessionalList()}
                        {activeTab === 'complaint' && renderComplaintForm()}
                        {activeTab === 'appointments' && renderMyAppointments()}
                        {activeTab === 'apply' && renderApplyForm()}

                        {renderBookingModal()}
                    </ScrollView>
                </>
            )}
        </View>
    );
};

// ─── Reusable InputField ──────────────────────────────────────────────────────
const InputField = ({ label, placeholder, value, onChangeText, isDark, multiline, keyboardType }: any) => (
    <View style={{ marginBottom: 14 }}>
        <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>{label}</Text>
        <TextInput
            style={[
                styles.fieldInput,
                multiline && styles.fieldTextarea,
                isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }
            ]}
            placeholder={placeholder}
            placeholderTextColor={isDark ? '#475569' : '#9CA3AF'}
            value={value}
            onChangeText={onChangeText}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            keyboardType={keyboardType}
            textAlignVertical={multiline ? 'top' : 'center'}
        />
    </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    // Professional Banner
    profBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginHorizontal: 16, marginTop: 12, marginBottom: 2,
        padding: 14, borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1, borderColor: '#EDE9FE',
        shadowColor: '#8B5CF6', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    profBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    profBannerIcon: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center',
    },
    profBannerTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
    profBannerSub: { fontSize: 12, color: '#64748b', marginTop: 2 },

    // Dashboard Back Button
    dashboardBack: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: 16, marginTop: 12, marginBottom: 2,
        padding: 12, borderRadius: 12,
        backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#EDE9FE',
    },
    dashboardBackText: { fontSize: 14, fontWeight: '600', color: '#8B5CF6' },

    // Dashboard Header
    dashboardHeader: {
        margin: 16, padding: 18, borderRadius: 16,
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE9FE',
        shadowColor: '#8B5CF6', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    },
    dashboardBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#8B5CF6', alignSelf: 'flex-start',
        paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 10,
    },
    dashboardBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    dashboardName: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
    dashboardSpec: { fontSize: 13, color: '#64748b', marginTop: 3 },

    // Stats
    statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
    statCard: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, borderRadius: 14,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
        gap: 4,
    },
    statValue: { fontSize: 22, fontWeight: '800' },
    statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },

    // Filter
    filterScroll: { marginBottom: 4 },
    filterRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
    filterBtn: {
        paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
        borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: 'transparent',
    },
    filterBtnActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
    filterBtnText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
    filterBtnTextActive: { color: '#FFF' },

    // Action Buttons
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    actionBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
    },
    actionBtnText: { fontSize: 13, fontWeight: '700' },

    // Finished Status
    finishedBadge: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 12, borderRadius: 12,
        backgroundColor: '#F8FAFC', marginTop: 12,
        borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed',
    },
    finishedText: { fontSize: 13, fontWeight: '600', color: '#64748b' },

    // Picker Trigger
    pickerTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 12,
    },
    pickerValue: {
        fontSize: 15,
        color: '#1e293b',
    },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerCenter: { alignItems: 'center', gap: 4 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', letterSpacing: -0.3 },
    livePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    liveText: { fontSize: 11, fontWeight: '600', color: '#065F46' },

    // Tab Bar
    tabWrapper: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tabScroll: { paddingHorizontal: 8, paddingVertical: 0 },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 13,
        borderBottomWidth: 2.5, borderBottomColor: 'transparent',
        marginHorizontal: 2,
    },
    tabLabel: { fontSize: 13, fontWeight: '500', letterSpacing: -0.1 },

    // Hero
    heroBanner: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20, paddingVertical: 18,
        marginBottom: 4,
    },
    heroIconWrap: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    heroTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.4 },
    heroSub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

    // List Container
    listContainer: { padding: 16, gap: 12 },

    // Professional Card
    profCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16,
        borderWidth: 1, borderColor: '#F1F5F9',
        overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    profCardStrip: { height: 4, width: '100%' },
    profCardBody: { padding: 16 },
    profRow: { flexDirection: 'row', alignItems: 'flex-start' },
    avatar: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    profName: { fontSize: 15, fontWeight: '700', color: '#0f172a', letterSpacing: -0.2 },
    profSpecialty: { fontSize: 13, color: '#64748b', marginTop: 2 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 },
    infoText: { fontSize: 11, color: '#9CA3AF' },
    dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB' },
    availBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20,
    },
    greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    availText: { fontSize: 11, fontWeight: '700', color: '#059669' },
    profFooter: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9',
    },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    ratingNum: { fontSize: 13, fontWeight: '600', color: '#374151', marginLeft: 4 },
    bookBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
    },
    bookBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

    // Booking Modal
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        paddingHorizontal: 18,
        zIndex: 999,
    },
    modalBox: {
        backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25, shadowRadius: 20, elevation: 12,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
    modalSub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
    modalCancelBtn: {
        flex: 1, paddingVertical: 13, borderRadius: 12,
        borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center',
    },
    modalCancelText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    modalConfirmBtn: {
        flex: 1.5, flexDirection: 'row', paddingVertical: 13, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

    // Form Shared
    formCard: {
        backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18,
        borderWidth: 1, borderColor: '#F1F5F9',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    formCardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 14, letterSpacing: -0.2 },
    fieldGroup: { marginBottom: 14 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    fieldInput: {
        backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
        fontSize: 14, color: '#0f172a',
    },
    fieldTextarea: { height: 90, textAlignVertical: 'top' },

    // Priority Buttons
    priorityRow: { flexDirection: 'row', gap: 8 },
    priorityBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 10,
        borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center',
    },
    priorityLabel: { fontSize: 13, fontWeight: '600' },

    // Submit Button
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 15, borderRadius: 12, marginTop: 6,
    },
    submitBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

    // Appointments
    apptCard: {
        backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    apptRow: { flexDirection: 'row', alignItems: 'center' },
    apptIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    apptName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
    apptType: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    apptReason: {
        fontSize: 13, color: '#64748b', marginTop: 12,
        paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9',
    },
    chatBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: '#8B5CF6', paddingVertical: 11,
        borderRadius: 10, marginTop: 12,
    },
    chatBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

    // Empty State
    emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#CBD5E1', marginTop: 14 },
    emptyDesc: { fontSize: 13, color: '#94a3b8', marginTop: 6 },

    // Loader
    centeredLoader: { alignItems: 'center', paddingVertical: 60, gap: 12 },
    loadingText: { fontSize: 14, color: '#94a3b8' },

    scrollContent: { paddingBottom: 50 },
});

export default SocialResponseScreen;