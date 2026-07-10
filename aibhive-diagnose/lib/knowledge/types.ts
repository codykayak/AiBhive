export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type FaultEntry = {
  id: string;
  packId: 'pool' | 'electrical';
  category: string;
  title: string;
  aliases: string[];
  symptoms: string[];
  likelyCauses: string[];
  steps: string[];
  safety: string[];
  tools: string[];
  parts: string[];
  severity: Severity;
  proTips: string[];
};

export type ErrorCode = {
  id: string;
  packId: 'pool' | 'electrical';
  brand?: string;
  code: string;
  meaning: string;
  fix: string[];
  severity: Severity;
};

export type PartItem = {
  id: string;
  packId: 'pool' | 'electrical';
  name: string;
  category: string;
  commonFor: string[];
  notes?: string;
};

export type GuidedStep = {
  id: string;
  prompt: string;
  yesNext?: string;
  noNext?: string;
  resultFaultId?: string;
};

export type GuidedFlow = {
  id: string;
  packId: 'pool' | 'electrical';
  title: string;
  description: string;
  startStepId: string;
  steps: Record<string, GuidedStep>;
};
