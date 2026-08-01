
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    Dimensions,
    Linking,
    Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { get } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface Product {
    _id: string;
    productName: string;
    productImage: string;
    productPrice: number;
    productDescription?: string;
}

interface Shop {
    _id: string;
    shopName: string;
    shopImage: string;
    shopCategory: string;
    paymentPercentage: number;
    shopOwnerName: string;
    contactNumber: string;
    mapLocation: {
        lat: number;
        lng: number;
    };
    locationDetails?: {
        division: string;
        district: string;
        thana: string;
        union?: string;
        area?: string;
    };
}

const ShopDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { isDark } = useTheme();
    const { shop } = route.params as { shop: Shop };

    interface ShopPost {
        _id: string;
        content: string;
        images: string[];
        createdAt: string;
    }

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'products' | 'posts'>('products');
    const [posts, setPosts] = useState<ShopPost[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchPosts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await get<{ success: boolean; data: Product[] }>(`/api/shops/${shop._id}/products`);
            if (res.success) {
                setProducts(res.data);
            }
        } catch (error) {
            console.error('Error fetching shop products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPosts = async () => {
        setPostsLoading(true);
        try {
            const res = await get<{ success: boolean; data: ShopPost[] }>(`/api/shops/${shop._id}/posts`);
            if (res.success) {
                setPosts(res.data);
            }
        } catch (error) {
            console.error('Error fetching shop posts:', error);
        } finally {
            setPostsLoading(false);
        }
    };

    const handleCall = () => {
        if (shop.contactNumber) {
            Linking.openURL(`tel:${shop.contactNumber}`);
        }
    };

    const handleMap = () => {
        const url = Platform.select({
            ios: `maps:0,0?q=${shop.shopName}@${shop.mapLocation.lat},${shop.mapLocation.lng}`,
            android: `geo:0,0?q=${shop.mapLocation.lat},${shop.mapLocation.lng}(${shop.shopName})`,
        });
        if (url) Linking.openURL(url);
    };

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0F172A' }]}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    <Image source={{ uri: shop.shopImage }} style={styles.heroImage} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.heroOverlay}
                    />
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.heroContent}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{shop.shopCategory || 'Partner Shop'}</Text>
                        </View>
                        <Text style={styles.shopName}>{shop.shopName}</Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={16} color="#4F46E5" />
                            <Text style={styles.locationText}>
                                {shop.locationDetails?.area || shop.locationDetails?.thana}, {shop.locationDetails?.district}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Stats & Actions */}
                <View style={[styles.statsRow, isDark && { backgroundColor: '#1E293B', borderBottomColor: '#334155' }]}>
                    <View style={styles.statItem}>
                        <Text style={styles.statVal}>Up to {shop.paymentPercentage}%</Text>
                        <Text style={styles.statLabel}>OFF</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <TouchableOpacity style={styles.statItem} onPress={handleCall}>
                        <Ionicons name="call" size={20} color="#4F46E5" />
                        <Text style={styles.statLabel}>Contact</Text>
                    </TouchableOpacity>
                    <View style={styles.statDivider} />
                    <TouchableOpacity style={styles.statItem} onPress={handleMap}>
                        <Ionicons name="navigate" size={20} color="#4F46E5" />
                        <Text style={styles.statLabel}>Directions</Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Selector */}
                <View style={[styles.tabContainer, isDark && { borderBottomColor: '#334155' }]}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'products' && styles.activeTabButton]}
                        onPress={() => setActiveTab('products')}
                    >
                        <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText, isDark && { color: activeTab === 'products' ? '#FFF' : '#64748B' }]}>
                            Available Items ({products.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'posts' && styles.activeTabButton]}
                        onPress={() => setActiveTab('posts')}
                    >
                        <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText, isDark && { color: activeTab === 'posts' ? '#FFF' : '#64748B' }]}>
                            Shop Updates ({posts.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'products' ? (
                    <View style={styles.productSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, isDark && { color: '#FFF' }]}>Available Items</Text>
                            <Text style={styles.itemsCount}>{products.length} products</Text>
                        </View>

                        {loading ? (
                            <ActivityIndicator size="small" color="#4F46E5" style={{ marginTop: 30 }} />
                        ) : products.length === 0 ? (
                            <View style={styles.noProducts}>
                                <Ionicons name="basket-outline" size={40} color="#CBD5E1" />
                                <Text style={styles.noProductsText}>No products listed by this shop yet.</Text>
                            </View>
                        ) : (
                            <View style={styles.productGrid}>
                                {products.map(product => (
                                    <View key={product._id} style={[styles.productCard, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                                        <Image source={{ uri: product.productImage }} style={styles.productImage} />
                                        <View style={styles.productInfo}>
                                            <Text style={[styles.productName, isDark && { color: '#FFF' }]} numberOfLines={1}>
                                                {product.productName}
                                            </Text>
                                            <Text style={styles.productPrice}>৳ {product.productPrice}</Text>
                                            {product.productDescription ? (
                                                <Text style={styles.productDesc} numberOfLines={2}>
                                                    {product.productDescription}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.productSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, isDark && { color: '#FFF' }]}>Shop Updates</Text>
                            <Text style={styles.itemsCount}>{posts.length} posts</Text>
                        </View>

                        {postsLoading ? (
                            <ActivityIndicator size="small" color="#4F46E5" style={{ marginTop: 30 }} />
                        ) : posts.length === 0 ? (
                            <View style={styles.noProducts}>
                                <Ionicons name="newspaper-outline" size={40} color="#CBD5E1" />
                                <Text style={styles.noProductsText}>No updates or posts from this shop yet.</Text>
                            </View>
                        ) : (
                            <View style={styles.postsList}>
                                {posts.map(post => (
                                    <View key={post._id} style={[styles.detailPostCard, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                                        <View style={styles.postCardHeader}>
                                            <View style={styles.avatarCircle}>
                                                <Ionicons name="storefront" size={18} color="#FFF" />
                                            </View>
                                            <View style={styles.postMeta}>
                                                <Text style={[styles.postAuthor, isDark && { color: '#FFF' }]}>{shop.shopName}</Text>
                                                <Text style={styles.postDate}>{new Date(post.createdAt).toLocaleDateString()}</Text>
                                            </View>
                                        </View>
                                        {post.content ? (
                                            <Text style={[styles.postDescText, isDark && { color: '#CBD5E1' }]}>{post.content}</Text>
                                        ) : null}
                                        {post.images && post.images.length > 0 ? (
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.postImgScroll}>
                                                {post.images.map((img, i) => (
                                                    <Image key={i} source={{ uri: img }} style={styles.postImgItem} />
                                                ))}
                                            </ScrollView>
                                        ) : null}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    content: { flex: 1 },
    heroContainer: { height: 350, width: '100%' },
    heroImage: { width: '100%', height: '100%' },
    heroOverlay: { ...StyleSheet.absoluteFillObject },
    backBtn: { position: 'absolute', top: 60, left: 20, width: 45, height: 45, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
    heroContent: { position: 'absolute', bottom: 30, left: 20, right: 20 },
    categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#4F46E5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 10 },
    categoryText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    shopName: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    locationText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginLeft: 6 },
    statsRow: { flexDirection: 'row', paddingVertical: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    statItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    statVal: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 4 },
    statLabel: { fontSize: 12, color: '#64748B', fontWeight: 'bold' },
    statDivider: { width: 1, height: '70%', backgroundColor: '#E2E8F0' },
    productSection: { padding: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    itemsCount: { color: '#64748B', fontSize: 13 },
    noProducts: { alignItems: 'center', marginTop: 40 },
    noProductsText: { color: '#94A3B8', marginTop: 10, fontSize: 14 },
    productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    productCard: { width: (width - 55) / 2, backgroundColor: '#FFF', borderRadius: 24, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', elevation: 3 },
    productImage: { width: '100%', height: 160, backgroundColor: '#F8FAFC' },
    productInfo: { padding: 12 },
    productName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
    productPrice: { fontSize: 14, color: '#4F46E5', fontWeight: 'bold', marginVertical: 4 },
    productDesc: { fontSize: 11, color: '#94A3B8', lineHeight: 15 },
    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginTop: 10 },
    tabButton: { flex: 1, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTabButton: { borderBottomColor: '#4F46E5' },
    tabText: { fontSize: 14, fontWeight: 'bold', color: '#64748B' },
    activeTabText: { color: '#4F46E5' },
    postsList: { width: '100%' },
    detailPostCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    postCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
    postMeta: { flex: 1 },
    postAuthor: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
    postDate: { fontSize: 11, color: '#64748B', marginTop: 2 },
    postDescText: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 12 },
    postImgScroll: { flexDirection: 'row', marginTop: 4 },
    postImgItem: { width: width * 0.65, height: 180, borderRadius: 12, marginRight: 10, resizeMode: 'cover' }
});

export default ShopDetailsScreen;
