/**
 * Format owner names from county/CSV exports (often "LAST,FIRST", ALL CAPS, " & 1") for natural SMS greetings.
 */

function titleCaseWord(word: string): string {
  const w = word.trim();
  if (!w) return '';
  const lower = w.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Strip trailing joint-owner noise like " & 1" / "and 1" from assessor strings. */
export function stripJointOwnerNoise(s: string): string {
  return s
    .replace(/\s*(?:&|\+|and)\s*\+?\s*1\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Title-case a full owner line for UI (e.g. "Phyllis Ann Hicks" instead of assessor ALL CAPS). */
export function formatLeadDisplayName(name?: string): string {
  const raw = stripJointOwnerNoise(name || '').trim();
  if (!raw) return 'Owner';
  const comma = raw.indexOf(',');
  if (comma !== -1) {
    const last = raw
      .slice(0, comma)
      .trim()
      .split(/\s+/)
      .map(titleCaseWord)
      .join(' ');
    const rest = raw
      .slice(comma + 1)
      .trim()
      .split(/\s+/)
      .map(titleCaseWord)
      .join(' ');
    if (rest && last) return `${rest} ${last}`;
    return rest || last;
  }
  return raw.split(/\s+/).map(titleCaseWord).join(' ');
}

/**
 * From one owner token, derive a first name: handles "SMITH,JANE", "JANE DOE", "JANE".
 */
export function formatSmsFirstName(rawToken: string): string {
  const t = stripJointOwnerNoise(rawToken);
  if (!t) return '';

  const comma = t.indexOf(',');
  if (comma !== -1) {
    const afterComma = t.slice(comma + 1).trim();
    const firstChunk = afterComma.split(/\s+/)[0] || '';
    const cleaned = firstChunk.replace(/^[^A-Za-z]+/, '');
    return titleCaseWord(cleaned);
  }

  const parts = t.split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return titleCaseWord(parts[0].replace(/^[^A-Za-z]+/, ''));
}
