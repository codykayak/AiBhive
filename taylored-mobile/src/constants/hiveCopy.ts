/** User-facing strings — plain language, no developer jargon. */
export const HIVE_COPY = {
  welcome:
    'Welcome to Taylored. Describe any app, tool, or feature in plain English — I\'ll quote time and cost, you approve once, and we\'ll notify you when it\'s ready. Try: "Build me a habit tracker."',
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
};

export function formatEstimateCard(costUsd: number, minutes: number): string {
  return `~$${costUsd} · ~${minutes} min`;
}

export function formatBuildOffer(summary: string, costUsd: number, minutes: number): string {
  return `I can build that for you.\n\n${summary}\n\n${formatEstimateCard(costUsd, minutes)}\n\nTap Approve when you're ready.`;
}
