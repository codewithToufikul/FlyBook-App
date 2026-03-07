import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCart, CartItem } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import CustomHeader from '../../components/common/CustomHeader';

const Cart = ({ navigation }: any) => {
    const { isDark } = useTheme();
    const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();

    const renderItem = ({ item }: { item: CartItem }) => (
        <View style={[styles.cartItem, isDark && styles.cartItemDark]}>
            <View style={styles.imageWrapper}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
            </View>

            <View style={styles.itemDetails}>
                <View style={styles.titleRow}>
                    <Text style={[styles.itemTitle, isDark && styles.textLight]} numberOfLines={1}>{item.title}</Text>
                    <TouchableOpacity
                        style={[styles.removeCircle, isDark && styles.removeCircleDark]}
                        onPress={() => removeFromCart(item._id, item.selectedSize, item.selectedColor)}
                    >
                        <Ionicons name="close" size={16} color={isDark ? "#94A3B8" : "#94A3B8"} />
                    </TouchableOpacity>
                </View>

                {(item.selectedSize || item.selectedColor) && (
                    <View style={styles.variantBadgeRow}>
                        {item.selectedSize && (
                            <View style={[styles.variantBadge, isDark && styles.variantBadgeDark]}>
                                <Text style={styles.variantBadgeText}>Size: {item.selectedSize}</Text>
                            </View>
                        )}
                        {item.selectedColor && (
                            <View style={[styles.variantBadge, isDark && styles.variantBadgeDark]}>
                                <Text style={styles.variantBadgeText}>Color: {item.selectedColor}</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.actionRow}>
                    <Text style={[styles.itemPrice, isDark && styles.textLight]}>৳{item.price.toLocaleString()}</Text>

                    <View style={[styles.quantitySelector, isDark && styles.quantitySelectorDark]}>
                        <TouchableOpacity
                            style={[styles.qtyBtn, isDark && styles.qtyBtnDark]}
                            onPress={() => updateQuantity(item._id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                        >
                            <Ionicons name="remove" size={16} color={isDark ? "#FFF" : "#1E293B"} />
                        </TouchableOpacity>
                        <Text style={[styles.qtyText, isDark && styles.textLight]}>{item.quantity}</Text>
                        <TouchableOpacity
                            style={[styles.qtyBtn, isDark && styles.qtyBtnDark]}
                            onPress={() => updateQuantity(item._id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                        >
                            <Ionicons name="add" size={16} color={isDark ? "#FFF" : "#1E293B"} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    const EmptyCart = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, isDark && styles.cardDark]}>
                <Ionicons name="cart-outline" size={80} color={isDark ? "#334155" : "#F3F4F6"} />
            </View>
            <Text style={[styles.emptyTitle, isDark && styles.textLight]}>Your cart is empty</Text>
            <Text style={styles.emptyDesc}>Looks like you haven't added anything to your cart yet.</Text>
            <TouchableOpacity
                style={styles.shopBtn}
                onPress={() => navigation.navigate('MarketplaceHome')}
            >
                <Text style={styles.shopBtnText}>Start Shopping</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <CustomHeader
                title="My Cart"
                rightComponent={
                    cartItems.length > 0 ? (
                        <TouchableOpacity onPress={clearCart}>
                            <Text style={styles.clearText}>Clear</Text>
                        </TouchableOpacity>
                    ) : null
                }
            />

            <FlatList
                data={cartItems}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item._id}-${index}`}
                contentContainerStyle={[styles.listContent, cartItems.length === 0 && { flex: 1 }]}
                ListEmptyComponent={EmptyCart}
            />

            {cartItems.length > 0 && (
                <View style={[styles.footer, isDark && styles.footerDark]}>
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, isDark && styles.textLight]}>Total Amount</Text>
                        <Text style={[styles.totalPrice, isDark && styles.textLight]}>৳{cartTotal.toLocaleString()}</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.checkoutBtn}
                        onPress={() => navigation.navigate('Checkout')}
                    >
                        <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    containerDark: { backgroundColor: '#0f172a' },
    textLight: { color: '#F8FAFC' },
    listContent: { padding: 16, paddingBottom: 100 },

    cartItem: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cartItemDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
    imageWrapper: { backgroundColor: '#F8FAFC', borderRadius: 18, padding: 4 },
    itemImage: { width: 90, height: 90, borderRadius: 16 },
    itemDetails: { flex: 1, marginLeft: 16, justifyContent: 'space-between', paddingVertical: 2 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', flex: 1, marginRight: 8 },
    removeCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    removeCircleDark: { backgroundColor: '#0f172a' },

    variantBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    variantBadge: { backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    variantBadgeDark: { backgroundColor: '#0f172a', borderColor: '#334155' },
    variantBadgeText: { fontSize: 10, color: '#64748B', fontWeight: '700' },

    actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
    itemPrice: { fontSize: 18, fontWeight: '900', color: '#0D9488' },

    quantitySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4 },
    quantitySelectorDark: { backgroundColor: '#0f172a' },
    qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
    qtyBtnDark: { backgroundColor: '#1e293b', elevation: 0 },
    qtyText: { marginHorizontal: 10, fontSize: 15, fontWeight: '900', color: '#1E293B' },

    footer: {
        backgroundColor: '#FFF',
        padding: 24,
        paddingTop: 20,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 25,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    footerDark: { backgroundColor: '#1e293b' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    totalLabel: { fontSize: 15, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    totalPrice: { fontSize: 28, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    checkoutBtn: { backgroundColor: '#0D9488', height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#0D9488', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
    checkoutBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyIconCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#FFF', elevation: 4, shadowColor: '#0D9488', shadowOpacity: 0.1, shadowRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    cardDark: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1 },
    emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 12 },
    emptyDesc: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, fontWeight: '500' },
    shopBtn: { marginTop: 32, backgroundColor: '#0D9488', paddingHorizontal: 36, paddingVertical: 16, borderRadius: 18, elevation: 4 },
    shopBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
    clearText: { color: '#94A3B8', fontSize: 14, fontWeight: '700' },
});

export default Cart;
