import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  AI_PROVIDERS,
  getProviderDef,
  type ProviderId,
} from '../constants/providers';

const PREFS_KEY = 'hive_ai_prefs_v2';
const MIGRATION_FLAG = 'hive_ai_prefs_migrated_v2';

export type ProviderPrefs = {
  enabled: boolean;
  model: string;
  customModel?: string;
};

export type AiPrefs = {
  activeProviderId: ProviderId;
  providers: Record<ProviderId, ProviderPrefs>;
};

export const DEFAULT_PREFS: AiPrefs = {
  activeProviderId: 'gemini',
  providers: {
    gemini: { enabled: true, model: 'gemini-2.5-flash' },
    kimi: { enabled: false, model: 'kimi-k2.6' },
    grok: { enabled: false, model: 'grok-3-mini' },
    claude: { enabled: false, model: 'claude-sonnet-4-20250514' },
    custom: { enabled: false, model: 'gpt-4o-mini', customModel: 'gpt-4o-mini' },
  },
};

function keyForProvider(id: ProviderId): string {
  return `api_key_${id}`;
}

function clonePrefs(): AiPrefs {
  return {
    activeProviderId: DEFAULT_PREFS.activeProviderId,
    providers: { ...DEFAULT_PREFS.providers },
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

async function secureSet(key: string, value: string): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) {
    await withTimeout(SecureStore.deleteItemAsync(key), 2500, undefined);
    return;
  }
  await withTimeout(SecureStore.setItemAsync(key, trimmed), 2500, undefined);
}

async function secureGet(key: string): Promise<string | null> {
  try {
    return await withTimeout(SecureStore.getItemAsync(key), 2500, null);
  } catch {
    return null;
  }
}

async function migrateLegacySettings(): Promise<void> {
  const migrated = await AsyncStorage.getItem(MIGRATION_FLAG);
  if (migrated === '1') return;

  await AsyncStorage.setItem(MIGRATION_FLAG, '1');
  const prefs = clonePrefs();

  try {
    const legacyProvider = await secureGet('selected_ai_provider');
    if (legacyProvider) {
      const id = AI_PROVIDERS.find(
        (p) => p.label.toLowerCase() === legacyProvider.toLowerCase() || p.id === legacyProvider.toLowerCase()
      )?.id;
      if (id) {
        prefs.activeProviderId = id;
        prefs.providers[id].enabled = true;
      }
    }

    for (const def of AI_PROVIDERS) {
      const key =
        (await secureGet(`api_key_${def.id}`)) ||
        (await secureGet(`api_key_${def.label.toLowerCase()}`));
      if (key?.trim()) {
        await secureSet(keyForProvider(def.id), key);
        prefs.providers[def.id].enabled = true;
      }
    }

    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }
}

export async function loadAiPrefs(): Promise<AiPrefs> {
  await migrateLegacySettings();
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return clonePrefs();
    const parsed = JSON.parse(raw) as Partial<AiPrefs>;
    return {
      activeProviderId: parsed.activeProviderId ?? DEFAULT_PREFS.activeProviderId,
      providers: { ...DEFAULT_PREFS.providers, ...parsed.providers },
    };
  } catch {
    return clonePrefs();
  }
}

async function saveAiPrefs(prefs: AiPrefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export async function getProviderApiKey(id: ProviderId): Promise<string | null> {
  return secureGet(keyForProvider(id));
}

export async function saveProviderApiKey(id: ProviderId, apiKey: string): Promise<void> {
  await secureSet(keyForProvider(id), apiKey);
}

export async function getFirecrawlApiKey(): Promise<string | null> {
  return secureGet('api_key_firecrawl');
}

export async function saveFirecrawlApiKey(apiKey: string): Promise<void> {
  await secureSet('api_key_firecrawl', apiKey);
}

export async function setProviderEnabled(id: ProviderId, enabled: boolean): Promise<AiPrefs> {
  const prefs = await loadAiPrefs();
  prefs.providers[id] = { ...prefs.providers[id], enabled };
  if (enabled) {
    prefs.activeProviderId = id;
  } else if (prefs.activeProviderId === id) {
    const fallback = (Object.keys(prefs.providers) as ProviderId[]).find(
      (pid) => pid !== id && prefs.providers[pid].enabled
    );
    if (fallback) prefs.activeProviderId = fallback;
  }
  await saveAiPrefs(prefs);
  return prefs;
}

export async function setActiveProvider(id: ProviderId): Promise<AiPrefs> {
  const prefs = await loadAiPrefs();
  prefs.activeProviderId = id;
  prefs.providers[id] = { ...prefs.providers[id], enabled: true };
  await saveAiPrefs(prefs);
  return prefs;
}

export async function setProviderModel(id: ProviderId, model: string): Promise<AiPrefs> {
  const prefs = await loadAiPrefs();
  prefs.providers[id] = { ...prefs.providers[id], model };
  await saveAiPrefs(prefs);
  return prefs;
}

export async function setCustomModel(id: ProviderId, customModel: string): Promise<AiPrefs> {
  const prefs = await loadAiPrefs();
  prefs.providers[id] = {
    ...prefs.providers[id],
    customModel,
    model: customModel.trim() || prefs.providers[id].model,
  };
  await saveAiPrefs(prefs);
  return prefs;
}

export type ActiveLlmConfig = {
  providerId: ProviderId;
  providerLabel: string;
  model: string;
  apiKey: string;
};

export async function getActiveLlmConfig(): Promise<ActiveLlmConfig | null> {
  const prefs = await loadAiPrefs();
  const order: ProviderId[] = [prefs.activeProviderId, ...AI_PROVIDERS.map((p) => p.id)];

  for (const id of [...new Set(order)]) {
    const p = prefs.providers[id];
    if (!p?.enabled) continue;
    const apiKey = await getProviderApiKey(id);
    if (!apiKey) continue;
    const def = getProviderDef(id);
    const model =
      id === 'custom' && p.customModel?.trim() ? p.customModel.trim() : p.model || def.defaultModel;
    return {
      providerId: id,
      providerLabel: def.label,
      model,
      apiKey,
    };
  }
  return null;
}

export async function getGeminiApiKey(): Promise<string | null> {
  const config = await getActiveLlmConfig();
  if (config?.providerId === 'gemini') return config.apiKey;
  return getProviderApiKey('gemini');
}

export const GEMINI_MODEL = 'gemini-2.0-flash';

export async function getSelectedProvider(): Promise<string> {
  const prefs = await loadAiPrefs();
  return getProviderDef(prefs.activeProviderId).label;
}

export async function getApiKeyForProvider(providerLabel: string): Promise<string | null> {
  const id = AI_PROVIDERS.find((p) => p.label.toLowerCase() === providerLabel.toLowerCase())?.id;
  if (!id) return null;
  return getProviderApiKey(id);
}
