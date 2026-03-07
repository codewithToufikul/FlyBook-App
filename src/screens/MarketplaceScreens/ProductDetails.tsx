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
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';

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
    const { isDark } = useTheme();
    const { addToCart, cartCount } = useCart();
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(1);

    const { data: product, isLoading, error } = useQuery({
        queryKey: ['market-product', productId],
        queryFn: () => fetchProductDetails(productId),
        staleTime: 1000 * 60 * 5,
    });

    const validateSelection = () => {
        if (!product) return false;

        if (product.availableSizes && product.availableSizes.length > 0 && !selectedSize) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please select a size first' });
            return false;
        }
        if (product.availableColors && product.availableColors.length > 0 && !selectedColor) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please select a color first' });
            return false;
        }
        return true;
    };

    const handleAddToCart = () => {
        if (!product || !validateSelection()) return;

        addToCart(product, quantity, selectedSize, selectedColor);
        Toast.show({
            type: 'success',
            text1: 'Success',
            text2: `${product.title} added to cart`,
        });
    };

    const handleBuyNow = () => {
        if (!product || !validateSelection()) return;

        addToCart(product, quantity, selectedSize, selectedColor);
        navigation.navigate('Checkout');
    };

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
            <View style={[styles.errorContainer, isDark && styles.containerDark]}>
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text style={[styles.errorText, isDark && styles.textLight]}>Failed to load product</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                <View style={[styles.imageGallery, isDark && { backgroundColor: '#0f172a' }, { height: width }]}>
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
                        style={[styles.backCircle, isDark && styles.backCircleDark, { top: insets.top + 10 }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={24} color={isDark ? "#FFF" : "#1E293B"} />
                    </TouchableOpacity>

                    <View style={styles.pagination}>
                        <View style={[styles.paginationRow, isDark && { backgroundColor: 'rgba(30,41,59,0.8)' }]}>
                            {product.images.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        isDark && { backgroundColor: '#334155' },
                                        selectedImage === i ? styles.activeDot : null
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                </View>

                {/* Product Info */}
                <View style={[styles.content, isDark && styles.contentDark]}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.category, isDark && { backgroundColor: '#134E4A', color: '#2DD4BF' }]}>{product.category}</Text>
                        <View style={[styles.ratingBox, isDark && { backgroundColor: '#451A03' }]}>
                            <Ionicons name="star" size={14} color="#FBBF24" />
                            <Text style={[styles.ratingValue, isDark && { color: '#FBBF24' }]}>{product.rating || '0.0'}</Text>
                        </View>
                    </View>

                    <Text style={[styles.title, isDark && styles.textLight]}>{product.title}</Text>

                    <View style={styles.priceContainer}>
                        <View style={styles.priceRow}>
                            <Text style={styles.currentPrice}>৳{product.price.toLocaleString()}</Text>
                            {product.originalPrice && (
                                <Text style={[styles.originalPrice, isDark && { color: '#64748B' }]}>৳{product.originalPrice.toLocaleString()}</Text>
                            )}
                        </View>
                        {product.discount && (
                            <View style={[styles.discountBadge, isDark && { backgroundColor: '#450A0A', borderColor: '#7F1D1D' }]}>
                                <Text style={[styles.discountText, isDark && { color: '#F87171' }]}>{product.discount}% OFF</Text>
                            </View>
                        )}
                    </View>

                    {/* Point Usage Info */}
                    <LinearGradient
                        colors={isDark ? ['#1e293b', '#0f172a'] : ['#F0FDFA', '#CCFBF1']}
                        style={styles.promoBox}
                    >
                        <View style={styles.pointIcon}>
                            <Ionicons name="star" size={10} color="#FFF" />
                        </View>
                        <Text style={[styles.promoText, isDark && { color: '#2DD4BF' }]}>
                            Pay up to <Text style={{ fontWeight: '800' }}>{product.coinUsagePercentage || 30}%</Text> with FlyWallet Points
                        </Text>
                    </LinearGradient>

                    {/* Meta Status */}
                    <View style={[styles.statusRow, isDark && { borderBottomColor: '#334155' }]}>
                        <View style={[styles.statusItem, isDark && { backgroundColor: '#1E293B' }]}>
                            <View style={[styles.statusDot, { backgroundColor: product.stock > 0 ? '#10B981' : '#EF4444' }]} />
                            <Text style={[styles.statusText, isDark && { color: '#94A3B8' }]}>
                                {product.stock > 0 ? `In Stock (${product.stock} left)` : 'Out of Stock'}
                            </Text>
                        </View>
                        <Text style={[styles.reviewsText, isDark && { color: '#64748B' }]}>{product.reviews || 0} customer reviews</Text>
                    </View>

                    {/* Variant Selection */}
                    {product.availableSizes && product.availableSizes.length > 0 && (
                        <View style={styles.variantSection}>
                            <Text style={[styles.variantTitle, isDark && styles.textLight]}>Select Size</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {product.availableSizes.map((size) => (
                                    <TouchableOpacity
                                        key={size}
                                        style={[styles.sizeChip, isDark && styles.chipDark, selectedSize === size && styles.activeChip]}
                                        onPress={() => setSelectedSize(size)}
                                    >
                                        <Text style={[styles.chipText, isDark && { color: '#94A3B8' }, selectedSize === size && styles.activeChipText]}>
                                            {size}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {product.availableColors && product.availableColors.length > 0 && (
                        <View style={styles.variantSection}>
                            <Text style={[styles.variantTitle, isDark && styles.textLight]}>Select Color</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {product.availableColors.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[styles.colorChip, isDark && styles.chipDark, selectedColor === color && styles.activeChip]}
                                        onPress={() => setSelectedColor(color)}
                                    >
                                        <View style={[styles.colorDot, { backgroundColor: color.toLowerCase() }]} />
                                        <Text style={[styles.chipText, isDark && { color: '#94A3B8' }, selectedColor === color && styles.activeChipText]}>
                                            {color}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Description */}
                    <View style={styles.descriptionSection}>
                        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Description</Text>
                        <Text style={[styles.descriptionText, isDark && { color: '#94A3B8' }]}>{product.description}</Text>
                    </View>

                    {/* Quantity */}
                    <View style={styles.quantitySection}>
                        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Quantity</Text>
                        <View style={[styles.quantityContainer, isDark && { backgroundColor: '#1E293B' }]}>
                            <TouchableOpacity
                                style={[styles.qtyBtn, isDark && { backgroundColor: '#334155', elevation: 0 }]}
                                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                                <Ionicons name="remove" size={20} color={isDark ? "#FFF" : "#1F2937"} />
                            </TouchableOpacity>
                            <Text style={[styles.qtyValue, isDark && styles.textLight]}>{quantity}</Text>
                            <TouchableOpacity
                                style={[styles.qtyBtn, isDark && { backgroundColor: '#334155', elevation: 0 }]}
                                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                            >
                                <Ionicons name="add" size={20} color={isDark ? "#FFF" : "#1F2937"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Trust Badges */}
                    <View style={[styles.trustRow, isDark && { backgroundColor: '#1E293B' }]}>
                        <View style={styles.trustItem}>
                            <Ionicons name="shield-checkmark" size={24} color="#0D9488" />
                            <Text style={[styles.trustText, isDark && { color: '#94A3B8' }]}>Genuine</Text>
                        </View>
                        <View style={styles.trustItem}>
                            <Ionicons name="refresh" size={24} color="#0D9488" />
                            <Text style={[styles.trustText, isDark && { color: '#94A3B8' }]}>7 Days Return</Text>
                        </View>
                        <View style={styles.trustItem}>
                            <Ionicons name="airplane" size={24} color="#0D9488" />
                            <Text style={[styles.trustText, isDark && { color: '#94A3B8' }]}>Fast Delivery</Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Bar */}
            <View style={[
                styles.bottomBar,
                isDark && styles.bottomBarDark,
                { paddingBottom: Math.max(insets.bottom, 20) }
            ]}>
                <TouchableOpacity
                    style={[styles.cartBtn, isDark && styles.cartBtnDark]}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <Ionicons name="cart-outline" size={24} color={isDark ? "#FFF" : "#1F2937"} />
                    {cartCount > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cartCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.addToCartBtn, isDark && { backgroundColor: '#334155' }]}
                    onPress={handleAddToCart}
                >
                    <Text style={styles.addToCartBtnText}>Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buyNowBtn} onPress={handleBuyNow}>
                    <Text style={styles.buyNowBtnText}>Buy Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    containerDark: {
        backgroundColor: '#0f172a',
    },
    textLight: {
        color: '#F8FAFC',
    },
    imageGallery: {
        width: width,
        position: 'relative',
        backgroundColor: '#FFF',
    },
    mainImage: {
        width: width,
        height: '100%',
        resizeMode: 'cover',
    },
    backCircle: {
        position: 'absolute',
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    pagination: {
        position: 'absolute',
        bottom: 24,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    paginationRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.8)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E2E8F0' },
    activeDot: { width: 16, backgroundColor: '#0D9488' },
    backCircleDark: {
        backgroundColor: 'rgba(30,41,59,0.9)',
    },

    content: {
        padding: 20,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 20,
    },
    contentDark: {
        backgroundColor: '#1e293b',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    category: {
        color: '#0D9488',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        backgroundColor: '#F0FDFA',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        letterSpacing: 0.5,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    ratingValue: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '800',
        color: '#92400E',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
        lineHeight: 32,
        letterSpacing: -0.5,
    },
    priceContainer: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currentPrice: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0D9488',
        letterSpacing: -1,
    },
    originalPrice: {
        fontSize: 16,
        color: '#94A3B8',
        textDecorationLine: 'line-through',
        marginLeft: 12,
        fontWeight: '500',
    },
    discountBadge: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    discountText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '900',
    },
    promoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    pointIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#0D9488',
        justifyContent: 'center',
        alignItems: 'center',
    },
    promoText: {
        fontSize: 14,
        color: '#0D9488',
        fontWeight: '600',
        marginLeft: 12,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 24,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '700',
    },
    reviewsText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },
    variantSection: {
        marginTop: 24,
    },
    variantTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 16,
    },
    sizeChip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#F1F5F9',
        marginRight: 10,
        backgroundColor: '#FFF',
    },
    colorChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#F1F5F9',
        marginRight: 12,
        backgroundColor: '#FFF',
    },
    chipDark: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    colorDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    activeChip: {
        borderColor: '#0D9488',
        backgroundColor: '#F0FDFA',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
    },
    activeChipText: {
        color: '#0D9488',
    },
    descriptionSection: {
        marginTop: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 16,
        color: '#475569',
        lineHeight: 26,
    },
    quantitySection: {
        marginTop: 32,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        width: 160,
        borderRadius: 20,
        justifyContent: 'space-between',
        padding: 6,
    },
    qtyBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
    },
    qtyValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    trustRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 40,
        backgroundColor: '#F8FAFC',
        padding: 24,
        borderRadius: 24,
    },
    trustItem: {
        alignItems: 'center',
        gap: 8,
    },
    trustText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 16,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        alignItems: 'center',
        gap: 12,
    },
    bottomBarDark: {
        backgroundColor: '#1e293b',
        borderTopColor: '#334155',
    },
    cartBtn: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBtnDark: {
        backgroundColor: '#334155',
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    cartBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
    },
    addToCartBtn: {
        flex: 1,
        height: 56,
        backgroundColor: '#1E293B',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addToCartBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    buyNowBtn: {
        flex: 1,
        height: 56,
        backgroundColor: '#0D9488',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buyNowBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 16,
        color: '#64748B',
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#F8FAFC',
    },
    errorText: {
        fontSize: 18,
        color: '#EF4444',
        marginVertical: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
    backBtn: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#0D9488',
        elevation: 4,
    },
    backBtnText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16,
    },
});

export default ProductDetails;
