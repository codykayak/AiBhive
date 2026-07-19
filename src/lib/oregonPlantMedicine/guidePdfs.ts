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
  {
    id: 'oregon-entheogen-botany-dmt-plants',
    title: 'PNW Entheogen Botany — DMT-Related Plants',
    subtitle: 'Botanical & legal reference only · No extraction chemistry',
    description:
      'Covers reed canary grass and other plants discussed in entheogen literature as they relate to western Oregon wetlands — identification, variable alkaloid chemistry, legal status, and why extraction guides are excluded.',
    pdfUrl: '/oregon-plant-medicine/guides/oregon-entheogen-botany-dmt-plants.pdf',
    pages: '~5 pages',
    topics: ['Phalaris arundinacea', 'Legal status', 'Ecology', 'Poison control'],
    scopeNote:
      'Does not include DMT extraction, concentration, or solvent procedures — manufacturing Schedule I substances is illegal and hazardous.',
  },
];
