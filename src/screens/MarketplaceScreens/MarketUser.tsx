import React, { useState, useEffect } from 'react';
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
    Modal,
    TextInput as RNTextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { get, post, put, del } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import CustomHeader from '../../components/common/CustomHeader';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const MarketUser = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('personal');
    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newAddress, setNewAddress] = useState({
        type: 'Home',
        fullAddress: '',
        phone: user?.phone || '',
        isDefault: false
    });

    const [isSellerModalVisible, setIsSellerModalVisible] = useState(false);
    const [isSubmittingSeller, setIsSubmittingSeller] = useState(false);
    const [sellerFormData, setSellerFormData] = useState({
        businessName: '',
        businessType: '',
        businessAddress: '',
        websiteUrl: '',
        facebookUrl: '',
        instagramUrl: '',
        tradeLicense: '',
        bankAccountNumber: '',
        bankName: '',
        mobilePaymentNumber: '',
        mobilePaymentProvider: 'bKash',
    });

    const { data: orders = [], isLoading: ordersLoading } = useQuery({
        queryKey: ['user-orders', user?._id],
        queryFn: () => get<any>(`/user-all/orders/${user?._id}`).then(res => res.orders || []),
        enabled: !!user?._id
    });

    const { data: pendingOrders = [], isLoading: pendingLoading } = useQuery({
        queryKey: ['user-pending-orders', user?._id],
        queryFn: () => get<any>(`/payments/pending/${user?._id}`).then(res => res.orders || []),
        enabled: !!user?._id
    });

    const { data: addresses = [], isLoading: addressesLoading, refetch: refetchAddresses } = useQuery({
        queryKey: ['user-addresses', user?._id],
        queryFn: () => get<any>(`/addresses/${user?._id}`).then(res => res.addresses || []),
        enabled: !!user?._id
    });

    const { data: sellerRequest, refetch: refetchSellerRequest } = useQuery({
        queryKey: ['seller-request', user?._id],
        queryFn: () => get<any>(`/seller-request/${user?._id}`).then(res => res.request || null),
        enabled: !!user?._id
    });

    const businessTypes = [
        "Electronics", "Fashion & Clothing", "Grocery & Food", "Home & Kitchen",
        "Health & Beauty", "Sports & Outdoor", "Books & Education", "Automotive",
        "Toys & Games", "Jewelry & Accessories", "Other",
    ];

    const paymentProviders = ["bKash", "Nagad", "Rocket"];

    const tabs = [
        { id: 'personal', label: 'Profile', icon: 'person' },
        { id: 'orders', label: 'Orders', icon: 'cart' },
        { id: 'pending', label: 'Pending', icon: 'time' },
        { id: 'addresses', label: 'Places', icon: 'location' },
        { id: 'seller', label: 'Seller', icon: 'storefront' },
    ];

    const handleSaveAddress = async () => {
        if (!newAddress.fullAddress || !newAddress.phone) {
            Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please fill all required fields' });
            return;
        }

        try {
            setIsSaving(true);
            const res = await post<any>('/addresses', {
                addressData: {
                    userId: user?._id,
                    ...newAddress
                }
            });
            if (res.success) {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Address added successfully' });
                setIsAddressModalVisible(false);
                setNewAddress({ type: 'Home', fullAddress: '', phone: user?.phone || '', isDefault: false });
                refetchAddresses();
            }
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to add address' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSellerSubmit = async () => {
        if (!sellerFormData.businessName || !sellerFormData.businessType || !sellerFormData.businessAddress) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please fill all required business details' });
            return;
        }

        try {
            setIsSubmittingSeller(true);
            const res = await post<any>('/market-seller-request', {
                sellerData: {
                    ...sellerFormData,
                    userInfo: {
                        name: user?.name,
                        email: user?.email,
                        phone: user?.userName || user?.phone, // Using userName/phone as fallback
                        profileImage: user?.profileImage
                    }
                }
            });

            // Server returns 201 for success based on web code (res.status === 201)
            // But our `post` wrapper usually handles the status. Let's assume standard response.
            Toast.show({ type: 'success', text1: 'Submitted!', text2: 'Your seller request is pending review.' });
            setIsSellerModalVisible(false);
            refetchSellerRequest();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Failed', text2: error.message || 'Submission failed' });
        } finally {
            setIsSubmittingSeller(false);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'personal':
                return renderPersonalInfo();
            case 'orders':
                return renderOrders();
            case 'pending':
                return renderPendingOrders();
            case 'addresses':
                return renderAddresses();
            case 'seller':
                return renderSellerSection();
            default:
                return renderPersonalInfo();
        }
    };

    const renderPersonalInfo = () => (
        <View style={styles.tabContent}>
            {/* Profile Header Card */}
            <View style={[styles.profileCard, isDark && styles.cardDark]}>
                <LinearGradient
                    colors={['#0D9488', '#0F766E', '#134E4A']}
                    style={styles.profileHeaderGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <View style={styles.profileInfoWrapper}>
                    <View style={styles.imageContainer}>
                        {user?.profileImage ? (
                            <Image source={{ uri: user.profileImage }} style={styles.profilePic} />
                        ) : (
                            <View style={styles.placeholderPic}>
                                <Ionicons name="person" size={40} color="#94A3B8" />
                            </View>
                        )}
                        {user?.verified && (
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                            </View>
                        )}
                    </View>
                    <View style={styles.nameSection}>
                        <Text style={[styles.userName, isDark && styles.textLight]}>{user?.name || 'Anonymous'}</Text>
                        <Text style={styles.userRole}>{user?.work || 'Member'}</Text>
                        <View style={styles.studiesRow}>
                            <Ionicons name="school-outline" size={14} color="#64748B" />
                            <Text style={styles.userStudies}>{user?.studies || 'Not specified'}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.statsRow, isDark && { borderTopColor: '#334155' }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, isDark && styles.statValueDark]}>{orders.filter((o: any) => o.orderStatus === 'delivered').length}</Text>
                        <Text style={styles.statLabel}>Orders</Text>
                    </View>
                    <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, isDark && styles.statValueDark]}>{(user?.flyWallet || 0).toFixed(2)}</Text>
                        <Text style={styles.statLabel}>Points</Text>
                    </View>
                    <View style={[styles.statDivider, isDark && styles.statDividerDark]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, isDark && styles.statValueDark]}>{addresses.length}</Text>
                        <Text style={styles.statLabel}>Places</Text>
                    </View>
                </View>
            </View>

            {/* Contact Details */}
            <View style={[styles.detailSection, isDark && styles.cardDark]}>
                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Contact Information</Text>
                <View style={styles.infoRow}>
                    <View style={[styles.infoIconBox, isDark && styles.infoIconBoxDark]}>
                        <Ionicons name="mail-outline" size={18} color="#0D9488" />
                    </View>
                    <View style={styles.infoTexts}>
                        <Text style={styles.infoLabel}>Email Address</Text>
                        <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{user?.email}</Text>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <View style={[styles.infoIconBox, isDark && styles.infoIconBoxDark]}>
                        <Ionicons name="call-outline" size={18} color="#0D9488" />
                    </View>
                    <View style={styles.infoTexts}>
                        <Text style={styles.infoLabel}>Phone Number</Text>
                        <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{user?.phone || 'Not provided'}</Text>
                    </View>
                </View>
            </View>

            {/* Location Details */}
            <View style={[styles.detailSection, isDark && styles.cardDark]}>
                <Text style={[styles.sectionTitle, isDark && styles.textLight]}>Location Details</Text>
                <View style={styles.infoRow}>
                    <View style={[styles.infoIconBox, isDark && styles.infoIconBoxDark]}>
                        <Ionicons name="home-outline" size={18} color="#0D9488" />
                    </View>
                    <View style={styles.infoTexts}>
                        <Text style={styles.infoLabel}>Current City</Text>
                        <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{user?.currentCity || 'Not specified'}</Text>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <View style={[styles.infoIconBox, isDark && styles.infoIconBoxDark]}>
                        <Ionicons name="location-outline" size={18} color="#0D9488" />
                    </View>
                    <View style={styles.infoTexts}>
                        <Text style={styles.infoLabel}>Hometown</Text>
                        <Text style={[styles.infoValue, isDark && styles.infoValueDark]}>{user?.hometown || 'Not specified'}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderOrders = () => (
        <View style={styles.tabContent}>
            {ordersLoading ? (
                <ActivityIndicator color="#0D9488" style={{ marginTop: 40 }} />
            ) : orders.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="cart-outline" size={64} color={isDark ? "#1e293b" : "#E2E8F0"} />
                    <Text style={[styles.emptyTitle, isDark && styles.textLight]}>No Orders Yet</Text>
                    <Text style={[styles.emptyDesc, isDark && { color: '#64748B' }]}>Your Marketplace purchases will appear here.</Text>
                </View>
            ) : (
                orders.map((order: any) => (
                    <TouchableOpacity
                        key={order._id}
                        style={[styles.orderCard, isDark && styles.cardDark]}
                        activeOpacity={0.7}
                    >
                        <View style={styles.orderHeader}>
                            <View>
                                <Text style={[styles.orderId, isDark && styles.orderIdDark]}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                                <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: order.orderStatus === 'delivered' ? '#DCFCE7' : '#FEF3C7' }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: order.orderStatus === 'delivered' ? '#166534' : '#92400E' }
                                ]}>
                                    {order.orderStatus.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.orderItemsPreview}>
                            {order.items.slice(0, 3).map((item: any, idx: number) => (
                                <Image key={idx} source={{ uri: item.image || item.images?.[0] }} style={styles.itemThumb} />
                            ))}
                            {order.items.length > 3 && (
                                <View style={styles.moreItemsThumb}>
                                    <Text style={styles.moreItemsText}>+{order.items.length - 3}</Text>
                                </View>
                            )}
                        </View>
                        <View style={[styles.orderFooter, isDark && styles.orderFooterDark]}>
                            <Text style={styles.orderTotalLabel}>Total Amount</Text>
                            <Text style={[styles.orderTotalValue, isDark && styles.textLight]}>৳{order.totalAmount.toLocaleString()}</Text>
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </View>
    );

    const renderPendingOrders = () => (
        <View style={styles.tabContent}>
            {pendingLoading ? (
                <ActivityIndicator color="#0D9488" style={{ marginTop: 40 }} />
            ) : pendingOrders.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="time-outline" size={64} color={isDark ? "#1e293b" : "#E2E8F0"} />
                    <Text style={[styles.emptyTitle, isDark && styles.textLight]}>No Pending Orders</Text>
                    <Text style={[styles.emptyDesc, isDark && { color: '#64748B' }]}>All your orders are processed. Keep shopping!</Text>
                </View>
            ) : (
                pendingOrders.map((order: any) => (
                    <TouchableOpacity
                        key={order._id}
                        style={[styles.orderCard, isDark && styles.cardDark]}
                        activeOpacity={0.7}
                    >
                        <View style={styles.orderHeader}>
                            <View>
                                <Text style={[styles.orderId, isDark && styles.orderIdDark]}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                                <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
                                <Text style={[styles.statusText, { color: '#92400E' }]}>PENDING</Text>
                            </View>
                        </View>
                        <View style={styles.orderItemsPreview}>
                            {order.items.slice(0, 3).map((item: any, idx: number) => (
                                <Image key={idx} source={{ uri: item.image || item.images?.[0] }} style={styles.itemThumb} />
                            ))}
                            {order.items.length > 3 && (
                                <View style={styles.moreItemsThumb}>
                                    <Text style={styles.moreItemsText}>+{order.items.length - 3}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.orderFooter}>
                            <TouchableOpacity
                                style={[styles.completePaymentBtn, isDark && { backgroundColor: '#134E4A' }]}
                                onPress={() => Toast.show({ type: 'info', text1: 'Payment', text2: 'Please use the web version to complete payment for now.' })}
                            >
                                <Text style={styles.completePaymentText}>Complete Payment</Text>
                            </TouchableOpacity>
                            <Text style={[styles.orderTotalValue, isDark && styles.textLight]}>৳{order.totalAmount.toLocaleString()}</Text>
                        </View>
                    </TouchableOpacity>
                ))
            )}
        </View>
    );
    const renderAddresses = () => (
        <View style={styles.tabContent}>
            <TouchableOpacity
                style={styles.addAddressBtn}
                activeOpacity={0.8}
                onPress={() => setIsAddressModalVisible(true)}
            >
                <Ionicons name="add" size={24} color="#FFF" />
                <Text style={styles.addAddressText}>Add New Address</Text>
            </TouchableOpacity>

            {addressesLoading ? (
                <ActivityIndicator color="#0D9488" style={{ marginTop: 20 }} />
            ) : addresses.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="location-outline" size={64} color={isDark ? "#1e293b" : "#E2E8F0"} />
                    <Text style={[styles.emptyTitle, isDark && styles.textLight]}>No Saved Places</Text>
                    <Text style={[styles.emptyDesc, isDark && { color: '#64748B' }]}>Add addresses for faster checkout.</Text>
                </View>
            ) : (
                addresses.map((addr: any) => (
                    <View key={addr._id} style={[styles.addressCard, isDark && styles.cardDark]}>
                        <View style={[styles.addressIconCircle, isDark && styles.addressIconCircleDark]}>
                            <Ionicons
                                name={addr.type.toLowerCase() === 'home' ? 'home' : addr.type.toLowerCase() === 'office' ? 'briefcase' : 'location'}
                                size={18}
                                color="#0D9488"
                            />
                        </View>
                        <View style={styles.addressDetails}>
                            <View style={styles.addressHeader}>
                                <Text style={[styles.addressTypeText, isDark && styles.textLight]}>{addr.type}</Text>
                                {addr.isDefault && <Text style={styles.defaultLabel}>Default</Text>}
                            </View>
                            <Text style={styles.addressLongText} numberOfLines={2}>{addr.fullAddress}</Text>
                            <Text style={styles.addressPhoneText}>{addr.phone}</Text>
                        </View>
                        <TouchableOpacity style={styles.addressActionBtn}>
                            <Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </View>
    );

    const renderSellerSection = () => (
        <View style={styles.tabContent}>
            <View style={[styles.sellerCard, isDark && styles.cardDark]}>
                <View style={styles.sellerHeader}>
                    <View style={[styles.sellerIconCircle, isDark && styles.sellerIconCircleDark]}>
                        <Ionicons name="storefront" size={32} color="#0D9488" />
                    </View>
                    <Text style={[styles.sellerTitle, isDark && styles.textLight]}>Sell on FlyBook</Text>
                </View>
                <Text style={styles.sellerDesc}>
                    Reach thousands of customers and grow your business by becoming a verified seller on our marketplace.
                </Text>

                {sellerRequest ? (
                    <View style={[styles.sellerStatusBox, isDark && { backgroundColor: '#0f172a' }, { borderLeftColor: sellerRequest.status === 'Approved' ? '#10B981' : '#F59E0B' }]}>
                        <Text style={styles.sellerStatusLabel}>Request Status</Text>
                        <Text style={[styles.sellerStatusValue, { color: sellerRequest.status === 'Approved' ? '#10B981' : '#F59E0B' }]}>
                            {sellerRequest.status}
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.applySellerBtn}
                        activeOpacity={0.8}
                        onPress={() => setIsSellerModalVisible(true)}
                    >
                        <Text style={styles.applySellerText}>Apply to Become Seller</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFF" />
                    </TouchableOpacity>
                )}

                <View style={styles.sellerBenefits}>
                    <View style={[styles.benefitItem, isDark && { backgroundColor: '#0f172a' }]}>
                        <Ionicons name="flash-outline" size={16} color="#0D9488" />
                        <Text style={[styles.benefitText, isDark && { color: '#94A3B8' }]}>Fast Payouts</Text>
                    </View>
                    <View style={[styles.benefitItem, isDark && { backgroundColor: '#0f172a' }]}>
                        <Ionicons name="shield-checkmark-outline" size={16} color="#0D9488" />
                        <Text style={[styles.benefitText, isDark && { color: '#94A3B8' }]}>Secure Platform</Text>
                    </View>
                    <View style={[styles.benefitItem, isDark && { backgroundColor: '#0f172a' }]}>
                        <Ionicons name="people-outline" size={16} color="#0D9488" />
                        <Text style={[styles.benefitText, isDark && { color: '#94A3B8' }]}>Wide Reach</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <CustomHeader title="Marketplace Profile" />

            {/* Sub-Tabs */}
            <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.tabItem,
                                activeTab === tab.id && (isDark ? { backgroundColor: '#134E4A' } : styles.activeTabItem),
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

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {renderTabContent()}
            </ScrollView>

            {/* Seller Request Modal */}
            <Modal
                visible={isSellerModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsSellerModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setIsSellerModalVisible(false)} />
                    <View style={[styles.modalContent, styles.sellerModalContent, isDark && styles.modalContentDark]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, isDark && styles.textLight]}>Seller Application</Text>
                                <Text style={styles.modalSubTitle}>Grow your business with FlyBook</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsSellerModalVisible(false)}>
                                <Ionicons name="close" size={24} color={isDark ? "#94A3B8" : "#475569"} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalFormScroll}>
                            {/* Business Section */}
                            <View style={styles.formSection}>
                                <Text style={styles.formSectionTitle}>Business Details</Text>

                                <Text style={styles.inputLabel}>Business Name *</Text>
                                <View style={[styles.modalInputWrapper, isDark && styles.inputDark]}>
                                    <Ionicons name="business-outline" size={18} color="#94A3B8" />
                                    <RNTextInput
                                        style={[styles.modalInput, isDark && styles.textLight]}
                                        placeholder="e.g., Fly Gadgets Store"
                                        placeholderTextColor="#94A3B8"
                                        value={sellerFormData.businessName}
                                        onChangeText={(text) => setSellerFormData({ ...sellerFormData, businessName: text })}
                                    />
                                </View>

                                <Text style={styles.inputLabel}>Category *</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                                    {businessTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[
                                                styles.typeBtn,
                                                isDark && styles.typeBtnDark,
                                                sellerFormData.businessType === type && (isDark ? styles.typeBtnActiveDark : styles.typeBtnActive),
                                                { width: undefined, paddingHorizontal: 20, marginRight: 8 }
                                            ]}
                                            onPress={() => setSellerFormData({ ...sellerFormData, businessType: type })}
                                        >
                                            <Text style={[styles.typeBtnText, sellerFormData.businessType === type && styles.typeBtnTextActive]}>{type}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <Text style={styles.inputLabel}>Full Address *</Text>
                                <View style={[styles.modalInputWrapper, isDark && styles.inputDark, { height: 80 }]}>
                                    <RNTextInput
                                        style={[styles.modalInput, isDark && styles.textLight, { textAlignVertical: 'top', paddingTop: 12 }]}
                                        placeholder="Business physical address"
                                        placeholderTextColor="#94A3B8"
                                        multiline
                                        value={sellerFormData.businessAddress}
                                        onChangeText={(text) => setSellerFormData({ ...sellerFormData, businessAddress: text })}
                                    />
                                </View>
                            </View>

                            {/* Social Section */}
                            <View style={styles.formSection}>
                                <Text style={styles.formSectionTitle}>Online Presence</Text>
                                <Text style={styles.inputLabel}>Website URL</Text>
                                <View style={[styles.modalInputWrapper, isDark && styles.inputDark]}>
                                    <Ionicons name="globe-outline" size={18} color="#94A3B8" />
                                    <RNTextInput
                                        style={[styles.modalInput, isDark && styles.textLight]}
                                        placeholder="https://..."
                                        placeholderTextColor="#94A3B8"
                                        value={sellerFormData.websiteUrl}
                                        onChangeText={(text) => setSellerFormData({ ...sellerFormData, websiteUrl: text })}
                                    />
                                </View>
                                <Text style={styles.inputLabel}>Facebook Page</Text>
                                <View style={[styles.modalInputWrapper, isDark && styles.inputDark]}>
                                    <Ionicons name="logo-facebook" size={18} color="#94A3B8" />
                                    <RNTextInput
                                        style={[styles.modalInput, isDark && styles.textLight]}
                                        placeholder="Facebook link"
                                        placeholderTextColor="#94A3B8"
                                        value={sellerFormData.facebookUrl}
                                        onChangeText={(text) => setSellerFormData({ ...sellerFormData, facebookUrl: text })}
                                    />
                                </View>
                            </View>

                            {/* Financial Section */}
                            <View style={styles.formSection}>
                                <Text style={styles.formSectionTitle}>Financial Details</Text>
                                <Text style={styles.inputLabel}>Mobile Payment Provider</Text>
                                <View style={styles.typeSelector}>
                                    {paymentProviders.map((p) => (
                                        <TouchableOpacity
                                            key={p}
                                            style={[
                                                styles.typeBtn,
                                                isDark && styles.typeBtnDark,
                                                sellerFormData.mobilePaymentProvider === p && (isDark ? styles.typeBtnActiveDark : styles.typeBtnActive)
                                            ]}
                                            onPress={() => setSellerFormData({ ...sellerFormData, mobilePaymentProvider: p })}
                                        >
                                            <Text style={[styles.typeBtnText, sellerFormData.mobilePaymentProvider === p && styles.typeBtnTextActive]}>{p}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <Text style={styles.inputLabel}>Payment Number</Text>
                                <View style={[styles.modalInputWrapper, isDark && styles.inputDark]}>
                                    <Ionicons name="phone-portrait-outline" size={18} color="#94A3B8" />
                                    <RNTextInput
                                        style={[styles.modalInput, isDark && styles.textLight]}
                                        placeholder="bKash/Nagad number"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="phone-pad"
                                        value={sellerFormData.mobilePaymentNumber}
                                        onChangeText={(text) => setSellerFormData({ ...sellerFormData, mobilePaymentNumber: text })}
                                    />
                                </View>
                                <Text style={styles.inputLabel}>Bank Account & Name (Optional)</Text>
                                <View style={[styles.modalInputWrapper, isDark && styles.inputDark, { marginBottom: 12 }]}>
                                    <RNTextInput
                                        style={[styles.modalInput, isDark && styles.textLight]}
                                        placeholder="Account Number"
                                        placeholderTextColor="#94A3B8"
                                        value={sellerFormData.bankAccountNumber}
                                        onChangeText={(text) => setSellerFormData({ ...sellerFormData, bankAccountNumber: text })}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveAddressBtn, isSubmittingSeller && { opacity: 0.7 }]}
                                onPress={handleSellerSubmit}
                                disabled={isSubmittingSeller}
                            >
                                {isSubmittingSeller ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.saveAddressText}>Submit Application</Text>
                                )}
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Address Form Modal */}
            <Modal
                visible={isAddressModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsAddressModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity
                        style={styles.modalDismiss}
                        activeOpacity={1}
                        onPress={() => setIsAddressModalVisible(false)}
                    />
                    <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && styles.textLight]}>Add New Place</Text>
                            <TouchableOpacity onPress={() => setIsAddressModalVisible(false)}>
                                <Ionicons name="close" size={24} color={isDark ? "#94A3B8" : "#475569"} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Label</Text>
                        <View style={styles.typeSelector}>
                            {['Home', 'Office', 'Other'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeBtn,
                                        isDark && styles.typeBtnDark,
                                        newAddress.type === type && (isDark ? styles.typeBtnActiveDark : styles.typeBtnActive)
                                    ]}
                                    onPress={() => setNewAddress({ ...newAddress, type })}
                                >
                                    <Text style={[
                                        styles.typeBtnText,
                                        newAddress.type === type && styles.typeBtnTextActive
                                    ]}>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <View style={[styles.modalInputWrapper, isDark && styles.inputDark]}>
                            <Ionicons name="call-outline" size={18} color="#94A3B8" />
                            <RNTextInput
                                style={[styles.modalInput, isDark && styles.textLight]}
                                placeholder="01XXX-XXXXXX"
                                placeholderTextColor="#94A3B8"
                                keyboardType="phone-pad"
                                value={newAddress.phone}
                                onChangeText={(text) => setNewAddress({ ...newAddress, phone: text })}
                            />
                        </View>

                        <Text style={styles.inputLabel}>Full Address</Text>
                        <View style={[styles.modalInputWrapper, isDark && styles.inputDark, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
                            <Ionicons name="map-outline" size={18} color="#94A3B8" style={{ marginTop: 2 }} />
                            <RNTextInput
                                style={[styles.modalInput, isDark && styles.textLight, { height: 80, textAlignVertical: 'top' }]}
                                placeholder="House, Road, Area..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                value={newAddress.fullAddress}
                                onChangeText={(text) => setNewAddress({ ...newAddress, fullAddress: text })}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.defaultToggleRow}
                            onPress={() => setNewAddress({ ...newAddress, isDefault: !newAddress.isDefault })}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, newAddress.isDefault && styles.checkboxActive, isDark && styles.checkboxDark]}>
                                {newAddress.isDefault && <Ionicons name="checkmark" size={14} color="#FFF" />}
                            </View>
                            <Text style={[styles.defaultToggleText, isDark && styles.textLight]}>Set as default shipping address</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveAddressBtn, isSaving && { opacity: 0.7 }]}
                            onPress={handleSaveAddress}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveAddressText}>Save Address</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    containerDark: { backgroundColor: '#0f172a' },
    textLight: { color: '#F8FAFC' },
    scrollContent: { padding: 16 },

    tabBar: { backgroundColor: '#FFF', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    tabBarDark: { backgroundColor: '#1e293b', borderBottomColor: '#334155' },
    tabScroll: { paddingHorizontal: 12, gap: 8 },
    tabItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 8, backgroundColor: 'transparent' },
    activeTabItem: { backgroundColor: '#F0FDFA' },
    tabLabel: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    activeTabLabel: { color: '#0D9488' },

    tabContent: { flex: 1 },

    profileCard: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden', marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    cardDark: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1 },
    profileHeaderGradient: { height: 70 },
    profileInfoWrapper: { flexDirection: 'row', paddingHorizontal: 20, marginTop: -35, gap: 16, alignItems: 'flex-end' },
    imageContainer: { width: 90, height: 90, borderRadius: 25, backgroundColor: '#FFF', padding: 4, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
    profilePic: { width: '100%', height: '100%', borderRadius: 22 },
    placeholderPic: { width: '100%', height: '100%', borderRadius: 22, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    verifiedBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#FFF', borderRadius: 12, padding: 2 },
    nameSection: { flex: 1, paddingBottom: 5 },
    userName: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
    userRole: { fontSize: 13, color: '#0D9488', fontWeight: '700' },
    studiesRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    userStudies: { fontSize: 11, color: '#64748B', fontWeight: '500' },

    statsRow: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 15 },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
    statValueDark: { color: '#F8FAFC' },
    statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
    statDivider: { width: 1, backgroundColor: '#F1F5F9' },
    statDividerDark: { backgroundColor: '#334155' },

    detailSection: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 16, letterSpacing: -0.2 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    infoIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center' },
    infoIconBoxDark: { backgroundColor: '#134E4A' },
    infoTexts: { flex: 1 },
    infoLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    infoValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    infoValueDark: { color: '#F8FAFC' },

    orderCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 12 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    orderId: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    orderIdDark: { color: '#F1F5F9' },
    orderDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '800' },
    orderItemsPreview: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    itemThumb: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9' },
    moreItemsThumb: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    moreItemsText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
    orderFooter: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderFooterDark: { borderTopColor: '#334155' },
    orderTotalLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    orderTotalValue: { fontSize: 16, fontWeight: '900', color: '#0D9488' },

    addAddressBtn: { backgroundColor: '#0D9488', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 18, marginBottom: 16, elevation: 4, shadowColor: '#0D9488', shadowOpacity: 0.2, shadowRadius: 10 },
    addAddressText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    addressCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
    addressIconCircle: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center' },
    addressIconCircleDark: { backgroundColor: '#134E4A' },
    addressDetails: { flex: 1 },
    addressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    addressTypeText: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    defaultLabel: { backgroundColor: '#F0FDFA', color: '#0D9488', fontSize: 9, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, textTransform: 'uppercase' },
    addressLongText: { fontSize: 13, color: '#64748B', lineHeight: 18 },
    addressPhoneText: { fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '500' },
    addressActionBtn: { padding: 4 },

    sellerCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, marginBottom: 16 },
    sellerHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    sellerIconCircle: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center' },
    sellerIconCircleDark: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
    sellerTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B', letterSpacing: -0.5 },
    sellerDesc: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 24, fontWeight: '500' },
    sellerStatusBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderLeftWidth: 4, marginBottom: 24 },
    sellerStatusLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
    sellerStatusValue: { fontSize: 18, fontWeight: '900' },
    applySellerBtn: { backgroundColor: '#0D9488', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 20, marginBottom: 24 },
    applySellerText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    sellerBenefits: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    benefitItem: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 14 },
    benefitText: { fontSize: 10, fontWeight: '800', color: '#475569', textAlign: 'center' },

    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginTop: 16 },
    emptyDesc: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },

    completePaymentBtn: { backgroundColor: '#F0FDFA', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#0D9488' },
    completePaymentText: { color: '#0D9488', fontSize: 12, fontWeight: '800' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalDismiss: { flex: 1 },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
    modalContentDark: { backgroundColor: '#1e293b' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    inputLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8, marginTop: 16 },
    typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: 'transparent' },
    typeBtnDark: { backgroundColor: '#0f172a', borderColor: '#334155' },
    typeBtnActive: { backgroundColor: '#F0FDFA', borderColor: '#0D9488' },
    typeBtnActiveDark: { backgroundColor: '#134E4A', borderColor: '#0D9488' },
    typeBtnText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
    typeBtnTextActive: { color: '#0D9488' },
    modalInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, height: 56, gap: 12 },
    inputDark: { backgroundColor: '#0f172a', borderColor: '#334155' },
    modalInput: { flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '600' },
    saveAddressBtn: { backgroundColor: '#0D9488', height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 32, elevation: 4, shadowColor: '#0D9488', shadowOpacity: 0.3, shadowRadius: 10 },
    saveAddressText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

    defaultToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },
    checkboxActive: { backgroundColor: '#0D9488', borderColor: '#0D9488' },
    checkboxDark: { borderColor: '#475569' },
    defaultToggleText: { fontSize: 14, fontWeight: '600', color: '#475569' },

    // Seller Modal Specific
    sellerModalContent: { height: '90%' },
    modalSubTitle: { fontSize: 12, color: '#94A3B8', fontWeight: '500', marginTop: 2 },
    modalFormScroll: { flex: 1, marginTop: 10 },
    formSection: { marginBottom: 24 },
    formSectionTitle: { fontSize: 16, fontWeight: '800', color: '#0D9488', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 },
});

export default MarketUser;
