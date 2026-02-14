import React, { useState, useEffect } from 'react';
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
import { createCommunity, updateCommunity } from '../../services/communityService';

const CreateCommunityScreen = ({ navigation, route }: any) => {
    const insets = useSafeAreaInsets();
    const editData = route.params?.community;
    const isEdit = !!editData;

    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    const [formData, setFormData] = useState({
        name: editData?.name || '',
        description: editData?.description || '',
        category: editData?.category || '',
        logo: editData?.logo || '',
        coverImage: editData?.coverImage || '',
    });

    const handlePickImage = async (type: 'logo' | 'cover') => {
        try {
            if (type === 'logo') setUploadingLogo(true);
            else setUploadingCover(true);

            const imageUrl = await handleImageUpload();
            if (imageUrl) {
                setFormData(prev => ({ ...prev, [type === 'logo' ? 'logo' : 'coverImage']: imageUrl }));
            }
        } catch (error: any) {
            if (error.message !== 'User cancelled') {
                Alert.alert('Upload Failed', 'There was an error uploading your image.');
            }
        } finally {
            if (type === 'logo') setUploadingLogo(false);
            else setUploadingCover(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.description || !formData.category || !formData.logo) {
            Alert.alert('Validation Error', 'Please fill in all required fields and upload a logo.');
            return;
        }

        try {
            setLoading(true);
            let result;
            if (isEdit) {
                result = await updateCommunity(editData._id, formData);
            } else {
                result = await createCommunity(formData);
            }

            if (result.success) {
                Alert.alert(
                    'Success',
                    isEdit ? 'Community updated successfully!' : 'Community created successfully! It will be reviewed by our team.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Error', `Failed to ${isEdit ? 'update' : 'create'} community. Please try again.`);
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const categories = ['Education', 'Technology', 'Science', 'Arts', 'Social', 'Other'];

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
                <Text style={styles.headerTitle}>{isEdit ? 'Edit Community' : 'Create Community'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.form}>
                    {/* Cover Image */}
                    <Text style={styles.label}>Cover Image</Text>
                    <TouchableOpacity
                        style={styles.coverPicker}
                        onPress={() => handlePickImage('cover')}
                        disabled={uploadingCover}
                    >
                        {formData.coverImage ? (
                            <Image source={{ uri: formData.coverImage }} style={styles.coverPreview} />
                        ) : (
                            <View style={styles.placeholder}>
                                {uploadingCover ? (
                                    <ActivityIndicator color="#0D9488" />
                                ) : (
                                    <>
                                        <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                                        <Text style={styles.placeholderText}>Select Cover Image</Text>
                                    </>
                                )}
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Logo */}
                    <View style={styles.logoRow}>
                        <TouchableOpacity
                            style={styles.logoPicker}
                            onPress={() => handlePickImage('logo')}
                            disabled={uploadingLogo}
                        >
                            {formData.logo ? (
                                <Image source={{ uri: formData.logo }} style={styles.logoPreview} />
                            ) : (
                                <View style={styles.placeholder}>
                                    {uploadingLogo ? (
                                        <ActivityIndicator color="#0D9488" />
                                    ) : (
                                        <Ionicons name="camera" size={30} color="#9CA3AF" />
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={styles.logoInfo}>
                            <Text style={styles.label}>Community Logo *</Text>
                            <Text style={styles.hintText}>Upload a square image for better results.</Text>
                        </View>
                    </View>

                    <Text style={styles.label}>Community Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter a catchy name"
                        value={formData.name}
                        onChangeText={text => setFormData({ ...formData, name: text })}
                    />

                    <Text style={styles.label}>Description *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="What's this community about?"
                        multiline
                        numberOfLines={4}
                        value={formData.description}
                        onChangeText={text => setFormData({ ...formData, description: text })}
                    />

                    <Text style={styles.label}>Category *</Text>
                    <View style={styles.categoryContainer}>
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.categoryChip,
                                    formData.category === cat && styles.activeChip
                                ]}
                                onPress={() => setFormData({ ...formData, category: cat })}
                            >
                                <Text style={[
                                    styles.chipText,
                                    formData.category === cat && styles.activeChipText
                                ]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitBtnText}>{isEdit ? 'Update Community' : 'Create Community'}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

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
    },
    hintText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
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
        height: 100,
        textAlignVertical: 'top',
    },
    coverPicker: {
        width: '100%',
        height: 150,
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    coverPreview: {
        width: '100%',
        height: '100%',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoPicker: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    logoPreview: {
        width: '100%',
        height: '100%',
    },
    logoInfo: {
        marginLeft: 15,
        flex: 1,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeChip: {
        backgroundColor: '#0D9488',
        borderColor: '#0D9488',
    },
    chipText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    activeChipText: {
        color: '#FFFFFF',
    },
    submitBtn: {
        backgroundColor: '#0D9488',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        elevation: 4,
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    disabledBtn: {
        backgroundColor: '#99F6E4',
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
        fontWeight: '500',
    },
});

export default CreateCommunityScreen;
