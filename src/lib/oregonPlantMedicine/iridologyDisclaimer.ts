import { hasStoredDisclaimer, storeDisclaimerAcceptance } from './disclaimerStorage';

export const IRIDOLOGY_DISCLAIMER_VERSION = 'v1';

export const IRIDOLOGY_DISCLAIMER_STORAGE_KEY = 'living_knowledge_iridology_disclaimer_v1';

export const IRIDOLOGY_DISCLAIMER_TITLE = 'Educational iridology only — not medical diagnosis';

export const IRIDOLOGY_DISCLAIMER_SECTIONS = [
  {
    heading: 'Not a medical diagnosis',
    body:
      'AI iris analysis in AiBhivePlants is for educational exploration of traditional iridology frameworks only. It does not diagnose, treat, cure, or prevent any disease. Iridology is not accepted as validated clinical science by mainstream medicine. Never use iris readings to delay emergency care or replace exams by a licensed physician.',
  },
  {
    heading: 'Photo limitations',
    body:
      'Camera photos, lighting, and compression limit what can be seen. AI may miss or misread signs. A clear retake in natural light is often required. Contact lenses, surgery, and eye disease change iris appearance.',
  },
  {
    heading: 'Serious symptoms',
    body:
      'Chest pain, stroke signs, severe infection, pregnancy complications, or any urgent symptom requires immediate medical care — not iridology interpretation.',
  },
  {
    heading: 'Hive Research & credits',
    body:
      'Photo analysis uses Hive Research (Grok vision) and Bhive Credits unless you are on a local dev or admin-exempt account. Results are probabilistic tendencies in iridology literature, not prescriptions.',
  },
  {
    heading: 'App store & liability',
    body:
      'This feature is reference and educational software similar to a wellness encyclopedia. By continuing, you agree to use it at your own risk and hold AiBhive harmless for health decisions based on AI iridology output.',
  },
] as const;

export function hasAcceptedIridologyDisclaimer(uid?: string | null): boolean {
  return hasStoredDisclaimer(IRIDOLOGY_DISCLAIMER_STORAGE_KEY, IRIDOLOGY_DISCLAIMER_VERSION, uid);
}

export function acceptIridologyDisclaimer(uid?: string | null): void {
  storeDisclaimerAcceptance(IRIDOLOGY_DISCLAIMER_STORAGE_KEY, IRIDOLOGY_DISCLAIMER_VERSION, uid);
}
