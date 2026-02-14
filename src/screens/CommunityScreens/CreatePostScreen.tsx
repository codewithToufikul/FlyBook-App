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
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createCommunityPost } from '../../services/communityService';
import { handleImageUpload } from '../../utils/imageUpload';
import { handleVideoUpload } from '../../utils/videoUpload';

const CreatePostScreen = ({ navigation, route }: any) => {
    const { communityId, communityName } = route.params;
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'text' | 'video' | 'course'>('text');
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [accessCode, setAccessCode] = useState('');
    const [content, setContent] = useState('');
    const [media, setMedia] = useState<{ type: 'image' | 'video', url: string }[]>([]);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    // Course specific state
    const [chapters, setChapters] = useState([
        { title: 'Chapter 1', videos: [''] }
    ]);

    const handlePickMedia = async () => {
        try {
            setUploadingMedia(true);
            const url = await handleImageUpload();
            if (url) {
                setMedia(prev => [...prev, { type: 'image', url }]);
            }
        } catch (error: any) {
            if (error.message !== 'User cancelled') {
                Alert.alert('Error', 'Failed to upload media');
            }
        } finally {
            setUploadingMedia(false);
        }
    };

    const handleUploadVideoFile = async () => {
        try {
            setUploadingMedia(true);
            const url = await handleVideoUpload();
            if (url) {
                // If it's a direct url, add to content
                const newContent = content ? `${content}, ${url}` : url;
                setContent(newContent);
                Alert.alert('Success', 'Video uploaded successfully!');
            }
        } catch (error: any) {
            if (error.message !== 'User cancelled video picker') {
                Alert.alert('Error', 'Failed to upload video');
            }
        } finally {
            setUploadingMedia(false);
        }
    };

    const handleAddChapter = () => {
        setChapters(prev => [...prev, { title: `Chapter ${prev.length + 1}`, videos: [''] }]);
    };

    const handleUpdateChapter = (idx: number, field: string, value: any) => {
        const newChapters = [...chapters];
        (newChapters[idx] as any)[field] = value;
        setChapters(newChapters);
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        try {
            setLoading(true);
            const postData: any = {
                title,
                description,
                type,
                visibility,
                accessCode: accessCode || null,
            };

            if (type === 'text') {
                postData.content = content;
                postData.media = media;
            } else if (type === 'video') {
                postData.content = content; // Multi-URL string
            } else if (type === 'course') {
                postData.chapters = chapters;
            }

            const result = await createCommunityPost(communityId, postData);
            if (result.success) {
                Alert.alert('Success', 'Post created successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert('Error', 'Failed to create post');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container]}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Drag Indicator for Modal feel */}
            <View style={styles.modalDragHandleContainer}>
                <View style={styles.modalDragHandle} />
            </View>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Post</Text>
                <TouchableOpacity
                    style={[styles.postButton, !title && styles.disabledPostButton]}
                    onPress={handleSubmit}
                    disabled={loading || !title}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text style={styles.postButtonText}>Post</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.communityIndicator}>
                    <Ionicons name="people" size={16} color="#6B7280" />
                    <Text style={styles.communityName}>Posting in {communityName}</Text>
                </View>

                {/* Content Type Picker */}
                <View style={styles.typeContainer}>
                    {(['text', 'video', 'course'] as const).map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.typeChip, type === t && styles.activeTypeChip]}
                            onPress={() => setType(t)}
                        >
                            <Ionicons
                                name={t === 'text' ? 'document-text' : t === 'video' ? 'videocam' : 'school'}
                                size={18}
                                color={type === t ? '#FFFFFF' : '#6B7280'}
                            />
                            <Text style={[styles.typeText, type === t && styles.activeTypeText]}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    style={styles.titleInput}
                    placeholder="Post Title"
                    placeholderTextColor="#9CA3AF"
                    value={title}
                    onChangeText={setTitle}
                />

                <TextInput
                    style={styles.descriptionInput}
                    placeholder="Short description (optional)"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={description}
                    onChangeText={setDescription}
                />

                <View style={styles.divider} />

                {/* Visibility Toggle */}
                <View style={styles.visibilityRow}>
                    <View style={styles.visibilityInfo}>
                        <Ionicons
                            name={visibility === 'public' ? 'globe-outline' : 'lock-closed-outline'}
                            size={20}
                            color="#4B5563"
                        />
                        <Text style={styles.visibilityLabel}>
                            {visibility === 'public' ? 'Public Post' : 'Private Post'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.toggleBtn}
                        onPress={() => setVisibility(v => v === 'public' ? 'private' : 'public')}
                    >
                        <Text style={styles.toggleBtnText}>Change</Text>
                    </TouchableOpacity>
                </View>

                {visibility === 'private' && (
                    <TextInput
                        style={styles.accessCodeInput}
                        placeholder="Set Access Code (required for private)"
                        placeholderTextColor="#9CA3AF"
                        value={accessCode}
                        onChangeText={setAccessCode}
                    />
                )}

                <View style={styles.divider} />

                {/* Dynamic Content Area */}
                {type === 'text' && (
                    <View style={styles.textContentArea}>
                        <TextInput
                            style={styles.contentInput}
                            placeholder="Share something with your community..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            value={content}
                            onChangeText={setContent}
                        />

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaList}>
                            {media.map((m, idx) => (
                                <View key={idx} style={styles.mediaItem}>
                                    <Image source={{ uri: m.url }} style={styles.mediaPreview} />
                                    <TouchableOpacity
                                        style={styles.removeMedia}
                                        onPress={() => setMedia(prev => prev.filter((_, i) => i !== idx))}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity
                                style={styles.addMediaBtn}
                                onPress={handlePickMedia}
                                disabled={uploadingMedia}
                            >
                                {uploadingMedia ? (
                                    <ActivityIndicator color="#0D9488" />
                                ) : (
                                    <Ionicons name="camera-outline" size={30} color="#0D9488" />
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                )}

                {type === 'video' && (
                    <View style={styles.videoContentArea}>
                        <View style={styles.uploadSection}>
                            <TouchableOpacity
                                style={[styles.videoUploadBtn, uploadingMedia && styles.disabledBtn]}
                                onPress={handleUploadVideoFile}
                                disabled={uploadingMedia}
                            >
                                {uploadingMedia ? (
                                    <ActivityIndicator color="#0D9488" />
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload-outline" size={24} color="#0D9488" />
                                        <Text style={styles.videoUploadText}>Upload Video File</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <Text style={styles.orText}>OR</Text>
                        </View>

                        <Text style={styles.sectionLabel}>Video URLs</Text>
                        <TextInput
                            style={[styles.contentInput, styles.videoUrlInput]}
                            placeholder="Enter video URLs (comma separated)..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            value={content}
                            onChangeText={setContent}
                        />
                        <Text style={styles.hintText}>Supports YouTube, Vimeo, and direct Cloudinary links.</Text>
                    </View>
                )}

                {type === 'course' && (
                    <View style={styles.courseContentArea}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>Course Chapters</Text>
                            <TouchableOpacity style={styles.addChapterBtn} onPress={handleAddChapter}>
                                <Ionicons name="add" size={20} color="#0D9488" />
                                <Text style={styles.addChapterText}>Add Chapter</Text>
                            </TouchableOpacity>
                        </View>

                        {chapters.map((ch, idx) => (
                            <View key={idx} style={styles.chapterCard}>
                                <View style={styles.chapterHeader}>
                                    <Text style={styles.chapterTitle}>Chapter {idx + 1}</Text>
                                    {chapters.length > 1 && (
                                        <TouchableOpacity onPress={() => setChapters(prev => prev.filter((_, i) => i !== idx))}>
                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <TextInput
                                    style={styles.chapterInput}
                                    placeholder="Chapter Title"
                                    value={ch.title}
                                    onChangeText={val => handleUpdateChapter(idx, 'title', val)}
                                />
                                <TextInput
                                    style={[styles.chapterInput, styles.chapterVideoInput]}
                                    placeholder="Video URL"
                                    value={ch.videos[0]}
                                    onChangeText={val => {
                                        const newVids = [val];
                                        handleUpdateChapter(idx, 'videos', newVids);
                                    }}
                                />
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalDragHandleContainer: {
        width: '100%',
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalDragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 2.5,
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
    postButton: {
        backgroundColor: '#0D9488',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    disabledPostButton: {
        backgroundColor: '#99F6E4',
    },
    postButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    scrollContent: {
        padding: 20,
    },
    communityIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: '#F9FAFB',
        padding: 8,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    communityName: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 6,
        fontWeight: '600',
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeTypeChip: {
        backgroundColor: '#0D9488',
        borderColor: '#0D9488',
    },
    typeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginLeft: 6,
    },
    activeTypeText: {
        color: '#FFFFFF',
    },
    titleInput: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 10,
        padding: 0,
    },
    descriptionInput: {
        fontSize: 15,
        color: '#4B5563',
        marginBottom: 15,
        padding: 0,
        maxHeight: 100,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 15,
    },
    visibilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    visibilityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    visibilityLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 8,
    },
    toggleBtn: {
        backgroundColor: '#F0FDFA',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    toggleBtnText: {
        color: '#0D9488',
        fontSize: 12,
        fontWeight: '700',
    },
    accessCodeInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 10,
        fontSize: 14,
    },
    contentInput: {
        fontSize: 16,
        color: '#111827',
        minHeight: 150,
        textAlignVertical: 'top',
        padding: 0,
    },
    mediaList: {
        marginTop: 20,
        flexDirection: 'row',
    },
    mediaItem: {
        width: 100,
        height: 100,
        marginRight: 10,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    mediaPreview: {
        width: '100%',
        height: '100%',
    },
    removeMedia: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
    },
    addMediaBtn: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    hintText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    addChapterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDFA',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    addChapterText: {
        color: '#0D9488',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 4,
    },
    chapterCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chapterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    chapterTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    chapterInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 10,
        fontSize: 14,
    },
    chapterVideoInput: {
        marginBottom: 0,
    },
    textContentArea: {
        marginTop: 5,
    },
    videoContentArea: {
        marginTop: 5,
    },
    videoUrlInput: {
        height: 100,
    },
    courseContentArea: {
        marginTop: 5,
    },
    uploadSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    videoUploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDFA',
        borderWidth: 1,
        borderColor: '#0D9488',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        width: '100%',
    },
    videoUploadText: {
        color: '#0D9488',
        fontWeight: '700',
        marginLeft: 8,
        fontSize: 14,
    },
    disabledBtn: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
    },
    orText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        marginTop: 15,
    },
});

export default CreatePostScreen;
