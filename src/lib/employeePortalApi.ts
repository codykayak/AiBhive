import type { User } from 'firebase/auth';

const apiBase = import.meta.env.VITE_API_URL ?? '';

async function portalFetch(path: string, user: User, options: RequestInit = {}) {
  const token = await user.getIdToken();
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${apiBase}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.hint || res.statusText);
  return data;
}

export type EmployeePortalMe = {
  ok: boolean;
  email: string;
  profile: {
    displayName: string;
    dailyChecklist: Record<string, boolean>;
    shiftNotes: string;
    lastChecklistDate: string | null;
  };
  links: {
    leadAgentApk: string;
    leadAgentHealth: string;
    leadAgentIosTestFlight?: string;
    leadAgentIosInstall?: string;
    leadAgentIosReady?: boolean;
    macrorei: string;
    manydoors: string;
    aibhive: string;
  };
};

export async function fetchEmployeePortalMe(user: User) {
  return portalFetch('/api/employee-portal/me', user) as Promise<EmployeePortalMe>;
}

export async function saveEmployeePortalProfile(
  user: User,
  patch: Partial<EmployeePortalMe['profile']> & { lastChecklistDate?: string },
) {
  return portalFetch('/api/employee-portal/profile', user, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}

export type DeskLead = {
  id: string;
  name: string;
  phone: string;
  propertyAddress: string;
  status: string;
  optedOut: boolean;
  textCount: number | null;
  lastTextBody?: string;
  lastContactAt?: string | null;
  lastCallDisposition?: string;
  lastCallNotes?: string;
  needsHuman?: boolean;
  grokVoiceInterest?: boolean;
  lastEmployeeEmail?: string;
};

export type EmployeeDeskSnapshot = {
  syncedAt?: string;
  business: {
    id: string;
    name: string;
    tagline: string;
    phoneDisplay: string;
    greeting: string;
    website?: string;
    brandColor?: string;
  };
  businesses: { id: string; name: string }[];
  leads: DeskLead[];
  analytics?: {
    total: number;
    open: number;
    optedOut: number;
    texted: number;
    notTexted: number;
    needsHuman: number;
    replied: number;
    callbacks: number;
    byStatus: Record<string, number>;
  };
  tuning?: {
    agentEnabled: boolean;
    automationEnabled: boolean;
    smsProvider: string;
    dailySmsLimit: number;
    dailySmsSuggested: number;
    sendWindowStart: number;
    sendWindowEnd: number;
    sendTimezone: string;
    minDelayMinutes: number;
    maxDelayMinutes: number;
    escalationKeywords: string[];
    escalationMessage: string;
    outboundTemplate: string;
  };
  infrastructure?: {
    twilioSmsReady: boolean;
    twilioVoiceReady: boolean;
    twilioFrom: string;
    grokVoiceLine: { display: string; e164: string } | null;
    returnCallWebhookPath: string;
    smsWebhookPath: string;
    employeeVoiceTwimlPath: string;
    workspaceUid: string;
  };
  recentActivity?: {
    id: string;
    name: string;
    phone: string;
    status: string;
    lastContactAt: string | null;
    lastCallDisposition?: string;
    textCount: number | null;
  }[];
  queue: {
    total: number;
    remaining: number;
    position: number;
    current: DeskLead | null;
    openPreview?: {
      id: string;
      name: string;
      phone: string;
      propertyAddress: string;
      status: string;
      textCount: number | null;
    }[];
  };
  quota: { ok: boolean; reason: string | null; sent: number; limit: number; suggested?: number };
  today: { date: string; calls: number; texts: number; lastLeadId: string | null; lastDisposition: string | null };
  line: { smsReady: boolean; voiceReady: boolean; from: string };
};

export async function fetchEmployeeDesk(user: User, businessId = 'macrorei') {
  return portalFetch(`/api/employee-portal/desk?businessId=${encodeURIComponent(businessId)}`, user) as Promise<EmployeeDeskSnapshot>;
}

export async function textNextLead(user: User, businessId: string) {
  return portalFetch('/api/employee-portal/desk/text-next', user, {
    method: 'POST',
    body: JSON.stringify({ businessId }),
  }) as Promise<{ done: boolean; reason?: string; lead?: DeskLead; body?: string; today?: EmployeeDeskSnapshot['today'] }>;
}

export async function logEmployeeCall(
  user: User,
  payload: { businessId: string; leadId: string; disposition: string; notes?: string },
) {
  return portalFetch('/api/employee-portal/desk/call-log', user, {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<{ ok: boolean; today: EmployeeDeskSnapshot['today'] }>;
}

export async function importEmployeeLeads(
  user: User,
  businessId: string,
  leads: { name: string; phone: string; propertyAddress: string }[],
) {
  return portalFetch('/api/employee-portal/desk/import', user, {
    method: 'POST',
    body: JSON.stringify({ businessId, leads }),
  }) as Promise<{ imported: number; duplicates: number; skipped: number; total: number }>;
}

export type LeadThread = {
  lead: DeskLead;
  messages: { id: string; direction: string; body: string; at: string | null; employeeEmail: string }[];
  textCount: number;
  inboundCount: number;
};

export async function fetchLeadThread(user: User, businessId: string, leadId: string) {
  return portalFetch(
    `/api/employee-portal/desk/leads/${encodeURIComponent(leadId)}?businessId=${encodeURIComponent(businessId)}`,
    user,
  ) as Promise<LeadThread>;
}

export async function textSelectedLeads(user: User, businessId: string, leadIds: string[]) {
  return portalFetch('/api/employee-portal/desk/text-selected', user, {
    method: 'POST',
    body: JSON.stringify({ businessId, leadIds }),
  }) as Promise<{
    sent: { leadId: string; name: string; phone: string }[];
    failed: { leadId: string; error: string }[];
    today?: EmployeeDeskSnapshot['today'];
  }>;
}

export async function fetchEmployeeVoiceToken(user: User) {
  return portalFetch('/api/employee-portal/desk/voice-token', user) as Promise<{
    ready: boolean;
    token?: string;
    hint?: string;
    smsReady?: boolean;
    from?: string;
  }>;
}

export async function employeePortalChat(
  user: User,
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
) {
  return portalFetch('/api/employee-portal/chat', user, {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  }) as Promise<{ reply: string }>;
}
