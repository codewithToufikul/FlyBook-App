import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Platform,
    StatusBar,
    LayoutAnimation,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

const HelpCenter = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const categories = [
        { id: 1, title: 'General', icon: 'help-circle-outline', color: '#3b82f6' },
        { id: 2, title: 'Account', icon: 'person-outline', color: '#10b981' },
        { id: 3, title: 'Courses', icon: 'book-outline', color: '#8b5cf6' },
        { id: 4, title: 'Payment', icon: 'card-outline', color: '#f59e0b' },
    ];

    const faqs = [
        {
            id: 1,
            question: 'How do I start a new course?',
            answer: 'To start a new course, go to the Home screen, browse through the available categories or use the search bar. Once you find a course you like, click on it and press the "Enroll Now" button.'
        },
        {
            id: 2,
            question: 'Can I download videos for offline viewing?',
            answer: 'Yes! Most of our courses support offline viewing. Look for the download icon next to each lesson video. Once downloaded, you can find them in your "Downloads" tab.'
        },
        {
            id: 3,
            question: 'How do I reset my password?',
            answer: 'Go to Settings > Security & Privacy > Change Password. If you forgot your current password, you can use the "Forgot Password" link on the login screen.'
        },
        {
            id: 4,
            question: 'Is there a refund policy?',
            answer: 'We offer a 7-day money-back guarantee for most courses. If you are not satisfied, please contact our support team with your order details.'
        }
    ];

    const toggleFaq = (id: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedFaq(expandedFaq === id ? null : id);
    };

    return (
        <View className="flex-1 bg-gray-50" style={[isDark && { backgroundColor: '#0f172a' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Header with Search */}
            <LinearGradient
                colors={isDark ? ['#1e293b', '#0f172a'] : ['#3b82f6', '#2563eb']}
                style={{ paddingTop: insets.top + 10, paddingBottom: 30 }}
                className="px-6 rounded-b-[40px] shadow-lg"
            >
                <View className="flex-row items-center justify-between mb-6">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-10 h-10 items-center justify-center bg-white/20 rounded-full"
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-white">Help Center</Text>
                    <View className="w-10" />
                </View>

                <View className="bg-white rounded-2xl flex-row items-center px-4 py-1 shadow-sm">
                    <Ionicons name="search-outline" size={20} color="#94A3B8" />
                    <TextInput
                        placeholder="How can we help you today?"
                        placeholderTextColor="#94A3B8"
                        className="flex-1 ml-2 h-12 text-gray-800"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Categories Grid */}
                <View className="px-6 mt-8">
                    <Text className="text-gray-800 text-lg font-bold mb-4" style={[isDark && { color: '#f8fafc' }]}>
                        Categories
                    </Text>
                    <View className="flex-row flex-wrap justify-between">
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                className="w-[48%] bg-white p-5 rounded-3xl mb-4 shadow-sm items-center box-border"
                                style={[isDark && { backgroundColor: '#1e293b' }]}
                            >
                                <View
                                    className="w-12 h-12 rounded-2xl items-center justify-center mb-3"
                                    style={{ backgroundColor: cat.color + '15' }}
                                >
                                    <Ionicons name={cat.icon} size={28} color={cat.color} />
                                </View>
                                <Text className="text-gray-800 font-bold" style={[isDark && { color: '#f8fafc' }]}>
                                    {cat.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* FAQ Section */}
                <View className="px-6 mt-4">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-gray-800 text-lg font-bold" style={[isDark && { color: '#f8fafc' }]}>
                            Popular FAQs
                        </Text>
                        <TouchableOpacity>
                            <Text className="text-blue-500 font-semibold">View All</Text>
                        </TouchableOpacity>
                    </View>

                    {faqs.map((faq) => (
                        <TouchableOpacity
                            key={faq.id}
                            onPress={() => toggleFaq(faq.id)}
                            activeOpacity={0.7}
                            className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm"
                            style={[isDark && { backgroundColor: '#1e293b' }]}
                        >
                            <View className="flex-row items-center justify-between p-4">
                                <Text className="text-gray-800 font-semibold flex-1 pr-4" style={[isDark && { color: '#f8fafc' }]}>
                                    {faq.question}
                                </Text>
                                <Ionicons
                                    name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={isDark ? '#64748b' : '#94a3b8'}
                                />
                            </View>
                            {expandedFaq === faq.id && (
                                <View className="px-4 pb-4 border-t border-gray-50" style={[isDark && { borderTopColor: '#334155' }]}>
                                    <Text className="text-gray-500 leading-relaxed mt-3" style={[isDark && { color: '#94a3b8' }]}>
                                        {faq.answer}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Contact Support Section */}
                <View className="mx-6 mt-8 p-6 bg-blue-50 rounded-[32px]" style={[isDark && { backgroundColor: '#1e293b' }]}>
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-3" style={[isDark && { backgroundColor: '#334155' }]}>
                            <Ionicons name="chatbubbles" size={32} color="#3b82f6" />
                        </View>
                        <Text className="text-gray-800 text-xl font-bold text-center" style={[isDark && { color: '#f8fafc' }]}>
                            Still need help?
                        </Text>
                        <Text className="text-gray-500 text-center mt-2" style={[isDark && { color: '#94a3b8' }]}>
                            Our support team is available 24/7 to assist you.
                        </Text>
                    </View>

                    <TouchableOpacity className="bg-blue-500 py-4 rounded-2xl flex-row items-center justify-center mb-3">
                        <Ionicons name="mail" size={20} color="#FFFFFF" />
                        <Text className="text-white font-bold text-base ml-2">Contact via Email</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-white py-4 rounded-2xl flex-row items-center justify-center border border-blue-100"
                        style={[isDark && { backgroundColor: 'transparent', borderColor: '#334155' }]}
                    >
                        <Ionicons name="logo-whatsapp" size={20} color="#10b981" />
                        <Text className="text-gray-700 font-bold text-base ml-2" style={[isDark && { color: '#f8fafc' }]}>
                            Live Chat on WhatsApp
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

export default HelpCenter;
