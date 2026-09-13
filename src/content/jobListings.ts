import { SITE_URL } from '../constants/site';

/** Posted date for Google JobPosting — keep in sync with visible copy. */
export const JOB_DATE_POSTED = '2026-09-12';
/** ISO 8601 expiration — refresh or take the page down when this passes. */
export const JOB_VALID_THROUGH = '2026-12-11T00:00';

export type JobSlug = 'aibhive' | 'manydoors' | 'macrorei';

export type JobCalculatorConfig = {
  dealLabel: string;
  dealMin: number;
  dealMax: number;
  dealStep: number;
  dealDefault: number;
  dealFormat: 'currency' | 'currencyMonthly';
  countLabel: string;
  countMin: number;
  countMax: number;
  countDefault: number;
  targetHint: string;
};

export type JobListing = {
  slug: JobSlug;
  productId: JobSlug;
  /** Google JobPosting title — job title only. */
  title: string;
  orgName: string;
  orgUrl: string;
  orgLogo: string;
  siteUrl: string;
  image: string;
  brandLogo: string | null;
  identifier: string;
  summary: string;
  role: string[];
  pay: string[];
  how: string[];
  calculator: JobCalculatorConfig;
  /** Annual contract multiplier for ManyDoors (monthly fee × 12). */
  dealAnnualMultiplier?: number;
};

export const COMMISSION_RATE = 0.25;
export const TARGET_MONTHLY_COMMISSION = 10000;

const PAY_SHARED = [
  '25% commission, flat, on every closed deal.',
  'At 20 hours per week, expected earnings are $10,000 this month.',
  '100% remote — work from anywhere in the United States.',
  'Commission-only. No base salary. Results vary with closes.',
];

export const JOB_LISTINGS: JobListing[] = [
  {
    slug: 'aibhive',
    productId: 'aibhive',
    title: 'AI Solutions Closer',
    orgName: 'AiBhive',
    orgUrl: 'https://aibhive.com',
    orgLogo: `${SITE_URL}/og-image.png`,
    siteUrl: 'https://aibhive.com',
    image: '/hiring/hive-brand.png',
    brandLogo: null,
    identifier: 'jobs-aibhive',
    summary:
      'Sell custom AI software solutions to any company that needs help. You pick the accounts. We build the agents, apps, and automations that solve their problems.',
    role: [
      'Call businesses and close custom AI services — lead gen, ops, phone systems, documents, or whatever they actually need.',
      'You are not locked to one vertical. Any company with a messy workflow is a prospect.',
      'We deliver the build. You open the door and close the deal.',
    ],
    pay: PAY_SHARED,
    how: [
      'This is a 100% remote role. Work from anywhere in the United States.',
      'About 20 hours per week, phone-first.',
      'Apply on this page: resume, a few sentences, and the best time to call.',
    ],
    calculator: {
      dealLabel: 'Average project size you close',
      dealMin: 15000,
      dealMax: 50000,
      dealStep: 1000,
      dealDefault: 25000,
      dealFormat: 'currency',
      countLabel: 'Projects closed per month',
      countMin: 0,
      countMax: 5,
      countDefault: 1,
      targetHint: 'Example: 1 project at $40,000 = $10,000 commission.',
    },
  },
  {
    slug: 'manydoors',
    productId: 'manydoors',
    title: 'Property Manager Closer',
    orgName: 'ManyDoors AI',
    orgUrl: 'https://www.manydoorsai.com',
    orgLogo: `${SITE_URL}/hiring/manydoors-software.png`,
    siteUrl: 'https://www.manydoorsai.com',
    image: '/hiring/manydoors-software.png',
    brandLogo: '/hiring/manydoors-logo.svg',
    identifier: 'jobs-manydoors',
    summary:
      'Call property managers and put ManyDoors AI on their portfolio. A few hundred dollars a month replaces chaos that costs them hundreds of thousands a year — sometimes millions.',
    role: [
      'Call property managers. Show the math: a few hundred bucks a month versus staff overtime, vacancy drag, and missed leasing.',
      'This is an easy sell when they see the savings. Software and apps for the office and the people in the field.',
      'You close. We onboard the portfolio.',
    ],
    pay: PAY_SHARED,
    how: [
      'This is a 100% remote role. Work from anywhere in the United States.',
      'About 20 hours per week, phone-first.',
      'Apply on this page: resume, a few sentences, and the best time to call.',
    ],
    dealAnnualMultiplier: 12,
    calculator: {
      dealLabel: 'Monthly software fee per portfolio',
      dealMin: 200,
      dealMax: 800,
      dealStep: 50,
      dealDefault: 400,
      dealFormat: 'currencyMonthly',
      countLabel: 'New portfolios closed per month',
      countMin: 0,
      countMax: 15,
      countDefault: 8,
      targetHint: 'Example: 8 portfolios at $400/mo (first-year value) ≈ $10,000 commission.',
    },
  },
  {
    slug: 'macrorei',
    productId: 'macrorei',
    title: 'Homeowner Appointment Setter',
    orgName: 'MacroREI',
    orgUrl: 'https://macrorei.com',
    orgLogo: `${SITE_URL}/hiring/macrorei-house.png`,
    siteUrl: 'https://macrorei.com',
    image: '/hiring/macrorei-house.png',
    brandLogo: null,
    identifier: 'jobs-macrorei',
    summary:
      'This is not a sales pitch job. You call homeowners with distressed properties from proven lists curated by a real estate investor who has done over 100 deals. Ask if they want to sell. Set the appointment.',
    role: [
      'Work a curated list — not random dialing. Distressed owners, already researched.',
      'You are not selling a product. You are asking if they want to sell their house and booking a call with the investor.',
      'Closes on this desk are appointments that turn into deals. Commission is 25% of each deal, same as the other seats.',
    ],
    pay: PAY_SHARED,
    how: [
      'This is a 100% remote role. Work from anywhere in the United States.',
      'About 20 hours per week, phone-first.',
      'Apply on this page: resume, a few sentences, and the best time to call.',
    ],
    calculator: {
      dealLabel: 'Average investor deal size (assignment / spread)',
      dealMin: 25000,
      dealMax: 40000,
      dealStep: 1000,
      dealDefault: 32000,
      dealFormat: 'currency',
      countLabel: 'Deals closed per month',
      countMin: 0,
      countMax: 4,
      countDefault: 1,
      targetHint: 'Example: 1 deal at $40,000 = $10,000 commission.',
    },
  },
];

export function dealValueForCommission(job: JobListing, dealSize: number): number {
  return dealSize * (job.dealAnnualMultiplier ?? 1);
}

export function monthlyCommission(job: JobListing, dealSize: number, count: number): number {
  return dealValueForCommission(job, dealSize) * count * COMMISSION_RATE;
}

export function jobBySlug(slug: string | undefined): JobListing | undefined {
  return JOB_LISTINGS.find((job) => job.slug === slug);
}

export function jobUrl(slug: JobSlug): string {
  return `${SITE_URL}/jobs/${slug}`;
}

function listHtml(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

/** HTML job description — must match visible copy on the listing page. */
export function jobDescriptionHtml(job: JobListing): string {
  return [
    `<p>${job.summary}</p>`,
    '<h2>The role</h2>',
    listHtml(job.role),
    '<h2>Pay</h2>',
    listHtml(job.pay),
    '<h2>How the work is done</h2>',
    listHtml(job.how),
  ].join('');
}

/** Standalone Google JobPosting JSON-LD (not nested in @graph). */
export function jobPostingJsonLd(job: JobListing): Record<string, unknown> {
  return {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: jobDescriptionHtml(job),
    identifier: {
      '@type': 'PropertyValue',
      name: job.orgName,
      value: job.identifier,
    },
    datePosted: JOB_DATE_POSTED,
    validThrough: JOB_VALID_THROUGH,
    employmentType: 'PART_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.orgName,
      sameAs: job.orgUrl,
      logo: job.orgLogo,
    },
    jobLocationType: 'TELECOMMUTE',
    applicantLocationRequirements: {
      '@type': 'Country',
      name: 'USA',
    },
    directApply: true,
    url: jobUrl(job.slug),
    workHours: '20 hours per week',
    incentiveCompensation: '25% commission, flat, on each closed deal. Expected $10,000 per month at 20 hours per week.',
  };
}
