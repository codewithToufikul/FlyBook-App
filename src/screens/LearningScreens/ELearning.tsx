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
import CustomHeader from '../../components/common/CustomHeader';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const NAV_ITEMS = [
    {
        id: 'class',
        title: 'Class 1-12',
        items: [
            'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
            'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
        ]
    },
    {
        id: 'university',
        title: 'University Level',
        items: [
            'Computer Science', 'Engineering', 'Economics', 'Education', 'Law',
            'Health Studies', 'Sciences', 'Financial Accounting', 'Architecture',
            'Social Science', 'Art', 'Humanities', 'Design', 'Journalism', 'Medicine'
        ]
    },
    {
        id: 'expert',
        title: 'Expert Courses',
        items: [
            'Artificial Intelligence', 'Technology', 'Medical', 'Career Development',
            'Engineering', 'Languages', 'Humanities', 'Soft Skills', 'Kitchen and Cooking'
        ]
    },
    {
        id: 'other',
        title: 'Other',
        items: [
            'Quiz', 'Admission', 'Religion', 'Competition', 'Job'
        ]
    }
];

interface Course {
    _id: string;
    title: string;
    description: string;
    thumbnail: string;
    instructorName: string;
    categories: string;
    level: string;
    isFree: boolean;
    price: number;
    videos: any[];
}

const fetchCourses = async (): Promise<Course[]> => {
    try {
        const response = await get<Course[]>('/api/courses');
        return response;
    } catch (error) {
        console.error('Error fetching courses:', error);
        return [];
    }
};

const ELearning = ({ navigation }: any) => {
    const { isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedLevel, setSelectedLevel] = useState('All');
    const [priceFilter, setPriceFilter] = useState('All');

    const { data: courses = [], isLoading, refetch, isFetching } = useQuery({
        queryKey: ['courses'],
        queryFn: fetchCourses,
    });

    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            const matchesSearch =
                course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.instructorName?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = selectedCategory === 'All' ||
                course.categories?.toLowerCase() === selectedCategory.toLowerCase();

            const matchesLevel = selectedLevel === 'All' ||
                course.level?.toLowerCase() === selectedLevel.toLowerCase();

            const matchesPrice = priceFilter === 'All' ||
                (priceFilter === 'Free' ? course.isFree : !course.isFree);

            return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
        });
    }, [courses, searchQuery, selectedCategory, selectedLevel, priceFilter]);

    const formatDuration = (videos: any[]) => {
        if (!videos || videos.length === 0) return '0m';
        const totalMinutes = videos.reduce((acc, video) => acc + parseInt(video.videoDuration || 0), 0);
        if (totalMinutes < 60) return `${totalMinutes}m`;
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return `${hours}h ${mins}m`;
    };

    const renderCourseItem = ({ item }: { item: Course }) => (
        <TouchableOpacity
            style={[styles.courseCard, isDark && styles.courseCardDark]}
            onPress={() => navigation.navigate('CourseDetails', { courseId: item._id })}
            activeOpacity={0.9}
        >
            <View style={styles.thumbnailContainer}>
                {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                ) : (
                    <View style={[styles.thumbnail, styles.fallbackThumbnail, isDark && { backgroundColor: '#1E40AF' }]}>
                        <Text style={styles.fallbackTitle}>{item.title}</Text>
                    </View>
                )}
                <View style={styles.badgesContainer}>
                    <View style={[styles.badge, item.isFree ? styles.freeBadge : styles.paidBadge]}>
                        <Text style={styles.badgeText}>{item.isFree ? 'Free' : `$${item.price}`}</Text>
                    </View>
                    <View style={[styles.levelBadge, isDark && { backgroundColor: '#1E293B' }]}>
                        <Text style={[styles.levelBadgeText, isDark && { color: '#F8FAFC' }]}>{item.level}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.courseInfo}>
                <View style={[styles.categoryBadge, isDark && { backgroundColor: '#2E1065' }]}>
                    <Ionicons name="tag" size={10} color="#8B5CF6" />
                    <Text style={[styles.categoryBadgeText, isDark && { color: '#A78BFA' }]}>{item.categories}</Text>
                </View>
                <Text style={[styles.courseTitle, isDark && styles.textLight]} numberOfLines={2}>{item.title}</Text>
                <View style={styles.instructorRow}>
                    <Ionicons name="person-outline" size={12} color={isDark ? "#94A3B8" : "#6B7280"} />
                    <Text style={[styles.instructorName, isDark && { color: '#94A3B8' }]} numberOfLines={1}>{item.instructorName}</Text>
                </View>
                <View style={[styles.statsRow, isDark && { borderTopColor: '#334155' }]}>
                    <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={12} color={isDark ? "#94A3B8" : "#6B7280"} />
                        <Text style={[styles.statText, isDark && { color: '#94A3B8' }]}>{formatDuration(item.videos)}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="play-circle-outline" size={12} color={isDark ? "#94A3B8" : "#6B7280"} />
                        <Text style={[styles.statText, isDark && { color: '#94A3B8' }]}>{item.videos?.length || 0} lessons</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const CategoryChip = ({ title, selected, onSelect }: any) => (
        <TouchableOpacity
            style={[styles.chip, isDark && styles.chipDark, selected && styles.chipSelected]}
            onPress={onSelect}
        >
            <Text style={[styles.chipText, isDark && { color: '#94A3B8' }, selected && styles.chipTextSelected]}>{title}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFFFFF"} />
            {/* <TobNav navigation={navigation} /> */}

            <CustomHeader
                title="E-Learning"
            />
            <ScrollView stickyHeaderIndices={[2]} showsVerticalScrollIndicator={false}>
                <View style={[styles.heroSection, isDark && styles.heroSectionDark]}>
                    <Text style={[styles.heroTitle, isDark && styles.textLight]}>
                        Transform Your Future with{'\n'}
                        <Text style={styles.heroAccent}>E-Learning</Text>
                    </Text>
                    <Text style={[styles.heroSubtitle, isDark && { color: '#94A3B8' }]}>
                        Discover world-class courses from expert instructors and boost your skills
                    </Text>
                </View>

                <View style={[styles.searchSection, isDark && styles.heroSectionDark]}>
                    <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
                        <Ionicons name="search-outline" size={20} color={isDark ? "#64748B" : "#9CA3AF"} />
                        <TextInput
                            style={[styles.searchInput, isDark && styles.textLight]}
                            placeholder="Search courses, instructors..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
                        />
                    </View>
                </View>

                <View style={[styles.filterSection, isDark && styles.filterSectionDark]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                        <CategoryChip
                            title="All"
                            selected={selectedCategory === 'All'}
                            onSelect={() => setSelectedCategory('All')}
                        />
                        {NAV_ITEMS.map(group => (
                            <View key={group.id} style={styles.filterGroup}>
                                <Text style={[styles.filterGroupTitle, isDark && { color: '#475569' }]}>{group.title}</Text>
                                {group.items.map(item => (
                                    <CategoryChip
                                        key={item}
                                        title={item}
                                        selected={selectedCategory === item}
                                        onSelect={() => setSelectedCategory(item)}
                                    />
                                ))}
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {isLoading ? (
                    <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={[styles.loadingText, isDark && { color: '#94A3B8' }]}>Loading amazing courses...</Text>
                    </View>
                ) : (
                    <View style={styles.gridContainer}>
                        <View style={styles.resultsHeader}>
                            <Text style={[styles.resultsCount, isDark && { color: '#64748B' }]}>{filteredCourses.length} courses found</Text>
                        </View>

                        <FlatList
                            data={filteredCourses}
                            renderItem={renderCourseItem}
                            keyExtractor={item => item._id}
                            numColumns={1}
                            scrollEnabled={false}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="school-outline" size={64} color={isDark ? "#334155" : "#D1D5DB"} />
                                    <Text style={[styles.emptyText, isDark && { color: '#64748B' }]}>No courses found</Text>
                                    <TouchableOpacity
                                        style={styles.clearBtn}
                                        onPress={() => {
                                            setSelectedCategory('All');
                                            setSearchQuery('');
                                        }}
                                    >
                                        <Text style={styles.clearBtnText}>Clear Filters</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    containerDark: {
        backgroundColor: '#0f172a',
    },
    textLight: {
        color: '#F8FAFC',
    },
    heroSection: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    heroSectionDark: {
        backgroundColor: '#1e293b',
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        lineHeight: 32,
    },
    heroAccent: {
        color: '#3B82F6',
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
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
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchBarDark: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#1F2937',
    },
    filterSection: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingVertical: 10,
    },
    filterSectionDark: {
        backgroundColor: '#1e293b',
        borderBottomColor: '#334155',
    },
    filterScroll: {
        paddingHorizontal: 15,
        alignItems: 'center',
    },
    filterGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterGroupTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9CA3AF',
        marginHorizontal: 10,
        textTransform: 'uppercase',
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chipSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    chipDark: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
    },
    chipText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    gridContainer: {
        padding: 15,
    },
    resultsHeader: {
        marginBottom: 10,
    },
    resultsCount: {
        fontSize: 14,
        color: '#6B7280',
        fontStyle: 'italic',
    },
    courseCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    courseCardDark: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    thumbnailContainer: {
        width: '100%',
        height: 180,
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    fallbackThumbnail: {
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    fallbackTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    badgesContainer: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    freeBadge: {
        backgroundColor: '#10B981',
    },
    paidBadge: {
        backgroundColor: '#3B82F6',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    levelBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    levelBadgeText: {
        color: '#374151',
        fontSize: 10,
        fontWeight: '700',
    },
    courseInfo: {
        padding: 15,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F3FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    categoryBadgeText: {
        color: '#8B5CF6',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    courseTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#111827',
        lineHeight: 24,
        marginBottom: 10,
    },
    instructorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    instructorName: {
        color: '#6B7280',
        fontSize: 13,
        marginLeft: 6,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 5,
    },
    loadingContainer: {
        padding: 50,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        color: '#6B7280',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        color: '#9CA3AF',
        marginTop: 15,
    },
    clearBtn: {
        marginTop: 20,
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    clearBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});

export default ELearning;
