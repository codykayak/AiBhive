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
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Send,
  Briefcase,
  Radar,
  Wand2,
  ChevronDown,
  Mic,
  Maximize2,
  ImagePlus,
  X,
} from 'lucide-react-native';
import { colors, radii, spacing } from '../theme/colors';
import { getActiveLlmConfig } from '../lib/settings';
import { sendHomeAssistantTurn, type HomeAssistantAction } from '../lib/homeAssistant';
import type { ChatTurn } from '../lib/llm';
import type { HiveTask } from '../lib/hiveApi';
import { formatEstimateCard } from '../constants/hiveCopy';
import { upsertHiveAppFromTask } from '../lib/hiveApps';
import { createIntelCase, inferTargetTypeFromLabel, resolveDomainFromTarget } from '../osint/cases';
import { defaultToolsForTargetType } from '../osint/tools/registry';
import { normalizeRadiusMiles } from '../osint/regionalQuery';
import { HiveLogo } from './HiveLogo';
import { HOME_INTRO_TAGLINE } from './HomeHeroVideo';
import {
  dexInputBarStyle,
  keyboardAvoidBehavior,
  keyboardVerticalOffset,
  useKeyboardInset,
} from '../hooks/useKeyboardInset';
import { useResponsiveLayout } from './ResponsiveShell';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { pickHiveReferenceImage, type HiveAttachment } from '../lib/hiveAttachments';
import { HIVE_COPY } from '../constants/hiveCopy';

type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  at: string;
  imageUri?: string;
};

type Props = {
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  initialQuery?: string;
  onInitialQueryConsumed?: () => void;
  /** Fixed dock at bottom of the screen (Home tab) */
  variant?: 'inline' | 'floating';
  /** Distance from screen bottom to dock (includes tab bar + gap) */
  dockBottom?: number;
};

export const ASSISTANT_DOCK_HEIGHT = 140;

const WELCOME =
  "Hi — I'm your AiBhive assistant. " + HOME_INTRO_TAGLINE;

function newId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function HomeAssistantChat({
  expanded,
  onExpandChange,
  initialQuery,
  onInitialQueryConsumed,
  variant = 'inline',
  dockBottom = 0,
}: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isWide } = useResponsiveLayout();
  const { bottomPad: keyboardPad, keyboardHeight } = useKeyboardInset(0);
  const scrollRef = useRef<ScrollView>(null);
  const dockInputRef = useRef<TextInput>(null);
  const modalInputRef = useRef<TextInput>(null);
  const preSpeechInput = useRef('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'ai', content: WELCOME, at: new Date().toISOString() },
  ]);
  const [loading, setLoading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<HiveAttachment | null>(null);
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
    async (text: string, attachment?: HiveAttachment | null) => {
      const trimmed = text.trim();
      const attach = attachment ?? pendingAttachment;
      if ((!trimmed && !attach) || loading) return;
      Keyboard.dismiss();
      onExpandChange(true);

      const displayText = trimmed || '📷 Photo';
      const apiText =
        trimmed ||
        'The user sent an image without a caption. Describe what you see and ask how you can help.';

      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: 'user',
          content: displayText,
          imageUri: attach?.uri,
          at: new Date().toISOString(),
        },
      ]);
      setInput('');
      setPendingAttachment(null);
      setLoading(true);
      scrollEnd();

      try {
        const byokConfig = await getActiveLlmConfig();
        const history: ChatTurn[] = messages
          .filter((m) => m.id !== 'welcome')
          .slice(-10)
          .map((m) => ({ role: m.role === 'ai' ? 'ai' : 'user', content: m.content }));

        const { action, buildTask } = await sendHomeAssistantTurn(
          history,
          apiText,
          { attachment: attach ?? undefined },
          byokConfig
        );
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
    [loading, messages, appendAi, handleAction, onExpandChange, scrollEnd, pendingAttachment]
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

  const openChat = useCallback(() => {
    onExpandChange(true);
    setTimeout(() => modalInputRef.current?.focus(), 150);
  }, [onExpandChange]);

  const handleSpeechTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setInput(() => {
        const base = preSpeechInput.current.trim();
        return base ? `${base} ${text}`.trim() : text;
      });
      preSpeechInput.current = '';
    } else {
      setInput(() => {
        const base = preSpeechInput.current.trim();
        return base ? `${base} ${text}`.trim() : text;
      });
    }
  }, []);

  const { listening, toggleListening, stopListening } = useSpeechToText({
    onTranscript: handleSpeechTranscript,
  });

  const closeChat = useCallback(() => {
    stopListening();
    Keyboard.dismiss();
    dockInputRef.current?.blur();
    modalInputRef.current?.blur();
    onExpandChange(false);
  }, [onExpandChange, stopListening]);

  const onMicPress = useCallback(() => {
    if (!listening) {
      preSpeechInput.current = input;
    }
    void toggleListening();
  }, [input, listening, toggleListening]);

  const canSend = Boolean(input.trim() || pendingAttachment);

  const onPickImage = useCallback(async () => {
    const picked = await pickHiveReferenceImage();
    if (picked) {
      setPendingAttachment(picked);
      if (!expanded) onExpandChange(true);
    }
  }, [expanded, onExpandChange]);

  const attachmentPreview = pendingAttachment ? (
    <View style={styles.attachPreview}>
      <Image source={{ uri: pendingAttachment.uri }} style={styles.attachThumb} />
      <Text style={styles.attachLabel} numberOfLines={1}>
        Photo attached
      </Text>
      <TouchableOpacity onPress={() => setPendingAttachment(null)} hitSlop={12}>
        <X color={colors.textDim} size={18} />
      </TouchableOpacity>
    </View>
  ) : null;

  const imageButton = (compact?: boolean) => (
    <TouchableOpacity
      style={[styles.attachBtn, compact && styles.attachBtnCompact]}
      onPress={() => void onPickImage()}
      disabled={loading}
      accessibilityLabel={HIVE_COPY.attachImage}
      hitSlop={8}
    >
      <ImagePlus color={pendingAttachment ? colors.amber : colors.amberLight} size={compact ? 20 : 22} />
    </TouchableOpacity>
  );

  const micButton = (compact?: boolean) => (
    <TouchableOpacity
      style={[styles.micBtn, listening && styles.micBtnActive, compact && styles.micBtnCompact]}
      onPress={onMicPress}
      hitSlop={8}
    >
      <Mic color={listening ? colors.bg : colors.amber} size={compact ? 20 : 22} />
    </TouchableOpacity>
  );

  const sendButton = (compact?: boolean) => (
    <TouchableOpacity
      style={[styles.heroSend, compact && styles.sendBtnCompact, !canSend && styles.sendBtnDisabled]}
      onPress={() => void submit(input)}
      disabled={!canSend || loading}
      hitSlop={8}
    >
      <Send color={canSend ? colors.amber : colors.textDim} size={compact ? 20 : 22} />
    </TouchableOpacity>
  );

  const floatingDockBar = (
    <View style={styles.heroBar}>
      <TouchableOpacity style={styles.heroHeader} activeOpacity={0.85} onPress={openChat}>
        <HiveLogo size={28} />
        <Text style={styles.heroLabel}>AiBhive Assistant</Text>
        <Maximize2 color={colors.textDim} size={16} />
      </TouchableOpacity>
      {attachmentPreview}
      <View style={styles.heroInputRow}>
        {imageButton(true)}
        <TextInput
          ref={dockInputRef}
          style={styles.dockInput}
          placeholder={HOME_INTRO_TAGLINE}
          placeholderTextColor={colors.textDim}
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={() => void submit(input)}
          multiline={false}
          maxLength={2000}
        />
        {micButton(true)}
        {sendButton(true)}
      </View>
    </View>
  );

  const floatingDock = !expanded ? (
    <View style={[styles.floatingDock, { bottom: dockBottom }]}>
      {floatingDockBar}
    </View>
  ) : null;

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
            {m.imageUri ? (
              <Image source={{ uri: m.imageUri }} style={styles.bubbleImage} resizeMode="cover" />
            ) : null}
            {m.content && m.content !== '📷 Photo' ? (
              <Text style={styles.bubbleText}>{m.content}</Text>
            ) : m.imageUri ? (
              <Text style={styles.bubbleTextMuted}>Photo</Text>
            ) : (
              <Text style={styles.bubbleText}>{m.content}</Text>
            )}
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
        <View style={styles.composerStack}>
          {attachmentPreview}
          <View style={styles.composerRow}>
            {imageButton()}
            <TextInput
              ref={modalInputRef}
              style={styles.composerInput}
              placeholder={HOME_INTRO_TAGLINE}
              placeholderTextColor={colors.textDim}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
            />
            {micButton()}
            <TouchableOpacity
              style={[styles.sendBtn, (!canSend || loading) && styles.sendBtnDisabled]}
              onPress={() => void submit(input)}
              disabled={!canSend || loading}
            >
              <Send color={colors.bg} size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <>
      {variant === 'inline' ? (
        <View style={styles.heroWrap}>
          {floatingDockBar}
        </View>
      ) : variant === 'floating' ? (
        floatingDock
      ) : null}

      <Modal visible={expanded} animationType="slide" onRequestClose={closeChat}>
        <KeyboardAvoidingView
          style={[styles.modalRoot, { paddingTop: insets.top }]}
          behavior={keyboardAvoidBehavior()}
          keyboardVerticalOffset={keyboardVerticalOffset(isWide)}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleWrap}>
              <HiveLogo size={28} />
              <Text style={styles.modalTitle}>AiBhive Assistant</Text>
              <View style={styles.poweredBadge}>
                <Text style={styles.poweredText}>Hive credits</Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeChat} hitSlop={12} style={styles.closeBtn}>
              <ChevronDown color={colors.textMuted} size={26} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>{chatBody}</View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  heroWrap: { marginBottom: spacing.lg },
  heroSlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingVertical: spacing.lg,
  },
  heroSlotLogo: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  heroSlotTitle: {
    color: colors.amberLight,
    fontWeight: '900',
    fontSize: 26,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  heroSlotSub: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  floatingDock: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
    ...Platform.select({
      android: { elevation: 12 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -2 },
      },
    }),
  },
  heroBar: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.amber + '66',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    ...Platform.select({
      android: { elevation: 6 },
    }),
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  heroInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgInput,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    minHeight: 52,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachBtnCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  attachPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: colors.amber + '33',
  },
  attachThumb: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.bgCard,
  },
  attachLabel: {
    flex: 1,
    color: colors.amberLight,
    fontSize: 12,
    fontWeight: '700',
  },
  dockInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
    minHeight: 44,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: colors.amber + '44',
  },
  micBtnCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  micBtnActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  heroLabel: {
    flex: 1,
    color: colors.amberLight,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroSend: {
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnCompact: {
    padding: spacing.xs,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
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
  bubbleTextMuted: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  bubbleImage: {
    width: 200,
    height: 150,
    borderRadius: radii.md,
    marginBottom: 8,
    backgroundColor: colors.bgCard,
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  composerStack: {
    flex: 1,
    gap: spacing.sm,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
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
});
