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
import { useTheme } from '../../contexts/ThemeContext';
import { handleImageUpload } from '../../utils/imageUpload';
import { addOrganization } from '../../services/orgService';

const AddOrganization = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const [formData, setFormData] = useState({
        orgName: '',
        email: '',
        phone: '',
        website: '',
        address: '',
        description: '',
        profileImage: '',
    });

    const handlePickImage = async () => {
        try {
            setUploadingImage(true);
            const imageUrl = await handleImageUpload();
            if (imageUrl) {
                setFormData(prev => ({ ...prev, profileImage: imageUrl }));
            }
        } catch (error: any) {
            if (error.message !== 'User cancelled') {
                Alert.alert('Upload Failed', 'There was an error uploading your image. Please try again.');
            }
        } finally {
            setUploadingImage(false);
        }
    };

    const validateForm = () => {
        const { orgName, email, phone, address, description, profileImage } = formData;
        if (!orgName || !email || !phone || !address || !description || !profileImage) {
            return 'Please fill in all required fields marked with *';
        }
        if (!email.includes('@')) {
            return 'Please enter a valid email address';
        }
        return null;
    };

    const handleSubmit = async () => {
        const error = validateForm();
        if (error) {
            Alert.alert('Validation Error', error);
            return;
        }

        try {
            setLoading(true);
            const response = await addOrganization(formData);
            if (response.success) {
                Alert.alert(
                    'Success',
                    'Your organization has been submitted and is pending approval.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Error', response.message || 'Failed to add organization');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, isDark && { backgroundColor: '#0f172a' }, { paddingTop: insets.top }]}
        >
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFFFFF"} />

            <View style={[styles.header, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#f8fafc" : "#1F2937"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Add Organization</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.formContainer}>
                    <Text style={[styles.formSubtitle, isDark && { color: '#64748b' }]}>TELL US ABOUT YOUR ORGANIZATION</Text>

                    {/* Image Picker */}
                    <View style={styles.imageSelectorContainer}>
                        <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>Profile Image *</Text>
                        <TouchableOpacity
                            style={[styles.imagePlaceholder, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}
                            onPress={handlePickImage}
                            disabled={uploadingImage}
                        >
                            {formData.profileImage ? (
                                <Image source={{ uri: formData.profileImage }} style={styles.selectedImage} />
                            ) : (
                                <View style={styles.placeholderContent}>
                                    {uploadingImage ? (
                                        <ActivityIndicator color={isDark ? "#14b8a6" : "#6366F1"} />
                                    ) : (
                                        <>
                                            <Ionicons name="camera" size={32} color={isDark ? "#334155" : "#9CA3AF"} />
                                            <Text style={[styles.placeholderText, isDark && { color: '#475569' }]}>Select Logo / Image</Text>
                                        </>
                                    )}
                                </View>
                            )}
                            {formData.profileImage && !uploadingImage && (
                                <View style={styles.editOverlay}>
                                    <Ionicons name="pencil" size={16} color="#FFFFFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Inputs */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>Organization Name *</Text>
                        <TextInput
                            style={[styles.input, isDark && { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }]}
                            placeholder="e.g. Save The Future"
                            placeholderTextColor={isDark ? "#475569" : "#9CA3AF"}
                            value={formData.orgName}
                            onChangeText={text => setFormData({ ...formData, orgName: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>Email Address *</Text>
                        <TextInput
                            style={[styles.input, isDark && { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }]}
                            placeholder="org@example.com"
                            placeholderTextColor={isDark ? "#475569" : "#9CA3AF"}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={formData.email}
                            onChangeText={text => setFormData({ ...formData, email: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>Phone Number *</Text>
                        <TextInput
                            style={[styles.input, isDark && { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }]}
                            placeholder="+880 1XXX-XXXXXX"
                            placeholderTextColor={isDark ? "#475569" : "#9CA3AF"}
                            keyboardType="phone-pad"
                            value={formData.phone}
                            onChangeText={text => setFormData({ ...formData, phone: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>Website (Optional)</Text>
                        <TextInput
                            style={[styles.input, isDark && { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }]}
                            placeholder="https://www.example.org"
                            placeholderTextColor={isDark ? "#475569" : "#9CA3AF"}
                            autoCapitalize="none"
                            value={formData.website}
                            onChangeText={text => setFormData({ ...formData, website: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>Full Address *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, isDark && { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }]}
                            placeholder="Street, City, Country"
                            placeholderTextColor={isDark ? "#475569" : "#9CA3AF"}
                            multiline
                            numberOfLines={3}
                            value={formData.address}
                            onChangeText={text => setFormData({ ...formData, address: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, isDark && { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }]}
                            placeholder="Describe what your organization does..."
                            placeholderTextColor={isDark ? "#475569" : "#9CA3AF"}
                            multiline
                            numberOfLines={5}
                            value={formData.description}
                            onChangeText={text => setFormData({ ...formData, description: text })}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, isDark && { backgroundColor: '#14b8a6', shadowColor: '#14b8a6' }, loading && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.submitBtnText}>Create Organization</Text>
                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default AddOrganization;

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
        paddingBottom: 40,
    },
    formContainer: {
        padding: 24,
    },
    formSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 24,
        textAlign: 'center',
    },
    imageSelectorContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    imagePlaceholder: {
        width: '100%',
        height: 160,
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    placeholderContent: {
        alignItems: 'center',
        gap: 8,
    },
    placeholderText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    selectedImage: {
        width: '100%',
        height: '100%',
    },
    editOverlay: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputGroup: {
        marginBottom: 20,
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
        paddingTop: 12,
    },
    submitBtn: {
        backgroundColor: '#6366F1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: 10,
        gap: 8,
        elevation: 4,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    submitBtnDisabled: {
        backgroundColor: '#A5A6F6',
        elevation: 0,
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
