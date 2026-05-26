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
    Alert,
    RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { getPendingEventTransfers, approveEventTransfer, rejectEventTransfer } from '../../services/orgService';

const EventTransferApprovalsScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getPendingEventTransfers();
            setRequests(data);
        } catch (error) {
            console.error('Failed to load pending transfers:', error);
            Alert.alert('Error', 'Failed to retrieve transfer requests.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRequests();
    }, [fetchRequests]);

    const handleApprove = (item: any) => {
        Alert.alert(
            'Approve Event',
            `Are you sure you want to approve "${item.title}"? It will be shown in the general Events list.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            const res = await approveEventTransfer(item._id);
                            if (res.success) {
                                Alert.alert('Approved', 'The event has been approved successfully!');
                                fetchRequests();
                            } else {
                                Alert.alert('Error', res.message || 'Failed to approve event.');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'An error occurred.');
                        }
                    }
                }
            ]
        );
    };

    const handleReject = (item: any) => {
        Alert.alert(
            'Reject Event',
            `Are you sure you want to reject "${item.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await rejectEventTransfer(item._id);
                            if (res.success) {
                                Alert.alert('Rejected', 'The event transfer request was rejected.');
                                fetchRequests();
                            } else {
                                Alert.alert('Error', res.message || 'Failed to reject event.');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'An error occurred.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
            <View style={styles.cardHeader}>
                <Image source={{ uri: item.orgImage || 'https://via.placeholder.com/40x40' }} style={styles.orgAvatar} />
                <View style={styles.orgInfo}>
                    <Text style={[styles.orgName, isDark && { color: '#f8fafc' }]}>{item.orgName}</Text>
                    <Text style={[styles.reqDate, isDark && { color: '#64748b' }]}>
                        Requested on {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            {item.image && (
                <Image source={{ uri: item.image }} style={styles.eventImage} resizeMode="cover" />
            )}

            <View style={styles.cardBody}>
                <Text style={[styles.title, isDark && { color: '#f8fafc' }]}>{item.title}</Text>
                <Text style={[styles.details, isDark && { color: '#94a3b8' }]} numberOfLines={3}>{item.details}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={14} color="#6366F1" />
                        <Text style={[styles.metaText, isDark && { color: '#cbd5e1' }]}>{item.place}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color="#6366F1" />
                        <Text style={[styles.metaText, isDark && { color: '#cbd5e1' }]}>{item.date}</Text>
                    </View>
                </View>
            </View>

            <View style={[styles.cardActions, isDark && { borderTopColor: '#334155' }]}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleReject(item)}
                >
                    <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApprove(item)}
                >
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }, { paddingTop: insets.top }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFFFFF"} />

            <View style={[styles.header, isDark && { borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#1F2937"} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerSubtitle, isDark && { color: '#14b8a6' }]}>Admin Dashboard</Text>
                    <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Event Transfer Requests</Text>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#6366F1"} />
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#14b8a6" : "#6366F1"} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="checkmark-done-circle-outline" size={80} color={isDark ? "#1e293b" : "#D1D5DB"} />
                            <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>All Caught Up!</Text>
                            <Text style={[styles.emptySubtitle, isDark && { color: '#64748b' }]}>There are no pending event transfer requests to review.</Text>
                        </View>
                    }
                />
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
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 20 },
    card: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    orgAvatar: { width: 36, height: 36, borderRadius: 18 },
    orgInfo: { flex: 1 },
    orgName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
    reqDate: { fontSize: 12, color: '#9CA3AF' },
    eventImage: { width: '100%', height: 160 },
    cardBody: { padding: 16 },
    title: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
    details: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
    metaRow: { flexDirection: 'row', gap: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
    cardActions: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#F3F4F6', padding: 12, gap: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
    rejectBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2' },
    rejectBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
    approveBtn: { backgroundColor: '#10B981' },
    approveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    empty: { alignItems: 'center', marginTop: 120, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#374151', marginTop: 20 },
    emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 },
});

export default EventTransferApprovalsScreen;
