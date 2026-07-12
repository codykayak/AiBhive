import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, Mic, Send, Square } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatBubble } from '@/components/ChatBubble';
import { NarrationToggle } from '@/components/JoinTeamModal';
import { PulseLoader } from '@/components/motion';
import { PackBadge } from '@/components/PackBadge';
import { theme } from '@/constants/theme';
import { useNetwork } from '@/contexts/NetworkContext';
import { usePack } from '@/contexts/PackContext';
import { askGrok } from '@/lib/grok';
import type { ChatAttachment, ChatMessage } from '@/lib/packs';
import { pushRecent } from '@/lib/recents';

const SPEECH_KEY = 'aibhive.diagnose.speechEnabled';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type DiagnoseChatProps = {
  initialPrompt?: string;
  autoCamera?: boolean;
  /** Extra offset when embedded under a stack header (diagnose-session). */
  keyboardOffset?: number;
  /** When true (tab screen), bottom safe-area is handled by the tab bar. */
  embedInTabs?: boolean;
};

export function DiagnoseChat({
  initialPrompt,
  autoCamera,
  keyboardOffset,
  embedInTabs = false,
}: DiagnoseChatProps) {
  const { activePack } = usePack();
  const { isOnline, isInternetReachable } = useNetwork();
  const insets = useSafeAreaInsets();
  const offline = !isOnline || isInternetReachable === false;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('Diagnosing…');
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const seededRef = useRef(false);
  const cameraOpenedRef = useRef(false);

  useEffect(() => {
    void AsyncStorage.getItem(SPEECH_KEY).then((v) => {
      if (v === '1') setSpeechEnabled(true);
    });
  }, []);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    setMessages([
      {
        id: uid(),
        role: 'assistant',
        content: `Ready on **${activePack.name}**. Snap a photo, tap a quick prompt, or describe the fault — I’ll match the field library and walk the fix.`,
        createdAt: Date.now(),
      },
    ]);
    seededRef.current = false;
    Speech.stop();
    setSpeaking(false);
  }, [activePack.id]);

  useEffect(() => {
    if (initialPrompt && !seededRef.current) {
      seededRef.current = true;
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

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
    if (autoCamera && !cameraOpenedRef.current) {
      cameraOpenedRef.current = true;
      void pickImage(true);
    }
  }, [autoCamera, pickImage]);

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

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setPendingAttachment(null);
      setBusy(true);
      setLoadingPhase('Scanning pack library…');
      Speech.stop();
      setSpeaking(false);

      const phaseTimer = setTimeout(() => setLoadingPhase('Building repair steps…'), 450);

      try {
        const reply = await askGrok({
          pack: activePack,
          messages,
          userText: userMessage.content,
          attachment: userMessage.attachment,
        });

        const assistantMessage: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: reply,
          createdAt: Date.now(),
          isDiagnosis: Boolean(userMessage.attachment),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        void pushRecent({
          title: userMessage.content.slice(0, 80),
          packId: activePack.id,
          preview: reply.replace(/\*\*/g, '').slice(0, 120),
        });

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
        const message = error instanceof Error && error.message ? error.message : 'Diagnosis failed.';
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
    [activePack, busy, input, messages, offline, pendingAttachment, speechEnabled]
  );

  const toggleVoicePlaceholder = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (listening) {
      setListening(false);
      return;
    }
    setListening(true);
    setTimeout(() => {
      setListening(false);
      const sample =
        activePack.id === 'pool'
          ? 'Pump is humming but not moving water after backwash'
          : activePack.id === 'property'
            ? 'Dishwasher won’t drain — standing water after cycle'
            : 'Breaker trips as soon as the load kicks on';
      setInput(sample);
    }, 1100);
  };

  const tabBarPad = 56 + Math.max(insets.bottom, 8);
  const offset =
    keyboardOffset ??
    (embedInTabs ? (Platform.OS === 'ios' ? tabBarPad : 24) : Math.max(insets.top, 12) + 56);
  const footerPad = embedInTabs ? 10 : Math.max(insets.bottom, 10);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-hive-bg"
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
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
            {offline ? 'Local mode' : 'Grok + library'}
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
        renderItem={({ item }) => <ChatBubble message={item} />}
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
            onPress={toggleVoicePlaceholder}
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
              value={input}
              onChangeText={setInput}
              placeholder="Describe the fault…"
              placeholderTextColor={theme.colors.steel}
              multiline
              className="max-h-28 py-3 text-base text-hive-mist"
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
