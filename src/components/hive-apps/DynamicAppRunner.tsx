import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Plus, Check, X, Trash2 } from 'lucide-react';
import type {
  CalculatorConfig, HiveAppPage, HiveAppSpec, InfoConfig, ListConfig, NoteConfig, TrackerConfig,
} from '../../lib/hiveAppTypes';
import { brandFor } from '../../lib/hiveAppBranding';
import { loadPageData, savePageData } from '../../lib/hiveAppStorage';

type Brand = ReturnType<typeof brandFor>;

function evalFormula(formula: string, values: Record<string, number>): number | null {
  let expr = formula || '';
  for (const [id, val] of Object.entries(values)) {
    const safeId = id.replace(/[^a-zA-Z0-9_]/g, '');
    expr = expr.replace(new RegExp(`\\b${safeId}\\b`, 'g'), `(${Number(val) || 0})`);
  }
  if (!/^[\d\s+\-*/().,a-zA-Z_]*$/.test(expr)) return null;
  try {
    const fn = new Function('Math', `"use strict"; return (${expr});`);
    const result = fn(Math);
    if (!Number.isFinite(result)) return null;
    return Math.round(result * 1000) / 1000;
  } catch {
    return null;
  }
}

function ListPage({ appId, pageId, config, brand }: { appId: string; pageId: string; config: ListConfig; brand: Brand }) {
  type Item = { id: string; text: string; done: boolean; at: string };
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const existing = loadPageData<Item[]>(appId, pageId, []);
    if (existing.length === 0 && config.seed?.length) {
      setItems(
        config.seed.map((text, i) => ({
          id: `seed-${i}`,
          text,
          done: false,
          at: new Date().toISOString(),
        }))
      );
    } else {
      setItems(existing);
    }
    setHydrated(true);
  }, [appId, pageId, config.seed]);

  useEffect(() => {
    if (hydrated) savePageData(appId, pageId, items);
  }, [items, hydrated, appId, pageId]);

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setItems((prev) => [{ id: `${Date.now()}`, text, done: false, at: new Date().toISOString() }, ...prev]);
    setDraft('');
  };

  const done = items.filter((i) => i.done).length;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl bg-white/5 border px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50"
          style={{ borderColor: brand.primarySoft }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={config.addPlaceholder || 'Add an item…'}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button
          type="button"
          onClick={add}
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: brand.primary, color: brand.contrastText }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-slate-400 text-sm italic py-4">{config.emptyMessage || 'Nothing here yet.'}</p>
      ) : (
        <>
          <p className="text-slate-500 text-xs font-bold">{done}/{items.length} done</p>
          <ul className="divide-y divide-white/5">
            {items.map((item) => (
              <li key={item.id} className={`flex items-center gap-3 py-3 ${item.done ? 'opacity-55' : ''}`}>
                {config.showCheckbox !== false && (
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))}
                    className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0"
                    style={{
                      borderColor: item.done ? brand.primary : brand.primarySoft,
                      backgroundColor: item.done ? brand.primary : 'transparent',
                    }}
                  >
                    {item.done && <Check className="w-3 h-3" style={{ color: brand.contrastText }} />}
                  </button>
                )}
                <span className={`flex-1 text-sm ${item.done ? 'line-through text-slate-400' : 'text-white'}`}>
                  {item.text}
                </span>
                <button type="button" onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}>
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function TrackerPage({ appId, pageId, config, brand }: { appId: string; pageId: string; config: TrackerConfig; brand: Brand }) {
  type Entry = { id: string; value: number; at: string };
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState(String(config.defaultValue ?? 1));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(loadPageData<Entry[]>(appId, pageId, []));
    setHydrated(true);
  }, [appId, pageId]);

  useEffect(() => {
    if (hydrated) savePageData(appId, pageId, entries);
  }, [entries, hydrated, appId, pageId]);

  const stats = useMemo(() => {
    const window = config.timeframeDays ?? 30;
    const cutoff = Date.now() - window * 24 * 60 * 60 * 1000;
    const recent = entries.filter((e) => Date.parse(e.at) >= cutoff);
    const values = recent.map((e) => e.value);
    if (!values.length) return { value: 0, label: 'No entries yet' };
    const aggregate = config.aggregate || 'sum';
    let v = 0;
    if (aggregate === 'sum') v = values.reduce((a, b) => a + b, 0);
    else if (aggregate === 'avg') v = values.reduce((a, b) => a + b, 0) / values.length;
    else if (aggregate === 'count') v = values.length;
    else v = values[0];
    return { value: Math.round(v * 100) / 100, label: `${aggregate} of last ${window} days` };
  }, [entries, config.aggregate, config.timeframeDays]);

  const add = () => {
    const value = Number(draft);
    if (!Number.isFinite(value)) return;
    setEntries((prev) => [{ id: `${Date.now()}`, value, at: new Date().toISOString() }, ...prev]);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-6 text-center" style={{ backgroundColor: brand.primarySoft, borderColor: brand.primary }}>
        <p className="text-4xl font-extrabold" style={{ color: brand.primaryText }}>
          {stats.value} <span className="text-lg text-slate-400">{config.unit}</span>
        </p>
        <p className="text-slate-400 text-sm mt-1">{stats.label}</p>
      </div>
      <p className="text-slate-400 text-sm font-semibold">{config.prompt || 'Log an entry'}</p>
      <div className="flex gap-2 items-center">
        <input
          className="flex-1 rounded-xl bg-white/5 border px-4 py-3 text-white text-sm outline-none"
          style={{ borderColor: brand.primarySoft }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          inputMode="decimal"
        />
        <span className="text-slate-400 text-sm font-bold">{config.unit}</span>
        <button
          type="button"
          onClick={add}
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: brand.primary, color: brand.contrastText }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <ul className="divide-y divide-white/5 max-h-64 overflow-y-auto">
        {entries.slice(0, 30).map((e) => (
          <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
            <span className="flex-1 text-white font-bold">{e.value} {config.unit}</span>
            <span className="text-slate-500">{new Date(e.at).toLocaleDateString()}</span>
            <button type="button" onClick={() => setEntries((prev) => prev.filter((x) => x.id !== e.id))}>
              <Trash2 className="w-4 h-4 text-slate-500" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotePage({ appId, pageId, config, brand }: { appId: string; pageId: string; config: NoteConfig; brand: Brand }) {
  const [text, setText] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const d = loadPageData<{ text: string }>(appId, pageId, { text: config.seedText || '' });
    setText(d.text ?? config.seedText ?? '');
    setHydrated(true);
  }, [appId, pageId, config.seedText]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => savePageData(appId, pageId, { text }), 400);
    return () => clearTimeout(t);
  }, [text, hydrated, appId, pageId]);

  return (
    <div>
      <textarea
        className="w-full min-h-[280px] rounded-xl bg-white/5 border px-4 py-3 text-white text-sm leading-relaxed outline-none resize-y"
        style={{ borderColor: brand.primarySoft }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={config.placeholder || 'Write whatever you want…'}
      />
      <p className="text-slate-500 text-xs italic mt-2">Saved automatically in your browser.</p>
    </div>
  );
}

function CalculatorPage({ appId, pageId, config, brand }: { appId: string; pageId: string; config: CalculatorConfig; brand: Brand }) {
  const initial = useMemo(() => {
    const map: Record<string, string> = {};
    for (const i of config.inputs) map[i.id] = String(i.defaultValue ?? '');
    return map;
  }, [config.inputs]);

  const [values, setValues] = useState<Record<string, string>>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadPageData<Record<string, string>>(appId, pageId, initial);
    setValues({ ...initial, ...stored });
    setHydrated(true);
  }, [appId, pageId, initial]);

  useEffect(() => {
    if (hydrated) savePageData(appId, pageId, values);
  }, [values, hydrated, appId, pageId]);

  const numericValues = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(values)) out[k] = Number(v) || 0;
    return out;
  }, [values]);

  const result = useMemo(() => evalFormula(config.formula, numericValues), [config.formula, numericValues]);

  return (
    <div className="space-y-4">
      {config.inputs.map((input) => (
        <div key={input.id}>
          <label className="text-white text-sm font-bold block mb-1">
            {input.label} {input.unit ? <span className="text-slate-400 font-normal">({input.unit})</span> : null}
          </label>
          <input
            className="w-full rounded-xl bg-white/5 border px-4 py-3 text-white text-sm outline-none"
            style={{ borderColor: brand.primarySoft }}
            value={values[input.id] ?? ''}
            onChange={(e) => setValues((prev) => ({ ...prev, [input.id]: e.target.value }))}
            inputMode="decimal"
          />
        </div>
      ))}
      <div className="rounded-2xl border p-6 text-center mt-4" style={{ backgroundColor: brand.primarySoft, borderColor: brand.primary }}>
        <p className="text-slate-400 text-sm font-bold">{config.resultLabel || 'Result'}</p>
        <p className="text-4xl font-extrabold mt-1" style={{ color: brand.primaryText }}>
          {result === null ? '—' : result}
          {config.resultUnit ? <span className="text-lg text-slate-400"> {config.resultUnit}</span> : null}
        </p>
      </div>
    </div>
  );
}

function InfoPage({ config, brand }: { config: InfoConfig; brand: Brand }) {
  return (
    <div className="space-y-4">
      {config.body ? <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{config.body}</p> : null}
      {config.bullets?.length ? (
        <ul className="space-y-2">
          {config.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm text-white">
              <span style={{ color: brand.primary }}>•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {config.links?.length ? (
        <div className="space-y-2 pt-2">
          {config.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold"
              style={{ borderColor: brand.primarySoft, color: brand.primaryText }}
            >
              <ExternalLink className="w-4 h-4" />
              {l.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function renderPage(page: HiveAppPage, appId: string, brand: Brand) {
  if (page.type === 'list') return <ListPage appId={appId} pageId={page.id} config={page.config as ListConfig} brand={brand} />;
  if (page.type === 'tracker') return <TrackerPage appId={appId} pageId={page.id} config={page.config as TrackerConfig} brand={brand} />;
  if (page.type === 'note') return <NotePage appId={appId} pageId={page.id} config={page.config as NoteConfig} brand={brand} />;
  if (page.type === 'calculator') return <CalculatorPage appId={appId} pageId={page.id} config={page.config as CalculatorConfig} brand={brand} />;
  return <InfoPage config={page.config as InfoConfig} brand={brand} />;
}

type Props = {
  app: HiveAppSpec;
  compact?: boolean;
  className?: string;
};

export default function DynamicAppRunner({ app, compact, className = '' }: Props) {
  const brand = brandFor(app.theme);
  const pages = Array.isArray(app.pages) ? app.pages : [];
  const [activeIdx, setActiveIdx] = useState(0);
  const page = pages[activeIdx] || pages[0];
  const previewId = `preview-${app.id}`;

  return (
    <div className={`rounded-2xl overflow-hidden border border-white/10 bg-[#0b0f14] ${className}`}>
      <div
        className="px-4 py-4 flex items-center gap-3"
        style={{ background: `linear-gradient(135deg, ${brand.gradientFrom}, ${brand.gradientTo})` }}
      >
        <div>
          <h3 className="font-extrabold text-lg" style={{ color: brand.contrastText }}>{app.title}</h3>
          {app.tagline && !compact ? (
            <p className="text-sm opacity-85" style={{ color: brand.contrastText }}>{app.tagline}</p>
          ) : null}
        </div>
      </div>

      {pages.length > 1 && (
        <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-white/5">
          {pages.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors"
              style={
                idx === activeIdx
                  ? { backgroundColor: brand.primarySoft, color: brand.primaryText, border: `1px solid ${brand.primary}` }
                  : { color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      <div className={`p-4 ${compact ? 'max-h-[420px] overflow-y-auto' : 'min-h-[320px]'}`}>
        {page ? renderPage(page, previewId, brand) : (
          <p className="text-slate-400 text-sm">This app has no pages yet.</p>
        )}
      </div>
    </div>
  );
}
