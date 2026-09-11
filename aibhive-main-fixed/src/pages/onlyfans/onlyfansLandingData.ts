import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Clock,
  Image,
  MessageCircle,
  Settings2,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

export const ONLYFANS_TAGLINE = 'You take the photos. We print the money.';

export const ONLYFANS_HERO_SUB =
  'Programmable AI fan chat that answers ~90% of DMs, sends the right picture at the right moment, and turns your content library into nonstop revenue — while you sleep, shoot, or live your life.';

export type OnlyFansFeature = {
  icon: LucideIcon;
  title: string;
  body: string;
};

export const ONLYFANS_FEATURES: OnlyFansFeature[] = [
  {
    icon: MessageCircle,
    title: '90% of fan questions, handled',
    body:
      'Pricing, customs, boundaries, renewals, compliments, objections — trained on your voice so replies feel like you, not a help desk.',
  },
  {
    icon: Image,
    title: 'Pictures at the perfect moment',
    body:
      'Tag your vault: tease → PPV → bundle → free thank-you. The bot reads fan intent and sends the next asset when conversion is highest.',
  },
  {
    icon: Settings2,
    title: 'Fully programmable scripts',
    body:
      'Welcome flows, re-engagement, whale VIP lanes, tip menus, and upsell ladders — edit in plain English or YAML. A/B test what prints.',
  },
  {
    icon: Users,
    title: 'Fan memory & segments',
    body:
      'Spenders, lurkers, renewals at risk, custom-request leads — each segment gets its own tone, frequency, and offer cadence.',
  },
  {
    icon: Clock,
    title: '24/7 without burning out',
    body:
      'Night-shift time zones are where money walks away. Your bot keeps the inbox warm until you (or your chatter) take the wheel.',
  },
  {
    icon: TrendingUp,
    title: 'Revenue dashboard',
    body:
      'PPV attach rate, reply latency, conversion by script, and fan LTV — see what actually prints, not vanity metrics.',
  },
];

export const ONLYFANS_FLOW = [
  {
    step: '1',
    title: 'Upload your content vault',
    detail: 'Photos, clips, tiers, prices, boundaries, and persona notes — the raw material money is made from.',
  },
  {
    step: '2',
    title: 'Train your programmable persona',
    detail: 'Voice, flirt level, hard limits, PPV rules, and escalation triggers — all editable without code.',
  },
  {
    step: '3',
    title: 'Connect & approve the playbook',
    detail: 'Review scripts, set human-in-the-loop for VIPs, then let the bot handle the repetitive 90%.',
  },
  {
    step: '4',
    title: 'Watch the inbox become a printer',
    detail: 'Fans get fast, on-brand replies and timely media. You focus on shooting — the bot focuses on selling.',
  },
];

export const ONLYFANS_FAQS = [
  {
    q: 'Does this replace me completely?',
    a: 'No — and that is intentional. The product is built for creator control: AI drafts and automates routine threads, while you (or your team) approve scripts, handle VIPs, and own the relationship. Full autopilot without oversight is bad for fans and bad for accounts.',
  },
  {
    q: 'How does the bot know which picture to send?',
    a: 'You tag vault assets with intent (tease, PPV, bundle, free) and set rules: fan segment, spend history, message keywords, cooldowns, and price caps. The engine picks the next best asset from your library — never random spam.',
  },
  {
    q: 'Is this OnlyFans-only?',
    a: 'OnlyFans is the headline use case, but the same stack works for Fanvue, MYM, and agency multi-model ops. Fanvue in particular is friendly to AI-native workflows if you want a fully synthetic persona lane.',
  },
  {
    q: 'What about platform rules and disclosure?',
    a: 'Creators remain legally responsible for every message on their account. We design for human-in-the-loop, audit logs, persona truth boundaries, and optional AI-assistance disclosure — the same compliance shape serious agencies use in 2026.',
  },
  {
    q: 'When can I get access?',
    a: 'We are onboarding early creators and agencies now. Book a consult to map your vault, scripts, and compliance mode — we will tell you honestly if you are a fit for beta.',
  },
];

export const ONLYFANS_STATS = [
  { value: '~90%', label: 'Routine DMs automatable' },
  { value: '24/7', label: 'Inbox coverage' },
  { value: 'PPV', label: 'Timed media sends' },
  { value: 'You', label: 'Still own the brand' },
];

export const ONLYFANS_MIDPAGE_IMAGE = '/onlyfans/creator-inbox-ai.png';

export const ONLYFANS_MIDPAGE_COPY = {
  eyebrow: 'While you create',
  title: 'Your inbox keeps closing sales.',
  body:
    'Shoot the content once. AiBhive Creator Chat handles fan questions, teases the next PPV, and nudges renewals while you are on set, traveling, or offline — so revenue does not pause when you do.',
  bullets: [
    'Smart replies trained on your voice and boundaries',
    'Vault tags drive tease → PPV → bundle sequences',
    'You approve scripts; AI handles the repetitive 90%',
  ],
};

export type OnlyFansRevenueRow = {
  month: string;
  manual: number;
  withAi: number;
};

/** Illustrative agency benchmark — not a guarantee. */
export const ONLYFANS_REVENUE_CHART: OnlyFansRevenueRow[] = [
  { month: 'Mo 1', manual: 4200, withAi: 5100 },
  { month: 'Mo 2', manual: 4500, withAi: 6200 },
  { month: 'Mo 3', manual: 4800, withAi: 7100 },
  { month: 'Mo 4', manual: 4600, withAi: 8200 },
  { month: 'Mo 5', manual: 4900, withAi: 9100 },
  { month: 'Mo 6', manual: 5100, withAi: 10400 },
];

export type OnlyFansRevenueKpi = {
  icon: LucideIcon;
  value: string;
  label: string;
  delta: string;
};

export const ONLYFANS_REVENUE_KPIS: OnlyFansRevenueKpi[] = [
  { icon: TrendingUp, value: '+38%', label: 'Avg revenue lift (90 days)', delta: 'vs manual inbox' },
  { icon: Clock, value: '< 2 min', label: 'Median reply time', delta: 'from 47 min manual' },
  { icon: MessageCircle, value: '+52%', label: 'PPV attach rate', delta: 'timed sends' },
  { icon: Users, value: '+29%', label: 'Fan renewals', delta: 're-engage scripts' },
];

export const ONLYFANS_REVENUE_FUNNEL = [
  {
    title: 'Instant replies capture intent',
    detail: 'Fans tip and buy when the moment is hot. AI answers in seconds instead of hours.',
    impact: '+ revenue from threads that used to go cold',
  },
  {
    title: 'Timed PPV from your vault',
    detail: 'Tagged tease → paywall → bundle flows fire when keywords and spend history match.',
    impact: '+ PPV without spamming every fan',
  },
  {
    title: 'Segments get the right offer',
    detail: 'Whales, lurkers, and at-risk renewals each get a different script and cadence.',
    impact: '+ LTV from the same subscriber base',
  },
  {
    title: 'You stay in control',
    detail: 'Human approval on VIP threads and script edits — AI assists, you own the account.',
    impact: 'Scale without burning out or guessing',
  },
];

export const ONLYFANS_COMPLIANCE_BULLETS = [
  {
    icon: Shield,
    title: 'Human-in-the-loop by design',
    body: 'Approve scripts, review flagged threads, and take over any fan instantly — AI assists, you stay accountable.',
  },
  {
    icon: Bot,
    title: 'Persona truth boundaries',
    body: 'The bot only claims what is true: no fake meetups, no medical advice, no promises your vault cannot fulfill.',
  },
  {
    icon: Sparkles,
    title: 'Disclosure-ready modes',
    body: 'Optional AI-assistance labels and session disclosure for jurisdictions that require transparency.',
  },
  {
    icon: Zap,
    title: 'Built on AiBhive agents',
    body: 'Same programmable agent stack as our enterprise products — memory, tools, guardrails, and audit trails.',
  },
];

export const ONLYFANS_ROADMAP = [
  {
    phase: 'Phase 1 — Now',
    items: [
      'Persona + vault ingest',
      'Script editor (welcome, PPV, re-engage)',
      'Human approval queue',
      'Chrome-assisted send workflow',
    ],
  },
  {
    phase: 'Phase 2 — Beta',
    items: [
      'Fan CRM + spend segments',
      'Timed media engine',
      'Revenue analytics',
      'Multi-chatter agency roles',
    ],
  },
  {
    phase: 'Phase 3 — Scale',
    items: [
      'Fanvue + MYM connectors',
      'Voice-note replies (with consent)',
      'Agency white-label',
      'API for custom stacks',
    ],
  },
];
