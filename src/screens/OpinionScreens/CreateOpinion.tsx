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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { post } from '../../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { handleImageUpload } from '../../utils/imageUpload';
import { handlePdfUpload } from '../../utils/pdfupload';
import { SafeAreaView } from 'react-native-safe-area-context';
import { debugAuthState } from '../../utils/authDebug';

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

const CreateOpinion = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const { user } = useAuth();

    // Form states
    const [description, setDescription] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedPdf, setSelectedPdf] = useState<{
        url: string;
        name: string;
    } | null>(null);
    const [privacy, setPrivacy] = useState<PrivacyType>('public');
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
                    text1: 'Image uploaded successfully!',
                    visibilityTime: 2000,
                });
            }
        } catch (error: any) {
            if (error.message !== 'User cancelled' &&
                error.message !== 'User cancelled image picker' &&
                error.message !== 'User cancelled camera') {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to upload image',
                    text2: 'Please try again',
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
            setUploadProgress(0);

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
                    text1: 'PDF uploaded successfully!',
                    visibilityTime: 2000,
                });
            }
        } catch (error: any) {
            if (error.message !== 'User cancelled PDF picker') {
                Toast.show({
                    type: 'error',
                    text1: 'Failed to upload PDF',
                    text2: error.message || 'Please try again',
                });
            }
        } finally {
            setIsUploadingPdf(false);
            setUploadProgress(0);
        }
    };

    // Remove image
    const handleRemoveImage = () => {
        Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => setSelectedImage(null),
            },
        ]);
    };

    // Remove PDF
    const handleRemovePdf = () => {
        Alert.alert('Remove PDF', 'Are you sure you want to remove this PDF?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => setSelectedPdf(null),
            },
        ]);
    };

    // Handle post creation
    const handleCreatePost = async () => {
        // Validation
        if (!description.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Please write something',
                text2: 'Description cannot be empty',
            });
            return;
        }

        if (!user) {
            Toast.show({
                type: 'error',
                text1: 'Please login to post',
            });
            return;
        }

        try {
            setIsPosting(true);

            // Debug: Check authentication state
            console.log('📝 Creating post - Debug info:');
            console.log('  - User exists:', !!user);
            console.log('  - User ID:', user._id);
            console.log('  - User name:', user.name || user.userName);

            // Run comprehensive auth debug
            await debugAuthState();

            // Import and check token
            const { getToken } = await import('../../services/api');
            const currentToken = await getToken();
            console.log('  - Token exists:', !!currentToken);
            console.log('  - Token preview:', currentToken ? `${currentToken.substring(0, 20)}...` : 'null');

            // Get current date and time
            const now = new Date();
            const date = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
            const time = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });

            // Prepare post data
            const postData = {
                userId: user._id,
                userName: user.name || user.userName || 'Anonymous',
                userProfileImage: user.profileImage || user.profileImage || '',
                description: description.trim(),
                image: selectedImage || '',
                pdf: selectedPdf?.url || '',
                date,
                time,
                privacy,
            };

            console.log('  - Post data prepared:', {
                userId: postData.userId,
                userName: postData.userName,
                hasImage: !!postData.image,
                hasPdf: !!postData.pdf,
                privacy: postData.privacy,
            });

            // Create post
            const response = await post<{ success: boolean; message?: string }>(
                '/opinion/post',
                postData
            );

            if (response?.success) {
                // Navigate back to OpinionHome without showing toast
                navigation.goBack();
            } else {
                throw new Error(response?.message || 'Failed to create post');
            }
        } catch (error: any) {
            console.error('Error creating post:', error);
            Toast.show({
                type: 'error',
                text1: 'Failed to create post',
                text2: error?.message || 'Please try again',
            });
        } finally {
            setIsPosting(false);
        }
    };

    // Get privacy icon
    const getPrivacyIcon = () => {
        const option = privacyOptions.find((opt) => opt.value === privacy);
        return option?.icon || 'globe-outline';
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <SafeAreaView style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                    disabled={isPosting}
                >
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Create Opinion</Text>

                <TouchableOpacity
                    style={[
                        styles.postButton,
                        (!description.trim() || isPosting) && styles.postButtonDisabled,
                    ]}
                    onPress={handleCreatePost}
                    disabled={!description.trim() || isPosting}
                >
                    {isPosting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.postButtonText}>Post</Text>
                    )}
                </TouchableOpacity>
            </SafeAreaView>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* User Info */}
                <View style={styles.userSection}>
                    <Image
                        source={{
                            uri: user?.profileImage || user?.profileImage || 'https://via.placeholder.com/50',
                        }}
                        style={styles.userImage}
                    />
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                            {user?.name || user?.userName || 'User'}
                        </Text>

                        {/* Privacy Selector */}
                        <TouchableOpacity
                            style={styles.privacyButton}
                            onPress={() => setShowPrivacyModal(!showPrivacyModal)}
                        >
                            <Ionicons name={getPrivacyIcon()} size={14} color="#65676B" />
                            <Text style={styles.privacyButtonText}>
                                {privacy.charAt(0).toUpperCase() + privacy.slice(1)}
                            </Text>
                            <Ionicons name="chevron-down" size={14} color="#65676B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Privacy Options Dropdown */}
                {showPrivacyModal && (
                    <View style={styles.privacyModal}>
                        {privacyOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.privacyOption,
                                    privacy === option.value && styles.privacyOptionSelected,
                                ]}
                                onPress={() => {
                                    setPrivacy(option.value);
                                    setShowPrivacyModal(false);
                                }}
                            >
                                <View style={styles.privacyOptionLeft}>
                                    <View
                                        style={[
                                            styles.privacyIconContainer,
                                            privacy === option.value && styles.privacyIconContainerSelected,
                                        ]}
                                    >
                                        <Ionicons
                                            name={option.icon}
                                            size={20}
                                            color={privacy === option.value ? '#3B82F6' : '#65676B'}
                                        />
                                    </View>
                                    <View style={styles.privacyOptionInfo}>
                                        <Text style={styles.privacyOptionLabel}>{option.label}</Text>
                                        <Text style={styles.privacyOptionDescription}>
                                            {option.description}
                                        </Text>
                                    </View>
                                </View>
                                {privacy === option.value && (
                                    <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Description Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Share your opinion..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        value={description}
                        onChangeText={setDescription}
                        maxLength={5000}
                        textAlignVertical="top"
                        autoFocus
                    />
                    <Text style={styles.characterCount}>
                        {description.length} / 5000
                    </Text>
                </View>

                {/* Image Preview */}
                {selectedImage && (
                    <View style={styles.mediaPreviewContainer}>
                        <View style={styles.mediaHeader}>
                            <View style={styles.mediaHeaderLeft}>
                                <Ionicons name="image" size={20} color="#3B82F6" />
                                <Text style={styles.mediaHeaderText}>Image</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.removeMediaButton}
                                onPress={handleRemoveImage}
                            >
                                <Ionicons name="close-circle" size={24} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                        <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                    </View>
                )}

                {/* PDF Preview */}
                {selectedPdf && (
                    <View style={styles.mediaPreviewContainer}>
                        <View style={styles.mediaHeader}>
                            <View style={styles.mediaHeaderLeft}>
                                <Ionicons name="document-text" size={20} color="#EF4444" />
                                <Text style={styles.mediaHeaderText}>PDF Document</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.removeMediaButton}
                                onPress={handleRemovePdf}
                            >
                                <Ionicons name="close-circle" size={24} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.pdfPreview}>
                            <Ionicons name="document-text" size={48} color="#DC2626" />
                            <Text style={styles.pdfName} numberOfLines={1}>
                                {selectedPdf.name}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Upload Progress */}
                {(isUploadingImage || isUploadingPdf) && (
                    <View style={styles.uploadingContainer}>
                        <ActivityIndicator size="small" color="#3B82F6" />
                        <Text style={styles.uploadingText}>
                            {isUploadingImage ? 'Uploading image...' : 'Uploading PDF...'}
                        </Text>
                        {isUploadingPdf && uploadProgress > 0 && (
                            <Text style={styles.progressText}>{uploadProgress}%</Text>
                        )}
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <Text style={styles.actionsTitle}>Add to your post</Text>

                    <View style={styles.actionButtons}>
                        {/* Image Upload */}
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                isUploadingImage && styles.actionButtonDisabled,
                            ]}
                            onPress={handleSelectImage}
                            disabled={isUploadingImage || isPosting}
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: '#E7F5E7' }]}>
                                <Ionicons name="image" size={24} color="#45BD62" />
                            </View>
                            <Text style={styles.actionButtonText}>Photo</Text>
                        </TouchableOpacity>

                        {/* PDF Upload */}
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                isUploadingPdf && styles.actionButtonDisabled,
                            ]}
                            onPress={handleSelectPdf}
                            disabled={isUploadingPdf || isPosting}
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: '#FEF3E7' }]}>
                                <Ionicons name="document-text" size={24} color="#F7B928" />
                            </View>
                            <Text style={styles.actionButtonText}>PDF</Text>
                        </TouchableOpacity>

                        {/* Video (Coming Soon) */}
                        <TouchableOpacity
                            style={[styles.actionButton, styles.actionButtonDisabled]}
                            disabled
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: '#FEEAEA' }]}>
                                <Ionicons name="videocam" size={24} color="#F02849" />
                            </View>
                            <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>
                                Video
                            </Text>
                        </TouchableOpacity>

                        {/* Location (Coming Soon) */}
                        <TouchableOpacity
                            style={[styles.actionButton, styles.actionButtonDisabled]}
                            disabled
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: '#EBF4FF' }]}>
                                <Ionicons name="location" size={24} color="#3B82F6" />
                            </View>
                            <Text style={[styles.actionButtonText, styles.actionButtonTextDisabled]}>
                                Location
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            <Toast />
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
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    postButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    postButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.6,
    },
    postButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    userImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E5E7EB',
    },
    userInfo: {
        marginLeft: 12,
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    privacyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    privacyButtonText: {
        fontSize: 13,
        color: '#65676B',
        marginHorizontal: 6,
        fontWeight: '500',
    },
    privacyModal: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    privacyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    privacyOptionSelected: {
        backgroundColor: '#EBF5FF',
    },
    privacyOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    privacyIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    privacyIconContainerSelected: {
        backgroundColor: '#DBEAFE',
    },
    privacyOptionInfo: {
        flex: 1,
    },
    privacyOptionLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    privacyOptionDescription: {
        fontSize: 12,
        color: '#6B7280',
    },
    inputContainer: {
        padding: 16,
        minHeight: 150,
    },
    textInput: {
        fontSize: 16,
        color: '#111827',
        lineHeight: 24,
        minHeight: 120,
    },
    characterCount: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 8,
    },
    mediaPreviewContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    mediaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    mediaHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mediaHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 8,
    },
    removeMediaButton: {
        padding: 4,
    },
    imagePreview: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
    },
    pdfPreview: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#F9FAFB',
    },
    pdfName: {
        fontSize: 14,
        color: '#374151',
        marginTop: 12,
        textAlign: 'center',
        maxWidth: '80%',
    },
    uploadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        marginHorizontal: 16,
        backgroundColor: '#EBF5FF',
        borderRadius: 12,
        marginBottom: 16,
    },
    uploadingText: {
        fontSize: 14,
        color: '#3B82F6',
        marginLeft: 12,
        fontWeight: '500',
    },
    progressText: {
        fontSize: 14,
        color: '#3B82F6',
        marginLeft: 8,
        fontWeight: '600',
    },
    actionsContainer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    actionsTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionButton: {
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        minWidth: (width - 64) / 4,
    },
    actionButtonDisabled: {
        opacity: 0.5,
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },
    actionButtonTextDisabled: {
        color: '#9CA3AF',
    },
    bottomSpacing: {
        height: 40,
    },
});

export default CreateOpinion;