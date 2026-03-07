
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { post } from '../../services/api';

const { width } = Dimensions.get('window');

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

const WELCOME_MSG: Message = {
    id: 'welcome',
    role: 'model',
    text: '👋 আমি **FlyBot** — FlyBook-এর AI সহকারী!\n\nFlyBook অ্যাপ নিয়ে যেকোনো প্রশ্ন করুন। আমি সাহায্য করতে সদা প্রস্তুত।\n\n💡 যেমন:\n• "Wallet কীভাবে ব্যবহার করব?"\n• "পয়েন্ট কীভাবে ট্রান্সফার করব?"\n• "Partner Shops কী?"',
    timestamp: new Date(),
};

const QUICK_QUESTIONS = [
    'FlyBook কী?',
    'পয়েন্ট কীভাবে পাব?',
    'Cash Withdraw কীভাবে?',
    'Partner Shops কোথায়?',
];

const AiAssistantScreen = () => {
    const { isDark } = useTheme();
    const navigation = useNavigation();
    const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const bg = isDark ? '#0f172a' : '#f0f4ff';
    const card = isDark ? '#1e293b' : '#ffffff';
    const text = isDark ? '#f1f5f9' : '#1e293b';
    const sub = isDark ? '#64748b' : '#94a3b8';

    useEffect(() => {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages]);

    const sendMessage = async (msgText?: string) => {
        const query = (msgText || inputText).trim();
        if (!query || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: query,
            timestamp: new Date(),
        };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInputText('');
        setIsLoading(true);

        try {
            // Build history (exclude welcome, include only past exchanges)
            const history = newMessages
                .filter(m => m.id !== 'welcome')
                .slice(0, -1) // Exclude the just-added user message
                .map(m => ({ role: m.role, text: m.text }));

            const response = await post<{ success: boolean; reply: string }>('/api/ai-assistant', {
                message: query,
                history,
            });

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: response?.reply || 'দুঃখিত, উত্তর দিতে পারছি না।',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMsg]);
        } catch {
            const errMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: '⚠️ সার্ভারের সাথে সংযোগ করতে পারছি না। একটু পরে চেষ্টা করুন।',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderBubble = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';
        return (
            <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.botWrapper]}>
                {!isUser && (
                    <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.botAvatar}>
                        <Ionicons name="sparkles" size={14} color="#fff" />
                    </LinearGradient>
                )}
                <View style={[
                    styles.bubble,
                    isUser
                        ? { backgroundColor: '#4f46e5', borderBottomRightRadius: 4 }
                        : { backgroundColor: card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0' },
                ]}>
                    <Text style={[styles.bubbleText, { color: isUser ? '#fff' : text }]}>
                        {item.text}
                    </Text>
                    <Text style={[styles.timeText, { color: isUser ? 'rgba(255,255,255,0.5)' : sub }]}>
                        {item.timestamp.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                {isUser && (
                    <View style={[styles.userAvatar, { backgroundColor: '#e0e7ff' }]}>
                        <Ionicons name="person" size={14} color="#4f46e5" />
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

            {/* Header */}
            <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.headerAvatarBox}>
                        <Ionicons name="sparkles" size={20} color="#6366f1" />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>FlyBot</Text>
                        <Text style={styles.headerSub}>FlyBook AI Assistant</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => setMessages([WELCOME_MSG])}
                    style={styles.clearBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderBubble}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                    isLoading ? (
                        <View style={[styles.bubbleWrapper, styles.botWrapper]}>
                            <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.botAvatar}>
                                <Ionicons name="sparkles" size={14} color="#fff" />
                            </LinearGradient>
                            <View style={[styles.bubble, { backgroundColor: card, borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0', borderBottomLeftRadius: 4, flexDirection: 'row', gap: 6, alignItems: 'center' }]}>
                                <ActivityIndicator size="small" color="#6366f1" />
                                <Text style={{ color: sub, fontSize: 13 }}>FlyBot লিখছে...</Text>
                            </View>
                        </View>
                    ) : null
                }
            />

            {/* Quick Questions (show only at start) */}
            {messages.length === 1 && (
                <View style={styles.quickContainer}>
                    <FlatList
                        horizontal
                        data={QUICK_QUESTIONS}
                        keyExtractor={(_, i) => i.toString()}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.quickChip, { backgroundColor: card, borderColor: isDark ? '#334155' : '#e2e8f0' }]}
                                onPress={() => sendMessage(item)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.quickChipText, { color: '#6366f1' }]}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Input Bar */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                <View style={[styles.inputBar, { backgroundColor: card, borderTopColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                    <TextInput
                        style={[styles.input, { color: text, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}
                        placeholder="FlyBook নিয়ে কিছু জিজ্ঞাসা করুন..."
                        placeholderTextColor={sub}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                        onSubmitEditing={() => sendMessage()}
                        returnKeyType="send"
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, { opacity: inputText.trim() ? 1 : 0.4 }]}
                        onPress={() => sendMessage()}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.sendBtnInner}>
                            <Ionicons name="send" size={18} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        paddingTop: Platform.OS === 'android' ? 50 : 14,
        gap: 12,
    },
    backBtn: { padding: 4 },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerAvatarBox: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
    headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500' },
    clearBtn: { padding: 4 },

    messageList: { padding: 16, paddingBottom: 8 },

    bubbleWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 12,
        gap: 8,
    },
    userWrapper: { justifyContent: 'flex-end' },
    botWrapper: { justifyContent: 'flex-start' },

    botAvatar: {
        width: 30, height: 30, borderRadius: 15,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    userAvatar: {
        width: 30, height: 30, borderRadius: 15,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },

    bubble: {
        maxWidth: width * 0.72,
        padding: 12,
        borderRadius: 18,
    },
    bubbleText: { fontSize: 14, lineHeight: 21 },
    timeText: { fontSize: 10, marginTop: 4, textAlign: 'right' },

    quickContainer: { paddingVertical: 10 },
    quickChip: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 100, borderWidth: 1,
    },
    quickChipText: { fontSize: 13, fontWeight: '600' },

    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        gap: 10,
    },
    input: {
        flex: 1,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        maxHeight: 120,
    },
    sendBtn: {},
    sendBtnInner: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
    },
});

export default AiAssistantScreen;
