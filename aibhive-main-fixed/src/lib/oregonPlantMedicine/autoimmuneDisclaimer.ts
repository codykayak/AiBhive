import { hasStoredDisclaimer, storeDisclaimerAcceptance } from './disclaimerStorage';

export const AUTOIMMUNE_DISCLAIMER_VERSION = 'v1';

export const AUTOIMMUNE_DISCLAIMER_STORAGE_KEY = 'living_knowledge_autoimmune_disclaimer_v1';

export const AUTOIMMUNE_DISCLAIMER_TITLE = 'Educational research — not medical advice';

export const AUTOIMMUNE_DISCLAIMER_SECTIONS = [
  {
    heading: 'Autoimmune illness is serious',
    body:
      'This library explores integrative, traditional, and terrain-based ideas that some people use alongside conventional rheumatology, endocrinology, neurology, and gastroenterology. It does not diagnose, treat, cure, or prevent disease. Never stop prescribed immunosuppressants, biologics, insulin, or thyroid medication without your specialist’s guidance.',
  },
  {
    heading: 'Evidence is mixed',
    body:
      'Topics include sunlight, circadian rhythm, mitochondrial support, EMF reduction, international medicine, and elimination diets. Some have human trials; others are traditional use, case series, or hypothesis. We label controversy where it exists — your clinician helps you weigh risk and benefit.',
  },
  {
    heading: 'Emergency signs',
    body:
      'Seek urgent care for chest pain, stroke symptoms, severe abdominal pain, bloody stool, breathing difficulty, suicidal thoughts, or rapid worsening of any autoimmune flare. Integrative experiments are for stable phases with professional oversight, not acute crises.',
  },
  {
    heading: 'Community & conspiracy-adjacent content',
    body:
      'Some articles discuss under-funded research, environmental triggers, or critiques of incentive structures. That is context for exploration, not proof of any specific cover-up. Verify claims with primary sources and licensed providers.',
  },
  {
    heading: 'Pregnancy, children, and polypharmacy',
    body:
      'Autoimmune pregnancy and pediatric care require specialist teams. Herbs, fasting, cold exposure, and detox protocols can be unsafe in these contexts. Drug–herb interactions with biologics and anticoagulants are common — pharmacist review is essential.',
  },
] as const;

export function hasAcceptedAutoimmuneDisclaimer(uid?: string | null): boolean {
  return hasStoredDisclaimer(AUTOIMMUNE_DISCLAIMER_STORAGE_KEY, AUTOIMMUNE_DISCLAIMER_VERSION, uid);
}

export function acceptAutoimmuneDisclaimer(uid?: string | null): void {
  storeDisclaimerAcceptance(AUTOIMMUNE_DISCLAIMER_STORAGE_KEY, AUTOIMMUNE_DISCLAIMER_VERSION, uid);
}
