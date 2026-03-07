import React from 'react';
import {
    View,
    Image,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    SafeAreaView,
    Linking,
    Share,
    Platform,
    PermissionsAndroid,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import Toast from 'react-native-toast-message';
import RNFS from 'react-native-fs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const FullImageViewer = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { imageUrl } = route.params || {};
    const [saving, setSaving] = React.useState(false);

    if (!imageUrl) {
        navigation.goBack();
        return null;
    }

    async function hasAndroidPermission() {
        if (Platform.OS !== 'android') return true;

        const version = Number(Platform.Version);

        // Android 13 (API 33) and above
        if (version >= 33) {
            const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
            if (hasPermission) return true;

            const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
            return status === PermissionsAndroid.RESULTS.GRANTED;
        }

        // Android 10 to 12 (API 29 to 32)
        if (version >= 29) {
            const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
            if (hasPermission) return true;

            const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
            return status === PermissionsAndroid.RESULTS.GRANTED;
        }

        // Android 9 and below
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        if (hasPermission) return true;

        const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        return status === PermissionsAndroid.RESULTS.GRANTED;
    }

    const handleDownload = async () => {
        if (!imageUrl) return;

        if (Platform.OS === "android" && !(await hasAndroidPermission())) {
            Toast.show({
                type: 'error',
                text1: 'Permission Denied',
                text2: 'Gallery permission is required to save images.',
            });
            return;
        }

        setSaving(true);
        try {
            // Robust Save Strategy: Download to local temp directory first
            // This fixes PHPhotosErrorDomain error -1 on iOS and and network issues on Android

            // 1. Generate a clean extension/filename
            const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
            const timestamp = new Date().getTime();
            const fileName = `flybook_img_${timestamp}.${extension}`;
            const localPath = `${RNFS.TemporaryDirectoryPath}/${fileName}`;

            // 2. Download the file
            const downloadResult = await RNFS.downloadFile({
                fromUrl: imageUrl,
                toFile: localPath,
                background: true,
                discretionary: true,
            }).promise;

            if (downloadResult.statusCode === 200) {
                // 3. Save the local file to Gallery
                const saveOptions: any = { type: 'photo' };
                if (Platform.OS === 'ios') {
                    saveOptions.album = 'FlyBook';
                }

                await CameraRoll.save(`file://${localPath}`, saveOptions);

                // 4. Clean up temp file
                await RNFS.unlink(localPath);

                Toast.show({
                    type: 'success',
                    text1: 'Saved!',
                    text2: 'Image saved to your gallery successfully.',
                });
            } else {
                throw new Error(`Download failed with status ${downloadResult.statusCode}`);
            }
        } catch (error: any) {
            console.error('Download error:', error);

            let errorMessage = 'Failed to save image.';
            if (error.message?.includes('PHPhotosErrorDomain')) {
                errorMessage = 'Try opening in browser to save manually.';
            }

            Toast.show({
                type: 'error',
                text1: 'Save Failed',
                text2: errorMessage,
            });

            // If direct save fails, offer browser fallback
            Alert.alert(
                'Save Failed',
                'We couldn\'t save the image directly. Would you like to open it in Safari to download manually?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Open Browser',
                        onPress: () => Linking.openURL(imageUrl)
                    }
                ]
            );
        } finally {
            setSaving(false);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                url: imageUrl,
                message: 'Check out this image from FlyBook!',
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={[styles.headerBtn, { marginRight: 12 }]}
                            onPress={handleShare}
                        >
                            <Ionicons name="share-outline" size={24} color="#FFF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.headerBtn}
                            onPress={handleDownload}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Ionicons name="download-outline" size={24} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.footer} />
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        zIndex: 10,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: height * 0.8,
    },
    footer: {
        height: 60,
    },
});

export default FullImageViewer;
