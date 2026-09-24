import { FieldValue } from 'firebase-admin/firestore';
import { verifyHiveAuth } from '../hiveAuth.js';
import { isAdminEmail } from '../hiveAdmin.js';
import { grokChatMessages } from '../socialPosts/grokProvider.js';
import { buildEmployeeChatSystem } from './knowledge.js';
import {
  isLeadAgentIosInstallReady,
  resolveLeadAgentIosInstallUrl,
} from '../leadAgent/iosInstall.js';

const PROFILE_COL = 'employee_portal_profiles';

function parseEmailList(raw) {
  return String(raw || '')
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function employeeEmailsFromEnv() {
  return parseEmailList(process.env.EMPLOYEE_PORTAL_EMAILS);
}

async function isLeadAgentMember(db, email) {
  const norm = String(email || '').toLowerCase();
  if (!norm) return false;
  const snap = await db.collection('lead_agent_teams').get();
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    if ((data.ownerEmails || []).map((e) => String(e).toLowerCase()).includes(norm)) return true;
    if (data.members?.[norm]) return true;
  }
  return false;
}

export async function isEmployeePortalAllowed(db, { email, uid }) {
  if (!email) return false;
  if (isAdminEmail(email)) return true;
  if (employeeEmailsFromEnv().includes(String(email).toLowerCase())) return true;
  if (process.env.EMPLOYEE_PORTAL_OPEN === '1') return true;
  if (await isLeadAgentMember(db, email)) return true;
  if (db && uid) {
    const snap = await db.collection(PROFILE_COL).doc(uid).get();
    if (snap.exists && snap.data()?.approved === true) return true;
  }
  return false;
}

async function requireEmployee(req, res, db) {
  const user = await verifyHiveAuth(req);
  if (!user) {
    res.status(401).json({ error: 'Sign in with Google to access the employee portal.' });
    return null;
  }
  const allowed = await isEmployeePortalAllowed(db, user);
  if (!allowed) {
    res.status(403).json({
      error: 'Your Google account is not on the employee allowlist yet.',
      hint: 'Ask your manager to invite you to the MacroREI lead list or add your email to EMPLOYEE_PORTAL_EMAILS.',
    });
    return null;
  }
  return user;
}

function grokKey() {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
}

export function registerEmployeePortalRoutes(app, db) {
  app.get('/api/employee-portal/me', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const ref = db.collection(PROFILE_COL).doc(user.uid);
    const snap = await ref.get();
    let profile = snap.exists ? snap.data() : {};
    if (!snap.exists) {
      profile = {
        email: user.email,
        displayName: user.email?.split('@')[0] || 'Team member',
        createdAt: FieldValue.serverTimestamp(),
        dailyChecklist: {},
        shiftNotes: '',
        chatHistory: [],
      };
      await ref.set(profile, { merge: true });
    }
    return res.json({
      ok: true,
      email: user.email,
      uid: user.uid,
      profile: {
        displayName: profile.displayName || user.email,
        dailyChecklist: profile.dailyChecklist || {},
        shiftNotes: profile.shiftNotes || '',
        lastChecklistDate: profile.lastChecklistDate || null,
      },
      links: {
        leadAgentApk: '/api/download/lead-agent',
        leadAgentHealth: '/api/lead-agent/health',
        leadAgentIosInstall: '/api/download/lead-agent-ios',
        leadAgentIosTestFlight: resolveLeadAgentIosInstallUrl(),
        leadAgentIosReady: isLeadAgentIosInstallReady(),
        macrorei: 'https://macrorei.com',
        manydoors: 'https://manydoorsai.com',
        aibhive: 'https://aibhive.com',
      },
    });
  });

  app.put('/api/employee-portal/profile', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const body = req.body || {};
    const patch = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (typeof body.displayName === 'string') patch.displayName = body.displayName.slice(0, 80);
    if (typeof body.shiftNotes === 'string') patch.shiftNotes = body.shiftNotes.slice(0, 8000);
    if (body.dailyChecklist && typeof body.dailyChecklist === 'object') {
      patch.dailyChecklist = body.dailyChecklist;
      patch.lastChecklistDate = body.lastChecklistDate || new Date().toISOString().slice(0, 10);
    }
    await db.collection(PROFILE_COL).doc(user.uid).set(patch, { merge: true });
    const snap = await db.collection(PROFILE_COL).doc(user.uid).get();
    return res.json({ ok: true, profile: snap.data() });
  });

  app.post('/api/employee-portal/chat', async (req, res) => {
    const user = await requireEmployee(req, res, db);
    if (!user) return;
    const message = String(req.body?.message || '').trim().slice(0, 4000);
    if (!message) return res.status(400).json({ error: 'Message required' });
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-12) : [];

    const apiKey = grokKey();
    if (!apiKey) {
      return res.json({
        reply:
          'Grok is not configured on the server yet (XAI_API_KEY). Use the brand playbooks on this page, or email hello@aibhive.com.',
      });
    }

    const messages = [
      { role: 'system', content: buildEmployeeChatSystem(`Employee signed in as ${user.email}.`) },
      ...history.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 2000),
      })),
      { role: 'user', content: message },
    ];

    try {
      const { text } = await grokChatMessages(apiKey, messages, { temperature: 0.35, maxTokens: 700 });
      const reply = String(text || '').trim() || 'I could not generate a reply — try rephrasing.';
      await db
        .collection(PROFILE_COL)
        .doc(user.uid)
        .set({ lastChatAt: FieldValue.serverTimestamp() }, { merge: true });
      return res.json({ reply });
    } catch (e) {
      return res.status(500).json({ error: e.message || 'Chat failed' });
    }
  });
}
