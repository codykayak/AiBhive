/** Registry of capabilities the mobile app can handle without a code change. */
export const HIVE_TOOLS = [
  {
    id: 'hive_chat',
    name: 'Hive Chat',
    capabilities: ['brainstorm', 'career advice', 'general questions', 'writing help'],
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
