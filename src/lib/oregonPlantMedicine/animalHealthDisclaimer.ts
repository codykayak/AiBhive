export const ANIMAL_HEALTH_DISCLAIMER_VERSION = 'v1';

export const ANIMAL_HEALTH_DISCLAIMER_STORAGE_KEY = 'living_knowledge_animal_health_disclaimer_v1';

export const ANIMAL_HEALTH_DISCLAIMER_TITLE = 'Educational use only — not veterinary advice';

export const ANIMAL_HEALTH_DISCLAIMER_SECTIONS = [
  {
    heading: 'Not a substitute for a licensed veterinarian',
    body:
      'Animal Health is for education and personal research only. It does not diagnose, treat, or prescribe for any animal. Always consult a licensed veterinarian — especially for emergencies, poisoning, difficulty breathing, collapse, or refusal to eat or drink for more than 24 hours.',
  },
  {
    heading: 'Herbs, essential oils & supplements',
    body:
      'Many plants and oils that are safe for humans are toxic to dogs, cats, or birds. Dosages differ by species and weight. Never apply undiluted essential oils or give human supplements without veterinary guidance.',
  },
  {
    heading: 'Livestock & food animals',
    body:
      'Withdrawal times, organic certification rules, and prescription dewormers are regulated. Educational summaries here are not herd health plans.',
  },
  {
    heading: 'Community contributions',
    body:
      'User comments and photos are not verified by veterinarians. Upvote helpful notes, but confirm with a professional before changing your animal\'s care.',
  },
  {
    heading: 'Google Play & app stores',
    body:
      'This app is a reference library. It does not offer tele-veterinary services. By continuing, you agree to use the content at your own risk and hold AiBhive harmless for decisions made from educational material.',
  },
] as const;

export function hasAcceptedAnimalHealthDisclaimer(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(ANIMAL_HEALTH_DISCLAIMER_STORAGE_KEY) === ANIMAL_HEALTH_DISCLAIMER_VERSION;
  } catch {
    return false;
  }
}

export function acceptAnimalHealthDisclaimer(): void {
  localStorage.setItem(ANIMAL_HEALTH_DISCLAIMER_STORAGE_KEY, ANIMAL_HEALTH_DISCLAIMER_VERSION);
}
