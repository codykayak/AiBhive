/**
 * Expo push notifications for Pros field dispatch.
 * https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export async function sendExpoPushMessages(messages) {
  if (!messages?.length) return { ok: true, sent: 0 };
  const chunks = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }
  let sent = 0;
  for (const chunk of chunks) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });
      if (res.ok) sent += chunk.length;
      else console.warn('[pros/push] expo error', await res.text());
    } catch (err) {
      console.warn('[pros/push] send failed', err?.message || err);
    }
  }
  return { ok: true, sent };
}

export function buildDispatchPushPayload(notification) {
  const priority = notification.priority === 'urgent' ? 'high' : 'default';
  return {
    title: notification.title,
    body: notification.body || 'Open Diagnose for details.',
    sound: 'default',
    priority,
    data: {
      type: 'pros_dispatch',
      notificationId: notification.id,
      jobId: notification.jobId || null,
      priority: notification.priority || 'normal',
    },
  };
}

export async function collectPushTokensForNotification(db, companyId, notification) {
  const membersCol = db.collection('pros_companies').doc(companyId).collection('members');
  let snap;
  if (notification.assigneeUid) {
    const doc = await membersCol.doc(notification.assigneeUid).get();
    snap = doc.exists ? { docs: [doc] } : { docs: [] };
  } else {
    snap = await membersCol.where('status', '==', 'active').get();
  }

  const tokens = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.role === 'owner') continue;
    const token = data.expoPushToken;
    if (token && typeof token === 'string' && token.startsWith('ExponentPushToken')) {
      tokens.push({ token, uid: doc.id });
    }
  }
  return tokens;
}

export async function pushProsNotification(db, companyId, notification) {
  const targets = await collectPushTokensForNotification(db, companyId, notification);
  if (!targets.length) return { sent: 0 };

  const payload = buildDispatchPushPayload(notification);
  const messages = targets.map((t) => ({
    to: t.token,
    ...payload,
  }));
  const result = await sendExpoPushMessages(messages);
  return { sent: result.sent || 0, targets: targets.length };
}
