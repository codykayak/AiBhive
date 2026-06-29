/** Copy, imagery, and nav for aibhive.com/app */

export const APP_STOCK_IMAGES = {
  heroCommandCenter:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80',
  mobileApps:
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
  websiteDashboard:
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
  adminPanel:
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1200&q=80',
  socialMedia:
    'https://images.unsplash.com/photo-1611162617474-5b21e279e113?auto=format&fit=crop&w=1200&q=80',
  phoneSystems:
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
  leadPipeline:
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80',
  productivity:
    'https://images.unsplash.com/photo-1484480974693-6ca0a783b4b3?auto=format&fit=crop&w=1200&q=80',
  webAppMock:
    'https://images.unsplash.com/photo-1467238915677-4cb7d2125ae1?auto=format&fit=crop&w=1200&q=80',
  teamCollab:
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
} as const;

export const APP_NAV = [
  { label: 'Overview', path: '/app', tourId: 'app-hub' },
  { label: 'Build', path: '/hive-apps/build', tourId: 'nav-build' },
  { label: 'My Apps', path: '/hive-apps', tourId: 'nav-apps' },
  { label: 'Research', path: '/app/research', tourId: 'nav-research' },
  { label: 'Jobs', path: '/app/jobs', tourId: 'nav-jobs' },
  { label: 'Settings', path: '/app/settings', tourId: 'nav-settings' },
  { label: 'Admin Center', path: '/admin' },
] as const;

export const APP_TOPICS = [
  {
    slug: 'automated-social-media',
    label: 'Automated AI Social Media',
    short: 'Plan, draft, schedule, and learn — without living in five apps.',
    image: APP_STOCK_IMAGES.socialMedia,
    imageAlt: 'Social media marketing dashboard on laptop',
  },
  {
    slug: 'phone-intelligence',
    label: 'AI Phone System Intelligence',
    short: 'Missed-call text-back, RAG-trained replies, and live call routing.',
    image: APP_STOCK_IMAGES.phoneSystems,
    imageAlt: 'Business team using phone and CRM systems',
  },
  {
    slug: 'lead-generation',
    label: 'AI Lead Generation Pipelines',
    short: 'Autonomous prospecting, enrichment, nurture, and calendar booking.',
    image: APP_STOCK_IMAGES.leadPipeline,
    imageAlt: 'Sales pipeline analytics on screen',
  },
  {
    slug: 'productivity',
    label: '100× Productivity with AI',
    short: 'Custom apps, workflows, and admin tools — built from plain English.',
    image: APP_STOCK_IMAGES.productivity,
    imageAlt: 'Organized workspace with laptop and notebook',
  },
] as const;

export type AppTopicSlug = (typeof APP_TOPICS)[number]['slug'];

export const APP_PILLARS = [
  {
    title: 'Do',
    body: 'Job tracker, applications, Auto-Bot Resume — ship productivity today.',
    href: '/hive-apps/run/example-job-tracker',
    cta: 'Open Job Tracker',
  },
  {
    title: 'Build',
    body: 'Describe any app in plain English. Hive Magic builds it in seconds.',
    href: '/hive-apps/build',
    cta: 'Start building',
  },
  {
    title: 'Research',
    body: 'Intel Agent — AI-directed OSINT on companies, domains, and people.',
    href: '/app/research',
    cta: 'Run research',
  },
] as const;

export const BYOK_FEATURES = [
  {
    title: 'Bring your own API keys',
    body: 'Connect Grok, Gemini, OpenAI, or others in Settings. Your keys, your models, your spend.',
  },
  {
    title: 'Or use Hive credits',
    body: 'Prefer simplicity? AiBhive Tokens cover cloud AI, search, and builds at API cost + 30%.',
  },
  {
    title: 'No coding required',
    body: 'Speak or type what you want — admin panels, trackers, workflows. We build and ship it.',
  },
] as const;

export interface TopicPageConfig {
  slug: AppTopicSlug;
  seo: { title: string; description: string; keywords: string };
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  heroImage: string;
  heroAlt: string;
  stats: { value: string; label: string }[];
  intro: string[];
  sections: { heading: string; body: string; bullets?: string[] }[];
  pipeline: { step: string; title: string; description: string }[];
  checklist: string[];
  faqs: { q: string; a: string }[];
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

export const TOPIC_PAGES: Record<AppTopicSlug, TopicPageConfig> = {
  'automated-social-media': {
    slug: 'automated-social-media',
    seo: {
      title: 'Automated AI Social Media — AiBhive App',
      description:
        'Plan posts, generate on-brand copy, schedule across channels, and review performance from one AI admin command center. BYOK or Hive credits.',
      keywords:
        'automated social media AI, AI content scheduler, social media automation, AiBhive admin center',
    },
    eyebrow: 'AiBhive App · Social Automation',
    title: 'Automated AI',
    highlight: 'social media.',
    subtitle:
      'One command center to brainstorm, draft, schedule, and learn what works — without juggling five disconnected tools.',
    heroImage: APP_STOCK_IMAGES.socialMedia,
    heroAlt: 'Social media content planning on laptop',
    stats: [
      { value: '10×', label: 'Faster first drafts' },
      { value: '24/7', label: 'Queue always on' },
      { value: '1 hub', label: 'All channels' },
      { value: 'HITL', label: 'Human approval gates' },
    ],
    intro: [
      'Most teams still copy-paste between ChatGPT, Canva, and a scheduler — then wonder why posts feel generic and off-brand.',
      'AiBhive treats social as a **built-in workflow**: describe your voice, audience, and cadence once. Your admin center generates drafts, routes them for approval, and publishes on schedule.',
      'Use **your API keys** for full control, or **Hive credits** for a managed stack. No developers required — just tell the assistant what you want next.',
    ],
    sections: [
      {
        heading: 'Content that sounds like you',
        body: 'Feed brand guidelines, past winners, and audience notes into RAG. Every draft pulls from your playbook — not generic internet slop.',
        bullets: [
          'Tone presets per channel (LinkedIn vs Instagram vs X)',
          'Auto-hashtag and CTA suggestions',
          'Repurpose long-form into thread/carousel outlines',
        ],
      },
      {
        heading: 'Schedule with safety rails',
        body: 'High-volume sends pause for human review. Low-risk queue items can auto-publish when you trust the workflow.',
        bullets: [
          'Approval inbox before anything goes live',
          'Quiet hours and timezone-aware posting',
          'Rollback notes when a trend shifts mid-week',
        ],
      },
      {
        heading: 'Learn and iterate',
        body: 'Weekly briefs summarize what landed, what flopped, and what to test next — in plain English.',
      },
    ],
    pipeline: [
      { step: '01', title: 'Brand intake', description: 'Voice, offers, banned phrases, and example posts — once.' },
      { step: '02', title: 'AI draft batch', description: 'Generate a week of ideas aligned to campaigns and seasonality.' },
      { step: '03', title: 'Review & approve', description: 'Edit in chat or tap approve on each slot.' },
      { step: '04', title: 'Publish & report', description: 'Posts go out; performance rolls into your admin dashboard.' },
    ],
    checklist: [
      'Connect social accounts or export-ready copy packs',
      'Set approval rules for promos vs evergreen',
      'Enable Auto Social in Admin → monitor queue',
      'Ask the assistant: "Draft 7 LinkedIn posts for our launch"',
    ],
    faqs: [
      {
        q: 'Do I need a developer?',
        a: 'No. Describe the workflow in plain English on the Build tab or in Admin. AiBhive ships the screens and automation.',
      },
      {
        q: 'Can I use my own AI keys?',
        a: 'Yes — BYOK in Settings. Or use Hive credits for a fully managed cloud stack.',
      },
    ],
    primaryCta: { label: 'Open Admin Command Center', href: '/admin?tab=auto-social' },
    secondaryCta: { label: 'Build a custom social hub', href: '/hive-apps/build' },
  },
  'phone-intelligence': {
    slug: 'phone-intelligence',
    seo: {
      title: 'Automated AI Phone System Intelligence | AiBhive App',
      description:
        'Twilio, RingCentral, and OpenPhone integrations with RAG-trained missed-call SMS, lead capture, and intelligent routing — built without code.',
      keywords:
        'AI phone system, missed call text back, Twilio AI, RingCentral automation, phone intelligence',
    },
    eyebrow: 'AiBhive App · Phone Intelligence',
    title: 'AI intelligence for',
    highlight: 'your phone system.',
    subtitle:
      'Every missed call gets a smart text-back trained on your business. Route hot leads, book appointments, and sync CRM — automatically.',
    heroImage: APP_STOCK_IMAGES.phoneSystems,
    heroAlt: 'Business communication and phone systems',
    stats: [
      { value: '<60s', label: 'Missed-call response' },
      { value: '24/7', label: 'Coverage' },
      { value: 'RAG', label: 'On your docs' },
      { value: 'CRM', label: 'Auto-sync' },
    ],
    intro: [
      'Speed-to-lead wins deals — but humans cannot answer every ring. Generic auto-replies kill trust.',
      'AiBhive connects to **Twilio, RingCentral, OpenPhone**, and similar stacks. When a call drops, an AI agent texts back with context from **your** pricing, FAQs, and calendar rules.',
      'Build the admin panel yourself: "When someone misses a call, text them our booking link and log the lead." We ship it.',
    ],
    sections: [
      {
        heading: 'RAG-trained text-back',
        body: 'Upload playbooks, service areas, and pricing sheets. Replies cite real business facts — not hallucinated offers.',
        bullets: [
          'Missed-call → personalized SMS in under a minute',
          'Escalation to human when sentiment or keywords trigger',
          'Multi-language replies when you need them',
        ],
      },
      {
        heading: 'Live routing & booking',
        body: 'Qualify intent from SMS threads, offer time slots, and write leads to HubSpot, Salesforce, or a simple AiBhive-built CRM.',
      },
      {
        heading: 'Admin you can speak into',
        body: 'Change scripts, hours, or routing by chatting with the assistant — no ticket to engineering.',
      },
    ],
    pipeline: [
      { step: '01', title: 'Connect carrier', description: 'Twilio / RingCentral / OpenPhone webhooks into AiBhive.' },
      { step: '02', title: 'Train on your KB', description: 'RAG over FAQs, policies, and offer sheets.' },
      { step: '03', title: 'Autonomous SMS', description: 'Missed calls trigger contextual two-way text.' },
      { step: '04', title: 'CRM + calendar', description: 'Qualified leads land where your team already works.' },
    ],
    checklist: [
      'Document your IVR and after-hours rules',
      'Connect phone provider credentials in Admin',
      'Test with a controlled missed-call drill',
      'Iterate scripts from the Build tab in plain English',
    ],
    faqs: [
      {
        q: 'Which phone systems work?',
        a: 'Twilio, RingCentral, OpenPhone, and webhook-friendly carriers. We add adapters as customers need them.',
      },
      {
        q: 'Is this compliant?',
        a: 'TCPA-aware flows include opt-out language and human review gates for high-volume campaigns.',
      },
    ],
    primaryCta: { label: 'See phone integration guide', href: '/solutions/phone-systems-ai-integration' },
    secondaryCta: { label: 'Build phone admin panel', href: '/hive-apps/build' },
  },
  'lead-generation': {
    slug: 'lead-generation',
    seo: {
      title: 'Automated AI Lead Generation Pipelines | AiBhive App',
      description:
        'Autonomous agents for signal ingestion, enrichment, outreach, and calendar booking — real estate, B2B, and local services.',
      keywords:
        'AI lead generation, sales pipeline automation, autonomous SDR, real estate leads AI',
    },
    eyebrow: 'AiBhive App · Lead Pipelines',
    title: 'Automated AI',
    highlight: 'lead generation.',
    subtitle:
      'Agents that find intent, enrich contacts, nurture sequences, and book meetings — while you sleep.',
    heroImage: APP_STOCK_IMAGES.leadPipeline,
    heroAlt: 'Lead generation pipeline dashboard',
    stats: [
      { value: '3–5×', label: 'Qualified touches' },
      { value: '<2 min', label: 'Speed-to-lead' },
      { value: '24/7', label: 'Pipeline feed' },
      { value: 'CRM', label: 'Native sync' },
    ],
    intro: [
      'Buying lists and blasting templates is dead. Buyers expect relevance, speed, and context.',
      'AiBhive pipelines **monitor signals** (permits, MLS, job posts, intent feeds), **score fit**, **personalize outreach**, and **book** only when a human should take the call.',
      'Describe your ICP in plain English — we build the tracker, admin views, and automation in your command center.',
    ],
    sections: [
      {
        heading: 'Signal → score → sequence',
        body: 'Multi-step agents plan workflows, call enrichment APIs, and self-correct when a data source changes.',
        bullets: [
          'Public records, MLS deltas, and web intent',
          'Deduping and rubric-based qualification',
          'Email + SMS with approval before bulk sends',
        ],
      },
      {
        heading: 'Your pipeline, your rules',
        body: 'Wholesale real estate, B2B SaaS, insurance — the factory adapts. You own the logic; AiBhive ships the UI.',
      },
      {
        heading: 'Handoff with context',
        body: 'Reps get calendar slots plus a full packet: source, score, thread history, and suggested opener.',
      },
    ],
    pipeline: [
      { step: '01', title: 'Signal ingestion', description: 'Agents watch feeds for ICP-fit events.' },
      { step: '02', title: 'Enrich & score', description: 'Validate data and rank against your rubric.' },
      { step: '03', title: 'Nurture', description: 'Personalized sequences with HITL gates.' },
      { step: '04', title: 'Book & sync', description: 'Warm leads hit calendar + CRM automatically.' },
    ],
    checklist: [
      'Define ICP and disqualifiers in plain language',
      'Connect CRM and calendar in Admin',
      'Start with one territory or vertical',
      'Expand sequences after first wins',
    ],
    faqs: [
      {
        q: 'Can I build a custom lead tracker app?',
        a: 'Yes — describe it on the Build tab. Most in-app trackers ship in under a minute (~$1).',
      },
      {
        q: 'How is this different from Zapier?',
        a: 'Agentic workflows plan multi-step work, use tools, and adapt — not brittle if-this-then-that chains.',
      },
    ],
    primaryCta: { label: 'Explore lead gen solutions', href: '/solutions/ai-lead-generation-automation' },
    secondaryCta: { label: 'Build my pipeline app', href: '/hive-apps/build' },
  },
  productivity: {
    slug: 'productivity',
    seo: {
      title: '100× Productivity with Automated AI | AiBhive App',
      description:
        'Build custom admin tools, trackers, and workflows from plain English. BYOK or Hive credits. Your pocket AI factory on web and mobile.',
      keywords:
        'AI productivity, no-code app builder, custom admin panel, automated workflows, AiBhive',
    },
    eyebrow: 'AiBhive App · Productivity',
    title: '100× your productivity',
    highlight: 'with automated AI.',
    subtitle:
      'Stop waiting on engineering for every spreadsheet replacement. Speak what you need — admin centers, trackers, ops tools — and AiBhive builds it.',
    heroImage: APP_STOCK_IMAGES.productivity,
    heroAlt: 'Productive workspace with laptop',
    stats: [
      { value: '~$1', label: 'Typical new app' },
      { value: 'Seconds', label: 'In-app delivery' },
      { value: '0', label: 'Lines of code from you' },
      { value: '∞', label: 'Iterations by chat' },
    ],
    intro: [
      'Productivity is not another chat tab — it is **tools that match how you actually work**.',
      'AiBhive is an app factory: job trackers, expense logs, client portals, internal dashboards, approval queues. Describe once; use immediately inside AiBhive or export to web/APK/Play Store.',
      'Combine **Do · Build · Research** in one command center. Bring **your APIs** or use **ours**.',
    ],
    sections: [
      {
        heading: 'Admin command centers',
        body: 'Unified hubs for social, phone, leads, documents, and custom ops — built from conversation, not Jira tickets.',
        bullets: [
          'Role-friendly screens your team actually opens',
          'Approvals, alerts, and digests in one place',
          'Extend anytime: "Add a vendor approval step"',
        ],
      },
      {
        heading: 'Instant operational apps',
        body: 'List, tracker, note, calculator, and info page types ship in seconds with themes and icons you choose in chat.',
      },
      {
        heading: 'Export when you outgrow the hive',
        body: 'Web link (~$5), installable APK (~$18), or Play Store kit (~$35). Stand-alone apps do not burn Hive credits for daily use.',
      },
    ],
    pipeline: [
      { step: '01', title: 'Describe', description: '"Build me a client onboarding tracker with reminders."' },
      { step: '02', title: 'Approve quote', description: 'Most builds ~$1; tiny ones auto-start.' },
      { step: '03', title: 'Use instantly', description: 'App appears in My Apps with your branding.' },
      { step: '04', title: 'Iterate by chat', description: 'Changes ~$0.50; export when ready.' },
    ],
    checklist: [
      'Try the Build tab with one real workflow you hate in spreadsheets',
      'Install example tools: Job Tracker, Resume, Research',
      'Browse community apps before rebuilding duplicates',
      'Open Admin for social, RAG, and automation modules',
    ],
    faqs: [
      {
        q: 'Do I need the mobile app?',
        a: 'The full experience is best on Android, but aibhive.com/app runs build, browse, research, and admin in your browser today.',
      },
      {
        q: 'What about coding?',
        a: 'You never touch code unless you want to. Complex custom UX can escalate to a Cursor cloud build (~$4+).',
      },
    ],
    primaryCta: { label: 'Build your first app', href: '/hive-apps/build' },
    secondaryCta: { label: 'Browse community apps', href: '/hive-apps' },
  },
};
