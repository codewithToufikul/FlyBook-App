import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Loader from './Loader';
import ButtonLoader from './ButtonLoader';
import SkeletonLoader, {
  PostSkeleton,
  ProductCardSkeleton,
  ListItemSkeleton,
} from './SkeletonLoader';
import PullToRefreshLoader from './PullToRefreshLoader';
import LoadingOverlay from './LoadingOverlay';

/**
 * Demo screen to showcase all loader components
 * Use this screen to test and preview loaders during development
 */
const LoadersDemo = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  const simulateLoading = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  const showOverlayDemo = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>FlyBook Loaders Demo</Text>

        {/* Main Loader Variants */}
        <Section title="1. Main Loader - Sizes">
          <View style={styles.row}>
            <View style={styles.loaderBox}>
              <Text style={styles.label}>Small</Text>
              <Loader size="small" variant="inline" showLogo={false} />
            </View>
            <View style={styles.loaderBox}>
              <Text style={styles.label}>Medium</Text>
              <Loader size="medium" variant="inline" showLogo={false} />
            </View>
            <View style={styles.loaderBox}>
              <Text style={styles.label}>Large</Text>
              <Loader size="large" variant="inline" showLogo={false} />
            </View>
          </View>
        </Section>

        <Section title="2. Main Loader - With Logo">
          <View style={styles.centeredBox}>
            <Loader
              message="Loading your content..."
              size="medium"
              variant="inline"
              showLogo={true}
            />
          </View>
        </Section>

        <Section title="3. Button Loader">
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={simulateLoading}
              disabled={buttonLoading}
            >
              {buttonLoading ? (
                <ButtonLoader color="#FFFFFF" size="medium" />
              ) : (
                <Text style={styles.buttonText}>Click to Load</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
              <ButtonLoader color="#3B82F6" size="small" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.successButton]}>
              <ButtonLoader color="#FFFFFF" size="large" />
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="4. Skeleton Loader - Basic">
          <View style={styles.skeletonContainer}>
            <SkeletonLoader width="100%" height={20} />
            <SkeletonLoader width="90%" height={20} style={{ marginTop: 8 }} />
            <SkeletonLoader width="70%" height={20} style={{ marginTop: 8 }} />
            <View style={styles.skeletonRow}>
              <SkeletonLoader variant="circle" width={50} height={50} />
              <View style={styles.skeletonColumn}>
                <SkeletonLoader width="80%" height={16} />
                <SkeletonLoader width="60%" height={14} style={{ marginTop: 6 }} />
              </View>
            </View>
          </View>
        </Section>

        <Section title="5. Skeleton Loader - Post">
          <PostSkeleton />
        </Section>

        <Section title="6. Skeleton Loader - Product Card">
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <ProductCardSkeleton />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <ProductCardSkeleton />
            </View>
          </View>
        </Section>

        <Section title="7. Skeleton Loader - List Items">
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </Section>

        <Section title="8. Pull to Refresh Loader">
          <View style={styles.centeredBox}>
            <PullToRefreshLoader color="#3B82F6" size={40} />
          </View>
        </Section>

        <Section title="9. Custom Colors">
          <View style={styles.colorRow}>
            <View style={styles.colorBox}>
              <Loader
                size="small"
                variant="inline"
                showLogo={false}
                color="#EF4444"
              />
              <Text style={styles.colorLabel}>Red</Text>
            </View>
            <View style={styles.colorBox}>
              <Loader
                size="small"
                variant="inline"
                showLogo={false}
                color="#10B981"
              />
              <Text style={styles.colorLabel}>Green</Text>
            </View>
            <View style={styles.colorBox}>
              <Loader
                size="small"
                variant="inline"
                showLogo={false}
                color="#F59E0B"
              />
              <Text style={styles.colorLabel}>Yellow</Text>
            </View>
            <View style={styles.colorBox}>
              <Loader
                size="small"
                variant="inline"
                showLogo={false}
                color="#8B5CF6"
              />
              <Text style={styles.colorLabel}>Purple</Text>
            </View>
          </View>
        </Section>

        <Section title="10. Loading Overlay">
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={showOverlayDemo}
          >
            <Text style={styles.buttonText}>Show Overlay (3s)</Text>
          </TouchableOpacity>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>

      <LoadingOverlay
        visible={showOverlay}
        message="Processing your request..."
      />
    </SafeAreaView>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#1E293B',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  centeredBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  skeletonContainer: {
    gap: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  skeletonColumn: {
    flex: 1,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  colorBox: {
    alignItems: 'center',
  },
  colorLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
  },
});

export default LoadersDemo;
