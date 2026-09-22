import * as WebBrowser from 'expo-web-browser';
import { getApiBase, setAuthToken } from './storage';

WebBrowser.maybeCompleteAuthSession();

function parseIdTokenFromRedirect(url: string): string | null {
  const match = url.match(/[?&]idToken=([^&]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Opens aibhive.com Google sign-in and stores Firebase ID token for API calls. */
export async function signInWithGoogleMobile(): Promise<string> {
  const base = (await getApiBase()).replace(/\/$/, '');
  const redirect = 'leadagent://auth';
  const authUrl = `${base}/api/lead-agent/auth/mobile?redirect=${encodeURIComponent(redirect)}`;
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirect);
  if (result.type !== 'success' || !result.url) {
    throw new Error('Sign-in cancelled');
  }
  const token = parseIdTokenFromRedirect(result.url);
  if (!token) throw new Error('No sign-in token returned — try again');
  await setAuthToken(token);
  return token;
}

export async function signOutGoogleMobile() {
  await setAuthToken(null);
}
