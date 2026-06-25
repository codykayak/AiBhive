/** User-facing strings — plain language, no developer jargon. */
export const HIVE_COPY = {
  welcome:
    'Welcome to AiBhive. Describe any app in plain English — most build instantly inside the app (about $1, ready in seconds, no Play Store update needed). When you love it, you can publish it as a web link, installable APK, or full Play Store app. Try: "Build me a habit tracker" or "Make a tip calculator."',
  magicOnSubtitle: (provider: string, status?: string) =>
    `Build mode · ${provider}${status ? ` · ${status}` : ''}`,
  magicOffSubtitle: (provider: string) =>
    `Chat mode · ${provider}. Turn Magic ON to build new apps and tools.`,
  approveTitle: 'Ready to build?',
  approveButton: 'Approve & Build',
  building: 'Building your project…',
  done: '✨ Ding! Your update is ready — check My Apps.',
  needCredits: (amount: number) =>
    `This build needs about $${amount.toFixed(0)} in Hive credit. Add credits to continue.`,
  addCredits: 'Add credits',
  balanceLabel: (bal: number) => `Credit balance: $${bal.toFixed(2)}`,
  planLabel: (name: string) => `Plan: ${name}`,
  usageRemaining: (usd: number) => `$${usd.toFixed(2)} remaining`,
  usageThisMonth: (used: number, allowance: number) =>
    `$${used.toFixed(2)} used of $${allowance.toFixed(2)} this month`,
  tokenMarkupNote: (markup: number) => {
    const pct = Math.round((markup - 1) * 100);
    return `Hive credits billed at API cost + ${pct}%`;
  },
  tokensCurrency: 'Hive credits',
  freeWithoutTokens:
    'Job tools and on-device research are free. AiBhive assistant & cloud search use Hive credits.',
  hiveAssistantHint: 'AiBhive assistant — uses Hive credits. Tap to open full chat.',
  hiveCreditsFooter: 'Uses Hive credits per message. BYOK optional in Settings → AI providers.',
  serverOffline:
    'Our build service is reconnecting. I can still chat, and you can use My Apps. Try again in a moment.',
  buildStarted: 'Build started. We\'ll notify you when it\'s ready.',
  buildFailed: 'Something went wrong with the build. Try again or describe a smaller first step.',
  iterateHint: 'Want changes? Describe them here — we\'ll quote the next update.',
  updateCurrent: (version: string) => `You are on the latest version (v${version}).`,
  updateNativeAvailable: (version: string) => `Version v${version} is ready. Download and install the new app package.`,
  updateOtaPending: 'A small update downloaded. Close and reopen AiBhive to apply it.',
  updateOffline: (version: string) => `Could not reach the update server. You are on v${version}.`,
  updateCheck: 'Check for updates',
  updateDownloading: 'Checking…',
  updateInstall: 'Download update',
  updateRestart: 'Restart to apply',
  updateSectionHint: 'Small UI fixes arrive automatically after the next app install. Full installs are only needed occasionally.',
  attachImage: 'Attach reference image',
  attachImageHint: 'Screenshot or mockup — we\'ll resize it for your build',
  quickPrompts: [
    'Build me a habit tracker',
    'Add expense tracker',
    'Interview prep flashcards',
    'Lead follow-up reminder',
  ],
  appsHeroTitle: 'Your personal app factory',
  appsHeroBody:
    'Everything the Hive builds for you appears here instantly — open it, use it, change it, export it.',
  appsRecent: 'Your Hive apps',
  appsBuiltIn: 'Example tools',
  appsEmptyBuilds:
    'No apps yet — describe one on Build or install from the Community Toolkit below.',
  toolkitTitle: 'Community Toolkit',
  toolkitBody:
    'Apps shared by the hive — install free, then tweak or customize your copy. Sharing is opt-in only.',
  toolkitInstall: 'Add to My Apps',
  toolkitInstalled: 'Added to My Apps',
  toolkitShared: 'Shared with the community',
  shareToToolkit: 'Share to Community Toolkit',
  tweakOrCustomize: 'Tweak or Customize',
  tweakOrCustomizeHint: 'Quick spec edits (~$0.50) or full cloud customize (~$4+).',
  chatCleared: 'Chat cleared',
  copied: 'Copied to clipboard',
};

export function formatEstimateCard(costUsd: number, minutes: number): string {
  if (costUsd <= 0) return `Free · ~${minutes} min`;
  const price = costUsd % 1 === 0 ? `$${costUsd}` : `$${costUsd.toFixed(2)}`;
  return `~${price} · ~${minutes} min`;
}

export function formatBuildOffer(summary: string, costUsd: number, minutes: number): string {
  return `I can build that for you.\n\n${summary}\n\n${formatEstimateCard(costUsd, minutes)}\n\nTap Approve when you're ready.`;
}
