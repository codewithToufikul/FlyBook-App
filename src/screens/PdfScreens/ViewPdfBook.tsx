import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Linking,
    StatusBar,
    FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get } from '../../services/api';
import TobNav from '../../components/TobNav';

const { width } = Dimensions.get('window');

interface PdfBook {
    _id: string;
    bookName: string;
    writerName: string;
    category: string;
    description: string;
    coverUrl?: string;
    pdfUrl?: string;
    pageCount?: number;
    fileSize?: number;
    timestamp?: string;
}

const fetchPdfBooks = async (): Promise<PdfBook[]> => {
    try {
        const response = await get<PdfBook[]>('/pdf-books');
        return Array.isArray(response) ? response : [];
    } catch (error) {
        console.error('Error fetching pdf books:', error);
        return [];
    }
};

const ViewPdfBook = ({ route, navigation }: any) => {
    const { bookId } = route.params;
    const [isExpanded, setIsExpanded] = useState(false);

    const { data: pdfBooks = [], isLoading } = useQuery({
        queryKey: ['pdf-books'],
        queryFn: fetchPdfBooks,
    });

    const book = pdfBooks.find(b => b._id === bookId);

    // Latest 5 books for recommendation
    const latestBooks = useMemo(() => {
        return pdfBooks
            .filter(b => b._id !== bookId)
            .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
            .slice(0, 5);
    }, [pdfBooks, bookId]);

    const handleDownload = () => {
        if (book?.pdfUrl) {
            Linking.openURL(book.pdfUrl);
        }
    };

    if (isLoading || !book) {
        return (
            <View style={styles.loadingContainer}>
                <TobNav navigation={navigation} />
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Loading Book Details...</Text>
                </View>
            </View>
        );
    }

    const formattedSize = book.fileSize ? (book.fileSize / 1024 / 1024).toFixed(2) + " MB" : 'Unknown';
    const formattedDate = book.timestamp ? new Date(book.timestamp).toLocaleDateString() : 'N/A';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <TobNav navigation={navigation} />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Book Header Section */}
                <View style={styles.headerCard}>
                    <View style={styles.coverSection}>
                        <Image
                            source={{ uri: book.coverUrl || 'https://via.placeholder.com/320x400' }}
                            style={styles.mainCover}
                            resizeMode="contain"
                        />
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={20} color="#F59E0B" />
                            <Ionicons name="star" size={20} color="#F59E0B" />
                            <Ionicons name="star" size={20} color="#F59E0B" />
                            <Ionicons name="star" size={20} color="#F59E0B" />
                            <Ionicons name="star-half" size={20} color="#F59E0B" />
                        </View>

                        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
                            <Ionicons name="download" size={20} color="#FFFFFF" />
                            <Text style={styles.downloadText}>Download PDF</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.metaSection}>
                        <Text style={styles.title}>{book.bookName}</Text>
                        <Text style={styles.writer}>By <Text style={styles.writerHighlight}>{book.writerName}</Text></Text>

                        <View style={styles.tagContainer}>
                            <View style={[styles.tag, { backgroundColor: '#DEF7EC' }]}>
                                <Text style={[styles.tagText, { color: '#03543F' }]}>{book.category}</Text>
                            </View>
                            <View style={[styles.tag, { backgroundColor: '#E1EFFE' }]}>
                                <Text style={[styles.tagText, { color: '#1E429F' }]}>{formattedSize}</Text>
                            </View>
                            <View style={[styles.tag, { backgroundColor: '#F3E8FF' }]}>
                                <Text style={[styles.tagText, { color: '#6B21A8' }]}>{book.pageCount || '0'} Pages</Text>
                            </View>
                        </View>

                        <View style={styles.detailsBox}>
                            <Text style={styles.detailsTitle}>Book Details</Text>
                            <View style={styles.detailRow}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>ADDED ON</Text>
                                    <Text style={styles.detailValue}>{formattedDate}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>WRITER</Text>
                                    <Text style={styles.detailValue}>{book.writerName}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Description Section */}
                <View style={styles.descriptionSection}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText} numberOfLines={isExpanded ? undefined : 6}>
                        {book.description || "No description available for this book."}
                    </Text>
                    {book.description && book.description.length > 200 && (
                        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.readMoreBtn}>
                            <Text style={styles.readMoreText}>{isExpanded ? 'Read Less' : 'Read More'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Recommendation Carousel */}
                <View style={styles.recommendSection}>
                    <Text style={styles.sectionTitle}>Latest Books</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendList}>
                        {latestBooks.map((item) => (
                            <TouchableOpacity
                                key={item._id}
                                style={styles.recommendCard}
                                onPress={() => navigation.push('ViewPdfBook', { bookId: item._id })}
                            >
                                <Image source={{ uri: item.coverUrl }} style={styles.recommendImage} />
                                <Text style={styles.recommendName} numberOfLines={2}>{item.bookName}</Text>
                                <Text style={styles.recommendDate}>{new Date(item.timestamp || 0).toLocaleDateString()}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.bottomGap} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    headerCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    coverSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    mainCover: {
        width: width * 0.7,
        height: width * 0.9,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
    },
    ratingContainer: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 4,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 20,
        width: '100%',
        justifyContent: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    downloadText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    metaSection: {
        marginTop: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    writer: {
        fontSize: 18,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '500',
    },
    writerHighlight: {
        color: '#3B82F6',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 16,
        gap: 8,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
    },
    detailsBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: 'bold',
    },
    detailValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
        marginTop: 2,
    },
    descriptionSection: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        marginTop: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 26,
    },
    readMoreBtn: {
        marginTop: 10,
    },
    readMoreText: {
        color: '#10B981',
        fontWeight: 'bold',
        fontSize: 15,
    },
    recommendSection: {
        padding: 24,
    },
    recommendList: {
        paddingRight: 24,
    },
    recommendCard: {
        width: 120,
        marginRight: 16,
    },
    recommendImage: {
        width: 120,
        height: 160,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    recommendName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 8,
        height: 36,
    },
    recommendDate: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    bottomGap: {
        height: 60,
    },
});

export default ViewPdfBook;
