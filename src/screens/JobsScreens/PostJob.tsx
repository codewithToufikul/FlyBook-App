import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    StatusBar,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createJob } from '../../services/jobService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PostJob = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: '',
        location: '',
        jobType: 'Full-time',
        experienceLevel: 'Any',
        salaryMin: '',
        salaryMax: '',
        deadline: '',
    });
    const [loading, setLoading] = useState(false);

    const onChange = (name: string, value: string) => {
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!form.title.trim()) return 'Job title is required';
        if (!form.description.trim()) return 'Description is required';
        if (!form.category.trim()) return 'Category is required';
        if (!form.location.trim()) return 'Location is required';
        if (!form.deadline.trim()) return 'Deadline is required';
        return null;
    };

    const handleSubmit = async () => {
        const error = validateForm();
        if (error) {
            Alert.alert('Error', error);
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...form,
                salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
                salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
            };
            const response = await createJob(payload);

            if (response.success || response.data?.success) {
                Alert.alert('Success', 'Job posted successfully!', [
                    {
                        text: 'OK',
                        onPress: () => {
                            const jobId = response.data?._id || response.data?.data?._id || response._id || response.data?.[0]?._id;
                            navigation.replace('JobDetails', { jobId });
                        },
                    },
                ]);
            } else {
                Alert.alert('Error', response.message || response.data?.message || 'Failed to post job');
            }
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e.response?.data?.message || 'Failed to post job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderSelect = (label: string, name: string, options: string[]) => (
        <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{label}</Text>
            <View style={styles.optionsContainer}>
                {options.map((option) => (
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.optionChip,
                            form[name as keyof typeof form] === option && styles.optionChipActive,
                        ]}
                        onPress={() => onChange(name, option)}
                    >
                        <Text
                            style={[
                                styles.optionChipText,
                                form[name as keyof typeof form] === option && styles.optionChipTextActive,
                            ]}
                        >
                            {option}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post a Job</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.formCard}>
                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Job Title *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Senior React Developer"
                            placeholderTextColor="#9CA3AF"
                            value={form.title}
                            onChangeText={(text) => onChange('title', text)}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Job Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe the job role, requirements, and benefits..."
                            placeholderTextColor="#9CA3AF"
                            value={form.description}
                            onChangeText={(text) => onChange('description', text)}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.formLabel}>Category *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. IT, Design"
                                placeholderTextColor="#9CA3AF"
                                value={form.category}
                                onChangeText={(text) => onChange('category', text)}
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.formLabel}>Location *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Dhaka, Remote"
                                placeholderTextColor="#9CA3AF"
                                value={form.location}
                                onChangeText={(text) => onChange('location', text)}
                            />
                        </View>
                    </View>

                    {renderSelect('Job Type', 'jobType', [
                        'Full-time',
                        'Part-time',
                        'Contract',
                        'Internship',
                        'Remote',
                    ])}

                    {renderSelect('Experience Level', 'experienceLevel', [
                        'Any',
                        'Entry',
                        'Mid',
                        'Senior',
                        'Lead',
                    ])}

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.formLabel}>Min Salary (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor="#9CA3AF"
                                value={form.salaryMin}
                                onChangeText={(text) => onChange('salaryMin', text.replace(/[^0-9]/g, ''))}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.formLabel}>Max Salary (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor="#9CA3AF"
                                value={form.salaryMax}
                                onChangeText={(text) => onChange('salaryMax', text.replace(/[^0-9]/g, ''))}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Deadline *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#9CA3AF"
                            value={form.deadline}
                            onChangeText={(text) => onChange('deadline', text)}
                        />
                        <Text style={styles.helpText}>Enter date in YYYY-MM-DD format</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>Post Job Now</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    backButton: {
        padding: 4,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    formGroup: {
        marginBottom: 20,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#1F2937',
    },
    textArea: {
        height: 150,
        paddingTop: 12,
    },
    row: {
        flexDirection: 'row',
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionChip: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optionChipActive: {
        backgroundColor: '#DBEAFE',
        borderColor: '#3B82F6',
    },
    optionChipText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    },
    optionChipTextActive: {
        color: '#1D4ED8',
        fontWeight: '600',
    },
    helpText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
        marginTop: 10,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PostJob;
