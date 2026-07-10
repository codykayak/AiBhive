import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { fetchHivePlans, type HivePlansResponse } from '../../../lib/intelWebApi';
import StartResearchingButton, { WORKSPACE_PATH } from './StartResearchingButton';
import styles from '../researchLab.module.css';

export default function ResearchLabPricingPlans() {
  const [plans, setPlans] = useState<HivePlansResponse | null>(null);

  useEffect(() => {
    void fetchHivePlans().then(setPlans);
  }, []);

  const paid = plans?.plans.filter((p) => p.priceUsd > 0) ?? [];

  return (
    <div className={styles.rlPricingBlock}>
      <header className={styles.rlPaygHeader}>
        <h3>Pay as you go</h3>
        <p>
          Start with <strong>$5</strong> — you receive <strong>5 Hive credits</strong> (1 credit ≈ $1 of metered
          usage). At typical BYOK + browser-routing rates, that covers roughly{' '}
          <strong>250 archive pages</strong> through scrape, OCR, and translate (~0.02 credits/page in the chart
          above). Larger runs scale linearly — bring your own API keys to pay vendors directly; AiBhive charges a
          smaller orchestration fee plus markup only when you use our in-house agents.
        </p>
      </header>

      <div className={styles.rlPaygCard}>
        <div>
          <p className={styles.rlPaygPrice}>$5</p>
          <p className={styles.rlPaygCredits}>5 Hive credits</p>
          <p className={styles.rlPaygHint}>One-time pool · tracked usage · no subscription required</p>
        </div>
        <StartResearchingButton size="md" />
      </div>

      {plans && (
        <div className={styles.rlPlansGrid}>
          <div className={styles.rlPlanCard}>
            <p className={styles.rlPlanName}>Free</p>
            <p className={styles.rlPlanPrice}>$0</p>
            <p className={styles.rlPlanTagline}>{plans.freeFeatures.slice(0, 2).join(' · ')}</p>
          </div>
          {paid.map((p) => (
            <div key={p.id} className={styles.rlPlanCard}>
              <p className={styles.rlPlanName}>{p.name}</p>
              <p className={styles.rlPlanPrice}>
                {p.interval === 'month' ? `$${p.priceUsd}/mo` : `$${p.priceUsd}`}
              </p>
              <p className={styles.rlPlanTagline}>{p.tagline}</p>
            </div>
          ))}
        </div>
      )}

      <p className={styles.rlPricingNote}>
        <Sparkles className="inline w-3.5 h-3.5 text-bee-amber mr-1" aria-hidden />
        Subscribe or top up inside the workspace after you{' '}
        <Link to={WORKSPACE_PATH} className="text-bee-amber hover:underline">
          sign in
        </Link>
        . Platform AI (Grok by default) uses Hive credits at cost + 30% markup; BYOK routes your keys and
        charges a lower orchestration fee for processing and upkeep.
      </p>
    </div>
  );
}
