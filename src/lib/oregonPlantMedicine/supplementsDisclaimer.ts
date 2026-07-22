import { hasStoredDisclaimer, storeDisclaimerAcceptance } from './disclaimerStorage';

export const SUPPLEMENTS_DISCLAIMER_VERSION = 'v1';

export const SUPPLEMENTS_DISCLAIMER_STORAGE_KEY = 'living_knowledge_supplements_disclaimer_v1';

export const SUPPLEMENTS_DISCLAIMER_TITLE = 'Educational use only — not medical advice';

export const SUPPLEMENTS_DISCLAIMER_SECTIONS = [
  {
    heading: 'Supplements are not drugs',
    body:
      'Dietary supplements are not FDA-approved to treat disease. Labels may be inaccurate. This library is educational — not a prescribing guide. Always discuss new supplements with your physician or pharmacist.',
  },
  {
    heading: 'Dosing & quality',
    body:
      'More is not better — fat-soluble vitamins, iron, and zinc can cause toxicity. Choose third-party tested brands when possible. Stop and seek care for allergic reactions or unexpected symptoms.',
  },
  {
    heading: 'Surgery & emergencies',
    body:
      'Many supplements affect bleeding and anesthesia. Provide a full supplement list before surgery. Supplements do not replace emergency care — call 911 for chest pain, stroke symptoms, or severe reactions.',
  },
  {
    heading: 'Pregnancy & children',
    body:
      'Prenatal nutrition should follow obstetric guidance. Most supplements are not studied in pregnancy or pediatrics — do not dose children from adult articles.',
  },
  {
    heading: 'Community contributions',
    body:
      'User experiences in community posts are anecdotal, not evidence. By continuing, you agree to use this content at your own risk.',
  },
] as const;

export function hasAcceptedSupplementsDisclaimer(uid?: string | null): boolean {
  return hasStoredDisclaimer(SUPPLEMENTS_DISCLAIMER_STORAGE_KEY, SUPPLEMENTS_DISCLAIMER_VERSION, uid);
}

export function acceptSupplementsDisclaimer(uid?: string | null): void {
  storeDisclaimerAcceptance(SUPPLEMENTS_DISCLAIMER_STORAGE_KEY, SUPPLEMENTS_DISCLAIMER_VERSION, uid);
}
