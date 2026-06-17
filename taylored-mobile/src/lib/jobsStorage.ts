import AsyncStorage from '@react-native-async-storage/async-storage';
import type { JobApplication } from './jobs';

export const JOBS_KEY = 'hive_job_applications_v1';

export async function readAllJobsLocal(): Promise<JobApplication[]> {
  try {
    const raw = await AsyncStorage.getItem(JOBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JobApplication[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
  } catch {
    return [];
  }
}

export async function writeAllJobsLocal(jobs: JobApplication[]) {
  await AsyncStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}
