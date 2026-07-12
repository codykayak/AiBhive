import AsyncStorage from '@react-native-async-storage/async-storage';
import { Volume2, VolumeX, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { theme } from '@/constants/theme';

const SKIP_KEY = 'aibhive.diagnose.joinPrompt.skipped';

type JoinTeamModalProps = {
  visible: boolean;
  busy?: boolean;
  error?: string | null;
  onJoin: (code: string) => Promise<void> | void;
  onSkip: () => void;
  onOpenSignup?: () => void;
};

export function JoinTeamModal({
  visible,
  busy,
  error,
  onJoin,
  onSkip,
  onOpenSignup,
}: JoinTeamModalProps) {
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!visible) setCode('');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip}>
      <View className="flex-1 items-center justify-center bg-black/70 px-5">
        <View className="w-full max-w-md rounded-3xl border border-hive-border bg-hive-elevated p-5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-xl font-bold text-hive-mist">Join a Pros team?</Text>
              <Text className="mt-2 text-sm leading-5 text-hive-steel">
                Do you have an invite code from your shop? Enter it to sync jobs and share field tips
                with your team. Tips can also strengthen Diagnose anonymously for every shop on the
                network — no customer or personal details leave your control.
              </Text>
            </View>
            <Pressable onPress={onSkip} hitSlop={12} accessibilityLabel="Close">
              <X color={theme.colors.steel} size={22} />
            </Pressable>
          </View>

          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            placeholder="PROS-XXXXXX"
            placeholderTextColor={theme.colors.steel}
            className="mt-4 min-h-[52px] rounded-xl border border-hive-border bg-hive-bg px-3 text-base text-hive-mist"
          />

          {error ? (
            <Text className="mt-2 text-sm text-hive-danger">{String(error).trim() || 'Something went wrong.'}</Text>
          ) : null}

          <Pressable
            disabled={busy || !code.trim()}
            onPress={() => void onJoin(code.trim())}
            className={`mt-4 min-h-[52px] items-center justify-center rounded-2xl ${busy || !code.trim() ? 'bg-hive-border' : 'bg-hive-amber'}`}
          >
            {busy ? (
              <ActivityIndicator color={theme.colors.bg} />
            ) : (
              <Text className="text-base font-bold text-hive-bg">Join with code</Text>
            )}
          </Pressable>

          <Pressable
            onPress={onOpenSignup}
            className="mt-3 min-h-[48px] items-center justify-center rounded-2xl border border-hive-border"
          >
            <Text className="text-sm font-bold text-hive-mist">Create / manage team on Pros</Text>
            <Text className="text-xs text-hive-steel">aibhive.com/pros/app</Text>
          </Pressable>

          <Pressable onPress={onSkip} className="mt-3 min-h-[44px] items-center justify-center">
            <Text className="text-sm font-semibold text-hive-steel">Skip for now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export async function shouldShowJoinPrompt(): Promise<boolean> {
  try {
    const skipped = await AsyncStorage.getItem(SKIP_KEY);
    return skipped !== '1';
  } catch {
    return true;
  }
}

export async function markJoinPromptSkipped() {
  await AsyncStorage.setItem(SKIP_KEY, '1');
}

/** Small narration chip used in Diagnose chat. */
export function NarrationToggle({
  enabled,
  speaking,
  onToggle,
  onStop,
}: {
  enabled: boolean;
  speaking?: boolean;
  onToggle: () => void;
  onStop: () => void;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={onToggle}
        accessibilityLabel={enabled ? 'Turn narration off' : 'Turn narration on'}
        className={`flex-row items-center gap-1.5 rounded-full border px-2.5 py-1 ${enabled ? 'border-hive-amber/50 bg-hive-amber/15' : 'border-hive-border bg-hive-card'}`}
      >
        {enabled ? (
          <Volume2 color={theme.colors.amber} size={14} strokeWidth={2.4} />
        ) : (
          <VolumeX color={theme.colors.steel} size={14} strokeWidth={2.4} />
        )}
        <Text className={`text-[11px] font-bold ${enabled ? 'text-hive-amber' : 'text-hive-steel'}`}>
          {enabled ? 'Voice on' : 'Voice off'}
        </Text>
      </Pressable>
      {speaking ? (
        <Pressable
          onPress={onStop}
          className="rounded-full border border-hive-danger/40 bg-hive-danger/15 px-2.5 py-1"
        >
          <Text className="text-[11px] font-bold text-hive-danger">Stop</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
