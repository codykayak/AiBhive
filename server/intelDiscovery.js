/**
 * Detect list/discovery research queries vs single-entity targets.
 */

const DISCOVERY_RE =
  /\b(find|list|search for|companies|businesses|organizations|defunct|closed|bankrupt|out of business|shut down|inactive|dissolved|ceased operations|no longer operating|went out of business|liquidat)\b/i;

export function isDiscoveryQuery(label, userIntent = '') {
  const combined = `${label || ''} ${userIntent || ''}`.trim();
  if (!combined) return false;
  if (/^[a-z0-9][-a-z0-9.]*\.[a-z]{2,}$/i.test(label?.trim() || '')) return false;
  if (DISCOVERY_RE.test(combined)) return true;
  if (/\b(more than|at least|over)\s+\d+\s+(year|month)/i.test(combined)) return true;
  return false;
}

export function inferIntelTargetType(label, userIntent = '') {
  const trimmed = String(label || '').trim();
  if (!trimmed && userIntent.trim()) {
    return isDiscoveryQuery('', userIntent) ? 'discovery' : 'company';
  }
  if (isDiscoveryQuery(trimmed, userIntent)) return 'discovery';
  if (/^[a-z0-9][-a-z0-9.]*\.[a-z]{2,}$/i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
    return 'domain';
  }
  if (/linkedin\.com\/in\//i.test(trimmed) || /^@[a-z0-9._-]+$/i.test(trimmed)) {
    return 'person';
  }
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2 && words.length <= 4 && !/\b(inc|llc|ltd|corp|company|group|holdings)\b/i.test(trimmed)) {
    return 'person';
  }
  return 'company';
}
