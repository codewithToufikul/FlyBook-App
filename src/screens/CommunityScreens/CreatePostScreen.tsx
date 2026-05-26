import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
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
import { handleVideoUpload, pickVideoFromGallery, uploadVideoToCloudinary } from '../../utils/videoUpload';

const CreatePostScreen = ({ navigation, route }: any) => {
    const { communityId, communityName } = route.params;
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
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
    const [uploadingVideoIdx, setUploadingVideoIdx] = useState<number | null>(null);

    // Course specific state
    const [chapters, setChapters] = useState<any[]>([
        { title: 'Chapter 1', videos: [''], exam: null }
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

    // Direct video upload for a chapter
    const handleChapterVideoUpload = async (idx: number) => {
        try {
            setUploadingVideoIdx(idx);
            const selectedVideo = await pickVideoFromGallery();
            if (!selectedVideo.uri) {
                Alert.alert('Error', 'No video selected');
                return;
            }
            Alert.alert('Uploading', 'Video is uploading to Cloudinary, please wait...');
            const url = await uploadVideoToCloudinary(selectedVideo.uri);
            const newChapters = [...chapters];
            newChapters[idx].videos = [url];
            setChapters(newChapters);
            Alert.alert('Success', 'Video uploaded successfully!');
        } catch (error: any) {
            if (error.message !== 'User cancelled video picker') {
                Alert.alert('Upload Failed', error.message || 'Failed to upload video');
            }
        } finally {
            setUploadingVideoIdx(null);
        }
    };

    const handleAddChapter = () => {
        setChapters(prev => [...prev, { title: `Chapter ${prev.length + 1}`, videos: [''], exam: null }]);
    };

    const handleUpdateChapter = (idx: number, field: string, value: any) => {
        const newChapters = [...chapters];
        (newChapters[idx] as any)[field] = value;
        setChapters(newChapters);
    };

    // Exam specific handlers
    const handleAddExam = (idx: number) => {
        const newChapters = [...chapters];
        newChapters[idx].exam = {
            type: 'quiz',
            passingScore: 80,
            timeLimitMinutes: 30,
            questions: [
                { question: '', options: ['', ''], answer: '' }
            ]
        };
        setChapters(newChapters);
    };

    const handleRemoveExam = (idx: number) => {
        const newChapters = [...chapters];
        newChapters[idx].exam = null;
        setChapters(newChapters);
    };

    const handleUpdateExam = (idx: number, field: string, value: any) => {
        const newChapters = [...chapters];
        if (newChapters[idx].exam) {
            newChapters[idx].exam = {
                ...newChapters[idx].exam,
                [field]: value
            };
        }
        setChapters(newChapters);
    };

    const handleAddQuestion = (idx: number) => {
        const newChapters = [...chapters];
        const exam = newChapters[idx].exam;
        if (exam) {
            const newQuestion = exam.type === 'quiz' 
                ? { question: '', options: ['', ''], answer: '' } 
                : { question: '' };
            exam.questions = [...exam.questions, newQuestion];
        }
        setChapters(newChapters);
    };

    const handleRemoveQuestion = (chIdx: number, qIdx: number) => {
        const newChapters = [...chapters];
        const exam = newChapters[chIdx].exam;
        if (exam) {
            exam.questions = exam.questions.filter((_: any, i: number) => i !== qIdx);
        }
        setChapters(newChapters);
    };

    const handleUpdateQuestion = (chIdx: number, qIdx: number, field: string, value: any) => {
        const newChapters = [...chapters];
        const exam = newChapters[chIdx].exam;
        if (exam && exam.questions[qIdx]) {
            exam.questions[qIdx] = {
                ...exam.questions[qIdx],
                [field]: value
            };
        }
        setChapters(newChapters);
    };

    const handleAddOption = (chIdx: number, qIdx: number) => {
        const newChapters = [...chapters];
        const exam = newChapters[chIdx].exam;
        if (exam && exam.questions[qIdx]) {
            exam.questions[qIdx].options = [...exam.questions[qIdx].options, ''];
        }
        setChapters(newChapters);
    };

    const handleRemoveOption = (chIdx: number, qIdx: number, oIdx: number) => {
        const newChapters = [...chapters];
        const exam = newChapters[chIdx].exam;
        if (exam && exam.questions[qIdx]) {
            const opt = exam.questions[qIdx].options[oIdx];
            exam.questions[qIdx].options = exam.questions[qIdx].options.filter((_: any, i: number) => i !== oIdx);
            if (exam.questions[qIdx].answer === opt) {
                exam.questions[qIdx].answer = '';
            }
        }
        setChapters(newChapters);
    };

    const handleUpdateOption = (chIdx: number, qIdx: number, oIdx: number, value: string) => {
        const newChapters = [...chapters];
        const exam = newChapters[chIdx].exam;
        if (exam && exam.questions[qIdx]) {
            const oldOpt = exam.questions[qIdx].options[oIdx];
            exam.questions[qIdx].options[oIdx] = value;
            if (exam.questions[qIdx].answer === oldOpt) {
                exam.questions[qIdx].answer = value;
            }
        }
        setChapters(newChapters);
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        if (type === 'course') {
            // Validate exams if present
            for (let i = 0; i < chapters.length; i++) {
                const ch = chapters[i];
                if (ch.exam) {
                    if (!ch.exam.questions || ch.exam.questions.length === 0) {
                        Alert.alert('Error', `Please add at least one question to the exam in Chapter ${i + 1}`);
                        return;
                    }
                    for (let j = 0; j < ch.exam.questions.length; j++) {
                        const q = ch.exam.questions[j];
                        if (!q.question.trim()) {
                            Alert.alert('Error', `Question ${j + 1} in Chapter ${i + 1} cannot be empty`);
                            return;
                        }
                        if (ch.exam.type === 'quiz') {
                            if (!q.options || q.options.length < 2) {
                                Alert.alert('Error', `Question ${j + 1} in Chapter ${i + 1} must have at least 2 options`);
                                return;
                            }
                            if (q.options.some((opt: string) => !opt.trim())) {
                                Alert.alert('Error', `Options for Question ${j + 1} in Chapter ${i + 1} cannot be empty`);
                                return;
                            }
                            if (!q.answer) {
                                Alert.alert('Error', `Please select the correct answer for Question ${j + 1} in Chapter ${i + 1}`);
                                return;
                            }
                        }
                    }
                }
            }
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
            style={[styles.container, isDark && { backgroundColor: '#0f172a' }]}
        >
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFFFFF"} />

            {/* Drag Indicator for Modal feel */}
            <View style={[styles.modalDragHandleContainer, isDark && { backgroundColor: '#0f172a' }]}>
                <View style={[styles.modalDragHandle, isDark && { backgroundColor: '#1e293b' }]} />
            </View>

            <View style={[styles.header, isDark && { backgroundColor: '#0f172a', borderBottomColor: '#1e293b' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color={isDark ? "#f8fafc" : "#1F2937"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Create Post</Text>
                <TouchableOpacity
                    style={[styles.postButton, !title && styles.disabledPostButton, isDark && { backgroundColor: '#14b8a6' }, !title && isDark && { opacity: 0.5 }]}
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
                <View style={[styles.communityIndicator, isDark && { backgroundColor: '#1e293b' }]}>
                    <Ionicons name="people" size={16} color={isDark ? "#14b8a6" : "#6B7280"} />
                    <Text style={[styles.communityName, isDark && { color: '#14b8a6' }]}>Posting in {communityName}</Text>
                </View>

                {/* Content Type Picker */}
                <View style={styles.typeContainer}>
                    {(['text', 'video', 'course'] as const).map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.typeChip, type === t && styles.activeTypeChip, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }, type === t && isDark && { backgroundColor: '#14b8a6', borderColor: '#14b8a6' }]}
                            onPress={() => setType(t)}
                        >
                            <Ionicons
                                name={t === 'text' ? 'document-text' : t === 'video' ? 'videocam' : 'school'}
                                size={18}
                                color={type === t ? '#FFFFFF' : (isDark ? "#94a3b8" : '#6B7280')}
                            />
                            <Text style={[styles.typeText, type === t && styles.activeTypeText, isDark && { color: '#94a3b8' }, type === t && isDark && { color: '#ffffff' }]}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    style={[styles.titleInput, isDark && { color: '#f8fafc' }]}
                    placeholder="Post Title"
                    placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
                    value={title}
                    onChangeText={setTitle}
                />

                <TextInput
                    style={[styles.descriptionInput, isDark && { color: '#94a3b8' }]}
                    placeholder="Short description (optional)"
                    placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
                    multiline
                    value={description}
                    onChangeText={setDescription}
                />

                <View style={[styles.divider, isDark && { backgroundColor: '#1e293b' }]} />

                {/* Visibility Toggle */}
                <View style={styles.visibilityRow}>
                    <View style={styles.visibilityInfo}>
                        <Ionicons
                            name={visibility === 'public' ? 'globe-outline' : 'lock-closed-outline'}
                            size={20}
                            color={isDark ? "#94a3b8" : "#4B5563"}
                        />
                        <Text style={[styles.visibilityLabel, isDark && { color: '#94a3b8' }]}>
                            {visibility === 'public' ? 'Public Post' : 'Private Post'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.toggleBtn, isDark && { backgroundColor: 'rgba(20, 184, 166, 0.1)' }]}
                        onPress={() => setVisibility(v => v === 'public' ? 'private' : 'public')}
                    >
                        <Text style={[styles.toggleBtnText, isDark && { color: '#14b8a6' }]}>Change</Text>
                    </TouchableOpacity>
                </View>

                {visibility === 'private' && (
                    <TextInput
                        style={[styles.accessCodeInput, isDark && { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }]}
                        placeholder="Set Access Code (required for private)"
                        placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
                        value={accessCode}
                        onChangeText={setAccessCode}
                    />
                )}

                <View style={[styles.divider, isDark && { backgroundColor: '#1e293b' }]} />

                {/* Dynamic Content Area */}
                {type === 'text' && (
                    <View style={styles.textContentArea}>
                        <TextInput
                            style={[styles.contentInput, isDark && { color: '#f8fafc' }]}
                            placeholder="Share something with your community..."
                            placeholderTextColor={isDark ? "#64748b" : "#9CA3AF"}
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
                                style={[styles.addMediaBtn, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}
                                onPress={handlePickMedia}
                                disabled={uploadingMedia}
                            >
                                {uploadingMedia ? (
                                    <ActivityIndicator color={isDark ? "#14b8a6" : "#0D9488"} />
                                ) : (
                                    <Ionicons name="camera-outline" size={30} color={isDark ? "#14b8a6" : "#0D9488"} />
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                )}

                {type === 'video' && (
                    <View style={styles.videoContentArea}>
                        <View style={styles.uploadSection}>
                            <TouchableOpacity
                                style={[styles.videoUploadBtn, uploadingMedia && styles.disabledBtn, isDark && { backgroundColor: 'rgba(20, 184, 166, 0.1)', borderColor: '#14b8a6' }]}
                                onPress={handleUploadVideoFile}
                                disabled={uploadingMedia}
                            >
                                {uploadingMedia ? (
                                    <ActivityIndicator color={isDark ? "#14b8a6" : "#0D9488"} />
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload-outline" size={24} color={isDark ? "#14b8a6" : "#0D9488"} />
                                        <Text style={[styles.videoUploadText, isDark && { color: '#14b8a6' }]}>Upload Video File</Text>
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
                            <Text style={[styles.sectionLabel, isDark && { color: '#f8fafc' }]}>Course Chapters</Text>
                            <TouchableOpacity style={styles.addChapterBtn} onPress={handleAddChapter}>
                                <Ionicons name="add" size={20} color="#0D9488" />
                                <Text style={styles.addChapterText}>Add Chapter</Text>
                            </TouchableOpacity>
                        </View>

                        {chapters.map((ch, idx) => (
                            <View key={idx} style={[styles.chapterCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                <View style={styles.chapterHeader}>
                                    <Text style={[styles.chapterTitle, isDark && { color: '#f8fafc' }]}>Chapter {idx + 1}</Text>
                                    {chapters.length > 1 && (
                                        <TouchableOpacity onPress={() => setChapters(prev => prev.filter((_, i) => i !== idx))}>
                                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <TextInput
                                    style={[styles.chapterInput, isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }]}
                                    placeholder="Chapter Title"
                                    placeholderTextColor={isDark ? '#64748b' : '#9CA3AF'}
                                    value={ch.title}
                                    onChangeText={val => handleUpdateChapter(idx, 'title', val)}
                                />
                                {/* Video Upload Section */}
                                <View style={[styles.videoUploadSection, isDark && { borderColor: '#334155' }]}>
                                    <Text style={[styles.videoSectionLabel, isDark && { color: '#94a3b8' }]}>Chapter Video</Text>

                                    {/* Upload Button */}
                                    {uploadingVideoIdx === idx ? (
                                        <View style={[styles.uploadingIndicator, isDark && { backgroundColor: 'rgba(20,184,166,0.08)', borderColor: '#14b8a6' }]}>
                                            <ActivityIndicator size="small" color={isDark ? '#14b8a6' : '#0D9488'} />
                                            <Text style={[styles.uploadingText, isDark && { color: '#14b8a6' }]}>Uploading video…</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.videoPickerBtn, isDark && { backgroundColor: 'rgba(20,184,166,0.06)', borderColor: '#14b8a6' }]}
                                            onPress={() => handleChapterVideoUpload(idx)}
                                        >
                                            <Ionicons name="cloud-upload-outline" size={20} color={isDark ? '#14b8a6' : '#0D9488'} />
                                            <Text style={[styles.videoPickerText, isDark && { color: '#14b8a6' }]}>
                                                {ch.videos[0] && ch.videos[0].startsWith('http') ? 'Replace Video' : 'Upload from Gallery'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    {/* Uploaded URL preview */}
                                    {ch.videos[0] && ch.videos[0].startsWith('http') && (
                                        <View style={[styles.videoPreviewRow, isDark && { backgroundColor: 'rgba(20,184,166,0.05)', borderColor: '#334155' }]}>
                                            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                            <Text style={[styles.videoPreviewText, isDark && { color: '#94a3b8' }]} numberOfLines={1}>
                                                {ch.videos[0]}
                                            </Text>
                                            <TouchableOpacity onPress={() => handleUpdateChapter(idx, 'videos', [''])}>
                                                <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* OR divider */}
                                    <View style={styles.orDividerRow}>
                                        <View style={[styles.orLine, isDark && { backgroundColor: '#334155' }]} />
                                        <Text style={[styles.orDividerText, isDark && { color: '#64748b' }]}>OR paste URL</Text>
                                        <View style={[styles.orLine, isDark && { backgroundColor: '#334155' }]} />
                                    </View>

                                    {/* URL Input */}
                                    <TextInput
                                        style={[styles.chapterInput, { marginBottom: 0 }, isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }]}
                                        placeholder="Video URL (YouTube, Vimeo, Cloudinary…)"
                                        placeholderTextColor={isDark ? '#64748b' : '#9CA3AF'}
                                        value={ch.videos[0]}
                                        onChangeText={val => {
                                            const newVids = [val];
                                            handleUpdateChapter(idx, 'videos', newVids);
                                        }}
                                    />
                                </View>

                                {/* Exam Section */}
                                <View style={styles.examContainer}>
                                    {!ch.exam ? (
                                        <TouchableOpacity 
                                            style={[styles.addExamBtn, isDark && { backgroundColor: 'rgba(20, 184, 166, 0.05)', borderColor: '#14b8a6' }]} 
                                            onPress={() => handleAddExam(idx)}
                                        >
                                            <Ionicons name="document-text-outline" size={18} color={isDark ? '#14b8a6' : '#0D9488'} />
                                            <Text style={[styles.addExamText, isDark && { color: '#14b8a6' }]}>Add Exam to Chapter</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={[styles.examCard, isDark && { backgroundColor: '#0f172a', borderColor: '#1e293b' }]}>
                                            <View style={styles.examHeader}>
                                                <View style={styles.examTitleRow}>
                                                    <Ionicons name="document-text" size={18} color={isDark ? '#14b8a6' : '#0D9488'} />
                                                    <Text style={[styles.examCardTitle, isDark && { color: '#f8fafc' }]}>Chapter Exam</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => handleRemoveExam(idx)} style={styles.removeExamBtn}>
                                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                                    <Text style={styles.removeExamText}>Remove</Text>
                                                </TouchableOpacity>
                                            </View>

                                            {/* Exam Type Selection */}
                                            <Text style={[styles.examSubLabel, isDark && { color: '#94a3b8' }]}>Exam Type</Text>
                                            <View style={styles.examTypeRow}>
                                                {(['quiz', 'written', 'listening'] as const).map((eType) => (
                                                    <TouchableOpacity
                                                        key={eType}
                                                        style={[
                                                            styles.examTypeChip,
                                                            ch.exam.type === eType && styles.activeExamTypeChip,
                                                            isDark && { backgroundColor: '#1e293b', borderColor: '#334155' },
                                                            ch.exam.type === eType && isDark && { backgroundColor: '#14b8a6', borderColor: '#14b8a6' }
                                                        ]}
                                                        onPress={() => {
                                                            const updatedQuestions = ch.exam.questions.map((q: any) => {
                                                                if (eType === 'quiz') {
                                                                    return { question: q.question, options: q.options || ['', ''], answer: q.answer || '' };
                                                                } else {
                                                                    return { question: q.question };
                                                                }
                                                            });
                                                            handleUpdateExam(idx, 'type', eType);
                                                            handleUpdateExam(idx, 'questions', updatedQuestions);
                                                        }}
                                                    >
                                                        <Text style={[
                                                            styles.examTypeText,
                                                            ch.exam.type === eType && styles.activeExamTypeText,
                                                            isDark && { color: '#94a3b8' }
                                                        ]}>
                                                            {eType === 'quiz' ? 'Quiz (MCQ)' : eType === 'written' ? 'Written' : 'Listening'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>

                                            {/* Numeric settings */}
                                            <View style={styles.examSettingsRow}>
                                                <View style={styles.settingCol}>
                                                    <Text style={[styles.examSubLabel, isDark && { color: '#94a3b8' }]}>Passing Score (%)</Text>
                                                    <TextInput
                                                        style={[styles.examSettingInput, isDark && { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }]}
                                                        keyboardType="numeric"
                                                        placeholder="80"
                                                        placeholderTextColor={isDark ? '#64748b' : '#9CA3AF'}
                                                        value={String(ch.exam.passingScore || '')}
                                                        onChangeText={(val) => handleUpdateExam(idx, 'passingScore', Number(val) || 0)}
                                                    />
                                                </View>
                                                <View style={styles.settingCol}>
                                                    <Text style={[styles.examSubLabel, isDark && { color: '#94a3b8' }]}>Time Limit (Mins)</Text>
                                                    <TextInput
                                                        style={[styles.examSettingInput, isDark && { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }]}
                                                        keyboardType="numeric"
                                                        placeholder="30"
                                                        placeholderTextColor={isDark ? '#64748b' : '#9CA3AF'}
                                                        value={String(ch.exam.timeLimitMinutes || '')}
                                                        onChangeText={(val) => handleUpdateExam(idx, 'timeLimitMinutes', Number(val) || 0)}
                                                    />
                                                </View>
                                            </View>

                                            {/* Questions Manager */}
                                            <View style={styles.questionsHeaderRow}>
                                                <Text style={[styles.examSubLabel, { marginBottom: 0 }, isDark && { color: '#f8fafc' }]}>
                                                    Questions ({ch.exam.questions?.length || 0})
                                                </Text>
                                                <TouchableOpacity 
                                                    style={styles.addQuestionBtnSmall} 
                                                    onPress={() => handleAddQuestion(idx)}
                                                >
                                                    <Ionicons name="add-circle-outline" size={16} color={isDark ? '#14b8a6' : '#0D9488'} />
                                                    <Text style={[styles.addQuestionTextSmall, isDark && { color: '#14b8a6' }]}>Add Question</Text>
                                                </TouchableOpacity>
                                            </View>

                                            {ch.exam.questions?.map((q: any, qIdx: number) => (
                                                <View key={qIdx} style={[styles.questionEditorCard, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                                    <View style={styles.questionEditorHeader}>
                                                        <Text style={[styles.questionEditorTitle, isDark && { color: '#94a3b8' }]}>Q{qIdx + 1}</Text>
                                                        <TouchableOpacity onPress={() => handleRemoveQuestion(idx, qIdx)}>
                                                            <Ionicons name="close-outline" size={18} color="#EF4444" />
                                                        </TouchableOpacity>
                                                    </View>

                                                    <TextInput
                                                        style={[styles.chapterInput, { marginBottom: 8 }, isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }]}
                                                        placeholder={`Question ${qIdx + 1} prompt`}
                                                        placeholderTextColor={isDark ? '#64748b' : '#9CA3AF'}
                                                        value={q.question}
                                                        onChangeText={(val) => handleUpdateQuestion(idx, qIdx, 'question', val)}
                                                    />

                                                    {/* MCQ Options */}
                                                    {ch.exam.type === 'quiz' && (
                                                        <View style={styles.optionsEditorContainer}>
                                                            <Text style={[styles.optionsLabel, isDark && { color: '#94a3b8' }]}>Options & Correct Answer</Text>
                                                            {q.options?.map((opt: string, oIdx: number) => {
                                                                const isCorrect = q.answer === opt && opt !== '';
                                                                return (
                                                                    <View key={oIdx} style={styles.optionInputRow}>
                                                                        <TouchableOpacity 
                                                                            style={[
                                                                                styles.correctIndicatorCircle,
                                                                                isCorrect && styles.correctIndicatorCircleActive,
                                                                                isDark && { borderColor: '#334155' },
                                                                                isCorrect && isDark && { borderColor: '#14b8a6', backgroundColor: '#14b8a6' }
                                                                            ]}
                                                                            onPress={() => {
                                                                                if (opt.trim()) {
                                                                                    handleUpdateQuestion(idx, qIdx, 'answer', opt);
                                                                                } else {
                                                                                    Alert.alert('Info', 'Please enter option text first before setting it as correct.');
                                                                                }
                                                                            }}
                                                                        >
                                                                            {isCorrect && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                                                                        </TouchableOpacity>
                                                                        <TextInput
                                                                            style={[
                                                                                styles.optionInput, 
                                                                                isDark && { backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' },
                                                                                isCorrect && { borderColor: '#0D9488' },
                                                                                isCorrect && isDark && { borderColor: '#14b8a6' }
                                                                            ]}
                                                                            placeholder={`Option ${oIdx + 1}`}
                                                                            placeholderTextColor={isDark ? '#64748b' : '#9CA3AF'}
                                                                            value={opt}
                                                                            onChangeText={(val) => handleUpdateOption(idx, qIdx, oIdx, val)}
                                                                        />
                                                                        {q.options.length > 2 && (
                                                                            <TouchableOpacity onPress={() => handleRemoveOption(idx, qIdx, oIdx)}>
                                                                                <Ionicons name="remove-circle-outline" size={20} color="#EF4444" />
                                                                            </TouchableOpacity>
                                                                        )}
                                                                    </View>
                                                                );
                                                            })}
                                                            <TouchableOpacity 
                                                                style={styles.addOptionBtn}
                                                                onPress={() => handleAddOption(idx, qIdx)}
                                                            >
                                                                <Ionicons name="add" size={16} color={isDark ? '#14b8a6' : '#0D9488'} />
                                                                <Text style={[styles.addOptionText, isDark && { color: '#14b8a6' }]}>Add Option</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
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
    videoUploadSection: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        gap: 8,
    },
    videoSectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 4,
    },
    videoPickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F0FDFA',
        borderWidth: 1.5,
        borderColor: '#0D9488',
        borderStyle: 'dashed',
        borderRadius: 8,
        paddingVertical: 12,
    },
    videoPickerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0D9488',
    },
    uploadingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#F0FDFA',
        borderWidth: 1,
        borderColor: '#0D9488',
        borderRadius: 8,
        paddingVertical: 12,
    },
    uploadingText: {
        fontSize: 13,
        color: '#0D9488',
        fontWeight: '500',
    },
    videoPreviewRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F0FDFA',
        borderWidth: 1,
        borderColor: '#D1FAE5',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    videoPreviewText: {
        flex: 1,
        fontSize: 12,
        color: '#475569',
    },
    orDividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginVertical: 2,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    orDividerText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
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
    examContainer: {
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 15,
    },
    addExamBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0FDFA',
        borderWidth: 1,
        borderColor: '#0D9488',
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingVertical: 10,
    },
    addExamText: {
        color: '#0D9488',
        fontWeight: '700',
        marginLeft: 8,
        fontSize: 13,
    },
    examCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    examHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    examTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    examCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginLeft: 6,
    },
    removeExamBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    removeExamText: {
        color: '#EF4444',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
    examSubLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
        marginBottom: 6,
    },
    examTypeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    examTypeChip: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activeExamTypeChip: {
        backgroundColor: '#0D9488',
        borderColor: '#0D9488',
    },
    examTypeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4B5563',
    },
    activeExamTypeText: {
        color: '#FFFFFF',
    },
    examSettingsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    settingCol: {
        flex: 1,
    },
    examSettingInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        fontSize: 13,
        color: '#111827',
    },
    questionsHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 10,
    },
    addQuestionBtnSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDFA',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    addQuestionTextSmall: {
        color: '#0D9488',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
    questionEditorCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    questionEditorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    questionEditorTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
    },
    optionsEditorContainer: {
        marginTop: 4,
    },
    optionsLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 6,
    },
    optionInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    correctIndicatorCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    correctIndicatorCircleActive: {
        backgroundColor: '#0D9488',
        borderColor: '#0D9488',
    },
    optionInput: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        fontSize: 12,
        color: '#111827',
    },
    addOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    addOptionText: {
        color: '#0D9488',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
});

export default CreatePostScreen;
