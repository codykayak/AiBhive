import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Send,
  Sparkles,
  Briefcase,
  Radar,
  Wand2,
  X,
  ChevronDown,
} from 'lucide-react-native';
import { colors, radii, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { getActiveLlmConfig } from '../lib/settings';
import { sendHomeAssistantTurn, type HomeAssistantAction } from '../lib/homeAssistant';
import type { ChatTurn } from '../lib/llm';
import type { HiveTask } from '../lib/hiveApi';
import { HIVE_COPY, formatEstimateCard } from '../constants/hiveCopy';
import { upsertHiveAppFromTask } from '../lib/hiveApps';
import { createIntelCase, inferTargetTypeFromLabel, resolveDomainFromTarget } from '../osint/cases';
import { defaultToolsForTargetType } from '../osint/tools/registry';
import { normalizeRadiusMiles } from '../osint/regionalQuery';
import { openAddCredits } from '../lib/hiveAccount';
import {
  dexInputBarStyle,
  keyboardAvoidBehavior,
  keyboardVerticalOffset,
  useKeyboardInset,
} from '../hooks/useKeyboardInset';
import { useResponsiveLayout } from './ResponsiveShell';

type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  at: string;
};

type Props = {
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  initialQuery?: string;
  onInitialQueryConsumed?: () => void;
};

const WELCOME =
  'Hi — I\'m your AiBhive assistant. Ask for a job, research a target, or describe any tool you want built. Uses Hive credits by default — no API key needed.';

function newId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function HomeAssistantChat({
  expanded,
  onExpandChange,
  initialQuery,
  onInitialQueryConsumed,
}: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isWide } = useResponsiveLayout();
  const { bottomPad: keyboardPad, keyboardHeight } = useKeyboardInset(0);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'ai', content: WELCOME, at: new Date().toISOString() },
  ]);
  const [loading, setLoading] = useState(false);
  const pendingInitial = useRef(initialQuery?.trim() || '');

  const scrollEnd = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  }, []);

  const appendAi = useCallback(
    (content: string) => {
      setMessages((prev) => [...prev, { id: newId(), role: 'ai', content, at: new Date().toISOString() }]);
      scrollEnd();
    },
    [scrollEnd]
  );

  const handleAction = useCallback(
    async (action: HomeAssistantAction, buildTask?: HiveTask) => {
      if (buildTask) {
        await upsertHiveAppFromTask(buildTask);
        if (buildTask.status === 'awaiting_approval' && buildTask.estimate) {
          appendAi(
            `${action.reply}\n\n${formatEstimateCard(buildTask.estimate.costUsd, buildTask.estimate.minutes)}\n\nOpen **Build** to approve when ready.`
          );
          navigation.navigate('HiveBuild', { prefill: action.buildMessage });
          return;
        }
        if (buildTask.status === 'complete') {
          appendAi(`${action.reply}\n\n✨ Your app is ready — check **My Apps**.`);
          return;
        }
      }

      if (action.intent === 'jobs') {
        appendAi(action.reply);
        setTimeout(() => navigation.navigate('JobTracker'), 600);
        return;
      }

      if (action.intent === 'research' && action.intelIntent?.trim()) {
        appendAi(action.reply);
        const label = action.intelIntent.slice(0, 120);
        const targetType = action.intelTargetType || inferTargetTypeFromLabel(label);
        const region = action.intelRegion?.trim()
          ? {
              restrictToRegion: true,
              location: action.intelRegion.trim(),
              radiusMiles: normalizeRadiusMiles(action.intelRadiusMiles),
            }
          : undefined;
        const intelCase = await createIntelCase({
          target: {
            type: targetType,
            label,
            domain: resolveDomainFromTarget(label, undefined, targetType) || undefined,
            region,
          },
          enabledTools: defaultToolsForTargetType(targetType),
        });
        setTimeout(() => navigation.navigate('IntelCase', { caseId: intelCase.id, autoRun: true }), 800);
        return;
      }

      if (action.intent === 'research') {
        appendAi(action.reply);
        setTimeout(() => navigation.navigate('IntelAgent', { prefillIntent: action.intelIntent || input }), 600);
        return;
      }

      if (action.intent === 'build' && action.buildStage === 'confirm') {
        appendAi(action.reply);
        navigation.navigate('HiveBuild', { prefill: action.buildMessage || action.buildSummary });
        return;
      }

      if (action.intent === 'tool') {
        appendAi(action.reply);
        setTimeout(() => navigation.navigate('Apps'), 500);
        return;
      }

      appendAi(action.reply);
    },
    [appendAi, input, navigation]
  );

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      Keyboard.dismiss();
      onExpandChange(true);

      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'user', content: trimmed, at: new Date().toISOString() },
      ]);
      setInput('');
      setLoading(true);
      scrollEnd();

      try {
        const byokConfig = await getActiveLlmConfig();
        const history: ChatTurn[] = messages
          .filter((m) => m.id !== 'welcome')
          .slice(-10)
          .map((m) => ({ role: m.role === 'ai' ? 'ai' : 'user', content: m.content }));

        const { action, buildTask } = await sendHomeAssistantTurn(history, trimmed, {}, byokConfig);
        await handleAction(action, buildTask);
      } catch (err) {
        appendAi(
          err instanceof Error
            ? `Something went wrong: ${err.message}`
            : 'Could not reach AiBhive assistant. Check your connection or add Hive credits in Settings.'
        );
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, appendAi, handleAction, onExpandChange, scrollEnd]
  );

  useEffect(() => {
    if (initialQuery?.trim() && pendingInitial.current) {
      const q = pendingInitial.current;
      pendingInitial.current = '';
      onInitialQueryConsumed?.();
      void submit(q);
    }
  }, [initialQuery, onInitialQueryConsumed, submit]);

  const quickActions = [
    { label: 'Better job', icon: Briefcase, onPress: () => void submit('I want a better job — help me with applications and resume') },
    { label: 'Build a tool', icon: Wand2, onPress: () => void submit('I want to build a custom tool') },
    { label: 'Research', icon: Radar, onPress: () => navigation.navigate('IntelAgent') },
  ];

  const openChat = () => {
    onExpandChange(true);
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  const chatBody = (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={scrollEnd}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => (
          <View
            key={m.id}
            style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}
          >
            <Text style={styles.bubbleText}>{m.content}</Text>
          </View>
        ))}
        {loading && (
          <View style={[styles.bubble, styles.bubbleAi, styles.loadingBubble]}>
            <ActivityIndicator color={colors.amber} size="small" />
            <Text style={styles.loadingText}>AiBhive is thinking…</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.quickRow}>
        {quickActions.map((q) => {
          const Icon = q.icon;
          return (
            <TouchableOpacity key={q.label} style={styles.quickChip} onPress={q.onPress}>
              <Icon size={14} color={colors.amber} />
              <Text style={styles.quickChipText}>{q.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.composer, dexInputBarStyle(keyboardHeight > 0), { paddingBottom: Math.max(insets.bottom, 8) + keyboardPad * 0.15 }]}>
        <TextInput
          ref={inputRef}
          style={styles.composerInput}
          placeholder="Ask anything — jobs, research, build a tool…"
          placeholderTextColor={colors.textDim}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => void submit(input)}
          disabled={!input.trim() || loading}
        >
          <Send color={colors.bg} size={20} />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <>
      <View style={styles.heroWrap}>
        <TouchableOpacity style={styles.heroBar} activeOpacity={0.94} onPress={openChat}>
          <View style={styles.heroIconWrap}>
            <Sparkles color={colors.amber} size={22} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroLabel}>AiBhive Assistant</Text>
            <Text style={styles.heroPlaceholder} numberOfLines={1}>
              {input.trim() || 'Ask anything — jobs, research, build a tool…'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.heroSend}
            onPress={() => (input.trim() ? void submit(input) : openChat())}
            disabled={loading}
          >
            <Send color={input.trim() ? colors.amber : colors.textDim} size={22} />
          </TouchableOpacity>
        </TouchableOpacity>
        {!expanded && (
          <TextInput
            style={styles.hiddenInput}
            value={input}
            onChangeText={setInput}
            onFocus={openChat}
            returnKeyType="send"
            onSubmitEditing={() => void submit(input)}
          />
        )}
        <Text style={styles.heroHint}>{HIVE_COPY.hiveAssistantHint}</Text>
      </View>

      <Modal visible={expanded} animationType="slide" onRequestClose={() => onExpandChange(false)}>
        <KeyboardAvoidingView
          style={[styles.modalRoot, { paddingTop: insets.top }]}
          behavior={keyboardAvoidBehavior()}
          keyboardVerticalOffset={keyboardVerticalOffset(isWide)}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleWrap}>
              <Sparkles color={colors.amber} size={20} />
              <Text style={styles.modalTitle}>AiBhive Assistant</Text>
              <View style={styles.poweredBadge}>
                <Text style={styles.poweredText}>Hive credits</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => onExpandChange(false)} hitSlop={12} style={styles.closeBtn}>
              <ChevronDown color={colors.textMuted} size={26} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>{chatBody}</View>

          <View style={styles.modalFooter}>
            <Text style={styles.hint}>{HIVE_COPY.hiveCreditsFooter}</Text>
            <TouchableOpacity onPress={() => void openAddCredits()}>
              <Text style={styles.addCreditsLink}>Add credits</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  heroWrap: { marginBottom: spacing.lg },
  heroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.amber + '66',
    paddingHorizontal: spacing.md,
    minHeight: 72,
    ...Platform.select({
      android: { elevation: 6 },
    }),
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  heroCopy: { flex: 1 },
  heroLabel: {
    color: colors.amberLight,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroPlaceholder: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  heroSend: {
    padding: 10,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  heroHint: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: spacing.xs,
    paddingHorizontal: 4,
    fontSize: 12,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  modalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
  poweredBadge: {
    backgroundColor: colors.amberSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  poweredText: {
    color: colors.amberLight,
    fontSize: 11,
    fontWeight: '800',
  },
  closeBtn: { padding: 6 },
  modalBody: { flex: 1 },
  chatScroll: { flex: 1 },
  chatContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },
  bubble: {
    borderRadius: radii.lg,
    padding: 14,
    maxWidth: '88%',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.amber + '33',
  },
  bubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  bubbleText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { color: colors.textMuted, fontSize: 13 },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  quickChipText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  composerInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.bgInput,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  hint: {
    ...typography.caption,
    color: colors.textDim,
    fontSize: 11,
  },
  addCreditsLink: {
    color: colors.amberLight,
    fontWeight: '800',
    fontSize: 11,
  },
});
