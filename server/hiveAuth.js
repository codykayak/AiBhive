import admin from 'firebase-admin';

/**
 * Verify Firebase ID token from Authorization: Bearer header.
 * @param {import('express').Request} req
 * @returns {Promise<{ uid: string, email?: string } | null>}
 */
export async function verifyHiveAuth(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
