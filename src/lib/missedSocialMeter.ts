import type { SocialHunterCriteria } from './socialHunterApi';

/** Hypothetical missed-interaction rate (per second) while you're not engaging. */
export function missedInteractionsPerSecond(
  criteria: SocialHunterCriteria,
  hunting: boolean,
  postsLoaded: number
): number {
  const platforms = Math.max(1, criteria.platforms.length);
  const topics = Math.max(1, criteria.topics.split(',').map((t) => t.trim()).filter(Boolean).length);
  const days = Math.min(90, Math.max(1, criteria.dateRangeDays || 14));
  const windowBoost = 1 + days / 45;

  let rate = 0.35 * platforms * Math.sqrt(topics) * windowBoost;

  if (hunting) rate *= 0.55;
  if (postsLoaded > 0) rate *= Math.max(0.45, 0.72 - postsLoaded * 0.02);

  return rate;
}

export function formatMissedCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  if (n >= 1_000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return Math.floor(n).toLocaleString();
}

/** Arbitrary "bleed velocity" units for side gauge (scales with rate). */
export function bleedVelocity(rate: number): number {
  return rate * 60 * 12;
}

/** 0–1 FOMO index from cumulative missed count + current bleed rate. */
export function fomoIndex(missed: number, rate: number): number {
  const fromCount = Math.min(0.55, missed / 80_000);
  const fromRate = Math.min(0.45, rate / 12);
  return Math.min(1, 0.12 + fromCount + fromRate);
}

export function opportunityQuip(missed: number, rate: number): string {
  if (missed >= 50_000) return 'Your market is screaming — threads are stacking without you.';
  if (missed >= 20_000) return 'High bleed. Competitors may be replying right now.';
  if (missed >= 8_000) return 'Conversation velocity rising across your topics.';
  if (missed >= 2_500) return 'Signals detected — prospects discussing your space.';
  if (rate >= 6) return 'Bleed rate critical — every second costs engagement.';
  if (missed >= 500) return 'Radar online — opportunities drifting past.';
  return 'Listening for social bleed in your market…';
}

export const PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'rgba(14, 165, 233, 0.9)',
  reddit: 'rgba(249, 115, 22, 0.9)',
  x: 'rgba(167, 139, 250, 0.9)',
  facebook: 'rgba(59, 130, 246, 0.9)',
};

export function platformColor(name: string): string {
  const key = name.toLowerCase().replace(/\s+/g, '');
  if (key.includes('linkedin')) return PLATFORM_COLORS.linkedin;
  if (key.includes('reddit')) return PLATFORM_COLORS.reddit;
  if (key === 'x' || key.includes('twitter')) return PLATFORM_COLORS.x;
  if (key.includes('facebook')) return PLATFORM_COLORS.facebook;
  return 'rgba(148, 163, 184, 0.9)';
}
