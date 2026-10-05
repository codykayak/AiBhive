/** Local employee portal access without Firebase — never on Cloud Run / hosted prod. */

export const LOCAL_EMPLOYEE_DEV_TOKEN = 'aibhive-local-employee-dev';

export function isEmployeePortalDevBypassEnabled() {
  if (process.env.EMPLOYEE_PORTAL_DISABLE_DEV_BYPASS === '1') return false;
  if (process.env.K_SERVICE || process.env.GAE_ENV || process.env.CLOUD_RUN_JOB) return false;
  if (process.env.EMPLOYEE_PORTAL_DEV_BYPASS === '1') return true;
  if (process.env.NODE_ENV === 'production') return false;
  return true;
}

export function resolveLocalDevEmployee(req) {
  if (!isEmployeePortalDevBypassEnabled()) return null;
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token !== LOCAL_EMPLOYEE_DEV_TOKEN) return null;
  return { uid: 'local-dev-employee', email: 'dev.local@aibhive.com', localDev: true };
}

export function isLocalDevEmployeeUser(user) {
  return Boolean(user?.localDev && user.uid === 'local-dev-employee');
}
