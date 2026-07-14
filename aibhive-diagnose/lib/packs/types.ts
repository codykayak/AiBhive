export type TradePackId = 'pool' | 'electrical' | 'property' | 'plumbing' | 'hvac';

export type DiagnosisCategory = {
  id: string;
  label: string;
  examples: string[];
  /** Optional hero image (require() module id) for category home. */
  heroImage?: number;
};

export type TradePack = {
  id: TradePackId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  accentColor: string;
  icon: 'waves' | 'zap' | 'wrench' | 'droplets' | 'wind';
  /** Pack-level hero for Packs / Home cards */
  heroImage?: number;
  categories: DiagnosisCategory[];
  systemPrompt: string;
  quickPrompts: string[];
  commonEquipment: string[];
  /** When true, diagnosis also searches other packs (property maintenance). */
  crossPackSearch?: boolean;
};

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatAttachment = {
  uri: string;
  mimeType?: string;
  base64?: string;
};

export type ManualSearchLink = {
  label: string;
  query: string;
  googleUrl: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  attachment?: ChatAttachment;
  isDiagnosis?: boolean;
  /** Show "Did this work?" for this assistant turn */
  askFeedback?: boolean;
  feedbackStatus?: 'pending' | 'worked' | 'didnt' | 'shared' | 'skipped';
  diagnoseMeta?: {
    userQuery: string;
    source: 'local' | 'pros' | 'direct';
    packId: TradePackId;
    tipIdsUsed?: string[];
    matchedFaultIds?: string[];
    jobId?: string;
    notice?: string;
    manualSearchLinks?: ManualSearchLink[];
    orderPartPrefill?: {
      partName?: string;
      partNumber?: string;
      brand?: string;
      equipmentModel?: string;
      notes?: string;
    };
    autoOpenOrder?: boolean;
    intentType?: 'ordering_parts' | 'find_manual' | 'diagnose';
  };
  /** Parsed structured diagnosis for checkbox UI */
  structured?: DiagnosisResult;
};

export type DiagnosisResult = {
  summary: string;
  likelyCauses: string[];
  steps: string[];
  safetyNotes: string[];
  partsToCheck: string[];
};
