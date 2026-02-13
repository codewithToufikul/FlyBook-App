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
    ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get } from '../../services/api';
import TobNav from '../../components/TobNav';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 40) / COLUMN_COUNT;

interface PdfBook {
    _id: string;
    bookName: string;
    writerName: string;
    category: string;
    coverUrl?: string;
    pdfUrl?: string;
    uploadMethod?: string;
    createdAt?: string;
}

const CATEGORIES = [
    "All", "Editor's Choice", "English Books", "অনুবাদ বই", "অসম্পূর্ণ বই",
    "আত্মউন্নয়নমূলক বই", "আত্মজীবনী ও স্মৃতিকথা", "ইতিহাস ও সংস্কৃতি",
    "ইসলামিক বই", "উপন্যাস", "কাব্যগ্রন্থ / কবিতা", "কিশোর সাহিত্য",
    "গণিত, বিজ্ঞান ও প্রযুক্তি", "গল্পগ্রন্থ / গল্পের বই", "গান / গানের বই",
    "গোয়েন্দা (ডিটেকটিভ)", "থ্রিলার রহস্য রোমাঞ্চ অ্যাডভেঞ্চার", "ধর্ম ও দর্শন",
    "ধর্মীয় বই", "নাটক", "প্রবন্ধ ও গবেষণা", "প্রাপ্তবয়স্কদের বই ১৮+",
    "বাংলাদেশ ও মুক্তিযুদ্ধ বিষয়ক", "ভৌতিক, হরর, ভূতের বই", "ভ্রমণ কাহিনী",
    "রচনাসমগ্র / রচনাবলী / রচনা সংকলন", "সায়েন্স ফিকশন / বৈজ্ঞানিক কল্পকাহিনী",
    "সাহিত্য ও ভাষা", "সেবা প্রকাশনী", "Fiction", "Non-Fiction",
    "Children's Books", "Educational/Academic", "Poetry", "Art & Photography",
    "Cookbooks", "Travel Guides", "Comics & Graphic Novels", "Movies", "Tech Gadgets"
];

const fetchPdfBooks = async (): Promise<PdfBook[]> => {
    try {
        const response = await get<PdfBook[]>('/pdf-books');
        return Array.isArray(response) ? response : [];
    } catch (error) {
        console.error('Error fetching pdf books:', error);
        return [];
    }
};

const PdfHome = ({ navigation }: any) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [uploadFilter, setUploadFilter] = useState('All'); // 'All', 'Direct', 'Web'

    const { data: books = [], isLoading, refetch, isFetching } = useQuery({
        queryKey: ['pdf-books'],
        queryFn: fetchPdfBooks,
    });

    const filteredBooks = useMemo(() => {
        return books.filter(book => {
            const matchesSearch = book.bookName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                book.writerName?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;

            let matchesUpload = true;
            if (uploadFilter === 'Direct') matchesUpload = book.uploadMethod === 'Direct Upload';
            if (uploadFilter === 'Web') matchesUpload = book.uploadMethod === 'Via Link';

            return matchesSearch && matchesCategory && matchesUpload;
        }).reverse(); // Latest first
    }, [books, searchQuery, selectedCategory, uploadFilter]);

    const renderBookItem = ({ item }: { item: PdfBook }) => (
        <TouchableOpacity
            style={styles.bookCard}
            onPress={() => navigation.navigate('ViewPdfBook', { bookId: item._id })}
            activeOpacity={0.8}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{
                        uri: item.coverUrl || 'https://dictionary.cambridge.org/images/thumb/book_noun_001_01679.jpg?version=6.0.45'
                    }}
                    style={styles.coverImage}
                    resizeMode="cover"
                />
                <View style={styles.badgeContainer}>
                    <Text style={styles.categoryBadgeText}>{item.category || 'Book'}</Text>
                </View>
            </View>
            <View style={styles.bookInfo}>
                <Text style={styles.bookName} numberOfLines={2}>{item.bookName}</Text>
                <Text style={styles.writerName} numberOfLines={1}>{item.writerName}</Text>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Ionicons name="star-outline" size={12} color="#F59E0B" />
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderCategoryItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={[
                styles.categoryItem,
                selectedCategory === item && styles.selectedCategoryItem
            ]}
            onPress={() => setSelectedCategory(item)}
        >
            <Text style={[
                styles.categoryText,
                selectedCategory === item && styles.selectedCategoryText
            ]}>
                {item}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <TobNav navigation={navigation} />

            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={20} color="#6B7280" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search Book Name or Writer"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9CA3AF"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Source:</Text>
                <TouchableOpacity
                    style={[styles.filterChip, uploadFilter === 'All' && styles.activeFilterChip]}
                    onPress={() => setUploadFilter('All')}
                >
                    <Text style={[styles.filterChipText, uploadFilter === 'All' && styles.activeFilterChipText]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterChip, uploadFilter === 'Direct' && styles.activeFilterChip]}
                    onPress={() => setUploadFilter('Direct')}
                >
                    <Text style={[styles.filterChipText, uploadFilter === 'Direct' && styles.activeFilterChipText]}>Direct</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterChip, uploadFilter === 'Web' && styles.activeFilterChip]}
                    onPress={() => setUploadFilter('Web')}
                >
                    <Text style={[styles.filterChipText, uploadFilter === 'Web' && styles.activeFilterChipText]}>Web Link</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.categorySection}>
                <FlatList
                    data={CATEGORIES}
                    renderItem={renderCategoryItem}
                    keyExtractor={(item) => item}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryList}
                />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Fetching PDF Books...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredBooks}
                    renderItem={renderBookItem}
                    keyExtractor={(item) => item._id}
                    numColumns={COLUMN_COUNT}
                    contentContainerStyle={styles.gridContent}
                    columnWrapperStyle={styles.columnWrapper}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="book-outline" size={60} color="#D1D5DB" />
                            <Text style={styles.emptyTitle}>No books found</Text>
                            <Text style={styles.emptySubtitle}>Try adjusting your search or category</Text>
                        </View>
                    }
                    onRefresh={refetch}
                    refreshing={isFetching}
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
    searchSection: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: '#111827',
    },
    categorySection: {
        backgroundColor: '#FFFFFF',
        paddingTop: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    filterSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: '#FFFFFF',
    },
    filterLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#6B7280',
        marginRight: 8,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        marginRight: 6,
    },
    activeFilterChip: {
        backgroundColor: '#D1FAE5',
    },
    filterChipText: {
        fontSize: 11,
        color: '#4B5563',
        fontWeight: '600',
    },
    activeFilterChipText: {
        color: '#059669',
    },
    categoryList: {
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    categoryItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    selectedCategoryItem: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    selectedCategoryText: {
        color: '#FFFFFF',
    },
    gridContent: {
        padding: 12,
        paddingBottom: 24,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    bookCard: {
        width: ITEM_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    imageContainer: {
        width: '100%',
        height: ITEM_WIDTH * 1.3,
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    badgeContainer: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(59, 130, 246, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    bookInfo: {
        padding: 10,
    },
    bookName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        height: 40,
        lineHeight: 20,
    },
    writerName: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4B5563',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
    },
});

export default PdfHome;