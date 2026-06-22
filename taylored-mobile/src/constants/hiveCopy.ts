/** User-facing strings — plain language, no developer jargon. */
export const HIVE_COPY = {
  welcome:
    'Welcome to AiBhive. Describe any app, tool, or feature in plain English — I\'ll quote time and cost, you approve once, and we\'ll notify you when it\'s ready. Try: "Build me a habit tracker."',
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
  balanceLabel: (bal: number) => `Hive credit: $${bal.toFixed(2)}`,
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
  appsHeroBody: 'Everything the Hive builds for you lives here — plus our starter tools.',
  appsRecent: 'Built by the Hive',
  appsBuiltIn: 'Starter tools',
  appsEmptyBuilds: 'No custom apps yet — describe one on Build and approve the quote.',
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
