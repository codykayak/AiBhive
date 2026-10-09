import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Activity,
  ClipboardPaste,
  LayoutDashboard,
  List,
  Loader2,
  Phone,
  PhoneOff,
  Play,
  Radio,
  RefreshCw,
  Send,
  Settings2,
  SkipForward,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import {
  fetchEmployeeDesk,
  fetchEmployeeVoiceToken,
  fetchLeadThread,
  importEmployeeLeads,
  logEmployeeCall,
  textNextLead,
  textSelectedLeads,
  type DeskLead,
  type EmployeeDeskSnapshot,
  type LeadThread,
} from '../../lib/employeePortalApi';
import { LEAD_IMPORT_SAMPLE, parseLeadCsv, parseLeadFile, type LeadImportParse, type ParsedLeadRow } from '../../lib/leadListImport';

const DISPOSITIONS = [
  { id: 'talked', label: 'Talked' },
  { id: 'voicemail', label: 'Voicemail' },
  { id: 'no_answer', label: 'No answer' },
  { id: 'callback', label: 'Call back' },
  { id: 'skipped', label: 'Skip' },
] as const;

type Filter = 'all' | 'open' | 'not_texted' | 'texted' | 'callback' | 'needs_human';

type OpsPanel = 'overview' | 'dialer' | 'leads' | 'import' | 'tuning' | 'lines';

type Props = { user: User };

const OPS_NAV: { id: OpsPanel; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Command center', icon: LayoutDashboard },
  { id: 'dialer', label: 'Live dialer', icon: Phone },
  { id: 'leads', label: 'Lead board', icon: List },
  { id: 'import', label: 'List import', icon: Upload },
  { id: 'tuning', label: 'Automation & SMS', icon: Settings2 },
  { id: 'lines', label: 'Lines & Grok voice', icon: Radio },
];

function formatSyncedAt(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
  } catch {
    return iso;
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function textLabel(lead: DeskLead) {
  if (lead.textCount == null) return lead.status === 'texted' ? 'yes' : '0';
  return String(lead.textCount);
}

function isOpenLead(lead: DeskLead) {
  return !lead.optedOut && (lead.status === 'new' || lead.status === 'callback');
}

function ownerFirstPrefix(name: string) {
  const raw = name.trim();
  if (!raw) return '';
  const parts = raw.split(/\s*(?:&| and )\s*/i).map((p) => p.trim()).filter(Boolean);
  const firsts = parts.map((p) => p.split(/\s+/)[0]).filter(Boolean);
  if (!firsts.length) return '';
  if (firsts.length === 1) return ` ${firsts[0]},`;
  if (firsts.length === 2) return ` ${firsts[0]} and ${firsts[1]},`;
  return ` ${firsts.slice(0, -1).join(', ')} and ${firsts[firsts.length - 1]},`;
}

function draftSms(business: EmployeeDeskSnapshot['business'] | undefined, lead: DeskLead) {
  const address = lead.propertyAddress.trim() || 'your property';
  const tpl =
    business?.greeting ||
    "my name is Cody, I'm a real estate investor in Eugene. I'm wondering if you still own the property at {address} and if you may be interested in selling it?";
  const prefix = ownerFirstPrefix(lead.name || '');
  let body = `Hi${prefix} ${tpl.replace(/\{address\}/gi, address)}`.replace(/\s+/g, ' ').trim();
  return body.slice(0, 480);
}

function applyParse(setters: {
  setError: (v: string) => void;
  setNotice: (v: string) => void;
  setPreview: (v: ParsedLeadRow[] | null) => void;
  setPreviewSkipped: (v: number) => void;
  setPreviewErrors: (v: string[]) => void;
}) {
  return (parsed: LeadImportParse) => {
    setters.setPreviewErrors(parsed.errors);
    if (!parsed.rows.length) {
      setters.setPreview(null);
      setters.setError(parsed.errors.join(' ') || 'No valid leads found in that file.');
      return;
    }
    setters.setError(parsed.errors.length ? parsed.errors.join(' ') : '');
    setters.setPreview(parsed.rows);
    setters.setPreviewSkipped(parsed.skipped);
    setters.setNotice(
      `${parsed.rows.length} lead${parsed.rows.length === 1 ? '' : 's'} ready to import${parsed.skipped ? ` · ${parsed.skipped} row${parsed.skipped === 1 ? '' : 's'} skipped` : ''}.`,
    );
  };
}

export default function EmployeeDesk({ user }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [businessId, setBusinessId] = useState('macrorei');
  const [desk, setDesk] = useState<EmployeeDeskSnapshot | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'live'>('idle');
  const [hangup, setHangup] = useState<(() => void) | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<ParsedLeadRow[] | null>(null);
  const [previewSkipped, setPreviewSkipped] = useState(0);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [thread, setThread] = useState<LeadThread | null>(null);
  const [powerMode, setPowerMode] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [smsDraft, setSmsDraft] = useState('');
  const [panel, setPanel] = useState<OpsPanel>('overview');
  const [lastSyncedAt, setLastSyncedAt] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [statusSort, setStatusSort] = useState<'queue' | 'recent' | 'name'>('queue');

  const handleParse = useMemo(
    () => applyParse({ setError, setNotice, setPreview, setPreviewSkipped, setPreviewErrors }),
    [],
  );

  const reload = useCallback(async () => {
    const snap = await fetchEmployeeDesk(user, businessId);
    setDesk(snap);
    setLastSyncedAt(snap.syncedAt || new Date().toISOString());
    return snap;
  }, [user, businessId]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      void reload().catch(() => {});
    }, 45_000);
    return () => window.clearInterval(id);
  }, [autoRefresh, reload]);

  useEffect(() => {
    let cancelled = false;
    setError('');
    setSelected({});
    setOpenId(null);
    setThread(null);
    setPreview(null);
    void reload().catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load the floor');
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const openQueue = useMemo(() => (desk?.leads || []).filter(isOpenLead), [desk]);

  const openLead = async (leadId: string) => {
    setOpenId(leadId);
    setThread(null);
    const lead = desk?.leads.find((l) => l.id === leadId);
    if (lead) setSmsDraft(draftSms(desk?.business, lead));
    try {
      const detail = await fetchLeadThread(user, businessId, leadId);
      setThread(detail);
      setSmsDraft(draftSms(desk?.business, detail.lead));
      setDesk((prev) =>
        prev
          ? {
              ...prev,
              leads: prev.leads.map((l) => (l.id === leadId ? { ...l, textCount: detail.textCount } : l)),
            }
          : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open lead');
    }
  };

  const advancePowerDial = (snap: EmployeeDeskSnapshot | null) => {
    if (!powerMode || !snap) return;
    const next = snap.leads.filter(isOpenLead)[0];
    if (next) void openLead(next.id);
    else {
      setOpenId(null);
      setThread(null);
      setNotice('Queue clear — nice work today.');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (desk?.leads || []).filter((lead) => {
      if (filter === 'open' && !isOpenLead(lead)) return false;
      if (filter === 'texted' && !(lead.status === 'texted' || (lead.textCount || 0) > 0)) return false;
      if (filter === 'not_texted' && (lead.status === 'texted' || (lead.textCount || 0) > 0)) return false;
      if (filter === 'callback' && lead.status !== 'callback') return false;
      if (filter === 'needs_human' && !lead.needsHuman) return false;
      if (!q) return true;
      return `${lead.name} ${lead.phone} ${lead.propertyAddress}`.toLowerCase().includes(q);
    });
  }, [desk, filter, query]);

  const selectedIds = filtered.filter((l) => selected[l.id]).map((l) => l.id);

  const ingestFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setNotice('');
    setBusy('parse');
    try {
      handleParse(await parseLeadFile(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file');
      setPreview(null);
    } finally {
      setBusy('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const ingestPaste = () => {
    setError('');
    setNotice('');
    setBusy('parse');
    try {
      handleParse(parseLeadCsv(pasteText));
      setPasteOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not parse pasted text');
    } finally {
      setBusy('');
    }
  };

  const commitImport = async () => {
    if (!preview?.length) return;
    setBusy('import');
    setError('');
    try {
      const result = await importEmployeeLeads(user, businessId, preview);
      setNotice(`Imported ${result.imported}. ${result.duplicates} already on the list. ${result.skipped} skipped.`);
      setPreview(null);
      setPreviewErrors([]);
      const snap = await reload();
      if (powerMode && !openId) advancePowerDial(snap);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setBusy('');
    }
  };

  const textChosen = async (ids = selectedIds) => {
    if (!ids.length) return;
    setBusy('batch');
    setError('');
    try {
      let sent = 0;
      for (let i = 0; i < ids.length; i += 15) {
        const chunk = ids.slice(i, i + 15);
        setNotice(`Texting ${Math.min(i + chunk.length, ids.length)} of ${ids.length}…`);
        const result = await textSelectedLeads(user, businessId, chunk);
        sent += result.sent.length;
        if (result.failed.length) {
          setError(result.failed[0]?.error || 'Some texts did not send');
          break;
        }
      }
      setNotice(`Sent ${sent} text${sent === 1 ? '' : 's'}.`);
      setSelected({});
      await reload();
      if (openId) await openLead(openId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Text failed');
    } finally {
      setBusy('');
    }
  };

  const textHead = async (count: number) => {
    const ids = openQueue.slice(0, count).map((l) => l.id);
    if (!ids.length) {
      setError('No open leads in the queue.');
      return;
    }
    setSelected(Object.fromEntries(ids.map((id) => [id, true])));
    await textChosen(ids);
  };

  const markCall = async (lead: DeskLead, disposition: string) => {
    setBusy('log');
    setError('');
    try {
      await logEmployeeCall(user, { businessId, leadId: lead.id, disposition, notes: callNotes.trim() || undefined });
      setCallNotes('');
      const snap = await reload();
      if (powerMode) advancePowerDial(snap);
      else await openLead(lead.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not log the call');
    } finally {
      setBusy('');
    }
  };

  const startCall = async (lead: DeskLead) => {
    setError('');
    setCallState('connecting');
    try {
      const token = await fetchEmployeeVoiceToken(user);
      if (!token.ready || !token.token) {
        setCallState('idle');
        setError(token.hint || 'Laptop calling is not connected yet. Log the outcome and the list still moves.');
        return;
      }
      const { Device } = await import('@twilio/voice-sdk');
      const device = new Device(token.token, { logLevel: 'error' });
      const call = await device.connect({ params: { To: lead.phone } });
      setCallState('live');
      setHangup(() => () => {
        call.disconnect();
        device.destroy();
      });
      call.on('disconnect', () => {
        setCallState('idle');
        setHangup(null);
        device.destroy();
      });
    } catch (e) {
      setCallState('idle');
      setError(e instanceof Error ? e.message : 'Call failed');
    }
  };

  const textOne = async (lead: DeskLead) => {
    setBusy('text');
    setError('');
    try {
      const result = await textSelectedLeads(user, businessId, [lead.id]);
      if (!result.sent.length) throw new Error(result.failed[0]?.error || 'Text did not send');
      setNotice(`Texted ${lead.name || lead.phone}.`);
      await reload();
      await openLead(lead.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Text failed');
    } finally {
      setBusy('');
    }
  };

  const startPowerDial = () => {
    setPowerMode(true);
    const first = openQueue[0] || desk?.queue.current;
    if (first) void openLead(first.id);
    else setError('Import a list first — need phone and property address on each row.');
  };

  const sortedLeads = useMemo(() => {
    const list = [...filtered];
    if (statusSort === 'name') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (statusSort === 'recent') {
      list.sort((a, b) => String(b.lastContactAt || '').localeCompare(String(a.lastContactAt || '')));
    }
    return list;
  }, [filtered, statusSort]);

  if (!desk && !error) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-16">
        <Loader2 className="w-5 h-5 animate-spin" /> Opening the floor…
      </div>
    );
  }

  const active = thread?.lead || desk?.leads.find((l) => l.id === openId) || desk?.queue.current || null;
  const allFilteredSelected = filtered.length > 0 && filtered.every((l) => selected[l.id]);
  const quotaPct = desk ? Math.min(100, Math.round((desk.quota.sent / Math.max(desk.quota.limit, 1)) * 100)) : 0;
  const queuePct = desk?.queue.total ? Math.round(((desk.queue.total - desk.queue.remaining) / desk.queue.total) * 100) : 0;
  const analytics = desk?.analytics;
  const infra = desk?.infrastructure;
  const tuning = desk?.tuning;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aibhive.com';

  const StatusPill = ({ ok, label }: { ok: boolean; label: string }) => (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
        ok ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/15 text-amber-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      {label}
    </span>
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-[#060a12] overflow-hidden min-h-[calc(100vh-12rem)] flex flex-col">
      <header className="border-b border-white/10 bg-black/50 px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-bee-amber text-[10px] font-bold uppercase tracking-[0.28em]">Call center operations</p>
            <h2 className="text-2xl md:text-3xl font-black mt-1">{desk?.business.name || 'Command center'}</h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              {desk?.business.tagline} · {desk?.queue.remaining ?? 0} open · {desk?.queue.total ?? 0} on list
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-slate-500">
              Active list
              <select
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                className="mt-1 block rounded-xl bg-black/70 border border-white/15 px-3 py-2 text-sm text-white min-w-[160px]"
              >
                {(desk?.businesses || []).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => void reload()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm font-bold hover:bg-white/5"
            >
              <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> Sync
            </button>
            <label className="flex items-center gap-2 text-xs text-slate-400 pb-2">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              Auto-sync 45s
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <StatusPill ok={Boolean(desk?.line.smsReady)} label="Twilio SMS" />
          <StatusPill ok={Boolean(desk?.line.voiceReady)} label="Browser dialer" />
          <StatusPill ok={Boolean(desk?.quota.ok)} label={desk?.quota.ok ? 'SMS quota OK' : 'SMS cap'} />
          <StatusPill ok={(analytics?.open ?? 0) > 0} label={`${analytics?.open ?? 0} open leads`} />
          <span className="text-[11px] text-slate-500 ml-auto">Last sync: {formatSyncedAt(lastSyncedAt)}</span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        <nav className="lg:w-52 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/30 p-2 flex lg:flex-col gap-1 overflow-x-auto">
          {OPS_NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPanel(id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold whitespace-nowrap ${
                panel === id ? 'bg-bee-amber text-bee-black' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-5">
      {error ? <p className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">{error}</p> : null}
      {notice ? <p className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">{notice}</p> : null}

      {panel === 'overview' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            {[
              ['List total', analytics?.total ?? desk?.queue.total ?? 0],
              ['Open queue', analytics?.open ?? desk?.queue.remaining ?? 0],
              ['Texted', analytics?.texted ?? 0],
              ['Not texted', analytics?.notTexted ?? 0],
              ['Callbacks', analytics?.callbacks ?? 0],
              ['Replied', analytics?.replied ?? 0],
              ['Needs human', analytics?.needsHuman ?? 0],
              ['Opted out', analytics?.optedOut ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
                <p className="text-xl font-black mt-1">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <section className="rounded-2xl border border-white/10 p-4">
              <h3 className="font-bold flex items-center gap-2"><Activity className="w-4 h-4 text-bee-amber" /> Your shift today</h3>
              <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                <p>Calls: <strong>{desk?.today.calls ?? 0}</strong></p>
                <p>Texts: <strong>{desk?.today.texts ?? 0}</strong></p>
                <p>Last disposition: <strong>{desk?.today.lastDisposition || '—'}</strong></p>
                <p>SMS sent: <strong>{desk?.quota.sent}/{desk?.quota.limit}</strong> (suggested {desk?.quota.suggested ?? tuning?.dailySmsSuggested ?? '—'})</p>
              </div>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase text-slate-500">List worked</p>
                  <div className="h-2 rounded-full bg-white/10 mt-1"><div className="h-full bg-emerald-400 rounded-full" style={{ width: `${queuePct}%` }} /></div>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-500">Daily SMS cap</p>
                  <div className="h-2 rounded-full bg-white/10 mt-1"><div className="h-full bg-bee-amber rounded-full" style={{ width: `${quotaPct}%` }} /></div>
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-white/10 p-4">
              <h3 className="font-bold">Status breakdown</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(analytics?.byStatus || {}).map(([status, count]) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => { setPanel('leads'); setFilter(status === 'new' || status === 'callback' ? 'open' : 'all'); }}
                    className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold hover:border-bee-amber/40"
                  >
                    {status} <span className="text-bee-amber">{count}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
          <section className="rounded-2xl border border-bee-amber/20 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 bg-bee-amber/10 flex justify-between items-center">
              <h3 className="font-bold">Open dialer queue ({desk?.queue.openPreview?.length ?? openQueue.length})</h3>
              <button type="button" className="text-sm font-bold text-bee-amber" onClick={() => setPanel('dialer')}>Go to dialer →</button>
            </div>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase text-slate-500 bg-black/40 sticky top-0">
                  <tr><th className="p-2 text-left">#</th><th className="p-2 text-left">Lead</th><th className="p-2 text-left">Property</th><th className="p-2">Texts</th></tr>
                </thead>
                <tbody>
                  {(desk?.queue.openPreview || openQueue).slice(0, 50).map((lead, i) => (
                    <tr key={lead.id} className="border-t border-white/5 hover:bg-white/[0.03] cursor-pointer" onClick={() => { setPanel('dialer'); void openLead(lead.id); }}>
                      <td className="p-2 text-slate-500">{i + 1}</td>
                      <td className="p-2 font-semibold">{lead.name || 'Owner'}<br /><span className="font-mono text-xs text-slate-400">{lead.phone}</span></td>
                      <td className="p-2 text-slate-400 max-w-xs truncate">{lead.propertyAddress}</td>
                      <td className="p-2 text-center">{lead.textCount ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {desk?.recentActivity?.length ? (
            <section className="rounded-2xl border border-white/10 p-4">
              <h3 className="font-bold">Recent list activity</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {desk.recentActivity.map((row) => (
                  <li key={row.id} className="flex flex-wrap gap-2 justify-between border-b border-white/5 pb-2">
                    <button type="button" className="font-semibold text-left hover:text-bee-amber" onClick={() => { setPanel('dialer'); void openLead(row.id); }}>
                      {row.name || row.phone}
                    </button>
                    <span className="text-slate-500">{row.status} · {row.lastCallDisposition || 'contact'} · {formatSyncedAt(row.lastContactAt || undefined)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      {panel === 'tuning' && tuning ? (
        <div className="grid lg:grid-cols-2 gap-4 text-sm">
          <section className="rounded-2xl border border-white/10 p-5 space-y-3">
            <h3 className="font-black text-lg">Automation</h3>
            <p>Grok SMS agent: <strong>{tuning.agentEnabled ? 'ON' : 'OFF'}</strong></p>
            <p>Batch automation: <strong>{tuning.automationEnabled ? 'ON' : 'OFF'}</strong></p>
            <p>Provider: <strong>{tuning.smsProvider}</strong></p>
            <p>Send window: <strong>{tuning.sendWindowStart}:00 – {tuning.sendWindowEnd}:00</strong> ({tuning.sendTimezone})</p>
            <p>Pace between texts: <strong>{tuning.minDelayMinutes}–{tuning.maxDelayMinutes} min</strong></p>
            <p>Daily cap: <strong>{tuning.dailySmsLimit}</strong> (suggested <strong>{tuning.dailySmsSuggested}</strong>)</p>
          </section>
          <section className="rounded-2xl border border-white/10 p-5 space-y-3">
            <h3 className="font-black text-lg">Escalation & templates</h3>
            <p className="text-slate-400 text-xs">Keywords: {tuning.escalationKeywords.join(', ') || '—'}</p>
            <p className="text-slate-300">{tuning.escalationMessage}</p>
            <h4 className="font-bold mt-4">Outbound template</h4>
            <pre className="text-xs bg-black/50 border border-white/10 rounded-xl p-3 whitespace-pre-wrap">{tuning.outboundTemplate}</pre>
            <h4 className="font-bold">Greeting (live)</h4>
            <pre className="text-xs bg-black/50 border border-white/10 rounded-xl p-3 whitespace-pre-wrap">{desk?.business.greeting}</pre>
          </section>
        </div>
      ) : null}

      {panel === 'lines' && infra ? (
        <div className="space-y-4 text-sm">
          <section className="rounded-2xl border border-white/10 p-5 grid md:grid-cols-3 gap-4">
            <div><p className="text-slate-500 text-xs uppercase">Twilio SMS</p><p className="font-bold mt-1">{infra.twilioSmsReady ? 'Ready' : 'Not configured'}</p></div>
            <div><p className="text-slate-500 text-xs uppercase">Browser voice</p><p className="font-bold mt-1">{infra.twilioVoiceReady ? 'Ready' : 'Missing API keys / TwiML app'}</p></div>
            <div><p className="text-slate-500 text-xs uppercase">From number</p><p className="font-mono mt-1">{infra.twilioFrom || '—'}</p></div>
          </section>
          {infra.grokVoiceLine ? (
            <section className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5">
              <h3 className="font-bold text-emerald-100">Grok voice line (return calls)</h3>
              <p className="text-2xl font-black mt-2">{infra.grokVoiceLine.display}</p>
              <p className="font-mono text-xs text-slate-400 mt-1">{infra.grokVoiceLine.e164}</p>
            </section>
          ) : null}
          {[
            ['Return-call voice webhook (Twilio)', `${origin}${infra.returnCallWebhookPath}`],
            ['Inbound SMS webhook', `${origin}${infra.smsWebhookPath}`],
            ['Employee browser dial TwiML', `${origin}${infra.employeeVoiceTwimlPath}`],
            ['Workspace UID', infra.workspaceUid],
          ].map(([title, url]) => (
            <div key={title} className="rounded-xl border border-white/10 p-4 flex flex-wrap gap-3 justify-between items-start">
              <div className="min-w-0 flex-1">
                <p className="font-bold">{title}</p>
                <p className="font-mono text-xs text-slate-400 mt-1 break-all">{url}</p>
              </div>
              <button type="button" className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold" onClick={() => void copyText(url).then((ok) => ok && setNotice(`Copied ${title}`))}>Copy</button>
            </div>
          ))}
        </div>
      ) : null}

      {panel === 'dialer' ? (
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-3xl border border-bee-amber/25 bg-gradient-to-br from-bee-amber/10 to-transparent p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-black flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-bee-amber" /> Active workstation
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {powerMode ? 'Power mode — disposition moves you to the next open lead.' : 'Pick a lead from the table or start power dial.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startPowerDial}
                className="inline-flex items-center gap-2 rounded-xl bg-bee-amber text-bee-black font-extrabold px-4 py-2 text-sm"
              >
                <Play className="w-4 h-4" /> Start power dial
              </button>
              <button
                type="button"
                onClick={() => setPowerMode((p) => !p)}
                className={`rounded-xl border px-4 py-2 text-sm font-bold ${powerMode ? 'border-bee-amber text-bee-amber' : 'border-white/15 text-slate-300'}`}
              >
                Power mode {powerMode ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {active ? (
            <div className="mt-5 grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Now working</p>
                <h4 className="text-2xl font-black mt-1">{active.name || 'Unnamed owner'}</h4>
                <p className="font-mono text-sm mt-1">{active.phone}</p>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">{active.propertyAddress}</p>
                <p className="mt-3 text-xs text-slate-500 uppercase tracking-wider">
                  Status {active.status} · Texts {textLabel(active)}
                  {active.lastTextBody ? ` · Last: “${active.lastTextBody.slice(0, 60)}…”` : ''}
                </p>
              </div>
              <div className="space-y-3">
                <label className="block text-xs text-slate-500">
                  Call notes (saved with disposition)
                  <textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
                    placeholder="Gate code, motivation, callback time…"
                  />
                </label>
                <label className="block text-xs text-slate-500">
                  Outbound SMS preview
                  <textarea
                    value={smsDraft}
                    onChange={(e) => setSmsDraft(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
                    readOnly={false}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {callState === 'live' && hangup ? (
                    <button type="button" onClick={hangup} className="inline-flex items-center gap-2 rounded-xl bg-red-500 text-white font-extrabold px-4 py-2 text-sm">
                      <PhoneOff className="w-4 h-4" /> Hang up
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(busy) || callState === 'connecting'}
                      onClick={() => void startCall(active)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 text-bee-black font-extrabold px-4 py-2 text-sm disabled:opacity-50"
                    >
                      <Phone className="w-4 h-4" /> {callState === 'connecting' ? 'Connecting…' : 'Call'}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void textOne(active)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white text-bee-black font-extrabold px-4 py-2 text-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> Send text
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DISPOSITIONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={() => void markCall(active, d.id)}
                      className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-bold hover:border-bee-amber/50"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-slate-400 text-sm">No lead loaded. Upload a list below or press Start power dial.</p>
          )}

          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-[11px] uppercase tracking-widest text-slate-500">
                <span>List progress</span>
                <span>{queuePct}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-emerald-400/80 transition-all" style={{ width: `${queuePct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] uppercase tracking-widest text-slate-500">
                <span>Daily SMS cap</span>
                <span>{quotaPct}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-bee-amber/80 transition-all" style={{ width: `${quotaPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 max-h-[420px] flex flex-col">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <SkipForward className="w-4 h-4 text-slate-400" /> Open queue ({openQueue.length})
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {[5, 10].map((n) => (
              <button
                key={n}
                type="button"
                disabled={Boolean(busy) || !openQueue.length}
                onClick={() => void textHead(n)}
                className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-bold text-bee-amber disabled:opacity-40"
              >
                Text next {n}
              </button>
            ))}
          </div>
          <div className="mt-3 overflow-auto flex-1 space-y-2 pr-1">
            {openQueue.slice(0, 40).map((lead, idx) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => void openLead(lead.id)}
                className={`w-full text-left rounded-xl border px-3 py-2 text-sm transition-colors ${
                  openId === lead.id ? 'border-bee-amber/50 bg-bee-amber/10' : 'border-white/10 hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                <p className="font-semibold truncate">{lead.name || 'Owner'}</p>
                <p className="text-xs text-slate-400 truncate">{lead.propertyAddress}</p>
              </button>
            ))}
            {!openQueue.length ? <p className="text-xs text-slate-500">Queue empty — import leads to start.</p> : null}
          </div>
        </div>
      </div>
      ) : null}

      {panel === 'import' ? (
      <section
        className={`rounded-3xl border p-5 transition-colors ${dragOver ? 'border-bee-amber bg-bee-amber/10' : 'border-white/10 bg-white/[0.03]'}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          void ingestFile(file);
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black flex items-center gap-2">
              <Upload className="w-4 h-4 text-bee-amber" /> Import leads
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Drop CSV, TSV, or Excel here. Needs phone + property address (owner name optional). Tab-separated exports work too.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 rounded-xl bg-bee-amber text-bee-black font-extrabold px-4 py-2 cursor-pointer">
              {busy === 'parse' ? 'Reading…' : 'Choose file'}
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.tsv,.txt,.xlsx,.xls,.xlsm,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => void ingestFile(e.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              onClick={() => setPasteOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold"
            >
              <ClipboardPaste className="w-4 h-4" /> Paste CSV
            </button>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 text-xs text-bee-amber"
          onClick={() => {
            const blob = new Blob([LEAD_IMPORT_SAMPLE], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'lead-list-sample.csv';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download sample CSV
        </button>
        {pasteOpen ? (
          <div className="mt-4 space-y-2">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={6}
              placeholder={LEAD_IMPORT_SAMPLE}
              className="w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm font-mono"
            />
            <button
              type="button"
              disabled={!pasteText.trim() || Boolean(busy)}
              onClick={ingestPaste}
              className="rounded-xl bg-white text-bee-black font-extrabold px-4 py-2 text-sm disabled:opacity-50"
            >
              Parse pasted rows
            </button>
          </div>
        ) : null}
        {preview ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
            <p className="text-sm font-bold text-emerald-100">
              {preview.length} ready to add{previewSkipped ? ` · ${previewSkipped} rows skipped (missing phone or address)` : ''}
            </p>
            {previewErrors.length ? <p className="mt-1 text-xs text-amber-200">{previewErrors.join(' ')}</p> : null}
            <div className="mt-2 max-h-40 overflow-auto text-xs text-slate-300 space-y-1">
              {preview.slice(0, 8).map((row) => (
                <p key={`${row.phone}-${row.propertyAddress}`}>
                  {row.name || 'Owner'} · {row.propertyAddress} · {row.phone}
                </p>
              ))}
              {preview.length > 8 ? <p className="text-slate-500">…and {preview.length - 8} more</p> : null}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void commitImport()}
                className="rounded-xl bg-bee-amber text-bee-black font-extrabold px-4 py-2 disabled:opacity-50"
              >
                {busy === 'import' ? 'Importing…' : `Add ${preview.length} to ${desk?.business.name || 'list'}`}
              </button>
              <button type="button" onClick={() => { setPreview(null); setPreviewErrors([]); }} className="rounded-xl border border-white/15 px-4 py-2 text-sm">
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>
      ) : null}

      {panel === 'leads' ? (
      <section className="rounded-3xl border border-white/10 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-white/10 bg-black/30">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, address"
            className="flex-1 min-w-[180px] rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
          />
          <select value={statusSort} onChange={(e) => setStatusSort(e.target.value as typeof statusSort)} className="rounded-xl bg-black/50 border border-white/10 px-2 py-2 text-xs">
            <option value="queue">Queue order</option>
            <option value="recent">Recent contact</option>
            <option value="name">Name</option>
          </select>
          {(['all', 'open', 'not_texted', 'texted', 'callback', 'needs_human'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === id ? 'bg-bee-amber text-bee-black' : 'border border-white/15 text-slate-300'}`}
            >
              {id === 'all'
                ? 'All'
                : id === 'open'
                  ? 'Not worked'
                  : id === 'not_texted'
                    ? 'Not texted'
                    : id === 'texted'
                      ? 'Texted'
                      : id === 'callback'
                        ? 'Callback'
                        : 'Needs human'}
            </button>
          ))}
          <button
            type="button"
            disabled={!selectedIds.length || Boolean(busy)}
            onClick={() => void textChosen()}
            className="rounded-xl bg-bee-amber text-bee-black font-extrabold px-4 py-2 text-sm disabled:opacity-40"
          >
            <Send className="w-4 h-4 inline mr-1" />
            Text selected ({selectedIds.length})
          </button>
        </div>
        <div className="max-h-[min(70vh,720px)] overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500 sticky top-0 bg-[#0b1018]">
              <tr>
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={() => {
                      const next = { ...selected };
                      filtered.forEach((l) => {
                        next[l.id] = !allFilteredSelected;
                      });
                      setSelected(next);
                    }}
                  />
                </th>
                <th className="p-3">Lead</th>
                <th className="p-3">Phone</th>
                <th className="p-3 hidden lg:table-cell">Property</th>
                <th className="p-3">Status</th>
                <th className="p-3 hidden md:table-cell">Last contact</th>
                <th className="p-3 hidden md:table-cell">Disposition</th>
                <th className="p-3">Texts</th>
                <th className="p-3">Flags</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className={`border-t border-white/5 cursor-pointer hover:bg-white/[0.04] ${openId === lead.id ? 'bg-bee-amber/10' : ''}`}
                  onClick={() => { setPanel('dialer'); void openLead(lead.id); }}
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={Boolean(selected[lead.id])}
                      onChange={() => setSelected((prev) => ({ ...prev, [lead.id]: !prev[lead.id] }))}
                    />
                  </td>
                  <td className="p-3 font-semibold">{lead.name || 'Unnamed'}</td>
                  <td className="p-3 font-mono text-xs">{lead.phone}</td>
                  <td className="p-3 hidden lg:table-cell text-slate-400 max-w-[240px] truncate">{lead.propertyAddress}</td>
                  <td className="p-3 uppercase text-[10px] tracking-wider text-slate-400">{lead.status}</td>
                  <td className="p-3 hidden md:table-cell text-xs text-slate-500">{lead.lastContactAt ? formatSyncedAt(lead.lastContactAt) : '—'}</td>
                  <td className="p-3 hidden md:table-cell text-xs">{lead.lastCallDisposition || '—'}</td>
                  <td className="p-3 font-bold">{textLabel(lead)}</td>
                  <td className="p-3 text-[10px]">
                    {lead.needsHuman ? <span className="text-amber-300">human</span> : null}
                    {lead.optedOut ? <span className="text-red-300"> opt-out</span> : null}
                    {lead.grokVoiceInterest ? <span className="text-emerald-300"> grok</span> : null}
                  </td>
                </tr>
              ))}
              {!sortedLeads.length ? (
                <tr>
                  <td colSpan={9} className="p-6 text-slate-500">
                    No leads in this view. Drop a CSV/Excel file in the import box above.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}

      {openId && active && thread && (panel === 'dialer' || panel === 'leads') ? (
        <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
          <div className="flex justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Message thread</p>
              <h3 className="text-xl font-black mt-1">{active.name || 'Lead'}</h3>
              <p className="text-sm text-slate-400 mt-1">
                {thread.textCount} outbound · {thread.inboundCount} inbound repl{thread.inboundCount === 1 ? 'y' : 'ies'}
              </p>
            </div>
            <button type="button" onClick={() => { setOpenId(null); setThread(null); }} className="text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 max-h-72 overflow-auto space-y-2">
            {(thread.messages || []).map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl px-3 py-2 text-sm ${msg.direction === 'inbound' ? 'bg-sky-950/50 border border-sky-500/20' : 'bg-white/5 border border-white/5'}`}
              >
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  {msg.direction} {msg.at ? `· ${new Date(msg.at).toLocaleString()}` : ''}{' '}
                  {msg.employeeEmail ? `· ${msg.employeeEmail}` : ''}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))}
            {!thread.messages.length ? <p className="text-sm text-slate-500">No texts on this lead yet.</p> : null}
          </div>
        </section>
      ) : null}

      {panel === 'dialer' ? (
      <p className="text-xs text-slate-500">
        One-click outreach:
        <button
          type="button"
          className="ml-2 text-bee-amber font-bold"
          disabled={Boolean(busy)}
          onClick={() => {
            setBusy('text');
            void textNextLead(user, businessId)
              .then(() => reload())
              .catch((e) => setError(e instanceof Error ? e.message : 'Text failed'))
              .finally(() => setBusy(''));
          }}
        >
          Text next open lead
        </button>
        {!desk?.line.smsReady ? (
          <span className="block mt-2 text-amber-200/80">Laptop SMS needs company Twilio env vars on the server.</span>
        ) : null}
      </p>
      ) : null}
        </main>
      </div>
    </div>
  );
}
