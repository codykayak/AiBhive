import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTO_APPROVE_KEY = 'hive_auto_approve_under_usd_v1';
export const AUTO_APPROVE_DEFAULT_USD = 1.5;

/**
 * Builds whose user-facing estimate is ≤ this amount auto-approve without
 * the Hive Magic card. 0 disables. Users can change this in Settings later.
 */
export async function getAutoApproveUnderUsd(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(AUTO_APPROVE_KEY);
    if (raw === null) return AUTO_APPROVE_DEFAULT_USD;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return AUTO_APPROVE_DEFAULT_USD;
    return parsed;
  } catch {
    return AUTO_APPROVE_DEFAULT_USD;
  }
}

export async function setAutoApproveUnderUsd(value: number): Promise<void> {
  const safe = Number.isFinite(value) && value >= 0 ? value : 0;
  await AsyncStorage.setItem(AUTO_APPROVE_KEY, String(safe));
}
