/**
 * Archive retrieval stats — per-user and community pool aggregates.
 */

import {
  mentionsCol,
  entitiesCol,
  sourcesCol,
  ingestionJobsCol,
  profileRef,
} from './paths.js';
import { getPoolStats } from './pool.js';

export async function getArchiveStats(db, uid) {
  const [mentionsCount, entitiesCount, jobsSnap, sourcesSnap, pool] = await Promise.all([
    mentionsCol(db, uid).count().get(),
    entitiesCol(db, uid).count().get(),
    ingestionJobsCol(db, uid).orderBy('createdAt', 'desc').limit(10).get(),
    sourcesCol(db, uid).get(),
    getPoolStats(db),
  ]);

  const jobs = jobsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const documentsRetrieved = completedJobs.reduce((sum, j) => sum + (j.itemsProcessed ?? 0), 0);
  const lastJob = jobs[0] ?? null;

  const sourceStats = [];
  for (const doc of sourcesSnap.docs) {
    const data = doc.data();
    const countSnap = await mentionsCol(db, uid).where('sourceId', '==', doc.id).count().get();
    const jobForSource = completedJobs.find((j) => j.sourceIds?.includes(doc.id));
    sourceStats.push({
      sourceId: doc.id,
      name: data.name,
      kind: data.kind,
      enabled: data.enabled !== false,
      mentionCount: countSnap.data().count ?? 0,
      lastIngestedAt: jobForSource?.completedAt ?? null,
      status: countSnap.data().count > 0 ? 'indexed' : (data.enabled ? 'ready' : 'disabled'),
    });
  }

  const profileSnap = await profileRef(db, uid).get();
  const shareWithCommunity = Boolean(profileSnap.data()?.shareWithCommunity);

  const userMentions = mentionsCount.data().count ?? 0;
  const communityTotal = pool.documentsIndexed + documentsRetrieved;

  return {
    user: {
      documentsRetrieved,
      mentionsExtracted: userMentions,
      entitiesTracked: entitiesCount.data().count ?? 0,
      activeSources: sourceStats.filter((s) => s.enabled).length,
      sourceStats,
      lastJob: lastJob ? {
        id: lastJob.id,
        status: lastJob.status,
        itemsProcessed: lastJob.itemsProcessed ?? 0,
        mentionsExtracted: lastJob.mentionsExtracted ?? 0,
        completedAt: lastJob.completedAt ?? null,
      } : null,
      shareWithCommunity,
      isRagReady: userMentions > 0,
    },
    community: pool,
    undiscoveredEstimate: Math.max(0, pool.catalogEstimate - communityTotal),
    catalogSources: sourcesSnap.size,
    builtArchives: sourceStats.filter((s) => s.status === 'indexed').length,
  };
}
