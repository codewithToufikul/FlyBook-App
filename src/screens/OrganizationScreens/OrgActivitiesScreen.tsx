import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StatusBar,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getOrgActivities, OrgActivity } from '../../services/orgService';

const OrgActivities = ({ route, navigation }: any) => {
    const { orgId } = route.params;
    const insets = useSafeAreaInsets();
    const [activities, setActivities] = useState<OrgActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchActivities = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getOrgActivities(orgId);
            setActivities(data);
        } catch (error) {
            console.error('Failed to load activities:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [orgId]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchActivities();
    }, [fetchActivities]);

    const renderActivityItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.activityCard}
            onPress={() => navigation.navigate('ActivityDetails', { activityId: item._id })}
        >
            <Image
                source={{ uri: item.image || 'https://via.placeholder.com/400x200' }}
                style={styles.activityImage}
            />
            <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activityDate}>
                    {item.date || new Date(item.createdAt).toLocaleDateString()}
                    {item.place ? ` • ${item.place}` : ''}
                </Text>
                <Text style={styles.activityDetails} numberOfLines={3}>
                    {item.details || item.content}
                </Text>
                <View style={styles.cardFooter}>
                    <Text style={styles.readMore}>View Details</Text>
                    <Ionicons name="arrow-forward" size={16} color="#6366F1" />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Organization Activities</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddActivity', { orgId })}
                    style={styles.addButton}
                >
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerLoader}>
                    <ActivityIndicator size="large" color="#6366F1" />
                </View>
            ) : (
                <FlatList
                    data={activities}
                    renderItem={renderActivityItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="newspaper-outline" size={80} color="#D1D5DB" />
                            <Text style={styles.emptyTitle}>No Activities Yet</Text>
                            <Text style={styles.emptySubtitle}>
                                This organization hasn't posted any activities or events yet.
                            </Text>
                            <TouchableOpacity
                                style={styles.createBtn}
                                onPress={() => navigation.navigate('AddActivity', { orgId })}
                            >
                                <Text style={styles.createBtnText}>Post First Activity</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
};

export default OrgActivities;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    activityCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    activityImage: {
        width: '100%',
        height: 180,
    },
    activityInfo: {
        padding: 16,
    },
    activityTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    activityDate: {
        fontSize: 13,
        color: '#6366F1',
        fontWeight: '600',
        marginBottom: 10,
    },
    activityDetails: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
    },
    readMore: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6366F1',
    },
    centerLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#374151',
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    createBtn: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
    },
    createBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
