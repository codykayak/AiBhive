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
  phones?: string[];
  dialPhoneIndex?: number;
  callbackAt?: string | null;
  email?: string;
  emailCount?: number | null;
  lastEmailBody?: string;
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
  callCount?: number | null;
};

export type DeskCallLog = {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  propertyAddress: string;
  disposition: string;
  notes: string;
  channel: string;
  durationSec: number | null;
  employeeEmail: string;
  employeeUid: string;
  at: string | null;
};

export type DeskCallTracking = {
  timezone: string;
  today: string;
  todayCalls: number;
  todayTalked: number;
  totalLogged: number;
  byDisposition: Record<string, number>;
  byAgent: { email: string; calls: number; talked: number; callbacks: number }[];
  hourlyToday: { hour: number; count: number }[];
  avgDurationSec: number | null;
  connectRatePct: number | null;
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
    outreachMaxOwnerTouches?: number;
    outreachMinHoursBetweenTouches?: number;
    outreachRelativeCooldownHours?: number;
    outreachRelativeSearchEnabled?: boolean;
    followUpOutboundTemplate?: string;
    relativeOutboundTemplate?: string;
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
  callFeed?: DeskCallLog[];
  callTracking?: DeskCallTracking;
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
  grokSmsAgent?: boolean;
  outlook?: {
    configured: boolean;
    connected: boolean;
    connectedEmail: string;
    connectedAt: string | null;
    oauthReady?: boolean;
  };
};

export type NotifyPhoneEntry = { id: string; label: string; e164: string };

export type EscalationOpsSettings = {
  escalationNotifyPhone: string;
  escalationNotifyLabel: string;
  notifyPhones: NotifyPhoneEntry[];
  activeNotifyPhoneId: string;
  schedulingTimezone: string;
  allowImmediateCallback: boolean;
  immediateCallbackMinutes: number;
  weeklyAvailability: Record<string, { dayOff?: boolean; afterHour?: number; untilHour?: number }>;
  schedulingPhrases: { immediate?: string; laterToday?: string; nextWindow?: string };
  todayOverride?: {
    date?: string;
    dayOff?: boolean;
    afterHour?: number;
    untilHour?: number;
    immediate?: boolean;
  } | null;
};

export type GoogleCalendarStatus = {
  configured: boolean;
  connected: boolean;
  calendarId: string;
  connectedEmail: string;
  connectedAt: string | null;
  oauthReady?: boolean;
  calendars?: { id: string; summary: string; primary?: boolean }[];
};

export async function fetchEscalationSettings(user: User, businessId = 'macrorei') {
  return portalFetch(
    `/api/employee-portal/escalation-settings?businessId=${encodeURIComponent(businessId)}`,
    user,
  ) as Promise<{
    escalationOps: EscalationOpsSettings;
    previewReply: string;
    grokSmsAgent: boolean;
    googleCalendar?: GoogleCalendarStatus;
  }>;
}

export async function setImFreeNow(user: User, businessId = 'macrorei') {
  return portalFetch('/api/employee-portal/escalation-settings/im-free-now', user, {
    method: 'POST',
    body: JSON.stringify({ businessId }),
  }) as Promise<{ ok: boolean; escalationOps: EscalationOpsSettings; previewReply: string }>;
}

export async function fetchGoogleCalendarStatus(user: User, businessId = 'macrorei') {
  return portalFetch(
    `/api/employee-portal/google-calendar/status?businessId=${encodeURIComponent(businessId)}`,
    user,
  ) as Promise<GoogleCalendarStatus>;
}

export async function startGoogleCalendarConnect(user: User, businessId = 'macrorei') {
  return portalFetch('/api/employee-portal/google-calendar/connect', user, {
    method: 'POST',
    body: JSON.stringify({ businessId }),
  }) as Promise<{ url: string }>;
}

export async function setGoogleCalendarId(user: User, businessId: string, calendarId: string) {
  return portalFetch('/api/employee-portal/google-calendar/calendar-id', user, {
    method: 'PUT',
    body: JSON.stringify({ businessId, calendarId }),
  }) as Promise<{ ok: boolean; calendarId: string }>;
}

export async function disconnectGoogleCalendar(user: User, businessId = 'macrorei') {
  return portalFetch('/api/employee-portal/google-calendar/disconnect', user, {
    method: 'POST',
    body: JSON.stringify({ businessId }),
  }) as Promise<{ ok: boolean }>;
}

export async function saveEscalationSettings(user: User, businessId: string, escalationOps: EscalationOpsSettings) {
  return portalFetch('/api/employee-portal/escalation-settings', user, {
    method: 'PUT',
    body: JSON.stringify({ businessId, escalationOps }),
  }) as Promise<{ ok: boolean; escalationOps: EscalationOpsSettings; previewReply: string }>;
}

export async function refreshEmployeeRag(user: User, businessId = 'macrorei') {
  return portalFetch('/api/employee-portal/rag-refresh', user, {
    method: 'POST',
    body: JSON.stringify({ businessId }),
  }) as Promise<{ ok: boolean; refreshedAt: string }>;
}

export async function fetchEmployeeDesk(user: User, businessId = 'macrorei') {
  return portalFetch(`/api/employee-portal/desk?businessId=${encodeURIComponent(businessId)}`, user) as Promise<EmployeeDeskSnapshot>;
}

export type SmsSendChannel = 'auto' | 'phone' | 'twilio';

export async function textNextLead(user: User, businessId: string, channel: SmsSendChannel = 'auto') {
  return portalFetch('/api/employee-portal/desk/text-next', user, {
    method: 'POST',
    body: JSON.stringify({ businessId, channel }),
  }) as Promise<{
    done: boolean;
    reason?: string;
    lead?: DeskLead;
    body?: string;
    mode?: 'phone' | 'twilio';
    pendingDevice?: boolean;
    smsUrl?: string;
    phone?: string;
    today?: EmployeeDeskSnapshot['today'];
  }>;
}

export async function logEmployeeCall(
  user: User,
  payload: {
    businessId: string;
    leadId: string;
    disposition: string;
    notes?: string;
    channel?: string;
    durationSec?: number;
    callbackAt?: string;
    autoEmailOnVoicemail?: boolean;
  },
) {
  return portalFetch('/api/employee-portal/desk/call-log', user, {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<{
    ok: boolean;
    today: EmployeeDeskSnapshot['today'];
    callLog?: DeskCallLog;
    tryAlternatePhone?: boolean;
    dialPhoneIndex?: number;
    lead?: DeskLead;
    autoEmailSent?: boolean;
  }>;
}

export type OutlookMailStatus = {
  configured: boolean;
  connected: boolean;
  connectedEmail: string;
  connectedAt: string | null;
  oauthReady?: boolean;
};

export async function fetchOutlookMailStatus(user: User) {
  return portalFetch('/api/employee-portal/outlook/status', user) as Promise<OutlookMailStatus>;
}

export async function startOutlookMailConnect(user: User) {
  return portalFetch('/api/employee-portal/outlook/connect', user, {
    method: 'POST',
    body: JSON.stringify({}),
  }) as Promise<{ url: string }>;
}

export async function disconnectOutlookMail(user: User) {
  return portalFetch('/api/employee-portal/outlook/disconnect', user, {
    method: 'POST',
    body: JSON.stringify({}),
  }) as Promise<{ ok: boolean }>;
}

export async function sendEmployeeLeadEmail(
  user: User,
  payload: { businessId: string; leadId: string; subject?: string; body: string; to?: string },
) {
  return portalFetch('/api/employee-portal/desk/send-email', user, {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<{ ok: boolean; to: string; subject: string }>;
}

export async function fetchEmployeeCallFeed(user: User, businessId = 'macrorei', limit = 100) {
  return portalFetch(
    `/api/employee-portal/desk/calls?businessId=${encodeURIComponent(businessId)}&limit=${limit}`,
    user,
  ) as Promise<{ callFeed: DeskCallLog[]; callTracking: DeskCallTracking; syncedAt: string }>;
}

export async function importEmployeeLeads(
  user: User,
  businessId: string,
  leads: { name: string; phone: string; phones?: string[]; email?: string; propertyAddress: string }[],
) {
  return portalFetch('/api/employee-portal/desk/import', user, {
    method: 'POST',
    body: JSON.stringify({ businessId, leads }),
  }) as Promise<{ imported: number; duplicates: number; duplicateAddresses?: number; skipped: number; total: number }>;
}

export type LeadThread = {
  lead: DeskLead;
  messages: { id: string; direction: string; body: string; at: string | null; employeeEmail: string }[];
  textCount: number;
  inboundCount: number;
  callLogs?: DeskCallLog[];
};

export async function fetchLeadThread(user: User, businessId: string, leadId: string) {
  return portalFetch(
    `/api/employee-portal/desk/leads/${encodeURIComponent(leadId)}?businessId=${encodeURIComponent(businessId)}`,
    user,
  ) as Promise<LeadThread>;
}

export async function textSelectedLeads(
  user: User,
  businessId: string,
  leadIds: string[],
  channel: SmsSendChannel = 'auto',
) {
  return portalFetch('/api/employee-portal/desk/text-selected', user, {
    method: 'POST',
    body: JSON.stringify({ businessId, leadIds, channel }),
  }) as Promise<{
    sent: { leadId: string; name: string; phone: string; mode?: string }[];
    phoneDrafts?: {
      leadId: string;
      name: string;
      phone: string;
      body: string;
      smsUrl: string;
      pendingDevice: boolean;
    }[];
    failed: { leadId: string; error: string }[];
    today?: EmployeeDeskSnapshot['today'];
  }>;
}

export async function reportEmployeeDeviceSent(
  user: User,
  businessId: string,
  leadId: string,
  body: string,
) {
  return portalFetch('/api/employee-portal/desk/device-sent', user, {
    method: 'POST',
    body: JSON.stringify({ businessId, leadId, body }),
  }) as Promise<{ ok: boolean; today?: EmployeeDeskSnapshot['today'] }>;
}

export async function setEmployeeSmsProvider(user: User, businessId: string, smsProvider: 'phone' | 'twilio') {
  return portalFetch('/api/employee-portal/desk/sms-provider', user, {
    method: 'PUT',
    body: JSON.stringify({ businessId, smsProvider }),
  }) as Promise<{ ok: boolean; smsProvider: string; twilioSmsReady: boolean }>;
}

export async function linkEmployeeDeskTwilio(user: User, businessId: string) {
  return portalFetch('/api/employee-portal/desk/link-twilio', user, {
    method: 'POST',
    body: JSON.stringify({ businessId }),
  }) as Promise<{ ok: boolean; from: string; linkedAt: string }>;
}

export async function fetchTwilioStatus(businessId = 'macrorei') {
  const apiBase = import.meta.env.VITE_API_URL ?? '';
  const res = await fetch(`${apiBase}/api/twilio/status?businessId=${encodeURIComponent(businessId)}`);
  return res.json();
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
