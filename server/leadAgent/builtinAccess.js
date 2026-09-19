/** Shared phone-app auth (no manual setup). Override via env in production if desired. */
export const BUILTIN_DEVICE_SECRET =
  process.env.LEAD_AGENT_DEVICE_SECRET || 'aibhive-lead-agent-device-v1-c7f3';

export const BUILTIN_OWNER_UID =
  process.env.LEAD_AGENT_OWNER_UID || 'aibhive-lead-agent-workspace';
