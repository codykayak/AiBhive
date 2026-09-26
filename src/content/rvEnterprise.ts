export type RvDmsIntegration = {
  id: string;
  name: string;
  category: 'dms' | 'inventory-feed' | 'crm' | 'website';
  summary: string;
  aiBhiveRole: string;
};

/** Common RV retail / wholesale systems — for enterprise positioning (not endorsements). */
export const RV_DEALER_SYSTEMS: RvDmsIntegration[] = [
  {
    id: 'ids-astra',
    name: 'IDS Astra G2',
    category: 'dms',
    summary:
      'Purpose-built DMS for RV and marine dealers — sales, service, parts, accounting, and CRM on one platform with mobile service workflows.',
    aiBhiveRole:
      'Sync unit specs (GVWR, hitch weight, floorplan), pricing bands, and availability into the shopper AI layer via scheduled exports or API.',
  },
  {
    id: 'lightspeed-rv',
    name: 'Lightspeed DMS (RV)',
    category: 'dms',
    summary:
      'All-in-one RV dealership software spanning inventory, F&I, parts, service bays, and lead CRM — widely used across multi-store groups.',
    aiBhiveRole:
      'Map stock numbers to AI match results, push qualified leads back into Lightspeed CRM with conversation transcripts.',
  },
  {
    id: 'cdk',
    name: 'CDK Global',
    category: 'dms',
    summary: 'Enterprise dealer platform used by large auto and RV groups for DMS, digital retail, and fixed ops.',
    aiBhiveRole:
      'Enterprise SSO, role-based admin for AI widget config, and inventory feeds at group scale.',
  },
  {
    id: 'dealersocket',
    name: 'DealerSocket / Solera',
    category: 'crm',
    summary: 'CRM and digital marketing stack many RV groups pair with their DMS for lead routing and follow-up.',
    aiBhiveRole:
      'Attach AI-qualified shoppers to existing lead records; hand off to BDC when budget and tow fit are confirmed.',
  },
  {
    id: 'lot-wizard',
    name: 'Lot Wizard Pro',
    category: 'inventory-feed',
    summary: 'Cloud lot management and website inventory feeds common on independent lots (often auto-first; verify RV field mapping).',
    aiBhiveRole:
      'Ingest CSV/XML inventory feeds to refresh embeddable AI without manual SKU entry.',
  },
  {
    id: 'rvws',
    name: 'RV Web Services / dealer website CMS',
    category: 'website',
    summary: 'Third-party site builders and inventory plugins that power many dealership .com listings.',
    aiBhiveRole:
      'Drop-in script or iframe embed (`/rv/embed`) beside existing search — same look-and-feel via CSS variables.',
  },
  {
    id: 'oem-portals',
    name: 'OEM order & VIN portals',
    category: 'inventory-feed',
    summary: 'Manufacturer pipelines (Jayco, Forest River, Winnebago, etc.) for build specs and allocations.',
    aiBhiveRole:
      'Enrich AI answers with OEM floorplan data and towing guides when DMS fields are sparse.',
  },
  {
    id: 'rollick',
    name: 'Rollick / ARI',
    category: 'crm',
    summary: 'Digital retail and lead programs common in powersports and RV adjacent verticals.',
    aiBhiveRole: 'Optional lead syndication for OEM co-op campaigns tied to match events.',
  },
  {
    id: 'rv-trader-feed',
    name: 'Marketplace & aggregator feeds',
    category: 'inventory-feed',
    summary: 'RV Trader–style listing exports and third-party syndication many dealers already maintain.',
    aiBhiveRole: 'Secondary inventory sync when DMS API access is delayed on pilot timeline.',
  },
];

export const RV_ENTERPRISE_BULLETS = [
  'Wholesale & multi-rooftop groups keep one DMS; AiBhive layers a consistent shopper AI on every branded site.',
  'Match logic respects real hitch weight, pin weight, and payload — not just MSRP filters.',
  'Monthly payment *or* out-the-door budget — shopper chooses how they think about money.',
  'Admin dashboard (roadmap): tune inventory source, disclosure text, and hand-off email per dealer group.',
];
