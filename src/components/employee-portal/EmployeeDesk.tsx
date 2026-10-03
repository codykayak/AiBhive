import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { Loader2, Phone, PhoneOff, Send, Upload, X } from 'lucide-react';
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
import { LEAD_IMPORT_SAMPLE, parseLeadFile, type ParsedLeadRow } from '../../lib/leadListImport';

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

export default function EmployeeDesk({ user }: Props) {
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
  const [openId, setOpenId] = useState<string | null>(null);
  const [thread, setThread] = useState<LeadThread | null>(null);

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
    void reload().catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load the floor');
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const openLead = async (leadId: string) => {
    setOpenId(leadId);
    setThread(null);
    try {
      const detail = await fetchLeadThread(user, businessId, leadId);
      setThread(detail);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (desk?.leads || []).filter((lead) => {
      if (filter === 'open' && lead.status !== 'new' && lead.status !== 'callback') return false;
      if (filter === 'texted' && !(lead.status === 'texted' || (lead.textCount || 0) > 0)) return false;
      if (filter === 'not_texted' && (lead.status === 'texted' || (lead.textCount || 0) > 0)) return false;
      if (!q) return true;
      return `${lead.name} ${lead.phone} ${lead.propertyAddress}`.toLowerCase().includes(q);
    });
  }, [desk, filter, query]);

  const selectedIds = filtered.filter((l) => selected[l.id]).map((l) => l.id);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setNotice('');
    setBusy('parse');
    try {
      const parsed = await parseLeadFile(file);
      if (parsed.errors.length && !parsed.rows.length) {
        setError(parsed.errors.join(' '));
        setPreview(null);
        return;
      }
      setPreview(parsed.rows);
      setPreviewSkipped(parsed.skipped);
      setNotice(`${parsed.rows.length} leads ready${parsed.skipped ? `, ${parsed.skipped} skipped` : ''}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file');
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
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setBusy('');
    }
  };

  const textChosen = async () => {
    if (!selectedIds.length) return;
    setBusy('batch');
    setError('');
    try {
      let sent = 0;
      for (let i = 0; i < selectedIds.length; i += 15) {
        const chunk = selectedIds.slice(i, i + 15);
        setNotice(`Texting ${Math.min(i + chunk.length, selectedIds.length)} of ${selectedIds.length}…`);
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

  const markCall = async (lead: DeskLead, disposition: string) => {
    setBusy('log');
    setError('');
    try {
      await logEmployeeCall(user, { businessId, leadId: lead.id, disposition });
      await reload();
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
    setSelected({ [lead.id]: true });
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

  if (!desk && !error) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-16">
        <Loader2 className="w-5 h-5 animate-spin" /> Opening the floor…
      </div>
    );
  }

  const active = thread?.lead || desk?.leads.find((l) => l.id === openId) || desk?.queue.current || null;
  const allFilteredSelected = filtered.length > 0 && filtered.every((l) => selected[l.id]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 min-h-[160px]">
        <img src="/employee/desk-banner.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05080f] via-[#05080f]/85 to-transparent" />
        <div className="relative p-6 md:p-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-bee-amber text-xs font-bold uppercase tracking-[0.22em]">Laptop floor</p>
            <h2 className="text-3xl font-black mt-1">Lists, calls, and texts</h2>
            <p className="text-slate-300 mt-2 max-w-xl text-sm leading-relaxed">
              Upload the same CSV or Excel the dialer uses, pick who to text, and open a lead to see every message.
            </p>
          </div>
          <label className="text-xs text-slate-400">
            List
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

      <div className="grid sm:grid-cols-4 gap-3">
        {[
          ['Calls today', String(desk?.today.calls ?? 0)],
          ['Texts today', String(desk?.today.texts ?? 0)],
          ['On this list', String(desk?.queue.total ?? 0)],
          ['Not worked', String(desk?.queue.remaining ?? 0)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">{label}</p>
            <p className="text-2xl font-black mt-1">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black flex items-center gap-2">
              <Upload className="w-4 h-4 text-bee-amber" /> Upload a list
            </h3>
            <p className="text-sm text-slate-400 mt-1">CSV or Excel. Columns: owner name, property address, phone.</p>
          </div>
          <label className="inline-flex items-center gap-2 rounded-xl bg-bee-amber text-bee-black font-extrabold px-4 py-2 cursor-pointer">
            {busy === 'parse' ? 'Reading…' : 'Choose file'}
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.xlsm,text/csv"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </label>
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
          Download a sample CSV
        </button>
        {preview ? (
          <div className="mt-4">
            <p className="text-sm text-slate-300">
              {preview.length} ready to add{previewSkipped ? ` · ${previewSkipped} rows skipped` : ''}. Duplicates of numbers already on the list are skipped.
            </p>
            <div className="mt-2 max-h-40 overflow-auto text-xs text-slate-400 space-y-1">
              {preview.slice(0, 6).map((row) => (
                <p key={row.phone}>
                  {row.name || 'Owner'} · {row.propertyAddress} · {row.phone}
                </p>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void commitImport()}
                className="rounded-xl bg-white text-bee-black font-extrabold px-4 py-2 disabled:opacity-50"
              >
                {busy === 'import' ? 'Importing…' : `Add ${preview.length} leads`}
              </button>
              <button type="button" onClick={() => setPreview(null)} className="rounded-xl border border-white/15 px-4 py-2 text-sm">
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
                    No leads in this view. Upload a CSV or Excel file to start the list.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {openId && active ? (
        <section className="rounded-3xl border border-bee-amber/30 bg-black/50 p-6">
          <div className="flex justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-bee-amber">Lead record</p>
              <h3 className="text-2xl font-black mt-1">{active.name || 'Unnamed lead'}</h3>
              <p className="font-mono mt-1">{active.phone}</p>
              <p className="text-slate-400 text-sm mt-1">{active.propertyAddress}</p>
            </div>
            <button type="button" onClick={() => { setOpenId(null); setThread(null); }} className="text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-300">
            {thread ? `${thread.textCount} text${thread.textCount === 1 ? '' : 's'} sent` : 'Loading messages…'}
            {thread?.inboundCount ? ` · ${thread.inboundCount} replies` : ''}
          </p>
          <div className="mt-4 max-h-64 overflow-auto space-y-2">
            {(thread?.messages || []).map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl px-3 py-2 text-sm ${msg.direction === 'inbound' ? 'bg-sky-950/50' : 'bg-white/5'}`}
              >
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  {msg.direction} {msg.at ? `· ${new Date(msg.at).toLocaleString()}` : ''} {msg.employeeEmail ? `· ${msg.employeeEmail}` : ''}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))}
            {thread && !thread.messages.length ? <p className="text-sm text-slate-500">No texts on this lead yet.</p> : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {callState === 'live' && hangup ? (
              <button type="button" onClick={hangup} className="inline-flex items-center gap-2 rounded-xl bg-red-500 text-white font-extrabold px-4 py-2">
                <PhoneOff className="w-4 h-4" /> Hang up
              </button>
            ) : (
              <button
                type="button"
                disabled={Boolean(busy) || callState === 'connecting'}
                onClick={() => void startCall(active)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 text-bee-black font-extrabold px-4 py-2 disabled:opacity-50"
              >
                <Phone className="w-4 h-4" /> {callState === 'connecting' ? 'Connecting…' : 'Call'}
              </button>
            )}
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => void textOne(active)}
              className="inline-flex items-center gap-2 rounded-xl bg-bee-amber text-bee-black font-extrabold px-4 py-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> Text this lead
            </button>
            {DISPOSITIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void markCall(active, d.id)}
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold"
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-xs text-slate-500">
        “Text next open lead” is still available if you want the top of the unworked list without selecting rows.
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
      </p>
    </div>
  );
}
