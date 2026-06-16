import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Vibration,
} from 'react-native';
import { Send, Sparkles, Wand2 } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScreenLayout } from '../components/ScreenLayout';
import { useTabBarPadding } from '../components/TabScreenContainer';
import { GEMINI_MODEL } from '../lib/ai';
import {
  approveHiveTask,
  createHiveTask,
  getHiveTask,
  getOrCreateHiveUserId,
  type HiveTask,
} from '../lib/hiveApi';
import { colors, radii, spacing } from '../theme/colors';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  task?: HiveTask;
};

export default function HomeScreen() {
  const tabBarPadding = useTabBarPadding(12);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content:
        'Welcome to Hive Magic. Describe any app, module, or feature in plain English — I estimate cost and time, you approve once, then wait for the ding. Try: "Build me a resume tailor for job postings."',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState('Gemini');
  const [magicMode, setMagicMode] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const checkProvider = async () => {
      const p = await SecureStore.getItemAsync('selected_ai_provider');
      if (p) setProvider(p);
    };
    checkProvider();
    const interval = setInterval(checkProvider, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const dingReady = useCallback(() => {
    Vibration.vibrate([0, 120, 80, 120]);
  }, []);

  const updateMessageTask = useCallback((taskId: string, task: HiveTask) => {
    setMessages((prev) =>
      prev.map((m) => (m.task?.id === taskId ? { ...m, content: task.reply || m.content, task } : m))
    );
  }, []);

  const startPolling = useCallback(
    (taskId: string) => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const task = await getHiveTask(taskId);
          updateMessageTask(taskId, task);
          if (task.status === 'complete') {
            dingReady();
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (task.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {
          // keep polling — server may still be deploying
        }
      }, 8000);
    },
    [dingReady, updateMessageTask]
  );

  const handleApprove = async (task: HiveTask) => {
    setIsLoading(true);
    try {
      const approved = await approveHiveTask(task.id);
      updateMessageTask(task.id, approved);
      startPolling(task.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not start build';
      updateMessageTask(task.id, {
        ...task,
        status: 'failed',
        reply: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runLocalGemini = async (userMsg: Message) => {
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

    if (provider !== 'Gemini') {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'ai',
          content: `${provider} support is coming soon. Switch to Gemini in Settings.`,
        },
      ]);
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const chat = model.startChat({
      history: messages
        .filter((m) => m.id !== '1' && !m.task)
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
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputText.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      if (magicMode) {
        try {
          const userId = await getOrCreateHiveUserId();
          const task = await createHiveTask(userMsg.content, userId);
          const aiMsg: Message = {
            id: `${Date.now()}_ai`,
            role: 'ai',
            content: task.reply || task.summary || 'Working on it…',
            task,
          };
          setMessages((prev) => [...prev, aiMsg]);
          if (task.status === 'building') startPolling(task.id);
          return;
        } catch {
          // Hive API not deployed yet — fall through to local Gemini
        }
      }
      await runLocalGemini(userMsg);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'ai',
          content: 'Connection failed. Check your API key in Settings.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const bottomPad = tabBarPadding;

  return (
    <ScreenLayout showBrand={false} contentStyle={styles.screenContent}>
      <View style={styles.heroRow}>
        <View style={styles.hero}>
          <Sparkles color={colors.amberLight} size={18} />
          <Text style={styles.heroTitle}>Hive Magic</Text>
        </View>
        <TouchableOpacity
          style={[styles.magicToggle, magicMode && styles.magicToggleOn]}
          onPress={() => setMagicMode((v) => !v)}
        >
          <Wand2 color={magicMode ? colors.black : colors.amberLight} size={16} />
          <Text style={[styles.magicToggleText, magicMode && styles.magicToggleTextOn]}>
            {magicMode ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.heroSubtitle}>
        {magicMode
          ? 'Ask for any feature — approve the estimate, then wait for the ding.'
          : 'Chat mode — Gemini only, no auto-build.'}
      </Text>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.chatContainer}
          contentContainerStyle={[styles.chatContent, { paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => (
            <View key={msg.id}>
              <View
                style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}
              >
                <Text style={[styles.messageText, msg.role === 'user' && styles.userText]}>{msg.content}</Text>
              </View>
              {msg.task?.status === 'awaiting_approval' && msg.task.estimate && (
                <View style={styles.approvalCard}>
                  <Text style={styles.approvalTitle}>Ready to build?</Text>
                  <Text style={styles.approvalMeta}>
                    ~${msg.task.estimate.costUsd} · ~{msg.task.estimate.minutes} min
                  </Text>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApprove(msg.task!)}
                    disabled={isLoading}
                  >
                    <Text style={styles.approveBtnText}>Approve & Build</Text>
                  </TouchableOpacity>
                </View>
              )}
              {msg.task?.status === 'building' && (
                <View style={styles.buildingRow}>
                  <ActivityIndicator color={colors.amberLight} size="small" />
                  <Text style={styles.buildingText}>Building your feature…</Text>
                </View>
              )}
              {msg.task?.status === 'complete' && (
                <View style={styles.doneCard}>
                  <Text style={styles.doneText}>✨ Ding! Your feature is ready.</Text>
                </View>
              )}
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
            placeholder={magicMode ? 'Describe a feature…' : 'Ask anything…'}
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
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    color: colors.amberLight,
    fontSize: 24,
    fontWeight: '800',
  },
  magicToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  magicToggleOn: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  magicToggleText: {
    color: colors.amberLight,
    fontWeight: '800',
    fontSize: 12,
  },
  magicToggleTextOn: {
    color: colors.black,
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
  approvalCard: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.amber,
    padding: 14,
    marginBottom: 12,
    marginTop: -4,
    maxWidth: '88%',
  },
  approvalTitle: {
    color: colors.amberLight,
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 4,
  },
  approvalMeta: {
    color: colors.textMuted,
    marginBottom: 12,
  },
  approveBtn: {
    backgroundColor: colors.amber,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  approveBtnText: {
    color: colors.black,
    fontWeight: '800',
    fontSize: 15,
  },
  buildingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginLeft: 4,
  },
  buildingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  doneCard: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  doneText: {
    color: colors.amberLight,
    fontWeight: '700',
  },
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
