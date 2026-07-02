import type { HiveAppSpec } from './hiveAppTypes';
import rawExamples from '../../shared/hive-example-apps.json';

const EXAMPLES = rawExamples as HiveAppSpec[];

export const EXAMPLE_APP_IDS = {
  resumeBot: 'example-resume-bot',
  jobHunter: 'example-job-hunter',
  socialPostHunter: 'example-social-post-hunter',
  jobTracker: 'example-job-tracker',
  research: 'example-research',
  mockRealestate: 'example-mock-realestate',
  homeworkBot: 'example-homework-bot',
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
    id: EXAMPLE_APP_IDS.resumeBot,
    title: 'Auto-Bot Resume',
    sub: 'Customized to the job posting - one click resume and cover letter.',
  },
  {
    id: EXAMPLE_APP_IDS.jobHunter,
    title: 'Job Hunter Bot',
    sub: '10 jobs · cover letters · resume match',
  },
  {
    id: EXAMPLE_APP_IDS.socialPostHunter,
    title: 'Social Post Hunter',
    sub: 'Find posts · reply · auto-social',
  },
  {
    id: EXAMPLE_APP_IDS.jobTracker,
    title: 'Job Tracker',
    sub: 'Applications, status, and follow-ups',
  },
  {
    id: EXAMPLE_APP_IDS.research,
    title: 'Research',
    sub: 'Intel on companies and people',
  },
  {
    id: EXAMPLE_APP_IDS.homeworkBot,
    title: 'Homework Bot',
    sub: 'OCR pages → private RAG → Grok answers',
  },
  {
    id: EXAMPLE_APP_IDS.mockRealestate,
    title: 'Mock Up Real Estate',
    sub: 'Demo property dashboard',
  },
] as const;
