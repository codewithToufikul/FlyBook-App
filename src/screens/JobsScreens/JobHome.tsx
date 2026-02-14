import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    StatusBar,
    Pressable,
    Dimensions,
    Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import CustomHeader from '../../components/common/CustomHeader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

const JobHome = ({ navigation }: any) => {
    const Card = ({
        title,
        badge,
        badgeColor,
        gradientColors,
        icon,
        features,
        onPress,
    }: any) => (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.cardContainer,
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
        >
            <View style={styles.card}>


                {/* Card Body */}
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{title}</Text>

                    {/* Features Grid */}
                    <View style={styles.featuresContainer}>
                        {features.map((item: any, index: number) => (
                            <View key={index} style={styles.featureItem}>
                                <View
                                    style={[
                                        styles.featureIconCircle,
                                        { backgroundColor: badgeColor + '15' },
                                    ]}
                                >
                                    <Ionicons name={item.icon} size={16} color={badgeColor} />
                                </View>
                                <Text style={styles.featureText}>{item.text}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Action Button */}
                    <View style={styles.cardFooter}>
                        <View style={[styles.actionButton, { backgroundColor: badgeColor }]}>
                            <Text style={styles.actionButtonText}>Explore Now</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                        </View>
                    </View>
                </View>
            </View>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
            <CustomHeader title="Jobs & Freelance" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroIconContainer}>
                        <LinearGradient
                            colors={['#3B82F6', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroIconGradient}
                        >
                            <Ionicons name="briefcase" size={32} color="#FFFFFF" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.heroTitle}>Shape Your Career Path</Text>
                    <Text style={styles.heroSubtitle}>
                        Choose stability with employment or freedom with freelancing.
                    </Text>
                    <View style={styles.heroDivider} />
                </View>

                {/* Section Title */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Choose Your Path</Text>
                    <Text style={styles.sectionSubtitle}>
                        Select the opportunity that fits your lifestyle
                    </Text>
                </View>

                {/* Job Board Card */}
                <Card
                    title="Job Board"
                    badge="🎯 Traditional Career"
                    badgeColor="#2563EB"
                    gradientColors={['#3B82F6', '#2563EB']}
                    icon="briefcase"
                    onPress={() => navigation.navigate('JobBoard')}
                    features={[
                        { icon: 'business-outline', text: 'Company Jobs' },
                        { icon: 'location-outline', text: 'Location Based' },
                        { icon: 'people-outline', text: 'Direct Apply' },
                        { icon: 'time-outline', text: 'Full / Part-time' },
                    ]}
                />

                {/* Freelance Card */}
                <Card
                    title="Freelance Marketplace"
                    badge="🚀 Modern Work Style"
                    badgeColor="#059669"
                    gradientColors={['#10B981', '#059669']}
                    icon="rocket"
                    onPress={() => navigation.navigate('FreelanceMarketplace')}
                    features={[
                        { icon: 'rocket-outline', text: 'Project Based' },
                        { icon: 'cash-outline', text: 'Fixed / Hourly' },
                        { icon: 'briefcase-outline', text: 'Proposal System' },
                        { icon: 'time-outline', text: 'Flexible Time' },
                    ]}
                />

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
    );
};

export default JobHome;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },

    // Hero Section
    heroSection: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    heroIconContainer: {
        marginBottom: 20,
    },
    heroIconGradient: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 12,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: '85%',
    },
    heroDivider: {
        width: 60,
        height: 4,
        backgroundColor: '#3B82F6',
        borderRadius: 2,
        marginTop: 20,
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 10,
    },

    // Section Header
    sectionHeader: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#64748B',
    },

    // Card Container
    cardContainer: {
        marginBottom: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },

    // Card Header
    cardHeader: {
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 18,
    },
    cardHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    iconContainer: {
        position: 'relative',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.35)',
    },
    arrowContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    badgeContainer: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },

    // Card Body
    cardBody: {
        padding: 20,
        paddingTop: 18,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },

    // Features
    featuresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        gap: 10,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        width: '48%',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    featureIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    featureText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '600',
        flex: 1,
    },

    // Card Footer
    cardFooter: {
        marginTop: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Info Cards
    infoCardsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 30,
    },
    infoCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    infoIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    infoCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    infoCardText: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
    },

    // Footer
    footer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    footerEmoji: {
        fontSize: 32,
        marginBottom: 12,
    },
    footerText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
    },
    footerSubtext: {
        fontSize: 13,
        color: '#64748B',
    },

    bottomSpacing: {
        height: 20,
    },
});