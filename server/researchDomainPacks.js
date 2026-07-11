/**
 * Research Lab domain packs — preset agent recipes for category workflows.
 */
export const DOMAIN_PACKS = [
  {
    id: 'cuneiform-tablet',
    category: 'historical-ancient',
    name: 'Cuneiform tablet pack',
    blurb: 'High-res tablet photos → Vision OCR → ancient→modern translation → Grok comparative notes.',
    topicId: 'cuneiform',
    steps: [
      { step: 0, action: 'harvest', hint: 'Point Fable Scrape at tablet photo archives (≤20 pages).' },
      { step: 1, action: 'ocr', hint: 'Batch OCR wedge patterns; keep filenames as provenance.' },
      { step: 4, action: 'translate', hint: 'Translate glosses; save corrections to the communal glossary.' },
      { step: 2, action: 'publish', hint: 'Publish transliterations to Communal Library · Cuneiform.' },
    ],
    rosterHint: { director: 'grok', vision: 'gemini', translator: 'gemini' },
    estimateHint: 'Typical run: scrape + 8 OCR pages + translate ≈ 0.15–0.35 Hive credits',
  },
  {
    id: 'world-fair-plates',
    category: 'historical-ancient',
    name: 'World fair photograph pack',
    blurb: 'Stealth crawl fairground plates → OCR captions → timeline notes → community publish.',
    topicId: 'world-fairs',
    steps: [
      {
        step: 0,
        action: 'harvest',
        hint:
          'Paste an Archive.org fair search (e.g. Columbian Exposition 1893 photographs) — Crawl on, findings 2–4.',
      },
      { step: 1, action: 'ocr', hint: 'OCR engraved captions and plate numbers.' },
      { step: 3, action: 'research', hint: 'Ask Grok for timeline synthesis over harvested text.' },
      { step: 2, action: 'publish', hint: 'Publish caption packs to Communal Library.' },
    ],
    rosterHint: { director: 'grok', vision: 'gemini', translator: 'grok' },
    estimateHint: 'Harvest of 8 findings ≈ 0.08–0.20 Hive credits depending on routing',
    suggestedUrl:
      'https://archive.org/search?query=Columbian+Exposition+1893+photographs&and[]=year%3A%5B1870+TO+1925%5D',
  },
  {
    id: 'exhibit-ocr-sprint',
    category: 'legal-findings',
    name: 'Exhibit OCR sprint',
    blurb: 'Batch ≤50 exhibit scans → issue tags → private notes or public-domain publish.',
    topicId: 'legal-research',
    steps: [
      { step: 1, action: 'ocr', hint: 'Upload exhibit scans (stay under daily caps).' },
      { step: 3, action: 'research', hint: 'Ask Grok for issue clustering — never publish privileged material.' },
      { step: 2, action: 'publish', hint: 'Only publish public-domain finding packs.' },
    ],
    rosterHint: { director: 'grok', vision: 'gemini', translator: 'claude' },
    estimateHint: '50 OCR pages ≈ ~0.20 Hive credits (platform) or BYOK orchestration only',
  },
  {
    id: 'herbal-monograph',
    category: 'medical-holistic',
    name: 'Herbal monograph pack',
    blurb: 'Scrape botanical refs → OCR tables → translate → RAG Q&A on constituents.',
    topicId: 'botanicals',
    steps: [
      { step: 0, action: 'harvest', hint: 'Harvest botanical plates and monographs.' },
      { step: 1, action: 'ocr', hint: 'OCR dosage tables carefully.' },
      { step: 4, action: 'translate', hint: 'Translate ethnobotany texts; correct glossary terms.' },
      { step: 2, action: 'publish', hint: 'Publish de-identified literature packs only.' },
    ],
    rosterHint: { director: 'grok', vision: 'gemini', translator: 'gemini' },
    estimateHint: 'Full monograph pipeline ≈ 0.20–0.45 Hive credits',
  },
  {
    id: 'lit-review-sprint',
    category: 'academia-scholarly',
    name: 'Multilingual lit-review sprint',
    blurb: 'Harvest PDFs/images → translate → Grok literature map → open dataset publish.',
    topicId: 'academia',
    steps: [
      { step: 0, action: 'harvest', hint: 'Crawl archive indices for target corpus.' },
      { step: 1, action: 'ocr', hint: 'OCR chapters and figures.' },
      { step: 4, action: 'translate', hint: 'Cross-language pass before synthesis.' },
      { step: 3, action: 'research', hint: 'Ask Grok for themes grounded in your harvested text.' },
      { step: 2, action: 'publish', hint: 'Publish cleaned corpora to Communal Library.' },
    ],
    rosterHint: { director: 'grok', vision: 'gemini', translator: 'claude' },
    estimateHint: 'Lab-scale sprint ≈ 0.40–1.20 Hive credits with daily caps protecting budget',
  },
  {
    id: 'mud-flood-street',
    category: 'historical-ancient',
    name: 'Mud flood street study',
    blurb: 'Photo archives + window-line notes → OCR → communal mud-flood corpus.',
    topicId: 'mud-flood',
    steps: [
      {
        step: 0,
        action: 'harvest',
        hint:
          'Start with Chron Am mud-flood / street-grade search OR Archive.org souvenir albums — not bare homepages.',
      },
      { step: 1, action: 'ocr', hint: 'OCR captions, signs, and newspaper clippings.' },
      { step: 2, action: 'publish', hint: 'Publish to Mud Flood topic with source URLs.' },
    ],
    rosterHint: { director: 'grok', vision: 'gemini', translator: 'gemini' },
    estimateHint: 'Photo pack ≈ 0.10–0.30 Hive credits',
    suggestedUrl:
      'https://chroniclingamerica.loc.gov/search/pages/results/?proxtext=mud+flood&date1=1870&date2=1920&rows=20&searchType=basic',
  },
  {
    id: 'chronicling-america-tartaria',
    category: 'historical-ancient',
    name: 'Chronicling America newspaper leads',
    blurb:
      'Start from a LOC Chronicling America search-results URL (not the homepage). Crawl results → text-corpus harvest extracts citable Tartarian / Old World leads under a tight credit budget.',
    topicId: 'tartarian',
    steps: [
      {
        step: 0,
        action: 'harvest',
        hint:
          'Paste a search-results URL, e.g. chroniclingamerica.loc.gov/search/pages/results/?proxtext=Tartar&date1=1850&date2=1922&rows=20 — enable Crawl, max pages 8–12, findings 2–4.',
      },
      { step: 3, action: 'research', hint: 'Ask Grok to deepen the strongest lead with place/date cross-checks.' },
      { step: 2, action: 'publish', hint: 'Publish only public-domain newspaper quotes with source URLs.' },
    ],
    rosterHint: { director: 'grok', vision: 'gemini', translator: 'grok' },
    estimateHint: 'Text-corpus harvest (no Vision OCR) ≈ 0.05–0.25 Hive credits for 2–4 leads',
    suggestedUrl:
      'https://chroniclingamerica.loc.gov/search/pages/results/?state=&date1=1850&date2=1922&proxtext=Tartar&x=0&y=0&dateFilterType=yearRange&rows=20&searchType=basic',
  },
  {
    id: 'star-fort-maps',
    category: 'historical-ancient',
    name: 'Star fort & Sanborn map dig',
    blurb: 'Rumsey/LOC fort + Sanborn grade maps → image harvest → communal star-forts corpus.',
    topicId: 'star-forts',
    steps: [
      {
        step: 0,
        action: 'harvest',
        hint: 'Paste Rumsey fort/bastion search or LOC Sanborn city query — image-OCR path.',
      },
      { step: 1, action: 'ocr', hint: 'OCR map titles, legends, and street grades.' },
      { step: 2, action: 'publish', hint: 'Publish to star-forts / ancient-maps with source URLs.' },
    ],
    rosterHint: { director: 'grok', vision: 'gemini', translator: 'grok' },
    estimateHint: 'Map pack ≈ 0.08–0.25 Hive credits',
    suggestedUrl: 'https://www.davidrumsey.com/luna/servlet/view/search?q=fort%20bastion',
  },
  {
    id: 'cdli-cuneiform-tablets',
    category: 'historical-ancient',
    name: 'CDLI cuneiform tablet dig',
    blurb:
      'Start from a CDLI search-results URL (not the homepage). Crawl into /artifacts/N pages → tablet photo OCR / transliteration notes → Communal Library · Cuneiform.',
    topicId: 'cuneiform',
    steps: [
      {
        step: 0,
        action: 'harvest',
        hint:
          'Paste https://cdli.earth/search?q=Sumerian (or your keywords) — Crawl on, max pages 10–12, depth 1, findings 3–5. Homepages return zero tablets.',
      },
      { step: 1, action: 'ocr', hint: 'Vision OCR / transliterate selected tablet photos (P######).' },
      { step: 4, action: 'translate', hint: 'Modern-language notes; keep P-numbers and periods intact.' },
      { step: 2, action: 'publish', hint: 'Publish to Communal Library · Cuneiform with CDLI provenance URLs.' },
    ],
    rosterHint: { director: 'grok', vision: 'gemini', translator: 'gemini' },
    estimateHint: 'Tablet photo harvest ≈ 0.15–0.45 Hive credits for 3–5 findings',
    suggestedUrl: 'https://cdli.earth/search?q=Sumerian',
  },
  {
    id: 'orphan-train-press',
    category: 'historical-ancient',
    name: 'Orphan train press dig',
    blurb: 'Chron Am orphan-train / foundling searches by state → text-corpus → communal orphan-trains.',
    topicId: 'orphan-trains',
    steps: [
      {
        step: 0,
        action: 'harvest',
        hint: 'Use Chron Am orphan-train search-results URL (national or state filter) — Crawl 8–12, findings 2–4.',
      },
      { step: 3, action: 'research', hint: 'Cross-check arrival dates vs institutional builds — do not invent links.' },
      { step: 2, action: 'publish', hint: 'Publish public-domain quotes only to orphan-trains.' },
    ],
    rosterHint: { director: 'grok', vision: 'gemini', translator: 'grok' },
    estimateHint: 'Text-corpus harvest ≈ 0.05–0.20 Hive credits',
    suggestedUrl:
      'https://chroniclingamerica.loc.gov/search/pages/results/?proxtext=%22orphan+train%22&date1=1850&date2=1929&rows=20&searchType=basic',
  },
];

export function listDomainPacks(category) {
  if (!category) return DOMAIN_PACKS;
  return DOMAIN_PACKS.filter((p) => p.category === category);
}

export function getDomainPack(id) {
  return DOMAIN_PACKS.find((p) => p.id === id) || null;
}
