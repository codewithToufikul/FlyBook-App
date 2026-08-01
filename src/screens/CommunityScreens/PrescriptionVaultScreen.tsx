import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { get, post, del } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { pick } from '@react-native-documents/picker';
import { uploadToS3 } from '../../utils/s3Upload';
import { openPdfLink } from '../../utils/openLink';

const { width, height } = Dimensions.get('window');

interface Prescription {
    _id: string;
    userId: string;
    title: string;
    description: string;
    doctorHospitalName: string;
    fileUrl: string;
    fileType: string;
    date: string;
    createdAt: string;
}

const PrescriptionVaultScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { isDark } = useTheme();

    // Route params: mode ('patient' | 'doctor'), patientId (if doctor mode), patientName (if doctor mode)
    const { mode = 'patient', patientId, patientName } = route.params as {
        mode?: 'patient' | 'doctor';
        patientId?: string;
        patientName?: string;
    };

    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Upload state
    const [modalVisible, setModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [doctorHospitalName, setDoctorHospitalName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; type: string; size: number } | null>(null);

    // Zoom modal state
    const [zoomModalVisible, setZoomModalVisible] = useState(false);
    const [zoomImageUrl, setZoomImageUrl] = useState('');
    const [zoomImageTitle, setZoomImageTitle] = useState('');
    const [imageScale, setImageScale] = useState(1);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        setLoading(true);
        try {
            const url = mode === 'doctor' && patientId
                ? `/api/prescriptions/patient/${patientId}`
                : '/api/prescriptions';
            
            const res = await get<{ success: boolean; data: Prescription[] }>(url);
            if (res.success) {
                setPrescriptions(res.data);
            }
        } catch (error: any) {
            console.error('Error fetching prescriptions:', error);
            Alert.alert('Error', error.message || 'Failed to fetch prescriptions');
        } finally {
            setLoading(false);
        }
    };

    const handlePickDocument = async () => {
        try {
            const result = await pick({
                type: ['application/pdf', 'image/jpeg', 'image/png'],
                allowMultiSelection: false,
            });

            if (result && result.length > 0) {
                const file = result[0];
                
                // Max size validation: 10MB
                const maxSizeBytes = 10 * 1024 * 1024;
                if (file.size && file.size > maxSizeBytes) {
                    Alert.alert('File Too Large', 'Maximum file size allowed is 10MB.');
                    return;
                }

                setSelectedFile({
                    uri: file.uri,
                    name: file.name || (file.type?.includes('pdf') ? 'document.pdf' : 'prescription.jpg'),
                    type: file.type || (file.uri.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
                    size: file.size || 0,
                });
                
                // Auto-fill title with filename if empty
                if (!title) {
                    const cleanName = file.name ? file.name.replace(/\.[^/.]+$/, "") : 'Prescription';
                    setTitle(cleanName);
                }
            }
        } catch (error: any) {
            if (error?.code !== 'DOCUMENT_PICKER_CANCELED') {
                console.error('Document picking failed:', error);
                Alert.alert('Error', 'Failed to pick prescription document');
            }
        }
    };

    const handleUploadPrescription = async () => {
        if (!selectedFile) {
            Alert.alert('Missing File', 'Please select a PDF or Image file to upload.');
            return;
        }

        if (!title.trim()) {
            Alert.alert('Missing Title', 'Please enter a title for the prescription.');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            // 1. Upload to S3
            const s3Folder = selectedFile.type.includes('pdf') ? 'prescriptions/pdf' : 'prescriptions/image';
            const uploadResult = await uploadToS3(
                selectedFile.uri,
                selectedFile.type,
                s3Folder,
                (progress: number) => setUploadProgress(progress)
            );

            if (!uploadResult?.url) {
                throw new Error('Upload returned no URL');
            }

            // 2. Save metadata to backend database
            const payload = {
                title: title.trim(),
                description: description.trim(),
                doctorHospitalName: doctorHospitalName.trim(),
                fileUrl: uploadResult.url,
                fileType: selectedFile.type,
                date: date.trim() || new Date().toISOString().split('T')[0],
            };

            const dbRes = await post<{ success: boolean; data: Prescription }>('/api/prescriptions', payload);
            
            if (dbRes.success) {
                Alert.alert('Success', 'Prescription stored successfully in vault');
                setModalVisible(false);
                // Reset form
                setTitle('');
                setDescription('');
                setDoctorHospitalName('');
                setDate(new Date().toISOString().split('T')[0]);
                setSelectedFile(null);
                // Refresh list
                fetchPrescriptions();
            }
        } catch (error: any) {
            console.error('Prescription upload failed:', error);
            Alert.alert('Upload Error', error.message || 'Failed to upload prescription to vault');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDeletePrescription = (id: string) => {
        Alert.alert(
            'Delete Prescription',
            'Are you sure you want to permanently delete this medical record?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await del<{ success: boolean }>(`/api/prescriptions/${id}`);
                            if (res.success) {
                                setPrescriptions(prev => prev.filter(p => p._id !== id));
                            }
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to delete prescription');
                        }
                    }
                }
            ]
        );
    };

    const handleViewFile = (prescription: Prescription) => {
        const isPdf = prescription.fileType.includes('pdf');
        if (isPdf) {
            openPdfLink(prescription.fileUrl, isDark).catch((err) => {
                console.error('Error opening PDF:', err);
                Alert.alert('Error', 'Cannot open PDF link');
            });
        } else {
            // Open zoom modal for image
            setImageScale(1);
            setZoomImageUrl(prescription.fileUrl);
            setZoomImageTitle(prescription.title);
            setZoomModalVisible(true);
        }
    };

    // Zoom handlers
    const zoomIn = () => setImageScale(prev => Math.min(prev + 0.3, 4));
    const zoomOut = () => setImageScale(prev => Math.max(prev - 0.3, 0.7));
    const resetZoom = () => setImageScale(1);

    const openInBrowser = () => {
        if (zoomImageUrl) {
            openPdfLink(zoomImageUrl, isDark).catch(() => Alert.alert('Error', 'Cannot open image link'));
        }
    };

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0F172A' }]}>
            {/* Header */}
            <View style={[styles.header, isDark && { backgroundColor: '#0F172A', borderBottomColor: '#1E293B' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#1E293B'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDark && { color: '#FFF' }]}>
                    {mode === 'doctor' ? `${patientName || 'Patient'}'s Vault` : 'Prescription Vault'}
                </Text>
                {mode === 'patient' ? (
                    <TouchableOpacity style={styles.addHeaderBtn} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={24} color={isDark ? '#FFF' : '#4F46E5'} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={[styles.loadingText, isDark && { color: '#94A3B8' }]}>Fetching vault records...</Text>
                </View>
            ) : prescriptions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={72} color={isDark ? '#334155' : '#CBD5E1'} />
                    <Text style={[styles.emptyTitle, isDark && { color: '#FFF' }]}>No prescriptions stored</Text>
                    <Text style={styles.emptySubtitle}>
                        {mode === 'doctor'
                            ? 'This patient has not uploaded any medical records yet.'
                            : 'Upload your prescriptions and medical history securely. PDFs, JPGs, and PNGs are supported.'}
                    </Text>
                    {mode === 'patient' && (
                        <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
                            <Text style={styles.createBtnText}>Upload First Prescription</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    {prescriptions.map(item => {
                        const isPdf = item.fileType.includes('pdf');
                        return (
                            <TouchableOpacity
                                key={item._id}
                                activeOpacity={0.8}
                                onPress={() => handleViewFile(item)}
                                style={[styles.vaultCard, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}
                            >
                                <View style={styles.cardLeft}>
                                    <View style={[styles.fileIconBox, { backgroundColor: isPdf ? '#FEE2E2' : '#E0F2FE' }]}>
                                        <Ionicons
                                            name={isPdf ? 'document-text' : 'image'}
                                            size={26}
                                            color={isPdf ? '#EF4444' : '#0EA5E9'}
                                        />
                                    </View>
                                </View>

                                <View style={styles.cardCenter}>
                                    <Text style={[styles.cardTitle, isDark && { color: '#F1F5F9' }]} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    
                                    {item.doctorHospitalName ? (
                                        <View style={styles.metaRow}>
                                            <Ionicons name="medkit-outline" size={13} color="#64748B" />
                                            <Text style={styles.metaText} numberOfLines={1}>
                                                {item.doctorHospitalName}
                                            </Text>
                                        </View>
                                    ) : null}

                                    <View style={styles.metaRow}>
                                        <Ionicons name="calendar-outline" size={13} color="#64748B" />
                                        <Text style={styles.metaText}>{item.date}</Text>
                                    </View>

                                    {item.description ? (
                                        <Text style={styles.descText} numberOfLines={2}>
                                            {item.description}
                                        </Text>
                                    ) : null}
                                </View>

                                <View style={styles.cardRight}>
                                    {mode === 'patient' ? (
                                        <TouchableOpacity
                                            style={styles.deleteBtn}
                                            onPress={() => handleDeletePrescription(item._id)}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    ) : (
                                        <Ionicons name="eye-outline" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {/* Upload Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDark && { backgroundColor: '#0F172A' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, isDark && { color: '#FFF' }]}>Upload Medical Record</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} disabled={uploading}>
                                <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#333'} />
                            </TouchableOpacity>
                        </View>

                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                                <TouchableOpacity style={styles.filePickerBtn} onPress={handlePickDocument} disabled={uploading}>
                                    <Ionicons name="cloud-upload-outline" size={28} color="#4F46E5" />
                                    <Text style={styles.filePickerText}>
                                        {selectedFile ? selectedFile.name : 'Select PDF or Image (Max 10MB)'}
                                    </Text>
                                    {selectedFile && (
                                        <Text style={styles.filePickerSize}>
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                <TextInput
                                    style={[styles.input, isDark && { backgroundColor: '#1E293B', color: '#FFF', borderColor: '#334155' }]}
                                    placeholder="Document Title (e.g. Tooth Extraction Memo)"
                                    placeholderTextColor="#94A3B8"
                                    value={title}
                                    onChangeText={setTitle}
                                    editable={!uploading}
                                />

                                <TextInput
                                    style={[styles.input, isDark && { backgroundColor: '#1E293B', color: '#FFF', borderColor: '#334155' }]}
                                    placeholder="Doctor or Hospital Name (Optional)"
                                    placeholderTextColor="#94A3B8"
                                    value={doctorHospitalName}
                                    onChangeText={setDoctorHospitalName}
                                    editable={!uploading}
                                />

                                <TextInput
                                    style={[styles.input, isDark && { backgroundColor: '#1E293B', color: '#FFF', borderColor: '#334155' }]}
                                    placeholder="Date (YYYY-MM-DD)"
                                    placeholderTextColor="#94A3B8"
                                    value={date}
                                    onChangeText={setDate}
                                    editable={!uploading}
                                />

                                <TextInput
                                    style={[styles.input, styles.textArea, isDark && { backgroundColor: '#1E293B', color: '#FFF', borderColor: '#334155' }]}
                                    placeholder="Notes / Description (Optional)"
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    numberOfLines={4}
                                    value={description}
                                    onChangeText={setDescription}
                                    editable={!uploading}
                                />

                                {uploading && (
                                    <View style={styles.progressContainer}>
                                        <ActivityIndicator size="small" color="#4F46E5" />
                                        <Text style={[styles.progressText, isDark && { color: '#CBD5E1' }]}>
                                            Uploading: {uploadProgress}%
                                        </Text>
                                        <View style={styles.progressBarBg}>
                                            <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
                                        </View>
                                    </View>
                                )}
                            </ScrollView>

                            <TouchableOpacity
                                style={[styles.submitBtn, (!selectedFile || !title || uploading) && { opacity: 0.6 }]}
                                onPress={handleUploadPrescription}
                                disabled={!selectedFile || !title || uploading}
                            >
                                <Text style={styles.submitBtnText}>Store in Vault</Text>
                            </TouchableOpacity>
                        </KeyboardAvoidingView>
                    </View>
                </View>
            </Modal>

            {/* Image Zoom Modal */}
            <Modal visible={zoomModalVisible} transparent animationType="fade">
                <View style={styles.zoomContainer}>
                    <View style={styles.zoomHeader}>
                        <Text style={styles.zoomTitle} numberOfLines={1}>{zoomImageTitle}</Text>
                        <TouchableOpacity onPress={() => setZoomModalVisible(false)} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.zoomBody}>
                        {zoomImageUrl ? (
                            <Image
                                source={{ uri: zoomImageUrl }}
                                style={[styles.zoomImage, { transform: [{ scale: imageScale }] }]}
                            />
                        ) : null}
                    </View>

                    {/* Interactive Zoom Controls */}
                    <View style={styles.zoomControls}>
                        <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut}>
                            <Ionicons name="remove" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.zoomBtn} onPress={resetZoom}>
                            <Text style={styles.zoomBtnText}>Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn}>
                            <Ionicons name="add" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.zoomBtn, { marginLeft: 16, backgroundColor: '#0EA5E9' }]} onPress={openInBrowser}>
                            <Ionicons name="download-outline" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
    addHeaderBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { marginTop: 12, fontSize: 14, color: '#64748B' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginTop: 16, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    createBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
    createBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    list: { padding: 16 },
    vaultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardLeft: { marginRight: 14 },
    fileIconBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardCenter: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    metaText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    descText: { fontSize: 12, color: '#64748B', marginTop: 6, fontStyle: 'italic' },
    cardRight: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    deleteBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { height: '82%', backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    form: { flex: 1 },
    filePickerBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#4F46E5',
        borderStyle: 'dashed',
        borderRadius: 16,
        paddingVertical: 24,
        marginBottom: 20,
        backgroundColor: '#F8FAFC'
    },
    filePickerText: { fontSize: 13, color: '#4F46E5', fontWeight: 'bold', marginTop: 8, paddingHorizontal: 16, textAlign: 'center' },
    filePickerSize: { fontSize: 11, color: '#64748B', marginTop: 4 },
    input: { height: 48, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC', marginBottom: 14 },
    textArea: { height: 90, textAlignVertical: 'top', paddingVertical: 12 },
    progressContainer: { marginTop: 10, alignItems: 'center', width: '100%' },
    progressText: { fontSize: 13, color: '#475569', fontWeight: '500', marginBottom: 6 },
    progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, width: '100%', overflow: 'hidden' },
    progressBarFill: { height: 6, backgroundColor: '#4F46E5', borderRadius: 3 },
    submitBtn: { backgroundColor: '#4F46E5', borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
    // Zoom styles
    zoomContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'space-between' },
    zoomHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 16
    },
    zoomTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 16 },
    closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
    zoomBody: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    zoomImage: { width: '100%', height: '100%', resizeMode: 'contain' },
    zoomControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingTop: 16,
        backgroundColor: 'rgba(0,0,0,0.6)'
    },
    zoomBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center'
    },
    zoomBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' }
});

export default PrescriptionVaultScreen;
