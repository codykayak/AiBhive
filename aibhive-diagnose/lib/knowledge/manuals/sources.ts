import type { TradePackId } from '@/lib/packs/types';

/** Where to find OEM PDFs quickly — mirrors server MANUAL_SOURCE_INDEX for offline use. */
export type ManualSourcePortal = {
  id: string;
  packId: TradePackId;
  brand: string;
  portalName: string;
  searchUrl: string;
  searchHint: string;
  modelExamples: string[];
};

export const MANUAL_SOURCE_PORTALS: ManualSourcePortal[] = [
  {
    id: 'src-pentair',
    packId: 'pool',
    brand: 'Pentair',
    portalName: 'Pentair Product Documentation',
    searchUrl: 'https://www.pentair.com/en-us/products/residential/pool-spa-equipment.html',
    searchHint: 'Search pump/heater model → Documents tab',
    modelExamples: ['011057', 'INTELLIFLO', '460736'],
  },
  {
    id: 'src-hayward',
    packId: 'pool',
    brand: 'Hayward',
    portalName: 'Hayward Owner & Service Manuals',
    searchUrl: 'https://www.hayward.com/en-us/support/manuals',
    searchHint: 'Filter by category then model family',
    modelExamples: ['TRISTAR', 'SP3202', 'AQUARITE'],
  },
  {
    id: 'src-jandy',
    packId: 'pool',
    brand: 'Jandy',
    portalName: 'Jandy Literature',
    searchUrl: 'https://www.jandy.com/en/support',
    searchHint: 'Automation and heater literature',
    modelExamples: ['IAQUALINK', 'RS'],
  },
  {
    id: 'src-carrier',
    packId: 'hvac',
    brand: 'Carrier / Bryant',
    portalName: 'Carrier Technical Literature',
    searchUrl: 'https://www.carrier.com/residential/en/us/products/',
    searchHint: 'Outdoor unit label → literature PDFs',
    modelExamples: ['24ACC', '58MCA'],
  },
  {
    id: 'src-trane',
    packId: 'hvac',
    brand: 'Trane',
    portalName: 'Trane Residential Literature',
    searchUrl: 'https://www.trane.com/residential/en/resources/',
    searchHint: 'Condenser nameplate model search',
    modelExamples: ['4TTR', 'TEM6'],
  },
  {
    id: 'src-lennox',
    packId: 'hvac',
    brand: 'Lennox',
    portalName: 'Lennox Product Literature',
    searchUrl: 'https://www.lennox.com/resources/',
    searchHint: 'Literature finder by model/serial',
    modelExamples: ['XC16', 'EL296'],
  },
  {
    id: 'src-goodman',
    packId: 'hvac',
    brand: 'Goodman / Amana',
    portalName: 'Goodman Technical Support',
    searchUrl: 'https://www.goodmanmfg.com/resources',
    searchHint: 'Install & service manuals by prefix',
    modelExamples: ['GMEC', 'ARUF'],
  },
  {
    id: 'src-rinnai',
    packId: 'plumbing',
    brand: 'Rinnai',
    portalName: 'Rinnai Technical Documents',
    searchUrl: 'https://www.rinnai.us/technical-documents',
    searchHint: 'Tankless sticker model number',
    modelExamples: ['RU199', 'RU160'],
  },
  {
    id: 'src-navien',
    packId: 'plumbing',
    brand: 'Navien',
    portalName: 'Navien Technical Library',
    searchUrl: 'https://www.navieninc.com/support',
    searchHint: 'NPE/NPN service PDFs',
    modelExamples: ['NPE-180', 'NPN'],
  },
  {
    id: 'src-watts',
    packId: 'plumbing',
    brand: 'Watts',
    portalName: 'Watts Literature',
    searchUrl: 'https://www.watts.com/resources/literature',
    searchHint: 'RPZ/PRV tag model',
    modelExamples: ['009', 'LF009'],
  },
  {
    id: 'src-sqd',
    packId: 'electrical',
    brand: 'Square D',
    portalName: 'Schneider Download Center',
    searchUrl: 'https://www.se.com/us/en/download/',
    searchHint: 'Breaker/panel catalog number',
    modelExamples: ['QO', 'HOM'],
  },
  {
    id: 'src-eaton',
    packId: 'electrical',
    brand: 'Eaton',
    portalName: 'Eaton Documentation',
    searchUrl: 'https://www.eaton.com/us/en-us/support/documentation.html',
    searchHint: 'CH/BR catalog numbers',
    modelExamples: ['CH130', 'BR2020'],
  },
  {
    id: 'src-whirlpool',
    packId: 'property',
    brand: 'Whirlpool',
    portalName: 'Whirlpool Manuals',
    searchUrl: 'https://www.whirlpool.com/support/manuals.html',
    searchHint: 'Tag inside door/frame',
    modelExamples: ['WTW', 'MVWB'],
  },
  {
    id: 'src-lg',
    packId: 'property',
    brand: 'LG',
    portalName: 'LG Manuals',
    searchUrl: 'https://www.lg.com/us/support/manuals-documents',
    searchHint: 'Sticker model + serial',
    modelExamples: ['WM', 'LFX'],
  },
  {
    id: 'src-samsung',
    packId: 'property',
    brand: 'Samsung',
    portalName: 'Samsung Download Center',
    searchUrl: 'https://www.samsung.com/us/support/downloads/',
    searchHint: 'Label model code',
    modelExamples: ['WF45', 'RF28'],
  },
  {
    id: 'src-ge',
    packId: 'property',
    brand: 'GE Appliances',
    portalName: 'GE Manuals & Specs',
    searchUrl: 'https://www.geappliances.com/ge/service-and-support/manuals.htm',
    searchHint: 'Service manuals for techs',
    modelExamples: ['GFE', 'GDT'],
  },
];

export function filterManualSources(packId?: TradePackId): ManualSourcePortal[] {
  if (!packId) return MANUAL_SOURCE_PORTALS;
  return MANUAL_SOURCE_PORTALS.filter((s) => s.packId === packId);
}
