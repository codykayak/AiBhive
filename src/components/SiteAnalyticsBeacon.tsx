import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const SESSION_KEY = 'aibhive_analytics_sid';
const QUEUE_KEY = 'aibhive_analytics_q';

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

type AnalyticEvent = {
  type: 'pageview' | 'click' | 'cta' | 'nav' | 'promo' | 'custom';
  path: string;
  label?: string;
  href?: string;
  referrer?: string;
  sessionId?: string;
};

function enqueue(ev: AnalyticEvent) {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    const q: AnalyticEvent[] = raw ? JSON.parse(raw) : [];
    q.push(ev);
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-40)));
  } catch {
    /* ignore */
  }
}

function drainQueue(): AnalyticEvent[] {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    sessionStorage.removeItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function flush(events: AnalyticEvent[]) {
  if (!events.length) return;
  try {
    await fetch('/api/analytics/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events,
        sessionId: getSessionId(),
        referrer: document.referrer || '',
      }),
      keepalive: true,
    });
  } catch {
    events.forEach(enqueue);
  }
}

function track(ev: AnalyticEvent) {
  enqueue({ ...ev, sessionId: getSessionId(), referrer: document.referrer || '' });
}

/** First-party pageview + click analytics for admin dashboard. */
export default function SiteAnalyticsBeacon() {
  const location = useLocation();
  const lastPath = useRef('');

  useEffect(() => {
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/homework')) {
      return;
    }
    if (lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;
    track({ type: 'pageview', path: location.pathname });
    void flush(drainQueue());
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('a,button,[data-track]') as
        | HTMLElement
        | null;
      if (!el) return;
      if (location.pathname.startsWith('/admin')) return;
      const label =
        el.getAttribute('data-track') ||
        el.getAttribute('aria-label') ||
        (el.textContent || '').trim().slice(0, 80);
      const href = el instanceof HTMLAnchorElement ? el.href : '';
      const isCta =
        /start researching|book|get started|sign in|apply|subscribe/i.test(label) ||
        el.className?.toString?.().includes('bee-amber');
      track({
        type: isCta ? 'cta' : el.tagName === 'A' ? 'nav' : 'click',
        path: location.pathname,
        label,
        href,
      });
    };
    document.addEventListener('click', onClick, { capture: true });
    const timer = window.setInterval(() => {
      void flush(drainQueue());
    }, 8000);
    const onHide = () => {
      void flush(drainQueue());
    };
    window.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('click', onClick, { capture: true });
      window.clearInterval(timer);
      window.removeEventListener('visibilitychange', onHide);
      void flush(drainQueue());
    };
  }, [location.pathname]);

  return null;
}
