export {
  GEMINI_MODEL,
  getActiveLlmConfig,
  getApiKeyForProvider,
  getFirecrawlApiKey,
  getGeminiApiKey,
  getProviderApiKey,
  getSelectedProvider,
  getSerpApiKey,
  loadAiPrefs,
  saveFirecrawlApiKey,
  saveProviderApiKey,
  saveSerpApiKey,
  setActiveProvider,
  setCustomModel,
  setProviderEnabled,
  setProviderModel,
  DEFAULT_PREFS,
  type ActiveLlmConfig,
  type AiPrefs,
} from './settings';

export { generateWithParts, sendChatMessage, type ChatTurn } from './llm';

export {
  loadAiBehavior,
  saveAiBehavior,
  setCustomInstructions,
  setMaxOutputTokens,
  setResponseStyle,
} from './aiBehavior';
