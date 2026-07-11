import AsyncStorage from '@react-native-async-storage/async-storage';

export type JobStatus = 'queued' | 'in_progress' | 'done' | 'needs_parts';

export type FieldNote = {
  id: string;
  text: string;
  authorUid?: string;
  createdAt: number;
};

export type FieldPhoto = {
  id: string;
  url: string;
  caption?: string;
  createdAt: number;
};

export type FieldJob = {
  id: string;
  title: string;
  address: string;
  notes: string;
  packId: 'pool' | 'electrical' | 'property';
  status: JobStatus;
  createdAt: number;
  updatedAt: number;
  faultIds: string[];
  customerName?: string;
  adminNotes?: string;
  priority?: 'low' | 'normal' | 'high' | 'emergency';
  assigneeUid?: string | null;
  fieldNotes?: FieldNote[];
  photos?: FieldPhoto[];
  cloudSynced?: boolean;
};

const KEY = 'aibhive.diagnose.jobs.v1';

const SEED: FieldJob[] = [
  {
    id: 'seed-1',
    title: 'Filter pressure high after weekend party',
    address: '1420 Palm Court',
    notes: 'Customer says returns weak. Check cartridges.',
    packId: 'pool',
    status: 'in_progress',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    faultIds: ['pool-filter-high-pressure'],
    fieldNotes: [],
    photos: [],
  },
  {
    id: 'seed-2',
    title: 'Panel warm near main lugs',
    address: '88 Industrial Way',
    notes: 'IR if possible. Document temps.',
    packId: 'electrical',
    status: 'queued',
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 7200000,
    faultIds: ['elec-panel-hot'],
    fieldNotes: [],
    photos: [],
  },
  {
    id: 'seed-3',
    title: 'Washer won’t drain — Unit 204',
    address: '12 Desert Ridge #204',
    notes: 'Resident reports standing water after rinse. Check pump filter.',
    packId: 'property',
    status: 'queued',
    createdAt: Date.now() - 5400000,
    updatedAt: Date.now() - 5400000,
    faultIds: ['prop-washer-no-drain'],
    fieldNotes: [],
    photos: [],
  },
];

export async function loadJobs(): Promise<FieldJob[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) {
    await AsyncStorage.setItem(KEY, JSON.stringify(SEED));
    return SEED;
  }
  try {
    return JSON.parse(raw) as FieldJob[];
  } catch {
    return SEED;
  }
}

export async function saveJobs(jobs: FieldJob[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(jobs));
}

export async function upsertJob(job: FieldJob): Promise<FieldJob[]> {
  const jobs = await loadJobs();
  const idx = jobs.findIndex((j) => j.id === job.id);
  const next = [...jobs];
  if (idx >= 0) next[idx] = job;
  else next.unshift(job);
  await saveJobs(next);
  return next;
}

export async function deleteJob(id: string): Promise<FieldJob[]> {
  const jobs = (await loadJobs()).filter((j) => j.id !== id);
  await saveJobs(jobs);
  return jobs;
}

export function newJob(partial: Partial<FieldJob> & Pick<FieldJob, 'title' | 'packId'>): FieldJob {
  const now = Date.now();
  return {
    id: `job-${now}`,
    address: '',
    notes: '',
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    faultIds: [],
    fieldNotes: [],
    photos: [],
    ...partial,
  };
}
