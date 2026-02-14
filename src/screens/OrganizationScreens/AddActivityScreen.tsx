import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StatusBar,
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { handleImageUpload } from '../../utils/imageUpload';
import { addActivity } from '../../services/orgService';

const AddActivity = ({ route, navigation }: any) => {
    const { orgId } = route.params;
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        details: '',
        place: '',
        date: new Date().toISOString().split('T')[0],
        image: '',
        organizationId: orgId,
    });

    const handlePickImage = async () => {
        try {
            setUploadingImage(true);
            const imageUrl = await handleImageUpload();
            if (imageUrl) {
                setFormData(prev => ({ ...prev, image: imageUrl }));
            }
        } catch (error: any) {
            if (error.message !== 'User cancelled') {
                Alert.alert('Upload Failed', 'There was an error uploading your image. Please try again.');
            }
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.details || !formData.place || !formData.image) {
            Alert.alert('Validation Error', 'Please fill in all required fields and upload an image.');
            return;
        }

        try {
            setLoading(true);
            const response = await addActivity(formData);
            if (response.success) {
                Alert.alert(
                    'Success',
                    'Activity posted successfully!',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Error', response.message || 'Failed to post activity');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post Activity</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.form}>
                    <Text style={styles.label}>Activity Title *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="What's happening?"
                        value={formData.title}
                        onChangeText={text => setFormData({ ...formData, title: text })}
                    />

                    <Text style={styles.label}>Location / Place *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Where is it taking place?"
                        value={formData.place}
                        onChangeText={text => setFormData({ ...formData, place: text })}
                    />

                    <Text style={styles.label}>Event Date (YYYY-MM-DD) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="2024-05-20"
                        value={formData.date}
                        onChangeText={text => setFormData({ ...formData, date: text })}
                    />

                    <Text style={styles.label}>Details *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Provide more information about the activity..."
                        multiline
                        numberOfLines={6}
                        value={formData.details}
                        onChangeText={text => setFormData({ ...formData, details: text })}
                    />

                    <Text style={styles.label}>Activity Banner *</Text>
                    <TouchableOpacity
                        style={styles.imagePicker}
                        onPress={handlePickImage}
                        disabled={uploadingImage}
                    >
                        {formData.image ? (
                            <Image source={{ uri: formData.image }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.placeholder}>
                                {uploadingImage ? (
                                    <ActivityIndicator color="#6366F1" />
                                ) : (
                                    <>
                                        <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                                        <Text style={styles.placeholderText}>Select Banner Image</Text>
                                    </>
                                )}
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitBtnText}>Post Activity</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default AddActivity;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    scrollContent: {
        padding: 24,
    },
    form: {
        gap: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: -12,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    imagePicker: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    placeholderText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    submitBtn: {
        backgroundColor: '#6366F1',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        elevation: 4,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    disabledBtn: {
        backgroundColor: '#A5A6F6',
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
