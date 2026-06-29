import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, X, Sparkles, Radar, Wand2, LayoutGrid, Bot } from 'lucide-react';
import { markSiteTourDone, shouldShowSiteTour } from '../lib/webOnboarding';

type TourStep = {
  id: string;
  target: string;
  title: string;
  body: string;
  icon: typeof Sparkles;
  path?: string;
};

const STEPS: TourStep[] = [
  {
    id: 'hub',
    target: '[data-tour="app-hub"]',
    title: 'App Command Center',
    body: 'Your home base on the web — same pillars as mobile: Do, Build, and Research.',
    icon: LayoutGrid,
    path: '/app',
  },
  {
    id: 'research',
    target: '[data-tour="nav-research"]',
    title: 'Intel Agent / Research',
    body: 'Run free OSINT on companies, domains, or people. Grok filters raw data into a readable brief.',
    icon: Radar,
    path: '/app/research',
  },
  {
    id: 'build',
    target: '[data-tour="nav-build"]',
    title: 'Build custom tools',
    body: 'Describe any app in plain English. Approve the quote and Hive Magic builds it in the browser.',
    icon: Wand2,
    path: '/hive-apps/build',
  },
  {
    id: 'apps',
    target: '[data-tour="nav-apps"]',
    title: 'My Apps & community toolkit',
    body: 'Install free tools others built, run them in-browser, and tweak when you need changes.',
    icon: LayoutGrid,
    path: '/hive-apps',
  },
  {
    id: 'assistant',
    target: '[data-tour="hive-assistant"]',
    title: 'Hive Assistant (always here)',
    body: 'On research and app pages the assistant pins to the top so you can keep chatting while you work.',
    icon: Bot,
  },
];

function getRect(selector: string): DOMRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  return el.getBoundingClientRect();
}

export default function SiteGuideTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [spot, setSpot] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!shouldShowSiteTour()) return;
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const refreshSpot = useCallback(() => {
    const s = STEPS[step];
    if (!s) return;
    setSpot(getRect(s.target));
  }, [step]);

  useEffect(() => {
    if (!visible) return;
    refreshSpot();
    const onResize = () => refreshSpot();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    const t = setInterval(refreshSpot, 400);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      clearInterval(t);
    };
  }, [visible, step, refreshSpot]);

  const finish = () => {
    markSiteTourDone();
    setVisible(false);
  };

  const next = () => {
    if (step >= STEPS.length - 1) finish();
    else setStep((s) => s + 1);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000]"
      >
        <div className="absolute inset-0 bg-black/70" onClick={finish} aria-hidden />

        {spot ? (
          <div
            className="absolute rounded-xl ring-2 ring-bee-amber ring-offset-2 ring-offset-transparent pointer-events-none transition-all duration-300"
            style={{
              top: spot.top - 6,
              left: spot.left - 6,
              width: spot.width + 12,
              height: spot.height + 12,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
            }}
          />
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 -translate-x-1/2 bottom-8 sm:bottom-12 w-[min(100vw-2rem,28rem)] rounded-2xl border border-bee-amber/30 bg-[#050810] p-6 shadow-2xl"
        >
          <div className="flex justify-between items-start gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-bee-amber/15 flex items-center justify-center">
                <Icon className="w-5 h-5 text-bee-amber" />
              </div>
              <div>
                <p className="text-bee-amber text-[10px] font-bold uppercase tracking-widest">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h2 className="text-white font-black text-lg">{current.title}</h2>
              </div>
            </div>
            <button type="button" onClick={finish} className="text-slate-500 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed mb-5">{current.body}</p>
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={finish} className="text-slate-500 text-sm font-semibold hover:text-white">
              Skip tour
            </button>
            <div className="flex gap-2">
              {current.path ? (
                <Link
                  to={current.path}
                  onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
                  className="px-4 py-2 rounded-xl border border-white/15 text-white text-sm font-bold"
                >
                  Open page
                </Link>
              ) : null}
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1 px-5 py-2 rounded-xl bg-bee-amber text-bee-black font-extrabold text-sm"
              >
                {step >= STEPS.length - 1 ? "Let's go" : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex justify-center gap-1.5 mt-4">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-bee-amber' : 'w-1.5 bg-white/20'}`}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
