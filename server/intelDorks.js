/** Google dork templates for Intel Agent (server-side). */

const DORK_TEMPLATES = [
  { label: 'PDFs on domain', template: 'site:{domain} filetype:pdf', targets: ['company', 'domain'] },
  { label: 'Login / admin pages', template: 'site:{domain} inurl:login OR inurl:admin', targets: ['company', 'domain'] },
  { label: 'LinkedIn profiles at company', template: 'site:linkedin.com/in "{company}"{region}', targets: ['company'] },
  { label: 'Leadership contacts', template: 'site:linkedin.com/in "{company}" (CEO OR CTO OR recruiter){region}', targets: ['company'] },
  { label: 'LinkedIn person', template: 'site:linkedin.com/in "{person}"{region}', targets: ['person'] },
  { label: 'Person social mentions', template: '"{person}" (Twitter OR GitHub OR biography){region}', targets: ['person'] },
  { label: 'Company news', template: '"{company}" (news OR funding OR acquisition){region}', targets: ['company'] },
  { label: 'Reviews & reputation', template: '"{company}" (review OR complaint OR lawsuit){region}', targets: ['company'] },
  { label: 'Job postings', template: '"{company}" (careers OR hiring){region}', targets: ['company'] },
  { label: 'Defunct / closed businesses', template: '"{query}" (closed OR "out of business" OR bankrupt OR dissolved OR "ceased operations"){region}', targets: ['discovery'] },
  { label: 'Business closure news', template: '{query} ("shut down" OR liquidation OR "filed for bankruptcy"){region}', targets: ['discovery'] },
  { label: 'Inactive company lists', template: '{query} (defunct OR inactive OR "no longer operating") site:.gov OR site:.org{region}', targets: ['discovery'] },
  { label: 'Industry closure reports', template: '{query} ("went out of business" OR "closed permanently"){region}', targets: ['discovery'] },
  { label: 'Florida Sunbiz dissolved', template: 'site:sunbiz.org dissolved inactive {query}{region}', targets: ['discovery'] },
  { label: 'Florida DBPR inactive license', template: 'site:myfloridalicense.com inactive void {query}{region}', targets: ['discovery'] },
];

function regionalSuffix(region) {
  if (!region?.restrictToRegion && !region?.location) return '';
  const loc = String(region.location || '').trim();
  return loc ? ` ${loc}` : '';
}

export function buildDorkPack(opts) {
  const domain = String(opts.domain || '').replace(/^https?:\/\//, '').split('/')[0];
  const company = opts.company || domain;
  const person = opts.person || company;
  const query = opts.query || opts.userIntent || company || domain;
  const targetType = opts.targetType || (domain ? 'domain' : 'company');
  const regionSuffix = regionalSuffix(opts.region);

  return DORK_TEMPLATES.filter((t) => t.targets.includes(targetType))
    .map((t) => {
      let q = t.template
        .replace(/\{domain\}/g, domain)
        .replace(/\{company\}/g, company)
        .replace(/\{person\}/g, person)
        .replace(/\{query\}/g, query)
        .replace(/\{region\}/g, regionSuffix)
        .trim();
      return {
        label: t.label,
        query: q,
        googleUrl: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
      };
    })
    .filter((d) => d.query && !d.query.includes('{'));
}
