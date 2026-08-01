import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import { get, post, del } from '../../services/api';
import { compressImage } from '../../utils/imageUpload';
import { uploadToS3 } from '../../utils/s3Upload';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface ShopPost {
    _id: string;
    content: string;
    images: string[];
    createdAt: string;
}

const ShopPostsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { isDark } = useTheme();
    const { shopId, shopName } = route.params as { shopId: string; shopName: string };

    const [posts, setPosts] = useState<ShopPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await get<{ success: boolean; data: ShopPost[] }>(`/api/shops/${shopId}/posts`);
            if (res.success) {
                setPosts(res.data);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickImages = async () => {
        const options: any = {
            mediaType: 'photo',
            quality: 0.8,
            selectionLimit: 5, // Allow selecting up to 5 images
        };

        launchImageLibrary(options, async (response) => {
            if (response.didCancel) return;
            if (response.errorCode) {
                Alert.alert('Error', response.errorMessage || 'Failed to pick images');
                return;
            }
            if (response.assets) {
                setUploading(true);
                const urls: string[] = [];
                for (const asset of response.assets) {
                    if (asset.uri) {
                        try {
                            const compressedUri = await compressImage(asset.uri);
                            const result = await uploadToS3(compressedUri, 'image/jpeg', 'images');
                            urls.push(result.url);
                        } catch (err) {
                            console.error('Image upload failed for asset:', asset.uri, err);
                        }
                    }
                }
                setImages(prev => [...prev, ...urls]);
                setUploading(false);
            }
        });
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddPost = async () => {
        if (!content.trim() && images.length === 0) {
            Alert.alert('Empty Post', 'Please write something or select at least one image');
            return;
        }

        setSubmitting(true);
        try {
            const res = await post(`/api/shops/${shopId}/posts`, {
                content: content.trim(),
                images
            });
            if (res.success) {
                Alert.alert('Success', 'Shop post created successfully');
                setModalVisible(false);
                setContent('');
                setImages([]);
                fetchPosts();
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create post');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePost = (postId: string) => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await del<{ success: boolean }>(`/api/shops/posts/${postId}`);
                            if (res.success) {
                                setPosts(prev => prev.filter(p => p._id !== postId));
                            }
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to delete post');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0F172A' }]}>
            <LinearGradient
                colors={isDark ? ['#0F172A', '#1E293B'] : ['#4F46E5', '#6366F1']}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>{shopName}</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>Manage Shop Updates & Posts</Text>
            </LinearGradient>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : posts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="newspaper-outline" size={64} color={isDark ? '#334155' : '#CBD5E1'} />
                    <Text style={[styles.emptyTitle, isDark && { color: '#FFF' }]}>No updates posted yet</Text>
                    <Text style={styles.emptySubtitle}>Share news, offers, or new arrivals with your customers.</Text>
                    <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
                        <Text style={styles.createBtnText}>Create First Post</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    {posts.map(post => (
                        <View key={post._id} style={[styles.postCard, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardMeta}>
                                    <Ionicons name="time-outline" size={14} color="#64748B" />
                                    <Text style={styles.cardDate}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDeletePost(post._id)}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>

                            {post.content ? (
                                <Text style={[styles.postContent, isDark && { color: '#F1F5F9' }]}>{post.content}</Text>
                            ) : null}

                            {post.images && post.images.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.postImagesScroll}>
                                    {post.images.map((img, i) => (
                                        <Image key={i} source={{ uri: img }} style={styles.postImage} />
                                    ))}
                                </ScrollView>
                            ) : null}
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Create Post Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDark && { backgroundColor: '#0F172A' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && { color: '#FFF' }]}>Create Shop Update</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#333'} />
                            </TouchableOpacity>
                        </View>

                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                                <TextInput
                                    style={[styles.input, isDark && { backgroundColor: '#1E293B', color: '#FFF', borderColor: '#334155' }]}
                                    placeholder="Share details about products, discounts, or shop news..."
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    numberOfLines={6}
                                    value={content}
                                    onChangeText={setContent}
                                />

                                <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImages}>
                                    <Ionicons name="images-outline" size={22} color="#4F46E5" />
                                    <Text style={styles.imagePickerText}>Select Photos (Up to 5)</Text>
                                </TouchableOpacity>

                                {uploading && (
                                    <View style={styles.uploadLoader}>
                                        <ActivityIndicator size="small" color="#4F46E5" />
                                        <Text style={styles.uploadLoaderText}>Uploading photos to S3...</Text>
                                    </View>
                                )}

                                {images.length > 0 && (
                                    <View style={styles.previewContainer}>
                                        <Text style={[styles.previewTitle, isDark && { color: '#CBD5E1' }]}>Selected Images ({images.length})</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewScroll}>
                                            {images.map((img, i) => (
                                                <View key={i} style={styles.previewItem}>
                                                    <Image source={{ uri: img }} style={styles.previewImage} />
                                                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                                                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </ScrollView>

                            <TouchableOpacity
                                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                                onPress={handleAddPost}
                                disabled={submitting || uploading}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Post Update</Text>
                                )}
                            </TouchableOpacity>
                        </KeyboardAvoidingView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
    headerTitle: { flex: 1, marginHorizontal: 12, fontSize: 20, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
    addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
    headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', marginTop: 8 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 20 },
    postCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardDate: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    postContent: { fontSize: 14, color: '#1E293B', lineHeight: 20, marginBottom: 12 },
    postImagesScroll: { flexDirection: 'row', marginTop: 4 },
    postImage: { width: width * 0.6, height: 180, borderRadius: 12, marginRight: 10, resizeMode: 'cover' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginTop: 16, marginBottom: 8 },
    emptySubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18, marginBottom: 24 },
    createBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
    createBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { height: '80%', backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    form: { flex: 1 },
    input: { height: 120, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 15, padding: 12, fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC', marginBottom: 16 },
    imagePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#4F46E5', borderStyle: 'dashed', borderRadius: 15, paddingVertical: 14, marginBottom: 16 },
    imagePickerText: { fontSize: 14, color: '#4F46E5', fontWeight: 'bold' },
    uploadLoader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, justifyContent: 'center' },
    uploadLoaderText: { fontSize: 12, color: '#64748B' },
    previewContainer: { marginBottom: 20 },
    previewTitle: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 10 },
    previewScroll: { paddingVertical: 4 },
    previewItem: { position: 'relative', marginRight: 12 },
    previewImage: { width: 100, height: 100, borderRadius: 12 },
    removeBtn: { position: 'absolute', top: -6, right: -6 },
    submitBtn: { backgroundColor: '#4F46E5', borderRadius: 15, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});

export default ShopPostsScreen;
// End of ShopPostsScreen component
