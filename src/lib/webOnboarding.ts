const ONBOARDING_KEY = 'aibhive_web_onboarding_v1';
const TOUR_KEY = 'aibhive_web_tour_v1';

export function isWebOnboardingDone(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1';
  } catch {
    return false;
  }
}

export function markWebOnboardingDone() {
  try {
    localStorage.setItem(ONBOARDING_KEY, '1');
  } catch {
    // ignore
  }
}

export function shouldShowSiteTour(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) !== '1';
  } catch {
    return true;
  }
}

export function markSiteTourDone() {
  try {
    localStorage.setItem(TOUR_KEY, '1');
  } catch {
    // ignore
  }
}
