import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../contexts/ThemeContext';

interface PdfViewerProps {
    uri: string;
    title?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ uri, title }) => {
    const { isDark } = useTheme();

    // On Android, WebView doesn't support PDF viewing natively.
    // We use Google Docs Viewer to render the PDF for remote URLs.
    const finalUri = React.useMemo(() => {
        if (!uri) return '';

        // Check if it's already a google docs link or a local file
        if (uri.includes('docs.google.com') || uri.startsWith('file://') || uri.startsWith('data:')) {
            return uri;
        }

        // For Android remote PDFs, wrap in Google Docs viewer
        // For iOS, WebView handles PDF natively
        if (Platform.OS === 'android') {
            return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(uri)}`;
        }

        return uri;
    }, [uri]);

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <WebView
                source={{ uri: finalUri }}
                style={styles.webview}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={[styles.loader, isDark && styles.loaderDark]}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={[styles.loadingText, isDark && { color: '#94A3B8' }]}>
                            Opening PDF...
                        </Text>
                    </View>
                )}
                // Enable zoom and other features
                scalesPageToFit={true}
                allowsFullscreenVideo={true}
                originWhitelist={['*']}
                incognito={true} // Helps with some cache issues
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    containerDark: {
        backgroundColor: '#0f172a',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 1,
    },
    loaderDark: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#6B7280',
    },
});

export default PdfViewer;
