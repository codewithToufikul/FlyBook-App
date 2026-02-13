import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get } from '../../services/api';

const { width } = Dimensions.get('window');

interface Video {
    videoTitle: string;
    videoDescription: string;
    videoUrl: string;
    videoType: string;
    videoDuration: string;
}

interface Course {
    _id: string;
    title: string;
    description: string;
    thumbnail: string;
    instructorName: string;
    instructorEmail: string;
    instructorBio?: string;
    categories: string;
    level: string;
    isFree: boolean;
    price: number;
    videos: Video[];
    rating?: number;
    totalStudents?: number;
    lastUpdated?: string;
}

const fetchCourseDetails = async (courseId: string): Promise<Course> => {
    const response = await get<Course>(`/api/courses/${courseId}`);
    return response;
};

const CourseDetails = ({ route, navigation }: any) => {
    const { courseId } = route.params;
    const [activeTab, setActiveTab] = useState('overview');

    const { data: course, isLoading, error } = useQuery({
        queryKey: ['course', courseId],
        queryFn: () => fetchCourseDetails(courseId),
    });

    const getLevelColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'beginner': return '#10B981';
            case 'intermediate': return '#F59E0B';
            case 'advanced': return '#EF4444';
            default: return '#6B7280';
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Fetching course details...</Text>
            </View>
        );
    }

    if (error || !course) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text style={styles.errorText}>Failed to load course details</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero / Thumbnail */}
                <View style={styles.heroSection}>
                    <Image source={{ uri: course.thumbnail }} style={styles.heroImage} />
                    <TouchableOpacity
                        style={styles.backCircle}
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.playOverlay}>
                        <TouchableOpacity
                            style={styles.playBtn}
                            onPress={() => navigation.navigate('CoursePlayer', { courseId: course._id })}
                        >
                            <Ionicons name="play" size={40} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={styles.mainInfo}>
                        <View style={styles.categoryRow}>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{course.categories}</Text>
                            </View>
                            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(course.level) + '20' }]}>
                                <Text style={[styles.levelText, { color: getLevelColor(course.level) }]}>{course.level}</Text>
                            </View>
                        </View>
                        <Text style={styles.title}>{course.title}</Text>

                        <View style={styles.quickStats}>
                            <View style={styles.stat}>
                                <Ionicons name="star" size={16} color="#FBBF24" />
                                <Text style={styles.statValue}>{course.rating || '4.8'}</Text>
                            </View>
                            <View style={styles.stat}>
                                <Ionicons name="people" size={16} color="#3B82F6" />
                                <Text style={styles.statValue}>{(course.totalStudents || 1200).toLocaleString()} students</Text>
                            </View>
                            <View style={styles.stat}>
                                <Ionicons name="videocam" size={16} color="#8B5CF6" />
                                <Text style={styles.statValue}>{course.videos?.length || 0} lessons</Text>
                            </View>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
                            onPress={() => setActiveTab('overview')}
                        >
                            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'curriculum' && styles.activeTab]}
                            onPress={() => setActiveTab('curriculum')}
                        >
                            <Text style={[styles.tabText, activeTab === 'curriculum' && styles.activeTabText]}>Curriculum</Text>
                        </TouchableOpacity>
                    </View>

                    {activeTab === 'overview' ? (
                        <View style={styles.overviewSection}>
                            <Text style={styles.sectionTitle}>About this course</Text>
                            <Text style={styles.description}>{course.description}</Text>

                            <Text style={styles.sectionTitle}>Instructor</Text>
                            <View style={styles.instructorCard}>
                                <View style={styles.instructorHeader}>
                                    <View style={styles.instructorAvatar}>
                                        <Text style={styles.avatarText}>{course.instructorName[0]}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.instructorName}>{course.instructorName}</Text>
                                        <Text style={styles.instructorEmail}>{course.instructorEmail}</Text>
                                    </View>
                                </View>
                                {course.instructorBio && (
                                    <Text style={styles.instructorBio}>{course.instructorBio}</Text>
                                )}
                            </View>

                            <View style={styles.metaInfo}>
                                <View style={styles.metaRow}>
                                    <Text style={styles.metaLabel}>Last Updated</Text>
                                    <Text style={styles.metaValue}>{course.lastUpdated || 'Recently'}</Text>
                                </View>
                                <View style={styles.metaRow}>
                                    <Text style={styles.metaLabel}>Price</Text>
                                    <Text style={styles.metaValue}>{course.isFree ? 'Free' : `$${course.price}`}</Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.curriculumSection}>
                            <View style={styles.curriculumHeader}>
                                <Text style={styles.sectionTitle}>Course Content</Text>
                                <Text style={styles.curriculumStats}>{course.videos?.length || 0} lessons</Text>
                            </View>
                            {course.videos?.map((video, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.lessonItem}
                                    onPress={() => navigation.navigate('CoursePlayer', { courseId: course._id, initialIndex: index })}
                                >
                                    <View style={styles.lessonIndex}>
                                        <Text style={styles.lessonIndexText}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.lessonInfo}>
                                        <Text style={styles.lessonTitle} numberOfLines={1}>{video.videoTitle}</Text>
                                        <Text style={styles.lessonDuration}>{video.videoDuration}</Text>
                                    </View>
                                    <Ionicons name="play-circle" size={24} color="#3B82F6" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View style={styles.bottomBar}>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Price</Text>
                    <Text style={styles.priceValue}>{course.isFree ? 'Free' : `$${course.price}`}</Text>
                </View>
                <TouchableOpacity
                    style={styles.enrollBtn}
                    onPress={() => navigation.navigate('CoursePlayer', { courseId: course._id })}
                >
                    <Text style={styles.enrollBtnText}>Start Learning</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    heroSection: {
        width: '100%',
        height: 280,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    backCircle: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    playOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    playBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(59, 130, 246, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    content: {
        padding: 20,
    },
    mainInfo: {
        marginBottom: 25,
    },
    categoryRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    categoryBadge: {
        backgroundColor: '#F5F3FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 10,
    },
    categoryText: {
        color: '#8B5CF6',
        fontSize: 12,
        fontWeight: 'bold',
    },
    levelBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    levelText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        lineHeight: 32,
        marginBottom: 15,
    },
    quickStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        marginLeft: 5,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 20,
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginRight: 10,
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: '#3B82F6',
    },
    tabText: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#3B82F6',
    },
    overviewSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
        marginBottom: 25,
    },
    instructorCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 15,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 20,
    },
    instructorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    instructorAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    instructorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    instructorEmail: {
        fontSize: 12,
        color: '#6B7280',
    },
    instructorBio: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 20,
    },
    metaInfo: {
        gap: 12,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    metaLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    metaValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    curriculumSection: {
        marginBottom: 30,
    },
    curriculumHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    curriculumStats: {
        fontSize: 12,
        color: '#6B7280',
    },
    lessonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    lessonIndex: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    lessonIndexText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4B5563',
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    lessonDuration: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 35,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    priceContainer: {
        marginRight: 25,
    },
    priceLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    priceValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    enrollBtn: {
        flex: 1,
        backgroundColor: '#3B82F6',
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    enrollBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 15,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        marginVertical: 15,
    },
    backBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#3B82F6',
    },
    backBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});

export default CourseDetails;
