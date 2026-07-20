export const HOLISTIC_DISCLAIMER_VERSION = 'v1';

export const HOLISTIC_DISCLAIMER_STORAGE_KEY = 'living_knowledge_holistic_disclaimer_v1';

export const HOLISTIC_DISCLAIMER_TITLE = 'Educational use only — not medical advice';

export const HOLISTIC_DISCLAIMER_SECTIONS = [
  {
    heading: 'Not a substitute for professional care',
    body:
      'Living Knowledge Holistic Remedies and Protocols is for education and personal research only. It does not diagnose, treat, cure, or prevent any disease. Always work with a qualified physician, naturopath, or licensed provider — especially if you are pregnant, nursing, on prescription medications, or managing a chronic condition.',
  },
  {
    heading: 'Wild plants & mushrooms',
    body:
      'Never ingest a wild plant or mushroom without 100% identification. Toxic look-alikes exist. Oregon Poison Center / California Poison Control: 1-800-222-1222.',
  },
  {
    heading: 'Detox & cleansing protocols',
    body:
      'Aggressive chelation, high-dose supplements, prolonged fasting, and parasite protocols can cause serious harm without supervision. Summaries here describe what communities and historical sources discuss — not instructions to self-treat.',
  },
  {
    heading: 'Edgar Cayce & traditional sources',
    body:
      'Cayce-related entries are brief summaries with reading references where applicable. They are not reproduced verbatim from copyrighted archives. For full readings, consult the Association for Research and Enlightenment (A.R.E.) and licensed practitioners.',
  },
  {
    heading: 'Google Play & app stores',
    body:
      'This app provides reference information similar to a field guide or encyclopedia. It does not offer telemedicine, prescription services, or individualized treatment plans. By continuing, you agree to use the content at your own risk and hold AiBhive harmless for decisions made from educational material.',
  },
] as const;

export function hasAcceptedHolisticDisclaimer(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(HOLISTIC_DISCLAIMER_STORAGE_KEY) === HOLISTIC_DISCLAIMER_VERSION;
  } catch {
    return false;
  }
}

export function acceptHolisticDisclaimer(): void {
  localStorage.setItem(HOLISTIC_DISCLAIMER_STORAGE_KEY, HOLISTIC_DISCLAIMER_VERSION);
}
