import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { JobApplication } from './jobs';
import { readAllJobsLocal, writeAllJobsLocal } from './jobsStorage';

function jobsCollection(uid: string) {
  return collection(db, 'user_profiles', uid, 'jobs');
}

export async function syncJobsFromCloud(uid: string): Promise<void> {
  try {
    const snap = await getDocs(jobsCollection(uid));
    if (snap.empty) return;

    const local = await readAllJobsLocal();
    const localById = new Map(local.map((j) => [j.id, j]));
    const cloudJobs: JobApplication[] = [];

    snap.forEach((d) => {
      cloudJobs.push(d.data() as JobApplication);
    });

    for (const cloud of cloudJobs) {
      const existing = localById.get(cloud.id);
      if (!existing || cloud.updatedAt > existing.updatedAt) {
        localById.set(cloud.id, cloud);
      }
    }

    const merged = Array.from(localById.values()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
    await writeAllJobsLocal(merged);
  } catch (err) {
    console.warn('[jobSync] pull failed', err);
  }
}

export async function syncJobToCloud(uid: string, job: JobApplication): Promise<void> {
  try {
    await setDoc(
      doc(jobsCollection(uid), job.id),
      {
        ...job,
        syncedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[jobSync] push failed', job.id, err);
  }
}

export async function syncAllJobsToCloud(uid: string, jobs: JobApplication[]): Promise<void> {
  await Promise.all(jobs.map((j) => syncJobToCloud(uid, j)));
}
