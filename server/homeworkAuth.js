import { verifyHiveAuth } from './hiveAuth.js';

/**
 * Require Firebase auth for homework APIs. Sets req.homeworkUser = { uid, email? }.
 */
export async function verifyHomeworkUser(req, res, next) {
  const authUser = await verifyHiveAuth(req);
  if (!authUser?.uid) {
    return res.status(401).json({ error: 'Sign in required to use Homework Bot.' });
  }
  req.homeworkUser = authUser;
  next();
}

/**
 * Owner keys for document queries. Admins may have legacy docs keyed by email.
 * @param {{ uid: string, email?: string }} homeworkUser
 * @param {(email: string) => boolean} isAdminEmail
 */
export function resolveHomeworkOwnerKeys(homeworkUser, isAdminEmail) {
  const keys = [homeworkUser.uid];
  const email = homeworkUser.email?.toLowerCase();
  if (email && isAdminEmail(email)) keys.push(email);
  return [...new Set(keys)];
}
