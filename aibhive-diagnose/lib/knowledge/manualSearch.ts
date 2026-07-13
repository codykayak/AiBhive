import * as Linking from 'expo-linking';

export type ManualSearchLink = {
  label: string;
  query: string;
  googleUrl: string;
};

const MODEL_PATTERNS = [
  /\b[A-Z]{2,6}[- ]?\d{2,}[A-Z0-9./_-]{1,12}\b/g,
  /\b\d{2,3}[A-Z]{1,4}\d{2,}[A-Z0-9-]*\b/g,
  /\b(?:model|mod|m\/n|pn|p\/n)[#:\s]+([A-Z0-9][A-Z0-9./_-]{3,24})\b/gi,
];

export function extractModelCandidates(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of MODEL_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const token = (match[1] || match[0])
        .replace(/^(model|mod|m\/n|pn|p\/n)[#:\s]+/i, '')
        .trim()
        .toUpperCase();
      if (token.length >= 4 && token.length <= 28) found.add(token);
    }
  }
  return [...found].slice(0, 4);
}

export function buildLocalManualDorkLinks(query: string, brand = ''): ManualSearchLink[] {
  const model = extractModelCandidates(query)[0];
  if (!model) return [];
  const base = [brand, model].filter(Boolean).join(' ').trim();
  const packs = [
    { label: 'Service manual PDFs', query: `"${base}" service manual filetype:pdf` },
    { label: 'ManualsLib', query: `site:manualslib.com ${base}` },
    { label: 'Installation manual PDF', query: `"${base}" installation manual filetype:pdf` },
    { label: 'Wiring / parts diagram', query: `"${base}" wiring diagram filetype:pdf` },
  ];
  return packs.map((p) => ({
    label: p.label,
    query: p.query,
    googleUrl: `https://www.google.com/search?q=${encodeURIComponent(p.query)}`,
  }));
}

export function openManualSearchLink(url: string) {
  void Linking.openURL(url);
}
