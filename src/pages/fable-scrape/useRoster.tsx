import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Eye, Languages, KeyRound, Cpu, CheckCircle2 } from 'lucide-react';
import { useFableApi } from './fableApiContext';
import {
  DEFAULT_ROSTER,
  PROVIDER_LABELS,
  ROLE_META,
  fableGet,
  fablePrefsGet,
  fablePrefsPut,
  type ProviderId,
  type ProviderInfo,
  type RoleKey,
  type Roster,
} from './shared';

const ROLE_ICON: Record<RoleKey, typeof Bot> = { director: Bot, vision: Eye, translator: Languages };

export function useRoster() {
  const api = useFableApi();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [roster, setRoster] = useState<Roster>(DEFAULT_ROSTER);
  const [keys, setKeys] = useState<Partial<Record<ProviderId, string>>>({});
  const [open, setOpen] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(!api.persistPrefs);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fableGet(api, '/providers')
      .then((d) => setProviders(d.providers || []))
      .catch(() => {});
  }, [api]);

  useEffect(() => {
    if (!api.persistPrefs) return;
    fablePrefsGet(api)
      .then((prefs) => {
        if (prefs.roster) setRoster(prefs.roster);
      })
      .catch(() => {})
      .finally(() => setPrefsLoaded(true));
  }, [api]);

  useEffect(() => {
    if (!api.persistPrefs || !prefsLoaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void fablePrefsPut(api, { roster }).catch(() => {});
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [api, roster, prefsLoaded]);

  const byId = useMemo(() => {
    const m: Partial<Record<ProviderId, ProviderInfo>> = {};
    providers.forEach((p) => (m[p.id] = p));
    return m;
  }, [providers]);

  const setRole = (role: RoleKey, patch: Partial<{ provider: ProviderId; model: string }>) =>
    setRoster((prev) => ({ ...prev, [role]: { ...prev[role], ...patch } }));

  const usedProviders = useMemo(() => {
    const set = new Set<ProviderId>();
    (Object.values(roster) as { provider: ProviderId }[]).forEach((r) => set.add(r.provider));
    return [...set];
  }, [roster]);

  const cleanKeys = useMemo(() => {
    const out: Record<string, string> = {};
    Object.entries(keys).forEach(([k, v]) => {
      if (v && v.trim()) out[k] = v.trim();
    });
    return out;
  }, [keys]);

  const summary = (Object.keys(roster) as RoleKey[])
    .map((r) => `${r === 'director' ? '🧠' : r === 'vision' ? '👁' : '🌐'} ${PROVIDER_LABELS[roster[r].provider]}`)
    .join('  ·  ');

  const ui = (
    <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/30 to-transparent p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-white font-bold">
          <Cpu className="w-5 h-5 text-violet-300" />
          AI roster
          <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">— pick a model per job</span>
        </span>
        <span className="text-xs text-violet-200 font-mono">{open ? 'hide' : summary}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ROLE_META.map(({ key, label, desc, vision }) => {
              const Icon = ROLE_ICON[key];
              const options = providers.filter((p) => (vision ? p.vision : true));
              const sel = roster[key];
              const info = byId[sel.provider];
              return (
                <div key={key} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-white text-sm font-bold flex items-center gap-2">
                    <Icon className="w-4 h-4 text-violet-300" /> {label}
                  </p>
                  <p className="text-slate-500 text-[11px] mb-2">{desc}</p>
                  <select
                    value={sel.provider}
                    onChange={(e) => setRole(key, { provider: e.target.value as ProviderId })}
                    className="w-full bg-[#0f1115] border border-white/10 rounded-lg px-2 py-2 text-white text-sm focus:border-violet-400/50 focus:outline-none"
                  >
                    {(options.length ? options : ROLE_META).map((p) => {
                      const id = 'id' in p ? (p.id as ProviderId) : (p as unknown as { key: ProviderId }).key;
                      return (
                        <option key={id} value={id}>
                          {PROVIDER_LABELS[id]}
                          {byId[id]?.hasServerKey ? ' ✓' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <input
                    type="text"
                    value={sel.model}
                    onChange={(e) => setRole(key, { model: e.target.value })}
                    placeholder={info?.[vision ? 'defaultVisionModel' : 'defaultChatModel'] || 'default model'}
                    spellCheck={false}
                    className="w-full mt-2 bg-[#0f1115] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs font-mono placeholder:text-slate-600 focus:border-violet-400/50 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>

          <div>
            <p className="text-slate-300 text-sm font-bold flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-violet-300" /> Your API keys (BYOK — optional, session only)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((id) => {
                const active = usedProviders.includes(id);
                return (
                  <label key={id} className={`block ${active ? '' : 'opacity-60'}`}>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      {PROVIDER_LABELS[id]}
                      {byId[id]?.hasServerKey && (
                        <span className="text-emerald-400 inline-flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> server key
                        </span>
                      )}
                    </span>
                    <input
                      type="password"
                      value={keys[id] || ''}
                      onChange={(e) => setKeys((prev) => ({ ...prev, [id]: e.target.value }))}
                      placeholder={byId[id]?.hasServerKey ? 'using server key' : 'paste key to enable'}
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full mt-0.5 bg-[#0f1115] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs font-mono placeholder:text-slate-600 focus:border-violet-400/50 focus:outline-none"
                    />
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {api.persistPrefs
                ? 'API keys stay in this browser session only (never stored). Your AI roster choices are saved to your account and reload on sign-in. Order is enforced: the Director plans, then Vision reads, then the Translator — findings can then be published to the communal library.'
                : 'Keys are sent only with your requests for this session and never stored. Order is enforced: the Director plans, then Vision reads, then the Translator — findings can then be published to the communal library.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return { roster, keys: cleanKeys, providers, ui };
}
