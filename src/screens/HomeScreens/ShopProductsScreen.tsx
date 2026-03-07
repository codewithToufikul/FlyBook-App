
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
import { get, post, del } from '../../services/api';
import { handleImageUpload } from '../../utils/imageUpload';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface Product {
    _id: string;
    productName: string;
    productImage: string;
    productPrice: number;
    productDescription?: string;
}

const ShopProductsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { isDark } = useTheme();
    const { shopId, shopName } = route.params as { shopId: string; shopName: string };

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        productName: '',
        productPrice: '',
        productImage: '',
        productDescription: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await get<{ success: boolean; data: Product[] }>(`/api/shops/${shopId}/products`);
            if (res.success) {
                setProducts(res.data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async () => {
        try {
            const url = await handleImageUpload();
            if (url) {
                setFormData(p => ({ ...p, productImage: url }));
            }
        } catch (error) {
            console.error('Image pick error:', error);
        }
    };

    const handleAddProduct = async () => {
        if (!formData.productName || !formData.productImage || !formData.productPrice) {
            Alert.alert('Missing Fields', 'Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const res = await post(`/api/shops/${shopId}/products`, formData);
            if (res.success) {
                Alert.alert('Success', 'Product added successfully');
                setModalVisible(false);
                setFormData({ productName: '', productPrice: '', productImage: '', productDescription: '' });
                fetchProducts();
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to add product');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProduct = (productId: string) => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to remove this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await del(`/api/shops/products/${productId}`);
                            if (res.success) {
                                setProducts(prev => prev.filter(p => p._id !== productId));
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete product');
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
                    <Text style={styles.headerTitle}>Shop Products</Text>
                    <TouchableOpacity
                        style={styles.addIconBtn}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add" size={28} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>{shopName}</Text>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 50 }} />
                ) : products.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="cube-outline" size={80} color="#CBD5E1" />
                        <Text style={[styles.emptyTitle, isDark && { color: '#FFF' }]}>No Products Yet</Text>
                        <Text style={styles.emptyDesc}>Start adding products to your shop to attract more customers.</Text>
                        <TouchableOpacity style={styles.addBtnLarge} onPress={() => setModalVisible(true)}>
                            <Text style={styles.addBtnText}>Add First Product</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.productGrid}>
                        {products.map(product => (
                            <View key={product._id} style={[styles.productCard, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                                <Image source={{ uri: product.productImage }} style={styles.productImage} />
                                <TouchableOpacity
                                    style={styles.delBtn}
                                    onPress={() => handleDeleteProduct(product._id)}
                                >
                                    <View style={styles.delIconCircle}>
                                        <Ionicons name="trash" size={16} color="#FFF" />
                                    </View>
                                </TouchableOpacity>
                                <View style={styles.productInfo}>
                                    <Text style={[styles.productName, isDark && { color: '#FFF' }]} numberOfLines={1}>{product.productName}</Text>
                                    <Text style={styles.productPrice}>৳ {product.productPrice}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Add Product Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDark && { backgroundColor: '#0F172A' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && { color: '#FFF' }]}>Add New Product</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={26} color={isDark ? '#FFF' : '#333'} />
                            </TouchableOpacity>
                        </View>

                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                            <ScrollView style={styles.modalBody}>
                                <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
                                    {formData.productImage ? (
                                        <Image source={{ uri: formData.productImage }} style={styles.pickedImage} />
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <Ionicons name="camera-outline" size={40} color="#94A3B8" />
                                            <Text style={styles.imagePlaceholderText}>Upload Product Image</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, isDark && { color: '#CBD5E1' }]}>Product Name *</Text>
                                    <TextInput
                                        style={[styles.input, isDark && { backgroundColor: '#1E293B', color: '#FFF', borderColor: '#334155' }]}
                                        placeholder="Enter product name"
                                        placeholderTextColor="#94A3B8"
                                        value={formData.productName}
                                        onChangeText={t => setFormData(p => ({ ...p, productName: t }))}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, isDark && { color: '#CBD5E1' }]}>Price (৳) *</Text>
                                    <TextInput
                                        style={[styles.input, isDark && { backgroundColor: '#1E293B', color: '#FFF', borderColor: '#334155' }]}
                                        placeholder="0.00"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="numeric"
                                        value={formData.productPrice}
                                        onChangeText={t => setFormData(p => ({ ...p, productPrice: t }))}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, isDark && { color: '#CBD5E1' }]}>Description (Optional)</Text>
                                    <TextInput
                                        style={[styles.input, isDark && { backgroundColor: '#1E293B', color: '#FFF', borderColor: '#334155' }, { height: 100, textAlignVertical: 'top' }]}
                                        placeholder="Tell customers more about this item"
                                        placeholderTextColor="#94A3B8"
                                        multiline
                                        value={formData.productDescription}
                                        onChangeText={t => setFormData(p => ({ ...p, productDescription: t }))}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                                    onPress={handleAddProduct}
                                    disabled={submitting}
                                >
                                    {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Add Product</Text>}
                                </TouchableOpacity>
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAF6' },
    header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
    addIconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 5 },
    content: { flex: 1 },
    scrollContent: { padding: 15 },
    emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginTop: 20 },
    emptyDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 10 },
    addBtnLarge: { backgroundColor: '#4F46E5', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20, marginTop: 25 },
    addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    productCard: { width: (width - 45) / 2, backgroundColor: '#FFF', borderRadius: 20, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowOpacity: 0.05 },
    productImage: { width: '100%', height: 140, backgroundColor: '#F1F5F9' },
    delBtn: { position: 'absolute', top: 10, right: 10 },
    delIconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(239, 68, 68, 0.9)', alignItems: 'center', justifyContent: 'center' },
    productInfo: { padding: 12 },
    productName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
    productPrice: { fontSize: 14, color: '#4F46E5', fontWeight: '800' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: '#FFF', flex: 1, marginTop: Platform.OS === 'ios' ? 50 : 0 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, paddingTop: Platform.OS === 'ios' ? 20 : 40, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    modalBody: { padding: 20 },
    imagePicker: { height: 160, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 2, borderStyle: 'dashed', borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' },
    imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
    pickedImage: { width: '100%', height: '100%' },
    imagePlaceholderText: { fontSize: 14, color: '#94A3B8', marginTop: 10 },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 8 },
    input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 15, height: 50, color: '#333' },
    submitBtn: { backgroundColor: '#4F46E5', height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});

export default ShopProductsScreen;
