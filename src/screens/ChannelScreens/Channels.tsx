import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get, post } from '../../services/api';
import TobNav from '../../components/TobNav';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { handleImageUpload } from '../../utils/imageUpload';
import CustomHeader from '../../components/common/CustomHeader';

const { width } = Dimensions.get('window');

interface Channel {
    _id: string;
    name: string;
    description: string;
    avatar: string;
    lastMessage?: string;
    time?: string;
    isOnline?: boolean;
    members?: string[];
}

const fetchChannels = async (): Promise<Channel[]> => {
    try {
        const response = await get<any>('/api/channels');
        return Array.isArray(response) ? response : (response?.channels || []);
    } catch (error) {
        console.error('Error fetching channels:', error);
        return [];
    }
};

const Channels = ({ navigation }: any) => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalVisible, setCreateModalVisible] = useState(false);
    const [newChannel, setNewChannel] = useState({ name: '', description: '', avatar: '' });
    const [isCreating, setCreating] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const { data: channels = [], isLoading, refetch, isFetching } = useQuery({
        queryKey: ['channels'],
        queryFn: fetchChannels,
    });

    const filteredChannels = useMemo(() => {
        return channels.filter(channel =>
            channel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            channel.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [channels, searchQuery]);

    // Address matching logic similar to web
    const matchedChannels = useMemo(() => {
        if (!user) return [];
        const getAddressParts = (addr: string) =>
            (addr || "").toLowerCase()
                .split(/[\s,]+/)
                .filter(part => part.length > 2);

        const cityParts = getAddressParts(user.currentCity || '');
        const hometownParts = getAddressParts(user.hometown || '');
        const allParts = [...new Set([...cityParts, ...hometownParts])];

        if (allParts.length === 0) return [];

        return channels.filter(channel => {
            const channelName = channel.name?.toLowerCase() || "";
            return allParts.some(part => channelName.includes(part) || part.includes(channelName));
        });
    }, [channels, user]);

    const displayChannels = useMemo(() => {
        const matchedIds = new Set(matchedChannels.map(c => c._id));
        return filteredChannels.filter(c => !matchedIds.has(c._id));
    }, [filteredChannels, matchedChannels]);

    const handleCreateChannel = async () => {
        if (!newChannel.name.trim()) {
            Toast.show({ type: 'error', text1: 'Name is required' });
            return;
        }

        setCreating(true);
        try {
            const channelData = {
                creator: user?._id,
                name: newChannel.name.trim(),
                description: newChannel.description.trim(),
                avatar: newChannel.avatar || "https://i.ibb.co/YDyHdGX/default-channel.jpg",
                lastMessage: "Channel created! Welcome everyone! 🎉",
                members: [user?._id],
                status: "pending",
            };

            await post('/api/channels', channelData);
            Toast.show({ type: 'success', text1: 'Channel created successfully!' });
            setNewChannel({ name: '', description: '', avatar: '' });
            setCreateModalVisible(false);
            refetch();
        } catch (error) {
            console.error('Error creating channel:', error);
            Toast.show({ type: 'error', text1: 'Failed to create channel' });
        } finally {
            setCreating(false);
        }
    };

    const handleAvatarUpload = async () => {
        try {
            setIsUploadingAvatar(true);
            const imageUrl = await handleImageUpload();
            if (imageUrl) {
                setNewChannel(prev => ({ ...prev, avatar: imageUrl }));
                Toast.show({ type: 'success', text1: 'Image uploaded successfully!' });
            }
        } catch (error: any) {
            if (error.message.includes('User cancelled')) return;
            console.error('Avatar upload error:', error);
            Toast.show({ type: 'error', text1: 'Upload failed' });
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const renderChannelItem = ({ item, isMatched }: { item: Channel, isMatched?: boolean }) => (
        <TouchableOpacity
            style={[styles.channelCard, isMatched && styles.matchedCard]}
            onPress={() => navigation.navigate('ChannelChat', { channelId: item._id, channelName: item.name })}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <Image
                    source={{ uri: item.avatar || 'https://i.ibb.co/YDyHdGX/default-channel.jpg' }}
                    style={styles.avatar}
                />
                {item.isOnline && <View style={styles.onlineBadge} />}
            </View>
            <View style={styles.channelInfo}>
                <View style={styles.channelHeader}>
                    <Text style={styles.channelName} numberOfLines={1}>{item.name}</Text>
                    {isMatched && (
                        <View style={styles.locationBadge}>
                            <Ionicons name="location" size={10} color="#3B82F6" />
                            <Text style={styles.locationBadgeText}>Matched</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage || 'No messages yet'}
                </Text>
                {item.description ? (
                    <Text style={styles.description} numberOfLines={1}>
                        {item.description}
                    </Text>
                ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            {/* <TobNav navigation={navigation} /> */}

            <CustomHeader
                title="Channels"
            />
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Channels</Text>
                    <Text style={styles.headerSubtitle}>{channels.length} active communities</Text>
                </View>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => setCreateModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search channels..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    data={displayChannels}
                    keyExtractor={(item) => item._id}
                    renderItem={(props) => renderChannelItem(props)}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={() => (
                        <>
                            {matchedChannels.length > 0 && !searchQuery && (
                                <View style={styles.matchedSection}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="pin" size={16} color="#3B82F6" />
                                        <Text style={styles.sectionTitle}>Address Matched Channels</Text>
                                    </View>
                                    {matchedChannels.map(item => (
                                        <View key={item._id}>
                                            {renderChannelItem({ item, isMatched: true })}
                                        </View>
                                    ))}
                                    <View style={styles.divider} />
                                </View>
                            )}
                            {displayChannels.length > 0 && (
                                <Text style={styles.sectionTitleMain}>All Channels</Text>
                            )}
                        </>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No channels found</Text>
                        </View>
                    }
                    onRefresh={refetch}
                    refreshing={isFetching}
                />
            )}

            {/* Create Channel Modal */}
            <Modal
                visible={isCreateModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create New Channel</Text>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Channel Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={newChannel.name}
                                onChangeText={(text) => setNewChannel({ ...newChannel, name: text })}
                                placeholder="e.g. Dhaka Enthusiasts"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={newChannel.description}
                                onChangeText={(text) => setNewChannel({ ...newChannel, description: text })}
                                placeholder="What is this channel about?"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Channel Avatar</Text>
                            <View style={styles.avatarInputRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={newChannel.avatar}
                                    onChangeText={(text) => setNewChannel({ ...newChannel, avatar: text })}
                                    placeholder="Enter or upload image"
                                    placeholderTextColor="#9CA3AF"
                                />
                                <TouchableOpacity
                                    style={[styles.uploadSmallBtn, isUploadingAvatar && styles.disabledButton]}
                                    onPress={handleAvatarUpload}
                                    disabled={isUploadingAvatar}
                                >
                                    {isUploadingAvatar ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {newChannel.avatar ? (
                                <View style={styles.previewContainer}>
                                    <Image source={{ uri: newChannel.avatar }} style={styles.avatarPreview} />
                                    <TouchableOpacity
                                        style={styles.removePreview}
                                        onPress={() => setNewChannel(prev => ({ ...prev, avatar: '' }))}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ) : null}
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, isCreating && styles.disabledButton]}
                            onPress={handleCreateChannel}
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Create Channel</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Toast />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 4,
    },
    searchSection: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#1F2937',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 30,
    },
    channelCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 15,
        marginHorizontal: 15,
        marginTop: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    matchedCard: {
        borderColor: '#DBEAFE',
        backgroundColor: '#F0F9FF',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#E5E7EB',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    channelInfo: {
        flex: 1,
        marginLeft: 15,
    },
    channelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    channelName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        maxWidth: '70%',
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    locationBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#3B82F6',
        marginLeft: 2,
    },
    lastMessage: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    description: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    matchedSection: {
        marginBottom: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 15,
        marginBottom: 5,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3B82F6',
        marginLeft: 6,
        textTransform: 'uppercase',
    },
    sectionTitleMain: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6B7280',
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 20,
        marginTop: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 18,
        color: '#9CA3AF',
        marginTop: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 48,
        color: '#1F2937',
    },
    textArea: {
        height: 100,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.7,
    },
    avatarInputRow: {
        flexDirection: 'row',
        gap: 10,
    },
    uploadSmallBtn: {
        backgroundColor: '#3B82F6',
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewContainer: {
        marginTop: 10,
        position: 'relative',
        width: 60,
        height: 60,
    },
    avatarPreview: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    removePreview: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
    },
});

export default Channels;
