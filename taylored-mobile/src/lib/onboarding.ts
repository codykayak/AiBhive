import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'hive_onboarding_done_v3';

export async function isOnboardingDone(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === 'true';
}

export async function markOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}
