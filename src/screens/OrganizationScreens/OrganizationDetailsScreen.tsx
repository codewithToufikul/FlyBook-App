import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    Linking,
    StatusBar,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import { getOrganizationById, Organization } from '../../services/orgService';

const { width } = Dimensions.get('window');

const OrganizationDetails = ({ route, navigation }: any) => {
    const { orgId } = route.params;
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<{ [key: number]: boolean }>({});

    useEffect(() => {
        fetchDetails();
    }, [orgId]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const data = await getOrganizationById(orgId);
            setOrganization(data);
        } catch (err) {
            setError('Failed to load organization details');
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (index: number) => {
        setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleOpenLink = (url?: string) => {
        if (url) {
            Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
        }
    };

    if (loading) {
        return (
            <View style={[styles.centerLoader, isDark && { backgroundColor: '#0f172a' }]}>
                <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#6366F1"} />
            </View>
        );
    }

    if (!organization) {
        return (
            <View style={[styles.centerLoader, isDark && { backgroundColor: '#0f172a' }]}>
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text style={[styles.errorText, isDark && { color: '#f8fafc' }]}>Organization not found</Text>
                <TouchableOpacity
                    style={[styles.backButton, isDark && { backgroundColor: '#14b8a6' }]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Header */}
                <View style={styles.heroHeader}>
                    <LinearGradient
                        colors={isDark ? ['#1e293b', '#0f172a'] : ['#6366F1', '#8B5CF6']}
                        style={styles.heroGradient}
                    />
                    <View style={[styles.headerNav, { paddingTop: insets.top + 10 }]}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.headerIconBtn}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerIconBtn}>
                            <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.heroContent}>
                        <View style={[styles.profileImageContainer, isDark && { borderColor: '#1e293b' }]}>
                            <Image
                                source={{ uri: organization.profileImage || 'https://via.placeholder.com/128' }}
                                style={styles.profileImage}
                            />
                        </View>
                        <Text style={styles.orgName}>{organization.orgName}</Text>
                        <Text style={[styles.orgTypeBadge, isDark && { backgroundColor: 'rgba(20, 184, 166, 0.2)', color: '#14b8a6' }]}>{organization.orgType}</Text>
                    </View>
                </View>

                {/* Info Card */}
                <View style={styles.contentPadding}>
                    <View style={[styles.infoCard, isDark && { backgroundColor: '#1e293b' }]}>
                        <Text style={[styles.sectionTitle, isDark && { color: '#f8fafc' }]}>About Organization</Text>
                        <Text style={[styles.descriptionText, isDark && { color: '#94a3b8' }]}>{organization.description}</Text>

                        <View style={[styles.divider, isDark && { backgroundColor: '#334155' }]} />

                        <View style={styles.contactContainer}>
                            <View style={styles.contactItem}>
                                <View style={[styles.contactIcon, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : '#EEF2FF' }]}>
                                    <Ionicons name="mail" size={18} color="#6366F1" />
                                </View>
                                <View>
                                    <Text style={[styles.contactLabel, isDark && { color: '#64748b' }]}>Email</Text>
                                    <Text style={[styles.contactValue, isDark && { color: '#94a3b8' }]}>{organization.email}</Text>
                                </View>
                            </View>

                            <View style={styles.contactItem}>
                                <View style={[styles.contactIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }]}>
                                    <Ionicons name="call" size={18} color="#10B981" />
                                </View>
                                <View>
                                    <Text style={[styles.contactLabel, isDark && { color: '#64748b' }]}>Phone</Text>
                                    <Text style={[styles.contactValue, isDark && { color: '#94a3b8' }]}>{organization.phone}</Text>
                                </View>
                            </View>

                            {organization.website && (
                                <TouchableOpacity
                                    style={styles.contactItem}
                                    onPress={() => handleOpenLink(organization.website)}
                                >
                                    <View style={[styles.contactIcon, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : '#F5F3FF' }]}>
                                        <Ionicons name="globe" size={18} color="#8B5CF6" />
                                    </View>
                                    <View>
                                        <Text style={[styles.contactLabel, isDark && { color: '#64748b' }]}>Website</Text>
                                        <Text style={[styles.contactValue, { color: isDark ? '#14b8a6' : '#6366F1' }]}>Visit Website</Text>
                                    </View>
                                </TouchableOpacity>
                            )}

                            <View style={styles.contactItem}>
                                <View style={[styles.contactIcon, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.1)' : '#FFF7ED' }]}>
                                    <Ionicons name="location" size={18} color="#F97316" />
                                </View>
                                <View>
                                    <Text style={[styles.contactLabel, isDark && { color: '#64748b' }]}>Address</Text>
                                    <Text style={[styles.contactValue, isDark && { color: '#94a3b8' }]}>{organization.address}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Quick Action */}
                    <TouchableOpacity
                        style={[styles.activitiesBtn, isDark && { backgroundColor: '#14b8a6', shadowColor: '#14b8a6' }]}
                        onPress={() => navigation.navigate('OrgActivities', { orgId: organization._id })}
                    >
                        <Ionicons name="newspaper-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.activitiesBtnText}>View All Activities</Text>
                    </TouchableOpacity>

                    {/* Dynamic Sections */}
                    {organization.sections?.map((section, index) => (
                        <View key={index} style={[styles.sectionCard, isDark && { backgroundColor: '#1e293b' }]}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={[styles.titleIndicator, isDark && { backgroundColor: '#14b8a6' }]} />
                                <Text style={[styles.sectionCardTitle, isDark && { color: '#f8fafc' }]}>{section.title}</Text>
                            </View>

                            <Text style={[styles.sectionDetails, isDark && { color: '#94a3b8' }]}>
                                {expandedSections[index]
                                    ? section.details
                                    : section.details.length > 200
                                        ? `${section.details.substring(0, 200)}...`
                                        : section.details}
                            </Text>

                            {section.details.length > 200 && (
                                <TouchableOpacity onPress={() => toggleSection(index)}>
                                    <Text style={[styles.seeMoreBtn, isDark && { color: '#14b8a6' }]}>
                                        {expandedSections[index] ? 'See Less' : 'See More'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {section.image && (
                                <Image
                                    source={{ uri: section.image }}
                                    style={styles.sectionMediaImage}
                                    resizeMode="cover"
                                />
                            )}

                            {section.video && (
                                <View style={styles.videoContainer}>
                                    <Video
                                        source={{ uri: section.video }}
                                        style={styles.videoStyle}
                                        controls={true}
                                        paused={true}
                                        resizeMode="cover"
                                    />
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

export default OrganizationDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    centerLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
        color: '#1F2937',
        fontWeight: '700',
        marginTop: 16,
    },
    backButton: {
        marginTop: 20,
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    heroHeader: {
        height: 340,
        position: 'relative',
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    headerNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 10,
    },
    headerIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroContent: {
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 30,
    },
    profileImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    orgName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 16,
        textAlign: 'center',
    },
    orgTypeBadge: {
        marginTop: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    contentPadding: {
        paddingHorizontal: 20,
        marginTop: -30,
        paddingBottom: 40,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 20,
    },
    contactContainer: {
        gap: 16,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    contactIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    contactValue: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    activitiesBtn: {
        backgroundColor: '#6366F1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 16,
        marginTop: 20,
        gap: 8,
        elevation: 4,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    activitiesBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginTop: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    titleIndicator: {
        width: 4,
        height: 20,
        backgroundColor: '#6366F1',
        borderRadius: 2,
    },
    sectionCardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    sectionDetails: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
    },
    seeMoreBtn: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '700',
        marginTop: 8,
    },
    sectionMediaImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginTop: 15,
        backgroundColor: '#F3F4F6',
    },
    videoContainer: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginTop: 15,
        overflow: 'hidden',
        backgroundColor: '#000000',
    },
    videoStyle: {
        width: '100%',
        height: '100%',
    },
});
