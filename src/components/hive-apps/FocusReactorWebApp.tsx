import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Atom,
  Copy,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Zap,
} from 'lucide-react';
import { brandFor } from '../../lib/hiveAppBranding';
import {
  REACTOR_PRESETS,
  chargeFromElapsed,
  focusUnits,
  formatDuration,
  loadReactorHistory,
  reactorHeat,
  reactorQuip,
  reactorRpm,
  saveReactorSession,
  shareReactorText,
  type ReactorSession,
} from '../../lib/focusReactor';

type Props = { expanded?: boolean };

type Particle = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  hue: number;
};

function initParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    angle: Math.random() * Math.PI * 2,
    radius: 0.35 + Math.random() * 0.55,
    speed: 0.4 + Math.random() * 1.2,
    size: 1.5 + Math.random() * 2.5,
    hue: 180 + Math.random() * 80,
  }));
}

/** Live focus reactor — orbiting particles, charge meter, real-time motion. */
export default function FocusReactorWebApp({ expanded }: Props) {
  const brand = brandFor('purple');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef(initParticles(72));
  const rafRef = useRef<number>(0);
  const chargeRef = useRef(0);
  const runningRef = useRef(false);

  const [label, setLabel] = useState('');
  const [presetId, setPresetId] = useState('deep');
  const [targetMs, setTargetMs] = useState(45 * 60_000);
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [history, setHistory] = useState<ReactorSession[]>(() => loadReactorHistory());
  const [copied, setCopied] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const charge = useMemo(() => chargeFromElapsed(elapsedMs, targetMs), [elapsedMs, targetMs]);
  const rpm = reactorRpm(charge);
  const heat = reactorHeat(charge);
  const units = focusUnits(elapsedMs, charge);
  const quip = reactorQuip(charge);
  const progressPct = targetMs > 0 ? Math.min(100, (elapsedMs / targetMs) * 100) : charge * 100;

  chargeRef.current = charge;
  runningRef.current = running;

  const stopTimer = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setRunning(false);
    runningRef.current = false;
  }, []);

  const startTimer = useCallback(() => {
    if (running) return;
    startedAtRef.current = Date.now() - elapsedMs;
    setRunning(true);
    runningRef.current = true;
    tickRef.current = setInterval(() => {
      if (startedAtRef.current != null) {
        setElapsedMs(Date.now() - startedAtRef.current);
      }
    }, 50);
  }, [running, elapsedMs]);

  const resetTimer = useCallback(() => {
    stopTimer();
    startedAtRef.current = null;
    setElapsedMs(0);
  }, [stopTimer]);

  const finishSession = useCallback(() => {
    if (elapsedMs < 5000) return;
    stopTimer();
    const session: ReactorSession = {
      id: `reactor-${Date.now()}`,
      label: label.trim() || 'Deep work',
      elapsedMs,
      peakCharge: charge,
      focusUnits: units,
      endedAt: new Date().toISOString(),
    };
    saveReactorSession(session);
    setHistory(loadReactorHistory());
  }, [stopTimer, label, elapsedMs, charge, units]);

  const onPreset = (id: string, ms: number) => {
    setPresetId(id);
    setTargetMs(ms);
    resetTimer();
  };

  const copyShare = async () => {
    const text = shareReactorText({ label, elapsedMs, charge, focusUnits: units });
    try {
      if (navigator.share) await navigator.share({ title: 'Focus Reactor', text });
      else await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w / 2;
      const cy = h / 2;
      const baseR = Math.min(w, h) * 0.38;
      const c = chargeRef.current;
      const active = runningRef.current;
      const speedMul = active ? 0.6 + c * 2.8 : 0.15 + c * 0.4;

      ctx.fillStyle = 'rgba(5, 8, 15, 0.22)';
      ctx.fillRect(0, 0, w, h);

      // Core glow
      const pulse = 0.85 + Math.sin(now / 280) * 0.15 * (0.3 + c);
      const coreR = baseR * 0.22 * pulse;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.2);
      grad.addColorStop(0, `rgba(196, 132, 252, ${0.35 + c * 0.45})`);
      grad.addColorStop(0.45, `rgba(147, 51, 234, ${0.15 + c * 0.25})`);
      grad.addColorStop(1, 'rgba(88, 28, 135, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Inner core
      ctx.fillStyle = `rgba(233, 213, 255, ${0.5 + c * 0.4})`;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 0.35, 0, Math.PI * 2);
      ctx.fill();

      const particles = particlesRef.current;
      for (const p of particles) {
        if (active) p.angle += p.speed * speedMul * dt;
        const r = p.radius * baseR * (0.92 + Math.sin(now / 400 + p.angle) * 0.04);
        const x = cx + Math.cos(p.angle) * r;
        const y = cy + Math.sin(p.angle) * r;

        ctx.fillStyle = `hsla(${p.hue}, 85%, ${55 + c * 25}%, ${0.35 + c * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size * (0.8 + c * 0.6), 0, Math.PI * 2);
        ctx.fill();

        // Trail streak toward center when charged
        if (c > 0.2 && active) {
          ctx.strokeStyle = `hsla(${p.hue}, 90%, 70%, ${0.08 * c})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(cx + Math.cos(p.angle) * coreR * 0.5, cy + Math.sin(p.angle) * coreR * 0.5);
          ctx.stroke();
        }
      }

      // Ring
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.25 + c * 0.5})`;
      ctx.lineWidth = 2 + c * 3;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 0.95, 0, Math.PI * 2);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
  }, []);

  return (
    <div
      className={`flex flex-col overflow-hidden ${
        expanded ? 'min-h-[calc(100vh-8rem)]' : 'rounded-2xl border min-h-[600px]'
      }`}
      style={expanded ? undefined : { borderColor: brand.primary + '44', backgroundColor: '#0b0f14' }}
    >
      <div className="p-5 border-b border-white/10" style={{ backgroundColor: brand.primarySoft }}>
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: brand.primary + '33' }}
          >
            <Atom className="w-6 h-6 animate-spin" style={{ color: brand.primary, animationDuration: '8s' }} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: brand.primary }}>
              Focus Reactor
            </p>
            <h2 className="text-lg font-black text-white">Charge your deep-work core</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Ignition on — particles orbit faster as focus charge builds in real time.
            </p>
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-5 space-y-4 ${expanded ? 'md:p-8' : ''}`}>
        <div
          className="relative rounded-2xl border overflow-hidden aspect-[16/10] min-h-[220px] max-h-[320px]"
          style={{ borderColor: brand.primary + '44', backgroundColor: '#050810' }}
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300/70">
              Reactor charge
            </p>
            <p className="text-4xl sm:text-5xl font-black text-white tabular-nums drop-shadow-lg">
              {Math.round(progressPct)}%
            </p>
            <p className="text-sm text-slate-400 mt-1 font-mono">{formatDuration(elapsedMs)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'RPM', value: rpm.toLocaleString(), sub: 'orbital' },
            { label: 'Heat', value: `${heat}%`, sub: 'core' },
            { label: 'Units', value: String(units), sub: 'focus' },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-white/10 bg-black/30 p-3 text-center"
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-500">{m.label}</p>
              <p className="text-xl font-black text-white tabular-nums">{m.value}</p>
              <p className="text-[10px] text-slate-600">{m.sub}</p>
            </div>
          ))}
        </div>

        {quip ? <p className="text-sm text-purple-200/90 text-center italic">{quip}</p> : null}

        <div className="flex flex-wrap gap-2 justify-center">
          {!running ? (
            <button
              type="button"
              onClick={startTimer}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm text-white"
              style={{ backgroundColor: brand.primary }}
            >
              <Play className="w-4 h-4 fill-current" />
              Ignite reactor
            </button>
          ) : (
            <button
              type="button"
              onClick={stopTimer}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm"
            >
              <Pause className="w-4 h-4" />
              Cooldown
            </button>
          )}
          <button
            type="button"
            onClick={resetTimer}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 text-slate-300 font-bold text-sm hover:bg-white/5"
          >
            <RotateCcw className="w-4 h-4" />
            Scram
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
          {elapsedMs >= 5000 && !running ? (
            <button
              type="button"
              onClick={finishSession}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border font-bold text-sm"
              style={{ borderColor: brand.primary + '66', color: brand.primaryText }}
            >
              <Zap className="w-4 h-4" />
              Log session
            </button>
          ) : null}
        </div>

        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Session label (e.g. Ship landing page)"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50"
        />

        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Session presets</p>
          <div className="flex flex-wrap gap-2">
            {REACTOR_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPreset(p.id, p.targetMs)}
                className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                  presetId === p.id
                    ? 'border-purple-500/50 bg-purple-500/10 text-white'
                    : 'border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <span className="font-bold block">{p.label}</span>
                <span className="text-xs opacity-80">{p.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {history.length > 0 ? (
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recent sessions</p>
            <ul className="space-y-2">
              {history.slice(0, 5).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{s.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {formatDuration(s.elapsedMs)} · {Math.round(s.peakCharge * 100)}% charge
                    </p>
                  </div>
                  <span className="font-bold shrink-0 text-purple-300">{s.focusUnits} u</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
