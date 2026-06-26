import AsyncStorage from '@react-native-async-storage/async-storage';
import { listJobs, type JobApplication } from './jobs';
import { countBuildingApps } from './hiveApps';
import { listIntelCases } from '../osint/cases';

const LOG_KEY = 'hive_activity_log_v1';
const MAX_EVENTS = 200;

export type ActivityEvent = {
  at: string;
  screen: string;
  meta?: string;
};

export type UserActivitySnapshot = {
  generatedAt: string;
  recentScreens: string[];
  jobCount: number;
  submittedJobs: number;
  interviewingJobs: number;
  recentJobs: Array<{ company: string; role: string; status: string }>;
  buildingApps: number;
  recentResearch: string[];
  eventsLast7Days: number;
};

export async function logScreenVisit(screen: string, meta?: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const events: ActivityEvent[] = raw ? JSON.parse(raw) : [];
    events.push({ at: new Date().toISOString(), screen, meta });
    const trimmed = events.slice(-MAX_EVENTS);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // non-fatal
  }
}

export async function buildActivitySnapshot(): Promise<UserActivitySnapshot> {
  const [raw, jobs, building, intelCases] = await Promise.all([
    AsyncStorage.getItem(LOG_KEY),
    listJobs(),
    countBuildingApps(),
    listIntelCases(),
  ]);

  const events: ActivityEvent[] = raw ? JSON.parse(raw) : [];
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentEvents = events.filter((e) => new Date(e.at).getTime() >= weekAgo);

  const screenCounts = new Map<string, number>();
  for (const e of recentEvents) {
    screenCounts.set(e.screen, (screenCounts.get(e.screen) || 0) + 1);
  }
  const recentScreens = [...screenCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([s]) => s);

  const sortedJobs = [...jobs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return {
    generatedAt: new Date().toISOString(),
    recentScreens,
    jobCount: jobs.length,
    submittedJobs: jobs.filter((j) => j.status === 'submitted').length,
    interviewingJobs: jobs.filter((j) => j.status === 'interviewing').length,
    recentJobs: sortedJobs.slice(0, 5).map(formatJobLine),
    buildingApps: building,
    recentResearch: intelCases.slice(0, 3).map((c) => c.target.label),
    eventsLast7Days: recentEvents.length,
  };
}

function formatJobLine(j: JobApplication): { company: string; role: string; status: string } {
  return {
    company: j.companyName || 'Unknown company',
    role: j.roleTitle || j.jobUrl || 'Role',
    status: j.status,
  };
}

/** Compact text blob for Grok 3 (~300 tokens). */
export function snapshotToPromptContext(s: UserActivitySnapshot): string {
  const lines = [
    `Jobs: ${s.jobCount} total, ${s.submittedJobs} submitted, ${s.interviewingJobs} interviewing.`,
    s.recentJobs.length
      ? `Recent applications: ${s.recentJobs.map((j) => `${j.company} (${j.status})`).join('; ')}.`
      : 'No job applications yet.',
    s.buildingApps ? `${s.buildingApps} app(s) currently building.` : '',
    s.recentResearch.length ? `Recent research: ${s.recentResearch.join(', ')}.` : '',
    s.recentScreens.length ? `Most visited areas: ${s.recentScreens.join(', ')}.` : '',
  ].filter(Boolean);
  return lines.join('\n');
}
