import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock,
  Copy,
  DollarSign,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Users,
} from 'lucide-react';
import { brandFor } from '../../lib/hiveAppBranding';
import {
  BURN_PRESETS,
  burnQuip,
  costPerSecond,
  formatUsd,
  loadBurnHistory,
  saveBurnSession,
  shareText,
  type BurnSession,
} from '../../lib/meetingBurn';

type Props = { expanded?: boolean };

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Live meeting cost tracker — see dollars tick up in real time. */
export default function MeetingBurnWebApp({ expanded }: Props) {
  const brand = brandFor('pink');
  const [title, setTitle] = useState('');
  const [attendees, setAttendees] = useState(6);
  const [hourlyUsd, setHourlyUsd] = useState(125);
  const [presetId, setPresetId] = useState('agency');
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [history, setHistory] = useState<BurnSession[]>(() => loadBurnHistory());
  const [copied, setCopied] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const perSecond = useMemo(() => costPerSecond(attendees, hourlyUsd), [attendees, hourlyUsd]);
  const totalUsd = (elapsedMs / 1000) * perSecond;
  const quip = burnQuip(totalUsd);

  const stopTimer = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setRunning(false);
  }, []);

  const startTimer = useCallback(() => {
    if (running) return;
    startedAtRef.current = Date.now() - elapsedMs;
    setRunning(true);
    tickRef.current = setInterval(() => {
      if (startedAtRef.current != null) {
        setElapsedMs(Date.now() - startedAtRef.current);
      }
    }, 100);
  }, [running, elapsedMs]);

  const resetTimer = useCallback(() => {
    stopTimer();
    startedAtRef.current = null;
    setElapsedMs(0);
  }, [stopTimer]);

  const finishSession = useCallback(() => {
    if (elapsedMs < 3000) return;
    stopTimer();
    const session: BurnSession = {
      id: `burn-${Date.now()}`,
      title: title.trim() || 'Untitled meeting',
      attendees,
      hourlyUsd,
      elapsedMs,
      endedAt: new Date().toISOString(),
      totalUsd,
    };
    saveBurnSession(session);
    setHistory(loadBurnHistory());
  }, [stopTimer, title, attendees, hourlyUsd, elapsedMs, totalUsd]);

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
  }, []);

  const onPreset = (id: string, rate: number) => {
    setPresetId(id);
    setHourlyUsd(rate);
  };

  const copyShare = async () => {
    const text = shareText({ title, attendees, hourlyUsd, elapsedMs, totalUsd });
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Meeting Burn', text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`flex flex-col overflow-hidden ${
        expanded ? 'min-h-[calc(100vh-8rem)]' : 'rounded-2xl border min-h-[560px]'
      }`}
      style={expanded ? undefined : { borderColor: brand.primary + '44', backgroundColor: '#0b0f14' }}
    >
      <div className="p-5 border-b border-white/10" style={{ backgroundColor: brand.primarySoft }}>
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: brand.primary + '33' }}
          >
            <Flame className="w-6 h-6" style={{ color: brand.primary }} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: brand.primary }}>
              Meeting Burn
            </p>
            <h2 className="text-lg font-black text-white">Live meeting cost tracker</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Start the clock and watch what the room really costs — per second.
            </p>
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-5 space-y-5 ${expanded ? 'md:p-8' : ''}`}>
        {/* Live counter */}
        <div
          className="rounded-2xl border p-6 md:p-8 text-center relative overflow-hidden"
          style={{ borderColor: brand.primary + '44', backgroundColor: 'rgba(0,0,0,0.35)' }}
        >
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${brand.primary}, transparent 65%)`,
            }}
          />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 relative">
            Total burn
          </p>
          <p
            className="text-5xl sm:text-6xl md:text-7xl font-black tabular-nums relative"
            style={{ color: brand.primaryText }}
          >
            {formatUsd(totalUsd)}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm text-slate-400 relative">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {formatDuration(elapsedMs)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              {formatUsd(perSecond * 60)}/min
            </span>
          </div>
          {quip ? (
            <p className="mt-4 text-sm text-slate-300 max-w-md mx-auto relative italic">{quip}</p>
          ) : null}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 justify-center">
          {!running ? (
            <button
              type="button"
              onClick={startTimer}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm"
              style={{ backgroundColor: brand.primary, color: brand.contrastText }}
            >
              <Play className="w-4 h-4 fill-current" />
              Start clock
            </button>
          ) : (
            <button
              type="button"
              onClick={stopTimer}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}
          <button
            type="button"
            onClick={resetTimer}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 text-slate-300 font-bold text-sm hover:bg-white/5"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={() => void copyShare()}
            disabled={elapsedMs < 1000}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 text-slate-300 font-bold text-sm hover:bg-white/5 disabled:opacity-40"
          >
            {copied ? <Copy className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copied' : 'Share'}
          </button>
          {elapsedMs >= 3000 && !running ? (
            <button
              type="button"
              onClick={finishSession}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border font-bold text-sm"
              style={{ borderColor: brand.primary + '66', color: brand.primaryText }}
            >
              Save to history
            </button>
          ) : null}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Meeting title (optional)"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500/50"
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Attendees
            </span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={2}
                max={24}
                value={attendees}
                onChange={(e) => setAttendees(Number(e.target.value))}
                className="flex-1 accent-pink-500"
              />
              <span className="text-white font-bold w-8 text-right">{attendees}</span>
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              Blended hourly rate
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">$</span>
              <input
                type="number"
                min={25}
                max={500}
                step={5}
                value={hourlyUsd}
                onChange={(e) => {
                  setHourlyUsd(Number(e.target.value) || 75);
                  setPresetId('custom');
                }}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white focus:outline-none focus:border-pink-500/50"
              />
              <span className="text-slate-500 text-sm">/hr</span>
            </div>
          </label>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick presets</p>
          <div className="flex flex-wrap gap-2">
            {BURN_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPreset(p.id, p.hourlyUsd)}
                className={`px-3 py-2 rounded-xl text-left border text-sm transition-colors ${
                  presetId === p.id
                    ? 'border-pink-500/50 bg-pink-500/10 text-white'
                    : 'border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <span className="font-bold block">{p.label}</span>
                <span className="text-xs opacity-80">
                  {formatUsd(p.hourlyUsd)}/hr · {p.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        {history.length > 0 ? (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recent burns</p>
            <ul className="space-y-2">
              {history.slice(0, 5).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{s.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {formatDuration(s.elapsedMs)} · {s.attendees} people
                    </p>
                  </div>
                  <span className="font-bold shrink-0" style={{ color: brand.primaryText }}>
                    {formatUsd(s.totalUsd)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
