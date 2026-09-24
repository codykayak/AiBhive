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

export const LEAD_AGENT_INSTALL = {
  android: {
    title: 'AiBhive Lead Agent (Android)',
    subtitle: 'Required for paced SMS automation from your cell number',
    downloadPath: '/api/download/lead-agent',
    publicUrl: 'https://aibhive.com/api/download/lead-agent',
    fileName: 'aibhive-lead-agent.apk',
    steps: [
      'On your Android phone, open Chrome (not in-app browsers from Facebook/email — use Chrome).',
      'Go to https://aibhive.com/employee → Dialer & tools → Download Lead Agent APK, or open https://aibhive.com/api/download/lead-agent directly.',
      'When the download finishes, open the notification or Files → Downloads → tap aibhive-lead-agent.apk.',
      'If Android asks to allow installs: Settings → Apps → Chrome → Install unknown apps → Allow.',
      'Tap Install → Open AiBhive Lead Agent.',
      'Allow SMS, Phone, and notifications when prompted — needed for outbound/inbound MacroREI texts.',
      'Sign in with Google using the same email your manager invited on the Leads tab.',
      'Leads: import CSV/Excel → Dial/SMS: tap a row to call or text → Automation: send yourself 1 test SMS first.',
      'Keep the app in the foreground while automation runs; do not force-stop or battery-optimize it off.',
    ],
    troubleshooting: [
      'Download says “not available” — wait for GitHub Actions “Build Lead Agent APK” on main-fixed, or ask ops to run npm run lead-agent:phone on a PC.',
      'Install blocked — enable “Install unknown apps” for Chrome (or Files if you sideloaded from USB).',
      'SMS not sending — check Settings → Apps → Lead Agent → Permissions → SMS allowed; retry Automation test.',
      'Sign-in fails — confirm your Gmail is on the MacroREI workspace invite list.',
    ],
  },
  pc: {
    title: 'Install from a Windows PC (USB or copy file)',
    steps: [
      'Install JDK 17 once: winget install EclipseAdoptium.Temurin.17.JDK',
      'Connect Android phone with USB debugging enabled (Developer options).',
      'From repo root run: npm run lead-agent:phone',
      'Script builds the APK, copies AiBhive-Lead-Agent.apk to your Desktop, and runs adb install if a device is detected.',
      'No USB? Email/Drive the Desktop APK to the phone and tap to install (same unknown-apps step as above).',
    ],
  },
  ios: {
    title: 'AiBhive Lead Agent (iPhone)',
    subtitle: 'Lists, dialer, Google sign-in, Twilio — paced auto-SMS is Android-first today',
    limitations: [
      'Apple does not allow background SMS sending from your personal number like Android — Automation “run all day” requires Android or Twilio in Settings.',
      'On iPhone, “Send SMS” opens the Messages app with the text filled in — you tap Send for each lead (or switch to Twilio when ops enables it).',
      'Inbound Grok replies on macrorei.com still work when the app is open and the server is connected.',
    ],
    testFlightSteps: [
      'Install Apple TestFlight from the App Store (free).',
      'On this page, tap **Open TestFlight invite** (or open the link your manager sent).',
      'Tap Accept → Install **AiBhive Lead Agent**.',
      'Open the app → Sign in with Google (invited workspace email).',
      'Import leads on Leads tab; use Dial/SMS to open Phone or Messages per row.',
      'When Twilio is enabled: Settings → SMS provider → Twilio for team-number sends without opening Messages.',
    ],
    publicInstallPath: '/api/download/lead-agent-ios',
    managerBuildSteps: [
      'Apple Developer account + Expo (expo.dev) project for com.aibhive.leadagent.',
      'Add EXPO_TOKEN to GitHub repo secrets; configure Apple credentials in Expo.',
      'Run GitHub Actions “Build Lead Agent iOS (EAS)” or locally on a Mac: cd mobile/lead-agent && npx eas-cli build --platform ios --profile preview',
      'Upload the build to App Store Connect → TestFlight → add internal testers.',
      'Set Cloud Run env LEAD_AGENT_IOS_TESTFLIGHT_URL to the public TestFlight link — employee portal shows the button automatically.',
    ],
  },
} as const;

/** @deprecated use LEAD_AGENT_INSTALL.android */
export const LEAD_AGENT_DOWNLOAD = {
  url: LEAD_AGENT_INSTALL.android.downloadPath,
  title: LEAD_AGENT_INSTALL.android.title,
  steps: LEAD_AGENT_INSTALL.android.steps,
};
