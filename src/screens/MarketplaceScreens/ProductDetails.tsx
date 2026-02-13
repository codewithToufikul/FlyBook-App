import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Product {
    _id: string;
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    images: string[];
    category: string;
    rating?: number;
    reviews?: number;
    stock: number;
    availableSizes?: string[];
    availableColors?: string[];
    coinUsagePercentage?: number;
}

const fetchProductDetails = async (productId: string): Promise<Product> => {
    const response = await get<{ product: Product }>(`/get-product/${productId}`);
    return response.product;
};

const ProductDetails = ({ route, navigation }: any) => {
    const { productId } = route.params;
    const insets = useSafeAreaInsets();
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(1);

    const { data: product, isLoading, error } = useQuery({
        queryKey: ['market-product', productId],
        queryFn: () => fetchProductDetails(productId),
    });

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0D9488" />
                <Text style={styles.loadingText}>Fetching product details...</Text>
            </View>
        );
    }

    if (error || !product) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text style={styles.errorText}>Failed to load product</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                <View style={[styles.imageGallery, { height: width }]}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                            const offset = e.nativeEvent.contentOffset.x;
                            setSelectedImage(Math.round(offset / width));
                        }}
                    >
                        {product.images.map((img, index) => (
                            <Image key={index} source={{ uri: img }} style={styles.mainImage} />
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.backCircle, { top: insets.top + 10 }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={styles.pagination}>
                        <Text style={styles.paginationText}>{selectedImage + 1}/{product.images.length}</Text>
                    </View>
                </View>

                {/* Product Info */}
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <Text style={styles.category}>{product.category}</Text>
                        <View style={styles.ratingBox}>
                            <Ionicons name="star" size={14} color="#FBBF24" />
                            <Text style={styles.ratingValue}>{product.rating || '0.0'}</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{product.title}</Text>

                    <View style={styles.priceContainer}>
                        <View style={styles.priceRow}>
                            <Text style={styles.currentPrice}>৳{product.price.toLocaleString()}</Text>
                            {product.originalPrice && (
                                <Text style={styles.originalPrice}>৳{product.originalPrice.toLocaleString()}</Text>
                            )}
                        </View>
                        {product.discount && (
                            <View style={styles.discountBadge}>
                                <Text style={styles.discountText}>{product.discount}% OFF</Text>
                            </View>
                        )}
                    </View>

                    {/* Point Usage Info */}
                    <View style={styles.promoBox}>
                        <View style={styles.pointIcon}>
                            <Text style={styles.pointIconText}>P</Text>
                        </View>
                        <Text style={styles.promoText}>
                            Pay up to {product.coinUsagePercentage || 30}% with FlyWallet Points
                        </Text>
                    </View>

                    {/* Meta Status */}
                    <View style={styles.statusRow}>
                        <View style={styles.statusItem}>
                            <View style={[styles.statusDot, { backgroundColor: product.stock > 0 ? '#10B981' : '#EF4444' }]} />
                            <Text style={styles.statusText}>
                                {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of Stock'}
                            </Text>
                        </View>
                        <Text style={styles.reviewsText}>{product.reviews || 0} customer reviews</Text>
                    </View>

                    {/* Variant Selection */}
                    {product.availableSizes && product.availableSizes.length > 0 && (
                        <View style={styles.variantSection}>
                            <Text style={styles.variantTitle}>Select Size</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {product.availableSizes.map((size) => (
                                    <TouchableOpacity
                                        key={size}
                                        style={[styles.sizeChip, selectedSize === size && styles.activeChip]}
                                        onPress={() => setSelectedSize(size)}
                                    >
                                        <Text style={[styles.chipText, selectedSize === size && styles.activeChipText]}>
                                            {size}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {product.availableColors && product.availableColors.length > 0 && (
                        <View style={styles.variantSection}>
                            <Text style={styles.variantTitle}>Select Color</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {product.availableColors.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[styles.colorChip, selectedColor === color && styles.activeChip]}
                                        onPress={() => setSelectedColor(color)}
                                    >
                                        <View style={[styles.colorDot, { backgroundColor: color.toLowerCase() }]} />
                                        <Text style={[styles.chipText, selectedColor === color && styles.activeChipText]}>
                                            {color}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Description */}
                    <View style={styles.descriptionSection}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.descriptionText}>{product.description}</Text>
                    </View>

                    {/* Quantity */}
                    <View style={styles.quantitySection}>
                        <Text style={styles.sectionTitle}>Quantity</Text>
                        <View style={styles.quantityContainer}>
                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                                <Ionicons name="remove" size={20} color="#1F2937" />
                            </TouchableOpacity>
                            <Text style={styles.qtyValue}>{quantity}</Text>
                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                            >
                                <Ionicons name="add" size={20} color="#1F2937" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Trust Badges */}
                    <View style={styles.trustRow}>
                        <View style={styles.trustItem}>
                            <Ionicons name="shield-checkmark" size={24} color="#0D9488" />
                            <Text style={styles.trustText}>Genuine</Text>
                        </View>
                        <View style={styles.trustItem}>
                            <Ionicons name="refresh" size={24} color="#0D9488" />
                            <Text style={styles.trustText}>7 Days Return</Text>
                        </View>
                        <View style={styles.trustItem}>
                            <Ionicons name="airplane" size={24} color="#0D9488" />
                            <Text style={styles.trustText}>Fast Delivery</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Bar */}
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity style={styles.cartBtn}>
                    <Ionicons name="cart-outline" size={24} color="#1F2937" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.addToCartBtn}>
                    <Text style={styles.addToCartBtnText}>Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buyNowBtn}>
                    <Text style={styles.buyNowBtnText}>Buy Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    imageGallery: {
        width: width,
        position: 'relative',
        backgroundColor: '#F3F4F6',
    },
    mainImage: {
        width: width,
        height: '100%',
        resizeMode: 'cover',
    },
    backCircle: {
        position: 'absolute',
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    pagination: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    paginationText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    category: {
        color: '#0D9488',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    ratingValue: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#92400E',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        lineHeight: 30,
    },
    priceContainer: {
        marginTop: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currentPrice: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0D9488',
    },
    originalPrice: {
        fontSize: 16,
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
        marginLeft: 10,
    },
    discountBadge: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    discountText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: 'bold',
    },
    promoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDFA',
        padding: 12,
        borderRadius: 12,
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    pointIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#0D9488',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pointIconText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    promoText: {
        fontSize: 13,
        color: '#0F766E',
        fontWeight: '600',
        marginLeft: 10,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
    },
    reviewsText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    variantSection: {
        marginTop: 20,
    },
    variantTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    sizeChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#F3F4F6',
        marginRight: 10,
        backgroundColor: '#FFFFFF',
    },
    colorChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#F3F4F6',
        marginRight: 10,
        backgroundColor: '#FFFFFF',
    },
    colorDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    activeChip: {
        borderColor: '#0D9488',
        backgroundColor: '#F0FDFA',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    activeChipText: {
        color: '#0D9488',
    },
    descriptionSection: {
        marginTop: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
    },
    descriptionText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
    },
    quantitySection: {
        marginTop: 25,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        width: 140,
        borderRadius: 12,
        justifyContent: 'space-between',
        padding: 4,
    },
    qtyBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
    },
    qtyValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    trustRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 15,
    },
    trustItem: {
        alignItems: 'center',
    },
    trustText: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 6,
        fontWeight: '500',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 15,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        alignItems: 'center',
    },
    cartBtn: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    addToCartBtn: {
        flex: 1.2,
        height: 52,
        backgroundColor: '#111827',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    addToCartBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
    buyNowBtn: {
        flex: 1,
        height: 52,
        backgroundColor: '#0D9488',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buyNowBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginTop: 15,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        marginVertical: 15,
    },
    backBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#0D9488',
    },
    backBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});

export default ProductDetails;
