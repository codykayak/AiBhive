import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = 'hive_proactive_prefs_v1';

export type ProactivePrefs = {
  dailyMotivation: boolean;
  smartSuggestions: boolean;
  calendarReminders: boolean;
  /** Hour of day (0-23) for daily notification */
  dailyHour: number;
  /** Minute (0-59) */
  dailyMinute: number;
};

export const DEFAULT_PROACTIVE_PREFS: ProactivePrefs = {
  dailyMotivation: true,
  smartSuggestions: true,
  calendarReminders: true,
  dailyHour: 8,
  dailyMinute: 0,
};

export async function loadProactivePrefs(): Promise<ProactivePrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PROACTIVE_PREFS };
    return { ...DEFAULT_PROACTIVE_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROACTIVE_PREFS };
  }
}

export async function saveProactivePrefs(prefs: Partial<ProactivePrefs>): Promise<ProactivePrefs> {
  const current = await loadProactivePrefs();
  const next = { ...current, ...prefs };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  return next;
}
