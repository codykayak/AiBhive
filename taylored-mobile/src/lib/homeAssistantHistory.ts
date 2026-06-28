import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'aibhive_home_assistant_chat_v1';
const MAX_MESSAGES = 60;

export type StoredHomeChatMessage = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  at: string;
  imageUri?: string;
};

export async function loadHomeAssistantHistory(): Promise<StoredHomeChatMessage[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredHomeChatMessage[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveHomeAssistantHistory(messages: StoredHomeChatMessage[]): Promise<void> {
  const trimmed = messages.filter((m) => m.id !== 'welcome').slice(-MAX_MESSAGES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export async function clearHomeAssistantHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
