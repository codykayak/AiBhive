import { hasStoredDisclaimer, storeDisclaimerAcceptance } from './disclaimerStorage';

export const HERBS_DISCLAIMER_VERSION = 'v1';

export const HERBS_DISCLAIMER_STORAGE_KEY = 'living_knowledge_herbs_disclaimer_v1';

export const HERBS_DISCLAIMER_TITLE = 'Educational use only — not medical advice';

export const HERBS_DISCLAIMER_SECTIONS = [
  {
    heading: 'Not a substitute for licensed care',
    body:
      'The Herbs library is for education and personal research only. It does not diagnose, treat, cure, or prevent disease. Work with a qualified physician, naturopath, licensed acupuncturist, or clinical herbalist — especially if pregnant, nursing, on prescription drugs, or managing chronic illness.',
  },
  {
    heading: 'Drug & herb interactions',
    body:
      'Many herbs alter medication levels (St. John\'s wort, licorice, berberine-containing plants). Never combine new herbs with blood thinners, transplant drugs, chemotherapy, or psychiatric medications without professional review.',
  },
  {
    heading: 'TCM & Ayurveda context',
    body:
      'Traditional pattern diagnosis matters — summaries here are not individualized prescriptions. Chinese and Ayurvedic herbs are often used in formulas, not as single-herb cures.',
  },
  {
    heading: 'Wildcrafting & identification',
    body:
      'Field identification errors can be fatal. Use the plant library for wild species; do not harvest without expert confirmation and land permission.',
  },
  {
    heading: 'Community contributions',
    body:
      'User posts are not verified by licensed practitioners. By continuing, you agree to use this content at your own risk.',
  },
] as const;

export function hasAcceptedHerbsDisclaimer(uid?: string | null): boolean {
  return hasStoredDisclaimer(HERBS_DISCLAIMER_STORAGE_KEY, HERBS_DISCLAIMER_VERSION, uid);
}

export function acceptHerbsDisclaimer(uid?: string | null): void {
  storeDisclaimerAcceptance(HERBS_DISCLAIMER_STORAGE_KEY, HERBS_DISCLAIMER_VERSION, uid);
}
