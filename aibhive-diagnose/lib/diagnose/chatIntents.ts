import {
  buildLocalManualDorkLinks,
  extractModelCandidates,
  type ManualSearchLink,
} from '@/lib/knowledge/manualSearch';

export type OrderPartPrefill = {
  partName?: string;
  partNumber?: string;
  brand?: string;
  equipmentModel?: string;
  notes?: string;
};

export type ChatIntent =
  | { type: 'diagnose' }
  | {
      type: 'ordering_parts';
      prefill: OrderPartPrefill;
      summary: string;
    }
  | {
      type: 'find_manual';
      brand: string;
      model: string;
      productName: string;
      query: string;
      links: ManualSearchLink[];
      summary: string;
    };

/** User explicitly wants to order / buy a part — not generic diagnosis chatter. */
const ORDERING_PARTS_HINTS =
  /\b(?:order(?:ing)?\s+parts?|order\s+(?:a\s+)?part|buy\s+(?:a\s+)?part|purchase\s+(?:a\s+)?part|need\s+(?:to\s+)?order|get\s+me\s+(?:a\s+)?part|submit\s+(?:a\s+)?part(?:\s+request)?|parts?\s+order)\b/i;

const MANUAL_HINTS =
  /\b(?:(?:owner'?s?|instruction|service|user|repair|installation|parts?)\s+manual|manual\s+for|find\s+(?:a\s+)?manual|need\s+(?:an?\s+)?manual|look\s+up\s+(?:the\s+)?manual)\b/i;

const KNOWN_BRANDS = [
  'samsung',
  'lg',
  'ge',
  'whirlpool',
  'bosch',
  'carrier',
  'trane',
  'lennox',
  'rheem',
  'goodman',
  'pentair',
  'hayward',
  'jandy',
  'sta-rite',
  'sta rite',
  'jandy',
  'rinnai',
  'navien',
  'honeywell',
  'ecobee',
  'nest',
  'square d',
  'siemens',
  'eaton',
];

function titleCase(s: string) {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function extractPartNumber(text: string): string {
  const labeled = text.match(
    /\b(?:part|oem|sku|p\/n|pn)\s*(?:number|#|no\.?)?\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9./_-]{1,28})/i
  );
  if (labeled?.[1]) return labeled[1].trim().toUpperCase();

  const models = extractModelCandidates(text);
  if (models.length) return models[0];

  const numeric = text.match(/\b(?:number|#)\s*(\d{3,12})\b/i);
  if (numeric?.[1]) return numeric[1];

  return '';
}

export function extractBrand(text: string): string {
  const lower = text.toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (lower.includes(brand)) return titleCase(brand.replace('sta rite', 'Sta-Rite'));
  }
  const by = text.match(/\bby\s+([A-Za-z][A-Za-z0-9\s-]{1,24})/i);
  if (by?.[1]) {
    const chunk = by[1].trim().split(/\s+(?:for|dishwasher|washer|dryer|furnace|pump|heater)\b/i)[0];
    if (chunk) return titleCase(chunk);
  }
  return '';
}

function extractProductName(text: string, brand: string): string {
  const lower = text.toLowerCase();
  const appliances =
    /\b(dishwasher|washer|dryer|refrigerator|furnace|heat\s*pump|air\s*handler|pool\s*pump|salt\s*cell|panel|breaker|motor|impeller|contactor|control\s*board)\b/i;
  const match = lower.match(appliances);
  if (match?.[1]) return titleCase(match[1].replace(/\s+/g, ' '));

  let cleaned = text
    .replace(ORDERING_PARTS_HINTS, '')
    .replace(MANUAL_HINTS, '')
    .replace(/\b(?:part\s*(?:number|#)?\s*[:#]?\s*[A-Za-z0-9./_-]+)/gi, '')
    .replace(/\b(?:hey|hi|hello|croc|please|the|a|an|for|my|i need|i want)\b/gi, '')
    .trim();

  if (brand) {
    cleaned = cleaned.replace(new RegExp(brand, 'ig'), '').trim();
  }
  cleaned = cleaned.replace(/^by\s+/i, '').replace(/\s+/g, ' ').trim();
  if (cleaned.length >= 3 && cleaned.length <= 80) return titleCase(cleaned);
  return '';
}

export function buildManualIntentLinks(query: string, brand = '', productName = ''): ManualSearchLink[] {
  const model = extractModelCandidates(query)[0] || extractPartNumber(query);
  const base = [brand, productName || model, model].filter(Boolean).join(' ').trim() || query.trim();

  const packs: Array<{ label: string; query: string }> = [
    { label: "Owner's manual PDF", query: `"${base}" owner's manual filetype:pdf` },
    { label: 'Service manual PDFs', query: `"${base}" service manual filetype:pdf` },
    { label: 'ManualsLib', query: `site:manualslib.com ${base}` },
    { label: 'Installation guide PDF', query: `"${base}" installation manual filetype:pdf` },
  ];

  const seen = new Set<string>();
  const links: ManualSearchLink[] = [];
  for (const p of packs) {
    if (seen.has(p.query)) continue;
    seen.add(p.query);
    links.push({
      label: p.label,
      query: p.query,
      googleUrl: `https://www.google.com/search?q=${encodeURIComponent(p.query)}`,
    });
  }

  const local = buildLocalManualDorkLinks(query, brand);
  for (const link of local) {
    if (!seen.has(link.query)) {
      seen.add(link.query);
      links.push(link);
    }
  }

  return links.slice(0, 6);
}

export function parseChatIntent(text: string): ChatIntent {
  const raw = text.trim();
  if (!raw) return { type: 'diagnose' };

  const brand = extractBrand(raw);
  const partNumber = extractPartNumber(raw);
  const productName = extractProductName(raw, brand);
  const model = extractModelCandidates(raw)[0] || partNumber;

  if (MANUAL_HINTS.test(raw) && !ORDERING_PARTS_HINTS.test(raw)) {
    const query = [brand, productName, model].filter(Boolean).join(' ').trim() || raw;
    const links = buildManualIntentLinks(raw, brand, productName);
    const label = [brand, productName, model].filter(Boolean).join(' ') || 'that equipment';
    return {
      type: 'find_manual',
      brand,
      model,
      productName,
      query,
      links,
      summary: label,
    };
  }

  if (ORDERING_PARTS_HINTS.test(raw) || (/\bpart\s+(?:number|#)/i.test(raw) && productName)) {
    const partName =
      [brand, productName, partNumber ? `part ${partNumber}` : ''].filter(Boolean).join(' ').trim() ||
      raw.slice(0, 120);

    const prefill: OrderPartPrefill = {
      partName,
      partNumber: partNumber || undefined,
      brand: brand || undefined,
      equipmentModel: model && model !== partNumber ? model : productName || undefined,
      notes: raw.length <= 200 ? raw : undefined,
    };

    return {
      type: 'ordering_parts',
      prefill,
      summary: partName,
    };
  }

  return { type: 'diagnose' };
}

/** True when voice/text should auto-send without tapping Send. */
export function shouldAutoSendIntent(text: string): boolean {
  const intent = parseChatIntent(text);
  return intent.type === 'ordering_parts' || intent.type === 'find_manual';
}
