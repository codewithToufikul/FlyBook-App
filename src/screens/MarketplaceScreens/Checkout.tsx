import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { get, post } from '../../services/api';
import CustomHeader from '../../components/common/CustomHeader';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const COIN_TO_TAKA_RATE = 1;
const DELIVERY_CHARGE_PER_PRODUCT = 50;

interface Address {
    _id: string;
    type: string;
    fullAddress: string;
    phone: string;
    isDefault: boolean;
}

const Checkout = () => {
    const navigation = useNavigation<any>();
    const { cartItems, cartTotal, clearCart } = useCart();
    const { user, refreshUser } = useAuth();
    const { isDark } = useTheme();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [shippingInfo, setShippingInfo] = useState({
        fullName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        street: '',
        city: '',
        postalCode: '',
        country: 'Bangladesh',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [coinsUsed, setCoinsUsed] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('COD');

    useEffect(() => {
        fetchAddresses();
        refreshUser();
    }, []);

    const fetchAddresses = async () => {
        if (!user?._id) return;
        try {
            setIsLoading(true);
            const res = await get<any>(`/addresses/${user._id}`);
            if (res.success) {
                setAddresses(res.addresses);
                const defaultAddr = res.addresses.find((a: any) => a.isDefault) || res.addresses[0];
                if (defaultAddr) {
                    setSelectedAddressId(defaultAddr._id);
                    setShippingInfo(prev => ({
                        ...prev,
                        phone: defaultAddr.phone,
                        street: defaultAddr.fullAddress,
                    }));
                }
            }
        } catch (error) {
            console.error('Fetch addresses error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculations = useMemo(() => {
        const subtotal = cartTotal;
        const totalProducts = cartItems.length;
        const deliveryCharges = totalProducts * DELIVERY_CHARGE_PER_PRODUCT;
        const total = subtotal + deliveryCharges;

        const maxCoinsAllowed = cartItems.reduce((acc, item) => {
            const percentage = item.coinUsagePercentage || 30;
            const itemMaxTaka = (item.price * item.quantity) * (percentage / 100);
            return acc + (itemMaxTaka * COIN_TO_TAKA_RATE);
        }, 0);

        const userCoins = user?.flyWallet || 0;
        const maxUsable = Math.min(userCoins, maxCoinsAllowed);

        return {
            subtotal,
            deliveryCharges,
            total,
            maxCoinsAllowed: Math.floor(maxCoinsAllowed),
            maxUsable: Math.floor(maxUsable / 100) * 100 // Server requires multiples of 100
        };
    }, [cartItems, cartTotal, user]);

    const handlePlaceOrder = async () => {
        if (!selectedAddressId && (!shippingInfo.street || !shippingInfo.phone)) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please provide shipping details' });
            return;
        }

        try {
            setIsPlacingOrder(true);
            const coinsInTaka = coinsUsed / COIN_TO_TAKA_RATE;

            const orderData = {
                items: cartItems.map(item => ({
                    ...item,
                    productId: item._id, // Server expects productId for stock updates
                    itemOrderStatus: 'pending'
                })),
                shippingInfo,
                subtotal: calculations.subtotal,
                deliveryCharges: calculations.deliveryCharges,
                totalAmount: calculations.total,
                totalProducts: cartItems.length,
                deliveryChargePerProduct: DELIVERY_CHARGE_PER_PRODUCT,
                orderSource: 'cart',
                coinsUsed: coinsUsed,
                paymentMethod: (calculations.total - coinsInTaka) > 0 ? paymentMethod : 'FlyWallet',
            };

            const res = await post<any>('/orders/create', orderData);
            if (res.success) {
                clearCart();
                Toast.show({ type: 'success', text1: 'Order Placed!', text2: 'Your order has been received' });
                navigation.navigate('MarketplaceHome');
            }
        } catch (error: any) {
            console.error('Order creation error details:', error);
            const errorMsg = error.data?.error || error.data?.message || error.message || 'Could not place order';
            Toast.show({ type: 'error', text1: 'Order Failed', text2: errorMsg });
        } finally {
            setIsPlacingOrder(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
                <ActivityIndicator size="large" color="#0D9488" />
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <CustomHeader title="Checkout" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* 1. Shipping Address Section */}
                <View style={[styles.section, isDark && styles.sectionDark]}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconCircle, isDark && styles.sectionIconCircleDark]}>
                            <Ionicons name="location" size={18} color="#0D9488" />
                        </View>
                        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Shipping Address</Text>
                    </View>

                    {addresses.length > 0 ? (
                        addresses.map((addr) => (
                            <TouchableOpacity
                                key={addr._id}
                                style={[
                                    styles.addressCard,
                                    isDark && styles.addressCardDark,
                                    selectedAddressId === addr._id && (isDark ? styles.addressSelectedDark : styles.addressSelected)
                                ]}
                                onPress={() => {
                                    setSelectedAddressId(addr._id);
                                    setShippingInfo(prev => ({ ...prev, phone: addr.phone, street: addr.fullAddress }));
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={styles.addressInfo}>
                                    <View style={[styles.addressBadge, isDark && styles.addressBadgeDark]}>
                                        <Text style={[styles.addressBadgeText, isDark && { color: '#94A3B8' }]}>{addr.type}</Text>
                                    </View>
                                    <Text style={[styles.addressText, isDark && styles.textLight]} numberOfLines={2}>{addr.fullAddress}</Text>
                                    <View style={styles.phoneRow}>
                                        <Ionicons name="call-outline" size={12} color="#94A3B8" />
                                        <Text style={[styles.addressPhone, isDark && { color: '#94A3B8' }]}>{addr.phone}</Text>
                                    </View>
                                </View>
                                {selectedAddressId === addr._id ? (
                                    <Ionicons name="checkmark-circle" size={26} color="#0D9488" />
                                ) : (
                                    <View style={[styles.unselectedCircle, isDark && { borderColor: '#334155' }]} />
                                )}
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.manualAddressForm}>
                            <View style={[styles.inputWrapper, isDark && styles.inputDark]}>
                                <Ionicons name="call-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, isDark && styles.textLight]}
                                    placeholder="Phone Number"
                                    placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                                    value={shippingInfo.phone}
                                    onChangeText={(text) => setShippingInfo({ ...shippingInfo, phone: text })}
                                />
                            </View>
                            <View style={[styles.inputWrapper, isDark && styles.inputDark, { alignItems: 'flex-start', paddingTop: 12 }]}>
                                <Ionicons name="map-outline" size={18} color="#94A3B8" style={[styles.inputIcon, { marginTop: 2 }]} />
                                <TextInput
                                    style={[styles.input, isDark && styles.textLight, { height: 100, textAlignVertical: 'top' }]}
                                    placeholder="Complete Delivery Address (House, Street, Area...)"
                                    placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                                    multiline
                                    value={shippingInfo.street}
                                    onChangeText={(text) => setShippingInfo({ ...shippingInfo, street: text })}
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* 2. Point Payment Section */}
                <View style={[styles.section, isDark && styles.sectionDark]}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconCircle, isDark && { backgroundColor: '#134E4A' }]}>
                            <Ionicons name="gift" size={18} color="#F59E0B" />
                        </View>
                        <View>
                            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>FlyBook Points</Text>
                            <Text style={styles.sectionSubTitle}>Use points to save on your order</Text>
                        </View>
                    </View>

                    <LinearGradient
                        colors={isDark ? ['#1e293b', '#0f172a'] : ['#F8FAFC', '#F1F5F9']}
                        style={styles.coinBalanceRow}
                    >
                        <View style={styles.balanceItem}>
                            <Text style={styles.balanceLabel}>Your Balance</Text>
                            <Text style={[styles.balanceValue, { color: '#0D9488' }]}>🪙 {(user?.flyWallet || 0).toFixed(2)}</Text>
                        </View>
                        <View style={styles.balanceItem}>
                            <Text style={styles.balanceLabel}>Usable Points</Text>
                            <Text style={[styles.balanceValue, { color: '#F59E0B' }]}>🪙 {calculations.maxUsable.toFixed(2)}</Text>
                        </View>
                    </LinearGradient>

                    {calculations.maxUsable > 0 && (
                        <View style={styles.coinInputWrapper}>
                            <View style={[styles.coinInputContainer, isDark && styles.inputDark]}>
                                <Text style={styles.coinCurrencyPrefix}>🪙</Text>
                                <TextInput
                                    style={[styles.coinInput, isDark && styles.textLight]}
                                    placeholder="Amount"
                                    keyboardType="numeric"
                                    value={coinsUsed.toString()}
                                    onChangeText={(text) => {
                                        const val = parseInt(text) || 0;
                                        setCoinsUsed(Math.min(val, calculations.maxUsable));
                                    }}
                                />
                                <TouchableOpacity
                                    style={styles.maxBtn}
                                    onPress={() => setCoinsUsed(calculations.maxUsable)}
                                >
                                    <Text style={styles.maxBtnText}>MAX</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.coinHint}>* 100 Points = ৳100.0 (Min usage: 100)</Text>
                        </View>
                    )}
                </View>

                {/* 3. Order Summary */}
                <View style={[styles.section, isDark && styles.sectionDark]}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconCircle, isDark && { backgroundColor: '#134E4A' }]}>
                            <Ionicons name="receipt" size={18} color="#6366F1" />
                        </View>
                        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Bill Details</Text>
                    </View>

                    <View style={[styles.billCard, isDark && styles.billCardDark]}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Items Total</Text>
                            <Text style={[styles.summaryValue, isDark && styles.textLight]}>৳{calculations.subtotal.toLocaleString()}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Delivery Fee</Text>
                            <Text style={[styles.summaryValue, isDark && styles.textLight]}>৳{calculations.deliveryCharges.toLocaleString()}</Text>
                        </View>
                        {coinsUsed > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: '#0D9488', fontWeight: '700' }]}>Points Applied</Text>
                                <Text style={[styles.summaryValue, { color: '#0D9488', fontWeight: '800' }]}>-৳{(coinsUsed / COIN_TO_TAKA_RATE).toLocaleString()}</Text>
                            </View>
                        )}
                        <View style={[styles.divider, isDark && styles.dividerDark]} />
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, styles.totalLabel, isDark && styles.textLight]}>Grand Total</Text>
                            <Text style={[styles.summaryValue, styles.totalValue]}>৳{(calculations.total - (coinsUsed / COIN_TO_TAKA_RATE)).toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* 4. Payment Method */}
                <View style={[styles.section, isDark && styles.sectionDark]}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconCircle, isDark && styles.sectionIconCircleDark]}>
                            <Ionicons name="card" size={18} color="#0D9488" />
                        </View>
                        <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Payment Selection</Text>
                    </View>
                    <TouchableOpacity style={[styles.paymentCard, isDark && styles.paymentCardDark]} activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#0D9488', '#0F766E']}
                            style={styles.paymentIconBox}
                        >
                            <Ionicons name="cash" size={22} color="#FFF" />
                        </LinearGradient>
                        <View style={styles.paymentInfo}>
                            <Text style={[styles.paymentName, isDark && styles.textLight]}>Cash on Delivery</Text>
                            <Text style={[styles.paymentDesc, isDark && { color: '#0D9488' }]}>Safe & simple payment upon arrival</Text>
                        </View>
                        <View style={styles.activeRadioCircle}>
                            <View style={styles.activeRadioDot} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={[styles.footer, isDark && styles.footerDark]}>
                <TouchableOpacity
                    style={[styles.placeOrderBtn, isPlacingOrder && styles.disabledBtn]}
                    onPress={handlePlaceOrder}
                    disabled={isPlacingOrder}
                >
                    {isPlacingOrder ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.placeOrderText}>Confirm Order (৳{(calculations.total - (coinsUsed / COIN_TO_TAKA_RATE)).toLocaleString()})</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    containerDark: { backgroundColor: '#0f172a' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    textLight: { color: '#F8FAFC' },

    scrollContent: { padding: 16, paddingBottom: 120 },

    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sectionDark: { backgroundColor: '#1e293b', borderColor: '#334155' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
    sectionIconCircle: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center' },
    sectionIconCircleDark: { backgroundColor: '#134E4A' },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B', letterSpacing: -0.3 },
    sectionSubTitle: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 1 },

    addressCard: {
        padding: 16,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#FCFDFF',
    },
    addressCardDark: { borderColor: '#334155', backgroundColor: '#0f172a' },
    addressSelected: { borderColor: '#0D9488', backgroundColor: '#F0FDFA' },
    addressSelectedDark: { borderColor: '#0D9488', backgroundColor: '#134E4A' },
    addressInfo: { flex: 1 },
    addressBadge: { alignSelf: 'flex-start', backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
    addressBadgeDark: { backgroundColor: '#334155' },
    addressBadgeText: { fontSize: 10, fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
    addressText: { fontSize: 14, color: '#1E293B', lineHeight: 20, fontWeight: '600' },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    addressPhone: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    unselectedCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#E2E8F0' },

    manualAddressForm: { gap: 12 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, paddingVertical: 14, color: '#1E293B', fontSize: 15, fontWeight: '500' },
    inputDark: { backgroundColor: '#0f172a', borderColor: '#334155', color: '#F8FAFC' },

    coinBalanceRow: { flexDirection: 'row', gap: 12, marginBottom: 16, borderRadius: 18, padding: 16 },
    balanceItem: { flex: 1, alignItems: 'center' },
    balanceLabel: { fontSize: 11, color: '#64748B', textTransform: 'uppercase', marginBottom: 6, fontWeight: '800', letterSpacing: 0.5 },
    balanceValue: { fontSize: 18, fontWeight: '900' },

    coinInputWrapper: { gap: 12 },
    coinInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#0D9488', paddingHorizontal: 16, height: 60 },
    coinCurrencyPrefix: { fontSize: 20, marginRight: 10 },
    coinInput: { flex: 1, fontSize: 20, fontWeight: '800', color: '#0D9488' },
    maxBtn: { backgroundColor: '#0D9488', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    maxBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
    coinHint: { fontSize: 12, color: '#94A3B8', textAlign: 'center', fontWeight: '600', fontStyle: 'italic' },

    billCard: { backgroundColor: '#FCFDFF', borderRadius: 18, padding: 4 },
    billCardDark: { backgroundColor: '#0f172a' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    summaryLabel: { color: '#64748B', fontSize: 15, fontWeight: '600' },
    summaryValue: { fontWeight: '700', color: '#1E293B', fontSize: 15 },
    divider: { height: 1.5, backgroundColor: '#F1F5F9', marginVertical: 16, borderStyle: 'dashed', borderRadius: 1 },
    dividerDark: { backgroundColor: '#334155' },
    totalLabel: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    totalValue: { fontSize: 24, fontWeight: '900', color: '#0D9488', letterSpacing: -0.5 },

    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F0FDFA',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#0D9488',
        gap: 14
    },
    paymentCardDark: { backgroundColor: '#134E4A', borderColor: '#0D9488' },
    paymentIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    paymentInfo: { flex: 1 },
    paymentName: { fontWeight: '800', color: '#111827', fontSize: 16 },
    paymentDesc: { fontSize: 12, color: '#0D9488', fontWeight: '600', marginTop: 2 },
    activeRadioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#0D9488', justifyContent: 'center', alignItems: 'center' },
    activeRadioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#0D9488' },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 25,
    },
    footerDark: { backgroundColor: '#1e293b' },
    placeOrderBtn: { backgroundColor: '#0D9488', borderRadius: 20, height: 60, justifyContent: 'center', alignItems: 'center', shadowColor: '#0D9488', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
    disabledBtn: { opacity: 0.7 },
    placeOrderText: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },
});

export default Checkout;
