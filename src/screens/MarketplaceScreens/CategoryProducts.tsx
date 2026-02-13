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
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    const [selectedCatName, setSelectedCatName] = useState(categoryName);

    const { data: categories = [] } = useQuery({
        queryKey: ['market-categories'],
        queryFn: () => get<{ categories: any[] }>('/get-product-categories').then(res => res.categories),
    });

    const { data: products = [], isLoading } = useQuery({
        queryKey: ['market-category-products', selectedCatName],
        queryFn: () => get<{ products: Product[] }>(`/get-product-category?category=${selectedCatName}`).then(res => res.products),
    });

    const renderProductItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
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
                <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.priceText}>৳{item.price.toLocaleString()}</Text>
                    {item.originalPrice && (
                        <Text style={styles.originalPriceText}>৳{item.originalPrice.toLocaleString()}</Text>
                    )}
                </View>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#FBBF24" />
                    <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
                    <Text style={styles.reviewsText}>({item.reviews || 0})</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{selectedCatName}</Text>
                <TouchableOpacity style={styles.searchBtn}>
                    <Ionicons name="search-outline" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {/* Category horizontal list */}
            <View style={styles.categoryNav}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryNavContent}>
                    {categories.map((cat: any) => (
                        <TouchableOpacity
                            key={cat._id}
                            style={[styles.catTab, selectedCatName === cat.name && styles.activeCatTab]}
                            onPress={() => setSelectedCatName(cat.name)}
                        >
                            <Text style={[styles.catTabText, selectedCatName === cat.name && styles.activeCatTabText]}>
                                {cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
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
                            <Ionicons name="basket-outline" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No products found in this category</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

// ... keep styles consistent with Marketplace.tsx
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    searchBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    categoryNav: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    categoryNavContent: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    catTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#F3F4F6',
    },
    activeCatTab: {
        backgroundColor: '#0D9488',
    },
    catTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeCatTabText: {
        color: '#FFFFFF',
    },
    productList: {
        padding: 10,
    },
    productCard: {
        width: (width - 30) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        margin: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    imageContainer: {
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: 150,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    discountBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    productInfo: {
        padding: 10,
    },
    productTitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
        height: 38,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    priceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    originalPriceText: {
        fontSize: 10,
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
        marginLeft: 6,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        paddingTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 15,
        color: '#9CA3AF',
        fontSize: 14,
    },
});

import { ScrollView } from 'react-native';

export default CategoryProducts;
