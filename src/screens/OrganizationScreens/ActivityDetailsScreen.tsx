import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getActivityDetails } from '../../services/orgService';

const { width } = Dimensions.get('window');

const ActivityDetails = ({ route, navigation }: any) => {
    const { activityId } = route.params;
    const insets = useSafeAreaInsets();
    const [activity, setActivity] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, [activityId]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const data = await getActivityDetails(activityId);
            setActivity(data);
        } catch (error) {
            console.error('Error fetching activity details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerLoader}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    if (!activity) {
        return (
            <View style={styles.centerLoader}>
                <Text style={styles.errorText}>Activity details not found.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Banner */}
                <View style={styles.heroContainer}>
                    <Image
                        source={{ uri: activity.image || 'https://via.placeholder.com/800x400' }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                    <View style={[styles.headerActions, { top: insets.top + 10 }]}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.iconCircle}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconCircle}>
                            <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.title}>{activity.title}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={18} color="#6366F1" />
                            <Text style={styles.metaText}>
                                {new Date(activity.date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={18} color="#EF4444" />
                            <Text style={styles.metaText}>{activity.place || 'TBD'}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionHeader}>About this Activity</Text>
                    <Text style={styles.detailsText}>{activity.details}</Text>

                    {/* Organization Banner */}
                    <TouchableOpacity
                        style={styles.orgCard}
                        onPress={() => navigation.navigate('OrganizationDetails', { orgId: activity.organizationId })}
                    >
                        <View style={styles.orgInfo}>
                            <Text style={styles.organizedBy}>ORGANIZED BY</Text>
                            <Text style={styles.orgName}>View organization profile</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

export default ActivityDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centerLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroContainer: {
        height: 300,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    headerActions: {
        position: 'absolute',
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        marginTop: -30,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        lineHeight: 36,
        marginBottom: 20,
    },
    metaRow: {
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    metaText: {
        fontSize: 15,
        color: '#4B5563',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 24,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    detailsText: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 26,
    },
    orgCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 16,
        marginTop: 32,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    orgInfo: {
        flex: 1,
    },
    organizedBy: {
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 1,
    },
    orgName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 4,
    },
    errorText: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 20,
    },
    backBtn: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
