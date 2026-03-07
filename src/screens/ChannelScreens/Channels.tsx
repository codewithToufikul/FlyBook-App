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
import { useTheme } from '../../contexts/ThemeContext';

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
    const { isDark } = useTheme();
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
            style={[
                styles.channelCard,
                isDark && { backgroundColor: '#1e293b', borderColor: '#334155' },
                isMatched && (isDark ? styles.matchedCardDark : styles.matchedCard)
            ]}
            onPress={() => navigation.navigate('ChannelChat', { channelId: item._id, channelName: item.name })}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <Image
                    source={{ uri: item.avatar || 'https://i.ibb.co/YDyHdGX/default-channel.jpg' }}
                    style={[styles.avatar, isDark && { backgroundColor: '#0f172a' }]}
                />
                {item.isOnline && <View style={[styles.onlineBadge, isDark && { borderColor: '#1e293b' }]} />}
            </View>
            <View style={styles.channelInfo}>
                <View style={styles.channelHeader}>
                    <Text style={[styles.channelName, isDark && { color: '#F8FAFC' }]} numberOfLines={1}>{item.name}</Text>
                    {isMatched && (
                        <View style={[styles.locationBadge, isDark && { backgroundColor: '#1e3a8a' }]}>
                            <Ionicons name="location" size={10} color={isDark ? "#60A5FA" : "#3B82F6"} />
                            <Text style={[styles.locationBadgeText, isDark && { color: '#60A5FA' }]}>Matched</Text>
                        </View>
                    )}
                </View>
                <Text style={[styles.lastMessage, isDark && { color: '#94A3B8' }]} numberOfLines={1}>
                    {item.lastMessage || 'No messages yet'}
                </Text>
                {item.description ? (
                    <Text style={[styles.description, isDark && { color: '#64748B' }]} numberOfLines={1}>
                        {item.description}
                    </Text>
                ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? "#4B5563" : "#D1D5DB"} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={isDark ? "#0f172a" : "#FFFFFF"}
            />
            <CustomHeader title="Channels" />

            <View style={[styles.header, isDark && { backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' }]}>
                <View>
                    <Text style={[styles.headerSubtitle, isDark && { color: '#94A3B8' }]}>{channels.length} active communities</Text>
                </View>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => setCreateModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.searchSection, isDark && { backgroundColor: '#0f172a' }]}>
                <View style={[styles.searchBar, isDark && { backgroundColor: '#1e293b' }]}>
                    <Ionicons name="search-outline" size={20} color={isDark ? "#94A3B8" : "#9CA3AF"} />
                    <TextInput
                        style={[styles.searchInput, isDark && { color: '#F8FAFC' }]}
                        placeholder="Search channels..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
                    />
                </View>
            </View>

            {isLoading ? (
                <View style={[styles.loadingContainer, isDark && { backgroundColor: '#0f172a' }]}>
                    <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#3B82F6"} />
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
                                        <Ionicons name="pin" size={16} color={isDark ? "#60A5FA" : "#3B82F6"} />
                                        <Text style={[styles.sectionTitle, isDark && { color: '#60A5FA' }]}>Address Matched Channels</Text>
                                    </View>
                                    {matchedChannels.map(item => (
                                        <View key={item._id}>
                                            {renderChannelItem({ item, isMatched: true })}
                                        </View>
                                    ))}
                                    <View style={[styles.divider, isDark && { backgroundColor: '#1e293b' }]} />
                                </View>
                            )}
                            {displayChannels.length > 0 && (
                                <Text style={[styles.sectionTitleMain, isDark && { color: '#64748B' }]}>All Channels</Text>
                            )}
                        </>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color={isDark ? "#334155" : "#D1D5DB"} />
                            <Text style={[styles.emptyText, isDark && { color: '#4B5563' }]}>No channels found</Text>
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
                <View style={[styles.modalOverlay, isDark && { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
                    <View style={[styles.modalContent, isDark && { backgroundColor: '#1e293b' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && { color: '#F8FAFC' }]}>Create New Channel</Text>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                                <Ionicons name="close" size={24} color={isDark ? "#94A3B8" : "#4B5563"} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, isDark && { color: '#94A3B8' }]}>Channel Name *</Text>
                            <TextInput
                                style={[styles.input, isDark && styles.inputDark]}
                                value={newChannel.name}
                                onChangeText={(text) => setNewChannel({ ...newChannel, name: text })}
                                placeholder="e.g. Dhaka Enthusiasts"
                                placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, isDark && { color: '#94A3B8' }]}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, isDark && styles.inputDark]}
                                value={newChannel.description}
                                onChangeText={(text) => setNewChannel({ ...newChannel, description: text })}
                                placeholder="What is this channel about?"
                                placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, isDark && { color: '#94A3B8' }]}>Channel Avatar</Text>
                            <View style={styles.avatarInputRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }, isDark && styles.inputDark]}
                                    value={newChannel.avatar}
                                    onChangeText={(text) => setNewChannel({ ...newChannel, avatar: text })}
                                    placeholder="Enter or upload image"
                                    placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
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
                                    <Image source={{ uri: newChannel.avatar }} style={[styles.avatarPreview, isDark && { backgroundColor: '#0f172a' }]} />
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
    matchedCardDark: {
        borderColor: '#1e3a8a',
        backgroundColor: '#172554',
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
    inputDark: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        color: '#F8FAFC',
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
