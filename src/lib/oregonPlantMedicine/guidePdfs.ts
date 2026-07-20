export type OregonPlantPdfGuide = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  pdfUrl: string;
  pages: string;
  topics: string[];
  /** Why cultivation/extraction steps are intentionally omitted */
  scopeNote: string;
};

/** Plant library IDs that map to each PDF (educational cross-links only). */
export const PLANT_PDF_GUIDE_IDS: Record<string, string[]> = {
  'oregon-psilocybin-law-id-safety': [
    'psilocybe-cyanescens',
    'psilocybe-azurescens',
    'psilocybe-semilanceata',
    'psilocybe-allenii',
    'psilocybe-stuntzii',
    'psilocybe-baeocystis',
    'gymnopilus-spectabilis',
    'panaeolus-cinctulus',
    'amanita-muscaria',
    'amanita-pantherina',
  ],
};

export function getPdfGuidesForPlant(plantId: string): OregonPlantPdfGuide[] {
  return OREGON_PLANT_PDF_GUIDES.filter((g) => PLANT_PDF_GUIDE_IDS[g.id]?.includes(plantId));
}

export const OREGON_PLANT_PDF_GUIDES: OregonPlantPdfGuide[] = [
  {
    id: 'oregon-psilocybin-law-id-safety',
    title: 'Oregon Psilocybin — Law, Safety & Field ID',
    subtitle: 'Wild species near Eugene & Florence · Not a grow guide',
    description:
      'Extensive reference on Oregon Measure 109 licensed services, federal law, wild wood-lover identification (cyanescens, azurescens, liberty cap), deadly lookalikes, spore prints, and seasonality. Explains why Golden Teacher / B+ indoor strains do not apply to Oregon field foraging.',
    pdfUrl: '/oregon-plant-medicine/guides/oregon-psilocybin-law-id-safety.pdf',
    pages: '~8 pages',
    topics: ['Oregon law', 'Wild PNW species', 'Galerina lookalikes', 'Spore prints', 'Harm reduction'],
    scopeNote:
      'Does not include mushroom cultivation instructions — home grows remain federally illegal and are outside Oregon’s licensed service model.',
  },
];
