import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const VideoPlayer = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { videoUrl } = route.params || {};

    const [isBuffering, setIsBuffering] = useState(true);

    if (!videoUrl) {
        navigation.goBack();
        return null;
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={[styles.header, { top: Math.max(insets.top, 20) }]}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="close" size={28} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.playerContainer}>
                <Video
                    source={{ uri: videoUrl }}
                    style={styles.video}
                    controls={true}
                    resizeMode="contain"
                    onLoadStart={() => setIsBuffering(true)}
                    onLoad={() => setIsBuffering(false)}
                    onError={(error) => {
                        setIsBuffering(false);
                    }}
                />

                {isBuffering && (
                    <View style={styles.loaderOverlay}>
                        <ActivityIndicator size="large" color="#ffffff" />
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        position: 'absolute',
        left: 20,
        zIndex: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: width,
        height: height,
    },
    loaderOverlay: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});

export default VideoPlayer;
