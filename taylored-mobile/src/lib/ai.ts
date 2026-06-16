import * as SecureStore from 'expo-secure-store';

export const GEMINI_MODEL = 'gemini-2.0-flash';

export async function getSelectedProvider(): Promise<string> {
  return (await SecureStore.getItemAsync('selected_ai_provider')) || 'Gemini';
}

export async function getApiKeyForProvider(provider: string): Promise<string | null> {
  return SecureStore.getItemAsync(`api_key_${provider.toLowerCase()}`);
}

export async function getGeminiApiKey(): Promise<string | null> {
  const selected = await getSelectedProvider();
  if (selected === 'Gemini') {
    return getApiKeyForProvider('Gemini');
  }
  return getApiKeyForProvider('Gemini');
}

export async function getFirecrawlApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync('api_key_firecrawl');
}
