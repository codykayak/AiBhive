/**
 * Persist iridology analyses and follow-up chat per user (Firestore).
 */
import { FieldValue } from 'firebase-admin/firestore';
import { grokChatMessages } from './socialPosts/grokProvider.js';
import { getCachedGrokChatModel, resolveLatestGrokModels } from './grokModelResolver.js';
import { ensureHiveUser, getHiveAccount } from './hiveBilling.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const COLLECTION = 'plant_medicine_iridology_analyses';
const ANALYSIS_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IRIDOLOGY_FOLLOWUP_SYSTEM = `You are AiBhive Living Knowledge — educational iridology follow-up assistant.

The user already received an AI iris photo analysis (NOT medical diagnosis). Answer follow-up questions about THAT report only.

RULES:
- Reference their saved analysis findings — do not invent new iris signs they did not have in the report.
- Educational iridology language only; never diagnose disease.
- Iridology is not validated clinical science — repeat uncertainty when asked about serious health topics.
- If they ask about symptoms, urge licensed medical care.
- Use conversation history; short replies may answer your prior clarifier.
- Warm, concise answers (under ~300 words unless they ask for depth).
- Scope: iridology methodology, zones, constitutional types, fiber signs, retake tips, comparing schools.`;

function clip(s, max) {
  return String(s ?? '')
    .trim()
    .slice(0, max);
}

function buildAnalysisContext(record) {
  const structured = record.structured || {};
  const parts = [
    '--- USER IRIS ANALYSIS REPORT (reference only) ---',
    `Date: ${record.createdAt || 'unknown'}`,
    `Methodology: ${structured.methodology || record.methodology || 'integrated'}`,
    `Eye: ${structured.eye || record.eye || 'unknown'}`,
    `Photo quality: ${structured.photoQuality || 'unknown'}`,
    structured.photoAssessment ? `Photo assessment: ${structured.photoAssessment}` : '',
    structured.globalOverview ? `Global overview: ${structured.globalOverview}` : '',
    structured.fiberAndTexture ? `Fiber & texture: ${structured.fiberAndTexture}` : '',
    structured.integratedSummary ? `Integrated summary: ${structured.integratedSummary}` : '',
    structured.constitutionalType
      ? `Constitutional: ${structured.constitutionalType.label} (${structured.constitutionalType.confidence}) — ${structured.constitutionalType.rationale}`
      : '',
    Array.isArray(structured.observations) && structured.observations.length
      ? `Observations:\n${structured.observations
          .map((o) => `- ${o.sign} @ ${o.zone}: ${o.meaning} (${o.confidence})`)
          .join('\n')}`
      : '',
    Array.isArray(structured.wellnessTendencies) && structured.wellnessTendencies.length
      ? `Wellness tendencies: ${structured.wellnessTendencies.join('; ')}`
      : '',
    record.reply ? `\nNarrative report:\n${clip(record.reply, 4000)}` : '',
  ];
  return parts.filter(Boolean).join('\n');
}

export async function saveIridologyAnalysis(db, uid, payload) {
  const ref = db.collection(COLLECTION).doc();
  const now = new Date().toISOString();
  const doc = {
    uid,
    createdAt: now,
    updatedAt: now,
    methodology: clip(payload.methodology, 40),
    eye: clip(payload.eye, 20),
    notes: clip(payload.notes, 2000),
    reply: clip(payload.reply, 12000),
    structured: payload.structured || {},
    chatMessages: [],
  };
  await ref.set(doc);
  return { id: ref.id, ...doc };
}

export async function listIridologyAnalyses(db, uid, limit = 20) {
  const snap = await db.collection(COLLECTION).where('uid', '==', uid).limit(50).get();

  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        createdAt: data.createdAt,
        methodology: data.methodology,
        eye: data.eye,
        photoQuality: data.structured?.photoQuality,
        constitutionalLabel: data.structured?.constitutionalType?.label,
        summaryLine: clip(data.structured?.integratedSummary || data.reply, 160),
        chatCount: Array.isArray(data.chatMessages) ? data.chatMessages.length : 0,
      };
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, limit);
}

export async function getIridologyAnalysis(db, uid, analysisId) {
  if (!ANALYSIS_ID_RE.test(analysisId)) return null;
  const snap = await db.collection(COLLECTION).doc(analysisId).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (data.uid !== uid) return null;
  return { id: snap.id, ...data };
}

export async function runIridologyFollowUpChat(db, hiveUserId, uid, analysisId, opts) {
  const message = clip(opts.message, 2000);
  if (!message) return { ok: false, error: 'Message is required.' };

  const record = await getIridologyAnalysis(db, uid, analysisId);
  if (!record) return { ok: false, error: 'Analysis not found.' };

  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
  if (!apiKey) return { ok: false, error: 'Hive AI is temporarily unavailable.' };

  await ensureHiveUser(db, hiveUserId);
  await resolveLatestGrokModels();
  const model = process.env.PLANT_MEDICINE_CHAT_MODEL || getCachedGrokChatModel();

  const storedHistory = Array.isArray(record.chatMessages) ? record.chatMessages : [];
  const clientHistory = (opts.history || [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
    .slice(-10);

  const history =
    clientHistory.length > 0
      ? clientHistory.map((m) => ({ role: m.role, content: clip(m.content, 2500) }))
      : storedHistory.slice(-10).map((m) => ({ role: m.role, content: clip(m.content, 2500) }));

  let ragSnippet = '';
  try {
    const kPath = path.join(__dirname, 'iridologyKnowledge.json');
    ragSnippet = clip(JSON.stringify(JSON.parse(fs.readFileSync(kPath, 'utf8')).cautions), 1500);
  } catch {
    ragSnippet = '';
  }

  const system = [
    IRIDOLOGY_FOLLOWUP_SYSTEM,
    buildAnalysisContext(record),
    ragSnippet ? `\n--- SAFETY REMINDERS ---\n${ragSnippet}` : '',
  ].join('\n');

  const reply = await grokChatMessages(
    apiKey,
    model,
    [{ role: 'system', content: system.slice(0, 14000) }, ...history, { role: 'user', content: message }],
    { temperature: 0.35, max_tokens: 1400 },
  );

  if (!reply) return { ok: false, error: 'No response from Hive AI.' };

  const now = new Date().toISOString();
  const ref = db.collection(COLLECTION).doc(analysisId);
  await ref.update({
    updatedAt: now,
    chatMessages: FieldValue.arrayUnion(
      { role: 'user', content: message, createdAt: now },
      { role: 'assistant', content: reply, createdAt: now },
    ),
  });

  const account = await getHiveAccount(db, hiveUserId);
  return {
    ok: true,
    reply,
    source: 'grok',
    model,
    chargedUsd: 0,
    account: { creditBalanceUsd: account.creditBalanceUsd, usage: account.usage },
  };
}
