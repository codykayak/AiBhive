/**
 * Pros field knowledge — team tips + anonymized global RAG corpus.
 * All writes via Admin SDK only.
 */

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s/+.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text) {
  const stop = new Set(['a', 'an', 'the', 'is', 'are', 'to', 'of', 'and', 'or', 'for', 'with', 'it', 'this', 'that', 'my', 'not', 'no']);
  return normalize(text)
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stop.has(t));
}

function scoreTip(tip, query) {
  const q = normalize(query);
  const qTokens = tokens(query);
  if (!q) return 0;
  const blob = normalize(
    [tip.text, tip.equipmentSymptom, tip.fixSummary, ...(tip.equipment || []), ...(tip.tags || []), ...(tip.faultIds || [])].join(
      ' '
    )
  );
  let score = Number(tip.score) || 0;
  if (blob.includes(q)) score += 12;
  for (const t of qTokens) {
    if (blob.includes(t)) score += 2;
  }
  for (const tag of tip.tags || []) {
    if (q.includes(normalize(tag))) score += 4;
  }
  for (const eq of tip.equipment || []) {
    if (q.includes(normalize(eq))) score += 6;
  }
  return score;
}

export function formatTipsForPrompt(tips) {
  if (!tips?.length) return '';
  const lines = tips.map((t, i) => {
    const who = t.scope === 'global' ? 'Field network' : 'Your shop';
    return `${i + 1}. [${who}] ${t.text}${t.fixSummary ? ` Fix: ${t.fixSummary}` : ''}`;
  });
  return `\nField knowledge (real tech tips):\n${lines.join('\n')}`;
}

export async function searchKnowledgeTips(db, { companyId, query, packId, limit = 5 }) {
  const results = [];

  if (companyId) {
    let q = db.collection('pros_companies').doc(companyId).collection('knowledge_tips').where('status', '==', 'active');
    if (packId) q = q.where('packId', '==', packId);
    const snap = await q.limit(80).get();
    for (const doc of snap.docs) {
      const tip = { id: doc.id, scope: 'company', ...doc.data() };
      const s = scoreTip(tip, query);
      if (s > 0) results.push({ ...tip, _score: s });
    }
  }

  // Global anonymized corpus
  let gq = db.collection('pros_global_tips').where('status', '==', 'active');
  if (packId) gq = gq.where('packId', '==', packId);
  try {
    const gsnap = await gq.limit(80).get();
    for (const doc of gsnap.docs) {
      const tip = { id: doc.id, scope: 'global', ...doc.data() };
      const s = scoreTip(tip, query);
      if (s > 0) results.push({ ...tip, _score: s });
    }
  } catch (err) {
    // Index may not exist yet for compound queries — fall back to unscored scan
    console.warn('[knowledge] global tip query', err?.message || err);
  }

  return results
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...tip }) => tip);
}

function tipFingerprint({ packId, equipment, text }) {
  const key = normalize([packId, ...(equipment || []).slice(0, 3), String(text || '').slice(0, 120)].join('|'));
  return key.slice(0, 180);
}

export async function submitKnowledgeFeedback(db, FieldValue, {
  companyId,
  user,
  outcome,
  userQuery,
  assistantReply,
  packId,
  source,
  matchedFaultIds,
  tipIdsUsed,
  messageId,
  equipment,
  equipmentSymptom,
  fixSummary,
  shareWithTeam,
  shareAnonymously,
  tipText,
}) {
  const now = FieldValue.serverTimestamp();
  const feedbackRef = db.collection('pros_companies').doc(companyId).collection('knowledge_feedback').doc();

  const feedback = {
    id: feedbackRef.id,
    outcome, // worked | didnt
    userQuery: String(userQuery || '').slice(0, 1000),
    assistantReply: String(assistantReply || '').slice(0, 2000),
    packId: packId || 'property',
    source: source || 'local',
    matchedFaultIds: Array.isArray(matchedFaultIds) ? matchedFaultIds.slice(0, 8) : [],
    tipIdsUsed: Array.isArray(tipIdsUsed) ? tipIdsUsed.slice(0, 8) : [],
    actorUid: user.uid,
    messageId: messageId || null,
    equipment: Array.isArray(equipment) ? equipment.slice(0, 6).map((e) => String(e).slice(0, 40)) : [],
    equipmentSymptom: String(equipmentSymptom || '').slice(0, 400),
    fixSummary: String(fixSummary || '').slice(0, 600),
    shareWithTeam: Boolean(shareWithTeam),
    shareAnonymously: Boolean(shareAnonymously),
    createdAt: now,
  };
  await feedbackRef.set(feedback);

  // Bump tip counts for tips that were used in this diagnose
  for (const tipId of feedback.tipIdsUsed) {
    const companyTip = db.collection('pros_companies').doc(companyId).collection('knowledge_tips').doc(tipId);
    const companySnap = await companyTip.get();
    if (companySnap.exists) {
      await companyTip.set(
        {
          workedCount: FieldValue.increment(outcome === 'worked' ? 1 : 0),
          didntCount: FieldValue.increment(outcome === 'didnt' ? 1 : 0),
          score: FieldValue.increment(outcome === 'worked' ? 2 : -1),
          updatedAt: now,
        },
        { merge: true }
      );
    } else {
      const globalTip = db.collection('pros_global_tips').doc(tipId);
      const gSnap = await globalTip.get();
      if (gSnap.exists) {
        await globalTip.set(
          {
            workedCount: FieldValue.increment(outcome === 'worked' ? 1 : 0),
            didntCount: FieldValue.increment(outcome === 'didnt' ? 1 : 0),
            score: FieldValue.increment(outcome === 'worked' ? 2 : -1),
            updatedAt: now,
          },
          { merge: true }
        );
      }
    }
  }

  let companyTipId = null;
  let globalTipId = null;

  const bodyText =
    String(tipText || '').trim() ||
    [equipmentSymptom, fixSummary].filter(Boolean).join(' — ') ||
    (outcome === 'worked' ? `Confirmed fix for: ${userQuery}` : '');

  const useful =
    Boolean(bodyText) && (outcome === 'worked' || Boolean(fixSummary) || Boolean(equipmentSymptom));

  if (useful && (shareWithTeam || shareAnonymously)) {
    const tipPayload = {
      text: bodyText.slice(0, 500),
      packId: packId || 'property',
      equipment: feedback.equipment,
      faultIds: feedback.matchedFaultIds,
      tags: tokens(`${userQuery} ${bodyText}`).slice(0, 12),
      equipmentSymptom: feedback.equipmentSymptom,
      fixSummary: feedback.fixSummary,
      fingerprint: tipFingerprint({ packId, equipment: feedback.equipment, text: bodyText }),
    };

    // Shop playbook (includes author for managers)
    if (shareWithTeam) {
      const tipRef = db.collection('pros_companies').doc(companyId).collection('knowledge_tips').doc();
      await tipRef.set({
        id: tipRef.id,
        ...tipPayload,
        source: 'feedback',
        sourceFeedbackId: feedbackRef.id,
        authorUid: user.uid,
        workedCount: outcome === 'worked' ? 1 : 0,
        didntCount: outcome === 'didnt' ? 1 : 0,
        score: outcome === 'worked' ? 3 : 1,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });
      companyTipId = tipRef.id;
    }

    // Anonymized network share (no uid / company / customer data)
    if (shareAnonymously) {
      const fp = tipPayload.fingerprint;
      const existing = await db.collection('pros_global_tips').where('fingerprint', '==', fp).limit(1).get();
      if (!existing.empty) {
        const doc = existing.docs[0];
        await doc.ref.set(
          {
            workedCount: FieldValue.increment(outcome === 'worked' ? 1 : 0),
            didntCount: FieldValue.increment(outcome === 'didnt' ? 1 : 0),
            contributorCount: FieldValue.increment(1),
            score: FieldValue.increment(outcome === 'worked' ? 2 : 0),
            updatedAt: now,
          },
          { merge: true }
        );
        globalTipId = doc.id;
      } else {
        const gRef = db.collection('pros_global_tips').doc();
        await gRef.set({
          id: gRef.id,
          text: tipPayload.text,
          packId: tipPayload.packId,
          equipment: tipPayload.equipment,
          faultIds: tipPayload.faultIds,
          tags: tipPayload.tags,
          equipmentSymptom: tipPayload.equipmentSymptom || '',
          fixSummary: tipPayload.fixSummary || '',
          fingerprint: fp,
          workedCount: outcome === 'worked' ? 1 : 0,
          didntCount: outcome === 'didnt' ? 1 : 0,
          contributorCount: 1,
          score: outcome === 'worked' ? 3 : 1,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        });
        globalTipId = gRef.id;
      }
    }
  }

  return { feedbackId: feedbackRef.id, companyTipId, globalTipId };
}
