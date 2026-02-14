import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const fetchStudentDashboard = async (courseId: string) => {
    // This calls the existing endpoint: /courses/:courseId/student-dashboard
    // Assuming it returns: { success: true, data: { overallStats: {...}, students: [...] } }
    const response = await get<any>(`/courses/${courseId}/student-dashboard`);
    return response.data;
};

const CommunityStudentDashboard = ({ route, navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { courseId } = route.params;
    const [searchQuery, setSearchQuery] = useState('');

    const { data: dashboardData, isLoading, error } = useQuery({
        queryKey: ['student-dashboard', courseId],
        queryFn: () => fetchStudentDashboard(courseId),
    });

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Loading Dashboard...</Text>
            </View>
        );
    }

    if (error || !dashboardData) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={50} color="#EF4444" />
                <Text style={styles.errorText}>Failed to load dashboard data.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryBtn}>
                    <Text style={styles.retryText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { overallStats, students } = dashboardData;

    // Filter students based on search
    const filteredStudents = students.filter((s: any) =>
        s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student.number.includes(searchQuery)
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: insets.top }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Student Dashboard</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
                {/* Header Stats */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>Course Overview</Text>
                    <View style={styles.statsGrid}>
                        <StatCard
                            title="Total Students"
                            value={overallStats.totalStudents}
                            icon="people"
                            color="#4F46E5"
                        />
                        <StatCard
                            title="Pass Rate"
                            value={`${overallStats.passRate}%`}
                            icon="pie-chart"
                            color="#10B981"
                        />
                        <StatCard
                            title="Exams Taken"
                            value={overallStats.totalExamsTaken}
                            icon="document-text"
                            color="#F59E0B"
                        />
                        <StatCard
                            title="Certificates"
                            value={overallStats.certificatesIssued}
                            icon="ribbon"
                            color="#EC4899"
                        />
                    </View>
                </View>

                {/* Student List */}
                <View style={styles.studentListContainer}>
                    <Text style={styles.sectionTitle}>Enrolled Students ({filteredStudents.length})</Text>

                    {filteredStudents.map((studentItem: any, index: number) => (
                        <StudentCard key={index} studentData={studentItem} navigation={navigation} />
                    ))}

                    {filteredStudents.length === 0 && (
                        <Text style={styles.emptyText}>No students found.</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const StatCard = ({ title, value, icon, color }: any) => (
    <View style={styles.statCard}>
        <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
    </View>
);

const StudentCard = ({ studentData, navigation }: any) => {
    const { student, statistics } = studentData;
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={styles.studentCard}>
            <TouchableOpacity
                style={styles.studentHeader}
                onPress={() => setExpanded(!expanded)}
            >
                <Image
                    source={{ uri: student.profileImage || 'https://via.placeholder.com/50' }}
                    style={styles.avatar}
                />
                <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentNumber}>{student.number}</Text>
                </View>
                <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>
                        {statistics.passedAttempts}/{statistics.totalAttempts} Passed
                    </Text>
                </View>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.expandedDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Average Score:</Text>
                        <Text style={styles.detailValue}>{statistics.averageScore?.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Lessons Completed:</Text>
                        <Text style={styles.detailValue}>{statistics.completedLessons}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Certificate:</Text>
                        <Text style={[styles.detailValue, { color: statistics.hasCertificate ? '#10B981' : '#EF4444' }]}>
                            {statistics.hasCertificate ? 'Issued' : 'Not yet'}
                        </Text>
                    </View>

                    {/* Exam Results List could be added here for deeper drill-down */}
                    {studentData.examResults?.length > 0 && (
                        <View style={styles.examList}>
                            <Text style={styles.subHeader}>Recent Exams</Text>
                            {studentData.examResults.slice(0, 3).map((exam: any, idx: number) => (
                                <View key={idx} style={styles.examItem}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.examName} numberOfLines={1}>{exam.chapterTitle}</Text>
                                        {exam.latestAttempt && exam.latestAttempt.graded === false && (
                                            <TouchableOpacity
                                                style={styles.gradeBadge}
                                                onPress={() => navigation.navigate('CommunityExamGrading', {
                                                    attempt: exam.latestAttempt,
                                                    studentName: student.name
                                                })}
                                            >
                                                <Text style={styles.gradeBadgeText}>Grade Now</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.examScore,
                                        { color: exam.latestAttempt?.graded === false ? '#F59E0B' : (exam.latestAttempt?.passed ? '#10B981' : '#EF4444') }
                                    ]}>
                                        {exam.latestAttempt
                                            ? (exam.latestAttempt.graded === false ? 'Pending' : `${exam.latestAttempt.score}%`)
                                            : 'Not taken'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 16,
        marginVertical: 10,
    },
    retryBtn: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    statsContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 10,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    statTitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    studentListContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        flex: 1,
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 20,
    },
    studentCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        marginBottom: 10,
        overflow: 'hidden',
    },
    studentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#E5E7EB',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    studentNumber: {
        fontSize: 12,
        color: '#6B7280',
    },
    progressBadge: {
        backgroundColor: '#F0FDFA',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    progressText: {
        fontSize: 10,
        color: '#0F766E',
        fontWeight: '600',
    },
    expandedDetails: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    examList: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    subHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 6,
    },
    examItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    examName: {
        fontSize: 12,
        color: '#6B7280',
        flex: 1,
    },
    examScore: {
        fontSize: 12,
        fontWeight: '600',
    },
    gradeBadge: {
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#4F46E5',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    gradeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#4F46E5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
});

export default CommunityStudentDashboard;
