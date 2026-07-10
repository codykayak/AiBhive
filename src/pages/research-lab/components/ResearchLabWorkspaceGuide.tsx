import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ScanSearch, Library, Ticket, Check, Loader2 } from 'lucide-react';
import { useResearchLabUser } from '../context/ResearchLabUserContext';
import { useOwrWorkflow } from '../context/OwrWorkflowContext';
import styles from '../researchLab.module.css';

const GUIDE_STEPS = [
  {
    n: 1,
    title: 'Harvest sources',
    body: 'Open Fable Scrape and pull pages, plates, or archives into your session.',
    icon: ScanSearch,
    stepId: 0,
  },
  {
    n: 2,
    title: 'Read & refine',
    body: 'Run OCR, translate scripts, and ask smart questions over what you collected.',
    icon: Compass,
    stepId: 1,
  },
  {
    n: 3,
    title: 'Publish to the library',
    body: 'Share cleaned findings so other researchers can build on your trail.',
    icon: Library,
    stepId: 2,
  },
];

export default function ResearchLabWorkspaceGuide() {
  const { setActiveStep } = useOwrWorkflow();
  const user = useResearchLabUser();
  const [code, setCode] = useState('');
  const [promo, setPromo] = useState<{
    code?: string | null;
    label?: string | null;
    partnerName?: string | null;
  } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/hive/account/${encodeURIComponent(user.uid)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setPromo({
            code: data.account?.promoCode || data.promoCode,
            label: data.account?.promoLabel || data.promoLabel,
            partnerName: data.account?.partnerName || data.partnerName,
          });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !code.trim()) return;
    setStatus('loading');
    setMessage('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/hive/promo/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not apply promo');
      setStatus('ok');
      setMessage(data.message || 'Promo applied — near-cost Hive credits.');
      setPromo({ code: data.code, label: data.label, partnerName: data.partnerName });
      setCode('');
    } catch (err) {
      setStatus('err');
      setMessage(err instanceof Error ? err.message : 'Promo failed');
    }
  }

  return (
    <section className={styles.rlWsGuide} aria-label="How to use Research Lab">
      <div className={styles.rlWsGuideTop}>
        <div>
          <p className={styles.rlWsGuideEyebrow}>Quick start</p>
          <h2 className={styles.rlWsGuideTitle}>Three steps to compound research</h2>
          <p className={styles.rlWsGuideLead}>
            Multi-agent tools, Hive credits, and a community library — start here, then dive into the
            workbench below.
          </p>
        </div>
        <Link to="/research-lab" className={styles.rlBtnGhost}>
          Back to Research Lab
        </Link>
      </div>

      <ol className={styles.rlWsGuideSteps}>
        {GUIDE_STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.n}>
              <button
                type="button"
                className={styles.rlWsGuideCard}
                onClick={() => setActiveStep(s.stepId)}
              >
                <span className={styles.rlWsGuideNum} aria-hidden>
                  {s.n}
                </span>
                <Icon className={styles.rlWsGuideIcon} aria-hidden />
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </button>
            </li>
          );
        })}
      </ol>

      <div className={styles.rlWsPromo}>
        <div className={styles.rlWsPromoCopy}>
          <Ticket className={styles.rlWsPromoIcon} aria-hidden />
          <div>
            <h3>Creator / partner promo</h3>
            <p>
              Podcasters &amp; YouTubers: enter your code for near-cost Hive credits (API + server
              usage). Publish discoveries to grow the shared library.
            </p>
            {promo?.code && (
              <p className={styles.rlWsPromoActive}>
                <Check className="inline w-3.5 h-3.5 mr-1" aria-hidden />
                Active: <strong>{promo.code}</strong>
                {promo.partnerName ? ` · ${promo.partnerName}` : ''}
              </p>
            )}
          </div>
        </div>
        <form className={styles.rlWsPromoForm} onSubmit={redeem}>
          <label className="sr-only" htmlFor="rl-promo-code">
            Promo code
          </label>
          <input
            id="rl-promo-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="YOURNAME"
            autoComplete="off"
            maxLength={40}
          />
          <button type="submit" disabled={status === 'loading' || !code.trim()}>
            {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
          </button>
        </form>
        {message && (
          <p className={status === 'err' ? styles.rlWsPromoErr : styles.rlWsPromoOk} role="status">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
