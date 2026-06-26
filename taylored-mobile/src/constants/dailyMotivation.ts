/** Short motivational lines — zero tokens. Grok 3 personalizes on top when enabled. */
export const DAILY_MOTIVATION_LINES = [
  'Every application is practice for the one that changes everything.',
  'Small steps today become the career story you tell tomorrow.',
  'The best time to follow up was yesterday. The second best time is today.',
  'You are one conversation away from a breakthrough — keep building momentum.',
  'Dream jobs are not found. They are built through consistent action.',
  'Your future self will thank you for the work you do in AiBhive today.',
  'Clarity beats perfection. Ship one small win before noon.',
  'The hive grows stronger every time you show up and build.',
  'Confidence comes from preparation — and you are preparing right now.',
  'Great careers are not lucky breaks. They are patterns of showing up.',
  'Today is a good day to turn research into action.',
  'You have more tools than yesterday. Use one of them.',
  'Momentum is a superpower. Protect it with one focused task.',
  'The world rewards people who finish what they start.',
  'Your next opportunity may already be in your Job Tracker — check in.',
];

export function pickMotivationLine(seed: number): string {
  const idx = Math.abs(seed) % DAILY_MOTIVATION_LINES.length;
  return DAILY_MOTIVATION_LINES[idx];
}

export function daySeed(date = new Date()): number {
  return date.getFullYear() * 1000 + date.getMonth() * 50 + date.getDate();
}
