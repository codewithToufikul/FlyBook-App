import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';

const LAST_UPDATED = 'February 26, 2026';
const CONTACT_EMAIL = 'support@flybook.com.bd';
const APP_NAME = 'FlyBook';
const COMPANY = 'FlyBook Technologies';

const Section = ({ title, children, isDark }: { title: string; children: React.ReactNode; isDark: boolean }) => (
    <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#60a5fa' : '#2563EB' }]}>{title}</Text>
        {children}
    </View>
);

const Para = ({ text, isDark }: { text: string; isDark: boolean }) => (
    <Text style={[styles.para, { color: isDark ? '#94a3b8' : '#4B5563' }]}>{text}</Text>
);

const Bullet = ({ text, isDark }: { text: string; isDark: boolean }) => (
    <View style={styles.bulletRow}>
        <View style={[styles.bullet, { backgroundColor: isDark ? '#60a5fa' : '#2563EB' }]} />
        <Text style={[styles.bulletText, { color: isDark ? '#94a3b8' : '#4B5563' }]}>{text}</Text>
    </View>
);

const PrivacyPolicy = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();

    const bg = isDark ? '#0f172a' : '#FFFFFF';
    const headerBg = isDark ? '#0f172a' : '#FFFFFF';
    const border = isDark ? '#334155' : '#E5E7EB';
    const titleColor = isDark ? '#f8fafc' : '#111827';

    return (
        <View style={[styles.container, { backgroundColor: bg, paddingTop: insets.top }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={headerBg} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#f8fafc' : '#1F2937'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: titleColor }]}>Privacy Policy</Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Effective Date */}
                <View style={[styles.effectiveBadge, { backgroundColor: isDark ? 'rgba(96,165,250,0.12)' : '#EFF6FF', borderColor: isDark ? '#1e3a5f' : '#BFDBFE' }]}>
                    <Ionicons name="shield-checkmark" size={18} color="#3B82F6" />
                    <Text style={[styles.effectiveText, { color: isDark ? '#60a5fa' : '#1D4ED8' }]}>
                        Last updated: {LAST_UPDATED}
                    </Text>
                </View>

                <Text style={[styles.intro, { color: isDark ? '#cbd5e1' : '#374151' }]}>
                    Welcome to {APP_NAME}. This Privacy Policy explains how {COMPANY} ("we", "us", or "our") collects, uses, shares, and protects your personal information when you use our mobile application.
                </Text>

                <Section title="1. Information We Collect" isDark={isDark}>
                    <Para text="We collect the following types of information:" isDark={isDark} />
                    <Bullet text="Account Information: Name, email address, phone number, and password during registration." isDark={isDark} />
                    <Bullet text="Location Data: Precise GPS location to show nearby users, books, and services." isDark={isDark} />
                    <Bullet text="Media: Photos, videos, and documents you upload or share." isDark={isDark} />
                    <Bullet text="Audio/Video: During voice and video calls (not recorded or stored)." isDark={isDark} />
                    <Bullet text="Device Information: Device model, OS version, and push notification token." isDark={isDark} />
                    <Bullet text="Usage Data: Features used, screens visited, and app interaction logs." isDark={isDark} />
                </Section>

                <Section title="2. How We Use Your Information" isDark={isDark}>
                    <Para text="We use your information to:" isDark={isDark} />
                    <Bullet text="Create and manage your account." isDark={isDark} />
                    <Bullet text="Provide core app features: social feed, marketplace, jobs, e-learning, and community." isDark={isDark} />
                    <Bullet text="Enable real-time audio and video calling." isDark={isDark} />
                    <Bullet text="Send push notifications and important alerts." isDark={isDark} />
                    <Bullet text="Show location-relevant content (nearby books, users, services)." isDark={isDark} />
                    <Bullet text="Improve app performance and user experience." isDark={isDark} />
                    <Bullet text="Comply with legal obligations." isDark={isDark} />
                </Section>

                <Section title="3. Permissions We Request" isDark={isDark}>
                    <Para text="The app requests the following device permissions:" isDark={isDark} />
                    <Bullet text="Camera: To capture profile photos and post images." isDark={isDark} />
                    <Bullet text="Microphone (RECORD_AUDIO): For voice and video calling features only." isDark={isDark} />
                    <Bullet text="Location: To provide location-based features and content." isDark={isDark} />
                    <Bullet text="Storage/Media: To upload and view images, videos, and PDFs." isDark={isDark} />
                    <Bullet text="Notifications: To receive messages, call alerts, and updates." isDark={isDark} />
                    <Bullet text="Bluetooth: To support audio routing during calls." isDark={isDark} />
                    <Bullet text="Overlay (SYSTEM_ALERT_WINDOW): To display incoming call notifications when the app is in the background." isDark={isDark} />
                </Section>

                <Section title="4. Sharing Your Information" isDark={isDark}>
                    <Para text="We do NOT sell your personal data. We may share information with:" isDark={isDark} />
                    <Bullet text="Firebase (Google): For push notifications and authentication." isDark={isDark} />
                    <Bullet text="Stream.io: For video/audio call infrastructure (no calls are stored)." isDark={isDark} />
                    <Bullet text="Cloudinary: For media storage (images, PDFs)." isDark={isDark} />
                    <Bullet text="Legal authorities: If required by law or court order." isDark={isDark} />
                </Section>

                <Section title="5. Data Retention" isDark={isDark}>
                    <Para text="We retain your data as long as your account is active. You can delete your account at any time from Settings → Account → Delete Account. Upon deletion, we remove your personal data within 30 days, except where retention is required by law." isDark={isDark} />
                </Section>

                <Section title="6. Security" isDark={isDark}>
                    <Para text="We implement industry-standard security measures including HTTPS encryption for all data transfer, secure password hashing, and access controls. However, no method of transmission over the internet is 100% secure." isDark={isDark} />
                </Section>

                <Section title="7. Children's Privacy" isDark={isDark}>
                    <Para
                        text={`${APP_NAME} can be used by children; however, we prioritize safety and privacy for younger users. We do not knowingly collect sensitive personal information from children without parental or guardian consent. Parents or guardians are encouraged to monitor their child's use of the app. If you believe that a child has provided personal information without consent, please contact us and we will take appropriate action.`}
                        isDark={isDark}
                    />
                </Section>

                <Section title="8. Your Rights" isDark={isDark}>
                    <Para text="You have the right to:" isDark={isDark} />
                    <Bullet text="Access the personal data we hold about you." isDark={isDark} />
                    <Bullet text="Request correction of inaccurate data." isDark={isDark} />
                    <Bullet text="Request deletion of your account and data." isDark={isDark} />
                    <Bullet text="Opt out of non-essential notifications." isDark={isDark} />
                    <Bullet text="Withdraw location permission at any time via device settings." isDark={isDark} />
                </Section>

                <Section title="9. Changes to This Policy" isDark={isDark}>
                    <Para text="We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or via email. Continued use of the app after changes means you accept the updated policy." isDark={isDark} />
                </Section>

                <Section title="10. Contact Us" isDark={isDark}>
                    <Para text="If you have any questions about this Privacy Policy, please contact us:" isDark={isDark} />
                    <TouchableOpacity onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
                        <Text style={[styles.emailLink, { color: isDark ? '#60a5fa' : '#2563EB' }]}>
                            📧 {CONTACT_EMAIL}
                        </Text>
                    </TouchableOpacity>
                </Section>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    },
    backBtn: { width: 40, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    content: { paddingHorizontal: 20, paddingTop: 20 },
    effectiveBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
        borderWidth: 1, marginBottom: 20,
    },
    effectiveText: { fontSize: 13, fontWeight: '600' },
    intro: { fontSize: 15, lineHeight: 24, marginBottom: 24 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    para: { fontSize: 14, lineHeight: 22, marginBottom: 8 },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, paddingRight: 8 },
    bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7, marginRight: 10, flexShrink: 0 },
    bulletText: { flex: 1, fontSize: 14, lineHeight: 22 },
    emailLink: { fontSize: 15, fontWeight: '600', marginTop: 8, textDecorationLine: 'underline' },
});

export default PrivacyPolicy;
