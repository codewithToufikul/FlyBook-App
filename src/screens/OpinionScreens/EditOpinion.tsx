import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { put } from '../../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { handleImageUpload } from '../../utils/imageUpload';
import { handlePdfUpload } from '../../utils/pdfupload';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

type PrivacyType = 'public' | 'friends' | 'only me';

interface PrivacyOption {
    value: PrivacyType;
    label: string;
    icon: string;
    description: string;
}

const privacyOptions: PrivacyOption[] = [
    {
        value: 'public',
        label: 'Public',
        icon: 'globe-outline',
        description: 'Anyone can see this post',
    },
    {
        value: 'friends',
        label: 'Friends',
        icon: 'people-outline',
        description: 'Only your friends can see',
    },
    {
        value: 'only me',
        label: 'Only Me',
        icon: 'lock-closed-outline',
        description: 'Only you can see this',
    },
];

const EditOpinion = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const editingPost = (route.params as any)?.post;

    if (!editingPost) {
        navigation.goBack();
        return null;
    }

    // Form states
    const [description, setDescription] = useState(editingPost.description || '');
    const [selectedImage, setSelectedImage] = useState<string | null>(editingPost.image || editingPost.imageUrl || null);
    const [selectedPdf, setSelectedPdf] = useState<{
        url: string;
        name: string;
    } | null>(editingPost.pdf ? { url: editingPost.pdf, name: 'Attached PDF' } : null);
    const [privacy, setPrivacy] = useState<PrivacyType>(editingPost.privacy || 'public');
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    // Loading states
    const [isPosting, setIsPosting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isUploadingPdf, setIsUploadingPdf] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Handle image upload
    const handleSelectImage = async () => {
        try {
            setIsUploadingImage(true);
            const imageUrl = await handleImageUpload();

            if (imageUrl) {
                setSelectedImage(imageUrl);
                Toast.show({
                    type: 'success',
                    text1: 'Image updated successfully!',
                });
            }
        } catch (error: any) {
            if (error.message !== 'User cancelled') {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to upload image',
                });
            }
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Handle PDF upload
    const handleSelectPdf = async () => {
        try {
            setIsUploadingPdf(true);
            const result = await handlePdfUpload((progress) => {
                setUploadProgress(progress);
            });

            if (result?.secureUrl) {
                setSelectedPdf({
                    url: result.secureUrl,
                    name: result.originalFilename || 'document.pdf',
                });
                Toast.show({
                    type: 'success',
                    text1: 'PDF updated successfully!',
                });
            }
        } catch (error: any) {
            if (error.message !== 'User cancelled PDF picker') {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to upload PDF',
                });
            }
        } finally {
            setIsUploadingPdf(false);
            setUploadProgress(0);
        }
    };

    // Remove handlers
    const handleRemoveImage = () => {
        Alert.alert('Remove Image', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => setSelectedImage(null) },
        ]);
    };

    const handleRemovePdf = () => {
        Alert.alert('Remove PDF', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => setSelectedPdf(null) },
        ]);
    };

    // Handle Update
    const handleUpdatePost = async () => {
        if (!description.trim()) {
            Toast.show({ type: 'error', text1: 'Description cannot be empty' });
            return;
        }

        try {
            setIsPosting(true);

            const postData = {
                description: description.trim(),
                image: selectedImage || '',
                pdf: selectedPdf?.url || '',
                privacy,
            };

            const response = await put<{ success: boolean; message?: string }>(
                `/opinion/edit/${editingPost._id}`,
                postData
            );

            if (response?.success) {
                Toast.show({ type: 'success', text1: 'Post updated successfully' });
                navigation.goBack();
            } else {
                throw new Error(response?.message || 'Failed to update post');
            }
        } catch (error: any) {
            console.error('Update error:', error);
            Toast.show({
                type: 'error',
                text1: 'Failed to update post',
                text2: error?.message,
            });
        } finally {
            setIsPosting(false);
        }
    };

    const getPrivacyIcon = () => {
        const option = privacyOptions.find((opt) => opt.value === privacy);
        return option?.icon || 'globe-outline';
    };

    const bg = isDark ? '#0f172a' : '#FFFFFF';
    const cardBg = isDark ? '#1e293b' : '#FFFFFF';
    const border = isDark ? '#334155' : '#E5E7EB';
    const titleColor = isDark ? '#f8fafc' : '#111827';
    const subtitleColor = isDark ? '#64748b' : '#374151';

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <SafeAreaView style={[styles.header, { borderBottomColor: border, backgroundColor: isDark ? '#0f172a' : '#FFFFFF' }]}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                    disabled={isPosting}
                >
                    <Ionicons name="close" size={28} color={isDark ? '#f8fafc' : '#111827'} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: titleColor }]}>Edit Opinion</Text>

                <TouchableOpacity
                    style={[
                        styles.postButton,
                        (!description.trim() || isPosting) && styles.postButtonDisabled,
                    ]}
                    onPress={handleUpdatePost}
                    disabled={!description.trim() || isPosting}
                >
                    {isPosting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.postButtonText}>Save</Text>
                    )}
                </TouchableOpacity>
            </SafeAreaView>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* User Info */}
                <View style={styles.userSection}>
                    <Image
                        source={{ uri: user?.profileImage || 'https://via.placeholder.com/50' }}
                        style={styles.userImage}
                    />
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: titleColor }]}>{user?.name || 'User'}</Text>
                        <TouchableOpacity
                            style={[styles.privacyButton, { backgroundColor: isDark ? '#334155' : '#F3F4F6' }]}
                            onPress={() => setShowPrivacyModal(!showPrivacyModal)}
                        >
                            <Ionicons name={getPrivacyIcon()} size={14} color={isDark ? '#94a3b8' : '#65676B'} />
                            <Text style={[styles.privacyButtonText, { color: isDark ? '#94a3b8' : '#65676B' }]}>
                                {privacy.charAt(0).toUpperCase() + privacy.slice(1)}
                            </Text>
                            <Ionicons name="chevron-down" size={14} color={isDark ? '#94a3b8' : '#65676B'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Privacy Selection */}
                {showPrivacyModal && (
                    <View style={[styles.privacyModal, { backgroundColor: cardBg }]}>
                        {privacyOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.privacyOption,
                                    privacy === option.value && { backgroundColor: isDark ? '#1e3a5f' : '#EBF5FF' },
                                ]}
                                onPress={() => {
                                    setPrivacy(option.value);
                                    setShowPrivacyModal(false);
                                }}
                            >
                                <Ionicons name={option.icon} size={20} color={privacy === option.value ? '#3B82F6' : (isDark ? '#475569' : '#65676B')} />
                                <View style={styles.privacyOptionInfo}>
                                    <Text style={[styles.privacyOptionLabel, { color: titleColor }]}>{option.label}</Text>
                                </View>
                                {privacy === option.value && <Ionicons name="checkmark" size={20} color="#3B82F6" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.textInput, { color: isDark ? '#f1f5f9' : '#111827' }]}
                        placeholder="What's on your mind?"
                        placeholderTextColor={isDark ? '#475569' : '#9CA3AF'}
                        multiline
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                {selectedImage && (
                    <View style={styles.mediaPreviewContainer}>
                        <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.removeMediaButton} onPress={handleRemoveImage}>
                            <Ionicons name="close-circle" size={28} color="rgba(0,0,0,0.6)" />
                        </TouchableOpacity>
                    </View>
                )}

                {selectedPdf && (
                    <View style={styles.pdfPreviewContainer}>
                        <Ionicons name="document-text" size={32} color="#EF4444" />
                        <Text style={styles.pdfName} numberOfLines={1}>{selectedPdf.name}</Text>
                        <TouchableOpacity onPress={handleRemovePdf}>
                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={[styles.actionsContainer, { borderTopColor: border }]}>
                    <Text style={[styles.actionsTitle, { color: titleColor }]}>Update your post</Text>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={[styles.actionButton, { borderColor: border }]} onPress={handleSelectImage} disabled={isUploadingImage}>
                            <Ionicons name="image" size={24} color="#45BD62" />
                            <Text style={[styles.actionButtonText, { color: subtitleColor }]}>Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, { borderColor: border }]} onPress={handleSelectPdf} disabled={isUploadingPdf}>
                            <Ionicons name="document-text" size={24} color="#F7B928" />
                            <Text style={[styles.actionButtonText, { color: subtitleColor }]}>PDF</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    postButton: { backgroundColor: '#3B82F6', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
    postButtonDisabled: { opacity: 0.5 },
    postButtonText: { color: '#FFFFFF', fontWeight: '600' },
    scrollView: { flex: 1 },
    userSection: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    userImage: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '600', color: '#111827' },
    privacyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
    privacyButtonText: { fontSize: 12, color: '#65676B', marginHorizontal: 4 },
    privacyModal: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 12, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, padding: 8 },
    privacyOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8 },
    privacyOptionSelected: { backgroundColor: '#EBF5FF' },
    privacyOptionInfo: { flex: 1, marginLeft: 12 },
    privacyOptionLabel: { fontSize: 15, fontWeight: '500', color: '#111827' },
    inputContainer: { padding: 16, minHeight: 120 },
    textInput: { fontSize: 18, color: '#111827', lineHeight: 26, textAlignVertical: 'top' },
    mediaPreviewContainer: { margin: 16, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    imagePreview: { width: '100%', height: 300, resizeMode: 'cover' },
    removeMediaButton: { position: 'absolute', top: 10, right: 10 },
    pdfPreviewContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    pdfName: { flex: 1, marginLeft: 12, fontSize: 14, color: '#374151' },
    actionsContainer: { padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    actionsTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 16 },
    actionButtons: { flexDirection: 'row', gap: 16 },
    actionButton: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', flex: 1, justifyContent: 'center' },
    actionButtonText: { marginLeft: 8, fontSize: 14, fontWeight: '500', color: '#374151' },
});

export default EditOpinion;
