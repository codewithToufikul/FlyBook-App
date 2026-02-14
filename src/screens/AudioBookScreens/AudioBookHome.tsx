import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    StatusBar
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAudioBooks, AudioBook } from '../../services/audioBookService';
import CustomHeader from '../../components/common/CustomHeader';

const AudioBookHome = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [books, setBooks] = useState<AudioBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const data = await getAudioBooks();
                setBooks(data);
            } catch (error) {
                console.error('Failed to fetch audiobooks:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBooks();
    }, []);

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderBookItem = ({ item }: { item: AudioBook }) => (
        <TouchableOpacity
            style={styles.bookCard}
            onPress={() => navigation.navigate('AudioBookDetails', { bookId: item.id })}
            activeOpacity={0.8}
        >
            <Image source={{ uri: item.coverImage }} style={styles.bookCover} />
            <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
                <View style={styles.metaRow}>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                    <Text style={styles.durationText}>{item.totalDuration}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <CustomHeader
                title="Audio Books"
            />

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search books, authors..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#0D9488" />
                </View>
            ) : (
                <FlatList
                    data={filteredBooks}
                    renderItem={renderBookItem}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No audiobooks found.</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 48,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 12,
        paddingBottom: 24,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    bookCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 10,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    bookCover: {
        width: '100%',
        height: 180,
        borderRadius: 8,
        marginBottom: 10,
        resizeMode: 'cover',
    },
    bookInfo: {
        flex: 1,
    },
    bookTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#D97706',
        marginLeft: 2,
    },
    durationText: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 16,
    }
});

export default AudioBookHome;
