export type TradePackId = 'pool' | 'electrical';

export type DiagnosisCategory = {
  id: string;
  label: string;
  examples: string[];
};

export type TradePack = {
  id: TradePackId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  accentColor: string;
  icon: 'waves' | 'zap';
  categories: DiagnosisCategory[];
  systemPrompt: string;
  quickPrompts: string[];
  commonEquipment: string[];
};

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatAttachment = {
  uri: string;
  mimeType?: string;
  base64?: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  attachment?: ChatAttachment;
  isDiagnosis?: boolean;
};

export type DiagnosisResult = {
  summary: string;
  likelyCauses: string[];
  steps: string[];
  safetyNotes: string[];
  partsToCheck: string[];
};
