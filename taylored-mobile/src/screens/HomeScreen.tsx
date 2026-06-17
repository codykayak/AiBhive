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
import { ScreenLayout } from '../components/ScreenLayout';
import { useTabBarPadding } from '../components/TabScreenContainer';
import { dexInputBarStyle, keyboardAvoidBehavior, keyboardVerticalOffset, useKeyboardInset } from '../hooks/useKeyboardInset';
import { getActiveLlmConfig, loadAiPrefs, sendChatMessage } from '../lib/ai';
import { loadAiBehavior } from '../lib/aiBehavior';
import { triageLocally, localTaskToHiveTask } from '../lib/hiveBrain';
import { dingFeatureReady, ensureNotificationPermission } from '../lib/notifications';
import { AI_PROVIDERS } from '../constants/providers';
import {
  approveHiveTask,
  createHiveTask,
  getHiveStatus,
  getHiveTask,
  getOrCreateHiveUserId,
  type HiveTask,
} from '../lib/hiveApi';
import { HIVE_COPY, formatEstimateCard } from '../constants/hiveCopy';
import { fetchHiveAccount, ensureCreditsForTask, openAddCredits } from '../lib/hiveAccount';
import { colors, radii, spacing } from '../theme/colors';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  task?: HiveTask;
};

export default function HomeScreen() {
  const tabBarPadding = useTabBarPadding(12);
  const { bottomPad: keyboardPad, isWide, keyboardHeight } = useKeyboardInset(0);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: HIVE_COPY.welcome,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeLabel, setActiveLabel] = useState('Gemini');
  const [magicMode, setMagicMode] = useState(true);
  const [hiveStatus, setHiveStatus] = useState<string>('');
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void ensureNotificationPermission();
    getHiveStatus().then((s) => {
      if (s) setHiveStatus(s.message);
    });
    fetchHiveAccount().then((a) => {
      if (a) setCreditBalance(a.creditBalanceUsd);
    });
  }, []);

  useEffect(() => {
    const refresh = async () => {
      const prefs = await loadAiPrefs();
      const def = AI_PROVIDERS.find((p) => p.id === prefs.activeProviderId);
      if (def) setActiveLabel(def.label);
    };
    refresh();
    const interval = setInterval(refresh, 3000);
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
            void dingFeatureReady();
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
      let taskId = task.id;
      if (task.source === 'local' || !taskId.startsWith('hive_')) {
        const userId = await getOrCreateHiveUserId();
        const serverTask = await createHiveTask(task.buildPrompt || task.message, userId);
        taskId = serverTask.id;
      }

      const cost = task.estimate?.costUsd ?? 0;
      const pay = await ensureCreditsForTask(taskId, cost);
      if (!pay.ok) {
        updateMessageTask(task.id, {
          ...task,
          reply: HIVE_COPY.needCredits(pay.amountUsd),
        });
        return;
      }
      if (pay.creditBalanceUsd !== undefined) setCreditBalance(pay.creditBalanceUsd);

      const userId = await getOrCreateHiveUserId();
      const approved = await approveHiveTask(taskId, userId);
      updateMessageTask(task.id, { ...approved, id: taskId, source: 'server' });
      startPolling(taskId);
      fetchHiveAccount().then((a) => {
        if (a) setCreditBalance(a.creditBalanceUsd);
      });
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

  const runLocalChat = async (userMsg: Message) => {
    const config = await getActiveLlmConfig();
    if (!config) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'ai',
          content: 'Enable a provider in Settings, add an API key, and set it as active.',
        },
      ]);
      return;
    }

    const behavior = await loadAiBehavior();
    const history = messages
      .filter((m) => m.id !== '1' && !m.task)
      .map((m) => ({ role: m.role, content: m.content }));

    const reply = await sendChatMessage(config, history, userMsg.content, {
      behavior,
      magicMode,
    });
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'ai',
        content: reply,
      },
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
        const userId = await getOrCreateHiveUserId();
        let task: HiveTask;
        try {
          task = { ...(await createHiveTask(userMsg.content, userId)), source: 'server' };
        } catch {
          const config = await getActiveLlmConfig();
          if (!config) throw new Error('No API key');
          const partial = await triageLocally(config, userMsg.content);
          task = { ...localTaskToHiveTask(userMsg.content, partial), source: 'local' };
        }
        const aiMsg: Message = {
          id: `${Date.now()}_ai`,
          role: 'ai',
          content: task.reply || task.summary || 'Working on it…',
          task,
        };
        setMessages((prev) => [...prev, aiMsg]);
        if (task.status === 'building') startPolling(task.id);
        return;
      }
      await runLocalChat(userMsg);
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
          ? HIVE_COPY.magicOnSubtitle(activeLabel, hiveStatus)
          : HIVE_COPY.magicOffSubtitle(activeLabel)}
      </Text>
      {creditBalance !== null && (
        <TouchableOpacity onPress={() => void openAddCredits()} style={styles.creditRow}>
          <Text style={styles.creditText}>{HIVE_COPY.balanceLabel(creditBalance)}</Text>
          <Text style={styles.creditAdd}>+ Add</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={keyboardAvoidBehavior()}
        keyboardVerticalOffset={keyboardVerticalOffset(isWide)}
      >
        <ScrollView
          style={styles.chatContainer}
          contentContainerStyle={[styles.chatContent, { paddingBottom: Math.max(bottomPad, 24) }]}
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
                  <Text style={styles.approvalTitle}>{HIVE_COPY.approveTitle}</Text>
                  <Text style={styles.approvalMeta}>
                    {formatEstimateCard(msg.task.estimate.costUsd, msg.task.estimate.minutes)}
                  </Text>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApprove(msg.task!)}
                    disabled={isLoading}
                  >
                    <Text style={styles.approveBtnText}>{HIVE_COPY.approveButton}</Text>
                  </TouchableOpacity>
                </View>
              )}
              {msg.task?.status === 'building' && (
                <View style={styles.buildingRow}>
                  <ActivityIndicator color={colors.amberLight} size="small" />
                  <Text style={styles.buildingText}>{HIVE_COPY.building}</Text>
                </View>
              )}
              {msg.task?.status === 'complete' && (
                <View style={styles.doneCard}>
                  <Text style={styles.doneText}>{HIVE_COPY.done}</Text>
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

        <View style={[styles.inputContainer, dexInputBarStyle(keyboardHeight > 0), { paddingBottom: keyboardHeight > 0 ? keyboardPad : 12 }]}>
          <TextInput
            style={[styles.input, isWide && styles.inputWide]}
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
    marginBottom: spacing.sm,
    marginTop: 4,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingVertical: 6,
  },
  creditText: {
    color: colors.amberLight,
    fontWeight: '700',
    fontSize: 13,
  },
  creditAdd: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
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
    borderColor: colors.amber,
  },
  inputWide: {
    minHeight: 52,
    fontSize: 17,
    maxHeight: 140,
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
