import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Vibration,
  Image,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Send, Sparkles, Wand2, Grid, Zap, Trash2, ImagePlus, X } from 'lucide-react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { HiveLogo } from '../components/HiveLogo';
import { QuickPrompts } from '../components/QuickPrompts';
import { GlassCard, PrimaryButton, StatusPill } from '../components/ui';
import { useTabBarPadding } from '../components/TabScreenContainer';
import { useToast } from '../contexts/ToastContext';
import {
  dexInputBarStyle,
  keyboardAvoidBehavior,
  keyboardVerticalOffset,
  useKeyboardInset,
} from '../hooks/useKeyboardInset';
import { getActiveLlmConfig, loadAiPrefs, sendChatMessage } from '../lib/ai';
import { loadAiBehavior } from '../lib/aiBehavior';
import { triageLocally, localTaskToHiveTask } from '../lib/hiveBrain';
import { dingFeatureReady, ensureNotificationPermission, registerExpoPushToken } from '../lib/notifications';
import { AI_PROVIDERS } from '../constants/providers';
import {
  approveHiveTask,
  createHiveTask,
  getHiveStatus,
  getHiveTask,
  getOrCreateHiveUserId,
  type HiveTask,
} from '../lib/hiveApi';
import { getAutoApproveUnderUsd } from '../lib/hivePreferences';
import { HIVE_COPY, formatEstimateCard } from '../constants/hiveCopy';
import { fetchHiveAccount, ensureCreditsForTask, openAddCredits } from '../lib/hiveAccount';
import { loadChatHistory, saveChatHistory, clearChatHistory, type StoredChatMessage } from '../lib/chatHistory';
import { upsertHiveAppFromTask, pruneNonBuildApps } from '../lib/hiveApps';
import { pickHiveReferenceImage, type HiveAttachment } from '../lib/hiveAttachments';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { shadows } from '../theme/shadows';

type Message = StoredChatMessage;

const WELCOME: Message = {
  id: 'welcome',
  role: 'ai',
  content: HIVE_COPY.welcome,
  at: new Date().toISOString(),
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { showToast } = useToast();
  const tabBarPadding = useTabBarPadding(12);
  const { bottomPad: keyboardPad, isWide, keyboardHeight } = useKeyboardInset(0);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeLabel, setActiveLabel] = useState('Gemini');
  const [magicMode, setMagicMode] = useState(true);
  const [hiveOnline, setHiveOnline] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<HiveAttachment | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hydrated = useRef(false);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 280);
  }, []);

  const dismissComposer = useCallback(() => {
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const persistMessages = useCallback(async (next: Message[]) => {
    if (!hydrated.current) return;
    await saveChatHistory(next.filter((m) => m.id !== 'welcome'));
  }, []);

  const setMessagesAndSave = useCallback(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      setMessages((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        void persistMessages(next);
        return next;
      });
      scrollToEnd();
    },
    [persistMessages, scrollToEnd]
  );

  useEffect(() => {
    void ensureNotificationPermission().then(() => {
      void registerExpoPushToken();
    });
    getHiveStatus().then((s) => {
      if (s) setHiveOnline(s.online);
    });
    fetchHiveAccount().then((a) => {
      if (a) setCreditBalance(a.creditBalanceUsd);
    });
    void pruneNonBuildApps();
    loadChatHistory().then((saved) => {
      if (saved?.length) setMessages([WELCOME, ...saved]);
      hydrated.current = true;
    });
  }, []);

  useEffect(() => {
    const refresh = async () => {
      const prefs = await loadAiPrefs();
      const def = AI_PROVIDERS.find((p) => p.id === prefs.activeProviderId);
      if (def) setActiveLabel(def.label);
    };
    refresh();
    const interval = setInterval(refresh, 5000);
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

  const syncTaskToApps = useCallback(async (task: HiveTask, prompt?: string) => {
    if (task.status === 'building' || task.status === 'complete' || task.status === 'failed') {
      await upsertHiveAppFromTask(task, prompt);
    }
  }, []);

  const updateMessageTask = useCallback(
    (taskId: string, task: HiveTask, prompt?: string) => {
      setMessagesAndSave((prev) =>
        prev.map((m) =>
          m.task?.id === taskId ? { ...m, content: task.reply || m.content, task } : m
        )
      );
      void syncTaskToApps(task, prompt);
    },
    [setMessagesAndSave, syncTaskToApps]
  );

  const startPolling = useCallback(
    (taskId: string, prompt?: string) => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const task = await getHiveTask(taskId);
          updateMessageTask(taskId, task, prompt);
          if (task.status === 'complete') {
            dingReady();
            void dingFeatureReady();
            showToast('Your app is ready — check My Apps', 'success');
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (task.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {
          // server may still be deploying
        }
      }, 6000);
    },
    [dingReady, showToast, updateMessageTask]
  );

  const handleApprove = async (task: HiveTask, prompt?: string) => {
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
        updateMessageTask(task.id, { ...task, reply: HIVE_COPY.needCredits(pay.amountUsd) }, prompt);
        return;
      }
      if (pay.creditBalanceUsd !== undefined) setCreditBalance(pay.creditBalanceUsd);

      const userId = await getOrCreateHiveUserId();
      const approved = await approveHiveTask(taskId, userId);
      const merged = { ...approved, id: taskId, source: 'server' as const };
      updateMessageTask(task.id, merged, prompt);
      startPolling(taskId, prompt);
      fetchHiveAccount().then((a) => {
        if (a) setCreditBalance(a.creditBalanceUsd);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not start build';
      updateMessageTask(task.id, { ...task, status: 'failed', reply: msg }, prompt);
    } finally {
      setIsLoading(false);
    }
  };

  const runLocalChat = async (userMsg: Message) => {
    const config = await getActiveLlmConfig();
    if (!config) {
      setMessagesAndSave((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'ai',
          content: 'Enable a provider in Settings, add an API key, and set it as active.',
          at: new Date().toISOString(),
        },
      ]);
      return;
    }

    const behavior = await loadAiBehavior();
    const history = messages
      .filter((m) => m.id !== 'welcome' && !m.task)
      .map((m) => ({ role: m.role, content: m.content }));

    const reply = await sendChatMessage(config, history, userMsg.content, { behavior, magicMode });
    setMessagesAndSave((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'ai', content: reply, at: new Date().toISOString() },
    ]);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      at: new Date().toISOString(),
    };
    setMessagesAndSave((prev) => [...prev, userMsg]);
    setInputText('');
    dismissComposer();
    setIsLoading(true);

    try {
      if (magicMode) {
        const userId = await getOrCreateHiveUserId();
        let task: HiveTask;
        try {
          task = {
            ...(await createHiveTask(
              trimmed,
              userId,
              pendingAttachment
                ? {
                    base64: pendingAttachment.base64,
                    mimeType: pendingAttachment.mimeType,
                    width: pendingAttachment.width,
                    height: pendingAttachment.height,
                  }
                : undefined
            )),
            source: 'server',
          };
        } catch {
          const config = await getActiveLlmConfig();
          if (!config) throw new Error('No API key');
          const partial = await triageLocally(config, trimmed);
          task = { ...localTaskToHiveTask(trimmed, partial), source: 'local' };
        }
        const aiMsg: Message = {
          id: `${Date.now()}_ai`,
          role: 'ai',
          content: task.reply || task.summary || 'Working on it…',
          task,
          at: new Date().toISOString(),
        };
        setMessagesAndSave((prev) => [...prev, aiMsg]);
        setPendingAttachment(null);
        dismissComposer();
        if (task.status === 'building') startPolling(task.id, trimmed);

        // Instant spec build — already complete, just open it.
        if (
          task.status === 'complete' &&
          task.deliverable &&
          (task.deliverable as any).kind === 'spec_app' &&
          (task.deliverable as any).appId
        ) {
          const appId = (task.deliverable as any).appId;
          dingReady();
          void dingFeatureReady('Your app is ready', task.title || 'Open it from My Apps.');
          showToast('App ready — tap to open', 'success');
          setTimeout(() => navigation.navigate('DynamicApp', { appId }), 400);
        }

        if (task.status === 'awaiting_approval' && task.estimate) {
          const cap = await getAutoApproveUnderUsd();
          const cost = task.estimate.costUsd ?? 0;
          if (cap > 0 && cost > 0 && cost <= cap) {
            void handleApprove(task, trimmed);
          }
        }
        return;
      }
      await runLocalChat(userMsg);
    } catch {
      setMessagesAndSave((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'ai',
          content: 'Connection failed. Check your API key in Settings.',
          at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    await clearChatHistory();
    setMessages([WELCOME]);
    showToast(HIVE_COPY.chatCleared);
  };

  return (
    <ScreenLayout contentStyle={styles.screenContent} compactBadge>
      <View style={styles.heroBlock}>
        <View style={styles.heroLeft}>
          <HiveLogo size={48} glow animate={magicMode} />
          <View style={styles.heroText}>
            <View style={styles.titleRow}>
              <Text style={styles.heroTitle}>Hive Magic</Text>
              {hiveOnline && (
                <View style={styles.livePill}>
                  <Zap color={colors.success} size={10} />
                  <Text style={styles.liveText}>Live</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroSubtitle} numberOfLines={2}>
              {magicMode
                ? HIVE_COPY.magicOnSubtitle(activeLabel)
                : HIVE_COPY.magicOffSubtitle(activeLabel)}
            </Text>
          </View>
        </View>
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={[styles.magicToggle, magicMode && styles.magicToggleOn]}
            onPress={() => setMagicMode((v) => !v)}
          >
            <Wand2 color={magicMode ? colors.black : colors.amberLight} size={16} />
            <Text style={[styles.magicToggleText, magicMode && styles.magicToggleTextOn]}>
              {magicMode ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void handleClearChat()} style={styles.iconBtn}>
            <Trash2 color={colors.textDim} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {creditBalance !== null && (
        <TouchableOpacity onPress={() => void openAddCredits()} style={styles.creditCard} activeOpacity={0.9}>
          <Text style={styles.creditText}>{HIVE_COPY.balanceLabel(creditBalance)}</Text>
          <Text style={styles.creditAdd}>+ Add credits</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={keyboardAvoidBehavior()}
        keyboardVerticalOffset={keyboardVerticalOffset(isWide)}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatContainer}
          contentContainerStyle={[styles.chatContent, { paddingBottom: Math.max(tabBarPadding, 24) }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={scrollToEnd}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={styles.msgWrap}>
              {msg.role === 'ai' && msg.id !== 'welcome' && (
                <View style={styles.aiAvatar}>
                  <Sparkles color={colors.amber} size={12} />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                  msg.id === 'welcome' && styles.welcomeBubble,
                ]}
              >
                <Text style={[styles.messageText, msg.role === 'user' && styles.userText]}>{msg.content}</Text>
              </View>

              {msg.task?.status === 'awaiting_approval' && msg.task.estimate && (
                <GlassCard style={styles.approvalCard} glow>
                  <Text style={styles.approvalTitle}>{HIVE_COPY.approveTitle}</Text>
                  <Text style={styles.approvalMeta}>
                    {formatEstimateCard(msg.task.estimate.costUsd, msg.task.estimate.minutes)}
                  </Text>
                  <PrimaryButton
                    label={HIVE_COPY.approveButton}
                    onPress={() => handleApprove(msg.task!, msg.task?.message)}
                    disabled={isLoading}
                    icon={Wand2}
                  />
                </GlassCard>
              )}

              {msg.task?.status === 'building' && (
                <View style={styles.buildingCard}>
                  <ActivityIndicator color={colors.amberLight} size="small" />
                  <Text style={styles.buildingText}>{HIVE_COPY.building}</Text>
                  <StatusPill label="In progress" tone="amber" />
                </View>
              )}

              {msg.task?.status === 'complete' && (
                <GlassCard style={styles.doneCard} glow>
                  <Text style={styles.doneText}>{HIVE_COPY.done}</Text>
                  <PrimaryButton
                    label="Open My Apps"
                    variant="secondary"
                    icon={Grid}
                    onPress={() => navigation.navigate('Apps')}
                    style={styles.doneBtn}
                  />
                </GlassCard>
              )}

              {msg.task?.status === 'failed' && (
                <View style={styles.failedCard}>
                  <Text style={styles.failedText}>{msg.task.reply || HIVE_COPY.buildFailed}</Text>
                </View>
              )}
            </View>
          ))}

          {isLoading && (
            <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
              <ActivityIndicator color={colors.amberLight} />
              <Text style={styles.typingText}>Thinking…</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.composer}>
          {magicMode && !isLoading && (
            <QuickPrompts
              prompts={HIVE_COPY.quickPrompts}
              onSelect={(p) => void sendMessage(p)}
              disabled={isLoading}
            />
          )}
          {pendingAttachment && (
            <View style={styles.attachPreview}>
              <Image source={{ uri: pendingAttachment.uri }} style={styles.attachThumb} />
              <Text style={styles.attachLabel}>Reference image attached</Text>
              <TouchableOpacity onPress={() => setPendingAttachment(null)} hitSlop={12}>
                <X color={colors.textDim} size={18} />
              </TouchableOpacity>
            </View>
          )}
          <View
            style={[
              styles.inputContainer,
              dexInputBarStyle(keyboardHeight > 0),
              { paddingBottom: keyboardHeight > 0 ? keyboardPad : 12 },
            ]}
          >
            {magicMode && (
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={() => void pickHiveReferenceImage().then((a) => a && setPendingAttachment(a))}
                disabled={isLoading}
                accessibilityLabel={HIVE_COPY.attachImage}
              >
                <ImagePlus color={colors.amberLight} size={22} />
              </TouchableOpacity>
            )}
            <TextInput
              ref={inputRef}
              style={[styles.input, isWide && styles.inputWide]}
              placeholder={magicMode ? 'Describe what to build…' : 'Ask anything…'}
              placeholderTextColor={colors.textDim}
              value={inputText}
              onChangeText={setInputText}
              multiline
              blurOnSubmit
              onSubmitEditing={() => {
                if (inputText.trim()) void sendMessage(inputText);
              }}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendDisabled]}
              onPress={() => void sendMessage(inputText)}
              disabled={isLoading || !inputText.trim()}
            >
              <Send color={colors.black} size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: spacing.md },
  flex: { flex: 1 },
  heroBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    gap: 8,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  heroText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  heroTitle: { ...typography.h2, color: colors.amberLight },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  liveText: { color: colors.success, fontSize: 10, fontWeight: '800' },
  heroSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2, lineHeight: 18 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  magicToggleOn: { backgroundColor: colors.amber, borderColor: colors.amber, ...shadows.amber },
  magicToggleText: { color: colors.amberLight, fontWeight: '800', fontSize: 12 },
  magicToggleTextOn: { color: colors.black },
  iconBtn: { padding: 8 },
  creditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.amberSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  creditText: { color: colors.amberLight, fontWeight: '800', fontSize: 14 },
  creditAdd: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  chatContainer: { flex: 1 },
  chatContent: { paddingTop: spacing.xs },
  msgWrap: { marginBottom: 14 },
  aiAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    maxWidth: '90%',
    padding: 14,
    borderRadius: radii.lg,
  },
  welcomeBubble: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgElevated,
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: colors.amber,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
    ...shadows.amber,
  },
  aiBubble: {
    backgroundColor: colors.bgCard,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typingText: { color: colors.textMuted, fontSize: 14 },
  messageText: { color: colors.text, fontSize: 16, lineHeight: 24 },
  userText: { color: colors.black, fontWeight: '600' },
  approvalCard: { marginTop: 8, maxWidth: '92%', alignSelf: 'flex-start', gap: 8 },
  approvalTitle: { color: colors.amberLight, fontWeight: '800', fontSize: 16 },
  approvalMeta: { color: colors.textMuted, marginBottom: 4, fontSize: 15 },
  buildingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginLeft: 4,
    flexWrap: 'wrap',
  },
  buildingText: { color: colors.textMuted, fontSize: 14 },
  doneCard: { marginTop: 8, maxWidth: '92%', alignSelf: 'flex-start', gap: 10 },
  doneText: { color: colors.amberLight, fontWeight: '700', fontSize: 15 },
  doneBtn: { alignSelf: 'flex-start', paddingHorizontal: 20 },
  failedCard: {
    marginTop: 8,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
    maxWidth: '90%',
  },
  failedText: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  composer: { paddingTop: 4 },
  attachPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    padding: 8,
    borderRadius: radii.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  attachThumb: { width: 44, height: 44, borderRadius: 8 },
  attachLabel: { flex: 1, color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  attachBtn: { paddingHorizontal: 4, paddingVertical: 8, justifyContent: 'center' },
  inputContainer: {
    flexDirection: 'row',
    paddingTop: 8,
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
    maxHeight: 120,
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputWide: { minHeight: 54, fontSize: 17, maxHeight: 140 },
  sendButton: {
    backgroundColor: colors.amber,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.amber,
  },
  sendDisabled: { opacity: 0.45 },
});
