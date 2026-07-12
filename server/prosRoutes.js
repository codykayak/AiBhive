/**
 * AiBhive Pros — field ops for trade companies (pool, electrical, …).
 * Firestore paths (Admin SDK):
 *   pros_companies/{companyId}
 *   pros_companies/{companyId}/secrets/aiKeys   (server-only)
 *   pros_companies/{companyId}/members/{uid}
 *   pros_companies/{companyId}/jobs/{jobId}
 *   pros_companies/{companyId}/activity/{id}
 *   pros_memberships/{uid}
 */

import admin from 'firebase-admin';
import { verifyHiveAuth } from './hiveAuth.js';
import {
  formatTipsForPrompt,
  searchKnowledgeTips,
  submitKnowledgeFeedback,
} from './prosKnowledge.js';
import {
  buildProsAnalytics,
  createProsNotification,
  listTeamLocations,
  normalizePingInterval,
  recordLocationPing,
  respondToNotification,
  serializeNotification,
} from './prosFieldOps.js';

const PROVIDERS = ['grok', 'claude', 'kimi', 'gemini'];

const PROVIDER_META = {
  grok: { label: 'Grok (xAI)', hint: 'XAI_API_KEY / grok-2-vision', envFallback: ['XAI_API_KEY', 'GROK_API_KEY'] },
  claude: { label: 'Claude (Anthropic)', hint: 'ANTHROPIC_API_KEY', envFallback: ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY'] },
  kimi: { label: 'Kimi / Kimmy (Moonshot)', hint: 'MOONSHOT_API_KEY', envFallback: ['MOONSHOT_API_KEY', 'KIMI_API_KEY', 'KIMMY_API_KEY'] },
  gemini: { label: 'Gemini (Google)', hint: 'GEMINI_API_KEY', envFallback: ['GEMINI_API_KEY'] },
};

function FieldValue() {
  return admin.firestore.FieldValue;
}

function maskKey(key) {
  if (!key || typeof key !== 'string') return null;
  const trimmed = key.trim();
  if (trimmed.length < 8) return '••••';
  return `••••${trimmed.slice(-4)}`;
}

function envHas(provider) {
  const meta = PROVIDER_META[provider];
  if (!meta) return false;
  return meta.envFallback.some((name) => Boolean(process.env[name]?.trim()));
}

function envKey(provider) {
  const meta = PROVIDER_META[provider];
  if (!meta) return '';
  for (const name of meta.envFallback) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return '';
}

/** Resolve Grok key for Diagnose — company secret first, then platform env. Never return to clients. */
async function resolveGrokKey(db, companyId) {
  const secretsSnap = await db
    .collection('pros_companies')
    .doc(companyId)
    .collection('secrets')
    .doc('aiKeys')
    .get();
  const secrets = secretsSnap.exists ? secretsSnap.data() : {};
  if (secrets.grok?.key) {
    return { key: String(secrets.grok.key).trim(), source: 'company' };
  }
  const platform = envKey('grok');
  if (platform) return { key: platform, source: 'platform_env' };
  return null;
}

async function requireProsUser(req, res) {
  const user = await verifyHiveAuth(req);
  if (!user?.uid) {
    res.status(401).json({ error: 'Sign in required' });
    return null;
  }
  return user;
}

async function getMembership(db, uid) {
  const snap = await db.collection('pros_memberships').doc(uid).get();
  if (!snap.exists) return null;
  return { uid, ...snap.data() };
}

async function assertCompanyAccess(db, uid, companyId, roles = ['owner', 'manager', 'tech']) {
  const mem = await getMembership(db, uid);
  if (!mem || mem.companyId !== companyId) return null;
  if (!roles.includes(mem.role)) return null;
  return mem;
}

async function requireManager(db, uid) {
  const membership = await getMembership(db, uid);
  if (!membership?.companyId) return null;
  const mem = await assertCompanyAccess(db, uid, membership.companyId, ['owner', 'manager']);
  if (!mem) return null;
  return { ...mem, companyId: membership.companyId };
}


async function logActivity(db, companyId, event) {
  const ref = db.collection('pros_companies').doc(companyId).collection('activity').doc();
  await ref.set({
    ...event,
    id: ref.id,
    createdAt: FieldValue().serverTimestamp(),
  });
}

function serializeJob(id, data) {
  return {
    id,
    title: data.title || '',
    address: data.address || '',
    customerName: data.customerName || '',
    customerPhone: data.customerPhone || '',
    notes: data.notes || '',
    adminNotes: data.adminNotes || '',
    packId: data.packId || 'pool',
    status: data.status || 'queued',
    priority: data.priority || 'normal',
    assigneeUid: data.assigneeUid || null,
    assigneeName: data.assigneeName || null,
    scheduledFor: data.scheduledFor || null,
    fieldNotes: data.fieldNotes || [],
    photos: data.photos || [],
    faultIds: data.faultIds || [],
    createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? null,
    updatedAt: data.updatedAt?.toMillis?.() ?? data.updatedAt ?? null,
    completedAt: data.completedAt?.toMillis?.() ?? data.completedAt ?? null,
  };
}

export function registerProsRoutes(app, db, { isPlatformAdmin, gcsBucket } = {}) {
  const platformAdmin = typeof isPlatformAdmin === 'function' ? isPlatformAdmin : () => false;

  // Bootstrap / me
  app.get('/api/pros/me', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;

      const mem = await getMembership(db, user.uid);
      if (!mem?.companyId) {
        return res.json({
          user: { uid: user.uid, email: user.email },
          company: null,
          membership: null,
          isPlatformAdmin: platformAdmin(user.email),
        });
      }

      const companySnap = await db.collection('pros_companies').doc(mem.companyId).get();
      const company = companySnap.exists ? { id: companySnap.id, ...companySnap.data(), secrets: undefined } : null;
      if (company?.aiKeys) {
        // never leak; strip if somehow present
        delete company.aiKeys;
      }

      return res.json({
        user: { uid: user.uid, email: user.email },
        company,
        membership: mem,
        isPlatformAdmin: platformAdmin(user.email),
      });
    } catch (err) {
      console.error('[pros/me]', err);
      return res.status(500).json({ error: 'Failed to load Pros profile' });
    }
  });

  // Create company (first-time owner)
  app.post('/api/pros/companies', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;

      const existing = await getMembership(db, user.uid);
      if (existing?.companyId) {
        return res.status(400).json({ error: 'You already belong to a company' });
      }

      const { name, tradeType = 'pool', timezone = 'America/Phoenix' } = req.body || {};
      if (!name?.trim()) return res.status(400).json({ error: 'Company name required' });

      const companyRef = db.collection('pros_companies').doc();
      const companyId = companyRef.id;
      const now = FieldValue().serverTimestamp();

      await companyRef.set({
        name: name.trim(),
        tradeType: ['pool', 'electrical', 'property', 'multi'].includes(tradeType) ? tradeType : 'pool',
        timezone,
        ownerUid: user.uid,
        ownerEmail: user.email || null,
        inviteCode: `PROS-${companyId.slice(0, 6).toUpperCase()}`,
        createdAt: now,
        updatedAt: now,
        settings: {
          defaultPack:
            tradeType === 'electrical'
              ? 'electrical'
              : tradeType === 'property'
                ? 'property'
                : 'pool',
          requireJobPhotos: false,
          preferredAiProvider: 'grok',
          // trial | active | past_due | none — Stripe will flip this later
          billingStatus: 'trial',
          locationTrackingEnabled: false,
          locationPingIntervalMinutes: 15,
        },
      });

      await companyRef.collection('members').doc(user.uid).set({
        uid: user.uid,
        email: user.email || null,
        displayName: user.email?.split('@')[0] || 'Owner',
        photoUrl: null,
        role: 'owner',
        status: 'active',
        tradePack:
          tradeType === 'electrical'
            ? 'electrical'
            : tradeType === 'property'
              ? 'property'
              : 'pool',
        joinedAt: now,
      });

      await db.collection('pros_memberships').doc(user.uid).set({
        companyId,
        role: 'owner',
        joinedAt: now,
      });

      await logActivity(db, companyId, {
        type: 'company_created',
        actorUid: user.uid,
        actorEmail: user.email,
        message: `Company “${name.trim()}” created`,
      });

      return res.json({ companyId, inviteCode: `PROS-${companyId.slice(0, 6).toUpperCase()}` });
    } catch (err) {
      console.error('[pros/companies]', err);
      return res.status(500).json({ error: 'Failed to create company' });
    }
  });

  // Join via invite code
  app.post('/api/pros/join', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;

      const existing = await getMembership(db, user.uid);
      if (existing?.companyId) {
        return res.status(400).json({ error: 'Already on a company roster' });
      }

      const code = String(req.body?.inviteCode || '').trim().toUpperCase();
      if (!code) return res.status(400).json({ error: 'Invite code required' });

      const snap = await db.collection('pros_companies').where('inviteCode', '==', code).limit(1).get();
      if (snap.empty) return res.status(404).json({ error: 'Invalid invite code' });

      const companyDoc = snap.docs[0];
      const companyId = companyDoc.id;
      const now = FieldValue().serverTimestamp();
      const role = req.body?.role === 'manager' ? 'manager' : 'tech';

      await companyDoc.ref.collection('members').doc(user.uid).set({
        uid: user.uid,
        email: user.email || null,
        displayName: req.body?.displayName || user.email?.split('@')[0] || 'Tech',
        photoUrl: null,
        role,
        status: 'active',
        tradePack: companyDoc.data().settings?.defaultPack || 'pool',
        joinedAt: now,
      });

      await db.collection('pros_memberships').doc(user.uid).set({
        companyId,
        role,
        joinedAt: now,
      });

      await logActivity(db, companyId, {
        type: 'member_joined',
        actorUid: user.uid,
        actorEmail: user.email,
        message: `${user.email || user.uid} joined as ${role}`,
      });

      return res.json({ companyId, role });
    } catch (err) {
      console.error('[pros/join]', err);
      return res.status(500).json({ error: 'Failed to join company' });
    }
  });

  // Overview stats
  app.get('/api/pros/overview', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await getMembership(db, user.uid);
      if (!mem?.companyId) return res.status(404).json({ error: 'No company' });

      const companyId = mem.companyId;
      const [membersSnap, jobsSnap, activitySnap] = await Promise.all([
        db.collection('pros_companies').doc(companyId).collection('members').get(),
        db.collection('pros_companies').doc(companyId).collection('jobs').get(),
        db
          .collection('pros_companies')
          .doc(companyId)
          .collection('activity')
          .orderBy('createdAt', 'desc')
          .limit(12)
          .get(),
      ]);

      const jobs = jobsSnap.docs.map((d) => serializeJob(d.id, d.data()));
      const byStatus = { queued: 0, in_progress: 0, needs_parts: 0, done: 0 };
      for (const j of jobs) {
        byStatus[j.status] = (byStatus[j.status] || 0) + 1;
      }

      return res.json({
        members: membersSnap.size,
        techs: membersSnap.docs.filter((d) => d.data().role === 'tech').length,
        jobsTotal: jobs.length,
        jobsByStatus: byStatus,
        openJobs: jobs.filter((j) => j.status !== 'done').length,
        recentActivity: activitySnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toMillis?.() ?? null,
          };
        }),
      });
    } catch (err) {
      console.error('[pros/overview]', err);
      return res.status(500).json({ error: 'Failed to load overview' });
    }
  });

  // Team
  app.get('/api/pros/team', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await getMembership(db, user.uid);
      if (!mem?.companyId) return res.status(404).json({ error: 'No company' });

      const snap = await db.collection('pros_companies').doc(mem.companyId).collection('members').get();
      const members = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          ...data,
          joinedAt: data.joinedAt?.toMillis?.() ?? null,
        };
      });
      return res.json({ members });
    } catch (err) {
      console.error('[pros/team]', err);
      return res.status(500).json({ error: 'Failed to load team' });
    }
  });

  app.patch('/api/pros/team/:uid', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const membership = await getMembership(db, user.uid);
      if (!membership?.companyId) return res.status(404).json({ error: 'No company' });
      const mem = await assertCompanyAccess(db, user.uid, membership.companyId, ['owner', 'manager']);
      if (!mem) return res.status(403).json({ error: 'Managers only' });

      const targetUid = req.params.uid;
      const updates = {};
      if (req.body?.role && ['owner', 'manager', 'tech'].includes(req.body.role)) updates.role = req.body.role;
      if (req.body?.status && ['active', 'inactive'].includes(req.body.status)) updates.status = req.body.status;
      if (typeof req.body?.displayName === 'string') updates.displayName = req.body.displayName.trim();
      if (req.body?.tradePack && ['pool', 'electrical', 'property'].includes(req.body.tradePack)) {
        updates.tradePack = req.body.tradePack;
      }
      updates.updatedAt = FieldValue().serverTimestamp();

      await db.collection('pros_companies').doc(mem.companyId).collection('members').doc(targetUid).set(updates, {
        merge: true,
      });

      if (updates.role) {
        await db.collection('pros_memberships').doc(targetUid).set({ role: updates.role }, { merge: true });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('[pros/team patch]', err);
      return res.status(500).json({ error: 'Failed to update member' });
    }
  });

  // Jobs CRUD
  app.get('/api/pros/jobs', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await getMembership(db, user.uid);
      if (!mem?.companyId) return res.status(404).json({ error: 'No company' });

      let query = db.collection('pros_companies').doc(mem.companyId).collection('jobs');
      // techs only see their jobs unless manager
      const snap = await query.get();
      let jobs = snap.docs.map((d) => serializeJob(d.id, d.data()));
      if (mem.role === 'tech') {
        jobs = jobs.filter((j) => j.assigneeUid === user.uid);
      }
      jobs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      return res.json({ jobs });
    } catch (err) {
      console.error('[pros/jobs]', err);
      return res.status(500).json({ error: 'Failed to load jobs' });
    }
  });

  app.post('/api/pros/jobs', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await requireManager(db, user.uid);
      if (!mem) return res.status(403).json({ error: 'Managers only' });

      const {
        title,
        address = '',
        customerName = '',
        customerPhone = '',
        notes = '',
        adminNotes = '',
        packId = 'pool',
        priority = 'normal',
        assigneeUid = null,
        assigneeName = null,
        scheduledFor = null,
      } = req.body || {};

      if (!title?.trim()) return res.status(400).json({ error: 'Title required' });

      const ref = db.collection('pros_companies').doc(mem.companyId).collection('jobs').doc();
      const now = FieldValue().serverTimestamp();
      const payload = {
        title: title.trim(),
        address,
        customerName,
        customerPhone,
        notes,
        adminNotes,
        packId: ['pool', 'electrical', 'property'].includes(packId) ? packId : 'pool',
        priority: ['low', 'normal', 'high', 'emergency'].includes(priority) ? priority : 'normal',
        status: 'queued',
        assigneeUid,
        assigneeName,
        scheduledFor,
        fieldNotes: [],
        photos: [],
        faultIds: [],
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid,
      };
      await ref.set(payload);

      await logActivity(db, mem.companyId, {
        type: 'job_created',
        actorUid: user.uid,
        actorEmail: user.email,
        jobId: ref.id,
        message: `Job created: ${payload.title}`,
      });

      if (assigneeUid) {
        try {
          await createProsNotification(db, mem.companyId, user, {
            title: `New job: ${payload.title}`,
            body: payload.notes || payload.address || 'Open Diagnose for details.',
            type: 'dispatch',
            priority: payload.priority === 'emergency' ? 'urgent' : payload.priority === 'high' ? 'high' : 'normal',
            jobId: ref.id,
            jobTitle: payload.title,
            assigneeUid,
            assigneeName: assigneeName || null,
          });
        } catch (notifyErr) {
          console.warn('[pros/jobs create] notification', notifyErr?.message);
        }
      }

      return res.json({ job: serializeJob(ref.id, { ...payload, createdAt: Date.now(), updatedAt: Date.now() }) });
    } catch (err) {
      console.error('[pros/jobs create]', err);
      return res.status(500).json({ error: 'Failed to create job' });
    }
  });

  app.patch('/api/pros/jobs/:jobId', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const membership = await getMembership(db, user.uid);
      if (!membership?.companyId) return res.status(404).json({ error: 'No company' });

      const jobRef = db.collection('pros_companies').doc(membership.companyId).collection('jobs').doc(req.params.jobId);
      const jobSnap = await jobRef.get();
      if (!jobSnap.exists) return res.status(404).json({ error: 'Job not found' });

      const job = jobSnap.data();
      const isManager = membership.role === 'owner' || membership.role === 'manager';
      const isAssignee = job.assigneeUid === user.uid;
      if (!isManager && !isAssignee) return res.status(403).json({ error: 'Not allowed' });

      const updates = { updatedAt: FieldValue().serverTimestamp() };
      const allowedManager = [
        'title',
        'address',
        'customerName',
        'customerPhone',
        'notes',
        'adminNotes',
        'packId',
        'priority',
        'assigneeUid',
        'assigneeName',
        'scheduledFor',
        'status',
      ];
      const allowedTech = ['status', 'notes'];

      const keys = isManager ? allowedManager : allowedTech;
      for (const key of keys) {
        if (req.body?.[key] !== undefined) updates[key] = req.body[key];
      }
      if (updates.packId && !['pool', 'electrical', 'property'].includes(updates.packId)) {
        updates.packId = 'pool';
      }

      if (req.body?.fieldNote?.trim()) {
        const note = {
          id: `n-${Date.now()}`,
          text: String(req.body.fieldNote).trim(),
          authorUid: user.uid,
          authorEmail: user.email || null,
          createdAt: Date.now(),
        };
        updates.fieldNotes = FieldValue().arrayUnion(note);
      }

      if (req.body?.photoUrl) {
        const photo = {
          id: `p-${Date.now()}`,
          url: String(req.body.photoUrl),
          caption: req.body.photoCaption || '',
          authorUid: user.uid,
          createdAt: Date.now(),
        };
        updates.photos = FieldValue().arrayUnion(photo);
      }

      if (updates.status === 'done') updates.completedAt = FieldValue().serverTimestamp();

      await jobRef.set(updates, { merge: true });
      const next = (await jobRef.get()).data();

      await logActivity(db, membership.companyId, {
        type: 'job_updated',
        actorUid: user.uid,
        actorEmail: user.email,
        jobId: req.params.jobId,
        message: `Job updated: ${next.title}`,
      });

      return res.json({ job: serializeJob(req.params.jobId, next) });
    } catch (err) {
      console.error('[pros/jobs patch]', err);
      return res.status(500).json({ error: 'Failed to update job' });
    }
  });

  app.delete('/api/pros/jobs/:jobId', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await requireManager(db, user.uid);
      if (!mem) return res.status(403).json({ error: 'Managers only' });

      await db.collection('pros_companies').doc(mem.companyId).collection('jobs').doc(req.params.jobId).delete();
      return res.json({ success: true });
    } catch (err) {
      console.error('[pros/jobs delete]', err);
      return res.status(500).json({ error: 'Failed to delete job' });
    }
  });

  // AI provider keys (Grok, Claude, Kimi/Kimmy, Gemini)
  app.get('/api/pros/ai-keys', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await requireManager(db, user.uid);
      if (!mem) return res.status(403).json({ error: 'Managers only' });

      const secretsSnap = await db
        .collection('pros_companies')
        .doc(mem.companyId)
        .collection('secrets')
        .doc('aiKeys')
        .get();
      const secrets = secretsSnap.exists ? secretsSnap.data() : {};
      const companySnap = await db.collection('pros_companies').doc(mem.companyId).get();
      const preferred = companySnap.data()?.settings?.preferredAiProvider || 'grok';

      const providers = PROVIDERS.map((id) => {
        const stored = secrets[id];
        const configured = Boolean(stored?.key) || envHas(id);
        return {
          id,
          label: PROVIDER_META[id].label,
          hint: PROVIDER_META[id].hint,
          configured,
          source: stored?.key ? 'company' : envHas(id) ? 'platform_env' : 'none',
          last4: stored?.key ? maskKey(stored.key) : envHas(id) ? 'env' : null,
          updatedAt: stored?.updatedAt?.toMillis?.() ?? stored?.updatedAt ?? null,
        };
      });

      return res.json({ preferredAiProvider: preferred, providers });
    } catch (err) {
      console.error('[pros/ai-keys get]', err);
      return res.status(500).json({ error: 'Failed to load AI keys' });
    }
  });

  app.post('/api/pros/ai-keys', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await requireManager(db, user.uid);
      if (!mem) return res.status(403).json({ error: 'Managers only' });

      const { provider, apiKey, preferredAiProvider, clear } = req.body || {};
      const secretsRef = db.collection('pros_companies').doc(mem.companyId).collection('secrets').doc('aiKeys');

      if (preferredAiProvider && PROVIDERS.includes(preferredAiProvider)) {
        await db
          .collection('pros_companies')
          .doc(mem.companyId)
          .set(
            {
              settings: { preferredAiProvider },
              updatedAt: FieldValue().serverTimestamp(),
            },
            { merge: true }
          );
      }

      if (provider) {
        if (!PROVIDERS.includes(provider)) {
          return res.status(400).json({ error: 'Invalid provider. Use grok, claude, kimi, or gemini.' });
        }

        if (clear) {
          await secretsRef.set(
            {
              [provider]: FieldValue().delete(),
              updatedAt: FieldValue().serverTimestamp(),
              updatedBy: user.email || user.uid,
            },
            { merge: true }
          );
        } else if (typeof apiKey === 'string' && apiKey.trim()) {
          await secretsRef.set(
            {
              [provider]: {
                key: apiKey.trim(),
                updatedAt: FieldValue().serverTimestamp(),
                updatedBy: user.email || user.uid,
              },
              updatedAt: FieldValue().serverTimestamp(),
              updatedBy: user.email || user.uid,
            },
            { merge: true }
          );
        }
      }

      await logActivity(db, mem.companyId, {
        type: 'ai_keys_updated',
        actorUid: user.uid,
        actorEmail: user.email,
        message: provider
          ? clear
            ? `Cleared ${provider} API key`
            : `Updated ${provider} API key`
          : `Preferred AI set to ${preferredAiProvider}`,
      });

      return res.json({ success: true });
    } catch (err) {
      console.error('[pros/ai-keys post]', err);
      return res.status(500).json({ error: 'Failed to save AI keys' });
    }
  });

  // Company settings
  app.patch('/api/pros/company', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await requireManager(db, user.uid);
      if (!mem) return res.status(403).json({ error: 'Managers only' });

      const updates = { updatedAt: FieldValue().serverTimestamp() };
      if (typeof req.body?.name === 'string' && req.body.name.trim()) updates.name = req.body.name.trim();
      if (['pool', 'electrical', 'property', 'multi'].includes(req.body?.tradeType)) updates.tradeType = req.body.tradeType;
      if (typeof req.body?.timezone === 'string') updates.timezone = req.body.timezone;
      if (req.body?.settings && typeof req.body.settings === 'object') {
        const companySnap = await db.collection('pros_companies').doc(mem.companyId).get();
        const current = companySnap.data()?.settings || {};
        const merged = { ...current, ...req.body.settings };
        if (merged.locationPingIntervalMinutes != null) {
          merged.locationPingIntervalMinutes = normalizePingInterval(merged.locationPingIntervalMinutes);
        }
        updates.settings = merged;
      }

      await db.collection('pros_companies').doc(mem.companyId).set(updates, { merge: true });
      return res.json({ success: true });
    } catch (err) {
      console.error('[pros/company]', err);
      return res.status(500).json({ error: 'Failed to update company' });
    }
  });

  // Rotate invite code
  app.post('/api/pros/invite/rotate', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await requireManager(db, user.uid);
      if (!mem) return res.status(403).json({ error: 'Managers only' });

      const inviteCode = `PROS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      await db.collection('pros_companies').doc(mem.companyId).set(
        { inviteCode, updatedAt: FieldValue().serverTimestamp() },
        { merge: true }
      );
      return res.json({ inviteCode });
    } catch (err) {
      console.error('[pros/invite]', err);
      return res.status(500).json({ error: 'Failed to rotate invite' });
    }
  });

  // AI status for any company member (no secrets)
  app.get('/api/pros/ai-status', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const membership = await getMembership(db, user.uid);
      if (!membership?.companyId) {
        return res.json({
          configured: false,
          provider: null,
          source: 'none',
          billingStatus: 'none',
          aiEnabled: false,
        });
      }

      const companySnap = await db.collection('pros_companies').doc(membership.companyId).get();
      const settings = companySnap.data()?.settings || {};
      const billingStatus = settings.billingStatus || 'trial';
      const billingOk = ['trial', 'active'].includes(billingStatus);
      const resolved = await resolveGrokKey(db, membership.companyId);

      return res.json({
        configured: Boolean(resolved),
        provider: resolved ? 'grok' : null,
        source: resolved?.source || 'none',
        billingStatus,
        aiEnabled: Boolean(resolved) && billingOk,
      });
    } catch (err) {
      console.error('[pros/ai-status]', err);
      return res.status(500).json({ error: 'Failed to load AI status' });
    }
  });

  /**
   * Field Diagnose proxy — runs Grok on the server with company/platform key.
   * Keys never leave the server. Unpaid/suspended companies get 402.
   */
  app.post('/api/pros/diagnose', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const membership = await getMembership(db, user.uid);
      if (!membership?.companyId) {
        return res.status(403).json({
          error: 'Join a Pros company to use live AI',
          code: 'no_company',
        });
      }

      const companySnap = await db.collection('pros_companies').doc(membership.companyId).get();
      const settings = companySnap.data()?.settings || {};
      const billingStatus = settings.billingStatus || 'trial';
      if (!['trial', 'active'].includes(billingStatus)) {
        return res.status(402).json({
          error: 'Subscription required for live AI. Pack library still works offline.',
          code: 'billing_required',
          billingStatus,
        });
      }

      const resolved = await resolveGrokKey(db, membership.companyId);
      if (!resolved?.key) {
        return res.status(503).json({
          error: 'No Grok key configured. Add one in Pros → AI Keys.',
          code: 'no_key',
        });
      }

      const {
        systemPrompt = '',
        localContext = '',
        userText = '',
        messages = [],
        attachment = null,
        packId = 'property',
        model = process.env.GROK_DIAGNOSE_MODEL || process.env.EXPO_PUBLIC_GROK_MODEL || 'grok-2-vision-1212',
      } = req.body || {};

      const tips = await searchKnowledgeTips(db, {
        companyId: membership.companyId,
        query: userText,
        packId,
        limit: 5,
      });
      const tipsContext = formatTipsForPrompt(tips);
      const tipIdsUsed = tips.map((t) => t.id);

      const { grokChatMessages } = await import('./socialPosts/grokProvider.js');

      const history = (Array.isArray(messages) ? messages : [])
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

      const system = [
        String(systemPrompt || '').slice(0, 4000),
        localContext ? `\nLocal library context:\n${String(localContext).slice(0, 2500)}` : '',
        tipsContext,
        '\nCRITICAL: Stay on the equipment the user named. Prefer local library + field knowledge when they match.',
      ].join('');

      const userContent = [];
      userContent.push({
        type: 'text',
        text: String(userText || 'Help me on this job.').slice(0, 4000),
      });
      if (attachment?.base64) {
        const mime = attachment.mimeType || 'image/jpeg';
        userContent.push({
          type: 'image_url',
          image_url: {
            url: `data:${mime};base64,${attachment.base64}`,
          },
        });
      }

      const reply = await grokChatMessages(resolved.key, model, [
        { role: 'system', content: system },
        ...history,
        { role: 'user', content: userContent },
      ]);

      await logActivity(db, membership.companyId, {
        type: 'diagnose_ai',
        actorUid: user.uid,
        actorEmail: user.email,
        message: `Diagnose AI (${resolved.source}) tips=${tipIdsUsed.length}`,
      });

      return res.json({
        reply,
        source: resolved.source,
        provider: 'grok',
        tipIdsUsed,
        tipsUsed: tips.map((t) => ({ id: t.id, scope: t.scope, text: t.text })),
      });
    } catch (err) {
      console.error('[pros/diagnose]', err);
      return res.status(500).json({
        error: err?.message || 'Diagnose AI failed',
        code: 'diagnose_failed',
      });
    }
  });

  // Field knowledge tips for RAG / browsing
  app.get('/api/pros/knowledge/tips', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const membership = await getMembership(db, user.uid);
      if (!membership?.companyId) return res.status(403).json({ error: 'Join a Pros company first' });

      const tips = await searchKnowledgeTips(db, {
        companyId: membership.companyId,
        query: String(req.query?.q || ''),
        packId: req.query?.packId || undefined,
        limit: Number(req.query?.limit) || 8,
      });
      return res.json({ tips });
    } catch (err) {
      console.error('[pros/knowledge tips]', err);
      return res.status(500).json({ error: 'Failed to search tips' });
    }
  });

  // Did-it-work feedback → shop playbook + optional anonymous network
  app.post('/api/pros/knowledge/feedback', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const membership = await getMembership(db, user.uid);
      if (!membership?.companyId) {
        return res.status(403).json({ error: 'Join a Pros company to share field knowledge' });
      }

      const {
        outcome,
        userQuery = '',
        assistantReply = '',
        packId = 'property',
        source = 'local',
        matchedFaultIds = [],
        tipIdsUsed = [],
        messageId = null,
        equipment = [],
        equipmentSymptom = '',
        fixSummary = '',
        shareWithTeam = true,
        shareAnonymously = true,
        tipText = '',
      } = req.body || {};

      if (!['worked', 'didnt'].includes(outcome)) {
        return res.status(400).json({ error: 'outcome must be worked or didnt' });
      }

      const result = await submitKnowledgeFeedback(db, FieldValue(), {
        companyId: membership.companyId,
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
      });

      await logActivity(db, membership.companyId, {
        type: 'knowledge_feedback',
        actorUid: user.uid,
        actorEmail: user.email,
        message: `Field feedback: ${outcome}${result.companyTipId ? ' (saved tip)' : ''}`,
      });

      return res.json({ success: true, ...result });
    } catch (err) {
      console.error('[pros/knowledge feedback]', err);
      return res.status(500).json({ error: 'Failed to save feedback' });
    }
  });

  /**
   * Upload field photos to GCS — returns a public HTTPS URL (no base64 in Firestore).
   */
  app.post('/api/pros/upload', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const membership = await getMembership(db, user.uid);
      if (!membership?.companyId) {
        return res.status(403).json({ error: 'Join a Pros company to upload' });
      }
      if (!gcsBucket) {
        return res.status(503).json({ error: 'Media storage not configured', code: 'no_storage' });
      }

      const { base64, mimeType = 'image/jpeg', folder = 'diagnose' } = req.body || {};
      if (!base64 || typeof base64 !== 'string') {
        return res.status(400).json({ error: 'base64 required' });
      }
      if (base64.length > 12_000_000) {
        return res.status(413).json({ error: 'Image too large' });
      }

      const buffer = Buffer.from(base64, 'base64');
      const ext =
        String(mimeType).includes('png')
          ? 'png'
          : String(mimeType).includes('webp')
            ? 'webp'
            : 'jpg';
      const safeFolder = String(folder || 'diagnose')
        .replace(/[^a-zA-Z0-9/_-]/g, '')
        .slice(0, 80);
      const path = `pros/${membership.companyId}/${safeFolder}/${Date.now()}-${user.uid.slice(0, 8)}.${ext}`;

      const file = gcsBucket.file(path);
      await file.save(buffer, {
        contentType: mimeType || 'image/jpeg',
        resumable: false,
        metadata: { cacheControl: 'public, max-age=31536000' },
      });
      try {
        await file.makePublic();
      } catch {
        // Bucket may already use uniform public access
      }

      const url = `https://storage.googleapis.com/${gcsBucket.name}/${path}`;
      return res.json({ url, path });
    } catch (err) {
      console.error('[pros/upload]', err);
      return res.status(500).json({ error: err?.message || 'Upload failed' });
    }
  });

  /**
   * Transcribe field voice notes (Gemini). Used by Diagnose mic on native / Expo Go.
   */
  app.post('/api/pros/transcribe', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const membership = await getMembership(db, user.uid);
      if (!membership?.companyId) {
        return res.status(403).json({ error: 'Join a Pros company to use voice transcription' });
      }

      const companySnap = await db.collection('pros_companies').doc(membership.companyId).get();
      const settings = companySnap.data()?.settings || {};
      const billingStatus = settings.billingStatus || 'trial';
      if (!['trial', 'active'].includes(billingStatus)) {
        return res.status(402).json({
          error: 'Subscription required for voice transcription',
          code: 'billing_required',
        });
      }

      const geminiKey =
        envKey('gemini') ||
        process.env.GEMINI_API_KEY?.trim() ||
        '';
      // Prefer company gemini key when present
      let key = geminiKey;
      try {
        const secrets = await db
          .collection('pros_companies')
          .doc(membership.companyId)
          .collection('secrets')
          .doc('aiKeys')
          .get();
        const stored = secrets.data()?.gemini;
        const companyGemini =
          (typeof stored === 'object' && stored?.key ? String(stored.key) : '') ||
          (typeof stored === 'string' ? stored : '');
        if (companyGemini.trim()) key = companyGemini.trim();
      } catch {
        // use env
      }

      if (!key) {
        return res.status(503).json({
          error: 'No Gemini key configured for transcription. Add one in Pros → AI Keys.',
          code: 'no_key',
        });
      }

      const { audioBase64, mimeType = 'audio/mp4' } = req.body || {};
      if (!audioBase64 || typeof audioBase64 !== 'string') {
        return res.status(400).json({ error: 'audioBase64 required' });
      }
      if (audioBase64.length > 20_000_000) {
        return res.status(413).json({ error: 'Audio too large' });
      }

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      });

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: String(mimeType || 'audio/mp4'),
            data: audioBase64,
          },
        },
        {
          text: 'Transcribe this field technician voice note into plain English. Return only the transcript, no commentary.',
        },
      ]);

      const text = result?.response?.text?.()?.trim?.() || '';
      if (!text) {
        return res.status(502).json({ error: 'Empty transcription' });
      }

      await logActivity(db, membership.companyId, {
        type: 'diagnose_transcribe',
        actorUid: user.uid,
        actorEmail: user.email,
        message: 'Voice transcription',
      });

      return res.json({ text });
    } catch (err) {
      console.error('[pros/transcribe]', err);
      return res.status(500).json({ error: err?.message || 'Transcription failed' });
    }
  });

  // Knowledge analytics (living knowledge base growth)
  app.get('/api/pros/analytics', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await getMembership(db, user.uid);
      if (!mem?.companyId) return res.status(404).json({ error: 'No company' });
      const analytics = await buildProsAnalytics(db, mem.companyId);
      return res.json(analytics);
    } catch (err) {
      console.error('[pros/analytics]', err);
      return res.status(500).json({ error: 'Failed to load analytics' });
    }
  });

  // Company settings (manager) — shallow merge into settings object
  app.get('/api/pros/settings', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await getMembership(db, user.uid);
      if (!mem?.companyId) return res.status(404).json({ error: 'No company' });
      const snap = await db.collection('pros_companies').doc(mem.companyId).get();
      const settings = snap.data()?.settings || {};
      return res.json({
        settings: {
          locationTrackingEnabled: Boolean(settings.locationTrackingEnabled),
          locationPingIntervalMinutes: normalizePingInterval(settings.locationPingIntervalMinutes),
          requireJobPhotos: Boolean(settings.requireJobPhotos),
          preferredAiProvider: settings.preferredAiProvider || 'grok',
          defaultPack: settings.defaultPack || 'pool',
          billingStatus: settings.billingStatus || 'trial',
        },
      });
    } catch (err) {
      console.error('[pros/settings get]', err);
      return res.status(500).json({ error: 'Failed to load settings' });
    }
  });

  app.patch('/api/pros/settings', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await requireManager(db, user.uid);
      if (!mem) return res.status(403).json({ error: 'Managers only' });

      const incoming = req.body?.settings;
      if (!incoming || typeof incoming !== 'object') {
        return res.status(400).json({ error: 'settings object required' });
      }

      const companySnap = await db.collection('pros_companies').doc(mem.companyId).get();
      const current = companySnap.data()?.settings || {};
      const merged = { ...current, ...incoming };
      if (merged.locationPingIntervalMinutes != null) {
        merged.locationPingIntervalMinutes = normalizePingInterval(merged.locationPingIntervalMinutes);
      }

      await db.collection('pros_companies').doc(mem.companyId).set(
        { settings: merged, updatedAt: FieldValue().serverTimestamp() },
        { merge: true }
      );

      await logActivity(db, mem.companyId, {
        type: 'settings_updated',
        actorUid: user.uid,
        actorEmail: user.email,
        message: 'Company settings updated',
      });

      return res.json({ success: true, settings: merged });
    } catch (err) {
      console.error('[pros/settings patch]', err);
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Periodic GPS ping from field app (not real-time stream)
  app.post('/api/pros/location/ping', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await getMembership(db, user.uid);
      if (!mem?.companyId) return res.status(404).json({ error: 'No company' });

      const memberSnap = await db
        .collection('pros_companies')
        .doc(mem.companyId)
        .collection('members')
        .doc(user.uid)
        .get();
      const member = memberSnap.exists ? memberSnap.data() : null;

      const result = await recordLocationPing(db, mem.companyId, user.uid, req.body || {}, member);
      if (!result.ok) {
        return res.status(result.reason === 'tracking_disabled' ? 403 : 400).json({
          error:
            result.reason === 'tracking_disabled'
              ? 'Location tracking is disabled by your admin'
              : 'Invalid coordinates',
          code: result.reason,
        });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('[pros/location/ping]', err);
      return res.status(500).json({ error: 'Failed to record location' });
    }
  });

  // Where is everybody — manager map data
  app.get('/api/pros/location/team', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await getMembership(db, user.uid);
      if (!mem?.companyId) return res.status(404).json({ error: 'No company' });
      if (mem.role !== 'owner' && mem.role !== 'manager') {
        return res.status(403).json({ error: 'Managers only' });
      }

      const companySnap = await db.collection('pros_companies').doc(mem.companyId).get();
      const settings = companySnap.data()?.settings || {};
      const membersSnap = await db.collection('pros_companies').doc(mem.companyId).collection('members').get();
      const members = membersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      const locations = await listTeamLocations(db, mem.companyId, members);

      return res.json({
        trackingEnabled: Boolean(settings.locationTrackingEnabled),
        pingIntervalMinutes: normalizePingInterval(settings.locationPingIntervalMinutes),
        locations,
      });
    } catch (err) {
      console.error('[pros/location/team]', err);
      return res.status(500).json({ error: 'Failed to load team locations' });
    }
  });

  // Field notifications — dispatch updates to techs
  app.get('/api/pros/notifications', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await getMembership(db, user.uid);
      if (!mem?.companyId) return res.status(404).json({ error: 'No company' });

      const snap = await db
        .collection('pros_companies')
        .doc(mem.companyId)
        .collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(80)
        .get();

      let items = snap.docs.map((d) => serializeNotification(d.id, d.data()));
      if (mem.role === 'tech') {
        items = items.filter((n) => !n.assigneeUid || n.assigneeUid === user.uid);
      }
      return res.json({ notifications: items });
    } catch (err) {
      console.error('[pros/notifications get]', err);
      return res.status(500).json({ error: 'Failed to load notifications' });
    }
  });

  app.post('/api/pros/notifications', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await requireManager(db, user.uid);
      if (!mem) return res.status(403).json({ error: 'Managers only' });

      const created = await createProsNotification(db, mem.companyId, user, req.body || {});
      await logActivity(db, mem.companyId, {
        type: 'notification_sent',
        actorUid: user.uid,
        actorEmail: user.email,
        message: `Notification: ${created.title}`,
      });
      return res.json({ notification: serializeNotification(created.id, created) });
    } catch (err) {
      console.error('[pros/notifications post]', err);
      return res.status(400).json({ error: err?.message || 'Failed to send notification' });
    }
  });

  app.patch('/api/pros/notifications/:id/respond', async (req, res) => {
    try {
      const user = await requireProsUser(req, res);
      if (!user) return;
      const mem = await getMembership(db, user.uid);
      if (!mem?.companyId) return res.status(404).json({ error: 'No company' });

      const result = await respondToNotification(db, mem.companyId, req.params.id, user.uid, req.body || {});
      if (!result.ok) {
        return res.status(result.reason === 'not_found' ? 404 : 403).json({ error: result.reason });
      }

      const tipText = result.response?.tipText;
      if (tipText && result.response?.completed) {
        try {
          await submitKnowledgeFeedback(db, FieldValue(), {
            companyId: mem.companyId,
            user: { uid: user.uid, email: user.email },
            packId: req.body?.packId || 'pool',
            userQuery: `Job update: ${req.body?.jobTitle || ''}`,
            assistantReply: tipText,
            fixSummary: result.response.fixSummary || tipText,
            tipText,
            shareWithTeam: true,
            shareAnonymously: true,
            outcome: 'worked',
            source: 'notification_response',
          });
        } catch (feedbackErr) {
          console.warn('[pros/notifications respond] feedback', feedbackErr?.message);
        }
      }

      if (result.jobId && result.response?.completed) {
        const jobRef = db.collection('pros_companies').doc(mem.companyId).collection('jobs').doc(result.jobId);
        const noteText = result.response.fixSummary || result.response.tipText;
        if (noteText) {
          await jobRef.set(
            {
              fieldNotes: FieldValue().arrayUnion({
                id: `n-${Date.now()}`,
                text: noteText,
                authorUid: user.uid,
                createdAt: Date.now(),
              }),
              status: 'done',
              updatedAt: FieldValue().serverTimestamp(),
              completedAt: FieldValue().serverTimestamp(),
            },
            { merge: true }
          );
        }
      }

      await logActivity(db, mem.companyId, {
        type: 'notification_responded',
        actorUid: user.uid,
        actorEmail: user.email,
        message: result.response?.completed ? 'Marked job update complete' : 'Declined job update',
      });

      return res.json({ success: true, response: result.response });
    } catch (err) {
      console.error('[pros/notifications respond]', err);
      return res.status(500).json({ error: 'Failed to save response' });
    }
  });
}
