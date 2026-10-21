export function zillowUrl(address: string) {
  const q = String(address || '').trim();
  if (!q) return '';
  return `https://www.zillow.com/homes/${encodeURIComponent(q)}_rb/`;
}

export function redfinUrl(address: string) {
  const q = String(address || '').trim();
  if (!q) return '';
  return `https://www.redfin.com/states/search?query=${encodeURIComponent(q)}`;
}

export function countyAssessorSearchUrl(address: string) {
  const q = String(address || '').trim();
  if (!q) return '';
  return `https://www.google.com/search?q=${encodeURIComponent(`county property assessor ${q}`)}`;
}

export type PropertyIntelLink = { id: string; label: string; href: string };

export function propertyIntelLinks(address: string): PropertyIntelLink[] {
  const z = zillowUrl(address);
  const r = redfinUrl(address);
  const a = countyAssessorSearchUrl(address);
  const out: PropertyIntelLink[] = [];
  if (z) out.push({ id: 'zillow', label: 'Zillow', href: z });
  if (r) out.push({ id: 'redfin', label: 'Redfin', href: r });
  if (a) out.push({ id: 'assessor', label: 'Assessor', href: a });
  return out;
}
