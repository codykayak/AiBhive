import type { User } from 'firebase/auth';
import { adminFetch, adminJson } from './adminApi';

export type ProsProviderId = 'grok' | 'claude' | 'kimi' | 'gemini';

export type ProsAiProvider = {
  id: ProsProviderId;
  label: string;
  hint: string;
  configured: boolean;
  source: 'company' | 'platform_env' | 'none';
  last4: string | null;
  updatedAt: number | null;
};

export type ProsJob = {
  id: string;
  title: string;
  address: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  adminNotes: string;
  packId: 'pool' | 'electrical';
  status: 'queued' | 'in_progress' | 'needs_parts' | 'done';
  priority: 'low' | 'normal' | 'high' | 'emergency';
  assigneeUid: string | null;
  assigneeName: string | null;
  scheduledFor: string | null;
  fieldNotes: Array<{ id: string; text: string; authorUid: string; createdAt: number }>;
  photos: Array<{ id: string; url: string; caption?: string; createdAt: number }>;
  createdAt: number | null;
  updatedAt: number | null;
};

export type ProsMember = {
  uid: string;
  email?: string | null;
  displayName?: string;
  photoUrl?: string | null;
  role: 'owner' | 'manager' | 'tech';
  status: 'active' | 'inactive';
  tradePack?: 'pool' | 'electrical';
};

export const prosJson = adminJson;
export const prosFetch = adminFetch;

export async function prosMe(user: User) {
  return adminJson<{
    user: { uid: string; email?: string };
    company: null | {
      id: string;
      name: string;
      tradeType: string;
      inviteCode?: string;
      timezone?: string;
      settings?: Record<string, unknown>;
    };
    membership: null | { companyId: string; role: string };
    isPlatformAdmin: boolean;
  }>('/api/pros/me', user);
}
