import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HiveTask } from './hiveApi';

const STORAGE_KEY = 'hive_chat_history_v1';
const MAX_MESSAGES = 80;

export type StoredChatMessage = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  task?: HiveTask;
  at: string;
};

export async function loadChatHistory(): Promise<StoredChatMessage[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredChatMessage[];
  } catch {
    return null;
  }
}

export async function saveChatHistory(messages: StoredChatMessage[]): Promise<void> {
  const trimmed = messages.slice(-MAX_MESSAGES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export async function clearChatHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
