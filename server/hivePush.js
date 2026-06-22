/**
 * Server-side Expo Push helper.
 *
 * Devices register their ExponentPushToken via POST /api/hive/devices.
 * When a Hive build completes, we send a push so the user gets a ding even
 * when the app is backgrounded or closed.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const DEVICES_COLLECTION = 'hive_user_devices';

function isExpoToken(token) {
  return typeof token === 'string' && /^ExponentPushToken\[/.test(token);
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function registerDeviceToken(db, { userId, token, platform }) {
  if (!userId || userId === 'anonymous') {
    throw new Error('userId is required to register a device.');
  }
  if (!isExpoToken(token)) {
    throw new Error('Invalid Expo push token.');
  }
  const id = `${userId}__${token.replace(/[^A-Za-z0-9]/g, '').slice(-24)}`;
  const ref = db.collection(DEVICES_COLLECTION).doc(id);
  await ref.set(
    {
      userId,
      token,
      platform: platform || 'unknown',
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return { id };
}

/** @param {import('firebase-admin/firestore').Firestore} db */
export async function listDeviceTokens(db, userId) {
  if (!userId || userId === 'anonymous') return [];
  const snap = await db
    .collection(DEVICES_COLLECTION)
    .where('userId', '==', userId)
    .get()
    .catch(() => null);
  if (!snap) return [];
  return snap.docs.map((d) => d.data()).filter((d) => isExpoToken(d.token));
}

async function sendExpoPush(messages) {
  if (!messages.length) return { ok: true, sent: 0 };
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`expo push ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return { ok: true, sent: messages.length, result: json };
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {{ userId?: string, slug?: string, title?: string, target?: string, deliverable?: any, id?: string }} task
 * @param {object} after merged task object (after Firestore update)
 */
export async function sendBuildReadyPush(db, task, after = {}) {
  const userId = task.userId;
  const devices = await listDeviceTokens(db, userId);
  if (!devices.length) return { ok: true, sent: 0, reason: 'no_devices' };

  const title = task.title || task.summary || 'Your Hive build';
  const deliverable = task.deliverable || after.deliverable || null;
  const body = deliverable?.kind === 'web_app'
    ? `${title} is live. Tap to open.`
    : `${title} is ready inside AiBhive — tap to open.`;

  const messages = devices.map((d) => ({
    to: d.token,
    title: '✨ Your Hive build is ready',
    body,
    sound: 'default',
    channelId: 'hive-magic',
    priority: 'high',
    data: {
      type: 'hive_build_complete',
      taskId: task.id,
      slug: task.slug,
      target: task.target,
      deliverable,
    },
  }));

  return sendExpoPush(messages);
}

/**
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {{ userId?: string, title?: string, summary?: string, id?: string }} task
 */
export async function sendBuildFailedPush(db, task) {
  const devices = await listDeviceTokens(db, task.userId);
  if (!devices.length) return { ok: true, sent: 0, reason: 'no_devices' };
  const title = task.title || task.summary || 'Hive build';
  const messages = devices.map((d) => ({
    to: d.token,
    title: 'Hive build needs another try',
    body: `${title} hit a snag — open AiBhive and describe a smaller first step.`,
    sound: 'default',
    channelId: 'hive-magic',
    priority: 'high',
    data: {
      type: 'hive_build_failed',
      taskId: task.id,
    },
  }));
  return sendExpoPush(messages);
}

export const HIVE_DEVICES = DEVICES_COLLECTION;
