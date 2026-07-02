import { useEffect, useRef, useState } from 'react';
import { Radio, TrendingDown, Zap, AlertTriangle } from 'lucide-react';
import type { SocialHunterCriteria } from '../../lib/socialHunterApi';
import {
  missedInteractionsPerSecond,
  formatMissedCount,
  bleedVelocity,
  fomoIndex,
  opportunityQuip,
  platformColor,
} from '../../lib/missedSocialMeter';

type Props = {
  criteria: SocialHunterCriteria;
  hunting: boolean;
  postsLoaded: number;
};

type Particle = {
  angle: number;
  dist: number;
  speed: number;
  size: number;
  color: string;
  alpha: number;
  pulse: number;
};

type Bleed = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

const PLATFORM_LABELS = ['LinkedIn', 'Reddit', 'X', 'Facebook'];

function pickPlatformColor(): string {
  return platformColor(PLATFORM_LABELS[Math.floor(Math.random() * PLATFORM_LABELS.length)]);
}

export function MissedSocialRadar({ criteria, hunting, postsLoaded }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const missedRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  const sweepRef = useRef(0);
  const pulseRef = useRef(0);
  const waveRef = useRef(0);
  const glitchRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const bleedsRef = useRef<Bleed[]>([]);
  const rateRef = useRef(0.4);

  const [missed, setMissed] = useState(0);
  const [rate, setRate] = useState(0.4);
  const [quip, setQuip] = useState('');

  useEffect(() => {
    const r = missedInteractionsPerSecond(criteria, hunting, postsLoaded);
    rateRef.current = r;
    setRate(r);
  }, [criteria, hunting, postsLoaded]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      missedRef.current += rateRef.current * dt;
      setMissed(missedRef.current);
      setQuip(opportunityQuip(missedRef.current, rateRef.current));
    }, 80);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 72; i++) {
        particlesRef.current.push({
          angle: Math.random() * Math.PI * 2,
          dist: 0.15 + Math.random() * 0.75,
          speed: 0.003 + Math.random() * 0.012,
          size: 2 + Math.random() * 4,
          color: pickPlatformColor(),
          alpha: 0.4 + Math.random() * 0.6,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    const draw = () => {
      if (!running) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w / 2;
      const cy = h * 0.52;
      const maxR = Math.min(w, h) * 0.38;

      pulseRef.current += 0.04;
      waveRef.current += 0.025 + rateRef.current * 0.004;
      sweepRef.current += 0.018 + rateRef.current * 0.002;
      if (Math.random() < 0.004 + rateRef.current * 0.001) glitchRef.current = 8;

      ctx.fillStyle = 'rgba(2, 6, 23, 0.22)';
      ctx.fillRect(0, 0, w, h);

      // Ambient grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Expanding pulse waves
      for (let w = 0; w < 3; w++) {
        const phase = (waveRef.current + w * 0.33) % 1;
        const wr = maxR * phase;
        ctx.beginPath();
        ctx.arc(cx, cy, wr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(248, 113, 113, ${(1 - phase) * 0.25})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Concentric radar rings
      for (let i = 5; i >= 1; i--) {
        const r = (maxR * i) / 5;
        const hue = 190 + i * 8;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue}, 90%, 55%, ${0.08 + i * 0.04})`;
        ctx.lineWidth = i === 1 ? 2 : 1;
        ctx.stroke();
      }

      // Cross hairs
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.15)';
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();

      // Radar sweep wedge
      const sweep = sweepRef.current;
      const grad = ctx.createConicGradient(sweep, cx, cy);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
      grad.addColorStop(0.08, 'rgba(34, 211, 238, 0.12)');
      grad.addColorStop(0.2, 'rgba(34, 211, 238, 0)');
      grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fill();

      // Sweep line
      const lx = cx + Math.cos(sweep) * maxR;
      const ly = cy + Math.sin(sweep) * maxR;
      const lineGrad = ctx.createLinearGradient(cx, cy, lx, ly);
      lineGrad.addColorStop(0, 'rgba(34, 211, 238, 0.9)');
      lineGrad.addColorStop(1, 'rgba(248, 113, 113, 0.2)');
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(lx, ly);
      ctx.stroke();

      // Orbiting opportunity blips (escaping outward)
      for (const p of particlesRef.current) {
        p.angle += p.speed * (1 + rateRef.current * 0.15);
        p.dist += 0.0008 + rateRef.current * 0.0003;
        if (p.dist > 1.05) {
          p.dist = 0.12;
          p.color = pickPlatformColor();
          p.angle = Math.random() * Math.PI * 2;
        }
        p.pulse += 0.08;
        const pr = p.dist * maxR;
        const px = cx + Math.cos(p.angle) * pr;
        const py = cy + Math.sin(p.angle) * pr;
        const col = p.color;
        const glow = 0.5 + Math.sin(p.pulse) * 0.3;

        ctx.beginPath();
        ctx.arc(px, py, p.size + 6, 0, Math.PI * 2);
        ctx.fillStyle = col.replace('0.9', String(0.08 * glow));
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();

        // Trail toward edge = "missed"
        ctx.strokeStyle = col.replace('0.9', '0.25');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(
          cx + Math.cos(p.angle) * maxR * 1.05,
          cy + Math.sin(p.angle) * maxR * 1.05
        );
        ctx.stroke();
      }

      // Spawn bleed particles when rate is high
      if (Math.random() < 0.08 + rateRef.current * 0.02) {
        const a = Math.random() * Math.PI * 2;
        const d = maxR * (0.3 + Math.random() * 0.5);
        bleedsRef.current.push({
          x: cx + Math.cos(a) * d,
          y: cy + Math.sin(a) * d,
          vx: Math.cos(a) * (0.4 + Math.random() * 1.2),
          vy: Math.sin(a) * (0.4 + Math.random() * 1.2),
          life: 1,
          color: pickPlatformColor(),
        });
      }

      bleedsRef.current = bleedsRef.current.filter((b) => {
        b.x += b.vx;
        b.y += b.vy;
        b.life -= 0.018;
        if (b.life <= 0) return false;
        const col = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3 * b.life, 0, Math.PI * 2);
        ctx.fillStyle = col.replace('0.9', String(0.5 * b.life));
        ctx.fill();
        return true;
      });

      // Core reactor pulse
      const corePulse = 1 + Math.sin(pulseRef.current) * 0.15;
      const coreR = 18 * corePulse;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3);
      coreGrad.addColorStop(0, 'rgba(248, 113, 113, 0.95)');
      coreGrad.addColorStop(0.4, 'rgba(251, 146, 60, 0.5)');
      coreGrad.addColorStop(1, 'rgba(248, 113, 113, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // CRT scanlines
      for (let sy = 0; sy < h; sy += 4) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, sy, w, 1);
      }

      // Glitch flash
      if (glitchRef.current > 0) {
        glitchRef.current -= 1;
        ctx.fillStyle = `rgba(248, 113, 113, ${0.06 * glitchRef.current})`;
        ctx.fillRect(0, (h * 0.35) + Math.random() * 40, w, 3 + Math.random() * 8);
        ctx.fillStyle = `rgba(34, 211, 238, ${0.04 * glitchRef.current})`;
        ctx.fillRect(0, (h * 0.55) + Math.random() * 30, w, 2);
      }

      // Side gauges
      const drawGauge = (x: number, y: number, label: string, value: number, color: string) => {
        const gw = 120;
        const gh = 8;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.fillRect(x, y, gw, gh + 16);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillText(label, x, y + 10);
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.fillRect(x, y + 14, gw, gh);
        ctx.fillStyle = color;
        ctx.fillRect(x, y + 14, gw * Math.min(1, value), gh);
      };

      const vel = bleedVelocity(rateRef.current);
      const fomo = fomoIndex(missedRef.current, rateRef.current);
      drawGauge(16, h - 56, 'BLEED VELOCITY', Math.min(1, vel / 500), 'rgba(248, 113, 113, 0.9)');
      drawGauge(w - 136, h - 56, 'FOMO INDEX', fomo, 'rgba(251, 191, 36, 0.9)');

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const velocity = bleedVelocity(rate);
  const fomo = fomoIndex(missed, rate);

  return (
    <div className="overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-slate-950 via-rose-950/40 to-slate-950 shadow-2xl shadow-rose-500/10">
      <div className="relative border-b border-rose-500/20 bg-slate-950/80 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="h-5 w-5 text-rose-400" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-rose-500" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300/80">
                Missed opportunity radar
              </p>
              <h2 className="text-lg font-bold text-white sm:text-xl">Missed social interactions</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-200">
              <TrendingDown className="h-3 w-3" />
              Live bleed
            </span>
            {hunting && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-2.5 py-1 text-xs font-semibold text-cyan-200">
                <Zap className="h-3 w-3" />
                Hunting — bleed slowing
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative grid lg:grid-cols-[1fr_280px]">
          <div className="relative min-h-[320px] sm:min-h-[380px] lg:min-h-[420px]">
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-300/70">
                interactions you didn&apos;t catch
              </p>
              <p
                className="mt-1 font-mono text-5xl font-black tabular-nums tracking-tight text-white drop-shadow-[0_0_24px_rgba(248,113,113,0.6)] sm:text-6xl lg:text-7xl"
                aria-live="polite"
              >
                {formatMissedCount(missed)}
              </p>
              <p className="mt-2 max-w-md px-4 text-center text-sm text-rose-200/80">
                +{rate.toFixed(1)}/sec while you&apos;re not in the thread
              </p>
            </div>
          </div>

          <div className="border-t border-rose-500/20 bg-slate-950/60 p-4 lg:border-l lg:border-t-0">
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Threat level</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-500 transition-all duration-300"
                    style={{ width: `${Math.round(fomo * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  FOMO index: <span className="font-mono text-amber-200">{Math.round(fomo * 100)}%</span>
                </p>
              </div>

              <div className="rounded-lg border border-rose-500/20 bg-slate-900/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bleed velocity</p>
                <p className="mt-1 font-mono text-2xl font-bold text-rose-300">
                  {velocity.toFixed(2)}
                  <span className="ml-1 text-sm font-normal text-slate-500">u/s</span>
                </p>
              </div>

              <div className="rounded-lg border border-cyan-500/20 bg-slate-900/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Posts in net</p>
                <p className="mt-1 font-mono text-2xl font-bold text-cyan-300">{postsLoaded}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {postsLoaded === 0
                    ? 'Zero captured — radar estimates everything else as missed'
                    : 'Captured posts slow the bleed slightly'}
                </p>
              </div>

              <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-3">
                <p className="text-xs italic leading-relaxed text-slate-400">&ldquo;{quip}&rdquo;</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PLATFORM_LABELS.map((p) => (
                  <span
                    key={p}
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
                    style={{ backgroundColor: platformColor(p).replace('0.9', '0.2') }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
