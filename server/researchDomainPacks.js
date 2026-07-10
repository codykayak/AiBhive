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
      { step: 0, action: 'harvest', hint: 'AI Harvest with Director filtering fairgrounds imagery.' },
      { step: 1, action: 'ocr', hint: 'OCR engraved captions and plate numbers.' },
      { step: 3, action: 'research', hint: 'Ask Grok for timeline synthesis over harvested text.' },
      { step: 2, action: 'publish', hint: 'Publish caption packs to Communal Library.' },
    ],
    rosterHint: { director: 'grok', vision: 'gemini', translator: 'grok' },
    estimateHint: 'Harvest of 8 findings ≈ 0.08–0.20 Hive credits depending on routing',
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
      { step: 0, action: 'harvest', hint: 'Collect street-level historical photos.' },
      { step: 1, action: 'ocr', hint: 'OCR captions, signs, and newspaper clippings.' },
      { step: 2, action: 'publish', hint: 'Publish to Mud Flood topic with source URLs.' },
    ],
    rosterHint: { director: 'grok', vision: 'gemini', translator: 'gemini' },
    estimateHint: 'Photo pack ≈ 0.10–0.30 Hive credits',
  },
];

export function listDomainPacks(category) {
  if (!category) return DOMAIN_PACKS;
  return DOMAIN_PACKS.filter((p) => p.category === category);
}

export function getDomainPack(id) {
  return DOMAIN_PACKS.find((p) => p.id === id) || null;
}
