import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get, post } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import TobNav from '../../components/TobNav';

interface User {
    _id: string;
    name: string;
    profileImage: string;
    isOnline?: boolean;
}

type TabType = 'home' | 'friendRequests' | 'sentRequests' | 'allFriends';

const Peoples = ({ navigation }: any) => {
    const { user, refreshUser } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabType>('home');
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Fetch Peoples (Suggestions)
    const { data: peoples = [], isLoading: loadingPeoples, refetch: refetchPeoples } = useQuery({
        queryKey: ['peoples'],
        queryFn: () => get<User[]>('/peoples'),
        enabled: activeTab === 'home',
    });

    // Fetch Friend Requests
    const { data: reqFriends = [], isLoading: loadingReq, refetch: refetchReq } = useQuery({
        queryKey: ['friend-requests-received'],
        queryFn: () => get<User[]>('/friend-request/received'),
        enabled: activeTab === 'friendRequests',
    });

    // Fetch Sent Requests
    const { data: sentReq = [], isLoading: loadingSent, refetch: refetchSent } = useQuery({
        queryKey: ['friend-requests-sent'],
        queryFn: () => get<User[]>('/friend-request/sended'),
        enabled: activeTab === 'sentRequests',
    });

    // Fetch All Friends
    const { data: allFriends = [], isLoading: loadingFriends, refetch: refetchFriends } = useQuery({
        queryKey: ['all-friends'],
        queryFn: () => get<User[]>('/all-friends'),
        enabled: activeTab === 'allFriends',
    });

    const onRefresh = async () => {
        setRefreshing(true);
        if (activeTab === 'home') await refetchPeoples();
        if (activeTab === 'friendRequests') await refetchReq();
        if (activeTab === 'sentRequests') await refetchSent();
        if (activeTab === 'allFriends') await refetchFriends();
        await refreshUser(); // Refresh user context to update friend lists
        setRefreshing(false);
    };

    // --- Actions ---

    const sendRequestMutation = useMutation({
        mutationFn: (recipientId: string) => post('/friend-request/send', { recipientId }),
        onSuccess: () => {
            refreshUser();
            refetchPeoples();
            refetchSent();
        },
        onError: (err) => console.log('Error sending request', err),
        onSettled: () => setProcessingId(null),
    });

    const acceptRequestMutation = useMutation({
        mutationFn: (acceptId: string) => post('/friend-request/accept', { acceptId }),
        onSuccess: () => {
            refreshUser();
            refetchReq();
            refetchFriends();
        },
        onError: (err) => console.log('Error accepting request', err),
        onSettled: () => setProcessingId(null),
    });

    const rejectRequestMutation = useMutation({
        mutationFn: (senderId: string) => post('/friend-request/reject', { senderId }),
        onSuccess: () => {
            refreshUser();
            refetchReq();
        },
        onError: (err) => console.log('Error rejecting request', err),
        onSettled: () => setProcessingId(null),
    });

    const cancelRequestMutation = useMutation({
        mutationFn: (recipientId: string) => post('/friend-request/cancel', { recipientId }),
        onSuccess: () => {
            refreshUser();
            refetchSent();
            refetchPeoples();
        },
        onError: (err) => console.log('Error cancelling request', err),
        onSettled: () => setProcessingId(null),
    });

    const unfriendMutation = useMutation({
        mutationFn: (friendId: string) => post('/friend-request/unfriend', { friendId }),
        onSuccess: () => {
            refreshUser();
            refetchFriends();
            refetchPeoples();
        },
        onError: (err) => console.log('Error unfriending', err),
        onSettled: () => setProcessingId(null),
    });

    const handleAction = (action: () => void, id: string) => {
        setProcessingId(id);
        action();
    };

    const handleUnfriend = (id: string, name: string) => {
        Alert.alert(
            'Unfriend',
            `Are you sure you want to unfriend ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unfriend',
                    style: 'destructive',
                    onPress: () => handleAction(() => unfriendMutation.mutate(id), id)
                },
            ]
        );
    };

    const renderUserItem = ({ item }: { item: User }) => {
        const isProcessing = processingId === item._id;
        let actionButtons;

        if (activeTab === 'home') {
            const isFriend = user?.friends?.includes(item._id);
            const isSent = user?.friendRequestsSent?.includes(item._id);
            const isReceived = user?.friendRequestsReceived?.includes(item._id);

            if (isFriend) {
                actionButtons = (
                    <TouchableOpacity style={styles.btnGray} disabled>
                        <Text style={styles.btnTextGray}>Friend</Text>
                    </TouchableOpacity>
                );
            } else if (isSent) {
                actionButtons = (
                    <TouchableOpacity
                        style={[styles.btnYellow, isProcessing && { opacity: 0.6 }]}
                        onPress={() => handleAction(() => cancelRequestMutation.mutate(item._id), item._id)}
                        disabled={isProcessing}
                    >
                        <Text style={styles.btnTextYellow}>
                            {isProcessing ? 'Processing...' : 'Cancel Request'}
                        </Text>
                    </TouchableOpacity>
                );
            } else if (isReceived) {
                actionButtons = (
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={[styles.btnBlue, { flex: 1, marginRight: 5 }, isProcessing && { opacity: 0.6 }]}
                            onPress={() => handleAction(() => acceptRequestMutation.mutate(item._id), item._id)}
                            disabled={isProcessing}
                        >
                            <Text style={styles.btnTextBlue}>
                                {isProcessing ? '...' : 'Accept'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btnRed, { flex: 1, marginLeft: 5 }, isProcessing && { opacity: 0.6 }]}
                            onPress={() => handleAction(() => rejectRequestMutation.mutate(item._id), item._id)}
                            disabled={isProcessing}
                        >
                            <Text style={styles.btnTextRed}>
                                {isProcessing ? '...' : 'Remove'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            } else {
                actionButtons = (
                    <TouchableOpacity
                        style={[styles.btnGreen, isProcessing && { opacity: 0.6 }]}
                        onPress={() => handleAction(() => sendRequestMutation.mutate(item._id), item._id)}
                        disabled={isProcessing}
                    >
                        <Text style={styles.btnTextGreen}>
                            {isProcessing ? 'Sending...' : 'Add Friend'}
                        </Text>
                    </TouchableOpacity>
                );
            }
        } else if (activeTab === 'friendRequests') {
            actionButtons = (
                <View style={styles.row}>
                    <TouchableOpacity
                        style={[styles.btnBlue, { flex: 1, marginRight: 5 }, isProcessing && { opacity: 0.6 }]}
                        onPress={() => handleAction(() => acceptRequestMutation.mutate(item._id), item._id)}
                        disabled={isProcessing}
                    >
                        <Text style={styles.btnTextBlue}>
                            {isProcessing ? '...' : 'Accept'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btnRed, { flex: 1, marginLeft: 5 }, isProcessing && { opacity: 0.6 }]}
                        onPress={() => handleAction(() => rejectRequestMutation.mutate(item._id), item._id)}
                        disabled={isProcessing}
                    >
                        <Text style={styles.btnTextRed}>
                            {isProcessing ? '...' : 'Remove'}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        } else if (activeTab === 'sentRequests') {
            actionButtons = (
                <TouchableOpacity
                    style={[styles.btnYellow, isProcessing && { opacity: 0.6 }]}
                    onPress={() => handleAction(() => cancelRequestMutation.mutate(item._id), item._id)}
                    disabled={isProcessing}
                >
                    <Text style={styles.btnTextYellow}>
                        {isProcessing ? 'Processing...' : 'Cancel Request'}
                    </Text>
                </TouchableOpacity>
            );
        } else if (activeTab === 'allFriends') {
            actionButtons = (
                <TouchableOpacity
                    style={[styles.btnRedLight, isProcessing && { opacity: 0.6 }]}
                    onPress={() => handleUnfriend(item._id, item.name)}
                    disabled={isProcessing}
                >
                    <Text style={styles.btnTextRedLight}>
                        {isProcessing ? 'Processing...' : 'Unfriend'}
                    </Text>
                </TouchableOpacity>
            );
        }

        return (
            <View style={styles.card}>
                <View>
                    <Image
                        source={{ uri: item.profileImage || 'https://via.placeholder.com/150' }}
                        style={styles.avatar}
                    />
                    {item.isOnline && <View style={styles.onlineDot} />}
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.actions}>
                        {actionButtons}
                    </View>
                </View>
            </View>
        );
    };

    const isLoading = loadingPeoples || loadingReq || loadingSent || loadingFriends;

    return (
        <View style={styles.container}>
            <TobNav navigation={navigation} />

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'home' && styles.activeTab]}
                        onPress={() => setActiveTab('home')}
                    >
                        <Ionicons name="people" size={20} color={activeTab === 'home' ? '#fff' : '#666'} />
                        <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>Suggestions</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'friendRequests' && styles.activeTab]}
                        onPress={() => setActiveTab('friendRequests')}
                    >
                        <Ionicons name="person-add" size={20} color={activeTab === 'friendRequests' ? '#fff' : '#666'} />
                        <Text style={[styles.tabText, activeTab === 'friendRequests' && styles.activeTabText]}>Requests</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'sentRequests' && styles.activeTab]}
                        onPress={() => setActiveTab('sentRequests')}
                    >
                        <Ionicons name="paper-plane" size={20} color={activeTab === 'sentRequests' ? '#fff' : '#666'} />
                        <Text style={[styles.tabText, activeTab === 'sentRequests' && styles.activeTabText]}>Sent</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'allFriends' && styles.activeTab]}
                        onPress={() => setActiveTab('allFriends')}
                    >
                        <Ionicons name="heart" size={20} color={activeTab === 'allFriends' ? '#fff' : '#666'} />
                        <Text style={[styles.tabText, activeTab === 'allFriends' && styles.activeTabText]}>Friends</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Content */}
            {isLoading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#0D9488" />
                </View>
            ) : (
                <FlatList
                    data={
                        activeTab === 'home' ? peoples :
                            activeTab === 'friendRequests' ? reqFriends :
                                activeTab === 'sentRequests' ? sentReq :
                                    allFriends
                    }
                    renderItem={renderUserItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>No users found.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    tabsContainer: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tabsContent: {
        paddingHorizontal: 15,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 10,
    },
    activeTab: {
        backgroundColor: '#0D9488',
    },
    tabText: {
        marginLeft: 6,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#fff',
    },
    list: {
        padding: 15,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#eee',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#fff',
    },
    info: {
        flex: 1,
        marginLeft: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    actions: {
        flexDirection: 'row',
    },
    row: {
        flexDirection: 'row',
        width: '100%',
    },
    btnGreen: {
        backgroundColor: '#ECFDF5',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    btnTextGreen: {
        color: '#059669',
        fontWeight: '600',
        fontSize: 12,
    },
    btnBlue: {
        backgroundColor: '#EFF6FF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    btnTextBlue: {
        color: '#2563EB',
        fontWeight: '600',
        fontSize: 12,
    },
    btnRed: {
        backgroundColor: '#FEF2F2',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    btnTextRed: {
        color: '#DC2626',
        fontWeight: '600',
        fontSize: 12,
    },
    btnYellow: {
        backgroundColor: '#FFFBEB',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    btnTextYellow: {
        color: '#D97706',
        fontWeight: '600',
        fontSize: 12,
    },
    btnGray: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    btnTextGray: {
        color: '#6B7280',
        fontWeight: '600',
        fontSize: 12,
    },
    btnRedLight: {
        backgroundColor: '#FEF2F2',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    btnTextRedLight: {
        color: '#EF4444',
        fontWeight: '600',
        fontSize: 12,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 16,
    },
});

export default Peoples;
