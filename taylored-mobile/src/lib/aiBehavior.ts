import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_BEHAVIOR,
  type AiBehaviorPrefs,
  type ResponseStyle,
} from '../constants/hivePrompt';

const BEHAVIOR_KEY = 'hive_ai_behavior_v1';

export async function loadAiBehavior(): Promise<AiBehaviorPrefs> {
  try {
    const raw = await AsyncStorage.getItem(BEHAVIOR_KEY);
    if (!raw) return { ...DEFAULT_BEHAVIOR };
    return { ...DEFAULT_BEHAVIOR, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_BEHAVIOR };
  }
}

export async function saveAiBehavior(prefs: AiBehaviorPrefs): Promise<void> {
  await AsyncStorage.setItem(BEHAVIOR_KEY, JSON.stringify(prefs));
}

export async function setResponseStyle(style: ResponseStyle): Promise<AiBehaviorPrefs> {
  const current = await loadAiBehavior();
  const next = { ...current, responseStyle: style };
  await saveAiBehavior(next);
  return next;
}

export async function setMaxOutputTokens(tokens: number): Promise<AiBehaviorPrefs> {
  const current = await loadAiBehavior();
  const next = { ...current, maxOutputTokens: tokens };
  await saveAiBehavior(next);
  return next;
}

export async function setCustomInstructions(text: string): Promise<AiBehaviorPrefs> {
  const current = await loadAiBehavior();
  const next = { ...current, customInstructions: text };
  await saveAiBehavior(next);
  return next;
}
