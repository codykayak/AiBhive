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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Send, Sparkles, Briefcase, Radar, Wand2, ChevronDown, ChevronUp } from 'lucide-react-native';
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
  'Hi — I\'m your AiBhive assistant (Grok). Ask for a job, research a target, or describe any tool you want built. I\'ll guide you step by step.';

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
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'ai', content: WELCOME, at: new Date().toISOString() },
  ]);
  const [loading, setLoading] = useState(false);
  const [providerLabel, setProviderLabel] = useState('Grok');
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
        const targetType =
          action.intelTargetType || inferTargetTypeFromLabel(label);
        const region =
          action.intelRegion?.trim()
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
        setTimeout(
          () => navigation.navigate('IntelAgent', { prefillIntent: action.intelIntent || input }),
          600
        );
        return;
      }

      if (action.intent === 'build' && action.buildStage === 'confirm') {
        appendAi(action.reply);
        navigation.navigate('HiveBuild', { prefill: action.buildMessage || action.buildSummary });
        return;
      }

      if (action.intent === 'build') {
        appendAi(action.reply);
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
        const config = await getActiveLlmConfig();
        if (!config?.apiKey?.trim()) {
          appendAi(
            'Add your Grok (xAI) API key in **Settings → AI providers** to use the home assistant. Grok 4 is the default — very smart and great at orchestrating the app.'
          );
          return;
        }
        setProviderLabel(config.providerId === 'grok' ? 'Grok 4' : config.providerLabel);

        const history: ChatTurn[] = messages
          .filter((m) => m.id !== 'welcome')
          .slice(-10)
          .map((m) => ({ role: m.role === 'ai' ? 'ai' : 'user', content: m.content }));

        const { action, buildTask } = await sendHomeAssistantTurn(config, history, trimmed);
        await handleAction(action, buildTask);
      } catch (err) {
        appendAi(
          err instanceof Error
            ? `Something went wrong: ${err.message}`
            : 'Could not reach the AI. Check your API key in Settings.'
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

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.askWrap}
        activeOpacity={0.95}
        onPress={() => onExpandChange(!expanded)}
      >
        <Sparkles color={colors.amber} size={18} style={styles.askIcon} />
        {!expanded ? (
          <TextInput
            style={styles.askInput}
            placeholder="Ask Grok anything — jobs, research, build a tool…"
            placeholderTextColor={colors.textDim}
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={() => void submit(input)}
            onFocus={() => onExpandChange(true)}
          />
        ) : (
          <Text style={styles.askCollapsedLabel}>AiBhive Assistant · {providerLabel}</Text>
        )}
        {expanded ? (
          <ChevronUp color={colors.textDim} size={20} />
        ) : (
          <TouchableOpacity onPress={() => void submit(input)} disabled={!input.trim() || loading}>
            <Send color={input.trim() ? colors.amber : colors.textDim} size={20} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.panel}>
          <ScrollView
            ref={scrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollEnd}
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
              <View style={styles.bubbleAi}>
                <ActivityIndicator color={colors.amber} size="small" />
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

          <View style={styles.composer}>
            <TextInput
              style={styles.composerInput}
              placeholder="Describe what you need…"
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
              <Send color={colors.bg} size={18} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>{HIVE_COPY.freeWithoutTokens}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  askWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.amber + '55',
    paddingHorizontal: 16,
    minHeight: 52,
  },
  askIcon: { marginRight: 10 },
  askInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 12,
  },
  askCollapsedLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 14,
  },
  panel: {
    marginTop: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    maxHeight: 420,
  },
  chatScroll: { maxHeight: 260 },
  chatContent: { padding: spacing.md, gap: spacing.sm },
  bubble: {
    borderRadius: radii.md,
    padding: 12,
    maxWidth: '92%',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.amber + '33',
  },
  bubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgInput,
  },
  bubbleText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bgInput,
    borderRadius: radii.md,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  hint: {
    ...typography.caption,
    color: colors.textDim,
    textAlign: 'center',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 11,
  },
});
