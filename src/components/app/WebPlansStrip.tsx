import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { fetchHivePlans, type HivePlansResponse } from '../../lib/intelWebApi';

/** Same Hive credit plans + markup as the mobile app. */
export default function WebPlansStrip() {
  const [plans, setPlans] = useState<HivePlansResponse | null>(null);

  useEffect(() => {
    void fetchHivePlans().then(setPlans);
  }, []);

  if (!plans) return null;

  const markupPct = Math.round((plans.tokenMarkup - 1) * 100);
  const paid = plans.plans.filter((p) => p.priceUsd > 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-bee-amber text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Hive credits · same as mobile
          </p>
          <p className="text-white font-bold mt-1">
            Cloud research billed at API cost + {markupPct}% · On-device tools free
          </p>
        </div>
        <a
          href="/api/download/apk"
          className="shrink-0 px-5 py-2.5 rounded-xl bg-bee-amber text-bee-black text-sm font-extrabold hover:bg-bee-yellow transition-colors"
        >
          Get full app
        </a>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-white font-black">Free</p>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            {plans.freeFeatures.slice(0, 2).join(' · ')}
          </p>
        </div>
        {paid.map((p) => (
          <div key={p.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-white font-black">
              {p.name}
              <span className="text-bee-amber ml-2">
                {p.interval === 'month' ? `$${p.priceUsd}/mo` : `$${p.priceUsd}`}
              </span>
            </p>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{p.tagline}</p>
          </div>
        ))}
      </div>
      <p className="text-slate-500 text-xs mt-4">
        BYOK: bring your own Grok/Gemini keys in the mobile app Settings. Web uses Hive Cloud (Grok when
        configured server-side).{' '}
        <Link to="/hive-apps/build" className="text-bee-amber hover:underline">
          Build custom tools ~$1
        </Link>
      </p>
    </div>
  );
}
