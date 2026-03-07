import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../contexts/CartContext';
import CustomHeader from '../../components/common/CustomHeader';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

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
}

const CategoryProducts = ({ route, navigation }: any) => {
    const { categoryId, categoryName } = route.params;
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const { cartCount } = useCart();
    const [selectedCatName, setSelectedCatName] = useState(categoryName);

    const { data: categories = [] } = useQuery({
        queryKey: ['market-categories'],
        queryFn: () => get<{ categories: any[] }>('/get-product-categories').then(res => res.categories || []),
        staleTime: 1000 * 60 * 5,
    });

    const { data: products = [], isLoading } = useQuery({
        queryKey: ['market-category-products', selectedCatName],
        queryFn: () => get<{ products: Product[] }>(`/get-product-category?category=${selectedCatName}`).then(res => res.products || []),
        staleTime: 1000 * 60 * 5,
    });

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
            </View>
            <View style={styles.productInfo}>
                <View style={[styles.categoryBadge, isDark && { backgroundColor: '#134E4A' }]}>
                    <Text style={[styles.productCategory, isDark && { color: '#2DD4BF' }]}>{item.category || selectedCatName}</Text>
                </View>
                <Text style={[styles.productTitle, isDark && styles.textLight]} numberOfLines={2}>{item.title}</Text>

                <View style={[styles.statsRow, { justifyContent: 'space-between', marginTop: 8 }]}>
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#FBBF24" />
                        <Text style={[styles.ratingText, isDark && styles.textLight]}>{item.rating || '4.5'}</Text>
                        <Text style={styles.reviewsText}>({item.reviews || 0})</Text>
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

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <CustomHeader
                title={selectedCatName}
                rightComponent={
                    <TouchableOpacity
                        style={styles.cartBtn}
                        onPress={() => navigation.navigate('Cart')}
                    >
                        <Ionicons name="cart-outline" size={26} color={isDark ? "#FFF" : "#111827"} />
                        {cartCount > 0 && (
                            <View style={[styles.cartBadge, isDark && styles.cartBadgeDark]}>
                                <Text style={styles.cartBadgeText}>{cartCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                }
            />

            {/* Category horizontal list */}
            <View style={[styles.categoryNav, isDark && styles.categoryNavDark]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryNavContent}>
                    {categories.map((cat: any) => (
                        <TouchableOpacity
                            key={cat._id}
                            style={[
                                styles.catTab,
                                isDark && styles.catTabDark,
                                selectedCatName === cat.name && styles.activeCatTab
                            ]}
                            onPress={() => setSelectedCatName(cat.name)}
                        >
                            <Text style={[
                                styles.catTabText,
                                isDark && styles.catTabTextDark,
                                selectedCatName === cat.name && styles.activeCatTabText
                            ]}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {isLoading ? (
                <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
                    <ActivityIndicator size="large" color="#0D9488" />
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProductItem}
                    keyExtractor={item => item._id}
                    numColumns={2}
                    contentContainerStyle={styles.productList}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconCircle, isDark && styles.cardDark]}>
                                <Ionicons name="basket-outline" size={80} color={isDark ? "#0D9488" : "#F3F4F6"} />
                            </View>
                            <Text style={[styles.emptyText, isDark && styles.textLight]}>No products found in this category</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    containerDark: { backgroundColor: '#0f172a' },
    textLight: { color: '#F8FAFC' },

    categoryNav: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    categoryNavDark: { backgroundColor: '#1e293b', borderBottomColor: '#334155' },
    categoryNavContent: { paddingHorizontal: 16, paddingVertical: 14 },
    catTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginRight: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: 'transparent' },
    catTabDark: { backgroundColor: '#0f172a' },
    activeCatTab: { backgroundColor: '#F0FDFA', borderColor: '#0D9488' },
    catTabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    catTabTextDark: { color: '#94A3B8' },
    activeCatTabText: { color: '#0D9488' },

    productList: { padding: 8, paddingBottom: 40 },
    productCard: { width: (width - 32) / 2, backgroundColor: '#FFFFFF', borderRadius: 24, margin: 8, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, borderWidth: 1, borderColor: '#F1F5F9' },
    productCardDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
    cardDark: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1 },
    imageContainer: { padding: 10, position: 'relative' },
    productImage: { width: '100%', height: 160, borderRadius: 18, backgroundColor: '#F8FAFC' },
    discountBadge: { position: 'absolute', top: 18, left: 18, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, zIndex: 5 },
    discountText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },

    productInfo: { padding: 12, paddingTop: 4 },
    categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#F0FDFA', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
    productCategory: { fontSize: 8, color: '#0D9488', fontWeight: '800', textTransform: 'uppercase' },
    productTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B', height: 38, lineHeight: 18 },
    statsRow: { flexDirection: 'row', alignItems: 'center' },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { fontSize: 11, fontWeight: '800', color: '#1E293B', marginLeft: 4 },
    reviewsText: { fontSize: 11, color: '#9CA3AF', marginLeft: 4 },

    priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    priceText: { fontSize: 16, fontWeight: '900', color: '#0D9488' },
    originalPriceText: { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through', marginLeft: 6, fontWeight: '500' },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    emptyContainer: { flex: 1, paddingTop: 100, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyIconCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#FFF', elevation: 4, shadowColor: '#0D9488', shadowOpacity: 0.1, shadowRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    emptyText: { color: '#1E293B', fontSize: 16, fontWeight: '700', textAlign: 'center' },

    cartBtn: { padding: 4, position: 'relative' },
    cartBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#FFF' },
    cartBadgeDark: { borderColor: '#1e293b' },
    cartBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
});

export default CategoryProducts;
