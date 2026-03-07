import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    FlatList,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    RefreshControl,
    Animated,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get } from '../../services/api';
import LinearGradient from 'react-native-linear-gradient';
import CustomHeader from '../../components/common/CustomHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';

const { width } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
    _id: string;
    title: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    images: string[];
    category: string;
    rating?: number;
    reviews?: number;
    stock: number;
    isFeatured?: boolean;
}

interface Category {
    _id: string;
    name: string;
}

interface Banner {
    _id: string;
    image: string;
    title: string;
    description: string;
    ctaText: string;
    ctaLink: string;
}

// ─── Hero Banner Slider ──────────────────────────────────────────────────────

const HeroSlider = ({ banners }: { banners: Banner[] }) => {
    const [activeSlide, setActiveSlide] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            let nextIndex = activeSlide + 1;
            if (nextIndex >= banners.length) nextIndex = 0;
            scrollViewRef.current?.scrollTo({ x: nextIndex * (width - 32), animated: true });
            setActiveSlide(nextIndex);
        }, 5000);
        return () => clearInterval(interval);
    }, [activeSlide, banners.length]);

    if (banners.length === 0) return null;

    return (
        <View style={styles.sliderWrapper}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    {
                        useNativeDriver: false, listener: (event: any) => {
                            const slide = Math.round(event.nativeEvent.contentOffset.x / (width - 32));
                            if (slide !== activeSlide) setActiveSlide(slide);
                        }
                    }
                )}
                scrollEventThrottle={16}
            >
                {banners.map((banner) => (
                    <TouchableOpacity
                        key={banner._id}
                        style={styles.slide}
                        activeOpacity={0.9}
                    >
                        <Image source={{ uri: banner.image }} style={styles.bannerImg} />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)']}
                            style={styles.bannerOverlay}
                        >
                            <View style={styles.bannerInfo}>
                                <View style={styles.bannerBadgeContainer}>
                                    <Text style={styles.bannerBadge}>Special Offer</Text>
                                </View>
                                <Text style={styles.bannerTitle} numberOfLines={2}>{banner.title}</Text>
                                <Text style={styles.bannerDesc} numberOfLines={2}>{banner.description}</Text>
                                <View style={styles.bannerCta}>
                                    <Text style={styles.bannerCtaText}>{banner.ctaText || 'Shop Now'}</Text>
                                    <Ionicons name="arrow-forward" size={14} color="#0D9488" />
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <View style={styles.pagination}>
                {banners.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            activeSlide === i ? styles.activeDot : null
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

// ─── Marketplace Component ───────────────────────────────────────────────────

const Marketplace = ({ navigation }: any) => {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const { cartCount } = useCart();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Fetching Data
    const { data: banners = [] } = useQuery({
        queryKey: ['market-banners'],
        queryFn: () => get<{ banners: Banner[] }>('/home-banners').then(res => res.banners || []),
        staleTime: 1000 * 60 * 5,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['market-categories'],
        queryFn: () => get<{ categories: Category[] }>('/get-product-categories').then(res => res.categories || []),
        staleTime: 1000 * 60 * 5,
    });

    const { data: flashDeals = [], isLoading: loadingFlash } = useQuery({
        queryKey: ['market-flash-deals'],
        queryFn: () => get<{ products: Product[] }>('/products/high-discounts').then(res => res.products || []),
        staleTime: 1000 * 60 * 5,
    });

    const { data: featuredProducts = [] } = useQuery({
        queryKey: ['market-featured'],
        queryFn: () => get<{ products: Product[] }>('/products/featured').then(res => res.products || []),
        staleTime: 1000 * 60 * 5,
    });

    const { data: latestProducts = [] } = useQuery({
        queryKey: ['market-latest'],
        queryFn: () => get<{ products: Product[] }>('/products/latest').then(res => res.products || []),
        staleTime: 1000 * 60 * 5,
    });

    const { data: topRated = [] } = useQuery({
        queryKey: ['market-top-rated'],
        queryFn: () => get<{ products: Product[] }>('/products/top-rated').then(res => res.products || []),
        staleTime: 1000 * 60 * 5,
    });

    const { data: trendingData } = useQuery({
        queryKey: ['market-trending'],
        queryFn: () => get<{ products: Product[], category: string }>('/products/most-popular-category'),
        staleTime: 1000 * 60 * 5,
    });

    const { data: allProducts = [] } = useQuery({
        queryKey: ['market-all-products'],
        queryFn: () => get<{ products: Product[] }>('/get-market-product').then(res => res.products || []),
        staleTime: 1000 * 60 * 5,
    });

    const electronicsProducts = useMemo(
        () => allProducts.filter(p => p.category === 'Electronics'),
        [allProducts]
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await queryClient.invalidateQueries({ queryKey: ['market-banners'] });
        await queryClient.invalidateQueries({ queryKey: ['market-categories'] });
        await queryClient.invalidateQueries({ queryKey: ['market-flash-deals'] });
        await queryClient.invalidateQueries({ queryKey: ['market-featured'] });
        await queryClient.invalidateQueries({ queryKey: ['market-latest'] });
        await queryClient.invalidateQueries({ queryKey: ['market-top-rated'] });
        await queryClient.invalidateQueries({ queryKey: ['market-trending'] });
        await queryClient.invalidateQueries({ queryKey: ['market-all-products'] });
        setRefreshing(false);
    }, [queryClient]);

    const handleSearch = () => {
        navigation.navigate('MarketplaceSearch', { initialQuery: searchQuery });
    };

    const { data: sellerStatus } = useQuery({
        queryKey: ['seller-check', user?._id],
        queryFn: () => get<any>(`/sellers/check/${user?._id}`).then(res => res || { isSeller: false }),
        enabled: !!user?._id
    });

    const handleProfilePress = () => {
        if (sellerStatus?.isSeller) {
            navigation.navigate('SellerDashboard');
        } else {
            navigation.navigate('MarketUser');
        }
    };

    const renderProductItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={[styles.productCard, isDark && styles.productCardDark]}
            onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.images[0] }} style={styles.productImage} />
                {item.discount && (
                    <LinearGradient
                        colors={['#EF4444', '#B91C1C']}
                        style={styles.discountBadge}
                    >
                        <Text style={styles.discountText}>-{item.discount}%</Text>
                    </LinearGradient>
                )}
                <View style={[styles.wishlistBtn, isDark && { backgroundColor: 'rgba(30, 41, 59, 0.8)' }]}>
                    <Ionicons name="heart-outline" size={18} color={isDark ? "#94A3B8" : "#64748B"} />
                </View>
            </View>
            <View style={styles.productInfo}>
                <View style={[styles.categoryBadge, isDark && styles.categoryBadgeDark]}>
                    <Text style={styles.productCategory}>{item.category}</Text>
                </View>
                <Text style={[styles.productTitle, isDark && styles.textLight]} numberOfLines={2}>{item.title}</Text>

                <View style={[styles.statsRow, { justifyContent: 'space-between', marginTop: 8 }]}>
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#FBBF24" />
                        <Text style={[styles.ratingText, isDark && styles.textLight]}>{item.rating || '4.5'}</Text>
                        <Text style={styles.reviewsText}>({item.reviews || 0})</Text>
                    </View>
                    <View style={styles.stockStatus}>
                        <View style={[styles.stockDot, { backgroundColor: item.stock > 0 ? '#10B981' : '#EF4444' }]} />
                        <Text style={styles.stockText}>{item.stock > 0 ? 'In Stock' : 'Out'}</Text>
                    </View>
                </View>

                <View style={styles.priceRow}>
                    <Text style={[styles.priceText, isDark && styles.textLight]}>৳{item.price?.toLocaleString()}</Text>
                    {item.originalPrice && (
                        <Text style={styles.originalPriceText}>৳{item.originalPrice.toLocaleString()}</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderCategoryItem = ({ item }: { item: Category }) => (
        <TouchableOpacity
            style={[styles.categoryCard, isDark && styles.categoryCardDark]}
            onPress={() => navigation.navigate('CategoryProducts', { categoryId: item._id, categoryName: item.name })}
        >
            <LinearGradient
                colors={isDark ? ['#1e293b', '#0f172a'] : ['#F0FDFA', '#CCFBF1']}
                style={styles.categoryIconCircle}
            >
                <Ionicons name="grid-outline" size={20} color="#0D9488" />
            </LinearGradient>
            <Text style={[styles.categoryName, isDark && styles.textLight]} numberOfLines={1}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0f172a" : "#FFF"} />
            <CustomHeader
                title="Fly Marketplace"
                rightComponent={
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={styles.headerCartBtn}
                            onPress={() => navigation.navigate('Cart')}
                        >
                            <Ionicons name="cart-outline" size={26} color={isDark ? "#FFF" : "#111827"} />
                            {cartCount > 0 && (
                                <View style={[styles.headerCartBadge, isDark && styles.headerCartBadgeDark]}>
                                    <Text style={styles.headerCartBadgeText}>{cartCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerUserBtn}
                            onPress={handleProfilePress}
                        >
                            <Ionicons name="person-outline" size={24} color={isDark ? "#FFF" : "#111827"} />
                        </TouchableOpacity>
                    </View>
                }
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[1]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D9488" />
                }
            >
                {/* 1. Hero Banners */}
                <HeroSlider banners={banners} />

                {/* 2. Search & Cart Row */}
                <View style={[styles.headerActions, isDark && styles.headerActionsDark]}>
                    <TouchableOpacity
                        style={[styles.searchBar, isDark && styles.searchBarDark]}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('MarketplaceSearch')}
                    >
                        <Ionicons name="search-outline" size={20} color={isDark ? "#94A3B8" : "#9CA3AF"} />
                        <TextInput
                            style={[styles.searchInput, isDark && styles.textLight]}
                            placeholder="Find products, stores..."
                            placeholderTextColor={isDark ? "#64748B" : "#9CA3AF"}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            editable={false}
                            pointerEvents="none"
                        />
                    </TouchableOpacity>
                </View>

                {/* 3. Categories Horizontal */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Shop by Category</Text>
                        <TouchableOpacity><Text style={styles.seeAllText}>View All</Text></TouchableOpacity>
                    </View>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={categories}
                        renderItem={renderCategoryItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.horizontalList}
                    />
                </View>

                {/* 4. Flash Deals ⚡ */}
                {flashDeals.length > 0 && (
                    <View style={styles.section}>
                        <LinearGradient
                            colors={isDark ? ['#1e293b', '#0f172a'] : ['#FFEDD5', '#FFF7ED']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.flashHeaderGradient}
                        >
                            <View style={styles.titleRow}>
                                <Text style={[styles.flashTitle, isDark && styles.textLight]}>Flash Deals</Text>
                                <Ionicons name="flash" size={20} color="#F59E0B" style={{ marginLeft: 6 }} />
                            </View>
                            <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
                        </LinearGradient>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={flashDeals}
                            renderItem={renderProductItem}
                            keyExtractor={item => item._id}
                            contentContainerStyle={styles.productList}
                        />
                    </View>
                )}

                {/* 5. Trending Now 🔥 */}
                {trendingData?.products && trendingData.products.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.titleRow}>
                                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Trending Now</Text>
                                <Ionicons name="flame" size={20} color="#EF4444" style={{ marginLeft: 6 }} />
                            </View>
                        </View>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={trendingData.products}
                            renderItem={renderProductItem}
                            keyExtractor={item => item._id}
                            contentContainerStyle={styles.productList}
                        />
                    </View>
                )}

                {/* 6. Featured Collections 🎯 */}
                {featuredProducts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.titleRow}>
                                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Featured Collections</Text>
                                <Ionicons name="bookmark" size={18} color="#3B82F6" style={{ marginLeft: 6 }} />
                            </View>
                        </View>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={featuredProducts}
                            renderItem={renderProductItem}
                            keyExtractor={item => item._id}
                            contentContainerStyle={styles.productList}
                        />
                    </View>
                )}

                {/* 7. New Arrivals ✨ */}
                {latestProducts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.titleRow}>
                                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>New Arrivals</Text>
                                <Text style={{ fontSize: 18, marginLeft: 6 }}>✨</Text>
                            </View>
                        </View>
                        <View style={styles.gridContainer}>
                            {latestProducts.map((product) => (
                                <View key={product._id} style={styles.gridItem}>
                                    <TouchableOpacity
                                        style={[styles.gridCard, isDark && styles.gridCardDark]}
                                        onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
                                    >
                                        <Image source={{ uri: product.images[0] }} style={styles.gridImage} />
                                        <View style={styles.gridInfo}>
                                            <Text style={[styles.gridTitle, isDark && styles.textLight]} numberOfLines={1}>{product.title}</Text>
                                            <Text style={[styles.gridPrice, isDark && styles.textLight]}>৳{product.price.toLocaleString()}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* 8. Top Rated 🏆 */}
                {topRated.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.titleRow}>
                                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Top Rated</Text>
                                <Ionicons name="trophy" size={18} color="#FBBF24" style={{ marginLeft: 6 }} />
                            </View>
                        </View>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={topRated}
                            renderItem={renderProductItem}
                            keyExtractor={item => item._id}
                            contentContainerStyle={styles.productList}
                        />
                    </View>
                )}

                {/* 9. Electronics Hub 📱 */}
                {electronicsProducts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.titleRow}>
                                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Electronics Hub</Text>
                                <Ionicons name="phone-portrait-outline" size={18} color="#0D9488" style={{ marginLeft: 6 }} />
                            </View>
                        </View>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={electronicsProducts}
                            renderItem={renderProductItem}
                            keyExtractor={item => item._id}
                            contentContainerStyle={styles.productList}
                        />
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

export default Marketplace;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    containerDark: { backgroundColor: '#0f172a' },
    textLight: { color: '#F8FAFC' },

    sliderWrapper: { marginTop: 16, paddingHorizontal: 16, position: 'relative' },
    slide: { width: width - 32, height: 220, borderRadius: 24, overflow: 'hidden', marginRight: 16 },
    bannerImg: { width: '100%', height: '100%' },
    bannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'flex-end', padding: 24 },
    bannerInfo: { gap: 8 },
    bannerBadgeContainer: { alignSelf: 'flex-start' },
    bannerBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, color: '#fff', fontSize: 11, fontWeight: '700', alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 },
    bannerTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', lineHeight: 34, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    bannerDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500', lineHeight: 20 },
    bannerCta: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginTop: 4, gap: 6 },
    bannerCtaText: { color: '#0D9488', fontSize: 13, fontWeight: '800' },
    pagination: { position: 'absolute', top: 30, right: 30, flexDirection: 'row', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    activeDot: { width: 14, backgroundColor: '#FFF' },

    headerActions: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, backgroundColor: '#F8FAFC', zIndex: 10 },
    headerActionsDark: { backgroundColor: '#0f172a' },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, paddingHorizontal: 16, height: 54, elevation: 2, shadowColor: '#0D9488', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, borderWidth: 1, borderColor: '#F1F5F9' },
    searchBarDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1E293B', fontWeight: '500' },

    section: { marginTop: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
    seeAllText: { color: '#0D9488', fontWeight: '700', fontSize: 14 },
    horizontalList: { paddingHorizontal: 16, gap: 16 },

    categoryCard: { alignItems: 'center', gap: 10, width: 85 },
    categoryCardDark: { opacity: 1 },
    categoryIconCircle: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#0D9488', shadowOpacity: 0.1, shadowRadius: 8 },
    categoryName: { fontSize: 13, color: '#475569', fontWeight: '600', textAlign: 'center' },

    flashHeaderGradient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16 },
    flashTitle: { fontSize: 20, fontWeight: '900', color: '#B45309', letterSpacing: -0.5 },
    titleRow: { flexDirection: 'row', alignItems: 'center' },

    productList: { paddingHorizontal: 16, paddingRight: 32, gap: 16 },
    productCard: { width: 180, backgroundColor: '#FFF', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 15, elevation: 4, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9' },
    productCardDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
    imageContainer: { padding: 10, position: 'relative' },
    productImage: { width: '100%', height: 180, borderRadius: 20, backgroundColor: '#F8FAFC' },
    discountBadge: { position: 'absolute', top: 18, left: 18, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, zIndex: 5 },
    discountText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
    wishlistBtn: { position: 'absolute', top: 18, right: 18, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 5 },

    productInfo: { padding: 14, paddingTop: 6 },
    categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#F0FDFA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
    categoryBadgeDark: { backgroundColor: '#134E4A' },
    productCategory: { fontSize: 9, color: '#0D9488', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    productTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', lineHeight: 20, height: 40 },
    statsRow: { flexDirection: 'row', alignItems: 'center' },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { fontSize: 12, fontWeight: '800', color: '#1E293B', marginLeft: 4 },
    reviewsText: { fontSize: 12, color: '#64748B', marginLeft: 4 },
    stockStatus: { flexDirection: 'row', alignItems: 'center' },
    stockDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
    stockText: { fontSize: 10, color: '#64748B', fontWeight: '600' },

    priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    priceText: { fontSize: 18, fontWeight: '900', color: '#0D9488' },
    originalPriceText: { fontSize: 13, color: '#94A3B8', textDecorationLine: 'line-through', marginLeft: 8, fontWeight: '500' },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 11 },
    gridItem: { width: '50%', padding: 8 },
    gridCard: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 15 },
    gridCardDark: { backgroundColor: '#1e293b' },
    gridImage: { width: '100%', height: 200 },
    gridInfo: { padding: 14 },
    gridTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    gridPrice: { fontSize: 16, fontWeight: '900', color: '#0D9488', marginTop: 6 },

    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerUserBtn: { padding: 4 },
    headerCartBtn: { position: 'relative', padding: 4 },
    headerCartBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
    headerCartBadgeDark: { borderColor: '#0f172a' },
    headerCartBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
});
