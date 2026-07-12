/**
 * Admin / owner emails — free Hive credits for testing (research, intel, builds)
 * and platform admin access (/admin, /homework).
 *
 * Keep gmail + outlook Cody accounts in sync so sign-in with either stays free.
 */
const DEFAULT_ADMIN_EMAILS = [
  'codykayak@gmail.com',
  'codykayak@outlook.com',
  'test@test.com',
  'admin@aibhive.com',
];

function parseEmailList(raw) {
  return String(raw || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminEmails() {
  const fromEnv = [
    ...parseEmailList(process.env.ADMIN_EMAILS),
    ...parseEmailList(process.env.HIVE_FREE_BUILD_EMAILS),
  ];
  return [...new Set([...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...fromEnv])];
}

const ADMIN_EMAILS = getAdminEmails();

/** Platform admin (/admin, /homework). */
export function isAdminEmail(email) {
  return Boolean(email && ADMIN_EMAILS.includes(String(email).toLowerCase()));
}

/** @deprecated use isAdminEmail — same allowlist */
export function isHiveFreeBuildEmail(email) {
  return isAdminEmail(email);
}

/** Same allowlist — admins get free Hive credits for testing (research, intel, builds). */
export function isHiveBillingExemptEmail(email) {
  return isAdminEmail(email);
}

/** @param {import('firebase-admin/firestore').Firestore} [db] */
export async function isHiveBillingExempt(db, { userId, email } = {}) {
  if (isHiveBillingExemptEmail(email)) return true;
  if (!db || !userId) return false;
  try {
    const snap = await db.collection('hive_users').doc(userId).get();
    const data = snap.data() || {};
    if (isHiveBillingExemptEmail(data.email)) return true;
    // Also honor explicit flag for testing accounts
    if (data.billingExempt === true || data.adminFree === true) return true;
    return false;
  } catch {
    return false;
  }
}
