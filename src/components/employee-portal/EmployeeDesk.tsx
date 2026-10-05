import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  ClipboardPaste,
  Loader2,
  Phone,
  PhoneOff,
  Play,
  Send,
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

type Filter = 'all' | 'open' | 'not_texted' | 'texted';

type Props = { user: User };

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

  const handleParse = useMemo(
    () => applyParse({ setError, setNotice, setPreview, setPreviewSkipped, setPreviewErrors }),
    [],
  );

  const reload = useCallback(async () => {
    const snap = await fetchEmployeeDesk(user, businessId);
    setDesk(snap);
    return snap;
  }, [user, businessId]);

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

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 min-h-[160px]">
        <img src="/employee/desk-banner.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05080f] via-[#05080f]/85 to-transparent" />
        <div className="relative p-6 md:p-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-bee-amber text-xs font-bold uppercase tracking-[0.22em]">Call center floor</p>
            <h2 className="text-3xl font-black mt-1">Power dialer & outreach</h2>
            <p className="text-slate-300 mt-2 max-w-xl text-sm leading-relaxed">
              Same lists as the Lead Agent app — import CSV/Excel, work the queue, call from the browser, text in batches, and
              see full message history per lead.
            </p>
          </div>
          <label className="text-xs text-slate-400">
            Brand list
            <select
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              className="mt-1 block rounded-xl bg-black/60 border border-white/15 px-3 py-2 text-sm text-white"
            >
              {(desk?.businesses || [{ id: 'macrorei', name: 'MacroREI' }]).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? <p className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">{error}</p> : null}
      {notice ? <p className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">{notice}</p> : null}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Calls today', String(desk?.today.calls ?? 0)],
          ['Texts today', String(desk?.today.texts ?? 0)],
          ['Open in queue', String(desk?.queue.remaining ?? 0)],
          ['SMS quota', `${desk?.quota.sent ?? 0}/${desk?.quota.limit ?? 0}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">{label}</p>
            <p className="text-2xl font-black mt-1">{value}</p>
          </div>
        ))}
      </div>

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

      <section className="rounded-3xl border border-white/10 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-white/10 bg-black/30">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, address"
            className="flex-1 min-w-[180px] rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
          />
          {(['all', 'open', 'not_texted', 'texted'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === id ? 'bg-bee-amber text-bee-black' : 'border border-white/15 text-slate-300'}`}
            >
              {id === 'all' ? 'All' : id === 'open' ? 'Not worked' : id === 'not_texted' ? 'Not texted' : 'Texted'}
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
        <div className="max-h-[480px] overflow-auto">
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
                <th className="p-3 hidden md:table-cell">Property</th>
                <th className="p-3">Status</th>
                <th className="p-3">Texts</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className={`border-t border-white/5 cursor-pointer hover:bg-white/[0.04] ${openId === lead.id ? 'bg-bee-amber/10' : ''}`}
                  onClick={() => void openLead(lead.id)}
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
                  <td className="p-3 hidden md:table-cell text-slate-400 max-w-[240px] truncate">{lead.propertyAddress}</td>
                  <td className="p-3 uppercase text-[10px] tracking-wider text-slate-400">{lead.status}</td>
                  <td className="p-3 font-bold">{textLabel(lead)}</td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="p-6 text-slate-500">
                    No leads in this view. Drop a CSV/Excel file in the import box above.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {openId && active && thread ? (
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

      <p className="text-xs text-slate-500">
        One-click outreach without selecting rows:
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
    </div>
  );
}
