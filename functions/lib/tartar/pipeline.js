/**
 * Mention normalization, entity aggregation, and ingestion orchestration.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { extractMentions } from './aiProviders.js';
import { ingestFromSource } from './ingestion/registry.js';
import { chargeCredits, resolveApiKey } from './credits.js';
import {
  mentionsCol,
  entitiesCol,
  ingestionJobsCol,
  sourcesCol,
} from './paths.js';

function parseYear(date) {
  if (date == null) return null;
  const m = String(date).match(/\b(1[6-9]\d{2}|20\d{2})\b/);
  return m ? Number(m[1]) : null;
}

function entityDocId(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 120) || 'unknown';
}

function matchRoleToType(role) {
  const r = String(role ?? '').toLowerCase();
  const map = [
    ['builder', 'builder'], ['architect', 'architect'], ['engineer', 'engineer'],
    ['author', 'author'], ['publisher', 'publisher'], ['cartograph', 'cartographer'],
    ['company', 'organization'], ['firm', 'organization'], ['contractor', 'contractor'],
  ];
  for (const [needle, type] of map) {
    if (r.includes(needle)) return type;
  }
  return 'other';
}

/**
 * Process one source record → Firestore mentions + entity rollups.
 */
export async function processSourceRecord(db, uid, {
  record,
  source,
  jobId,
  provider,
  platformSecrets,
  useAi = true,
}) {
  let extracted = [];
  let usage = { inputTokens: 0, outputTokens: 0 };

  if (useAi && record.text?.trim()) {
    const { key, chargeCredits: shouldCharge } = await resolveApiKey(db, uid, provider, platformSecrets);
    const result = await extractMentions(provider, key, record.text, { sourceTitle: record.title });
    extracted = result.mentions;
    usage = result.usage;
    if (shouldCharge) {
      await chargeCredits(db, uid, {
        provider,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        operation: 'entity_extraction',
        jobId,
      });
    }
  }

  const mentionIds = [];
  const batch = db.batch();
  const mentionsRef = mentionsCol(db, uid);
  const entitiesRef = entitiesCol(db, uid);

  for (const raw of extracted) {
    const entityName = String(raw.entityName ?? '').trim();
    if (!entityName) continue;
    const eid = entityDocId(entityName);
    const year = parseYear(raw.date ?? record.date);
    const mentionRef = mentionsRef.doc();
    const mention = {
      entityName,
      entityId: eid,
      entityType: matchRoleToType(raw.role),
      role: raw.role ?? null,
      project: raw.project ?? record.title,
      projectType: raw.projectType ?? 'unknown',
      date: raw.date ?? record.date ?? null,
      year,
      location: raw.location ?? null,
      sourceId: source.id,
      sourceKind: source.kind,
      sourceUrl: record.url,
      sourceTitle: record.title,
      sourceExcerpt: String(record.text ?? '').slice(0, 500),
      ingestionJobId: jobId,
      attributes: {},
      metadata: {
        aiProvider: provider,
        confidence: raw.confidence ?? null,
        recordId: record.id,
      },
      createdAt: FieldValue.serverTimestamp(),
    };
    batch.set(mentionRef, mention);
    mentionIds.push(mentionRef.id);

    const entityRef = entitiesRef.doc(eid);
    batch.set(entityRef, {
      name: entityName,
      primaryType: mention.entityType,
      mentionCount: FieldValue.increment(1),
      firstYear: year,
      lastYear: year,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  if (mentionIds.length) await batch.commit();
  return { mentionIds, usage, extractedCount: extracted.length };
}

/**
 * Run full ingestion job for a user.
 */
export async function runIngestionJob(db, uid, jobId, platformSecrets) {
  const jobRef = ingestionJobsCol(db, uid).doc(jobId);
  const jobSnap = await jobRef.get();
  if (!jobSnap.exists) throw new Error('Job not found');
  const job = jobSnap.data();

  await jobRef.update({
    status: 'running',
    startedAt: FieldValue.serverTimestamp(),
  });

  const provider = job.aiProvider ?? 'gemini';
  let itemsProcessed = 0;
  let mentionsExtracted = 0;

  try {
    const sourcesSnap = await sourcesCol(db, uid).get();
    const sourceMap = Object.fromEntries(sourcesSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));

    for (const sourceId of job.sourceIds ?? []) {
      const source = sourceMap[sourceId];
      if (!source?.enabled) continue;

      const records = await ingestFromSource(source, job.searchTerms ?? []);
      for (const record of records) {
        itemsProcessed++;
        const result = await processSourceRecord(db, uid, {
          record,
          source,
          jobId,
          provider,
          platformSecrets,
          useAi: job.useAi !== false,
        });
        mentionsExtracted += result.extractedCount;
      }
    }

    await jobRef.update({
      status: 'completed',
      itemsProcessed,
      mentionsExtracted,
      completedAt: FieldValue.serverTimestamp(),
    });

    return { itemsProcessed, mentionsExtracted };
  } catch (err) {
    await jobRef.update({
      status: 'failed',
      error: String(err.message),
      itemsProcessed,
      mentionsExtracted,
      completedAt: FieldValue.serverTimestamp(),
    });
    throw err;
  }
}

/**
 * Seed default sources for a new user from catalog definitions.
 */
export async function seedDefaultSources(db, uid, catalogSources) {
  const col = sourcesCol(db, uid);
  const existing = await col.limit(1).get();
  if (!existing.empty) return;

  const batch = db.batch();
  for (const src of catalogSources) {
    batch.set(col.doc(src.id), {
      ...src,
      seededAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}
