import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ChatMessage, TradePackId } from '@/lib/packs/types';

const KEY = 'aibhive.diagnose.sessions.v2';
const MAX_MESSAGES = 40;

type SessionMap = Record<string, ChatMessage[]>;

function sessionKey(packId: TradePackId, jobId?: string | null) {
  return jobId ? `${packId}:job:${jobId}` : packId;
}

async function readAll(): Promise<SessionMap> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionMap) : {};
  } catch {
    return {};
  }
}

export async function loadSession(
  packId: TradePackId,
  jobId?: string | null
): Promise<ChatMessage[]> {
  const all = await readAll();
  return all[sessionKey(packId, jobId)] || [];
}

export async function saveSession(
  packId: TradePackId,
  messages: ChatMessage[],
  jobId?: string | null
): Promise<void> {
  const all = await readAll();
  const trimmed = messages.slice(-MAX_MESSAGES).map((m) => ({
    ...m,
    // Drop heavy base64 from persisted attachments — keep uri for preview.
    attachment: m.attachment
      ? { uri: m.attachment.uri, mimeType: m.attachment.mimeType }
      : undefined,
  }));
  all[sessionKey(packId, jobId)] = trimmed;
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export async function clearSession(packId: TradePackId, jobId?: string | null): Promise<void> {
  const all = await readAll();
  delete all[sessionKey(packId, jobId)];
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export function welcomeMessage(packName: string): ChatMessage {
  return {
    id: `welcome-${Date.now()}`,
    role: 'assistant',
    content: `Ready on **${packName}**. Snap a photo, tap the mic, or describe the fault — I’ll match the field library and walk the fix.`,
    createdAt: Date.now(),
  };
}
