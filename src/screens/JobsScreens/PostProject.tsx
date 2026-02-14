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
import { createProject } from '../../services/jobService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PostProject = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [budgetType, setBudgetType] = useState<'fixed' | 'hourly'>('fixed');
    const [budget, setBudget] = useState('');
    const [skills, setSkills] = useState('');
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        if (!title.trim()) return 'Project title is required';
        if (!description.trim()) return 'Description is required';
        if (!category.trim()) return 'Category is required';
        if (!budget.trim()) return budgetType === 'fixed' ? 'Budget is required' : 'Hourly rate is required';
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
            const skillsArray = skills.split(',').map((s) => s.trim()).filter((s) => s);

            const payload: any = {
                title,
                description,
                category,
                budgetType,
                skills: skillsArray,
                deadline: deadline || null,
            };

            if (budgetType === 'fixed') {
                payload.budget = Number(budget);
            } else {
                payload.hourlyRate = Number(budget);
            }
            const response = await createProject(payload);

            if (response.success || response.data?.success) {
                Alert.alert('Success', 'Project posted successfully!', [
                    {
                        text: 'OK',
                        onPress: () => {
                            const projectId = response.data?._id || response.data?.data?._id || response._id;
                            navigation.replace('ProjectDetails', { projectId });
                        },
                    },
                ]);
            } else {
                Alert.alert('Error', response.message || response.data?.message || 'Failed to post project');
            }
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', e.response?.data?.message || 'Failed to post project. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post a Project</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.formCard}>
                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Project Title *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Need a mobile app developer"
                            placeholderTextColor="#9CA3AF"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe your project in detail..."
                            placeholderTextColor="#9CA3AF"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Category *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Mobile Development, Design"
                            placeholderTextColor="#9CA3AF"
                            value={category}
                            onChangeText={setCategory}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Budget Type *</Text>
                        <View style={styles.budgetTypeContainer}>
                            <TouchableOpacity
                                style={[styles.typeButton, budgetType === 'fixed' && styles.typeButtonActive]}
                                onPress={() => setBudgetType('fixed')}
                            >
                                <Ionicons
                                    name="cash-outline"
                                    size={18}
                                    color={budgetType === 'fixed' ? '#fff' : '#4B5563'}
                                />
                                <Text style={[styles.typeButtonText, budgetType === 'fixed' && styles.typeButtonTextActive]}>
                                    Fixed Price
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeButton, budgetType === 'hourly' && styles.typeButtonActive]}
                                onPress={() => setBudgetType('hourly')}
                            >
                                <Ionicons
                                    name="time-outline"
                                    size={18}
                                    color={budgetType === 'hourly' ? '#fff' : '#4B5563'}
                                />
                                <Text style={[styles.typeButtonText, budgetType === 'hourly' && styles.typeButtonTextActive]}>
                                    Hourly Rate
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>
                            {budgetType === 'fixed' ? 'Total Budget (৳) *' : 'Hourly Rate (৳) *'}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder={budgetType === 'fixed' ? 'e.g. 5000' : 'e.g. 500'}
                            placeholderTextColor="#9CA3AF"
                            value={budget}
                            onChangeText={(text) => setBudget(text.replace(/[^0-9]/g, ''))}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Skills Required</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. React Native, UI/UX, Firebase"
                            placeholderTextColor="#9CA3AF"
                            value={skills}
                            onChangeText={setSkills}
                        />
                        <Text style={styles.helpText}>Separate skills with commas</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Deadline (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#9CA3AF"
                            value={deadline}
                            onChangeText={setDeadline}
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
                                <Ionicons name="rocket-outline" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>Post Project</Text>
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
    budgetTypeContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    typeButtonActive: {
        backgroundColor: '#10B981',
        borderColor: '#059669',
    },
    typeButtonText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '600',
    },
    typeButtonTextActive: {
        color: '#fff',
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
        backgroundColor: '#10B981',
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

export default PostProject;
