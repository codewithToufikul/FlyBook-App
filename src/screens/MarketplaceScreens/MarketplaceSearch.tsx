import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StatusBar,
    Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get } from '../../services/api';
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

const MarketplaceSearch = ({ route, navigation }: any) => {
    const { initialQuery = '' } = route.params || {};
    const [query, setQuery] = useState(initialQuery);
    const { isDark } = useTheme();
    const { cartCount } = useCart();

    const { data: products = [], isLoading, refetch } = useQuery({
        queryKey: ['market-search', query],
        queryFn: () => get<{ products: Product[] }>(`/search-products?q=${encodeURIComponent(query)}`).then(res => res.products || []),
        enabled: query.length > 0,
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
                    <Text style={[styles.productCategory, isDark && { color: '#2DD4BF' }]}>{item.category}</Text>
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

            <View style={[styles.searchHeader, isDark && styles.searchHeaderDark]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color={isDark ? "#FFF" : "#1E293B"} />
                </TouchableOpacity>

                <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
                    <Ionicons name="search-outline" size={20} color={isDark ? "#94A3B8" : "#9CA3AF"} />
                    <TextInput
                        style={[styles.searchInput, isDark && styles.textLight]}
                        placeholder="Search products, stores..."
                        placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                        value={query}
                        onChangeText={setQuery}
                        autoFocus={!initialQuery}
                        returnKeyType="search"
                        onSubmitEditing={() => refetch()}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Ionicons name="close-circle" size={20} color={isDark ? "#94A3B8" : "#94A3B8"} />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.cartBtn}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <Ionicons name="cart-outline" size={26} color={isDark ? "#FFF" : "#1E293B"} />
                    {cartCount > 0 && (
                        <View style={[styles.cartBadge, isDark && styles.cartBadgeDark]}>
                            <Text style={styles.cartBadgeText}>{cartCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
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
                        query.length > 0 ? (
                            <View style={styles.emptyContainer}>
                                <View style={[styles.emptyIconCircle, isDark && styles.cardDark]}>
                                    <Ionicons name="search-outline" size={80} color={isDark ? "#0D9488" : "#F3F4F6"} />
                                </View>
                                <Text style={[styles.emptyText, isDark && styles.textLight]}>No products found for "{query}"</Text>
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, isDark && styles.textLight]}>Type something to search...</Text>
                            </View>
                        )
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

    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 54,
        paddingBottom: 16,
        backgroundColor: '#FFF',
        gap: 12,
        elevation: 4,
        shadowColor: '#0D9488',
        shadowOpacity: 0.08,
        shadowRadius: 15,
        zIndex: 100,
    },
    searchHeaderDark: { backgroundColor: '#1e293b' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: '#E2E8F0' },
    searchBarDark: { backgroundColor: '#0f172a', borderColor: '#1e293b' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1E293B', fontWeight: '500' },

    cartBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#FFF' },
    cartBadgeDark: { borderColor: '#1e293b' },
    cartBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },

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
});

export default MarketplaceSearch;
