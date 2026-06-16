/** Registry of capabilities the mobile app can handle without a code change. */
export const HIVE_TOOLS = [
  {
    id: 'hive_chat',
    name: 'Hive Chat',
    capabilities: ['brainstorm', 'career advice', 'general questions', 'writing help'],
  },
  {
    id: 'hive_magic',
    name: 'Hive Magic + Cursor Build Agent',
    capabilities: [
      'spawn Cursor Cloud Agent on GitHub',
      'build new app features after user approval',
      'estimate cost and time',
      'open PR when build completes',
    ],
  },
  {
    id: 'auto_bot_resume',
    name: 'Auto-Bot Resume',
    capabilities: [
      'tailor resume',
      'cover letter',
      'cold email',
      'job url scrape',
      'screenshot job posting',
    ],
  },
  {
    id: 'company_intel',
    name: 'Company Intel',
    capabilities: ['company research', 'decision makers', 'deeper lookup'],
  },
  {
    id: 'jewles_web',
    name: 'Jewles Web Studio',
    capabilities: ['open aibhive.com in app'],
  },
];

export const HIVE_REPO = {
  url: 'https://github.com/codykayak/AiBhive',
  branch: process.env.HIVE_GITHUB_BRANCH || 'main-fixed',
};

export function getToolsManifestForPrompt() {
  return HIVE_TOOLS.map((t) => `- ${t.name}: ${t.capabilities.join(', ')}`).join('\n');
}
