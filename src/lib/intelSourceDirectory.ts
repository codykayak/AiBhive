import type { IntelTargetType } from './intelWebApi';

/** How the user gets into a source. */
export type SourceAccess = 'free' | 'signin' | 'paid';

export type IntelSource = {
  name: string;
  url: string;
  description: string;
  access: SourceAccess;
  /** How to get past a sign-in wall or paywall, when one exists. */
  accessTip?: string;
};

export type SourceCategory = {
  id: string;
  title: string;
  /** One-line "why this step" so the workflow reads methodically. */
  blurb: string;
  sources: IntelSource[];
};

export type SourceDirectoryTarget = {
  type: IntelTargetType;
  label: string;
  domain?: string;
  region?: { location: string; radiusMiles: number };
};

/** Generic ways to read content that sits behind a paywall or sign-in wall. */
export const PAYWALL_BYPASS_TIPS: { name: string; url: string; note: string }[] = [
  {
    name: 'archive.today',
    url: 'https://archive.ph/',
    note: 'Paste any article URL to read a saved copy of most news paywalls. Or search the page there first.',
  },
  {
    name: 'Wayback Machine',
    url: 'https://web.archive.org/',
    note: 'Older snapshots of a page are often captured before a paywall or before content was removed.',
  },
  {
    name: '12ft.io',
    url: 'https://12ft.io/',
    note: 'Prefix a URL (12ft.io/proxy?q=URL) to strip many soft paywalls and cookie/registration walls.',
  },
  {
    name: 'Google cache / text-only',
    url: 'https://www.google.com/search?q=',
    note: 'Search the exact headline in quotes — the snippet often reveals the gated text; open the cached copy.',
  },
  {
    name: 'Your public library',
    url: 'https://www.worldcat.org/libraries',
    note: 'A free library card unlocks Gale, ProQuest, Nexis Uni, Morningstar and D&B — the same paid databases, free.',
  },
];

function enc(value: string | undefined): string {
  return encodeURIComponent((value || '').trim());
}

function quoted(value: string | undefined): string {
  const v = (value || '').trim();
  return v ? `"${v}"` : '';
}

/**
 * Build a methodical, ordered directory of external research sources with links
 * pre-filled for the given target. Ordered as a real research workflow.
 */
export function buildSourceDirectory(target: SourceDirectoryTarget): SourceCategory[] {
  const label = (target.label || '').trim();
  const domain = (target.domain || '').replace(/^https?:\/\//i, '').split('/')[0].trim();
  const regionText = target.region?.location?.trim() || '';
  const q = enc(label);
  const qDomain = enc(domain);
  const qExact = enc(quoted(label));
  const qRegion = enc([label, regionText].filter(Boolean).join(' '));
  const isPerson = target.type === 'person';

  const registries: SourceCategory = {
    id: 'registries',
    title: '1 · Official registries & filings',
    blurb: 'Start with the primary record — who legally owns it, when it formed, and whether it is still active.',
    sources: [
      {
        name: 'OpenCorporates',
        url: `https://opencorporates.com/companies?q=${q}`,
        description: 'Largest open database of company registrations worldwide — officers, status, jurisdiction.',
        access: 'free',
      },
      {
        name: 'SEC EDGAR — company',
        url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${q}&type=&dateb=&owner=include&count=40`,
        description: 'US public-company filings: 10-K, 10-Q, 8-K, ownership, executive pay.',
        access: 'free',
      },
      {
        name: 'SEC EDGAR — full text',
        url: `https://www.sec.gov/edgar/search/#/q=${qExact}`,
        description: 'Full-text search across all EDGAR filings for any mention of the target.',
        access: 'free',
      },
      {
        name: 'US state SoS lookup (Google)',
        url: `https://www.google.com/search?q=${qRegion}+site%3A*.gov+%22business+entity%22+OR+%22registered+agent%22`,
        description: 'Find the Secretary of State business entity record for the incorporating state.',
        access: 'free',
      },
      {
        name: 'Florida Sunbiz',
        url: `https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?searchNameOrder=${q}&searchTerm=${q}`,
        description: 'Florida corporate registry — officers, status (active/dissolved), filing history.',
        access: 'free',
      },
      {
        name: 'UK Companies House',
        url: `https://find-and-update.company-information.service.gov.uk/search?q=${q}`,
        description: 'UK registry — directors, accounts, charges, and full filing history (free).',
        access: 'free',
      },
      {
        name: 'GLEIF (LEI lookup)',
        url: `https://search.gleif.org/#/search/simpleSearch=${q}`,
        description: 'Legal Entity Identifier — corporate hierarchy, parent/child ownership links.',
        access: 'free',
      },
      {
        name: 'Dun & Bradstreet',
        url: `https://www.dnb.com/business-directory/company-search.html?term=${q}`,
        description: 'D-U-N-S number, firmographics, corporate family tree.',
        access: 'signin',
        accessTip: 'Basic company profile and D-U-N-S lookup are free. Full credit reports are paid — free via a library card (D&B Hoovers).',
      },
    ],
  };

  const profile: SourceCategory = {
    id: 'profile',
    title: '2 · Business profile & financials',
    blurb: 'Size, funding, revenue estimates, competitors and the money story.',
    sources: [
      {
        name: 'Crunchbase',
        url: `https://www.crunchbase.com/textsearch?q=${q}`,
        description: 'Funding rounds, investors, acquisitions, headcount, key people.',
        access: 'signin',
        accessTip: 'A free account unlocks basic profiles. Paywalled detail is often mirrored on the company Wikipedia + press releases.',
      },
      {
        name: 'PitchBook',
        url: `https://pitchbook.com/profiles/search?q=${q}`,
        description: 'Deep private-market financials, valuations, cap tables.',
        access: 'paid',
        accessTip: 'Paid only. Request a free trial/demo, or use a university/library subscription. Much of the data also appears in Crunchbase + news.',
      },
      {
        name: 'Owler',
        url: `https://www.owler.com/company/search?q=${q}`,
        description: 'Revenue estimates, competitors, CEO rating, recent news.',
        access: 'signin',
        accessTip: 'Free account gives estimates and competitor lists.',
      },
      {
        name: 'Craft.co',
        url: `https://craft.co/search?q=${q}`,
        description: 'Company overview, employees, locations, supply-chain signals.',
        access: 'signin',
        accessTip: 'Free tier covers the overview and org basics.',
      },
      {
        name: 'ZoomInfo',
        url: `https://www.zoominfo.com/s/#!search/company/${q}`,
        description: 'Firmographics, org chart, direct-dial contacts, tech spend.',
        access: 'paid',
        accessTip: 'Paid. The free "Community Edition" grants credits if you contribute. Contact data also lives in Apollo/RocketReach (free tiers).',
      },
      {
        name: 'Wikipedia',
        url: `https://en.wikipedia.org/w/index.php?search=${q}`,
        description: 'Neutral summary with sourced history, leadership and controversies.',
        access: 'free',
      },
    ],
  };

  const people: SourceCategory = {
    id: 'people',
    title: isPerson ? '3 · Person & identity' : '3 · Leadership & people',
    blurb: isPerson
      ? 'Confirm who the person is, where they work, and their public footprint.'
      : 'Find the executives, hiring signals, and who really runs it.',
    sources: [
      {
        name: 'LinkedIn — people',
        url: `https://www.linkedin.com/search/results/people/?keywords=${q}`,
        description: isPerson ? 'The person’s profile, work history, and connections.' : 'Employees and leadership by name/title.',
        access: 'signin',
        accessTip: 'A free LinkedIn account is enough. To read a profile without logging in, open the Google cache of the /in/ URL.',
      },
      {
        name: 'LinkedIn — company',
        url: `https://www.linkedin.com/search/results/companies/?keywords=${q}`,
        description: 'Official company page — headcount trend, offices, updates.',
        access: 'signin',
        accessTip: 'Free account. Headcount growth is a strong health signal.',
      },
      {
        name: 'RocketReach',
        url: `https://rocketreach.co/search?start=1&keyword=${q}`,
        description: 'Verified work emails and phone numbers for staff.',
        access: 'signin',
        accessTip: 'Free tier gives a few lookups/month. Also try Hunter.io and Apollo free tiers.',
      },
      {
        name: 'Hunter.io',
        url: `https://hunter.io/search/${qDomain || q}`,
        description: 'Email address pattern and known addresses for a domain.',
        access: 'signin',
        accessTip: 'Free account = ~25 searches/month. Reveals the company email format (first.last@, etc.).',
      },
      {
        name: 'Apollo.io',
        url: `https://app.apollo.io/#/companies?qKeywords=${q}`,
        description: 'Contact database with titles, emails and org charts.',
        access: 'signin',
        accessTip: 'Free plan includes monthly contact credits.',
      },
    ],
  };

  const legal: SourceCategory = {
    id: 'legal',
    title: '4 · Legal, court & regulatory',
    blurb: 'Lawsuits, judgments, liens, sanctions and government contracts reveal risk.',
    sources: [
      {
        name: 'CourtListener / RECAP',
        url: `https://www.courtlistener.com/?q=${qExact}`,
        description: 'Free US federal & state court opinions and PACER dockets.',
        access: 'free',
      },
      {
        name: 'PACER',
        url: `https://pacer.uscourts.gov/find-case`,
        description: 'Authoritative US federal court records (dockets & filings).',
        access: 'paid',
        accessTip: '$0.10/page but fees are waived if you owe under $30/quarter — effectively free for light use. Check CourtListener first (it mirrors PACER free).',
      },
      {
        name: 'OFAC / sanctions search',
        url: `https://sanctionssearch.ofac.treas.gov/`,
        description: 'US Treasury sanctions & blocked-persons list.',
        access: 'free',
      },
      {
        name: 'SAM.gov',
        url: `https://sam.gov/search/?keywords=${q}`,
        description: 'US federal contractor registration, exclusions/debarment.',
        access: 'free',
      },
      {
        name: 'USAspending.gov',
        url: `https://www.usaspending.gov/search`,
        description: 'Every federal contract & grant a company has received.',
        access: 'free',
      },
      {
        name: 'USPTO trademarks',
        url: `https://tmsearch.uspto.gov/search/search-information?query=${q}`,
        description: 'Brands, trademarks and their owners.',
        access: 'free',
      },
      {
        name: 'Google Patents',
        url: `https://patents.google.com/?assignee=${q}`,
        description: 'Patents assigned to the company — signals R&D and tech.',
        access: 'free',
      },
    ],
  };

  const news: SourceCategory = {
    id: 'news',
    title: '5 · News, reviews & reputation',
    blurb: 'What the press, customers and employees say — and where the skeletons are.',
    sources: [
      {
        name: 'Google News',
        url: `https://news.google.com/search?q=${qExact}`,
        description: 'Recent and historical press coverage.',
        access: 'free',
      },
      {
        name: 'Google (exact + negative)',
        url: `https://www.google.com/search?q=${qExact}+%28lawsuit+OR+fraud+OR+scam+OR+complaint+OR+layoffs%29`,
        description: 'Targeted search for controversy, layoffs, and complaints.',
        access: 'free',
      },
      {
        name: 'Better Business Bureau',
        url: `https://www.bbb.org/search?find_text=${q}`,
        description: 'Accreditation, rating, and consumer complaints.',
        access: 'free',
      },
      {
        name: 'Trustpilot',
        url: `https://www.trustpilot.com/search?query=${q}`,
        description: 'Customer reviews and response behaviour.',
        access: 'free',
      },
      {
        name: 'Glassdoor',
        url: `https://www.glassdoor.com/Search/results.htm?keyword=${q}`,
        description: 'Employee reviews, salaries, interview and culture signals.',
        access: 'signin',
        accessTip: 'Free account (or post one review) to read more. Reviews are also cached by Google — search the company + "glassdoor".',
      },
      {
        name: 'Indeed reviews',
        url: `https://www.indeed.com/companies/search?q=${q}`,
        description: 'Second source of employee sentiment.',
        access: 'free',
      },
      {
        name: 'Reddit',
        url: `https://www.google.com/search?q=site%3Areddit.com+${qExact}`,
        description: 'Candid discussion, customer/insider chatter.',
        access: 'free',
      },
    ],
  };

  const technical: SourceCategory = {
    id: 'technical',
    title: '6 · Technical footprint & security',
    blurb: 'Infrastructure, tech stack, exposed assets and breach exposure.',
    sources: [
      {
        name: 'BuiltWith',
        url: `https://builtwith.com/${qDomain || q}`,
        description: 'Full technology profile of the website.',
        access: 'free',
        accessTip: 'Overview is free; historical tech and lead lists are paid.',
      },
      {
        name: 'Wappalyzer',
        url: `https://www.wappalyzer.com/lookup/${qDomain || q}`,
        description: 'CMS, frameworks, analytics and ad tech in use.',
        access: 'free',
      },
      {
        name: 'DNSDumpster',
        url: `https://dnsdumpster.com/`,
        description: 'DNS/host mapping and subdomain discovery.',
        access: 'free',
        accessTip: `Enter ${domain || 'the domain'} to map hosts and subdomains.`,
      },
      {
        name: 'SecurityTrails',
        url: `https://securitytrails.com/list/apex_domain/${qDomain || q}`,
        description: 'Historical DNS, subdomains and associated domains.',
        access: 'signin',
        accessTip: 'Free account unlocks history and more subdomains.',
      },
      {
        name: 'Shodan',
        url: `https://www.shodan.io/search?query=${qDomain || q}`,
        description: 'Internet-exposed servers, ports and services.',
        access: 'signin',
        accessTip: 'Free account for basic results; filters need a membership. Try Censys as a free alternative.',
      },
      {
        name: 'Censys',
        url: `https://search.censys.io/search?resource=hosts&q=${qDomain || q}`,
        description: 'Hosts, certificates and exposed services.',
        access: 'signin',
        accessTip: 'Free account covers most lookups.',
      },
      {
        name: 'VirusTotal',
        url: `https://www.virustotal.com/gui/domain/${qDomain || q}`,
        description: 'Domain reputation, resolutions, related files/URLs.',
        access: 'free',
      },
      {
        name: 'Have I Been Pwned',
        url: `https://haveibeenpwned.com/DomainSearch`,
        description: 'Whether the domain appears in known data breaches.',
        access: 'free',
      },
    ],
  };

  const archives: SourceCategory = {
    id: 'archives',
    title: '7 · History & archives',
    blurb: 'What the site used to say, what was deleted, and older snapshots.',
    sources: [
      {
        name: 'Wayback Machine',
        url: `https://web.archive.org/web/*/${domain || label}`,
        description: 'Full snapshot history of the website over time.',
        access: 'free',
      },
      {
        name: 'archive.today',
        url: `https://archive.ph/${domain || label}`,
        description: 'Independent page archive — captures things Wayback misses.',
        access: 'free',
      },
      {
        name: 'Google cache (site:)',
        url: `https://www.google.com/search?q=site%3A${qDomain || q}`,
        description: 'Everything Google has indexed on the domain.',
        access: 'free',
      },
      {
        name: 'CommonCrawl / URLScan',
        url: `https://urlscan.io/search/#${qDomain || q}`,
        description: 'Historical scans and screenshots of pages on the domain.',
        access: 'free',
      },
    ],
  };

  // People target: registries/financials are less relevant — lead with identity.
  if (isPerson) {
    return [people, news, technical, archives, legal];
  }

  return [registries, profile, people, legal, news, technical, archives];
}
