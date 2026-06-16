import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Send, Sparkles } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScreenLayout } from '../components/ScreenLayout';
import { useTabBarPadding } from '../components/TabScreenContainer';
import { GEMINI_MODEL } from '../lib/ai';
import { colors, radii, spacing } from '../theme/colors';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

export default function HomeScreen() {
  const tabBarPadding = useTabBarPadding(12);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: 'Welcome to AiBhive Mobile. I can help you brainstorm applications, outreach, and career moves. Add your Gemini API key in Settings to get started.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState('Gemini');

  useEffect(() => {
    const checkProvider = async () => {
      const p = await SecureStore.getItemAsync('selected_ai_provider');
      if (p) setProvider(p);
    };
    checkProvider();
    const interval = setInterval(checkProvider, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputText.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const apiKey = await SecureStore.getItemAsync(`api_key_${provider.toLowerCase()}`);
      if (!apiKey) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'ai',
            content: `Add your ${provider} API key in Settings to unlock the hive.`,
          },
        ]);
        return;
      }

      if (provider === 'Gemini') {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const chat = model.startChat({
          history: messages
            .filter((m) => m.id !== '1')
            .map((m) => ({
              role: m.role === 'ai' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
        });

        const result = await chat.sendMessage(userMsg.content);
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'ai', content: result.response.text() },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'ai',
            content: `${provider} support is coming soon. Switch to Gemini in Settings for full chat.`,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'ai',
          content: 'Connection failed. Double-check your API key in Settings.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const bottomPad = tabBarPadding;

  return (
    <ScreenLayout showBrand={false} contentStyle={styles.screenContent}>
      <View style={styles.hero}>
        <Sparkles color={colors.amberLight} size={18} />
        <Text style={styles.heroTitle}>AiBhive Assistant</Text>
      </View>
      <Text style={styles.heroSubtitle}>Your pocket career co-pilot</Text>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.chatContainer}
          contentContainerStyle={[styles.chatContent, { paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}
            >
              <Text style={[styles.messageText, msg.role === 'user' && styles.userText]}>{msg.content}</Text>
            </View>
          ))}
          {isLoading && (
            <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
              <ActivityIndicator color={colors.amberLight} />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask anything..."
            placeholderTextColor={colors.textDim}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isLoading}>
            <Send color={colors.black} size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: spacing.md,
  },
  flex: { flex: 1 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
  },
  heroTitle: {
    color: colors.amberLight,
    fontSize: 24,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginTop: 4,
  },
  chatContainer: { flex: 1 },
  chatContent: { paddingTop: spacing.sm },
  messageBubble: {
    maxWidth: '88%',
    padding: 14,
    borderRadius: radii.md,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: colors.amber,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.bgCard,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  loadingBubble: { alignSelf: 'flex-start' },
  messageText: { color: colors.text, fontSize: 16, lineHeight: 22 },
  userText: { color: colors.black, fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row',
    paddingTop: 12,
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    color: colors.text,
    borderRadius: radii.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 110,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  sendButton: {
    backgroundColor: colors.amber,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
