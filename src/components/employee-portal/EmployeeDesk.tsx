import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Loader2, Phone, PhoneOff, Send } from 'lucide-react';
import {
  fetchEmployeeDesk,
  fetchEmployeeVoiceToken,
  logEmployeeCall,
  textNextLead,
  type DeskLead,
  type EmployeeDeskSnapshot,
} from '../../lib/employeePortalApi';

const DISPOSITIONS = [
  { id: 'talked', label: 'Talked' },
  { id: 'voicemail', label: 'Voicemail' },
  { id: 'no_answer', label: 'No answer' },
  { id: 'callback', label: 'Call back' },
  { id: 'skipped', label: 'Skip' },
] as const;

type Props = { user: User };

export default function EmployeeDesk({ user }: Props) {
  const [businessId, setBusinessId] = useState('macrorei');
  const [desk, setDesk] = useState<EmployeeDeskSnapshot | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [batchSize, setBatchSize] = useState(10);
  const [batchProgress, setBatchProgress] = useState('');
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'live'>('idle');
  const [hangup, setHangup] = useState<(() => void) | null>(null);

  const reload = useCallback(async () => {
    const snap = await fetchEmployeeDesk(user, businessId);
    setDesk(snap);
    return snap;
  }, [user, businessId]);

  useEffect(() => {
    let cancelled = false;
    setError('');
    void reload().catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load the floor');
    });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const current = desk?.queue.current || null;

  const applyToday = (today: EmployeeDeskSnapshot['today']) => {
    setDesk((prev) => (prev ? { ...prev, today } : prev));
  };

  const textOne = async () => {
    setBusy('text');
    setError('');
    try {
      const result = await textNextLead(user, businessId);
      if (result.today) applyToday(result.today);
      await reload();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Text failed');
      return null;
    } finally {
      setBusy('');
    }
  };

  const textBatch = async () => {
    const count = Math.max(1, Math.min(25, batchSize));
    setBusy('batch');
    setError('');
    try {
      for (let i = 1; i <= count; i += 1) {
        setBatchProgress(`Texting ${i} of ${count}…`);
        const result = await textNextLead(user, businessId);
        if (result.today) applyToday(result.today);
        if (result.done) {
          setBatchProgress(`List finished after ${i - 1} texts.`);
          break;
        }
        if (i === count) setBatchProgress(`Sent ${count} texts.`);
      }
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Batch stopped');
    } finally {
      setBusy('');
    }
  };

  const markCall = async (lead: DeskLead, disposition: string) => {
    setBusy('log');
    setError('');
    try {
      const result = await logEmployeeCall(user, { businessId, leadId: lead.id, disposition });
      applyToday(result.today);
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
        setError(token.hint || 'Laptop calling is not connected yet. Log the outcome below and the list still moves.');
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

  if (!desk && !error) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-16">
        <Loader2 className="w-5 h-5 animate-spin" /> Opening the floor…
      </div>
    );
  }

  const worked = (desk?.queue.total || 0) - (desk?.queue.remaining || 0);
  const pct = desk?.queue.total ? Math.round((worked / desk.queue.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 min-h-[180px]">
        <img
          src="/employee/desk-banner.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05080f] via-[#05080f]/80 to-transparent" />
        <div className="relative p-6 md:p-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-bee-amber text-xs font-bold uppercase tracking-[0.22em]">Laptop floor</p>
            <h2 className="text-3xl font-black mt-1">Call and text without a phone</h2>
            <p className="text-slate-300 mt-2 max-w-xl text-sm leading-relaxed">
              Same company list as Lead Agent. Your place on the list, today’s calls, and a text batch all live here.
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

      {error ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">{error}</p>
      ) : null}

      <div className="grid sm:grid-cols-4 gap-3">
        {[
          ['Calls today', String(desk?.today.calls ?? 0)],
          ['Texts today', String(desk?.today.texts ?? 0)],
          ['Still on the list', String(desk?.queue.remaining ?? 0)],
          ['Team texts today', `${desk?.quota.sent ?? 0}/${desk?.quota.limit ?? 0}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] uppercase tracking-widest text-slate-500">{label}</p>
            <p className="text-2xl font-black mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>List progress</span>
          <span>
            {worked} worked · {pct}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-bee-amber" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="rounded-3xl border border-bee-amber/30 bg-black/40 p-6">
          {current ? (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-bee-amber">Up next</p>
              <h3 className="text-2xl font-black mt-2">{current.name || 'Unnamed lead'}</h3>
              <p className="text-lg text-white mt-1 font-mono">{current.phone}</p>
              <p className="text-slate-400 mt-2 text-sm">{current.propertyAddress || 'No property address on file'}</p>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed border-l-2 border-bee-amber/50 pl-3">
                {desk?.business.greeting}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {callState === 'live' && hangup ? (
                  <button
                    type="button"
                    onClick={hangup}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-500 text-white font-extrabold px-5 py-3"
                  >
                    <PhoneOff className="w-4 h-4" /> Hang up
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={Boolean(busy) || callState === 'connecting'}
                    onClick={() => void startCall(current)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 text-bee-black font-extrabold px-5 py-3 disabled:opacity-50"
                  >
                    <Phone className="w-4 h-4" />
                    {callState === 'connecting' ? 'Connecting…' : 'Call from this laptop'}
                  </button>
                )}
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void textOne()}
                  className="inline-flex items-center gap-2 rounded-xl bg-bee-amber text-bee-black font-extrabold px-5 py-3 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> Text this lead
                </button>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {DISPOSITIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void markCall(current, d.id)}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-bee-amber/50"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {!desk?.line.voiceReady ? (
                <p className="text-xs text-slate-500 mt-4">
                  Live laptop audio uses the company Twilio line. Until that voice app is connected, use the outcome
                  buttons so your place on the list still advances.
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-slate-300">No open leads on this list. Import a list in Lead Agent or pick another brand.</p>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <h3 className="font-black text-lg">Text a batch</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Sends the next open leads from the company number, one after another, and marks them texted so the next
            person on the floor does not repeat them.
          </p>
          <label className="block text-xs text-slate-500">
            How many today
            <input
              type="number"
              min={1}
              max={25}
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-white text-sm"
            />
          </label>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void textBatch()}
            className="w-full rounded-xl bg-white text-bee-black font-extrabold py-3 disabled:opacity-50"
          >
            {busy === 'batch' ? batchProgress || 'Sending…' : `Text ${batchSize} people`}
          </button>
          {batchProgress && busy !== 'batch' ? <p className="text-xs text-emerald-300">{batchProgress}</p> : null}
          <ul className="max-h-64 overflow-y-auto space-y-2 text-sm">
            {(desk?.leads || []).slice(0, 12).map((lead, index) => (
              <li
                key={lead.id}
                className={`flex justify-between gap-3 rounded-xl px-3 py-2 ${
                  lead.id === current?.id ? 'bg-bee-amber/15 text-white' : 'bg-black/30 text-slate-400'
                }`}
              >
                <span className="truncate">
                  {index + 1}. {lead.name || lead.phone}
                </span>
                <span className="shrink-0 uppercase text-[10px] tracking-wider">{lead.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
