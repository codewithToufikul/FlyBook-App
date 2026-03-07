import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StyleSheet,
    StatusBar,
    TextInput,
    RefreshControl,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { get } from '../../services/api';

interface FriendData {
    _id: string;
    name: string;
    userName?: string;
    profileImage?: string;
    bio?: string;
    shortBio?: string;
    work?: string;
    studies?: string;
}

interface UserFriendsResponse {
    success: boolean;
    data: FriendData[];
    userName: string;
}

const defaultAvatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const UserFriends = () => {
    const { isDark } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<any>();
    const { userId, userName: passedName } = route.params || {};

    const [searchQuery, setSearchQuery] = useState('');

    const {
        data: response,
        isLoading,
        refetch,
        isRefetching,
    } = useQuery<UserFriendsResponse>({
        queryKey: ['user-friends', userId],
        queryFn: () => get<UserFriendsResponse>(`/api/user-friends/${userId}`),
        enabled: !!userId,
    });

    const friends = response?.data || [];
    const ownerName = response?.userName || passedName || 'User';

    // Filter friends based on search query
    const filteredFriends = searchQuery.trim()
        ? friends.filter(
            (f) =>
                f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (f.userName && f.userName.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : friends;

    const navigateToProfile = (friendId: string) => {
        navigation.push('UserProfile', { userId: friendId });
    };

    const renderFriendItem = ({ item }: { item: FriendData }) => {
        const subtitle = item.work || item.studies || item.bio || item.shortBio || '';

        return (
            <TouchableOpacity
                style={[styles.friendCard, isDark && { backgroundColor: '#1e293b', shadowOpacity: 0 }]}
                onPress={() => navigateToProfile(item._id)}
                activeOpacity={0.7}
            >
                <View style={[styles.avatarWrapper, isDark && { backgroundColor: '#334155', borderColor: '#475569' }]}>
                    <Image
                        source={{ uri: item.profileImage || defaultAvatar }}
                        style={styles.avatar}
                    />
                </View>

                <View style={styles.friendInfo}>
                    <Text style={[styles.friendName, isDark && { color: '#f8fafc' }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    {item.userName && (
                        <Text style={[styles.friendHandle, isDark && { color: '#94a3b8' }]} numberOfLines={1}>
                            @{item.userName}
                        </Text>
                    )}
                    {subtitle ? (
                        <Text style={[styles.friendSubtitle, isDark && { color: '#64748b' }]} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>

                <View style={[styles.viewProfileBtn, isDark && { backgroundColor: '#334155' }]}>
                    <Ionicons name="chevron-forward" size={20} color={isDark ? "#94a3b8" : "#9CA3AF"} />
                </View>
            </TouchableOpacity>
        );
    };

    const renderHeader = () => (
        <View style={styles.headerInfo}>
            <View style={[styles.friendsCountBadge, isDark && { backgroundColor: 'rgba(20, 184, 166, 0.1)' }]}>
                <Ionicons name="people" size={18} color={isDark ? "#14b8a6" : "#0D9488"} />
                <Text style={[styles.friendsCountText, isDark && { color: '#14b8a6' }]}>
                    {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
                </Text>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, isDark && { backgroundColor: '#1e293b' }]}>
                <Ionicons name="people-outline" size={48} color={isDark ? "#334155" : "#D1D5DB"} />
            </View>
            <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>No Friends Yet</Text>
            <Text style={[styles.emptySubtitle, isDark && { color: '#94a3b8' }]}>
                {ownerName} hasn't added any friends yet.
            </Text>
        </View>
    );

    const renderSearchEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, isDark && { backgroundColor: '#1e293b' }]}>
                <Ionicons name="search-outline" size={48} color={isDark ? "#334155" : "#D1D5DB"} />
            </View>
            <Text style={[styles.emptyTitle, isDark && { color: '#f8fafc' }]}>No Results</Text>
            <Text style={[styles.emptySubtitle, isDark && { color: '#94a3b8' }]}>
                No friends found matching "{searchQuery}"
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFF"} />

            {/* Header */}
            <View style={[styles.header, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b', shadowOpacity: 0 }]}>
                <TouchableOpacity
                    style={[styles.backButton, isDark && { backgroundColor: '#1e293b' }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#111827"} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>{ownerName}'s Friends</Text>
                </View>
                <View style={[styles.headerRight, { alignItems: 'flex-end' }]}>
                    <TouchableOpacity style={[styles.backButton, isDark && { backgroundColor: '#1e293b' }]}>
                        <Ionicons name="ellipsis-horizontal" size={20} color={isDark ? "#f8fafc" : "#111827"} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <View style={[styles.searchBar, isDark && { backgroundColor: '#1e293b' }]}>
                    <Ionicons name="search-outline" size={20} color={isDark ? "#94a3b8" : "#9CA3AF"} />
                    <TextInput
                        style={[styles.searchInput, isDark && { color: '#f8fafc' }]}
                        placeholder="Search friends..."
                        placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={[styles.loadingContainer, isDark && { backgroundColor: '#0f172a' }]}>
                    <ActivityIndicator size="large" color={isDark ? "#14b8a6" : "#0D9488"} />
                    <Text style={[styles.loadingText, isDark && { color: '#94a3b8' }]}>Loading friends...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredFriends}
                    renderItem={renderFriendItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={friends.length > 0 ? renderHeader : null}
                    ListEmptyComponent={
                        searchQuery.trim() ? renderSearchEmpty : renderEmpty
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            colors={[isDark ? '#14b8a6' : '#0D9488']}
                            tintColor={isDark ? '#14b8a6' : '#0D9488'}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={[styles.separator, isDark && { height: 12 }]} />}
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

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingTop: 50,
        paddingBottom: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    headerRight: {
        width: 40,
    },

    // Search
    searchContainer: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        marginLeft: 10,
        padding: 0,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#9CA3AF',
    },

    // List
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 30,
    },

    // Header Info
    headerInfo: {
        paddingVertical: 16,
    },
    friendsCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#F0FDFA',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    friendsCountText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0D9488',
    },

    // Friend Card
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    friendInfo: {
        flex: 1,
        marginLeft: 14,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    friendHandle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    friendSubtitle: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 3,
    },
    viewProfileBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Separator
    separator: {
        height: 10,
    },

    // Empty State
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default UserFriends;
