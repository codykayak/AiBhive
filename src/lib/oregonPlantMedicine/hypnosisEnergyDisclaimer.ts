import { hasStoredDisclaimer, storeDisclaimerAcceptance } from './disclaimerStorage';

export const HYPNOSIS_ENERGY_DISCLAIMER_VERSION = 'v1';

export const HYPNOSIS_ENERGY_DISCLAIMER_STORAGE_KEY = 'living_knowledge_hypnosis_energy_disclaimer_v1';

export const HYPNOSIS_ENERGY_DISCLAIMER_TITLE = 'Educational use only — not therapy or medical care';

export const HYPNOSIS_ENERGY_DISCLAIMER_SECTIONS = [
  {
    heading: 'Not a substitute for licensed care',
    body:
      'Hypnosis and Energy is for education and personal research only. It does not provide hypnosis sessions, energy healing treatments, diagnosis, or medical advice. Work with a licensed mental health professional, physician, or certified practitioner — especially if you have trauma history, psychosis, epilepsy, or are in crisis.',
  },
  {
    heading: 'Regression & altered states',
    body:
      'Past-life and deep regression work can surface intense emotions or false memories. Reputable practitioners screen clients, work slowly, and integrate experiences with grounded support. Never attempt deep trance work alone from a book or recording without professional guidance.',
  },
  {
    heading: 'Energy work & sound',
    body:
      'Reiki, tuning forks, singing bowls, and frequency playlists are complementary wellness practices discussed in many communities — not proven cures. Avoid claims that specific Hz tones replace antibiotics, chemotherapy, or psychiatric medication.',
  },
  {
    heading: 'Edgar Cayce & Dolores Cannon',
    body:
      'Summaries reference public teachings and practitioner literature. They are not verbatim reproductions of copyrighted archives. For full Cayce readings, consult A.R.E. For QHHT, seek certified practitioners through official channels.',
  },
  {
    heading: 'Google Play & app stores',
    body:
      'This app is a reference library similar to an encyclopedia. It does not offer telehealth, prescription services, or individualized treatment plans. By continuing, you agree to use the content at your own risk and hold AiBhive harmless for decisions made from educational material.',
  },
] as const;

export function hasAcceptedHypnosisEnergyDisclaimer(uid?: string | null): boolean {
  return hasStoredDisclaimer(HYPNOSIS_ENERGY_DISCLAIMER_STORAGE_KEY, HYPNOSIS_ENERGY_DISCLAIMER_VERSION, uid);
}

export function acceptHypnosisEnergyDisclaimer(uid?: string | null): void {
  storeDisclaimerAcceptance(HYPNOSIS_ENERGY_DISCLAIMER_STORAGE_KEY, HYPNOSIS_ENERGY_DISCLAIMER_VERSION, uid);
}
