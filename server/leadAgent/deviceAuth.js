/** Verify phone app requests without Firebase (single-owner deploy). */
import { BUILTIN_DEVICE_SECRET, BUILTIN_OWNER_UID } from './builtinAccess.js';

export function resolveLeadAgentDeviceUser(req) {
  const expected = BUILTIN_DEVICE_SECRET;
  const header = String(req.headers['x-lead-agent-secret'] || '').trim();
  if (!header || header !== expected) return null;
  const uid =
    process.env.LEAD_AGENT_OWNER_UID ||
    String(req.headers['x-lead-agent-uid'] || '').trim() ||
    BUILTIN_OWNER_UID;
  return { uid, email: 'device@lead-agent', device: true };
}

export async function resolveLeadAgentUser(req, verifyHiveAuth) {
  const user = await verifyHiveAuth(req);
  if (user) return user;
  return resolveLeadAgentDeviceUser(req);
}
