import React from 'react';
import { View, StyleSheet } from 'react-native';
import PdfViewer from '../../components/common/PdfViewer';
import CustomHeader from '../../components/common/CustomHeader';
import { useTheme } from '../../contexts/ThemeContext';

const PdfViewerScreen = ({ route, navigation }: any) => {
    const { pdfUrl, title } = route.params;
    const { isDark } = useTheme();

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <CustomHeader
                title={title || "PDF Viewer"}
                showMenuIcon={false}
                showBackButton={true}
            />
            <View style={styles.content}>
                <PdfViewer uri={pdfUrl} />
            </View>
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
    content: {
        flex: 1,
    },
});

export default PdfViewerScreen;
