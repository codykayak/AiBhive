import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Wifi,
  Server,
  KeyRound,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
} from 'lucide-react';
import type { RouteMode, Routing } from './shared';
import { useFableApi } from './fableApiContext';
import { fableGet, fablePost, fablePrefsGet, fablePrefsPut } from './shared';

type Provider = 'dataimpulse' | 'iproyal' | 'webshare' | 'generic';

const PROVIDER_PRESETS: Record<Provider, { label: string; template: string }> = {
  dataimpulse: { label: 'DataImpulse', template: 'http://USERNAME:PASSWORD@gw.dataimpulse.com:823' },
  iproyal: { label: 'IPRoyal', template: 'http://USERNAME:PASSWORD@geo.iproyal.com:12321' },
  webshare: { label: 'Webshare', template: 'http://USERNAME:PASSWORD@p.webshare.io:80' },
  generic: { label: 'Other / generic', template: 'http://USERNAME:PASSWORD@HOST:PORT' },
};

export function useRouting() {
  const api = useFableApi();
  const [routeMode, setRouteMode] = useState<RouteMode>('browser');
  const [provider, setProvider] = useState<Provider>('dataimpulse');
  const [proxyUrl, setProxyUrl] = useState('');
  const [proxyStatus, setProxyStatus] = useState<{ available: boolean; rotating: boolean; count: number } | null>(null);
  const [proxyTest, setProxyTest] = useState<{ testing: boolean; ip?: string; error?: string }>({ testing: false });
  const [ackMyIp, setAckMyIp] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(!api.persistPrefs);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fableGet(api, '/status')
      .then((d) => setProxyStatus(d.residentialProxy || null))
      .catch(() => {});
  }, [api]);

  useEffect(() => {
    if (!api.persistPrefs) return;
    fablePrefsGet(api)
      .then((prefs) => {
        if (prefs.routing?.mode) setRouteMode(prefs.routing.mode);
        if (prefs.routing?.proxyProvider) setProvider(prefs.routing.proxyProvider);
        if (prefs.routing?.ackMyIp) setAckMyIp(true);
      })
      .catch(() => {})
      .finally(() => setPrefsLoaded(true));
  }, [api]);

  useEffect(() => {
    if (!api.persistPrefs || !prefsLoaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void fablePrefsPut(api, {
        routing: { mode: routeMode, proxyProvider: provider, ackMyIp },
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [api, routeMode, provider, ackMyIp, prefsLoaded]);

  const routing: Routing = useMemo(
    () => ({ mode: routeMode, proxyUrl: routeMode === 'custom' ? proxyUrl.trim() : undefined }),
    [routeMode, proxyUrl]
  );

  const routingReady =
    routeMode === 'server' ||
    (routeMode === 'browser' && ackMyIp) ||
    (routeMode === 'residential' && !!proxyStatus?.available) ||
    (routeMode === 'custom' && proxyUrl.trim().length > 8);

  const applyProvider = (p: Provider) => {
    setProvider(p);
    if (!proxyUrl.trim() || Object.values(PROVIDER_PRESETS).some((v) => v.template === proxyUrl.trim())) {
      setProxyUrl(PROVIDER_PRESETS[p].template);
    }
  };

  const testProxy = async () => {
    setProxyTest({ testing: true });
    try {
      const data = await fablePost(api, '/test-proxy', { routing });
      setProxyTest({ testing: false, ip: data.exitIp });
    } catch (err) {
      setProxyTest({ testing: false, error: err instanceof Error ? err.message : 'Proxy test failed.' });
    }
  };

  const notReadyMessage =
    routeMode === 'browser'
      ? 'Please acknowledge the My-IP risk note first.'
      : routeMode === 'residential'
        ? 'Residential proxies are not configured on this server. Choose another route.'
        : 'Enter a valid proxy URL for custom routing.';

  const ui = (
    <div>
      <p className="text-slate-300 text-sm font-bold mb-2 flex items-center gap-2">
        <Wifi className="w-4 h-4 text-bee-amber" /> IP routing — whose address the site sees
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {([
          ['browser', 'My IP (browser)', 'Free', Wifi],
          ['residential', 'Residential (rotating)', proxyStatus?.available ? 'Ready' : 'Not set up', Server],
          ['custom', 'Custom proxy', 'Your provider', KeyRound],
          ['server', 'Server (host IP)', 'Advanced', Server],
        ] as [RouteMode, string, string, typeof Wifi][]).map(([id, label, tag, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setRouteMode(id)}
            className={`px-3 py-3 rounded-xl text-left border transition-all ${
              routeMode === id ? 'border-bee-amber bg-bee-amber/10' : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <span className={`flex items-center gap-2 text-sm font-bold ${routeMode === id ? 'text-bee-amber' : 'text-white'}`}>
              <Icon className="w-4 h-4" />
              {label}
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">{tag}</span>
          </button>
        ))}
      </div>

      {routeMode === 'browser' && (
        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-amber-300 font-bold flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4" /> Using your own IP — please read
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-[13px] text-amber-100/90">
            <li>The target site can see and log <strong>your</strong> real IP address.</li>
            <li>Heavy scraping may get <strong>your</strong> IP rate-limited or banned by that site.</li>
            <li>Activity may be tied to you by your ISP and the target.</li>
            <li>Only scrape content you're permitted to, and respect each site's terms.</li>
            <li>Some sites block browser (CORS) downloads — those items are flagged; switch routing for them.</li>
          </ul>
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input type="checkbox" checked={ackMyIp} onChange={(e) => setAckMyIp(e.target.checked)} className="accent-bee-amber w-4 h-4" />
            <span className="text-amber-100 text-sm font-medium">I understand the risks of using my own IP.</span>
          </label>
        </div>
      )}

      {routeMode === 'residential' && (
        <p className="mt-3 text-sm text-slate-400">
          {proxyStatus?.available
            ? `AiBhive residential pool active${proxyStatus.rotating ? ' (rotating IPs)' : ''}. The host IP is never exposed.`
            : 'No residential pool configured on this server. Set FABLE_SCRAPE_RESIDENTIAL_PROXY, or use Custom proxy / My IP.'}
        </p>
      )}

      {routeMode === 'custom' && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PROVIDER_PRESETS) as Provider[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => applyProvider(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                  provider === p ? 'border-bee-amber bg-bee-amber/10 text-bee-amber' : 'border-white/10 bg-white/5 text-slate-400'
                }`}
              >
                {PROVIDER_PRESETS[p].label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
            placeholder="http://USERNAME:PASSWORD@gateway.provider.com:PORT"
            spellCheck={false}
            className="w-full bg-[#0f1115]/70 border border-white/10 rounded-lg px-3 py-2.5 text-white font-mono text-sm placeholder:text-slate-600 focus:border-bee-amber/50 focus:outline-none"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={testProxy}
              disabled={proxyTest.testing || proxyUrl.trim().length < 8}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 disabled:opacity-40 flex items-center gap-2"
            >
              {proxyTest.testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Test connection
            </button>
            {proxyTest.ip && (
              <span className="text-sm text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Exit IP: {proxyTest.ip}
              </span>
            )}
            {proxyTest.error && (
              <span className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {proxyTest.error}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Works with DataImpulse, IPRoyal, Webshare, and any HTTP(S) residential proxy. Credentials are used for this
            session only.
          </p>
        </div>
      )}
    </div>
  );

  return { routing, routeMode, routingReady, notReadyMessage, ui };
}
