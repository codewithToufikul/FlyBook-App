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
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { post } from '../../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { handleImageUpload } from '../../utils/imageUpload';
import { handlePdfUpload } from '../../utils/pdfupload';
import { handleVideoUpload } from '../../utils/videoUpload';
import { SafeAreaView } from 'react-native-safe-area-context';
import { debugAuthState } from '../../utils/authDebug';

const { width } = Dimensions.get('window');

type PrivacyType = 'public' | 'friends' | 'only me';

interface PrivacyOption {
    value: PrivacyType;
    label: string;
    icon: string;
    description: string;
    color: string;
    bg: string;
}

const PRIVACY_OPTIONS: PrivacyOption[] = [
    {
        value: 'public',
        label: 'Public',
        icon: 'earth',
        description: 'Anyone on FlyBook can see this',
        color: '#10b981',
        bg: 'rgba(16,185,129,0.12)',
    },
    {
        value: 'friends',
        label: 'Friends',
        icon: 'people',
        description: 'Only your friends can see this',
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.12)',
    },
    {
        value: 'only me',
        label: 'Only Me',
        icon: 'lock-closed',
        description: 'Only you can see this post',
        color: '#8b5cf6',
        bg: 'rgba(139,92,246,0.12)',
    },
];

const CreateOpinion = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const { user } = useAuth();
    const { isDark } = useTheme();

    // ── Content State ─────────────────────────────────────────────────────────
    const [description, setDescription] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedPdf, setSelectedPdf] = useState<{ url: string; name: string } | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [privacy, setPrivacy] = useState<PrivacyType>('public');
    const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);

    // ── Loading State ─────────────────────────────────────────────────────────
    const [isPosting, setIsPosting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isUploadingPdf, setIsUploadingPdf] = useState(false);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // ── Theme Tokens ─────────────────────────────────────────────────────────
    const bg = isDark ? '#070d1a' : '#f0f4f8';
    const cardBg = isDark ? '#111827' : '#ffffff';
    const border = isDark ? '#1e293b' : '#f1f5f9';
    const inputBg = isDark ? '#1a2332' : '#f8fafc';
    const tp = isDark ? '#f1f5f9' : '#0f172a';
    const ts = isDark ? '#64748b' : '#94a3b8';
    const tm = isDark ? '#334155' : '#e2e8f0';

    const currentPrivacy = PRIVACY_OPTIONS.find(o => o.value === privacy)!;
    const charPct = description.length / 5000;
    const charColor = charPct > 0.9 ? '#ef4444' : charPct > 0.7 ? '#f59e0b' : ts;
    const canPost = description.trim().length > 0 && !isPosting && !isUploadingImage && !isUploadingPdf && !isUploadingVideo;
    const isAnyUploading = isUploadingImage || isUploadingPdf || isUploadingVideo;

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleSelectImage = async () => {
        if (selectedVideo) {
            Alert.alert('Media Conflict', 'Remove the video first to add an image.');
            return;
        }
        try {
            setIsUploadingImage(true);
            const url = await handleImageUpload();
            if (url) {
                setSelectedImage(url);
                Toast.show({ type: 'success', text1: '✓ Image uploaded successfully' });
            }
        } catch (e: any) {
            if (!e.message?.includes('cancelled')) {
                Toast.show({ type: 'error', text1: 'Failed to upload image', text2: 'Please try again' });
            }
        } finally { setIsUploadingImage(false); }
    };

    const handleSelectPdf = async () => {
        try {
            setIsUploadingPdf(true);
            setUploadProgress(0);
            const result = await handlePdfUpload((p: number) => setUploadProgress(p));
            if (result?.secureUrl) {
                setSelectedPdf({ url: result.secureUrl, name: result.originalFilename || 'document.pdf' });
                Toast.show({ type: 'success', text1: '✓ PDF uploaded successfully' });
            }
        } catch (e: any) {
            if (!e.message?.includes('cancelled')) {
                Toast.show({ type: 'error', text1: 'Failed to upload PDF', text2: e.message });
            }
        } finally { setIsUploadingPdf(false); setUploadProgress(0); }
    };

    const handleSelectVideo = async () => {
        if (selectedImage) {
            Alert.alert('Media Conflict', 'Remove the image first to add a video.');
            return;
        }
        try {
            setIsUploadingVideo(true);
            Toast.show({ type: 'info', text1: '⏳ Uploading video...', text2: 'This may take a moment' });
            const url = await handleVideoUpload();
            if (url) {
                setSelectedVideo(url);
                Toast.show({ type: 'success', text1: '✓ Video uploaded successfully' });
            }
        } catch (e: any) {
            if (!e.message?.includes('cancelled')) {
                Toast.show({ type: 'error', text1: 'Failed to upload video', text2: e.message });
            }
        } finally { setIsUploadingVideo(false); }
    };

    const handleRemoveImage = () =>
        Alert.alert('Remove Image', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => setSelectedImage(null) },
        ]);

    const handleRemovePdf = () =>
        Alert.alert('Remove PDF', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => setSelectedPdf(null) },
        ]);

    const handleRemoveVideo = () =>
        Alert.alert('Remove Video', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => setSelectedVideo(null) },
        ]);

    const handlePrivacySelect = (value: PrivacyType) => {
        setPrivacy(value);
        setShowPrivacyDropdown(false);
    };

    const handleCreatePost = async () => {
        if (!description.trim()) {
            Toast.show({ type: 'error', text1: 'Please write something', text2: 'Description cannot be empty' });
            return;
        }
        if (!user) {
            Toast.show({ type: 'error', text1: 'Please login to post' });
            return;
        }
        try {
            setIsPosting(true);
            await debugAuthState();
            const { getToken } = await import('../../services/api');
            await getToken();

            const now = new Date();
            const postData = {
                userId: user._id,
                userName: user.name || user.userName || 'Anonymous',
                userProfileImage: user.profileImage || '',
                description: description.trim(),
                image: selectedImage || '',
                pdf: selectedPdf?.url || '',
                video: selectedVideo || '',
                date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                privacy,
            };

            const response = await post<{ success: boolean; message?: string }>('/opinion/post', postData);
            if (response?.success) {
                Toast.show({ type: 'success', text1: '✓ Opinion posted!' });
                navigation.goBack();
            } else {
                throw new Error(response?.message || 'Failed to create post');
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Failed to post', text2: error?.message });
        } finally {
            setIsPosting(false);
        }
    };

    // ── Media tiles config ────────────────────────────────────────────────────
    const mediaTiles = [
        {
            icon: 'image',
            label: 'Photo',
            color: '#10b981',
            bg: 'rgba(16,185,129,0.12)',
            onPress: handleSelectImage,
            loading: isUploadingImage,
            disabled: isUploadingImage || isPosting || !!selectedVideo,
            active: !!selectedImage,
        },
        {
            icon: 'videocam',
            label: 'Video',
            color: '#f43f5e',
            bg: 'rgba(244,63,94,0.12)',
            onPress: handleSelectVideo,
            loading: isUploadingVideo,
            disabled: isUploadingVideo || isPosting || !!selectedImage,
            active: !!selectedVideo,
        },
        {
            icon: 'document-text',
            label: 'PDF',
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.12)',
            onPress: handleSelectPdf,
            loading: isUploadingPdf,
            disabled: isUploadingPdf || isPosting,
            active: !!selectedPdf,
        },
        {
            icon: 'location',
            label: 'Location',
            color: '#3b82f6',
            bg: 'rgba(59,130,246,0.12)',
            onPress: () => Toast.show({ type: 'info', text1: 'Coming soon!' }),
            loading: false,
            disabled: true,
            active: false,
            soon: true,
        },
    ];

    return (
        <KeyboardAvoidingView
            style={[styles.root, { backgroundColor: bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            {/* ── Header ── */}
            <SafeAreaView style={[styles.header, { backgroundColor: cardBg, borderBottomColor: border }]}>
                <TouchableOpacity
                    style={[styles.navBtn, { backgroundColor: inputBg }]}
                    onPress={() => navigation.goBack()}
                    disabled={isPosting}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={20} color={tp} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: tp }]}>Create Opinion</Text>

                <TouchableOpacity onPress={handleCreatePost} disabled={!canPost} activeOpacity={0.85}>
                    <LinearGradient
                        colors={canPost ? ['#0D9488', '#0f766e'] : (isDark ? ['#1e293b', '#1e293b'] : ['#e2e8f0', '#e2e8f0'])}
                        style={styles.postBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isPosting
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <>
                                <Ionicons name="send" size={13} color={canPost ? '#fff' : (isDark ? '#334155' : '#94a3b8')} />
                                <Text style={[styles.postBtnText, { color: canPost ? '#fff' : (isDark ? '#334155' : '#94a3b8') }]}>Post</Text>
                            </>
                        }
                    </LinearGradient>
                </TouchableOpacity>
            </SafeAreaView>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 60 }}
            >
                {/* ── Author Row ── */}
                <View style={[styles.authorSection, { backgroundColor: cardBg, borderBottomColor: border }]}>
                    <View style={styles.avatarWrap}>
                        <Image
                            source={{ uri: user?.profileImage || 'https://via.placeholder.com/50' }}
                            style={styles.avatar}
                        />
                        <View style={styles.onlineDot} />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.authorName, { color: tp }]}>
                            {user?.name || user?.userName || 'User'}
                        </Text>

                        {/* Privacy Selector Button */}
                        <TouchableOpacity
                            style={[styles.privacyChip, { backgroundColor: currentPrivacy.bg }]}
                            onPress={() => setShowPrivacyDropdown(prev => !prev)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={currentPrivacy.icon} size={13} color={currentPrivacy.color} />
                            <Text style={[styles.privacyChipText, { color: currentPrivacy.color }]}>
                                {currentPrivacy.label}
                            </Text>
                            <Ionicons
                                name={showPrivacyDropdown ? 'chevron-up' : 'chevron-down'}
                                size={13}
                                color={currentPrivacy.color}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Privacy Dropdown (Functional) ── */}
                {showPrivacyDropdown && (
                    <View style={[styles.privacyDropdown, { backgroundColor: cardBg, borderColor: border }]}>
                        <View style={[styles.privacyDropdownHeader, { borderBottomColor: border }]}>
                            <Ionicons name="shield-checkmark-outline" size={16} color={ts} />
                            <Text style={[styles.privacyDropdownTitle, { color: tp }]}>Who can see your post?</Text>
                        </View>
                        {PRIVACY_OPTIONS.map((opt, idx) => {
                            const isSelected = privacy === opt.value;
                            return (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[
                                        styles.privacyRow,
                                        { borderBottomColor: border },
                                        idx === PRIVACY_OPTIONS.length - 1 && { borderBottomWidth: 0 },
                                        isSelected && { backgroundColor: opt.bg },
                                    ]}
                                    onPress={() => handlePrivacySelect(opt.value)}
                                    activeOpacity={0.75}
                                >
                                    <View style={[styles.privacyIconBox, { backgroundColor: isSelected ? opt.bg : inputBg }]}>
                                        <Ionicons name={opt.icon} size={20} color={isSelected ? opt.color : ts} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.privacyLabel, { color: isSelected ? opt.color : tp, fontWeight: isSelected ? '800' : '700' }]}>
                                            {opt.label}
                                        </Text>
                                        <Text style={[styles.privacyDesc, { color: ts }]}>{opt.description}</Text>
                                    </View>
                                    <View style={[styles.privacyRadio, { borderColor: isSelected ? opt.color : tm }]}>
                                        {isSelected && <View style={[styles.privacyRadioFill, { backgroundColor: opt.color }]} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* ── Text Input Card ── */}
                <View style={[styles.inputCard, { backgroundColor: cardBg }]}>
                    <TextInput
                        style={[styles.textInput, { color: tp }]}
                        placeholder="What's on your mind? Share your opinion..."
                        placeholderTextColor={ts}
                        multiline
                        value={description}
                        onChangeText={setDescription}
                        maxLength={5000}
                        textAlignVertical="top"
                        autoFocus
                    />
                    <View style={[styles.charRow, { borderTopColor: border }]}>
                        <View style={[styles.charBarTrack, { backgroundColor: tm }]}>
                            <View style={[styles.charBarFill, { width: `${Math.min(charPct * 100, 100)}%`, backgroundColor: charColor }]} />
                        </View>
                        <Text style={[styles.charCount, { color: charColor }]}>
                            {description.length}/5000
                        </Text>
                    </View>
                </View>

                {/* ── Upload Progress Banner ── */}
                {isAnyUploading && (
                    <View style={[styles.uploadBanner, { backgroundColor: isDark ? '#0c1f3d' : '#eff6ff', borderColor: isDark ? '#1e3a5f' : '#bfdbfe' }]}>
                        <ActivityIndicator size="small" color="#3b82f6" />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.uploadTitle, { color: '#3b82f6' }]}>
                                {isUploadingImage ? 'Uploading image...' : isUploadingVideo ? 'Uploading video — this may take a moment...' : `Uploading PDF${uploadProgress > 0 ? ` ${uploadProgress}%` : '...'}`}
                            </Text>
                        </View>
                        {isUploadingPdf && uploadProgress > 0 && (
                            <Text style={{ fontSize: 13, fontWeight: '800', color: '#3b82f6' }}>{uploadProgress}%</Text>
                        )}
                    </View>
                )}

                {/* ── Image Preview ── */}
                {selectedImage && (
                    <View style={[styles.mediaCard, { backgroundColor: cardBg, borderColor: border }]}>
                        <View style={[styles.mediaCardHeader, { borderBottomColor: border }]}>
                            <View style={styles.mediaHeaderLeft}>
                                <LinearGradient colors={['#10b981', '#059669']} style={styles.mediaHeaderIcon}>
                                    <Ionicons name="image" size={14} color="#fff" />
                                </LinearGradient>
                                <Text style={[styles.mediaHeaderTitle, { color: tp }]}>Photo</Text>
                            </View>
                            <TouchableOpacity onPress={handleRemoveImage} style={styles.removeBtn} activeOpacity={0.8}>
                                <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.removeBtnGrad}>
                                    <Ionicons name="close" size={14} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                        <Image source={{ uri: selectedImage }} style={styles.imagePreview} resizeMode="cover" />
                    </View>
                )}

                {/* ── Video Preview ── */}
                {selectedVideo && (
                    <View style={[styles.mediaCard, { backgroundColor: cardBg, borderColor: border }]}>
                        <View style={[styles.mediaCardHeader, { borderBottomColor: border }]}>
                            <View style={styles.mediaHeaderLeft}>
                                <LinearGradient colors={['#f43f5e', '#e11d48']} style={styles.mediaHeaderIcon}>
                                    <Ionicons name="videocam" size={14} color="#fff" />
                                </LinearGradient>
                                <Text style={[styles.mediaHeaderTitle, { color: tp }]}>Video</Text>
                            </View>
                            <TouchableOpacity onPress={handleRemoveVideo} style={styles.removeBtn} activeOpacity={0.8}>
                                <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.removeBtnGrad}>
                                    <Ionicons name="close" size={14} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.videoPreview, { backgroundColor: inputBg }]}>
                            <LinearGradient
                                colors={isDark ? ['rgba(244,63,94,0.15)', 'rgba(244,63,94,0.05)'] : ['rgba(244,63,94,0.1)', 'rgba(244,63,94,0.03)']}
                                style={styles.videoIconCircle}
                            >
                                <Ionicons name="play-circle" size={56} color="#f43f5e" />
                            </LinearGradient>
                            <Text style={[styles.videoReadyText, { color: tp }]}>Video Ready</Text>
                            <Text style={[styles.videoReadySub, { color: ts }]}>Uploaded successfully • will appear in post</Text>
                        </View>
                    </View>
                )}

                {/* ── PDF Preview ── */}
                {selectedPdf && (
                    <View style={[styles.mediaCard, { backgroundColor: cardBg, borderColor: border }]}>
                        <View style={[styles.mediaCardHeader, { borderBottomColor: border }]}>
                            <View style={styles.mediaHeaderLeft}>
                                <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.mediaHeaderIcon}>
                                    <Ionicons name="document-text" size={14} color="#fff" />
                                </LinearGradient>
                                <Text style={[styles.mediaHeaderTitle, { color: tp }]}>PDF Document</Text>
                            </View>
                            <TouchableOpacity onPress={handleRemovePdf} style={styles.removeBtn} activeOpacity={0.8}>
                                <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.removeBtnGrad}>
                                    <Ionicons name="close" size={14} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.pdfPreview, { backgroundColor: inputBg }]}>
                            <LinearGradient
                                colors={isDark ? ['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)'] : ['rgba(239,68,68,0.1)', 'rgba(239,68,68,0.03)']}
                                style={styles.pdfIconCircle}
                            >
                                <Ionicons name="document-text" size={44} color="#ef4444" />
                            </LinearGradient>
                            <Text style={[styles.pdfName, { color: tp }]} numberOfLines={2}>{selectedPdf.name}</Text>
                            <Text style={[styles.pdfSub, { color: ts }]}>PDF attached to your post</Text>
                        </View>
                    </View>
                )}

                {/* ── Media Action Tiles ── */}
                <View style={[styles.actionsCard, { backgroundColor: cardBg, borderColor: border }]}>
                    <View style={[styles.actionsHeader, { borderBottomColor: border }]}>
                        <Text style={[styles.actionsTitle, { color: tp }]}>Add to your post</Text>
                        <Ionicons name="add-circle-outline" size={20} color={ts} />
                    </View>

                    <View style={styles.actionGrid}>
                        {mediaTiles.map(tile => (
                            <TouchableOpacity
                                key={tile.label}
                                style={[
                                    styles.actionTile,
                                    { backgroundColor: tile.active ? tile.bg : inputBg, borderColor: tile.active ? tile.color + '40' : border },
                                    (tile.disabled && !tile.active) && styles.actionTileDisabled,
                                ]}
                                onPress={tile.onPress}
                                disabled={tile.disabled && !tile.active}
                                activeOpacity={0.75}
                            >
                                {tile.loading ? (
                                    <View style={[styles.actionIconBox, { backgroundColor: tile.bg }]}>
                                        <ActivityIndicator size="small" color={tile.color} />
                                    </View>
                                ) : (
                                    <View style={[styles.actionIconBox, { backgroundColor: tile.active ? tile.color + '25' : tile.bg }]}>
                                        <Ionicons
                                            name={tile.icon}
                                            size={22}
                                            color={(tile.disabled && !tile.active) ? ts : tile.color}
                                        />
                                    </View>
                                )}
                                <Text style={[
                                    styles.actionTileLabel,
                                    { color: tile.active ? tile.color : ((tile.disabled && !tile.active) ? ts : tp) },
                                ]}>
                                    {tile.label}
                                </Text>
                                {/* @ts-ignore */}
                                {tile.soon && (
                                    <View style={styles.soonBadge}>
                                        <Text style={styles.soonText}>Soon</Text>
                                    </View>
                                )}
                                {tile.active && (
                                    <View style={[styles.activeDot, { backgroundColor: tile.color }]} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── Privacy Reminder ── */}
                <View style={[styles.privacyInfo, { backgroundColor: isDark ? currentPrivacy.bg : currentPrivacy.bg, borderColor: currentPrivacy.color + '30' }]}>
                    <Ionicons name={currentPrivacy.icon} size={16} color={currentPrivacy.color} />
                    <Text style={[styles.privacyInfoText, { color: currentPrivacy.color }]}>
                        Visible to: <Text style={{ fontWeight: '800' }}>{currentPrivacy.label}</Text>
                        {'  ·  '}
                        {currentPrivacy.description}
                    </Text>
                </View>

                {/* ── Tips Card ── */}
                <View style={[styles.tipsCard, { backgroundColor: isDark ? 'rgba(13,148,136,0.08)' : 'rgba(13,148,136,0.06)', borderColor: isDark ? 'rgba(20,184,166,0.2)' : 'rgba(13,148,136,0.15)' }]}>
                    <Ionicons name="bulb-outline" size={16} color="#0D9488" />
                    <Text style={[styles.tipsText, { color: isDark ? '#14b8a6' : '#0f766e' }]}>
                        Share your thoughts, book reviews, or reading insights with the FlyBook community.
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },

    // ── Header ──────────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    navBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.4,
    },
    postBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        minWidth: 80,
        justifyContent: 'center',
    },
    postBtnText: {
        fontSize: 15,
        fontWeight: '800',
    },

    // ── Author ───────────────────────────────────────────────────────────────
    authorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        marginBottom: 2,
    },
    avatarWrap: { position: 'relative' },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 13,
        height: 13,
        borderRadius: 6.5,
        backgroundColor: '#22c55e',
        borderWidth: 2,
        borderColor: '#fff',
    },
    authorName: { fontSize: 16, fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 },
    privacyChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    privacyChipText: { fontSize: 12, fontWeight: '800' },

    // ── Privacy Dropdown ─────────────────────────────────────────────────────
    privacyDropdown: {
        marginHorizontal: 12,
        marginBottom: 8,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 10,
    },
    privacyDropdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    privacyDropdownTitle: { fontSize: 13, fontWeight: '700' },
    privacyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        gap: 12,
    },
    privacyIconBox: {
        width: 46,
        height: 46,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    privacyLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    privacyDesc: { fontSize: 12, fontWeight: '500' },
    privacyRadio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    privacyRadioFill: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },

    // ── Input ────────────────────────────────────────────────────────────────
    inputCard: {
        marginHorizontal: 12,
        marginBottom: 8,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    textInput: {
        fontSize: 16,
        lineHeight: 26,
        minHeight: 160,
        padding: 18,
        fontWeight: '500',
    },
    charRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    charBarTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
    charBarFill: { height: 4, borderRadius: 2 },
    charCount: { fontSize: 11, fontWeight: '700', minWidth: 60, textAlign: 'right' },

    // ── Upload Banner ────────────────────────────────────────────────────────
    uploadBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 12,
        marginBottom: 8,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    uploadTitle: { fontSize: 13, fontWeight: '700' },

    // ── Media Cards ──────────────────────────────────────────────────────────
    mediaCard: {
        marginHorizontal: 12,
        marginBottom: 8,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    mediaCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    mediaHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    mediaHeaderIcon: {
        width: 28,
        height: 28,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaHeaderTitle: { fontSize: 14, fontWeight: '800' },
    removeBtn: { padding: 2 },
    removeBtnGrad: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePreview: { width: '100%', height: 260 },
    videoPreview: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 36,
        paddingHorizontal: 24,
        gap: 8,
    },
    videoIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    videoReadyText: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
    videoReadySub: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
    pdfPreview: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
        gap: 8,
    },
    pdfIconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    pdfName: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
    pdfSub: { fontSize: 12, fontWeight: '600' },

    // ── Actions Grid ─────────────────────────────────────────────────────────
    actionsCard: {
        marginHorizontal: 12,
        marginBottom: 8,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    actionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
    },
    actionsTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 12,
        gap: 10,
    },
    actionTile: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 6,
        borderRadius: 16,
        borderWidth: 1.5,
        width: (width - 24 - 30) / 4,
        position: 'relative',
        gap: 6,
    },
    actionTileDisabled: { opacity: 0.45 },
    actionIconBox: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTileLabel: { fontSize: 12, fontWeight: '700' },
    soonBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: '#f59e0b',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 6,
    },
    soonText: { fontSize: 8, color: '#fff', fontWeight: '800' },
    activeDot: {
        position: 'absolute',
        top: 5,
        left: 5,
        width: 9,
        height: 9,
        borderRadius: 4.5,
    },

    // ── Privacy Info ─────────────────────────────────────────────────────────
    privacyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 12,
        marginBottom: 8,
        padding: 13,
        borderRadius: 14,
        borderWidth: 1,
    },
    privacyInfoText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },

    // ── Tips ─────────────────────────────────────────────────────────────────
    tipsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 12,
        marginBottom: 8,
        padding: 13,
        borderRadius: 14,
        borderWidth: 1,
    },
    tipsText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
});

export default CreateOpinion;