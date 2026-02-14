import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAudioBookDetails, AudioBook, Chapter } from '../../services/audioBookService';

const AudioBookDetails = ({ route, navigation }: any) => {
    const { bookId } = route.params;
    const insets = useSafeAreaInsets();
    const [book, setBook] = useState<AudioBook | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getAudioBookDetails(bookId);
                setBook(data || null);
            } catch (error) {
                console.error('Failed to fetch audiobook details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [bookId]);

    const playChapter = (chapter: Chapter) => {
        navigation.navigate('AudioPlayer', {
            book: book,
            chapterId: chapter.id
        });
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0D9488" />
            </View>
        );
    }

    if (!book) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Book not found.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container]} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header Image Background */}
            <View style={styles.headerImageContainer}>
                <Image source={{ uri: book.coverImage }} style={styles.headerImage} blurRadius={3} />
                <View style={[styles.headerOverlay, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Book Info Content */}
            <View style={styles.contentContainer}>
                <View style={styles.bookMetaContainer}>
                    <Image source={{ uri: book.coverImage }} style={styles.mainCover} />
                    <View style={styles.bookTextInfo}>
                        <Text style={styles.title}>{book.title}</Text>
                        <Text style={styles.author}>by {book.author}</Text>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={16} color="#F59E0B" />
                            <Text style={styles.rating}>{book.rating}</Text>
                            <Text style={styles.dot}>•</Text>
                            <Text style={styles.category}>{book.category}</Text>
                        </View>
                    </View>
                </View>

                {/* Play Button */}
                <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => playChapter(book.chapters[0])}
                >
                    <Ionicons name="play" size={24} color="#fff" />
                    <Text style={styles.playButtonText}>Start Listening</Text>
                </TouchableOpacity>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About this book</Text>
                    <Text style={styles.description}>{book.description}</Text>
                </View>

                {/* Chapters */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Chapters ({book.chapters.length})</Text>
                    {book.chapters.map((chapter, index) => (
                        <TouchableOpacity
                            key={chapter.id}
                            style={styles.chapterItem}
                            onPress={() => playChapter(chapter)}
                        >
                            <View style={styles.chapterIndex}>
                                <Text style={styles.chapterIndexText}>{index + 1}</Text>
                            </View>
                            <View style={styles.chapterInfo}>
                                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                                <Text style={styles.chapterDuration}>{chapter.duration}</Text>
                            </View>
                            <Ionicons name="play-circle-outline" size={28} color="#0D9488" />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 16,
    },
    headerImageContainer: {
        height: 250,
        width: '100%',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        opacity: 0.7,
        backgroundColor: '#000',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginTop: 10,
    },
    contentContainer: {
        marginTop: -60,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 30,
    },
    bookMetaContainer: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    mainCover: {
        width: 100,
        height: 150,
        borderRadius: 8,
        marginRight: 16,
        marginTop: -50, // Pull up to overlap header
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    bookTextInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    author: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 4,
    },
    dot: {
        marginHorizontal: 8,
        color: '#9CA3AF',
    },
    category: {
        fontSize: 14,
        color: '#0D9488',
        fontWeight: '500',
    },
    playButton: {
        flexDirection: 'row',
        backgroundColor: '#0D9488',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    playButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
    },
    chapterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    chapterIndex: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0FDFA',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    chapterIndexText: {
        color: '#0D9488',
        fontWeight: 'bold',
        fontSize: 14,
    },
    chapterInfo: {
        flex: 1,
    },
    chapterTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 2,
    },
    chapterDuration: {
        fontSize: 12,
        color: '#9CA3AF',
    },
});

export default AudioBookDetails;
