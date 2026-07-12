import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from 'expo-router';
import { Camera, Mic, Send, Square } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type KeyboardEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/ChatBubble';
import {
  DiagnosisFeedbackCard,
  type FeedbackFormValues,
} from '@/components/DiagnosisFeedbackCard';
import { NarrationToggle } from '@/components/JoinTeamModal';
import { PulseLoader } from '@/components/PulseLoader';
import { PackBadge } from '@/components/PackBadge';
import { theme } from '@/constants/theme';
import { buildTabBarStyle } from '@/constants/tabBar';
import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { usePack } from '@/contexts/PackContext';
import { parseDiagnosis } from '@/lib/diagnose/parseDiagnosis';
import { loadSession, saveSession, welcomeMessage } from '@/lib/diagnose/sessionStore';
import { askGrokDetailed, type DiagnoseSource } from '@/lib/grok';
import { pushJobNoteToPros } from '@/lib/jobs/prosSync';
import { loadJobs, upsertJob } from '@/lib/jobs/storage';
import { submitFieldFeedback } from '@/lib/knowledge/fieldKnowledge';
import { refreshRemoteTips } from '@/lib/knowledge/remotePackCache';
import type { ChatAttachment, ChatMessage } from '@/lib/packs';
import { pushRecent } from '@/lib/recents';
import { startVoiceCapture, type VoiceSession } from '@/lib/voice/speechInput';

const SPEECH_KEY = 'aibhive.diagnose.speechEnabled';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type DiagnoseChatProps = {
  initialPrompt?: string;
  autoCamera?: boolean;
  autoVoice?: boolean;
  jobId?: string;
  keyboardOffset?: number;
  embedInTabs?: boolean;
};

export function DiagnoseChat({
  initialPrompt,
  autoCamera,
  autoVoice,
  jobId,
  keyboardOffset,
  embedInTabs = false,
}: DiagnoseChatProps) {
  const { activePack, setActivePackId } = usePack();
  const { getIdToken, profile, saveProfile, user } = useAuth();
  const { isOnline, isInternetReachable } = useNetwork();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const offline = !isOnline || isInternetReachable === false;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionReady, setSessionReady] = useState(false);
  const [input, setInput] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('Diagnosing…');
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [aiSource, setAiSource] = useState<DiagnoseSource | null>(null);
  const [feedbackBusyId, setFeedbackBusyId] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<{ id: string; message: string } | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const seededRef = useRef(false);
  const cameraOpenedRef = useRef(false);
  const voiceOpenedRef = useRef(false);
  const inputRef = useRef<TextInput>(null);
  const voiceRef = useRef<VoiceSession | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    void AsyncStorage.getItem(SPEECH_KEY).then((v) => {
      if (v === '1') setSpeechEnabled(true);
    });
  }, []);

  useEffect(() => {
    return () => {
      Speech.stop();
      void voiceRef.current?.cancel();
    };
  }, []);

  // Load / restore session per pack (+ optional job)
  useEffect(() => {
    let cancelled = false;
    setSessionReady(false);
    (async () => {
      const stored = await loadSession(activePack.id, jobId);
      if (cancelled) return;
      if (stored.length) {
        setMessages(stored);
      } else {
        setMessages([welcomeMessage(activePack.name)]);
      }
      setAiSource(null);
      seededRef.current = false;
      setSessionReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [activePack.id, activePack.name, jobId]);

  // Persist session
  useEffect(() => {
    if (!sessionReady || messages.length === 0) return;
    void saveSession(activePack.id, messages, jobId);
  }, [messages, sessionReady, activePack.id, jobId]);

  // Warm remote tip cache when online + signed in
  useEffect(() => {
    if (offline || !user) return;
    void (async () => {
      const token = await getIdToken();
      if (token) void refreshRemoteTips(token, activePack.id);
    })();
  }, [offline, user, activePack.id, getIdToken]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const restoreTabs = () => {
      if (embedInTabs) {
        navigation.getParent()?.setOptions({
          tabBarStyle: buildTabBarStyle(insets.bottom),
        });
      }
    };

    const onShow = (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
      if (embedInTabs) {
        navigation.getParent()?.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    };

    const onHide = () => {
      setKeyboardHeight(0);
      restoreTabs();
    };

    const subShow = Keyboard.addListener(showEvent, onShow);
    const subHide = Keyboard.addListener(hideEvent, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
      restoreTabs();
    };
  }, [embedInTabs, insets.bottom, navigation]);

  useEffect(() => {
    if (initialPrompt && sessionReady && !seededRef.current) {
      seededRef.current = true;
      setInput(initialPrompt);
    }
  }, [initialPrompt, sessionReady]);

  const toggleSpeech = useCallback(() => {
    setSpeechEnabled((prev) => {
      const next = !prev;
      void AsyncStorage.setItem(SPEECH_KEY, next ? '1' : '0');
      if (!next) {
        Speech.stop();
        setSpeaking(false);
      }
      return next;
    });
    void Haptics.selectionAsync();
  }, []);

  const stopSpeech = useCallback(() => {
    Speech.stop();
    setSpeaking(false);
  }, []);

  const pickImage = useCallback(async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: fromCamera
            ? 'Camera permission is required to photograph equipment.'
            : 'Photo library permission is required to attach images.',
          createdAt: Date.now(),
        },
      ]);
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true, allowsEditing: false })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.7,
          base64: true,
          allowsEditing: false,
          mediaTypes: ['images'],
        });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPendingAttachment({
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      base64: asset.base64 || undefined,
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  useEffect(() => {
    if (autoCamera && sessionReady && !cameraOpenedRef.current) {
      cameraOpenedRef.current = true;
      void pickImage(true);
    }
  }, [autoCamera, pickImage, sessionReady]);

  const writeDiagnosisToJob = useCallback(
    async (reply: string) => {
      if (!jobId) return;
      try {
        const jobs = await loadJobs();
        const job = jobs.find((j) => j.id === jobId);
        if (!job) return;
        const fieldNote = {
          id: `n-${Date.now()}`,
          text: `Diagnose: ${reply.replace(/\*\*/g, '').slice(0, 500)}`,
          authorUid: user?.uid,
          createdAt: Date.now(),
        };
        const next = {
          ...job,
          fieldNotes: [...(job.fieldNotes || []), fieldNote],
          updatedAt: Date.now(),
        };
        await upsertJob(next);
        const token = await getIdToken();
        if (token && job.cloudSynced) {
          await pushJobNoteToPros(token, job.id, fieldNote.text);
        }
      } catch {
        // non-fatal
      }
    },
    [getIdToken, jobId, user?.uid]
  );

  const send = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if ((!text && !pendingAttachment) || busy) return;

      const userMessage: ChatMessage = {
        id: uid(),
        role: 'user',
        content: text || 'Diagnose this equipment.',
        createdAt: Date.now(),
        attachment: pendingAttachment || undefined,
        isDiagnosis: Boolean(pendingAttachment),
      };

      const history = messagesRef.current;
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setPendingAttachment(null);
      setBusy(true);
      setLoadingPhase(offline ? 'Searching pack library…' : 'Scanning pack library…');
      Speech.stop();
      setSpeaking(false);

      const phaseTimer = setTimeout(
        () => setLoadingPhase(offline ? 'Building repair steps…' : 'Building repair steps…'),
        450
      );

      try {
        const { reply, source, tipIdsUsed, matchedFaultIds, notice } = await askGrokDetailed({
          pack: activePack,
          messages: history,
          userText: userMessage.content,
          attachment: userMessage.attachment,
          getIdToken,
          offline,
        });
        setAiSource(source);

        const structured = parseDiagnosis(reply);
        const assistantMessage: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: reply,
          createdAt: Date.now(),
          isDiagnosis: Boolean(userMessage.attachment) || Boolean(structured),
          askFeedback: true,
          feedbackStatus: 'pending',
          structured: structured || undefined,
          diagnoseMeta: {
            userQuery: userMessage.content,
            source,
            packId: activePack.id,
            tipIdsUsed: tipIdsUsed || [],
            matchedFaultIds: matchedFaultIds || [],
            jobId,
            notice,
          },
        };
        setMessages((prev) => [...prev, assistantMessage]);

        void pushRecent({
          title: userMessage.content.slice(0, 80),
          packId: activePack.id,
          preview: reply.replace(/\*\*/g, '').slice(0, 120),
        });

        void writeDiagnosisToJob(reply);

        if (!offline && speechEnabled) {
          const spoken = reply.replace(/\*\*/g, '').slice(0, 420);
          setSpeaking(true);
          Speech.speak(spoken, {
            rate: 0.95,
            pitch: 0.95,
            onDone: () => setSpeaking(false),
            onStopped: () => setSpeaking(false),
            onError: () => setSpeaking(false),
          });
        }
      } catch (error) {
        const message =
          error instanceof Error && error.message?.trim()
            ? error.message.trim()
            : 'Diagnosis failed. Try again.';
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            content: `Couldn’t complete diagnosis. ${message}`,
            createdAt: Date.now(),
          },
        ]);
      } finally {
        clearTimeout(phaseTimer);
        setBusy(false);
      }
    },
    [
      activePack,
      busy,
      getIdToken,
      input,
      jobId,
      offline,
      pendingAttachment,
      speechEnabled,
      writeDiagnosisToJob,
    ]
  );

  const skipFeedback = useCallback((messageId: string) => {
    setFeedbackError(null);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, askFeedback: false, feedbackStatus: 'skipped' } : m
      )
    );
  }, []);

  const submitFeedback = useCallback(
    async (message: ChatMessage, values: FeedbackFormValues) => {
      setFeedbackBusyId(message.id);
      setFeedbackError(null);
      try {
        if (values.shareAnonymously !== (profile?.shareAnonymously !== false)) {
          void saveProfile({ shareAnonymously: values.shareAnonymously });
        }

        const token = await getIdToken();
        if (!token) {
          setFeedbackError({
            id: message.id,
            message: 'Sign in and join a Pros team to share field tips.',
          });
          return;
        }

        const meta = message.diagnoseMeta;
        await submitFieldFeedback(token, {
          outcome: values.outcome,
          userQuery: meta?.userQuery || '',
          assistantReply: message.content,
          packId: meta?.packId || activePack.id,
          source: meta?.source || 'local',
          tipIdsUsed: meta?.tipIdsUsed || [],
          matchedFaultIds: meta?.matchedFaultIds || [],
          messageId: message.id,
          equipment: values.equipmentLabel ? [values.equipmentLabel] : [],
          equipmentSymptom: values.equipmentSymptom,
          fixSummary: values.fixSummary,
          tipText: values.tipText,
          shareWithTeam: values.shareWithTeam,
          shareAnonymously: values.shareAnonymously,
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id
              ? {
                  ...m,
                  askFeedback: false,
                  feedbackStatus: values.outcome === 'worked' ? 'worked' : 'shared',
                }
              : m
          )
        );
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        void refreshRemoteTips(token, activePack.id);
      } catch (err) {
        const msg =
          err instanceof Error && err.message?.trim()
            ? err.message.trim()
            : 'Could not save feedback.';
        setFeedbackError({ id: message.id, message: msg });
      } finally {
        setFeedbackBusyId(null);
      }
    },
    [activePack.id, getIdToken, profile?.shareAnonymously, saveProfile]
  );

  const toggleVoice = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (listening && voiceRef.current) {
      setListening(false);
      try {
        const text = await voiceRef.current.stop();
        voiceRef.current = null;
        if (text) {
          setInput(text);
          inputRef.current?.focus();
        }
      } catch (err) {
        voiceRef.current = null;
        const msg =
          err instanceof Error && err.message?.trim()
            ? err.message.trim()
            : 'Voice capture failed.';
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: 'assistant', content: msg, createdAt: Date.now() },
        ]);
      }
      return;
    }

    try {
      setListening(true);
      voiceRef.current = await startVoiceCapture({
        getIdToken,
        onPartial: (partial) => setInput(partial),
      });
    } catch (err) {
      setListening(false);
      voiceRef.current = null;
      const msg =
        err instanceof Error && err.message?.trim()
          ? err.message.trim()
          : 'Could not start microphone.';
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', content: msg, createdAt: Date.now() },
      ]);
    }
  }, [getIdToken, listening]);

  useEffect(() => {
    if (autoVoice && sessionReady && !voiceOpenedRef.current) {
      voiceOpenedRef.current = true;
      void toggleVoice();
    }
  }, [autoVoice, sessionReady, toggleVoice]);

  // Ensure pack matches job when opened from a job
  useEffect(() => {
    if (!jobId) return;
    void (async () => {
      const jobs = await loadJobs();
      const job = jobs.find((j) => j.id === jobId);
      if (job?.packId && job.packId !== activePack.id) {
        setActivePackId(job.packId);
      }
    })();
  }, [jobId, activePack.id, setActivePackId]);

  const offset =
    keyboardOffset ??
    (embedInTabs ? (Platform.OS === 'ios' ? 12 : 0) : Math.max(insets.top, 12) + 56);

  const footerPad =
    keyboardHeight > 0
      ? Platform.OS === 'android'
        ? Math.max(insets.bottom, 10)
        : keyboardHeight + 8
      : embedInTabs
        ? 10
        : Math.max(insets.bottom, 10);

  const modeLabel = offline
    ? 'Local · offline'
    : aiSource === 'pros'
      ? 'Pros AI'
      : aiSource === 'direct'
        ? 'Grok + library'
        : 'Library (+ AI when signed in)';

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-hive-bg"
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' && keyboardHeight === 0 ? 'padding' : undefined}
      keyboardVerticalOffset={offset}
    >
      <View className="flex-row items-center justify-between border-b border-hive-border px-4 py-3">
        <PackBadge pack={activePack} />
        <View className="items-end gap-1">
          <NarrationToggle
            enabled={speechEnabled}
            speaking={speaking}
            onToggle={toggleSpeech}
            onStop={stopSpeech}
          />
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-hive-steel">
            {modeLabel}
          </Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        className="flex-1 px-4 pt-3"
        data={messages}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        renderItem={({ item }) => (
          <View>
            <ChatBubble message={item} />
            {item.role === 'assistant' &&
            item.askFeedback &&
            item.feedbackStatus === 'pending' ? (
              <DiagnosisFeedbackCard
                defaultAnonymous={profile?.shareAnonymously !== false}
                busy={feedbackBusyId === item.id}
                error={feedbackError?.id === item.id ? feedbackError.message : null}
                onSubmit={(values) => void submitFeedback(item, values)}
                onSkip={() => skipFeedback(item.id)}
              />
            ) : null}
            {item.role === 'assistant' &&
            (item.feedbackStatus === 'worked' || item.feedbackStatus === 'shared') ? (
              <Text className="mb-2 mt-1 px-1 text-xs text-hive-steel">
                Thanks — saved for your shop
                {profile?.shareAnonymously !== false ? ' (+ anonymous network)' : ''}.
              </Text>
            ) : null}
          </View>
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          <View className="pb-2">{busy ? <PulseLoader text={loadingPhase} /> : null}</View>
        }
      />

      <View
        className="border-t border-hive-border bg-hive-elevated px-3 pt-2"
        style={{ paddingBottom: footerPad }}
      >
        <View className="mb-2 flex-row flex-wrap gap-2">
          {activePack.quickPrompts.slice(0, 3).map((prompt) => (
            <Pressable
              key={prompt}
              onPress={() => void send(prompt)}
              className="rounded-full border border-hive-border bg-hive-card px-3 py-2 active:opacity-70"
            >
              <Text className="text-xs text-hive-steel">{prompt}</Text>
            </Pressable>
          ))}
        </View>

        {pendingAttachment ? (
          <View className="mb-2 flex-row items-center justify-between rounded-xl border border-hive-amber/40 bg-hive-card px-3 py-2">
            <Text className="text-sm text-hive-amber">Photo attached — ready to diagnose</Text>
            <Pressable onPress={() => setPendingAttachment(null)}>
              <Text className="text-sm font-semibold text-hive-steel">Remove</Text>
            </Pressable>
          </View>
        ) : null}

        <View className="flex-row items-end gap-2">
          <Pressable
            accessibilityLabel="Take photo"
            onPress={() => void pickImage(true)}
            className="h-14 w-14 items-center justify-center rounded-2xl border border-hive-border bg-hive-card active:opacity-70"
          >
            <Camera color={theme.colors.amber} size={26} strokeWidth={2.4} />
          </Pressable>

          <Pressable
            accessibilityLabel={listening ? 'Stop voice' : 'Voice input'}
            onPress={() => void toggleVoice()}
            className={`h-14 w-14 items-center justify-center rounded-2xl border active:opacity-70 ${listening ? 'border-hive-danger bg-hive-danger/20' : 'border-hive-border bg-hive-card'}`}
          >
            {listening ? (
              <Square color={theme.colors.danger} size={22} strokeWidth={2.4} />
            ) : (
              <Mic color={theme.colors.mist} size={26} strokeWidth={2.4} />
            )}
          </Pressable>

          <View className="min-h-14 flex-1 justify-center rounded-2xl border border-hive-border bg-hive-card px-3">
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder={listening ? 'Listening…' : 'Describe the fault…'}
              placeholderTextColor={theme.colors.steel}
              multiline
              className="max-h-28 py-3 text-base text-hive-mist"
              onFocus={() =>
                requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))
              }
            />
          </View>

          <Pressable
            accessibilityLabel="Send"
            disabled={busy || (!input.trim() && !pendingAttachment)}
            onPress={() => void send()}
            className={`h-14 w-14 items-center justify-center rounded-2xl active:opacity-70 ${busy || (!input.trim() && !pendingAttachment) ? 'bg-hive-border' : 'bg-hive-amber'}`}
          >
            <Send color={theme.colors.bg} size={24} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
