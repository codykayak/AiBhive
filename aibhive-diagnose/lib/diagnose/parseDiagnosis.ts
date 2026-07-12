import type { DiagnosisResult } from '@/lib/packs/types';

/**
 * Parse freeform AI / library replies into structured field cards.
 * Tolerates bold markdown headers and numbered/bulleted lists.
 */
export function parseDiagnosis(content: string): DiagnosisResult | null {
  const text = content.replace(/\r\n/g, '\n').trim();
  if (!text || text.length < 40) return null;

  const sections = splitSections(text);
  const summary =
    pickSection(sections, ['quick summary', 'summary', 'overview']) ||
    firstParagraph(text);

  const likelyCauses = pickList(sections, [
    'likely causes',
    'causes',
    'probable causes',
    'possible causes',
  ]);
  const steps = pickList(sections, [
    'step-by-step',
    'steps',
    'checks',
    'repair',
    'what to do',
    'procedure',
  ]);
  const safetyNotes = pickList(sections, ['safety', 'warnings', 'cautions']);
  const partsToCheck = pickList(sections, [
    'parts',
    'tools',
    'parts / tools',
    'parts to have',
    'have ready',
  ]);

  // Require at least one actionable section beyond a bare summary.
  if (!likelyCauses.length && !steps.length && !partsToCheck.length) {
    return null;
  }

  return {
    summary: summary.slice(0, 400),
    likelyCauses: likelyCauses.slice(0, 8),
    steps: steps.slice(0, 12),
    safetyNotes: safetyNotes.slice(0, 6),
    partsToCheck: partsToCheck.slice(0, 8),
  };
}

function splitSections(text: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = text.split('\n');
  let currentKey = '_lead';
  let buf: string[] = [];

  const flush = () => {
    const body = buf.join('\n').trim();
    if (body) map.set(currentKey, body);
    buf = [];
  };

  for (const line of lines) {
    const header = matchHeader(line);
    if (header) {
      flush();
      currentKey = header;
      continue;
    }
    buf.push(line);
  }
  flush();
  return map;
}

function matchHeader(line: string): string | null {
  const trimmed = line.trim();
  // **Header** or ## Header
  const bold = trimmed.match(/^\*\*([^*]+)\*\*:?\s*$/);
  if (bold) return normalizeKey(bold[1]!);
  const hash = trimmed.match(/^#{1,3}\s+(.+)$/);
  if (hash) return normalizeKey(hash[1]!);
  // Only treat numbered lines as headers when they look like section titles
  // (short label ending with colon), not step bodies like "1. Fill basket…".
  const numbered = trimmed.match(/^\d+[).]\s+([A-Za-z][^:]{2,40}):\s*$/);
  if (numbered) return normalizeKey(numbered[1]!);
  return null;
}

function normalizeKey(raw: string): string {
  return raw
    .replace(/\*\*/g, '')
    .replace(/[:.]+$/g, '')
    .trim()
    .toLowerCase();
}

function pickSection(sections: Map<string, string>, keys: string[]): string {
  for (const [k, v] of sections) {
    if (keys.some((want) => k.includes(want))) return stripMarkdown(v);
  }
  return '';
}

function pickList(sections: Map<string, string>, keys: string[]): string[] {
  const body = pickSection(sections, keys);
  if (!body) return [];
  return body
    .split('\n')
    .map((line) =>
      line
        .replace(/^[\s]*([-*•·]|\d+[).])\s+/, '')
        .replace(/\*\*/g, '')
        .trim()
    )
    .filter((line) => line.length > 1 && !/^_{1,2}/.test(line))
    .slice(0, 12);
}

function firstParagraph(text: string): string {
  const block = text.split(/\n\n+/)[0] || text;
  return stripMarkdown(block).slice(0, 400);
}

function stripMarkdown(s: string): string {
  return s.replace(/\*\*/g, '').replace(/^_+/gm, '').replace(/_+$/gm, '').trim();
}
