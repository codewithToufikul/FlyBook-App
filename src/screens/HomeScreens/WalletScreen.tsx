import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    TextInput,
    RefreshControl,
    Alert,
    Dimensions,
    Platform,
    StatusBar,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { get, post } from '../../services/api';
import CustomHeader from '../../components/common/CustomHeader';
import LinearGradient from 'react-native-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import QRCode from 'react-native-qrcode-svg';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';

const { width, height } = Dimensions.get('window');

interface WithdrawHistory {
    _id: string;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
    methodDetails?: any;
}

interface TransferHistory {
    _id: string;
    senderUsername: string;
    receiverUsername: string;
    amount: number;
    date: string;
    time: string;
    timestamp: string;
}

const WalletScreen = () => {
    const { user, refreshUser } = useAuth();
    const { isDark } = useTheme();
    const queryClient = useQueryClient();
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [historyTab, setHistoryTab] = useState<'cash' | 'points'>('cash');

    // Camera/QR Scanner State
    const { hasPermission, requestPermission } = useCameraPermission();
    const [showScanner, setShowScanner] = useState(false);
    const device = useCameraDevice('back');

    const codeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned: (codes) => {
            if (codes.length > 0 && showScanner) {
                const scannedValue = codes[0].value;
                if (scannedValue) {
                    setReceiverUsernamePoints(scannedValue);
                    setShowScanner(false);
                    Toast.show({
                        type: 'success',
                        text1: 'QR Scanned',
                        text2: `Username: ${scannedValue}`,
                    });
                }
            }
        }
    });

    const handleOpenScanner = async () => {
        if (!hasPermission) {
            const granted = await requestPermission();
            if (!granted) {
                Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes');
                return;
            }
        }
        setShowScanner(true);
    };

    // Points Transfer Modal State
    const [pointTransferModalVisible, setPointTransferModalVisible] = useState(false);
    const [showMyQR, setShowMyQR] = useState(false);
    const [pointTransferAmount, setPointTransferAmount] = useState('');
    const [receiverUsernamePoints, setReceiverUsernamePoints] = useState('');
    const [isSubmittingPointTransfer, setIsSubmittingPointTransfer] = useState(false);

    // Cash Withdraw Modal State
    const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Bank'>('bKash');
    const [phoneNumber, setPhoneNumber] = useState('');
    // Bank specific states
    const [bankName, setBankName] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [branchName, setBranchName] = useState('');
    const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

    // Fetch Withdraw History
    const { data: history, isLoading: loadingHistory, refetch: refetchHistory } = useQuery({
        queryKey: ['withdraw-history'],
        queryFn: async () => {
            const response = await get<{ success: boolean; history: WithdrawHistory[] }>('/user-withdraw-history');
            return response?.history || [];
        },
    });

    // Fetch Point Transfer History
    const { data: pointsHistory, isLoading: loadingPoints, refetch: refetchPoints } = useQuery({
        queryKey: ['points-history'],
        queryFn: async () => {
            const response = await get<{ success: boolean; data: TransferHistory[] }>('/api/transfer-history');
            return response?.data || [];
        },
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refreshUser(), refetchHistory(), refetchPoints()]);
        setRefreshing(false);
    };

    const handleWithdrawSubmit = async () => {
        if (!withdrawAmount || Number(withdrawAmount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        if (Number(withdrawAmount) > (user?.wallet || 0)) {
            Alert.alert('Error', 'Insufficient Wallet (Cash) balance');
            return;
        }

        let methodDetails: any = {};

        if (withdrawMethod === 'Bank') {
            if (!bankName || !accountName || !accountNumber || !branchName) {
                Alert.alert('Error', 'Please fill all bank details');
                return;
            }
            methodDetails = { bankName, accountName, accountNumber, branchName };
        } else {
            if (!phoneNumber || phoneNumber.length !== 11) {
                Alert.alert('Error', 'Please enter a valid 11-digit phone number');
                return;
            }
            methodDetails = { phoneNumber };
        }

        setIsSubmittingWithdraw(true);
        try {
            const response = await post<{ success: boolean; message: string }>('/user-withdraw', {
                amount: Number(withdrawAmount),
                method: withdrawMethod,
                methodDetails: methodDetails,
            });

            if (response?.success) {
                Alert.alert('Success', 'Cash withdrawal request submitted successfully!');
                setWithdrawModalVisible(false);
                setWithdrawAmount('');
                setPhoneNumber('');
                setBankName('');
                setAccountName('');
                setAccountNumber('');
                setBranchName('');
                onRefresh();
            } else {
                Alert.alert('Error', response?.message || 'Failed to submit request');
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred. Please try again.');
        } finally {
            setIsSubmittingWithdraw(false);
        }
    };

    const handlePointTransferSubmit = async () => {
        if (!pointTransferAmount || Number(pointTransferAmount) <= 0) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        if (Number(pointTransferAmount) > (user?.flyWallet || 0)) {
            Alert.alert('Error', 'Insufficient FlyWallet (Points) balance');
            return;
        }

        if (!receiverUsernamePoints.trim()) {
            Alert.alert('Error', 'Please enter receiver username');
            return;
        }

        setIsSubmittingPointTransfer(true);
        try {
            const response = await post<{ success: boolean; message: string }>('/api/transfer-coins', {
                amount: Number(pointTransferAmount),
                receiverUsername: receiverUsernamePoints.trim(),
                walletType: 'flyWallet'
            });

            if (response?.success) {
                Alert.alert('Success', 'Points transferred successfully!');
                setPointTransferModalVisible(false);
                setPointTransferAmount('');
                setReceiverUsernamePoints('');
                onRefresh();
            } else {
                Alert.alert('Error', response?.message || 'Transfer failed');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'An error occurred');
        } finally {
            setIsSubmittingPointTransfer(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return '#10B981';
            case 'rejected': return '#EF4444';
            case 'pending': return '#F59E0B';
            default: return '#64748B';
        }
    };

    const renderHeader = () => (
        <View style={styles.premiumHeader}>
            <View style={styles.headerTopRow}>
                <View>
                    <Text style={[styles.welcomeText, isDark && { color: '#94A3B8' }]}>Welcome back,</Text>
                    <Text style={[styles.nameText, isDark && { color: '#F1F5F9' }]}>{user?.name || 'User'}</Text>
                </View>
                <TouchableOpacity onPress={() => (navigation.navigate as any)('Profile')} style={styles.avatarBtn}>
                    <Image source={{ uri: user?.profileImage || 'https://via.placeholder.com/150' }} style={styles.avatar} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0F172A' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

            <CustomHeader title="My Wallet" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
                }
            >
                {renderHeader()}

                {/* FlyWallet (Points) Visual Enhancement */}
                <View style={styles.cardContainer}>
                    <LinearGradient
                        colors={['#6366F1', '#4F46E5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.mainWalletCard}
                    >
                        <View style={styles.glassEffectMask} />
                        <View style={styles.cardInfo}>
                            <View style={styles.cardHeaderRow}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="gift" size={20} color="#6366F1" />
                                </View>
                                <Text style={styles.cardTitleText}>FlyWallet Points</Text>
                            </View>
                            <View style={styles.balanceRow}>
                                <Text style={styles.currencySymbol}>PTS</Text>
                                <Text style={styles.mainBalanceText}>{Number(user?.flyWallet || 0).toFixed(2)}</Text>
                            </View>
                            <Text style={styles.subBalanceText}>Accumulated from activity</Text>
                        </View>

                        <View style={styles.quickActions}>
                            <TouchableOpacity style={styles.actionItem} onPress={() => setPointTransferModalVisible(true)}>
                                <View style={styles.actionIconBox}>
                                    <Ionicons name="send" size={18} color="#FFF" />
                                </View>
                                <Text style={styles.actionLabel}>Send</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionItem} onPress={() => (navigation.navigate as any)('WalletShop')}>
                                <View style={styles.actionIconBox}>
                                    <Ionicons name="storefront" size={18} color="#FFF" />
                                </View>
                                <Text style={styles.actionLabel}>Shops</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionItem} onPress={() => setShowMyQR(true)}>
                                <View style={styles.actionIconBox}>
                                    <Ionicons name="qr-code" size={18} color="#FFF" />
                                </View>
                                <Text style={styles.actionLabel}>Receive</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* Cash Wallet Card Enhancement */}
                <View style={[styles.cardContainer, { marginTop: 20 }]}>
                    <LinearGradient
                        colors={['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.secondaryWalletCard}
                    >
                        <View style={styles.glassOverlay} />
                        <View style={styles.secondaryCardInfo}>
                            <View style={styles.cardHeaderRow}>
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                                    <Ionicons name="card" size={20} color="#10B981" />
                                </View>
                                <Text style={styles.cardTitleText}>Cash Wallet</Text>
                            </View>
                            <View style={styles.balanceRow}>
                                <Text style={styles.currencySymbol}>৳</Text>
                                <Text style={styles.mainBalanceTextResponsive}>{Number(user?.wallet || 0).toFixed(2)}</Text>
                            </View>
                            {/* Tagline Added */}
                            <Text style={styles.taglineText}>Future Starts With You</Text>
                        </View>
                        <TouchableOpacity style={styles.withdrawBtn} onPress={() => setWithdrawModalVisible(true)}>
                            <Text style={styles.withdrawBtnText}>Withdraw</Text>
                            <Ionicons name="arrow-forward-circle" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

                {/* History Section Redesign */}
                <View style={styles.historySection}>
                    <Text style={[styles.sectionTitle, isDark && { color: '#F8FAFC' }]}>Recent Activity</Text>

                    <View style={[styles.customTabs, isDark && { backgroundColor: '#1E293B' }]}>
                        <TouchableOpacity
                            style={[styles.tabTrigger, historyTab === 'cash' && styles.activeTabTrigger]}
                            onPress={() => setHistoryTab('cash')}
                        >
                            <Text style={[styles.tabText, historyTab === 'cash' && styles.activeTabText, isDark && historyTab !== 'cash' && { color: '#64748B' }]}>Cash Withdraw</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabTrigger, historyTab === 'points' && styles.activeTabTrigger]}
                            onPress={() => setHistoryTab('points')}
                        >
                            <Text style={[styles.tabText, historyTab === 'points' && styles.activeTabText, isDark && historyTab !== 'points' && { color: '#64748B' }]}>Points Transfer</Text>
                        </TouchableOpacity>
                    </View>

                    {historyTab === 'cash' ? (
                        <View style={styles.historyList}>
                            {loadingHistory ? (
                                <ActivityIndicator size="small" color="#4F46E5" style={{ marginVertical: 30 }} />
                            ) : history?.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="receipt-outline" size={60} color={isDark ? '#334155' : '#E2E8F0'} />
                                    <Text style={[styles.emptyLabel, isDark && { color: '#64748B' }]}>No Withdrawal Requests</Text>
                                </View>
                            ) : (
                                history.map((item) => (
                                    <View key={item._id} style={[styles.premiumListItem, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                                        <View style={styles.listIconBox}>
                                            <View style={[styles.methodIcon, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                                <Ionicons name={item.method === 'Bank' ? 'business' : 'phone-portrait'} size={20} color={getStatusColor(item.status)} />
                                            </View>
                                        </View>
                                        <View style={styles.listContent}>
                                            <Text style={[styles.listTitle, isDark && { color: '#F1F5F9' }]}>{item.method} Withdraw</Text>
                                            <Text style={styles.listSubtitle}>
                                                {item.method === 'Bank' ? item.methodDetails?.accountNumber : item.methodDetails?.phoneNumber}
                                            </Text>
                                            <Text style={styles.listDate}>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                                        </View>
                                        <View style={styles.listAmount}>
                                            <Text style={[styles.amountVal, isDark && { color: '#F1F5F9' }]}>৳{item.amount}</Text>
                                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                                                <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    ) : (
                        <View style={styles.historyList}>
                            {loadingPoints ? (
                                <ActivityIndicator size="small" color="#4F46E5" style={{ marginVertical: 30 }} />
                            ) : pointsHistory?.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="swap-horizontal-outline" size={60} color={isDark ? '#334155' : '#E2E8F0'} />
                                    <Text style={[styles.emptyLabel, isDark && { color: '#64748B' }]}>No Transfer History</Text>
                                </View>
                            ) : (
                                pointsHistory.map((item) => {
                                    const isSender = item.senderUsername === user?.userName;
                                    return (
                                        <View key={item._id} style={[styles.premiumListItem, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                                            <View style={styles.listIconBox}>
                                                <View style={[styles.methodIcon, { backgroundColor: isSender ? '#FEE2E2' : '#D1FAE5' }]}>
                                                    <Ionicons name={isSender ? 'arrow-up-circle' : 'arrow-down-circle'} size={24} color={isSender ? '#EF4444' : '#10B981'} />
                                                </View>
                                            </View>
                                            <View style={styles.listContent}>
                                                <Text style={[styles.listTitle, isDark && { color: '#F1F5F9' }]}>
                                                    {isSender ? `@${item.receiverUsername}` : `@${item.senderUsername}`}
                                                </Text>
                                                <Text style={styles.listSubtitle}>{isSender ? 'Points Sent' : 'Points Received'}</Text>
                                                <Text style={styles.listDate}>{item.date} • {item.time}</Text>
                                            </View>
                                            <View style={styles.listAmount}>
                                                <Text style={[styles.amountVal, { color: isSender ? '#EF4444' : '#10B981' }]}>
                                                    {isSender ? '-' : '+'}{item.amount}
                                                </Text>
                                                <Text style={[styles.pointsLabel, { color: isSender ? '#EF4444' : '#10B981' }]}>PTS</Text>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    )}
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Withdraw Modal with Improved UI */}
            <Modal visible={withdrawModalVisible} transparent animationType="slide">
                <View style={styles.fullModalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setWithdrawModalVisible(false)} />
                    <View style={[styles.premiumModalSheet, isDark && { backgroundColor: '#1E293B' }]}>
                        <View style={styles.modalDragIndicator} />
                        <Text style={[styles.modalHeading, isDark && { color: '#F1F5F9' }]}>Cash Withdrawal</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalInputGroup}>
                                <Text style={[styles.modalLabel, isDark && { color: '#94A3B8' }]}>Enter Amount (৳)</Text>
                                <TextInput
                                    style={[styles.premiumInput, isDark && { backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF' }]}
                                    placeholder="0.00"
                                    placeholderTextColor="#64748B"
                                    keyboardType="numeric"
                                    value={withdrawAmount}
                                    onChangeText={setWithdrawAmount}
                                />
                            </View>

                            <Text style={[styles.modalLabel, { marginBottom: 12 }, isDark && { color: '#94A3B8' }]}>Selection Payment Method</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.methodSelector}>
                                {['bKash', 'Nagad', 'Rocket', 'Bank'].map((method) => (
                                    <TouchableOpacity
                                        key={method}
                                        style={[
                                            styles.methodCard,
                                            withdrawMethod === method && styles.activeMethodCard,
                                            isDark && { backgroundColor: '#0F172A', borderColor: '#334155' },
                                            withdrawMethod === method && { borderColor: '#10B981' }
                                        ]}
                                        onPress={() => setWithdrawMethod(method as any)}
                                    >
                                        <View style={[styles.methodRadio, withdrawMethod === method && { borderColor: '#10B981' }]}>
                                            {withdrawMethod === method && <View style={styles.radioDot} />}
                                        </View>
                                        <Text style={[styles.methodName, isDark && { color: '#CBD5E1' }, withdrawMethod === method && { color: '#10B981', fontWeight: 'bold' }]}>{method}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {withdrawMethod === 'Bank' ? (
                                <View style={{ marginTop: 10 }}>
                                    {['Bank Name', 'Account Name', 'Account Number', 'Branch Name'].map((label) => (
                                        <View key={label} style={styles.modalInputGroup}>
                                            <Text style={[styles.modalLabel, isDark && { color: '#94A3B8' }]}>{label}</Text>
                                            <TextInput
                                                style={[styles.premiumInput, isDark && { backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF' }]}
                                                placeholder={`Enter ${label.toLowerCase()}`}
                                                placeholderTextColor="#64748B"
                                                value={label === 'Bank Name' ? bankName : label === 'Account Name' ? accountName : label === 'Account Number' ? accountNumber : branchName}
                                                onChangeText={label === 'Bank Name' ? setBankName : label === 'Account Name' ? setAccountName : label === 'Account Number' ? setAccountNumber : setBranchName}
                                            />
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.modalInputGroup}>
                                    <Text style={[styles.modalLabel, isDark && { color: '#94A3B8' }]}>{withdrawMethod} Number</Text>
                                    <TextInput
                                        style={[styles.premiumInput, isDark && { backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF' }]}
                                        placeholder="01XXXXXXXXX"
                                        placeholderTextColor="#64748B"
                                        keyboardType="numeric"
                                        maxLength={11}
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                    />
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.primaryActionBtn, { backgroundColor: '#10B981' }]}
                                onPress={handleWithdrawSubmit}
                                disabled={isSubmittingWithdraw}
                            >
                                {isSubmittingWithdraw ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryActionBtnText}>Confirm Withdrawal</Text>}
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Points Transfer Modal Redesign */}
            <Modal visible={pointTransferModalVisible} transparent animationType="slide">
                <View style={styles.fullModalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setPointTransferModalVisible(false)} />
                    <View style={[styles.premiumModalSheet, isDark && { backgroundColor: '#1E293B' }]}>
                        <View style={styles.modalDragIndicator} />
                        <Text style={[styles.modalHeading, isDark && { color: '#F1F5F9' }]}>Transfer Points</Text>

                        <View style={styles.modalInputGroup}>
                            <Text style={[styles.modalLabel, isDark && { color: '#94A3B8' }]}>Recipient Username</Text>
                            <View style={styles.inputWithScanner}>
                                <TextInput
                                    style={[styles.premiumInput, { flex: 1 }, isDark && { backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF' }]}
                                    placeholder="e.g. johndoe"
                                    placeholderTextColor="#64748B"
                                    autoCapitalize="none"
                                    value={receiverUsernamePoints}
                                    onChangeText={setReceiverUsernamePoints}
                                />
                                <TouchableOpacity style={styles.scannerIconBtn} onPress={handleOpenScanner}>
                                    <Ionicons name="scan" size={24} color="#4F46E5" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.modalInputGroup}>
                            <Text style={[styles.modalLabel, isDark && { color: '#94A3B8' }]}>Points to Send</Text>
                            <TextInput
                                style={[styles.premiumInput, isDark && { backgroundColor: '#0F172A', borderColor: '#334155', color: '#FFF' }]}
                                placeholder="0.00"
                                placeholderTextColor="#64748B"
                                keyboardType="numeric"
                                value={pointTransferAmount}
                                onChangeText={setPointTransferAmount}
                            />
                        </View>

                        <View style={styles.infoAlert}>
                            <Ionicons name="information-circle" size={18} color="#4F46E5" />
                            <Text style={styles.infoAlertText}>Transfers are instant and cannot be reversed.</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.primaryActionBtn}
                            onPress={handlePointTransferSubmit}
                            disabled={isSubmittingPointTransfer}
                        >
                            {isSubmittingPointTransfer ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryActionBtnText}>Send Points Now</Text>}
                        </TouchableOpacity>
                        <View style={{ height: 40 }} />
                    </View>
                </View>
            </Modal>

            {/* QR Code Modal Enhancement */}
            <Modal visible={showMyQR} transparent animationType="fade">
                <View style={styles.blurModalOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowMyQR(false)} />
                    <View style={[styles.qrPremiumContainer, isDark && { backgroundColor: '#1E293B' }]}>
                        <Text style={[styles.modalHeading, { marginBottom: 10 }, isDark && { color: '#F1F5F9' }]}>My QR Code</Text>
                        <Text style={styles.qrDesc}>Show this code to others to receive points</Text>

                        <View style={styles.qrWhiteBox}>
                            <QRCode
                                value={user?.userName || ''}
                                size={220}
                                color={isDark ? '#0F172A' : '#000'}
                                backgroundColor="#FFF"
                            />
                        </View>

                        <View style={styles.qrIdentity}>
                            <View style={styles.identityBadge}>
                                <Text style={styles.identityText}>@{user?.userName}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.closeBtnCircle} onPress={() => setShowMyQR(false)}>
                            <Ionicons name="close" size={30} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Camera Overlay */}
            {showScanner && device && (
                <View style={StyleSheet.absoluteFill}>
                    <Camera
                        style={StyleSheet.absoluteFill}
                        device={device}
                        isActive={true}
                        codeScanner={codeScanner}
                    />
                    <View style={styles.cameraOverlay}>
                        <View style={styles.cameraHeader}>
                            <TouchableOpacity onPress={() => setShowScanner(false)} style={styles.cameraBackBtn}>
                                <Ionicons name="arrow-back" size={28} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={styles.cameraTitle}>Scan QR Code</Text>
                        </View>
                        <View style={styles.cameraGuideContainer}>
                            <View style={styles.cameraFrame} />
                            <Text style={styles.cameraHint}>Align QR code with the frame</Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { paddingHorizontal: 16 },
    premiumHeader: { paddingVertical: 20 },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    welcomeText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    nameText: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
    avatarBtn: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden', borderWidth: 2, borderColor: '#FFF', elevation: 2 },
    avatar: { width: '100%', height: '100%' },

    cardContainer: { width: '100%', borderRadius: 24, overflow: 'hidden' },
    mainWalletCard: { padding: 24, borderRadius: 24, position: 'relative' },
    glassEffectMask: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.05)' },
    cardInfo: { marginBottom: 25 },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    cardTitleText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700', marginLeft: 10, letterSpacing: 0.5 },
    balanceRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
    currencySymbol: { color: 'rgba(255,255,255,0.7)', fontSize: width < 380 ? 14 : 16, fontWeight: '700', marginRight: 5 },
    mainBalanceText: { color: '#FFF', fontSize: width < 380 ? 32 : 42, fontWeight: '900' },
    mainBalanceTextResponsive: { color: '#FFF', fontSize: width < 380 ? 28 : 36, fontWeight: '900' },
    subBalanceText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 5 },
    taglineText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '700', marginTop: 10, fontStyle: 'italic', letterSpacing: 0.8 },

    quickActions: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 10 },
    actionItem: { alignItems: 'center', flex: 1 },
    actionIconBox: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
    actionLabel: { color: '#FFF', fontSize: 11, fontWeight: '700' },

    secondaryWalletCard: { padding: width < 380 ? 16 : 24, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    glassOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.05)' },
    secondaryCardInfo: { flex: 1, marginRight: 10 },
    withdrawBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
    withdrawBtnText: { color: '#FFF', fontWeight: '800', fontSize: width < 380 ? 12 : 14 },

    historySection: { marginTop: 30 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 15 },
    customTabs: { flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 5, borderRadius: 16, marginBottom: 20 },
    tabTrigger: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
    activeTabTrigger: { backgroundColor: '#FFF', elevation: 3, shadowOpacity: 0.05 },
    tabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    activeTabText: { color: '#4F46E5' },

    historyList: { gap: 12 },
    premiumListItem: { backgroundColor: '#FFF', padding: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
    listIconBox: { marginRight: 15 },
    methodIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    listContent: { flex: 1 },
    listTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
    listSubtitle: { fontSize: 12, color: '#64748B', marginBottom: 4 },
    listDate: { fontSize: 11, color: '#94A3B8' },
    listAmount: { alignItems: 'flex-end' },
    amountVal: { fontSize: width < 380 ? 14 : 16, fontWeight: '800', color: '#1E293B' },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 5 },
    statusBadgeText: { fontSize: 8, fontWeight: '900' },
    pointsLabel: { fontSize: 9, fontWeight: '800', color: '#64748B' },

    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyLabel: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginTop: 15 },

    fullModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    premiumModalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: height * 0.85 },
    modalDragIndicator: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
    modalHeading: { fontSize: 22, fontWeight: '900', color: '#1E293B', textAlign: 'center', marginBottom: 25 },
    modalInputGroup: { marginBottom: 20 },
    modalLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginLeft: 4, marginBottom: 8 },
    premiumInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, fontSize: 16, color: '#1E293B' },
    methodSelector: { flexDirection: 'row', marginBottom: 25 },
    methodCard: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9', marginRight: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF' },
    activeMethodCard: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
    methodRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
    radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
    methodName: { fontSize: 14, color: '#64748B' },
    primaryActionBtn: { backgroundColor: '#4F46E5', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    primaryActionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

    inputWithScanner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    scannerIconBtn: { width: 55, height: 55, borderRadius: 16, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
    infoAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', padding: 12, borderRadius: 12, marginBottom: 20, gap: 10 },
    infoAlertText: { fontSize: 12, color: '#4F46E5', flex: 1, fontWeight: '600' },

    blurModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    qrPremiumContainer: { width: width * 0.85, backgroundColor: '#FFF', borderRadius: 36, padding: 30, alignItems: 'center', position: 'relative' },
    qrDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 25 },
    qrWhiteBox: { padding: 15, backgroundColor: '#FFF', borderRadius: 24, elevation: 10, shadowOpacity: 0.1 },
    qrIdentity: { marginTop: 25 },
    identityBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 },
    identityText: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    closeBtnCircle: { position: 'absolute', top: -15, right: -15, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', elevation: 5 },

    cameraOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    cameraHeader: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
    cameraBackBtn: { padding: 10 },
    cameraTitle: { flex: 1, textAlign: 'center', color: '#FFF', fontSize: 18, fontWeight: '800', marginRight: 48 },
    cameraGuideContainer: { alignItems: 'center' },
    cameraFrame: { width: width * 0.7, height: width * 0.7, borderWidth: 3, borderColor: '#818CF8', borderRadius: 30 },
    cameraHint: { color: '#FFF', fontSize: 14, fontWeight: '600', marginTop: 30, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
});

export default WalletScreen;
