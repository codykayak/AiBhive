export const RV_HERO_STATS = [
  { label: 'Avg. time on lot', value: '47%', detail: 'of shoppers leave without talking to sales' },
  { label: 'Tow mismatch returns', value: '1 in 8', detail: 'buyers discover tow limits after purchase' },
  { label: 'After-hours traffic', value: '38%', detail: 'of RV searches happen outside store hours' },
] as const;

export const RV_HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Connect inventory',
    body:
      'Pull units from IDS, Lightspeed, CSV/XML feeds, or your website plugin. We normalize hitch weight, sleeps, length, and price bands.',
  },
  {
    step: '02',
    title: 'Embed the shopper AI',
    body:
      'One line iframe or script on every rooftop site. Shoppers chat in plain language — budget per month or total, tow capacity, lifestyle.',
  },
  {
    step: '03',
    title: 'Route qualified leads',
    body:
      'Matches sync to CRM with transcript, fit score, and recommended stock numbers. BDC gets warm handoffs, not cold form fills.',
  },
] as const;

export const RV_PERSONAS = [
  {
    title: 'National wholesaler / group',
    points: [
      'One AI playbook across dozens of rooftops',
      'Central compliance on disclosures and pricing language',
      'Roll up match analytics by region and brand',
    ],
  },
  {
    title: 'Franchise mega-dealer',
    points: [
      'Camping World–scale consistency without rebuilding search',
      'Motorhome vs towable branching in one conversation',
      'F&I-friendly monthly payment framing',
    ],
  },
  {
    title: 'Independent lot',
    points: [
      'Lot Wizard or manual CSV — no enterprise IT project',
      'Compete on guidance, not just lowest price',
      'After-hours lead capture while the lot is closed',
    ],
  },
] as const;

export const RV_PACKAGES = [
  {
    name: 'Pilot',
    price: 'Custom',
    blurb: 'Single rooftop, demo inventory or feed, branded embed, email lead export.',
    features: ['Camping World–style demo or your feed', 'iframe embed + AiBhive host', 'Match API + basic analytics'],
  },
  {
    name: 'Dealer group',
    price: 'Custom',
    blurb: 'Multi-store, DMS field mapping, CRM webhook, SSO for admins.',
    features: ['IDS / Lightspeed / CDK mapping', 'Per-store inventory rules', 'BDC handoff + transcripts'],
    highlighted: true,
  },
  {
    name: 'Wholesale / OEM',
    price: 'Enterprise',
    blurb: 'Allocation data, dealer locator, co-op marketing widgets for partner sites.',
    features: ['OEM spec enrichment', 'Wholesale buyer portals', 'Dedicated success engineer'],
  },
] as const;

export const RV_FAQ = [
  {
    q: 'Is the Camping World demo real inventory?',
    a: 'No. It is representative floor stock for UX testing only. We are not affiliated with Camping World. Production connects to your live feed or DMS export.',
  },
  {
    q: 'How does towing math work?',
    a: 'Each unit carries minimum tow capacity, hitch/pin weight, and dry weight. The AI excludes unsafe matches and explains payload in shopper language.',
  },
  {
    q: 'Monthly payment vs total price?',
    a: 'Shoppers pick how they budget. Filters and the model respect est. monthly payment or MSRP caps you configure per dealer.',
  },
  {
    q: 'What DMS systems do you support first?',
    a: 'We prioritize IDS Astra G2 and Lightspeed RV based on market share, then CSV/XML feeds for faster pilots. CDK and DealerSocket are on the enterprise roadmap.',
  },
  {
    q: 'Can we white-label the widget?',
    a: 'Yes — colors, logo, disclosure footer, and “powered by” toggle. Embed can sit in your existing inventory search page.',
  },
  {
    q: 'Where do leads go?',
    a: 'Email, webhook, or CRM push (Lightspeed/DealerSocket patterns). Every match includes fit score and recommended unit IDs.',
  },
] as const;

export const RV_EMBED_SCRIPT_SNIPPET = `(function(){
  var i=document.createElement('iframe');
  i.src='https://aibhive.com/rv/embed?dealer=YOUR_ID';
  i.title='RV match assistant';
  i.style.cssText='width:100%;min-height:640px;border:0;border-radius:16px';
  document.getElementById('aibhive-rv').appendChild(i);
})();`;
