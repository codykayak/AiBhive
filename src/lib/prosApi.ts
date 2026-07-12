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
  packId: 'pool' | 'electrical' | 'property' | 'plumbing' | 'hvac';
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
  tradePack?: 'pool' | 'electrical' | 'property' | 'plumbing' | 'hvac';
};

export type ProsCompanySettings = {
  locationTrackingEnabled: boolean;
  locationPingIntervalMinutes: number;
  requireJobPhotos: boolean;
  preferredAiProvider: string;
  defaultPack: string;
  billingStatus: string;
};

export type ProsTeamLocation = {
  uid: string;
  displayName: string;
  email?: string | null;
  lat: number | null;
  lng: number | null;
  accuracyM?: number | null;
  updatedAt: number | null;
  stale: boolean;
  onJobId?: string | null;
};

export type ProsNotification = {
  id: string;
  title: string;
  body: string;
  type: 'job_update' | 'announcement' | 'dispatch';
  priority: 'normal' | 'high' | 'urgent';
  jobId: string | null;
  jobTitle: string | null;
  assigneeUid: string | null;
  assigneeName: string | null;
  status: 'pending' | 'completed' | 'declined';
  response: {
    completed: boolean;
    fixSummary: string;
    tipText?: string | null;
    respondedByUid: string;
  } | null;
  createdAt: number | null;
  respondedAt: number | null;
};

export type ProsAnalytics = {
  totals: {
    tips: number;
    feedback: number;
    manualChunks: number;
    jobsTotal: number;
    jobsDone: number;
    fieldNotes: number;
    openJobs: number;
  };
  knowledgeGrowth: Array<{
    month: string;
    label: string;
    tips: number;
    feedback: number;
    jobsDone: number;
    activity: number;
  }>;
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

export async function prosSettings(user: User) {
  return prosJson<{ settings: ProsCompanySettings }>('/api/pros/settings', user);
}

export async function prosPatchSettings(user: User, settings: Partial<ProsCompanySettings>) {
  return prosJson<{ success: boolean; settings: ProsCompanySettings }>('/api/pros/settings', user, {
    method: 'PATCH',
    body: JSON.stringify({ settings }),
  });
}

export async function prosAnalytics(user: User) {
  return prosJson<ProsAnalytics>('/api/pros/analytics', user);
}

export async function prosTeamLocations(user: User) {
  return prosJson<{
    trackingEnabled: boolean;
    pingIntervalMinutes: number;
    locations: ProsTeamLocation[];
  }>('/api/pros/location/team', user);
}

export async function prosNotifications(user: User) {
  return prosJson<{ notifications: ProsNotification[] }>('/api/pros/notifications', user);
}

export async function prosSendNotification(
  user: User,
  payload: {
    title: string;
    body: string;
    assigneeUid?: string | null;
    assigneeName?: string | null;
    jobId?: string | null;
    jobTitle?: string | null;
    priority?: ProsNotification['priority'];
    type?: ProsNotification['type'];
  }
) {
  return prosJson<{ notification: ProsNotification }>('/api/pros/notifications', user, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function prosRespondNotification(
  user: User,
  id: string,
  payload: { completed: boolean; fixSummary: string; tipText?: string; jobTitle?: string; packId?: string }
) {
  return prosJson<{ success: boolean }>(`/api/pros/notifications/${id}/respond`, user, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
