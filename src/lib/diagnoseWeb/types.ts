import type { TradePackId } from '../../../aibhive-diagnose/lib/packs/types';

export type DiagnoseWebMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  attachmentPreview?: string;
  source?: 'local' | 'grok';
  matchedFaultIds?: string[];
};

export type DiagnoseWebJob = {
  id: string;
  title: string;
  address: string;
  packId: TradePackId;
  status: 'queued' | 'in_progress' | 'needs_parts' | 'done';
  notes: string;
  createdAt: number;
  scheduledFor?: string;
};

export type DiagnoseWebAccount = {
  hiveUserId: string;
  creditBalanceUsd: number;
  totalRemainingUsd?: number;
  welcomeCreditUsd: number;
};

export class DiagnoseCreditsError extends Error {
  code = 'credits_depleted' as const;
  amountUsd?: number;
  constructor(message: string, amountUsd?: number) {
    super(message);
    this.name = 'DiagnoseCreditsError';
    this.amountUsd = amountUsd;
  }
}

export class DiagnoseAuthError extends Error {
  code = 'auth_required' as const;
  constructor(message = 'Sign in required') {
    super(message);
    this.name = 'DiagnoseAuthError';
  }
}
