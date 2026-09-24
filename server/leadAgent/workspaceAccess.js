import { FieldValue } from 'firebase-admin/firestore';
import { BUILTIN_OWNER_UID } from './builtinAccess.js';

export const TEAM_COL = 'lead_agent_teams';

const ROLE_RANK = { viewer: 1, editor: 2, owner: 3 };

function normEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function ownerEmailsFromEnv() {
  const raw = process.env.LEAD_AGENT_OWNER_EMAIL || process.env.LEAD_AGENT_OWNER_EMAILS || 'codykayak@gmail.com';
  return raw
    .split(/[,;\s]+/)
    .map(normEmail)
    .filter(Boolean);
}

export function defaultWorkspaceUid() {
  return process.env.LEAD_AGENT_OWNER_UID || BUILTIN_OWNER_UID;
}

export function roleMeets(have, need) {
  return (ROLE_RANK[have] || 0) >= (ROLE_RANK[need] || 99);
}

async function ensureTeamDoc(db, workspaceUid) {
  const ref = db.collection(TEAM_COL).doc(workspaceUid);
  const snap = await ref.get();
  if (snap.exists) return snap.data();
  const ownerEmails = ownerEmailsFromEnv();
  const payload = {
    workspaceUid,
    ownerUid: workspaceUid,
    ownerEmails,
    members: {},
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await ref.set(payload, { merge: true });
  return payload;
}

function memberRoleFromDoc(team, user) {
  const email = normEmail(user.email);
  if (user.device && user.uid === defaultWorkspaceUid()) return 'owner';
  if (user.uid === team.ownerUid || user.uid === team.workspaceUid) return 'owner';
  if (email && team.ownerEmails?.includes(email)) return 'owner';
  const member = email ? team.members?.[email] : null;
  if (member?.role) return member.role;
  if (email) {
    for (const m of Object.values(team.members || {})) {
      if (m?.firebaseUid === user.uid && m.role) return m.role;
    }
  }
  return null;
}

async function findTeamForUser(db, user) {
  if (user.device) {
    const workspaceUid = user.uid || defaultWorkspaceUid();
    const team = await ensureTeamDoc(db, workspaceUid);
    return { workspaceUid, team, role: 'owner' };
  }

  const email = normEmail(user.email);
  const builtinUid = defaultWorkspaceUid();

  if (email && ownerEmailsFromEnv().includes(email)) {
    const team = await ensureTeamDoc(db, builtinUid);
    await db
      .collection(TEAM_COL)
      .doc(builtinUid)
      .set(
        {
          ownerEmails: ownerEmailsFromEnv(),
          members: {
            [email]: {
              role: 'owner',
              firebaseUid: user.uid,
              joinedAt: FieldValue.serverTimestamp(),
            },
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    return { workspaceUid: builtinUid, team, role: 'owner' };
  }

  const teamsSnap = await db.collection(TEAM_COL).get();
  for (const doc of teamsSnap.docs) {
    const team = doc.data();
    const role = memberRoleFromDoc(team, user);
    if (role) {
      if (email && team.members?.[email] && !team.members[email].firebaseUid) {
        await doc.ref.set(
          {
            [`members.${email}.firebaseUid`]: user.uid,
            [`members.${email}.joinedAt`]: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
      return { workspaceUid: doc.id, team, role };
    }
  }

  const personalUid = user.uid;
  await ensureTeamDoc(db, personalUid);
  await db
    .collection(TEAM_COL)
    .doc(personalUid)
    .set(
      {
        ownerUid: personalUid,
        ownerEmails: email ? [email] : [],
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  return { workspaceUid: personalUid, team: null, role: 'owner' };
}

export async function resolveWorkspaceContext(db, user) {
  if (!user) return null;
  const found = await findTeamForUser(db, user);
  return {
    workspaceUid: found.workspaceUid,
    role: found.role,
    isOwner: found.role === 'owner',
    email: normEmail(user.email) || undefined,
  };
}

export async function inviteTeamMember(db, workspaceUid, inviterRole, emailRaw, role = 'viewer') {
  if (!roleMeets(inviterRole, 'owner')) {
    throw new Error('Only workspace owners can invite teammates');
  }
  const email = normEmail(emailRaw);
  if (!email || !email.includes('@')) throw new Error('Valid email required');
  const memberRole = role === 'editor' ? 'editor' : 'viewer';
  await ensureTeamDoc(db, workspaceUid);
  await db
    .collection(TEAM_COL)
    .doc(workspaceUid)
    .set(
      {
        [`members.${email}`]: {
          role: memberRole,
          invitedAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  return { email, role: memberRole, workspaceUid };
}

export async function listTeamMembers(db, workspaceUid) {
  const snap = await db.collection(TEAM_COL).doc(workspaceUid).get();
  if (!snap.exists) return { ownerEmails: ownerEmailsFromEnv(), members: [] };
  const data = snap.data();
  const members = Object.entries(data.members || {}).map(([email, m]) => ({
    email,
    role: m.role || 'viewer',
    joinedAt: m.joinedAt,
    invitedAt: m.invitedAt,
  }));
  return { ownerEmails: data.ownerEmails || [], members };
}

export async function removeTeamMember(db, workspaceUid, inviterRole, emailRaw) {
  if (!roleMeets(inviterRole, 'owner')) throw new Error('Only workspace owners can remove teammates');
  const email = normEmail(emailRaw);
  if (!email) throw new Error('Valid email required');
  await db
    .collection(TEAM_COL)
    .doc(workspaceUid)
    .update({
      [`members.${email}`]: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  return { removed: email };
}
