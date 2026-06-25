export type DorkTemplate = {
  id: string;
  category: string;
  label: string;
  template: string;
  variables: string[];
  /** company | domain (website) | person */
  targets: ('company' | 'domain' | 'person')[];
};

export const DORK_TEMPLATES: DorkTemplate[] = [
  {
    id: 'site_files_pdf',
    category: 'Documents',
    label: 'PDFs on domain',
    template: 'site:{domain} filetype:pdf',
    variables: ['domain'],
    targets: ['company', 'domain'],
  },
  {
    id: 'site_files_doc',
    category: 'Documents',
    label: 'Word docs on domain',
    template: 'site:{domain} filetype:doc OR filetype:docx',
    variables: ['domain'],
    targets: ['company', 'domain'],
  },
  {
    id: 'site_login',
    category: 'Infrastructure',
    label: 'Login / admin pages',
    template: 'site:{domain} inurl:login OR inurl:admin OR inurl:portal',
    variables: ['domain'],
    targets: ['company', 'domain'],
  },
  {
    id: 'site_exposed',
    category: 'Infrastructure',
    label: 'Directory listings / config',
    template: 'site:{domain} intitle:"index of" OR ext:env OR ext:config',
    variables: ['domain'],
    targets: ['company', 'domain'],
  },
  {
    id: 'emails_domain',
    category: 'People',
    label: 'Emails mentioning domain',
    template: '"@{domain}" OR "@{domain}" -site:{domain}',
    variables: ['domain'],
    targets: ['company', 'domain'],
  },
  {
    id: 'linkedin_company',
    category: 'People',
    label: 'LinkedIn profiles at company',
    template: 'site:linkedin.com/in "{company}"{region}',
    variables: ['company', 'region'],
    targets: ['company'],
  },
  {
    id: 'linkedin_role',
    category: 'People',
    label: 'Leadership / hiring contacts',
    template: 'site:linkedin.com/in "{company}" (CEO OR CTO OR "HR" OR recruiter OR "hiring manager"){region}',
    variables: ['company', 'region'],
    targets: ['company'],
  },
  {
    id: 'linkedin_person',
    category: 'People',
    label: 'LinkedIn profile search',
    template: 'site:linkedin.com/in "{person}"{region}',
    variables: ['person', 'region'],
    targets: ['person'],
  },
  {
    id: 'person_social',
    category: 'People',
    label: 'Social & public mentions',
    template: '"{person}" (Twitter OR Instagram OR GitHub OR biography OR interview){region}',
    variables: ['person', 'region'],
    targets: ['person'],
  },
  {
    id: 'person_news',
    category: 'People',
    label: 'News & press mentions',
    template: '"{person}" (news OR press OR lawsuit OR appointment OR CEO OR founder){region}',
    variables: ['person', 'region'],
    targets: ['person'],
  },
  {
    id: 'news_company',
    category: 'Business',
    label: 'Recent news',
    template: '"{company}" (news OR press OR funding OR acquisition){region}',
    variables: ['company', 'region'],
    targets: ['company'],
  },
  {
    id: 'reviews_company',
    category: 'Business',
    label: 'Reviews & reputation',
    template: '"{company}" (review OR complaint OR lawsuit OR scam){region}',
    variables: ['company', 'region'],
    targets: ['company'],
  },
  {
    id: 'subdomains',
    category: 'Infrastructure',
    label: 'Subdomain discovery hint',
    template: 'site:*.{domain} -www.{domain}',
    variables: ['domain'],
    targets: ['company', 'domain'],
  },
  {
    id: 'jobs_company',
    category: 'Business',
    label: 'Job postings',
    template: '"{company}" (careers OR jobs OR hiring OR "we are hiring"){region}',
    variables: ['company', 'region'],
    targets: ['company'],
  },
  {
    id: 'tech_stack',
    category: 'Business',
    label: 'Tech mentions',
    template: 'site:{domain} (powered by OR built with OR "tech stack")',
    variables: ['domain'],
    targets: ['company', 'domain'],
  },
];

function regionalDorkSuffix(region?: { restrictToRegion?: boolean; location?: string }): string {
  if (!region?.restrictToRegion || !region.location?.trim()) return '';
  return ` ${region.location.trim()}`;
}

export function buildDorkPack(opts: {
  domain?: string;
  company?: string;
  person?: string;
  targetType?: 'company' | 'domain' | 'person';
  region?: { restrictToRegion?: boolean; location?: string };
}): { label: string; query: string; googleUrl: string }[] {
  const domain = opts.domain?.replace(/^https?:\/\//, '').split('/')[0] ?? '';
  const company = opts.company ?? domain;
  const person = opts.person ?? company;
  const targetType = opts.targetType ?? (domain ? 'domain' : 'company');
  const regionSuffix = regionalDorkSuffix(opts.region);

  return DORK_TEMPLATES.filter((t) => t.targets.includes(targetType))
    .map((t) => {
      let query = t.template;
      query = query.replace(/\{domain\}/g, domain);
      query = query.replace(/\{company\}/g, company);
      query = query.replace(/\{person\}/g, person);
      query = query.replace(/\{region\}/g, regionSuffix);
      return {
        label: t.label,
        query: query.trim(),
        googleUrl: `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`,
      };
    })
    .filter((d) => d.query && !d.query.includes('{'));
}

export function dorkCategories(): string[] {
  return [...new Set(DORK_TEMPLATES.map((t) => t.category))];
}
