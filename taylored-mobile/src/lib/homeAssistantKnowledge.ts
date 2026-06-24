import { HOME_ASSISTANT_KNOWLEDGE } from '../constants/homeAssistantKnowledgeBundled';

const HIVE_API_BASE = 'https://aibhive.com';
let cachedRemote: { markdown: string; at: number } | null = null;
const CACHE_MS = 1000 * 60 * 60 * 6;

export async function loadHomeAssistantKnowledge(): Promise<string> {
  const now = Date.now();
  if (cachedRemote && now - cachedRemote.at < CACHE_MS) {
    return cachedRemote.markdown;
  }
  try {
    const res = await fetch(`${HIVE_API_BASE}/api/hive/home-assist/knowledge`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()) as { markdown?: string };
      if (data.markdown?.trim()) {
        cachedRemote = { markdown: data.markdown, at: now };
        return data.markdown;
      }
    }
  } catch {
    // offline — bundled fallback
  }
  return HOME_ASSISTANT_KNOWLEDGE;
}

export function preloadHomeAssistantKnowledge(): void {
  void loadHomeAssistantKnowledge();
}
