import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Alert,
    Image,
    Modal,
    ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

interface Scholarship {
    id: string;
    title: string;
    orgName: string;
    logo: string;
    amount: string;
    deadline: string;
    eligibility: string;
    description: string;
    category: 'Merit' | 'Need-based' | 'General' | 'Science & Tech';
}

const mockScholarships: Scholarship[] = [
    {
        id: '1',
        title: 'FlyBook Academic Merit Scholarship',
        orgName: 'FlyBook Bangladesh',
        logo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=120&q=80',
        amount: 'BDT 20,000 / Semester',
        deadline: '2026-06-30',
        eligibility: 'GPA 5.00 in HSC / GPA 3.80 in Graduation',
        description: 'Awarded to students with exceptional academic achievements. Covers semester tuition fees and provides a learning materials stipend.',
        category: 'Merit',
    },
    {
        id: '2',
        title: 'Green Future Environment Grant',
        orgName: 'Save The Future Foundation',
        logo: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=120&q=80',
        amount: 'BDT 15,000 (One-time)',
        deadline: '2026-07-15',
        eligibility: 'Active community volunteers & climate activists',
        description: 'Supports student climate projects and community development work. Promotes youth environmental leadership in Bangladesh.',
        category: 'Need-based',
    },
    {
        id: '3',
        title: 'STEM Women Initiative Scholarship',
        orgName: 'Tech Bangladesh Network',
        logo: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=120&q=80',
        amount: 'BDT 30,000 / Year',
        deadline: '2026-08-01',
        eligibility: 'Female students enrolled in CSE / EEE / STEM majors',
        description: 'Aimed at bridging the gender gap in technology fields. Includes mentorship programs, internship opportunities, and coding bootcamps.',
        category: 'Science & Tech',
    },
    {
        id: '4',
        title: 'Freedom Fighters Family Trust',
        orgName: 'Muktijoddha Kalyan Sangstha',
        logo: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=120&q=80',
        amount: 'BDT 10,000 / Semester',
        deadline: '2026-06-15',
        eligibility: 'Children / grandchildren of freedom fighters',
        description: 'Financial aid program supporting descendants of national heroes to pursue higher education in recognized public/private institutions.',
        category: 'General',
    },
];

const ScholarshipsListScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const categories = ['All', 'Merit', 'Need-based', 'Science & Tech', 'General'];

    const filteredScholarships = mockScholarships.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.orgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.eligibility.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const handleApply = (scholarship: Scholarship) => {
        Alert.alert(
            'Confirm Application',
            `Are you sure you want to apply for the "${scholarship.title}"? Your profile information will be shared with the organization.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Apply Now',
                    onPress: () => {
                        Alert.alert(
                            'Application Submitted! 🎉',
                            'Your application has been received. The host organization will contact you if you match their criteria.'
                        );
                        setModalVisible(false);
                    }
                }
            ]
        );
    };

    const renderCard = ({ item }: { item: Scholarship }) => (
        <TouchableOpacity
            style={[styles.card, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}
            onPress={() => {
                setSelectedScholarship(item);
                setModalVisible(true);
            }}
        >
            <View style={styles.cardHeader}>
                <Image source={{ uri: item.logo }} style={styles.orgLogo} />
                <View style={styles.headerInfo}>
                    <Text style={[styles.orgName, isDark && { color: '#14b8a6' }]}>{item.orgName}</Text>
                    <Text style={[styles.title, isDark && { color: '#f8fafc' }]} numberOfLines={2}>{item.title}</Text>
                </View>
            </View>

            <View style={[styles.divider, isDark && { backgroundColor: '#334155' }]} />

            <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={16} color="#14b8a6" />
                    <Text style={[styles.detailText, isDark && { color: '#cbd5e1' }]}>
                        <Text style={styles.boldText}>Amount: </Text>{item.amount}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#ef4444" />
                    <Text style={[styles.detailText, isDark && { color: '#cbd5e1' }]}>
                        <Text style={styles.boldText}>Deadline: </Text>{item.deadline}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="school-outline" size={16} color="#6366F1" />
                    <Text style={[styles.detailText, isDark && { color: '#94a3b8' }]} numberOfLines={1}>
                        <Text style={styles.boldText}>Eligibility: </Text>{item.eligibility}
                    </Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={[styles.categoryBadge, isDark && { backgroundColor: 'rgba(20,184,166,0.1)' }]}>
                    <Text style={[styles.categoryText, isDark && { color: '#14b8a6' }]}>{item.category}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.applyBtn, isDark && { backgroundColor: '#14b8a6' }]}
                    onPress={() => handleApply(item)}
                >
                    <Text style={styles.applyBtnText}>Apply</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }, { paddingTop: insets.top }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFFFFF"} />

            {/* Header */}
            <View style={[styles.header, isDark && { borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#1F2937"} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerSubtitle, isDark && { color: '#14b8a6' }]}>Empower Your Education</Text>
                    <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Scholarships</Text>
                </View>
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, isDark && { borderBottomColor: '#1e293b' }]}>
                <View style={[styles.searchWrapper, isDark && { backgroundColor: '#1e293b' }]}>
                    <Ionicons name="search" size={20} color={isDark ? "#475569" : "#9CA3AF"} />
                    <TextInput
                        style={[styles.searchInput, isDark && { color: '#f8fafc' }]}
                        placeholder="Search for scholarships..."
                        placeholderTextColor={isDark ? "#475569" : "#9CA3AF"}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Category Filter */}
            <View style={styles.categoryScrollContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryTab,
                                selectedCategory === cat && styles.activeCategoryTab,
                                isDark && styles.categoryTabDark,
                                isDark && selectedCategory === cat && styles.activeCategoryTabDark
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text
                                style={[
                                    styles.categoryTabText,
                                    selectedCategory === cat && styles.activeCategoryTabText,
                                    isDark && { color: '#94a3b8' },
                                    isDark && selectedCategory === cat && { color: '#14b8a6' }
                                ]}
                            >
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Listing */}
            <FlatList
                data={filteredScholarships}
                renderItem={renderCard}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="school-outline" size={80} color={isDark ? "#1e293b" : "#D1D5DB"} />
                        <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>No Scholarships Found</Text>
                        <Text style={[styles.emptySubtitle, isDark && { color: '#64748b' }]}>There are no scholarship listings matching your criteria at the moment.</Text>
                    </View>
                }
            />

            {/* Detail Modal */}
            {selectedScholarship && (
                <Modal
                    visible={modalVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, isDark && { backgroundColor: '#1e293b' }]}>
                            <View style={styles.modalHeader}>
                                <Image source={{ uri: selectedScholarship.logo }} style={styles.modalOrgLogo} />
                                <View style={styles.modalHeaderText}>
                                    <Text style={[styles.modalOrgName, isDark && { color: '#14b8a6' }]}>{selectedScholarship.orgName}</Text>
                                    <Text style={[styles.modalTitle, isDark && { color: '#f8fafc' }]}>{selectedScholarship.title}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                    <Ionicons name="close" size={24} color={isDark ? "#cbd5e1" : "#1F2937"} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                                <Text style={[styles.modalSectionHeader, isDark && { color: '#f8fafc' }]}>About Scholarship</Text>
                                <Text style={[styles.modalDescription, isDark && { color: '#cbd5e1' }]}>{selectedScholarship.description}</Text>

                                <View style={[styles.modalInfoCard, isDark && { backgroundColor: '#0f172a', borderColor: '#334155' }]}>
                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="cash-outline" size={20} color="#14b8a6" />
                                        <View style={styles.modalInfoCol}>
                                            <Text style={[styles.modalInfoLabel, isDark && { color: '#64748b' }]}>Award Amount</Text>
                                            <Text style={[styles.modalInfoVal, isDark && { color: '#cbd5e1' }]}>{selectedScholarship.amount}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="calendar-outline" size={20} color="#ef4444" />
                                        <View style={styles.modalInfoCol}>
                                            <Text style={[styles.modalInfoLabel, isDark && { color: '#64748b' }]}>Application Deadline</Text>
                                            <Text style={[styles.modalInfoVal, isDark && { color: '#cbd5e1' }]}>{selectedScholarship.deadline}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.modalInfoRow}>
                                        <Ionicons name="school-outline" size={20} color="#6366F1" />
                                        <View style={styles.modalInfoCol}>
                                            <Text style={[styles.modalInfoLabel, isDark && { color: '#64748b' }]}>Academic Eligibility</Text>
                                            <Text style={[styles.modalInfoVal, isDark && { color: '#cbd5e1' }]}>{selectedScholarship.eligibility}</Text>
                                        </View>
                                    </View>
                                </View>
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={[styles.modalApplyBtn, isDark && { backgroundColor: '#14b8a6' }]}
                                    onPress={() => handleApply(selectedScholarship)}
                                >
                                    <Text style={styles.modalApplyText}>Submit Application</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    backBtn: { marginRight: 15 },
    headerTitleContainer: { flex: 1 },
    headerSubtitle: { fontSize: 12, fontWeight: '700', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 1 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
    searchContainer: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 15, height: 46 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1F2937' },
    categoryScrollContainer: { paddingVertical: 12, paddingHorizontal: 20 },
    categoryScroll: { gap: 8 },
    categoryTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
    categoryTabDark: { backgroundColor: '#1e293b' },
    activeCategoryTab: { backgroundColor: '#EEF2FF', borderColor: '#6366F1' },
    activeCategoryTabDark: { backgroundColor: 'rgba(20, 184, 166, 0.1)', borderColor: '#14b8a6' },
    categoryTabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    activeCategoryTabText: { color: '#6366F1' },
    listContainer: { padding: 20 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 20, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', gap: 12 },
    orgLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6' },
    headerInfo: { flex: 1 },
    orgName: { fontSize: 12, fontWeight: '700', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 0.5 },
    title: { fontSize: 16, fontWeight: '800', color: '#1F2937', marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
    cardDetails: { gap: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { fontSize: 13, color: '#4B5563' },
    boldText: { fontWeight: '700' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
    categoryBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    categoryText: { fontSize: 11, fontWeight: '700', color: '#6366F1' },
    applyBtn: { backgroundColor: '#6366F1', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 4 },
    applyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 20 },
    emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 20 },
    modalOrgLogo: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#F3F4F6' },
    modalHeaderText: { flex: 1 },
    modalOrgName: { fontSize: 13, fontWeight: '700', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 0.5 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginTop: 2 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    modalBody: { marginBottom: 20 },
    modalSectionHeader: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
    modalDescription: { fontSize: 14, color: '#4B5563', lineHeight: 22, marginBottom: 20 },
    modalInfoCard: { padding: 16, borderRadius: 20, backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', borderWidth: 1, gap: 16 },
    modalInfoRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    modalInfoCol: { flex: 1 },
    modalInfoLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
    modalInfoVal: { fontSize: 14, color: '#374151', fontWeight: '700' },
    modalFooter: { borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 15 },
    modalApplyBtn: { backgroundColor: '#6366F1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, gap: 8 },
    modalApplyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default ScholarshipsListScreen;
