import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Vibration,
  Image,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Briefcase,
  Radar,
  Wand2,
  ChevronDown,
  Maximize2,
} from 'lucide-react-native';
import { colors, spacing } from '../theme/colors';
import { getActiveLlmConfig } from '../lib/settings';
import { sendHomeAssistantTurn, type HomeAssistantAction } from '../lib/homeAssistant';
import type { ChatTurn } from '../lib/llm';
import type { HiveTask } from '../lib/hiveApi';
import { formatEstimateCard, HIVE_COPY } from '../constants/hiveCopy';
import { upsertHiveAppFromTask } from '../lib/hiveApps';
import { dingFeatureReady } from '../lib/notifications';
import { createIntelCase, inferTargetTypeFromLabel, resolveDomainFromTarget } from '../osint/cases';
import { defaultToolsForTargetType } from '../osint/tools/registry';
import { normalizeRadiusMiles } from '../osint/regionalQuery';
import { HiveLogo } from './HiveLogo';
import { HOME_INTRO_TAGLINE } from './HomeHeroVideo';
import { ChatComposerBox, type ComposerMode } from './ChatComposerBox';
import { useKeyboardInset, detectWindowShrank, getComposerBottomInset, KEYBOARD_TOOLBAR_CLEARANCE } from '../hooks/useKeyboardInset';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { pickHiveReferenceImage, type HiveAttachment } from '../lib/hiveAttachments';
import { useToast } from '../contexts/ToastContext';
import { fetchQuickInsights } from '../lib/proactiveAssistant';

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
  variant?: 'inline' | 'floating';
};

/** Home chat panel = bottom quarter of the screen. */
export const DOCK_SCREEN_FRACTION = 0.28;

export function getAssistantDockHeight(screenHeight: number): number {
  return Math.max(180, Math.round(screenHeight * DOCK_SCREEN_FRACTION));
}

/** @deprecated use getAssistantDockHeight */
export const ASSISTANT_DOCK_HEIGHT = 200;

const WELCOME =
  "Hi — I'm your AiBhive assistant. " + HOME_INTRO_TAGLINE;

function newId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function MessageBubble({ m, compact }: { m: ChatMessage; compact?: boolean }) {
  return (
    <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAi, compact && styles.bubbleCompact]}>
      {m.imageUri ? (
        <Image source={{ uri: m.imageUri }} style={compact ? styles.bubbleImageCompact : styles.bubbleImage} resizeMode="cover" />
      ) : null}
      {m.content && m.content !== '📷 Photo' ? (
        <Text style={[styles.bubbleText, compact && styles.bubbleTextCompact]} numberOfLines={compact ? 4 : undefined}>
          {m.content}
        </Text>
      ) : m.imageUri ? (
        <Text style={styles.bubbleTextMuted}>Photo</Text>
      ) : (
        <Text style={[styles.bubbleText, compact && styles.bubbleTextCompact]}>{m.content}</Text>
      )}
    </View>
  );
}

export function HomeAssistantChat({
  expanded,
  onExpandChange,
  initialQuery,
  onInitialQueryConsumed,
  variant = 'inline',
}: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { height: windowHeight } = useWindowDimensions();
  const { keyboardHeight, bottomPad, safeBottom } = useKeyboardInset(0);
  const baselineHeightRef = useRef(windowHeight);
  const [baselineHeight, setBaselineHeight] = useState(windowHeight);

  useEffect(() => {
    if (keyboardHeight === 0) {
      baselineHeightRef.current = windowHeight;
      setBaselineHeight(windowHeight);
    }
  }, [keyboardHeight, windowHeight]);

  const keyboardOpen = keyboardHeight > 0;
  const windowShrank = detectWindowShrank(
    keyboardOpen,
    baselineHeightRef.current,
    windowHeight,
    keyboardHeight
  );

  const dockBottomLift = keyboardOpen
    ? getComposerBottomInset({
        keyboardOpen,
        windowShrank,
        keyboardPad: bottomPad,
        basePadding: 0,
      }) +
      KEYBOARD_TOOLBAR_CLEARANCE +
      (windowShrank ? 24 : 0)
    : 0;

  const modalKeyboardLift = keyboardOpen
    ? getComposerBottomInset({
        keyboardOpen,
        windowShrank: false,
        keyboardPad: keyboardHeight,
        basePadding: 0,
        forceManual: true,
      }) + KEYBOARD_TOOLBAR_CLEARANCE
    : 0;

  const dockNeedsManualLift = keyboardOpen && dockBottomLift > 0;
  const dockVisibleHeight = dockNeedsManualLift
    ? Math.max(180, windowHeight - keyboardHeight - KEYBOARD_TOOLBAR_CLEARANCE)
    : Math.max(180, windowHeight - (keyboardOpen ? KEYBOARD_TOOLBAR_CLEARANCE + 24 : 0));

  const baseDockHeight = getAssistantDockHeight(baselineHeight);
  const dockPanelHeight = keyboardOpen
    ? Math.max(200, Math.min(baseDockHeight, dockVisibleHeight - 4))
    : baseDockHeight;

  const modalComposerHeight = useMemo(() => {
    if (!keyboardOpen) return 220;
    const visible = Math.max(
      220,
      windowHeight - modalKeyboardLift - insets.top - 72
    );
    return Math.max(200, Math.round(visible * 0.38));
  }, [keyboardOpen, windowHeight, modalKeyboardLift, insets.top]);

  const dockComposerHeight = keyboardOpen
    ? Math.max(150, Math.min(200, Math.round(dockPanelHeight * 0.48)))
    : Math.max(140, Math.round(dockPanelHeight * 0.42));
  const scrollRef = useRef<ScrollView>(null);
  const dockScrollRef = useRef<ScrollView>(null);
  const dockInputRef = useRef<TextInput>(null);
  const modalInputRef = useRef<TextInput>(null);
  const preSpeechInput = useRef('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'ai', content: WELCOME, at: new Date().toISOString() },
  ]);
  const [loading, setLoading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<HiveAttachment | null>(null);
  const [mode, setMode] = useState<ComposerMode>('build');
  const [insightBullets, setInsightBullets] = useState<string[]>([]);
  const pendingInitial = useRef(initialQuery?.trim() || '');

  const scrollEnd = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
      dockScrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
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
          appendAi(
            `${action.reply}\n\n✨ Your app is ready — check **My Apps**.\n\n${HIVE_COPY.buildCompleteUpsell}\n\n📖 ${HIVE_COPY.buildCompleteGuide}`
          );
          void dingFeatureReady(
            'Your app is ready!',
            'Open My Apps — your User Guide is waiting for you.'
          );
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
          { attachment: attach ?? undefined, mode },
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
    [loading, messages, appendAi, handleAction, scrollEnd, pendingAttachment, mode]
  );

  useEffect(() => {
    if (initialQuery?.trim() && pendingInitial.current) {
      const q = pendingInitial.current;
      pendingInitial.current = '';
      onInitialQueryConsumed?.();
      void submit(q);
    }
  }, [initialQuery, onInitialQueryConsumed, submit]);

  const hasUserSentMessage = messages.some((m) => m.role === 'user');
  const showSuggestions = !keyboardOpen && !hasUserSentMessage;

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

  const handleSpeechStart = useCallback(() => {
    // Double-tap haptic so the user knows the mic is hot.
    Vibration.vibrate([0, 35, 60, 35]);
    showToast('Listening… speak now', 'success');
  }, [showToast]);

  const handleSpeechEnd = useCallback(() => {
    Vibration.vibrate(25);
  }, []);

  const { listening, toggleListening, stopListening } = useSpeechToText({
    onTranscript: handleSpeechTranscript,
    onStart: handleSpeechStart,
    onEnd: handleSpeechEnd,
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

  const onPickImage = useCallback(async () => {
    const picked = await pickHiveReferenceImage();
    if (picked) {
      setPendingAttachment(picked);
    }
  }, []);

  useEffect(() => {
    if (keyboardOpen) scrollEnd();
  }, [keyboardOpen, scrollEnd]);

  useEffect(() => {
    if (!expanded) return;
    void fetchQuickInsights().then((r) => {
      if (r.bullets.length) setInsightBullets(r.bullets);
    });
  }, [expanded]);

  const composerProps = {
    value: input,
    onChangeText: setInput,
    onFocus: scrollEnd,
    onSubmit: () => void submit(input),
    loading,
    pendingAttachment,
    onClearAttachment: () => setPendingAttachment(null),
    onPickImage: () => void onPickImage(),
    onMicPress,
    listening,
    mode,
    onModeChange: setMode,
  };

  const isFloating = variant === 'floating';

  const homePanel = (
    <View
      style={[
        styles.homePanel,
        isFloating && styles.homePanelFloating,
        {
          height: dockPanelHeight,
          bottom: dockBottomLift,
        },
      ]}
    >
      <TouchableOpacity style={styles.expandStrip} onPress={openChat} activeOpacity={0.7}>
        <Text style={styles.expandLabel}>AiBhive Assistant</Text>
        <Maximize2 color={colors.textDim} size={14} />
      </TouchableOpacity>

      <ScrollView
        ref={dockScrollRef}
        style={styles.dockThread}
        contentContainerStyle={styles.dockThreadContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={scrollEnd}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} m={m} compact />
        ))}
        {loading ? (
          <View style={[styles.bubble, styles.bubbleAi, styles.bubbleCompact, styles.loadingBubble]}>
            <ActivityIndicator color={colors.amber} size="small" />
            <Text style={styles.loadingText}>Thinking…</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.dockComposerWrap, { height: dockComposerHeight }]}>
        <ChatComposerBox {...composerProps} inputRef={dockInputRef} minHeight={dockComposerHeight} />
      </View>
    </View>
  );

  return (
    <>
      {variant === 'inline' ? homePanel : null}
      {isFloating && !expanded ? homePanel : null}

      <Modal visible={expanded} animationType="slide" onRequestClose={closeChat} statusBarTranslucent>
        <SafeAreaView style={styles.modalSafe} edges={['top']}>
          <KeyboardAvoidingView
            style={styles.modalAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            <View
              style={[
                styles.modalRoot,
                { paddingBottom: keyboardOpen ? modalKeyboardLift : safeBottom },
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleWrap}>
                  <HiveLogo size={28} />
                  <Text style={styles.modalTitle}>AiBhive Assistant</Text>
                </View>
                <TouchableOpacity onPress={closeChat} hitSlop={12} style={styles.closeBtn}>
                  <ChevronDown color={colors.textMuted} size={26} />
                </TouchableOpacity>
              </View>

              <ScrollView
                ref={scrollRef}
                style={styles.chatScroll}
                contentContainerStyle={styles.chatContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onContentSizeChange={scrollEnd}
                showsVerticalScrollIndicator={false}
              >
                {messages.map((m) => (
                  <MessageBubble key={m.id} m={m} />
                ))}
                {loading && (
                  <View style={[styles.bubble, styles.bubbleAi, styles.loadingBubble]}>
                    <ActivityIndicator color={colors.amber} size="small" />
                    <Text style={styles.loadingText}>AiBhive is thinking…</Text>
                  </View>
                )}
              </ScrollView>

              {showSuggestions ? (
                <View style={styles.quickRow}>
                  {insightBullets.map((tip) => (
                    <TouchableOpacity
                      key={tip}
                      style={styles.insightChip}
                      onPress={() => {
                        setInput(tip);
                        scrollEnd();
                      }}
                    >
                      <Text style={styles.insightChipText}>{tip}</Text>
                    </TouchableOpacity>
                  ))}
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
              )}

              <View style={[styles.modalComposerWrap, { height: modalComposerHeight }]}>
                <ChatComposerBox
                  {...composerProps}
                  inputRef={modalInputRef}
                  minHeight={modalComposerHeight}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  homePanel: {
    flexShrink: 0,
    backgroundColor: '#000000',
  },
  homePanelFloating: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 50,
  },
  dockComposerWrap: {
    width: '100%',
    flexShrink: 0,
    backgroundColor: colors.black,
  },
  expandStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  expandLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  dockThread: {
    flex: 1,
    minHeight: 48,
  },
  dockThreadContent: {
    paddingHorizontal: 8,
    paddingBottom: 2,
    gap: 4,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalAvoid: {
    flex: 1,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 4,
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
  closeBtn: { padding: 6 },
  chatScroll: { flex: 1, minHeight: 0 },
  chatContent: { paddingHorizontal: 8, paddingTop: 4, gap: spacing.sm, paddingBottom: spacing.sm },
  modalComposerWrap: {
    width: '100%',
    flexShrink: 0,
    backgroundColor: colors.black,
  },
  bubble: {
    borderRadius: 8,
    padding: 12,
    maxWidth: '90%',
  },
  bubbleCompact: {
    padding: 8,
    maxWidth: '95%',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  bubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  bubbleText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  bubbleTextMuted: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  bubbleImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  bubbleImageCompact: {
    width: 120,
    height: 90,
    borderRadius: 6,
    marginBottom: 4,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: { color: colors.textMuted, fontSize: 13 },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  quickChipText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  insightChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  insightChipText: { color: colors.amberLight, fontSize: 12, fontWeight: '700' },
});
