export type DorkTemplate = {
  id: string;
  category: string;
  label: string;
  template: string;
  variables: string[];
};

export const DORK_TEMPLATES: DorkTemplate[] = [
  {
    id: 'site_files_pdf',
    category: 'Documents',
    label: 'PDFs on domain',
    template: 'site:{domain} filetype:pdf',
    variables: ['domain'],
  },
  {
    id: 'site_files_doc',
    category: 'Documents',
    label: 'Word docs on domain',
    template: 'site:{domain} filetype:doc OR filetype:docx',
    variables: ['domain'],
  },
  {
    id: 'site_login',
    category: 'Infrastructure',
    label: 'Login / admin pages',
    template: 'site:{domain} inurl:login OR inurl:admin OR inurl:portal',
    variables: ['domain'],
  },
  {
    id: 'site_exposed',
    category: 'Infrastructure',
    label: 'Directory listings / config',
    template: 'site:{domain} intitle:"index of" OR ext:env OR ext:config',
    variables: ['domain'],
  },
  {
    id: 'emails_domain',
    category: 'People',
    label: 'Emails mentioning domain',
    template: '"@{domain}" OR "@{domain}" -site:{domain}',
    variables: ['domain'],
  },
  {
    id: 'linkedin_company',
    category: 'People',
    label: 'LinkedIn profiles at company',
    template: 'site:linkedin.com/in "{company}"',
    variables: ['company'],
  },
  {
    id: 'linkedin_role',
    category: 'People',
    label: 'Leadership / hiring contacts',
    template: 'site:linkedin.com/in "{company}" (CEO OR CTO OR "HR" OR recruiter OR "hiring manager")',
    variables: ['company'],
  },
  {
    id: 'news_company',
    category: 'Business',
    label: 'Recent news',
    template: '"{company}" (news OR press OR funding OR acquisition)',
    variables: ['company'],
  },
  {
    id: 'reviews_company',
    category: 'Business',
    label: 'Reviews & reputation',
    template: '"{company}" (review OR complaint OR lawsuit OR scam)',
    variables: ['company'],
  },
  {
    id: 'subdomains',
    category: 'Infrastructure',
    label: 'Subdomain discovery hint',
    template: 'site:*.{domain} -www.{domain}',
    variables: ['domain'],
  },
  {
    id: 'jobs_company',
    category: 'Business',
    label: 'Job postings',
    template: '"{company}" (careers OR jobs OR hiring OR "we are hiring")',
    variables: ['company'],
  },
  {
    id: 'tech_stack',
    category: 'Business',
    label: 'Tech mentions',
    template: 'site:{domain} (powered by OR built with OR "tech stack")',
    variables: ['domain'],
  },
];

export function buildDorkPack(opts: {
  domain?: string;
  company?: string;
}): { label: string; query: string; googleUrl: string }[] {
  const domain = opts.domain?.replace(/^https?:\/\//, '').split('/')[0] ?? '';
  const company = opts.company ?? domain;

  return DORK_TEMPLATES.map((t) => {
    let query = t.template;
    query = query.replace(/\{domain\}/g, domain);
    query = query.replace(/\{company\}/g, company);
    return {
      label: t.label,
      query,
      googleUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    };
  }).filter((d) => d.query && !d.query.includes('{'));
}

export function dorkCategories(): string[] {
  return [...new Set(DORK_TEMPLATES.map((t) => t.category))];
}
