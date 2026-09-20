export type Business = {
  id: string;
  name: string;
  tagline?: string;
  brandColor?: string;
  phoneDisplay?: string;
  phoneE164?: string;
  website?: string;
  dailySmsLimit?: number;
  dailySmsSuggested?: number;
  smsProvider?: 'phone' | 'twilio';
  twilioSid?: string;
  twilioFrom?: string;
  twilioTokenSet?: boolean;
  agentEnabled?: boolean;
  automationEnabled?: boolean;
  minDelayMinutes?: number;
  maxDelayMinutes?: number;
  sendWindowStart?: number;
  sendWindowEnd?: number;
  sendTimezone?: string;
  greeting?: string;
  outboundTemplate?: string;
  escalationKeywords?: string[];
  escalationMessage?: string;
  knowledge?: string;
  smsSentByDay?: Record<string, number>;
};

export type Lead = {
  id: string;
  name?: string;
  phone: string;
  propertyAddress?: string;
  notes?: string;
  status?: 'new' | 'texted' | 'replied' | 'appointment' | 'dead';
  talkedTo?: boolean;
  agentPaused?: boolean;
  optedOut?: boolean;
  needsHuman?: boolean;
  lastContactAt?: string;
};

export type Message = {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  at?: string;
  automated?: boolean;
};
