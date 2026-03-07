import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    FlatList,
    RefreshControl,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { get, post, del, put } from '../../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CustomHeader from '../../components/common/CustomHeader';
import Toast from 'react-native-toast-message';
import { handleImageUpload } from '../../utils/imageUpload';

const { width } = Dimensions.get('window');

const SellerDashboard = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');
    const [refreshing, setRefreshing] = useState(false);

    const [isProductModalVisible, setIsProductModalVisible] = useState(false);
    const [isSavingProduct, setIsSavingProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [productForm, setProductForm] = useState({
        title: '',
        price: '',
        category: '',
        stock: '',
        description: '',
        images: [] as string[],
        discount: '',
        coinUsagePercentage: '30',
        availableSizes: [] as string[],
        availableColors: [] as string[],
    });
    const [colorInput, setColorInput] = useState('');

    // Queries
    const { data: categories = [] } = useQuery({
        queryKey: ['market-categories'],
        queryFn: () => get<any>('/get-product-categories').then(res => res.categories || []),
    });

    const { data: sellerStatus, isLoading: statusLoading } = useQuery({
        queryKey: ['seller-check', user?._id],
        queryFn: () => get<any>(`/sellers/check/${user?._id}`).then(res => res || { isSeller: false }),
        enabled: !!user?._id
    });

    const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery({
        queryKey: ['seller-products', user?._id],
        queryFn: () => get<any>('/get-seller-products').then(res => res.products || []),
        enabled: !!user?._id
    });

    const { data: items = [], isLoading: paymentsLoading, refetch: refetchPayments } = useQuery({
        queryKey: ['seller-payments', user?._id],
        queryFn: () => get<any>('/seller-payments').then(res => res.items || []),
        enabled: !!user?._id
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            refetchProducts(),
            refetchPayments(),
            queryClient.invalidateQueries({ queryKey: ['seller-check', user?._id] })
        ]);
        setRefreshing(false);
    }, [user?._id, queryClient, refetchProducts, refetchPayments]);

    const calculateStats = () => {
        const totalSales = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        return {
            totalProducts: products.length,
            totalOrders: items.length,
            deliveredOrders: items.filter((i: any) => i.itemOrderStatus === 'delivered').length,
            pendingOrders: items.filter((i: any) => i.itemOrderStatus === 'pending').length,
            totalSales
        };
    };

    const handleDeleteProduct = async (id: string) => {
        try {
            const res = await del<any>(`/delete-product/${id}`);
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Deleted', text2: 'Product removed successfully' });
                refetchProducts();
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to delete' });
        }
    };

    const handleToggleStock = async (id: string, currentStock: number) => {
        try {
            const newStock = currentStock > 0 ? 0 : 10; // Simple toggle for now
            const res = await put<any>(`/update-product/${id}`, { stock: newStock });
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Updated', text2: `Product is now ${newStock > 0 ? 'In Stock' : 'Out of Stock'}` });
                refetchProducts();
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Update failed' });
        }
    };

    const handleSaveProduct = async () => {
        if (!productForm.title || !productForm.price || !productForm.category || productForm.images.length === 0) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'Title, Price, Category and at least one image are required' });
            return;
        }

        try {
            setIsSavingProduct(true);
            const payload = {
                ...productForm,
                price: parseFloat(productForm.price),
                stock: parseInt(productForm.stock) || 0,
                discount: parseFloat(productForm.discount) || 0,
                coinUsagePercentage: parseInt(productForm.coinUsagePercentage) || 0,
                vendorId: user?._id,
                vendorName: sellerStatus?.seller?.businessName,
                createdAt: new Date(),
            };

            let res;
            if (editingProduct) {
                res = await put<any>(`/update-product/${editingProduct._id}`, payload);
            } else {
                res = await post<any>('/add-seller-product', payload);
            }

            if (res.success || res.status === 201 || res.insertedId) {
                Toast.show({ type: 'success', text1: 'Success', text2: `Product ${editingProduct ? 'updated' : 'added'} successfully` });
                setIsProductModalVisible(false);
                refetchProducts();
                resetForm();
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Failed', text2: error.message || 'Action failed' });
        } finally {
            setIsSavingProduct(false);
        }
    };

    const resetForm = () => {
        setProductForm({
            title: '',
            price: '',
            category: '',
            stock: '',
            description: '',
            images: [],
            discount: '',
            coinUsagePercentage: '30',
            availableSizes: [],
            availableColors: [],
        });
        setEditingProduct(null);
        setColorInput('');
    };

    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const handleProductImageUpload = async () => {
        try {
            setIsUploadingImage(true);
            const url = await handleImageUpload();
            if (url) {
                setProductForm(prev => ({
                    ...prev,
                    images: [...prev.images, url]
                }));
                Toast.show({ type: 'success', text1: 'Success', text2: 'Image uploaded successfully' });
            }
        } catch (error: any) {
            if (error.message !== 'User cancelled') {
                Toast.show({ type: 'error', text1: 'Upload Failed', text2: error.message });
            }
        } finally {
            setIsUploadingImage(false);
        }
    };

    const removeProductImage = (index: number) => {
        setProductForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const openAddModal = () => {
        resetForm();
        setIsProductModalVisible(true);
    };

    const openEditModal = (product: any) => {
        setEditingProduct(product);
        setProductForm({
            title: product.title,
            price: product.price.toString(),
            category: product.category,
            stock: product.stock.toString(),
            description: product.description || '',
            images: product.images || [],
            discount: (product.discount || 0).toString(),
            coinUsagePercentage: (product.coinUsagePercentage || 30).toString(),
            availableSizes: product.availableSizes || [],
            availableColors: product.availableColors || [],
        });
        setIsProductModalVisible(true);
    };

    const handleUpdateOrderStatus = async (orderId: string, itemId: string, currentStatus: string) => {
        const statuses = ['pending', 'processing', 'ready-to-ship', 'shipped', 'delivered'];
        const currentIndex = statuses.indexOf(currentStatus);
        const nextStatus = statuses[currentIndex + 1] || statuses[0];

        try {
            const res = await put<any>(`/seller/orders/${orderId}/item/${itemId}`, { status: nextStatus });
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Updated', text2: `Status changed to ${nextStatus}` });
                refetchPayments();
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Update failed' });
        }
    };

    const stats = calculateStats();
    const seller = sellerStatus?.seller;



    const renderOverview = () => (
        <View style={styles.tabContent}>
            {/* Seller Header */}
            <View style={[styles.sellerInfoCard, isDark && styles.cardDark]}>
                <LinearGradient
                    colors={['#0D9488', '#0F766E']}
                    style={styles.sellerBalanceGradient}
                >
                    <View>
                        <Text style={styles.balanceLabel}>Total Revenue</Text>
                        <Text style={styles.balanceValue}>৳{stats.totalSales.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.withdrawSmallBtn}
                        onPress={() => Toast.show({ type: 'info', text1: 'Withdraw', text2: 'Withdrawal feature coming soon!' })}
                    >
                        <Text style={styles.withdrawSmallText}>Withdraw</Text>
                    </TouchableOpacity>
                </LinearGradient>

                <View style={styles.sellerBasicInfo}>
                    <Image
                        source={{ uri: seller?.userInfo?.profileImage || 'https://via.placeholder.com/100' }}
                        style={styles.sellerAvatar}
                    />
                    <View style={styles.sellerTextContainer}>
                        <Text style={[styles.businessName, isDark && styles.textLight]}>{seller?.businessName || 'Your Business'}</Text>
                        <View style={styles.sellerBadgeRow}>
                            <View style={[styles.statusTag, isDark ? { backgroundColor: '#064E3B' } : { backgroundColor: '#DCFCE7' }]}>
                                <Text style={[styles.statusTagText, isDark ? { color: '#34D399' } : { color: '#166534' }]}>APPROVED</Text>
                            </View>
                            <Text style={[styles.businessCategory, isDark && { color: '#94A3B8' }]}>{seller?.businessType}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={[styles.statBox, isDark && styles.cardDark]}>
                    <View style={[styles.statIconCircle, isDark ? { backgroundColor: '#1E293B' } : { backgroundColor: '#EFF6FF' }]}>
                        <Ionicons name="package" size={20} color="#3B82F6" />
                    </View>
                    <Text style={[styles.statBoxValue, isDark && styles.textLight]}>{stats.totalProducts}</Text>
                    <Text style={[styles.statBoxLabel, isDark && { color: '#94A3B8' }]}>Products</Text>
                </View>
                <View style={[styles.statBox, isDark && styles.cardDark]}>
                    <View style={[styles.statIconCircle, isDark ? { backgroundColor: '#1E293B' } : { backgroundColor: '#F0FDF4' }]}>
                        <Ionicons name="cart" size={20} color="#10B981" />
                    </View>
                    <Text style={[styles.statBoxValue, isDark && styles.textLight]}>{stats.totalOrders}</Text>
                    <Text style={[styles.statBoxLabel, isDark && { color: '#94A3B8' }]}>Total Orders</Text>
                </View>
                <View style={[styles.statBox, isDark && styles.cardDark]}>
                    <View style={[styles.statIconCircle, isDark ? { backgroundColor: '#1E293B' } : { backgroundColor: '#FFFBEB' }]}>
                        <Ionicons name="time" size={20} color="#F59E0B" />
                    </View>
                    <Text style={[styles.statBoxValue, isDark && styles.textLight]}>{stats.pendingOrders}</Text>
                    <Text style={[styles.statBoxLabel, isDark && { color: '#94A3B8' }]}>Pending</Text>
                </View>
                <View style={[styles.statBox, isDark && styles.cardDark]}>
                    <View style={[styles.statIconCircle, isDark ? { backgroundColor: '#1E293B' } : { backgroundColor: '#F0FDFA' }]}>
                        <Ionicons name="checkmark-done" size={20} color="#0D9488" />
                    </View>
                    <Text style={[styles.statBoxValue, isDark && styles.textLight]}>{stats.deliveredOrders}</Text>
                    <Text style={[styles.statBoxLabel, isDark && { color: '#94A3B8' }]}>Delivered</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Quick Actions</Text>
            </View>
            <View style={styles.actionGrid}>
                <TouchableOpacity
                    style={[styles.actionBtn, isDark && styles.cardDark]}
                    onPress={openAddModal}
                >
                    <Ionicons name="add-circle" size={24} color="#0D9488" />
                    <Text style={[styles.actionBtnText, isDark && styles.textLight]}>Add Product</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, isDark && styles.cardDark]}
                    onPress={() => setActiveTab('products')}
                >
                    <Ionicons name="list" size={24} color="#3B82F6" />
                    <Text style={[styles.actionBtnText, isDark && styles.textLight]}>My Products</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, isDark && styles.cardDark]}
                    onPress={() => setActiveTab('orders')}
                >
                    <Ionicons name="receipt" size={24} color="#F59E0B" />
                    <Text style={[styles.actionBtnText, isDark && styles.textLight]}>Manage Orders</Text>
                </TouchableOpacity>
            </View>

            {/* Recent Orders */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Recent Orders</Text>
                <TouchableOpacity onPress={() => setActiveTab('orders')}><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
            </View>
            {items.length === 0 ? (
                <View style={[styles.emptyRecent, isDark && styles.cardDark]}>
                    <Text style={styles.emptyRecentText}>No orders yet</Text>
                </View>
            ) : (
                items.slice(0, 5).map((order: any, idx: number) => (
                    <View key={idx} style={[styles.recentOrderCard, isDark && styles.cardDark]}>
                        <Image source={{ uri: order.image || order.images?.[0] }} style={styles.recentOrderImg} />
                        <View style={styles.recentOrderDetails}>
                            <Text style={[styles.recentOrderTitle, isDark && styles.textLight]} numberOfLines={1}>{order.title}</Text>
                            <Text style={[styles.recentOrderDate, isDark && { color: '#64748B' }]}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.recentOrderRight}>
                            <Text style={styles.recentOrderPrice}>৳{(order.price * order.quantity).toFixed(2)}</Text>
                            <View style={[styles.miniStatus, isDark ? { backgroundColor: order.itemOrderStatus === 'delivered' ? '#064E3B' : '#78350F' } : { backgroundColor: order.itemOrderStatus === 'delivered' ? '#DCFCE7' : '#FEF3C7' }]}>
                                <Text style={[styles.miniStatusText, isDark ? { color: order.itemOrderStatus === 'delivered' ? '#34D399' : '#FBBF24' } : { color: order.itemOrderStatus === 'delivered' ? '#166534' : '#92400E' }]}>{order.itemOrderStatus?.toUpperCase()}</Text>
                            </View>
                        </View>
                    </View>
                ))
            )}
            <View style={{ height: 40 }} />
        </View>
    );

    const renderProducts = () => (
        <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>My Products ({products.length})</Text>
                <TouchableOpacity
                    style={styles.addIconBtn}
                    onPress={openAddModal}
                >
                    <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
            {productsLoading ? (
                <ActivityIndicator color="#0D9488" style={{ marginTop: 40 }} />
            ) : products.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="package-variant-closed" size={64} color={isDark ? "#334155" : "#E2E8F0"} />
                    <Text style={[styles.emptyTitle, isDark && styles.textLight]}>No Products</Text>
                    <Text style={[styles.emptyDesc, isDark && { color: '#64748B' }]}>Start adding your products to the marketplace.</Text>
                </View>
            ) : (
                products.map((item: any) => (
                    <View key={item._id} style={[styles.productCard, isDark && styles.cardDark]}>
                        <Image source={{ uri: item.images?.[0] }} style={styles.productImg} />
                        <View style={styles.productDetails}>
                            <Text style={[styles.productTitle, isDark && styles.textLight]} numberOfLines={2}>{item.title}</Text>
                            <View style={styles.productMeta}>
                                <Text style={styles.productPrice}>৳{item.price.toFixed(2)}</Text>
                                <Text style={[styles.productStock, isDark && { color: '#94A3B8' }]}>Stock: {item.stock}</Text>
                            </View>
                            <View style={styles.productActions}>
                                <TouchableOpacity style={styles.actionIconBtn} onPress={() => openEditModal(item)}>
                                    <Ionicons name="create-outline" size={18} color="#0D9488" />
                                    <Text style={styles.actionIconText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleDeleteProduct(item._id)}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    <Text style={[styles.actionIconText, { color: '#EF4444' }]}>Delete</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleToggleStock(item._id, item.stock)}>
                                    <Ionicons name={item.stock > 0 ? "eye-outline" : "eye-off-outline"} size={18} color={item.stock > 0 ? "#10B981" : "#F59E0B"} />
                                    <Text style={[styles.actionIconText, { color: item.stock > 0 ? "#10B981" : "#F59E0B" }]}>{item.stock > 0 ? 'Hide' : 'Show'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))
            )}
            <View style={{ height: 40 }} />
        </View>
    );

    const renderOrders = () => (
        <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Product Orders</Text>
            </View>
            {paymentsLoading ? (
                <ActivityIndicator color="#0D9488" style={{ marginTop: 40 }} />
            ) : items.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="cart-outline" size={64} color="#E2E8F0" />
                    <Text style={styles.emptyTitle}>No Orders</Text>
                    <Text style={styles.emptyDesc}>When customers buy your products, orders will appear here.</Text>
                </View>
            ) : (
                items.map((order: any, idx: number) => (
                    <View key={idx} style={[styles.orderCard, isDark && styles.cardDark]}>
                        <View style={styles.orderHeader}>
                            <View>
                                <Text style={[styles.orderId, isDark && styles.textLight]}>Order #{order.orderId?.slice(-8).toUpperCase()}</Text>
                                <Text style={[styles.orderDate, isDark && { color: '#64748B' }]}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <View style={[styles.statusBadge, isDark ? { backgroundColor: order.itemOrderStatus === 'delivered' ? '#064E3B' : '#78350F' } : { backgroundColor: order.itemOrderStatus === 'delivered' ? '#DCFCE7' : '#FEF3C7' }]}>
                                <Text style={[styles.statusText, isDark ? { color: order.itemOrderStatus === 'delivered' ? '#34D399' : '#FBBF24' } : { color: order.itemOrderStatus === 'delivered' ? '#166534' : '#92400E' }]}>{order.itemOrderStatus?.toUpperCase()}</Text>
                            </View>
                        </View>

                        <View style={styles.orderItemRow}>
                            <Image source={{ uri: order.image || order.images?.[0] }} style={styles.itemThumb} />
                            <View style={styles.itemInfo}>
                                <Text style={[styles.itemTitle, isDark && styles.textLight]} numberOfLines={1}>{order.title}</Text>
                                <Text style={[styles.itemQty, isDark && { color: '#94A3B8' }]}>Quantity: {order.quantity} x ৳{order.price}</Text>
                            </View>
                            <Text style={styles.itemTotal}>৳{(order.price * order.quantity).toFixed(2)}</Text>
                        </View>

                        <View style={[styles.customerBox, isDark && styles.customerBoxDark]}>
                            <Text style={styles.customerLabel}>Customer Info:</Text>
                            <Text style={[styles.customerValue, isDark && styles.textLight]}>{order.shippingInfo?.fullName || 'Anonymous'}</Text>
                            <Text style={[styles.customerAddress, isDark && { color: '#94A3B8' }]} numberOfLines={1}>{order.shippingInfo?.street}, {order.shippingInfo?.city}</Text>
                        </View>

                        <View style={styles.orderActions}>
                            <TouchableOpacity
                                style={[styles.viewDetailsBtn, isDark && styles.viewDetailsBtnDark]}
                                onPress={() => handleUpdateOrderStatus(order.orderId, order._id, order.itemOrderStatus)}
                            >
                                <Text style={styles.viewDetailsText}>Move to Next Stage</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}
            <View style={{ height: 40 }} />
        </View>
    );

    const renderPayments = () => (
        <View style={styles.tabContent}>
            <View style={[styles.paymentSummaryCard, isDark && styles.cardDark]}>
                <Text style={styles.summaryLabel}>Total Earned</Text>
                <Text style={styles.summaryValue}>৳{stats.totalSales.toFixed(2)}</Text>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                    <View>
                        <Text style={styles.summarySmallLabel}>Available</Text>
                        <Text style={[styles.summarySmallValue, isDark && styles.textLight]}>৳{stats.totalSales.toFixed(2)}</Text>
                    </View>
                    <View>
                        <Text style={styles.summarySmallLabel}>Pending</Text>
                        <Text style={[styles.summarySmallValue, isDark && styles.textLight]}>৳0.00</Text>
                    </View>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Transaction History</Text>
            </View>
            {items.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="card-outline" size={64} color="#E2E8F0" />
                    <Text style={styles.emptyTitle}>No Transactions</Text>
                </View>
            ) : (
                items.map((p: any, idx: number) => (
                    <View key={idx} style={[styles.transactionCard, isDark && styles.cardDark]}>
                        <View style={[styles.txIconBox, isDark && styles.txIconBoxDark]}>
                            <Ionicons name="arrow-up" size={18} color="#0D9488" />
                        </View>
                        <View style={styles.txInfo}>
                            <Text style={[styles.txTitle, isDark && styles.textLight]} numberOfLines={1}>Sale: {p.title}</Text>
                            <Text style={[styles.txDate, isDark && { color: '#64748B' }]}>{new Date(p.createdAt).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.txAmountCol}>
                            <Text style={styles.txAmount}>+৳{(p.price * p.quantity).toFixed(2)}</Text>
                            <Text style={styles.txStatus}>Success</Text>
                        </View>
                    </View>
                ))
            )}
            <View style={{ height: 40 }} />
        </View>
    );

    const renderProfile = () => (
        <View style={styles.tabContent}>
            <View style={[styles.profileInfoCard, isDark && styles.cardDark]}>
                <View style={styles.profileHeader}>
                    <Image source={{ uri: seller?.userInfo.profileImage }} style={styles.largeAvatar} />
                    <Text style={[styles.profileName, isDark && styles.textLight]}>{seller?.businessName}</Text>
                    <Text style={[styles.profileCategory, isDark && { color: '#94A3B8' }]}>{seller?.businessType}</Text>
                </View>

                <View style={styles.detailsList}>
                    <View style={styles.detailItem}>
                        <Ionicons name="person-outline" size={20} color="#0D9488" />
                        <View>
                            <Text style={styles.detailLabel}>Owner Name</Text>
                            <Text style={[styles.detailValue, isDark && styles.textLight]}>{seller?.userInfo.name}</Text>
                        </View>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="mail-outline" size={20} color="#0D9488" />
                        <View>
                            <Text style={styles.detailLabel}>Email Address</Text>
                            <Text style={[styles.detailValue, isDark && styles.textLight]}>{seller?.userInfo.email}</Text>
                        </View>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="call-outline" size={20} color="#0D9488" />
                        <View>
                            <Text style={styles.detailLabel}>Business Phone</Text>
                            <Text style={[styles.detailValue, isDark && styles.textLight]}>{seller?.userInfo.phone}</Text>
                        </View>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="location-outline" size={20} color="#0D9488" />
                        <View>
                            <Text style={styles.detailLabel}>Business Address</Text>
                            <Text style={[styles.detailValue, isDark && styles.textLight]}>{seller?.businessAddress}</Text>
                        </View>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="wallet-outline" size={20} color="#0D9488" />
                        <View>
                            <Text style={styles.detailLabel}>Payment Method</Text>
                            <Text style={[styles.detailValue, isDark && styles.textLight]}>{seller?.mobilePaymentProvider}: {seller?.mobilePaymentNumber}</Text>
                        </View>
                    </View>
                </View>
            </View>
            <View style={{ height: 40 }} />
        </View>
    );

    const [isBannerModalVisible, setIsBannerModalVisible] = useState(false);
    const [isSavingBanner, setIsSavingBanner] = useState(false);
    const [bannerForm, setBannerForm] = useState({
        title: '',
        description: '',
        ctaText: '',
        ctaLink: '',
        image: '',
    });

    // Queries
    const { data: bannerRequests = [], refetch: refetchBanners } = useQuery({
        queryKey: ['seller-banners', user?._id],
        queryFn: () => get<any>(`/seller/banner-requests/${user?._id}`).then(res => res.requests || []),
        enabled: !!user?._id
    });

    const handleSaveBanner = async () => {
        if (!bannerForm.title || !bannerForm.image) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Title and Image URL are required' });
            return;
        }

        try {
            setIsSavingBanner(true);
            const payload = {
                ...bannerForm,
                sellerId: user?._id,
                sellerName: sellerStatus?.seller?.businessName,
            };

            const res = await post<any>('/seller/banner-request', payload);
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Submitted', text2: 'Banner request is pending approval' });
                setIsBannerModalVisible(false);
                refetchBanners();
                setBannerForm({ title: '', description: '', ctaText: '', ctaLink: '', image: '' });
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Failed', text2: error.message || 'Submission failed' });
        } finally {
            setIsSavingBanner(false);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'grid' },
        { id: 'products', label: 'Products', icon: 'package' },
        { id: 'orders', label: 'Orders', icon: 'cart' },
        { id: 'payments', label: 'Payments', icon: 'card' },
        { id: 'banners', label: 'Banners', icon: 'image' },
        { id: 'profile', label: 'Profile', icon: 'person' },
    ];

    const renderBanners = () => (
        <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Banner Requests</Text>
                <TouchableOpacity
                    style={styles.addIconBtn}
                    onPress={() => setIsBannerModalVisible(true)}
                >
                    <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            {bannerRequests.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="images-outline" size={64} color="#E2E8F0" />
                    <Text style={styles.emptyTitle}>No Banner Requests</Text>
                    <Text style={styles.emptyDesc}>Promote your brand by requesting a homepage banner.</Text>
                </View>
            ) : (
                bannerRequests.map((banner: any) => (
                    <View key={banner._id} style={[styles.bannerRequestCard, isDark && styles.cardDark]}>
                        <Image source={{ uri: banner.image }} style={styles.bannerImg} />
                        <View style={styles.bannerDetails}>
                            <View style={styles.rowBetween}>
                                <Text style={[styles.bannerTitle, isDark && styles.textLight]}>{banner.title}</Text>
                                <View style={[styles.miniStatus, { backgroundColor: banner.status === 'approved' ? '#DCFCE7' : banner.status === 'pending' ? '#FEF3C7' : '#FEE2E2' }]}>
                                    <Text style={[styles.miniStatusText, { color: banner.status === 'approved' ? '#166534' : banner.status === 'pending' ? '#92400E' : '#991B1B' }]}>{banner.status?.toUpperCase()}</Text>
                                </View>
                            </View>
                            <Text style={styles.bannerDesc} numberOfLines={2}>{banner.description}</Text>
                            <Text style={styles.bannerDate}>{new Date(banner.createdAt).toLocaleDateString()}</Text>
                        </View>
                    </View>
                ))
            )}
            <View style={{ height: 40 }} />
        </View>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return renderOverview();
            case 'products': return renderProducts();
            case 'orders': return renderOrders();
            case 'payments': return renderPayments();
            case 'banners': return renderBanners();
            case 'profile': return renderProfile();
            default: return renderOverview();
        }
    };

    if (statusLoading) {
        return (
            <View style={[styles.container, isDark && styles.containerDark, styles.center]}>
                <ActivityIndicator size="large" color="#0D9488" />
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <CustomHeader title="Seller Dashboard" />

            {/* Sub-Tabs */}
            <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.tabItem,
                                activeTab === tab.id && styles.activeTabItem,
                            ]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Ionicons
                                name={activeTab === tab.id ? tab.icon : `${tab.icon}-outline`}
                                size={18}
                                color={activeTab === tab.id ? '#0D9488' : '#64748B'}
                            />
                            <Text style={[
                                styles.tabLabel,
                                activeTab === tab.id && styles.activeTabLabel,
                                isDark && activeTab !== tab.id && { color: '#94A3B8' }
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D9488" />}
            >
                {renderContent()}
            </ScrollView>

            {/* Product Add/Edit Modal */}
            <Modal
                visible={isProductModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsProductModalVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setIsProductModalVisible(false)} />
                    <View style={[styles.modalContent, styles.productModalContent, isDark && styles.cardDark]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && styles.textLight]}>{editingProduct ? 'Edit Product' : 'Add New Product'}</Text>
                            <TouchableOpacity onPress={() => setIsProductModalVisible(false)}>
                                <Ionicons name="close" size={24} color={isDark ? "#94A3B8" : "#475569"} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Product Title *</Text>
                            <View style={[styles.modalInputWrapper, isDark && styles.inputDark]}>
                                <TextInput
                                    style={[styles.modalInput, isDark && styles.textLight]}
                                    placeholder="Enter product title"
                                    placeholderTextColor="#94A3B8"
                                    value={productForm.title}
                                    onChangeText={(text) => setProductForm({ ...productForm, title: text })}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={styles.flex1}>
                                    <Text style={styles.inputLabel}>Price (৳) *</Text>
                                    <View style={[styles.modalInputWrapper, isDark && styles.inputDark]}>
                                        <TextInput
                                            style={[styles.modalInput, isDark && styles.textLight]}
                                            keyboardType="numeric"
                                            placeholder="0.00"
                                            placeholderTextColor="#94A3B8"
                                            value={productForm.price}
                                            onChangeText={(text) => setProductForm({ ...productForm, price: text })}
                                        />
                                    </View>
                                </View>
                                <View style={{ width: 10 }} />
                                <View style={styles.flex1}>
                                    <Text style={styles.inputLabel}>Stock *</Text>
                                    <View style={[styles.modalInputWrapper, isDark && styles.inputDark]}>
                                        <TextInput
                                            style={[styles.modalInput, isDark && styles.textLight]}
                                            keyboardType="numeric"
                                            placeholder="QTY"
                                            placeholderTextColor="#94A3B8"
                                            value={productForm.stock}
                                            onChangeText={(text) => setProductForm({ ...productForm, stock: text })}
                                        />
                                    </View>
                                </View>
                                <View style={{ width: 10 }} />
                                <View style={styles.flex1}>
                                    <Text style={styles.inputLabel}>Disc (%)</Text>
                                    <View style={[styles.modalInputWrapper, isDark && styles.inputDark]}>
                                        <TextInput
                                            style={[styles.modalInput, isDark && styles.textLight]}
                                            keyboardType="numeric"
                                            placeholder="0"
                                            placeholderTextColor="#94A3B8"
                                            value={productForm.discount}
                                            onChangeText={(text) => setProductForm({ ...productForm, discount: text })}
                                        />
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>Category *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                                {categories.map((cat: any) => (
                                    <TouchableOpacity
                                        key={cat._id}
                                        style={[styles.typeBtn, productForm.category === cat.name && styles.typeBtnActive, { width: undefined, paddingHorizontal: 16 }]}
                                        onPress={() => setProductForm({ ...productForm, category: cat.name })}
                                    >
                                        <Text style={[styles.typeBtnText, productForm.category === cat.name && styles.typeBtnTextActive]}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.inputLabel}>Max Point Usage (%) *</Text>
                            <View style={[styles.modalInputWrapper, isDark && styles.inputDark]}>
                                <TextInput
                                    style={[styles.modalInput, isDark && styles.textLight]}
                                    keyboardType="numeric"
                                    placeholder="e.g. 30"
                                    placeholderTextColor="#94A3B8"
                                    value={productForm.coinUsagePercentage}
                                    onChangeText={(text) => setProductForm({ ...productForm, coinUsagePercentage: text })}
                                />
                                <Text style={styles.percentText}>%</Text>
                            </View>
                            <Text style={styles.hintText}>How much of the price can be paid with points?</Text>

                            <View style={[styles.variantSection, isDark && styles.cardDark]}>
                                <Text style={[styles.variantTitle, isDark && styles.textLight]}>Product Variants (Optional)</Text>

                                <Text style={styles.variantSubLabel}>Available Sizes</Text>
                                <View style={styles.sizeChipContainer}>
                                    {['S', 'M', 'L', 'XL', '2XL', '3XL'].map((size) => (
                                        <TouchableOpacity
                                            key={size}
                                            style={[styles.sizeChip, isDark && styles.inputDark, productForm.availableSizes.includes(size) && styles.sizeChipActive]}
                                            onPress={() => {
                                                const newSizes = productForm.availableSizes.includes(size)
                                                    ? productForm.availableSizes.filter(s => s !== size)
                                                    : [...productForm.availableSizes, size];
                                                setProductForm({ ...productForm, availableSizes: newSizes });
                                            }}
                                        >
                                            <Text style={[styles.sizeChipText, productForm.availableSizes.includes(size) && styles.sizeChipTextActive, isDark && !productForm.availableSizes.includes(size) && { color: '#94A3B8' }]}>{size}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={[styles.variantSubLabel, { marginTop: 16 }]}>Available Colors</Text>
                                <View style={styles.colorInputRow}>
                                    <View style={[styles.modalInputWrapper, isDark && styles.inputDark, { flex: 1, marginTop: 0 }]}>
                                        <TextInput
                                            style={[styles.modalInput, isDark && styles.textLight]}
                                            placeholder="Add color (e.g. Red)"
                                            placeholderTextColor="#94A3B8"
                                            value={colorInput}
                                            onChangeText={setColorInput}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.addColorBtn}
                                        onPress={() => {
                                            if (colorInput.trim() && !productForm.availableColors.includes(colorInput.trim())) {
                                                setProductForm({
                                                    ...productForm,
                                                    availableColors: [...productForm.availableColors, colorInput.trim()]
                                                });
                                                setColorInput('');
                                            }
                                        }}
                                    >
                                        <Ionicons name="add" size={24} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.colorChipContainer}>
                                    {productForm.availableColors.map((color, index) => (
                                        <View key={index} style={[styles.colorChip, isDark && { backgroundColor: '#1e293b', borderColor: '#334155' }]}>
                                            <Text style={styles.colorChipText}>{color}</Text>
                                            <TouchableOpacity onPress={() => {
                                                setProductForm({
                                                    ...productForm,
                                                    availableColors: productForm.availableColors.filter((_, i) => i !== index)
                                                });
                                            }}>
                                                <Ionicons name="close-circle" size={16} color="#0D9488" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>Product Images *</Text>
                            <View style={styles.imageUploadContainer}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScroll}>
                                    {productForm.images.map((img, index) => (
                                        <View key={index} style={styles.imagePreviewWrapper}>
                                            <Image source={{ uri: img }} style={styles.imageThumbnail} />
                                            <TouchableOpacity
                                                style={styles.removeImageBtn}
                                                onPress={() => removeProductImage(index)}
                                            >
                                                <Ionicons name="close-circle" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                    {isUploadingImage ? (
                                        <View style={[styles.imageThumbnail, styles.imagePlaceholder]}>
                                            <ActivityIndicator color="#0D9488" />
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.imageThumbnail, styles.imagePlaceholder]}
                                            onPress={handleProductImageUpload}
                                        >
                                            <Ionicons name="camera-outline" size={24} color="#94A3B8" />
                                            <Text style={styles.addImageText}>Add Photo</Text>
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>
                            </View>

                            <Text style={styles.inputLabel}>Description</Text>
                            <View style={[styles.modalInputWrapper, isDark && styles.inputDark, { height: 100 }]}>
                                <TextInput
                                    style={[styles.modalInput, isDark && styles.textLight, { textAlignVertical: 'top', paddingTop: 12 }]}
                                    placeholder="Product description..."
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    value={productForm.description}
                                    onChangeText={(text) => setProductForm({ ...productForm, description: text })}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.saveAddressBtn, isSavingProduct && { opacity: 0.7 }]}
                                onPress={handleSaveProduct}
                                disabled={isSavingProduct}
                            >
                                {isSavingProduct ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveAddressText}>{editingProduct ? 'Update Product' : 'Add Product'}</Text>}
                            </TouchableOpacity>
                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Banner Request Modal */}
            <Modal
                visible={isBannerModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsBannerModalVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setIsBannerModalVisible(false)} />
                    <View style={[styles.modalContent, styles.productModalContent, isDark && styles.cardDark]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && styles.textLight]}>Request Banner</Text>
                            <TouchableOpacity onPress={() => setIsBannerModalVisible(false)}>
                                <Ionicons name="close" size={24} color={isDark ? "#94A3B8" : "#475569"} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Banner Title *</Text>
                            <View style={[styles.modalInputWrapper, isDark && styles.inputDark]}>
                                <TextInput
                                    style={[styles.modalInput, isDark && styles.textLight]}
                                    placeholder="Enter banner title"
                                    placeholderTextColor="#94A3B8"
                                    value={bannerForm.title}
                                    onChangeText={(text) => setBannerForm({ ...bannerForm, title: text })}
                                />
                            </View>

                            <Text style={styles.inputLabel}>Image URL *</Text>
                            <View style={[styles.modalInputWrapper, isDark && styles.inputDark]}>
                                <TextInput
                                    style={[styles.modalInput, isDark && styles.textLight]}
                                    placeholder="Paste banner image link"
                                    placeholderTextColor="#94A3B8"
                                    value={bannerForm.image}
                                    onChangeText={(text) => setBannerForm({ ...bannerForm, image: text })}
                                />
                            </View>

                            <Text style={styles.inputLabel}>Description</Text>
                            <View style={[styles.modalInputWrapper, isDark && styles.inputDark, { height: 80 }]}>
                                <TextInput
                                    style={[styles.modalInput, isDark && styles.textLight, { textAlignVertical: 'top', paddingTop: 12 }]}
                                    placeholder="Promotion details..."
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    value={bannerForm.description}
                                    onChangeText={(text) => setBannerForm({ ...bannerForm, description: text })}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={styles.flex1}>
                                    <Text style={styles.inputLabel}>CTA Text</Text>
                                    <View style={[styles.modalInputWrapper, isDark && styles.inputDark]}>
                                        <TextInput
                                            style={[styles.modalInput, isDark && styles.textLight]}
                                            placeholder="e.g. Shop Now"
                                            placeholderTextColor="#94A3B8"
                                            value={bannerForm.ctaText}
                                            onChangeText={(text) => setBannerForm({ ...bannerForm, ctaText: text })}
                                        />
                                    </View>
                                </View>
                                <View style={{ width: 12 }} />
                                <View style={styles.flex1}>
                                    <Text style={styles.inputLabel}>CTA Link (Opt)</Text>
                                    <View style={[styles.modalInputWrapper, isDark && styles.inputDark]}>
                                        <TextInput
                                            style={[styles.modalInput, isDark && styles.textLight]}
                                            placeholder="/product/..."
                                            placeholderTextColor="#94A3B8"
                                            value={bannerForm.ctaLink}
                                            onChangeText={(text) => setBannerForm({ ...bannerForm, ctaLink: text })}
                                        />
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveAddressBtn, isSavingBanner && { opacity: 0.7 }]}
                                onPress={handleSaveBanner}
                                disabled={isSavingBanner}
                            >
                                {isSavingBanner ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveAddressText}>Submit Request</Text>}
                            </TouchableOpacity>
                            <View style={{ height: 30 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    containerDark: { backgroundColor: '#0f172a' },
    center: { justifyContent: 'center', alignItems: 'center' },
    textLight: { color: '#F8FAFC' },
    flex1: { flex: 1 },

    tabBar: { backgroundColor: '#FFF', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    tabBarDark: { backgroundColor: '#1e293b', borderBottomColor: '#334155' },
    tabScroll: { paddingHorizontal: 12, gap: 8 },
    tabItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8, backgroundColor: 'transparent' },
    activeTabItem: { backgroundColor: '#F0FDFA' },
    tabLabel: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    activeTabLabel: { color: '#0D9488' },

    tabContent: { flex: 1 },
    scrollContent: { padding: 16 },

    // Overview Styles
    sellerInfoCard: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden', marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    cardDark: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1 },
    sellerBalanceGradient: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
    balanceValue: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 4 },
    withdrawSmallBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    withdrawSmallText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
    sellerBasicInfo: { flexDirection: 'row', padding: 20, alignItems: 'center', gap: 16 },
    sellerAvatar: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#F1F5F9' },
    sellerTextContainer: { flex: 1 },
    businessName: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    sellerBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    statusTagText: { fontSize: 10, fontWeight: '900' },
    businessCategory: { fontSize: 12, color: '#64748B', fontWeight: '500' },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statBox: { width: (width - 44) / 2, backgroundColor: '#FFF', borderRadius: 20, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
    statIconCircle: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statBoxValue: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    statBoxLabel: { fontSize: 12, color: '#64748B', fontWeight: '700', marginTop: 2 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    seeAllText: { fontSize: 13, color: '#0D9488', fontWeight: '700' },
    addIconBtn: { backgroundColor: '#0D9488', width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

    actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    actionBtn: { flex: 1, backgroundColor: '#FFF', borderRadius: 18, padding: 16, alignItems: 'center', gap: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
    actionBtnText: { fontSize: 12, fontWeight: '800', color: '#1E293B', textAlign: 'center' },

    recentOrderCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    recentOrderImg: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F1F5F9' },
    recentOrderDetails: { flex: 1 },
    recentOrderTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    recentOrderDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
    recentOrderRight: { alignItems: 'flex-end' },
    recentOrderPrice: { fontSize: 15, fontWeight: '800', color: '#0D9488' },
    miniStatus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    miniStatusText: { fontSize: 9, fontWeight: '900' },
    emptyRecent: { padding: 40, alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
    emptyRecentText: { color: '#94A3B8', fontWeight: '500' },

    // Products Styles
    productCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 12 },
    productImg: { width: 90, height: 90, borderRadius: 16, backgroundColor: '#F1F5F9' },
    productDetails: { flex: 1, justifyContent: 'space-between' },
    productTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    productMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
    productPrice: { fontSize: 16, fontWeight: '800', color: '#0D9488' },
    productStock: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    productActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    actionIconBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionIconText: { fontSize: 12, fontWeight: '700', color: '#0D9488' },

    // Orders Styles
    orderCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 16 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    orderId: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    orderDate: { fontSize: 12, color: '#94A3B8' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '800' },
    orderItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    orderItemRowDark: { borderBottomColor: '#334155' },
    itemThumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#F1F5F9' },
    itemInfo: { flex: 1 },
    itemTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    itemQty: { fontSize: 12, color: '#64748B', marginTop: 2 },
    itemTotal: { fontSize: 15, fontWeight: '800', color: '#0D9488' },
    customerBox: { marginTop: 12, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
    customerBoxDark: { backgroundColor: '#0f172a' },
    customerLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' },
    customerValue: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 },
    customerAddress: { fontSize: 12, color: '#64748B', marginTop: 2 },
    orderActions: { marginTop: 16, flexDirection: 'row', justifyContent: 'flex-end' },
    viewDetailsBtn: { backgroundColor: '#F0FDFA', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#0D9488' },
    viewDetailsBtnDark: { backgroundColor: '#134E4A' },
    viewDetailsText: { fontSize: 12, fontWeight: '800', color: '#0D9488' },

    // Payments Styles
    paymentSummaryCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, marginBottom: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    summaryLabel: { fontSize: 14, color: '#64748B', fontWeight: '600' },
    summaryValue: { fontSize: 32, fontWeight: '900', color: '#0D9488', marginVertical: 8 },
    summaryDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
    summaryDividerDark: { backgroundColor: '#334155' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summarySmallLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
    summarySmallValue: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 2 },
    transactionCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 16 },
    txIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center' },
    txIconBoxDark: { backgroundColor: '#134E4A' },
    txInfo: { flex: 1 },
    txTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    txDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    txAmountCol: { alignItems: 'flex-end' },
    txAmount: { fontSize: 16, fontWeight: '800', color: '#0D9488' },
    txStatus: { fontSize: 10, color: '#10B981', fontWeight: '700', marginTop: 2 },

    // Profile Styles
    profileInfoCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24 },
    profileHeader: { alignItems: 'center', marginBottom: 32 },
    largeAvatar: { width: 100, height: 100, borderRadius: 40, backgroundColor: '#F1F5F9' },
    profileName: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginTop: 16 },
    profileCategory: { fontSize: 14, color: '#0D9488', fontWeight: '600', marginTop: 4 },
    detailsList: { gap: 20 },
    detailItem: { flexDirection: 'row', gap: 16, alignItems: 'center' },
    detailLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase' },
    detailValue: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginTop: 2 },

    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 16 },
    emptyDesc: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalDismiss: { flex: 1 },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
    modalContentDark: { backgroundColor: '#1e293b' },
    productModalContent: { paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    inputLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8, marginTop: 16 },
    modalInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 16, paddingHorizontal: 16, height: 56 },
    modalInputWrapperDark: { backgroundColor: '#0f172a' },
    inputDark: { backgroundColor: '#334155' },
    modalInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1E293B' },
    row: { flexDirection: 'row' },
    typeSelector: { flexDirection: 'row', marginBottom: 8 },
    typeBtn: { backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 12, marginRight: 8 },
    typeBtnActive: { backgroundColor: '#0D9488' },
    typeBtnText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    typeBtnTextActive: { color: '#FFF' },
    saveAddressBtn: { backgroundColor: '#0D9488', borderRadius: 18, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
    saveAddressText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

    bannerRequestCard: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    bannerImg: { width: '100%', height: 120, backgroundColor: '#F1F5F9' },
    bannerDetails: { padding: 16 },
    bannerTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    bannerDesc: { fontSize: 13, color: '#64748B', marginTop: 4 },
    bannerDate: { fontSize: 11, color: '#94A3B8', marginTop: 8 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    // Image Upload Styles
    imageUploadContainer: { marginTop: 8 },
    imageScroll: { gap: 12 },
    imagePreviewWrapper: { width: 80, height: 80, borderRadius: 16, overflow: 'hidden', position: 'relative' },
    imageThumbnail: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#F1F5F9' },
    removeImageBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: '#FFF', borderRadius: 10 },
    imagePlaceholder: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed' },
    addImageText: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 4 },

    percentText: { fontSize: 16, fontWeight: '800', color: '#64748B', marginLeft: 8 },
    hintText: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginTop: 4, marginLeft: 4 },

    variantSection: { marginTop: 24, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
    variantTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
    variantSubLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8 },
    sizeChipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    sizeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
    sizeChipActive: { backgroundColor: '#0D9488', borderColor: '#0D9488' },
    sizeChipText: { fontSize: 13, fontWeight: '800', color: '#64748B' },
    sizeChipTextActive: { color: '#FFF' },
    colorInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    addColorBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#0D9488', justifyContent: 'center', alignItems: 'center' },
    colorChipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    colorChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDFA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#CCFBF1' },
    colorChipText: { fontSize: 12, fontWeight: '700', color: '#0D9488' },
});

export default SellerDashboard;
