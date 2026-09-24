export type BrandId = 'aibhive' | 'macrorei' | 'manydoors';

export type BrandPlaybook = {
  id: BrandId;
  name: string;
  siteUrl: string;
  tagline: string;
  accent: string;
  elevatorPitch: string;
  sellPoints: string[];
  vocabulary: { term: string; meaning: string }[];
  objectionHandlers: { objection: string; response: string }[];
  callScripts: { title: string; script: string }[];
};

export const DAILY_CHECKLIST = [
  { id: 'signin', label: 'Sign in to Employee Portal (Google)' },
  { id: 'leadagent', label: 'Open Lead Agent — confirm SMS permissions' },
  { id: 'list', label: 'Review today’s owner list / queue on Leads tab' },
  { id: 'test', label: 'Send 1 test SMS to yourself (Automation tab)' },
  { id: 'inbound', label: 'Keep Lead Agent open for Grok inbound replies' },
  { id: 'notes', label: 'Log shift notes before end of day' },
] as const;

export const BRAND_PLAYBOOKS: BrandPlaybook[] = [
  {
    id: 'aibhive',
    name: 'AiBhive',
    siteUrl: 'https://aibhive.com',
    tagline: 'AI app factory & enterprise agentic automation',
    accent: '#f59e0b',
    elevatorPitch:
      'AiBhive builds and runs custom AI agents — apps in plain English, Hive Apps community tools, Research Lab, transcription, voice clone, and full workflow automation integrated with your CRM and phones.',
    sellPoints: [
      'Ship internal tools in days, not quarters — Bhive Builder + agent workflows.',
      'Multi-agent orchestration with compliance guardrails for medical, legal, and field ops.',
      'One platform: lead gen, customer ops, document/ERP sync, phone + SMS intelligence.',
      'Human-in-the-loop dashboards — you stay in control of escalations and approvals.',
    ],
    vocabulary: [
      { term: 'Agentic workflow', meaning: 'AI that plans steps, calls tools/APIs, and hands off to humans when needed.' },
      { term: 'RAG', meaning: 'Retrieval-augmented generation — answers grounded in your docs/sites, not guesses.' },
      { term: 'Speed-to-lead', meaning: 'First response within minutes of inbound interest — core KPI for sales ops.' },
      { term: 'Workflow orchestration', meaning: 'Connecting CRM, calendar, SMS, and ERP into one automated chain.' },
    ],
    objectionHandlers: [
      {
        objection: 'We already have a dev team.',
        response:
          'AiBhive augments them — we handle agent plumbing, integrations, and iteration so they focus on core product.',
      },
      {
        objection: 'Is this secure?',
        response:
          'Deployments are scoped to your cloud/project, with audit-friendly logging and role-based access — we design for compliance-heavy teams.',
      },
    ],
    callScripts: [
      {
        title: 'Discovery opener',
        script:
          'Hi [Name], this is [You] with AiBhive. We help [industry] teams replace manual follow-up with AI agents tied to their CRM and phones — is improving speed-to-lead on your radar this quarter?',
      },
    ],
  },
  {
    id: 'macrorei',
    name: 'MacroREI',
    siteUrl: 'https://macrorei.com',
    tagline: 'Investor outreach & appointment setting (Pacific NW)',
    accent: '#1e4d2b',
    elevatorPitch:
      'MacroREI combines farm lists and paced SMS from your phone with Grok replies trained on macrorei.com — book seller conversations without spamming or burning your number.',
    sellPoints: [
      'Property-address personalized texts — owners know you are talking about their house.',
      'Daily send caps and opt-out handling built in — protect deliverability.',
      'Grok inbound on macrorei.com RAG — answers FAQs before a human picks up.',
      'Work Mode + call forwarding option — Grok voice can answer before voicemail.',
    ],
    vocabulary: [
      { term: 'Farm list', meaning: 'Targeted list of owners in a geography or distress segment.' },
      { term: 'Situs address', meaning: 'Physical property address used in outreach (required for MacroREI SMS).' },
      { term: 'Motivated seller', meaning: 'Owner with timeline/pressure — prioritize for calls.' },
      { term: 'Appointment set', meaning: 'Confirmed time for Cody/investor to speak with the owner.' },
      { term: 'TCPA-aware pacing', meaning: 'Respect opt-outs, reasonable hours, and daily volume limits.' },
    ],
    objectionHandlers: [
      {
        objection: 'Is this spam?',
        response:
          'We send low-volume, property-specific messages with clear opt-out — one homeowner, one address, one respectful ask.',
      },
      {
        objection: 'I am not interested.',
        response: 'Totally understand — I will note that. If anything changes on the property, macrorei.com is the best place to reach us.',
      },
    ],
    callScripts: [
      {
        title: 'Outbound SMS (template style)',
        script:
          'Hi [Name] — Cody with MacroREI. Quick question about [Property Address]: would you be open to a 5-minute call if an investor offer made sense? Reply STOP to opt out.',
      },
      {
        title: 'Inbound warm transfer',
        script:
          'Thanks for texting back — I can have Cody call you today. What time works best, and is [Address] still the property you are asking about?',
      },
    ],
  },
  {
    id: 'manydoors',
    name: 'ManyDoors AI',
    siteUrl: 'https://manydoorsai.com',
    tagline: 'Multifamily & property management AI layer',
    accent: '#2563eb',
    elevatorPitch:
      'ManyDoors AI sits on the PMS you already use — 24/7 resident messaging, leasing speed-to-lead, maintenance triage, and owner-grade NOI reporting without rip-and-replace.',
    sellPoints: [
      'Faster leasing: instant answers, tour booking, and follow-up sequences.',
      'Maintenance triage: classify urgency, collect photos, route to the right vendor.',
      'Resident satisfaction: after-hours coverage without extra headcount.',
      'Owner reporting: NOI-focused summaries operators can actually use.',
    ],
    vocabulary: [
      { term: 'NOI', meaning: 'Net operating income — key metric for owners and asset managers.' },
      { term: 'Work order triage', meaning: 'Sorting maintenance requests by urgency and category.' },
      { term: 'Turn / make-ready', meaning: 'Unit prep between leases — common automation trigger.' },
      { term: 'Delinquency outreach', meaning: 'Structured, compliant rent reminders before escalation.' },
    ],
    objectionHandlers: [
      {
        objection: 'We already have a PMS.',
        response:
          'ManyDoors layers on top — we integrate with your existing stack instead of forcing migration.',
      },
    ],
    callScripts: [
      {
        title: 'Operator discovery',
        script:
          'Hi [Name], ManyDoors AI helps multifamily teams cover resident SMS and leasing after hours on the PMS you already run — are missed leads or maintenance backlog hurting NOI right now?',
      },
    ],
  },
];

export const LEAD_AGENT_DOWNLOAD = {
  url: '/api/download/lead-agent',
  title: 'AiBhive Lead Agent (Android)',
  steps: [
    'On your Android phone, open Chrome.',
    'Tap the download button below (APK).',
    'Allow “Install unknown apps” for Chrome if prompted.',
    'Open Lead Agent → allow SMS permissions.',
    'Sign in with Google (same email your manager invited).',
    'Leads tab: import CSV/Excel → Dial/SMS tab: tap a row to call/text from your number.',
    'Twilio (later): Settings → SMS provider → Twilio when admin enables credentials.',
  ],
};
