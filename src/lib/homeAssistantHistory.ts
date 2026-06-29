export type WebAssistantMessage = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  at: string;
};

const STORAGE_KEY = 'aibhive_web_assistant_v1';

export function loadAssistantHistory(): WebAssistantMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WebAssistantMessage[];
    return Array.isArray(parsed) ? parsed.slice(-40) : [];
  } catch {
    return [];
  }
}

export function saveAssistantHistory(messages: WebAssistantMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
  } catch {
    // ignore quota
  }
}

export function clearAssistantHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
