export type ResearchLabCategoryId =
  | 'research-tools'
  | 'historical-ancient'
  | 'medical-holistic'
  | 'legal-findings'
  | 'academia-scholarly';

export interface ResearchLabCategory {
  id: ResearchLabCategoryId;
  navLabel: string;
  path: string;
  /** When true, render the existing Research Lab landing (tools) with CSS polish only */
  isToolsLanding?: boolean;
  eyebrow: string;
  title: string;
  titleAccent: string;
  lead: string;
  heroImage: string;
  heroAlt: string;
  seo: { title: string; description: string; keywords: string };
  pillars: { title: string; body: string }[];
  howItHelps: { title: string; body: string }[];
  craft: {
    label: string;
    chips: string[];
    responses: Record<string, string>;
  };
  faqs: { q: string; a: string }[];
  communityBlurb: string;
}

export const RESEARCH_LAB_NAV = [
  { name: 'Research Lab', path: '/research-lab' },
  { name: 'DMT Matrix Decoder', path: '/research-lab/dmt-matrix-decoder' },
  { name: 'DMT Matrix Library', path: '/research-lab/dmt-matrix-library' },
  { name: 'Research tools', path: '/research-lab/workspace' },
  { name: 'Communal Library', path: '/research-lab/communal-library' },
  { name: 'Historical - Ancient', path: '/research-lab/historical-ancient' },
  { name: 'Medical - Holistic', path: '/research-lab/medical-holistic' },
  { name: 'Legal - Findings', path: '/research-lab/legal-findings' },
  { name: 'Academia - scholarly', path: '/research-lab/academia-scholarly' },
] as const;

export const RESEARCH_LAB_CATEGORIES: ResearchLabCategory[] = [
  {
    id: 'research-tools',
    navLabel: 'Research tools',
    path: '/research-lab',
    isToolsLanding: true,
    eyebrow: 'Research Lab · Tools',
    title: 'Research',
    titleAccent: 'tools',
    lead: 'The multi-agent stack behind AiBhive Research Lab.',
    heroImage: '/rl-hero-research-tools.png',
    heroAlt: 'AiBhive Research Lab multi-agent honeycomb command atmosphere',
    seo: {
      title: 'Research Tools — Multi-Agent Archive Scrape, OCR & RAG | AiBhive Research Lab',
      description:
        'AiBhive Research Lab tools combine Fable Scrape, batch OCR, translation, Grok analysis, and a community-sourced library — start-to-finish research with multi-agent pricing efficiency.',
      keywords:
        'AI research tools, Fable Scrape, batch OCR, RAG library, multi-agent research, AiBhive Research Lab',
    },
    pillars: [],
    howItHelps: [],
    craft: { label: '', chips: [], responses: {} },
    faqs: [],
    communityBlurb: '',
  },
  {
    id: 'historical-ancient',
    navLabel: 'Historical - Ancient',
    path: '/research-lab/historical-ancient',
    eyebrow: 'Research Lab · Historical & Ancient',
    title: 'Unlock archives',
    titleAccent: 'humanity forgot',
    lead:
      'AiBhive Research Lab was built for historians, archaeologists, and independent investigators who need start-to-finish archive work: stealth harvest, OCR of fragile scans, translation of ancient and modern scripts, and a publishable community corpus — orchestrated by multiple specialized AI agents for optimal cost and depth.',
    heroImage: '/rl-hero-historical-ancient.png',
    heroAlt:
      'AiBhive historical ancient research — amber honeycomb lattice over archival tablets and maps',
    seo: {
      title: 'Historical & Ancient Research AI — Archive Scrape, OCR, Translation | AiBhive',
      description:
        'AiBhive Research Lab for historical and ancient studies: multi-agent Fable Scrape, OCR, cuneiform/hieroglyph-aware translation, RAG Q&A, and community library publishing for shared discoveries.',
      keywords:
        'historical research AI, ancient archives OCR, cuneiform translation AI, Nag Hammadi Gnostic texts, Tartaria research tools, multi-agent archive scrape, AiBhive Research Lab',
    },
    pillars: [
      {
        title: 'Multi-agent harvest',
        body: 'Director, vision, and translator agents collaborate — one finds candidates, one reads them, one renders them in your language — instead of a single brittle model pass.',
      },
      {
        title: 'Stealth archive access',
        body: 'Fable Scrape reaches bot-blocked collections with residential routing options so rare maps, plates, and manuscripts stay reachable.',
      },
      {
        title: 'Community corpus',
        body: 'Publish cleaned findings into the communal library so the next researcher starts ahead of you — compounding historical knowledge.',
      },
    ],
    howItHelps: [
      {
        title: 'From forgotten scan to citable text',
        body: 'Batch OCR fragile plates, then translate and ask Grok-powered questions over your own harvested set — one workspace, not five disconnected tools.',
      },
      {
        title: 'Optimal pricing through agent specialization',
        body: 'We route each step to the right model role so you spend Hive credits on depth where it matters, not on one oversized model doing every job poorly.',
      },
      {
        title: 'Never-before-combined pipeline',
        body: 'Scrape → OCR → translate → RAG → publish is wired as one Research Lab flow — the first consumer stack that treats historical investigation as an end-to-end product.',
      },
    ],
    craft: {
      label: 'Interactive · Archive brief builder',
      chips: [
        'World fair photographs',
        'Sanborn fire maps',
        'Cuneiform tablets',
        'Cathedral floor plans',
        'Nag Hammadi Gnostic texts',
      ],
      responses: {
        'World fair photographs':
          'Pipeline: Fable Scrape (crawl ≤20 pages) → Vision OCR on plates → Translator to English → publish captions to community library.\nAgents: Director selects fairgrounds imagery · Vision extracts engraved captions · Grok synthesizes timeline notes.\nHive credits: billed per scrape/OCR/translate step — publish strengthens the shared corpus.',
        'Sanborn fire maps':
          'Pipeline: Stealth scan of map index pages → OCR sheet legends → geospatial notes in RAG → optional community publish.\nAgents: Director filters map tiles · Vision reads block numbers · Translator normalizes archaic street names.\nOutcome: a reusable map legend pack other researchers can fork.',
        'Cuneiform tablets':
          'Pipeline: High-res tablet photos → OCR Lab → Translator (ancient → modern) → ask smart questions in workspace.\nAgents: Vision for wedge patterns · Translator for gloss · Grok for comparative notes across tablets.\nPublish: share transliterations to grow the communal ancient-text pool.',
        'Cathedral floor plans':
          'Pipeline: Harvest plan plates → OCR dimensions/labels → translate Latin notes → community library entry.\nAgents: Director finds plan sheets · Vision extracts measurements · Grok drafts architectural summary.\nWhy AiBhive: one credit-metered stack instead of juggling five vendor tabs.',
        'Nag Hammadi Gnostic texts':
          'Pipeline: Archive.org / gnosis.org harvest of Robinson English editions + Coptic plates → text-corpus or Vision OCR → translate glosses → publish to Communal Library · Nag Hammadi & Gnostic.\nAgents: Director picks tractates (Thomas, Apocryphon of John, Thunder…) · Vision reads Coptic leaves · Grok tracks which NHC citations remain unindexed.\nDig packs: GET /api/research-lab/nag-hammadi-finds — goal is word-searchable full-text for every published tractate.',
      },
    },
    faqs: [
      {
        q: 'Can AiBhive handle ancient scripts?',
        a: 'Yes — Research Lab translation is built for modern and historical scripts, including challenging glyph systems. Results improve when you publish corrected readings back to the community library.',
      },
      {
        q: 'Do I need a subscription for historical work?',
        a: 'You can start with pay-as-you-go Hive credits ($5 for 5 credits) or choose Pro/Unlimited for a renewing monthly pool suited to long archive campaigns.',
      },
    ],
    communityBlurb:
      'Every published historical finding becomes a building block for the next investigator. Share OCR’d plates, translations, and notes — help grow the world’s most practical community-sourced ancient research library.',
  },
  {
    id: 'medical-holistic',
    navLabel: 'Medical - Holistic',
    path: '/research-lab/medical-holistic',
    eyebrow: 'Research Lab · Medical & Holistic',
    title: 'Evidence meets',
    titleAccent: 'whole-person care',
    lead:
      'For clinicians, herbalists, and integrative researchers who need literature, protocols, and primary sources in one multi-agent lab — scrape, OCR, translate, question, and publish — with Hive credits and optional BYOK for sensitive workflows.',
    heroImage: '/rl-hero-medical-holistic.png',
    heroAlt: 'AiBhive medical holistic research — amber honeycomb over botanical and clinical light',
    seo: {
      title: 'Medical & Holistic Research AI — Literature, Protocols, OCR | AiBhive Research Lab',
      description:
        'AiBhive Research Lab for medical and holistic research: multi-agent document harvest, OCR of papers and charts, translation, Grok analysis, and community library publishing for shared clinical knowledge.',
      keywords:
        'medical research AI, holistic health research tools, clinical OCR AI, herbal literature AI, multi-agent medical research, AiBhive',
    },
    pillars: [
      {
        title: 'Protocol-aware agents',
        body: 'Specialized agents separate harvesting, reading, and synthesis so dosage tables, study abstracts, and botanical monographs stay structured.',
      },
      {
        title: 'Privacy-minded BYOK',
        body: 'Bring your own keys for regulated environments while still using Research Lab orchestration — or run on Hive credits for managed simplicity.',
      },
      {
        title: 'Shared clinical corpus',
        body: 'Publish de-identified literature packs and translations so peers can validate and extend your reviews.',
      },
    ],
    howItHelps: [
      {
        title: 'From PDF pile to living review',
        body: 'OCR scanned journals, translate non-English studies, then ask Grok smart questions across your harvested set — start-to-finish evidence work.',
      },
      {
        title: 'Holistic + clinical in one hive',
        body: 'Cross-link botanical sources with modern papers without losing provenance — agents keep source URLs and filenames attached to findings.',
      },
      {
        title: 'Pricing that respects depth',
        body: 'Multi-agent routing spends Hive credits on the right model for each step — vision for charts, chat for synthesis — instead of one expensive blunt instrument.',
      },
    ],
    craft: {
      label: 'Interactive · Evidence map',
      chips: ['Herbal monograph pack', 'Trial abstract OCR', 'Cross-language review', 'Chart extraction'],
      responses: {
        'Herbal monograph pack':
          'Pipeline: Scrape botanical references → OCR plates/tables → translate → RAG Q&A on constituents & traditional use.\nPublish: share a cleaned monograph pack to the community library (no patient data).\nAgents: Vision for tables · Translator for ethnobotany texts · Grok for comparative notes.',
        'Trial abstract OCR':
          'Pipeline: Batch OCR of scanned abstracts → normalize outcomes → ask Grok for conflict/consensus themes.\nHive credits: per-page OCR + analysis. Ideal for rapid scoping reviews.',
        'Cross-language review':
          'Pipeline: Harvest non-English papers → translate → dual-pass terminology check → publish bilingual glossary.\nWhy multi-agent: translator + domain synthesis beats single-model glossing.',
        'Chart extraction':
          'Pipeline: Vision OCR on figures → structured notes → community publish of figure captions.\nOutcome: reusable chart text for meta-research without re-scanning.',
      },
    },
    faqs: [
      {
        q: 'Is this a diagnostic medical device?',
        a: 'No. Research Lab is a research and document intelligence workspace. It does not provide medical advice or diagnosis — it helps you gather, read, and share sources.',
      },
      {
        q: 'Can I keep sensitive material private?',
        a: 'Yes. Publishing to the community library is optional. Use BYOK and avoid uploading protected health information.',
      },
    ],
    communityBlurb:
      'Publish literature packs, translations, and de-identified source notes to strengthen a shared holistic–clinical library — so the next researcher does not start from zero.',
  },
  {
    id: 'legal-findings',
    navLabel: 'Legal - Findings',
    path: '/research-lab/legal-findings',
    eyebrow: 'Research Lab · Legal Findings',
    title: 'Findings with',
    titleAccent: 'audit-ready trail',
    lead:
      'Built for investigators, paralegals, and compliance teams who need primary sources fast: harvest dockets and filings, OCR exhibits, translate foreign opinions, synthesize with Grok, and optionally publish reusable finding packs to the community library.',
    heroImage: '/rl-hero-legal-findings.png',
    heroAlt: 'AiBhive legal findings research — amber honeycomb over case files and data threads',
    seo: {
      title: 'Legal Findings Research AI — Docket Harvest, Exhibit OCR, Synthesis | AiBhive',
      description:
        'AiBhive Research Lab for legal findings: multi-agent scrape, exhibit OCR, translation, Grok synthesis, and community library publishing for shared legal research packs.',
      keywords:
        'legal research AI, docket OCR, exhibit digitization AI, multi-agent legal findings, compliance research tools, AiBhive Research Lab',
    },
    pillars: [
      {
        title: 'Chain-of-custody minded',
        body: 'Findings keep source URLs, filenames, and agent-pass notes so you can show how a conclusion was reached.',
      },
      {
        title: 'Exhibit-scale OCR',
        body: 'Batch up to 50 images per request with hard cost caps — built for stacks of scans without silent platform bleed.',
      },
      {
        title: 'Shared finding packs',
        body: 'Publish non-confidential research packs so firms and independents can remix public-domain legal knowledge.',
      },
    ],
    howItHelps: [
      {
        title: 'From exhibit pile to brief outline',
        body: 'OCR exhibits, translate foreign opinions, then ask Grok to outline issues and open questions — start-to-finish legal research in one lab.',
      },
      {
        title: 'Multi-agent accuracy culture',
        body: 'Vision and language agents cross-check dense pages; you stay in the loop for privilege and confidentiality decisions.',
      },
      {
        title: 'Hive credits, clear metering',
        body: 'Every scrape, OCR, and synthesis step meters Hive credits with daily caps — predictable research spend for case teams.',
      },
    ],
    craft: {
      label: 'Interactive · Finding pack planner',
      chips: ['Exhibit OCR sprint', 'Foreign opinion translate', 'Public docket harvest', 'Issue outline'],
      responses: {
        'Exhibit OCR sprint':
          'Pipeline: Upload exhibit scans → OCR Lab (≤50/batch) → Grok issue tags → optional community publish of public-domain packs.\nAgents: Vision for stamps/handwriting · Grok for issue clustering.\nNote: never publish privileged material.',
        'Foreign opinion translate':
          'Pipeline: Harvest opinion PDF/images → translate → terminology glossary → RAG Q&A.\nMulti-agent benefit: translator + synthesizer preserve citations better than one-shot MT.',
        'Public docket harvest':
          'Pipeline: Fable Scrape on public indices → filter PDFs → OCR cover sheets → library entry.\nHive credits: scrape + OCR. Caps prevent runaway crawls.',
        'Issue outline':
          'Pipeline: Feed OCR’d corpus to Grok chat with your research question → structured outline + open questions.\nPublish: share non-confidential outlines to help the community library grow.',
      },
    },
    faqs: [
      {
        q: 'Is AiBhive a law firm or legal advice service?',
        a: 'No. Research Lab helps you gather and analyze sources. It does not create an attorney-client relationship or provide legal advice.',
      },
      {
        q: 'What about confidentiality?',
        a: 'Do not upload privileged or sealed materials to community publish. Use private workspace flows and BYOK when your policy requires it.',
      },
    ],
    communityBlurb:
      'Contribute public-domain finding packs, glossaries, and non-confidential outlines — help build a communal legal research layer other investigators can trust and extend.',
  },
  {
    id: 'academia-scholarly',
    navLabel: 'Academia - scholarly',
    path: '/research-lab/academia-scholarly',
    eyebrow: 'Research Lab · Academia & Scholarly',
    title: 'Scholarship at',
    titleAccent: 'machine speed',
    lead:
      'For scholars, labs, and graduate researchers: harvest corpora, OCR archives, translate sources, run Grok-powered literature questions, and publish reusable datasets into AiBhive’s community library — the multi-agent research OS academia has been missing.',
    heroImage: '/rl-hero-academia-scholarly.png',
    heroAlt: 'AiBhive academia scholarly research — amber honeycomb over manuscripts and citation networks',
    seo: {
      title: 'Academic & Scholarly Research AI — Corpora, OCR, Literature Synthesis | AiBhive',
      description:
        'AiBhive Research Lab for academia: multi-agent corpus harvest, OCR, translation, Grok literature synthesis, and community library publishing for shared scholarly datasets.',
      keywords:
        'academic research AI, scholarly OCR, literature review AI, multi-agent research lab, corpus building tools, AiBhive Research Lab',
    },
    pillars: [
      {
        title: 'Corpus-first design',
        body: 'Treat every scrape and OCR batch as a living dataset you can question, translate, and publish — not a disposable chat.',
      },
      {
        title: 'Citation-aware synthesis',
        body: 'Grok-led analysis works over your harvested text so answers stay grounded in sources you actually collected.',
      },
      {
        title: 'Open scholarly commons',
        body: 'Publish datasets and notes to the community library — accelerate replication and interdisciplinary reuse.',
      },
    ],
    howItHelps: [
      {
        title: 'Literature review without tab chaos',
        body: 'One Research Lab workspace replaces scrape → OCR → translate → notes → share across five products.',
      },
      {
        title: 'Best-in-class agent stack',
        body: 'We combine specialized AI agents for discovery, vision, translation, and synthesis — engineered for depth and Hive-credit efficiency.',
      },
      {
        title: 'From seminar to shared dataset',
        body: 'Graduate cohorts can publish cleaned corpora so the next cohort inherits a stronger baseline.',
      },
    ],
    craft: {
      label: 'Interactive · Corpus sprint planner',
      chips: ['Dissertation archive dig', 'Multilingual lit review', 'Figure & table OCR', 'Open dataset publish'],
      responses: {
        'Dissertation archive dig':
          'Pipeline: Fable Scrape on archive indices → OCR chapters → translate → Grok chapter maps → private notes or community publish.\nHive credits: metered per stage with daily caps for lab budgets.',
        'Multilingual lit review':
          'Pipeline: Harvest PDFs/images → translate → RAG questions → synthesis memo.\nAgents: Translator + Grok synthesizer for cross-language themes.',
        'Figure & table OCR':
          'Pipeline: Batch vision OCR on figures → structured captions → library entry.\nOutcome: reusable figure text for papers and teaching.',
        'Open dataset publish':
          'Pipeline: Clean harvested text → publish to communal library → others fork and extend.\nMission: compound scholarly knowledge instead of siloing it.',
      },
    },
    faqs: [
      {
        q: 'Can a university lab share one workspace?',
        a: 'Sign-in is per researcher today; publish to the community library to share corpora across a lab. Unlimited plan suits heavy multi-user credit pools.',
      },
      {
        q: 'How is this different from a chatbot?',
        a: 'Research Lab is a full pipeline — scrape, OCR, translate, RAG, publish — with multi-agent roles and Hive credit metering, not a single chat box.',
      },
    ],
    communityBlurb:
      'Publish corpora, glossaries, and literature maps to AiBhive’s community-sourced library — scholarship that compounds for every researcher who comes after you.',
  },
];

export function getResearchLabCategory(id: ResearchLabCategoryId) {
  return RESEARCH_LAB_CATEGORIES.find((c) => c.id === id)!;
}
