import type { User } from 'firebase/auth';

/** Must match server/employeePortal/devAuth.js — local dev only. */
export const LOCAL_EMPLOYEE_DEV_TOKEN = 'aibhive-local-employee-dev';
export const LOCAL_EMPLOYEE_DEV_SESSION = 'aibhive_employee_dev_session';

export function employeePortalDevEnabled() {
  return import.meta.env.DEV && import.meta.env.VITE_EMPLOYEE_PORTAL_DISABLE_DEV !== '1';
}

export function isLocalDevEmployeeUser(user: User | null | undefined) {
  return user?.uid === 'local-dev-employee';
}

export function createLocalDevEmployeeUser(): User {
  return {
    uid: 'local-dev-employee',
    email: 'dev.local@aibhive.com',
    displayName: 'Local dev',
    getIdToken: async () => LOCAL_EMPLOYEE_DEV_TOKEN,
  } as User;
}

export function enterLocalEmployeeDevSession() {
  try {
    sessionStorage.setItem(LOCAL_EMPLOYEE_DEV_SESSION, '1');
    localStorage.setItem(LOCAL_EMPLOYEE_DEV_SESSION, '1');
  } catch {
    /* private mode */
  }
}

export function clearLocalEmployeeDevSession() {
  try {
    sessionStorage.removeItem(LOCAL_EMPLOYEE_DEV_SESSION);
    localStorage.removeItem(LOCAL_EMPLOYEE_DEV_SESSION);
  } catch {
    /* ignore */
  }
}

export function hasLocalEmployeeDevSession() {
  try {
    return (
      sessionStorage.getItem(LOCAL_EMPLOYEE_DEV_SESSION) === '1' ||
      localStorage.getItem(LOCAL_EMPLOYEE_DEV_SESSION) === '1'
    );
  } catch {
    return false;
  }
}
