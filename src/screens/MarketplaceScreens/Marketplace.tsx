import React, { useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get } from '../../services/api';
import TobNav from '../../components/TobNav';
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
    stock: number;
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

const Marketplace = ({ navigation }: any) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [refreshing, setRefreshing] = useState(false);

    // Fetch Banners
    const { data: banners = [] } = useQuery({
        queryKey: ['market-banners'],
        queryFn: () => get<{ banners: Banner[] }>('/home-banners').then(res => res.banners),
    });

    // Fetch Categories
    const { data: categories = [] } = useQuery({
        queryKey: ['market-categories'],
        queryFn: () => get<{ categories: Category[] }>('/get-product-categories').then(res => res.categories),
    });

    // Fetch Products
    const { data: flashDeals = [], isLoading: loadingFlash } = useQuery({
        queryKey: ['market-flash-deals'],
        queryFn: () => get<{ products: Product[] }>('/products/high-discounts').then(res => res.products),
    });

    const { data: featuredProducts = [] } = useQuery({
        queryKey: ['market-featured'],
        queryFn: () => get<{ products: Product[] }>('/products/featured').then(res => res.products),
    });

    const { data: latestProducts = [] } = useQuery({
        queryKey: ['market-latest'],
        queryFn: () => get<{ products: Product[] }>('/products/latest').then(res => res.products),
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // React Query will handle the refetch
        setRefreshing(false);
    }, []);

    const renderProductItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.images[0] }} style={styles.productImage} />
                {item.discount && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{item.discount}%</Text>
                    </View>
                )}
            </View>
            <View style={styles.productInfo}>
                <Text style={styles.productCategory}>{item.category}</Text>
                <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#FBBF24" />
                    <Text style={styles.ratingText}>{item.rating || '0.0'}</Text>
                    <Text style={styles.reviewsText}>({item.reviews || 0})</Text>
                </View>
                <View style={styles.priceRow}>
                    <Text style={styles.priceText}>৳{item.price?.toLocaleString()}</Text>
                    {item.originalPrice && (
                        <Text style={styles.originalPriceText}>৳{item.originalPrice.toLocaleString()}</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderCategoryItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[
                styles.categoryChip,
                selectedCategory === item.name && styles.selectedCategoryChip
            ]}
            onPress={() => {
                if (item.name === 'All') {
                    setSelectedCategory('All');
                } else {
                    navigation.navigate('CategoryProducts', {
                        categoryId: item._id,
                        categoryName: item.name
                    });
                }
            }}
        >
            <Text style={[
                styles.categoryChipText,
                selectedCategory === item.name && styles.selectedCategoryChipText
            ]}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <TobNav navigation={navigation} />
            <StatusBar barStyle="dark-content" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Search Bar */}
                <View style={styles.searchSection}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search Marketplace..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <TouchableOpacity style={styles.filterBtn}>
                            <Ionicons name="options-outline" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Categories */}
                <View style={styles.categoriesSection}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={[{ _id: 'all', name: 'All' }, ...categories]}
                        renderItem={renderCategoryItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.categoriesList}
                    />
                </View>

                {/* Banners */}
                {banners.length > 0 && (
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        style={styles.bannerContainer}
                    >
                        {banners.map((banner, index) => (
                            <View key={banner._id} style={styles.bannerSlide}>
                                <Image source={{ uri: banner.image }} style={styles.bannerImage} />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                                    style={styles.bannerGradient}
                                >
                                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                                    <Text style={styles.bannerSubTitle} numberOfLines={1}>{banner.description}</Text>
                                </LinearGradient>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {/* Flash Deals */}
                {flashDeals.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.titleRow}>
                                <Text style={styles.sectionTitle}>Flash Deals</Text>
                                <Ionicons name="flash" size={20} color="#F59E0B" style={{ marginLeft: 8 }} />
                            </View>
                            <TouchableOpacity>
                                <Text style={styles.seeAll}>See All</Text>
                            </TouchableOpacity>
                        </View>
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

                {/* Featured Products */}
                {featuredProducts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.titleRow}>
                                <Text style={styles.sectionTitle}>Featured</Text>
                                <Ionicons name="bookmark" size={18} color="#3B82F6" style={{ marginLeft: 8 }} />
                            </View>
                            <TouchableOpacity>
                                <Text style={styles.seeAll}>See All</Text>
                            </TouchableOpacity>
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

                {/* New Arrivals - Grid */}
                {latestProducts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.titleRow}>
                                <Text style={styles.sectionTitle}>New Arrivals</Text>
                                <Text style={{ fontSize: 18, marginLeft: 8 }}>✨</Text>
                            </View>
                        </View>
                        <View style={styles.gridContainer}>
                            {latestProducts.slice(0, 10).map((product) => (
                                <View key={product._id} style={styles.gridItem}>
                                    <TouchableOpacity
                                        style={styles.gridCard}
                                        onPress={() => navigation.navigate('ProductDetails', { productId: product._id })}
                                    >
                                        <Image source={{ uri: product.images[0] }} style={styles.gridImage} />
                                        <View style={styles.gridInfo}>
                                            <Text style={styles.gridTitle} numberOfLines={1}>{product.title}</Text>
                                            <Text style={styles.gridPrice}>৳{product.price.toLocaleString()}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    searchSection: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#1F2937',
    },
    filterBtn: {
        backgroundColor: '#0D9488',
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoriesSection: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
    },
    categoriesList: {
        paddingHorizontal: 15,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 10,
    },
    selectedCategoryChip: {
        backgroundColor: '#0D9488',
    },
    categoryChipText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    selectedCategoryChipText: {
        color: '#FFFFFF',
    },
    bannerContainer: {
        height: 180,
        marginVertical: 15,
    },
    bannerSlide: {
        width: width - 30,
        height: 180,
        marginHorizontal: 15,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    bannerGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
        paddingTop: 40,
    },
    bannerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    bannerSubTitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 4,
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    seeAll: {
        color: '#0D9488',
        fontSize: 14,
        fontWeight: '600',
    },
    productList: {
        paddingRight: 15,
    },
    productCard: {
        width: 160,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    imageContainer: {
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: 160,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    discountBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    productInfo: {
        padding: 12,
    },
    productCategory: {
        fontSize: 10,
        color: '#0D9488',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    productTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginTop: 4,
        height: 38,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1F2937',
        marginLeft: 4,
    },
    reviewsText: {
        fontSize: 10,
        color: '#9CA3AF',
        marginLeft: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    priceText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
    },
    originalPriceText: {
        fontSize: 11,
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
        marginLeft: 6,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -5,
    },
    gridItem: {
        width: '50%',
        paddingHorizontal: 5,
        marginBottom: 10,
    },
    gridCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
    },
    gridImage: {
        width: '100%',
        height: 150,
    },
    gridInfo: {
        padding: 10,
    },
    gridTitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#374151',
    },
    gridPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 4,
    },
});

export default Marketplace;
