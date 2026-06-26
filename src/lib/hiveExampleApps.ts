import type { HiveAppSpec } from './hiveAppTypes';
import rawExamples from '../../shared/hive-example-apps.json';

const EXAMPLES = rawExamples as HiveAppSpec[];

export const EXAMPLE_APP_IDS = {
  jobTracker: 'example-job-tracker',
  resumeBot: 'example-resume-bot',
  research: 'example-research',
  intelGathering: 'example-intel-gathering',
  autoSocial: 'example-auto-social',
} as const;

export function listLocalExampleApps(): HiveAppSpec[] {
  return EXAMPLES.map((app) => ({
    ...app,
    pageCount: app.pages?.length ?? 0,
    isExample: true,
  }));
}

export function getLocalExampleApp(appId: string): HiveAppSpec | null {
  const app = EXAMPLES.find((a) => a.id === appId);
  if (!app) return null;
  return {
    ...app,
    pageCount: app.pages?.length ?? 0,
    isExample: true,
  };
}

export const EXAMPLE_TOOLS = [
  {
    id: EXAMPLE_APP_IDS.jobTracker,
    title: 'Job Tracker',
    sub: 'Applications, status, and follow-ups',
  },
  {
    id: EXAMPLE_APP_IDS.resumeBot,
    title: 'Auto-Bot Resume',
    sub: 'Tailored resume & cover letter',
  },
  {
    id: EXAMPLE_APP_IDS.research,
    title: 'Research',
    sub: 'AI OSINT brief — companies & people',
  },
  {
    id: EXAMPLE_APP_IDS.intelGathering,
    title: 'Intel Gathering',
    sub: 'DBPR + Firecrawl deep scan',
  },
  {
    id: EXAMPLE_APP_IDS.autoSocial,
    title: 'Auto Social',
    sub: 'Admin social posting pipeline',
  },
] as const;
