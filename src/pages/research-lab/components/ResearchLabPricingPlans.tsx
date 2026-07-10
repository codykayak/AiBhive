import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, Zap, Crown, Infinity } from 'lucide-react';
import { fetchHivePlans, type HivePlansResponse } from '../../../lib/intelWebApi';
import StartResearchingButton, { WORKSPACE_PATH } from './StartResearchingButton';
import styles from '../researchLab.module.css';

const PLAN_ICONS: Record<string, typeof Zap> = {
  free: Sparkles,
  starter: Zap,
  pro: Crown,
  unlimited: Infinity,
};

const FALLBACK_HIGHLIGHTS: Record<string, string[]> = {
  free: [
    'Browse Research Lab guides and demos',
    'On-device OSINT tools',
    'BYOK builds & chat',
    'Publish to the community library when signed in',
  ],
  starter: [
    '5 Hive credits to run tools immediately',
    'Fable Scrape, OCR, translation & Grok analysis',
    'Hive Cloud search when you need it',
    'Publish findings to the communal library',
  ],
  pro: [
    '$20/mo Hive credit allowance that renews',
    'Priority Research Lab capacity',
    'Weekly archive digs & multi-agent harvests',
    'Publish & remix community sources at scale',
  ],
  unlimited: [
    '$75/mo Hive credit allowance',
    'Built for teams, dissertations & multi-domain work',
    'Largest fair-use headroom for full pipelines',
    'Community library publishing for shared corpora',
  ],
};

export default function ResearchLabPricingPlans() {
  const [plans, setPlans] = useState<HivePlansResponse | null>(null);

  useEffect(() => {
    void fetchHivePlans().then(setPlans);
  }, []);

  const allPlans = plans?.plans ?? [];

  return (
    <div className={styles.rlPricingBlock}>
      <header className={styles.rlPaygHeader}>
        <h3>Hive credits &amp; research plans</h3>
        <p>
          Research Lab runs on <strong>Hive credits</strong> — simple, tracked usage for scrapes, OCR,
          translation, and multi-agent analysis. Start with a one-time pool, or subscribe monthly for a
          renewing allowance built for serious investigators. Every plan can publish discoveries into the{' '}
          <strong>community library</strong> so other researchers can build on your work.
        </p>
      </header>

      <div className={styles.rlPaygCard}>
        <div>
          <p className={styles.rlPaygPrice}>$5</p>
          <p className={styles.rlPaygCredits}>5 Hive credits · pay as you go</p>
          <p className={styles.rlPaygHint}>
            One-time pool · no subscription required · 1 credit ≈ $1 of platform AI &amp; processing
          </p>
        </div>
        <StartResearchingButton size="md" />
      </div>

      <div className={styles.rlPlansGridElaborate}>
        {(allPlans.length
          ? allPlans
          : [
              { id: 'free', name: 'Free', priceUsd: 0, interval: null, tagline: 'Explore & BYOK', highlights: FALLBACK_HIGHLIGHTS.free },
              { id: 'starter', name: 'Starter', priceUsd: 5, interval: 'once', tagline: 'Pay as you go', highlights: FALLBACK_HIGHLIGHTS.starter },
              { id: 'pro', name: 'Pro', priceUsd: 20, interval: 'month', tagline: 'Monthly researchers', highlights: FALLBACK_HIGHLIGHTS.pro },
              {
                id: 'unlimited',
                name: 'Unlimited',
                priceUsd: 50,
                interval: 'month',
                tagline: 'Labs & power users',
                highlights: FALLBACK_HIGHLIGHTS.unlimited,
              },
            ]
        ).map((p) => {
          const Icon = PLAN_ICONS[p.id] || Sparkles;
          const highlights = p.highlights?.length ? p.highlights : FALLBACK_HIGHLIGHTS[p.id] || [];
          const featured = p.id === 'pro';
          return (
            <article
              key={p.id}
              className={`${styles.rlPlanCardElaborate} ${featured ? styles.rlPlanCardFeatured : ''}`}
            >
              {featured && <span className={styles.rlPlanBadge}>Most popular for researchers</span>}
              <div className={styles.rlPlanCardTop}>
                <Icon className={styles.rlPlanIcon} aria-hidden />
                <p className={styles.rlPlanName}>{p.name}</p>
              </div>
              <p className={styles.rlPlanPrice}>
                {p.priceUsd === 0
                  ? '$0'
                  : p.interval === 'month'
                    ? `$${p.priceUsd}/mo`
                    : `$${p.priceUsd}`}
              </p>
              <p className={styles.rlPlanTagline}>{p.tagline}</p>
              <ul className={styles.rlPlanHighlights}>
                {highlights.map((h) => (
                  <li key={h}>
                    <Check className={styles.rlPlanCheck} aria-hidden />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
              {p.id !== 'free' && (
                <div className={styles.rlPlanCta}>
                  <StartResearchingButton size="sm" />
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className={styles.rlPricingNote}>
        <Sparkles className="inline w-3.5 h-3.5 text-bee-amber mr-1" aria-hidden />
        Subscribe or top up Hive credits inside the workspace after you{' '}
        <Link to={WORKSPACE_PATH} className="text-bee-amber hover:underline">
          sign in
        </Link>
        . Platform AI (Grok by default) uses Hive credits. Bring your own API keys to pay vendors
        directly with a small platform orchestration fee. Published research strengthens the shared
        library for the whole community.
      </p>
    </div>
  );
}
