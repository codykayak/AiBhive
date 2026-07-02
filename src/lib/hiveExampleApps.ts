import type { HiveAppSpec } from './hiveAppTypes';
import rawExamples from '../../shared/hive-example-apps.json';
import { HIDDEN_STORE_APP_IDS } from './focusReactor';

const EXAMPLES = rawExamples as HiveAppSpec[];

export const EXAMPLE_APP_IDS = {
  resumeBot: 'example-resume-bot',
  jobHunter: 'example-job-hunter',
  socialPostHunter: 'example-social-post-hunter',
  jobTracker: 'example-job-tracker',
  research: 'example-research',
  mockRealestate: 'example-mock-realestate',
  homeworkBot: 'example-homework-bot',
  meetingBurn: 'example-meeting-burn',
  focusReactor: 'example-focus-reactor',
  houseFlip: 'example-house-flip',
} as const;

export function listLocalExampleApps(): HiveAppSpec[] {
  const visible = EXAMPLES.filter((a) => !HIDDEN_STORE_APP_IDS.has(a.id));
  const apps = visible.map((app) => ({
    ...app,
    pageCount: app.pages?.length ?? 0,
    isExample: true,
  }));
  const resume = apps.find((a) => a.id === EXAMPLE_APP_IDS.resumeBot);
  if (!resume) return apps;
  return [resume, ...apps.filter((a) => a.id !== EXAMPLE_APP_IDS.resumeBot)];
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
    id: EXAMPLE_APP_IDS.focusReactor,
    title: 'Focus Reactor',
    sub: 'Live particle core — charge up deep work',
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
    id: EXAMPLE_APP_IDS.meetingBurn,
    title: 'Meeting Burn',
    sub: 'Live clock — see what the meeting really costs',
  },
  {
    id: EXAMPLE_APP_IDS.mockRealestate,
    title: 'Mock Up Real Estate',
    sub: 'Demo property dashboard',
  },
  {
    id: EXAMPLE_APP_IDS.houseFlip,
    title: 'House Flip Calculator',
    sub: 'ARV · rehab · live profit charts',
  },
] as const;
