/** Platform-specific safe engagement guidance (discovery is server-side; posting is manual). */

export const REDDIT_SAFE_TIPS = [
  'Discovery uses search snippets only — we never log into or post from your Reddit account.',
  'Always edit the draft reply before posting; never paste AI text verbatim.',
  'Space comments out (10+ minutes apart) and stay under ~5 replies per day on newer accounts.',
  'Skip link-dropping, duplicate phrasing, and copy-paste across threads — Reddit flags that as spam.',
  'If your account was flagged, pause automated-style engagement and appeal via reddit.com/appeals.',
] as const;

export function includesReddit(platforms: string[]): boolean {
  return platforms.some((p) => p.toLowerCase().includes('reddit'));
}

export function platformSafetyLabel(platform: string): string | null {
  if (platform.toLowerCase().includes('reddit')) {
    return 'Edit this draft heavily before posting on Reddit — personalize it to the thread.';
  }
  return null;
}
