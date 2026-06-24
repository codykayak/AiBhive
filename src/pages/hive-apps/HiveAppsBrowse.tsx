import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Play, Sparkles, Wrench, Share2, ArrowRight } from 'lucide-react';
import { SEO } from '../../components/SEO';
import HiveAppCard, { HiveAppCardSkeleton } from '../../components/hive-apps/HiveAppCard';
import { fetchStoreCatalog } from '../../lib/hiveStoreApi';
import { EXAMPLE_TOOLS } from '../../lib/hiveExampleApps';
import type { HiveAppSpec, PublishedWebApp, StoreCatalog } from '../../lib/hiveAppTypes';
import { CATEGORY_LABELS } from '../../lib/hiveAppBranding';

const EMPTY: StoreCatalog = {
  apps: [],
  examples: [],
  featured: [],
  webApps: [],
  total: 0,
  totalInstalls: 0,
  categories: {},
  query: null,
  category: null,
};

const STEPS = [
  { n: '1', title: 'Install free', body: 'Pick any community app — one tap adds it to My Apps.' },
  { n: '2', title: 'Tweak it', body: 'Quick spec edits in seconds. About $0.50. Your data stays.' },
  { n: '3', title: 'Share back', body: 'Opt in when you love it. The pool grows for everyone.' },
];

function webAppAsCard(w: PublishedWebApp): HiveAppSpec {
  return {
    id: w.id,
    title: w.title,
    tagline: w.summary,
    summary: w.summary,
    theme: 'blue',
    icon: 'rocket',
    pages: [],
    pageCount: 0,
  };
}

export default function HiveAppsBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'web' ? 'web' : 'mobile';
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';

  const [catalog, setCatalog] = useState<StoreCatalog>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchStoreCatalog({ q, category: category === 'all' ? '' : category, limit: 48 })
      .then(setCatalog)
      .finally(() => setLoading(false));
  }, [q, category]);

  const categories = useMemo(() => {
    const entries = Object.entries(catalog.categories).sort(
      (a, b) => (b[1] as number) - (a[1] as number)
    );
    return [{ id: 'all', count: catalog.total }, ...entries.map(([id, count]) => ({ id, count: count as number }))];
  }, [catalog.categories, catalog.total]);

  const setCategory = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'all') next.delete('category');
    else next.set('category', id);
    setSearchParams(next);
  };

  return (
    <>
      <SEO
        title="Hive Apps Store — Install, Try & Build | AiBhive"
        description="Your first app $1–$5. Browse the community pool — install free, tweak, share."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        {/* $1–$5 sell block */}
        {tab !== 'web' && !q && (
          <Link
            to="/hive-apps/build"
            className="block w-full mt-6 mb-4 rounded-2xl bg-bee-amber p-6 sm:p-8 hover:bg-bee-yellow transition-colors"
          >
            <p className="text-bee-black/70 text-xs font-bold uppercase tracking-widest">Your first app</p>
            <p className="text-bee-black text-4xl sm:text-5xl font-black mt-1">$1 to $5</p>
            <p className="text-bee-black/85 text-base sm:text-lg mt-3 max-w-xl leading-relaxed">
              Describe any tool in plain English — live on your phone in under a minute. No app store wait.
            </p>
            <span className="inline-flex items-center gap-2 mt-5 text-bee-black font-extrabold text-sm bg-black/10 px-4 py-2.5 rounded-xl">
              <Sparkles className="w-4 h-4" />
              Build from scratch
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        )}

        {/* Community 1-2-3 */}
        {tab !== 'web' && !q && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Share2 className="w-5 h-5 text-bee-amber" />
              <h2 className="text-white font-bold text-lg">Community app pool</h2>
            </div>
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="w-full flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-3"
              >
                <div className="w-10 h-10 rounded-xl bg-bee-amber/15 flex items-center justify-center shrink-0">
                  <span className="text-bee-amber font-black text-lg">{step.n}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-bold">{step.title}</p>
                  <p className="text-slate-400 text-sm mt-0.5">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Example tools — runnable in browser */}
        {tab !== 'web' && !q && (
          <div className="mb-8">
            <h2 className="text-white font-bold text-lg mb-3 px-1">Example tools</h2>
            <p className="text-slate-500 text-sm mb-3 px-1">Tap to try live in your browser — no install required.</p>
            <div className="space-y-3">
              {EXAMPLE_TOOLS.map((tool) => (
                <Link
                  key={tool.id}
                  to={`/hive-apps/run/${tool.id}`}
                  className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-bee-amber/30 transition-colors"
                >
                  <div>
                    <p className="text-white font-bold">{tool.title}</p>
                    <p className="text-slate-400 text-sm">{tool.sub}</p>
                  </div>
                  <Play className="w-5 h-5 text-bee-amber shrink-0 fill-current" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Catalog header */}
        <div className="flex items-end justify-between mb-4 px-1">
          <div>
            <h2 className="text-xl font-bold text-white">
              {tab === 'web' ? 'Web apps' : q ? `Results for “${q}”` : 'Community apps'}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {tab === 'web'
                ? `${catalog.webApps.length} published`
                : loading
                  ? 'Loading…'
                  : `${catalog.apps.length} apps · ${catalog.totalInstalls.toLocaleString()} installs`}
            </p>
          </div>
          <Link to="/hive-apps/build" className="text-bee-amber font-bold text-sm flex items-center gap-1">
            <Wrench className="w-4 h-4" />
            Build
          </Link>
        </div>

        {/* Categories — horizontal chips only when browsing mobile */}
        {tab === 'mobile' && categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${
                  category === c.id ? 'bg-bee-amber text-bee-black' : 'bg-white/5 text-slate-400'
                }`}
              >
                {CATEGORY_LABELS[c.id] || c.id} ({c.count})
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <HiveAppCardSkeleton key={i} />
            ))}
          </div>
        ) : tab === 'web' ? (
          catalog.webApps.length === 0 ? (
            <EmptyBlock title="No web apps yet" body="Export a Hive app as a web link and it appears here." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {catalog.webApps.map((w) => (
                <HiveAppCard key={w.id} app={webAppAsCard(w)} variant="web" webApp={w} />
              ))}
            </div>
          )
        ) : catalog.apps.length === 0 && (catalog.examples?.length ?? 0) === 0 ? (
          <EmptyBlock
            title={q ? 'No matches' : 'Store is warming up'}
            body="Build an app, love it, then share to the community."
          />
        ) : (
          <div className="space-y-6">
            {(catalog.examples?.length ?? 0) > 0 && !q ? (
              <div>
                <h3 className="text-white font-bold text-sm mb-3 px-1">Try in browser</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {catalog.examples!.map((app) => (
                    <HiveAppCard key={app.id} app={app} variant="mobile" runDirect />
                  ))}
                </div>
              </div>
            ) : null}
            {catalog.apps.length > 0 ? (
              <div>
                {(catalog.examples?.length ?? 0) > 0 && !q ? (
                  <h3 className="text-white font-bold text-sm mb-3 px-1">Community shared</h3>
                ) : null}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {catalog.apps.map((app) => (
                    <HiveAppCard key={app.id} app={app} variant="mobile" />
                  ))}
                </div>
              </div>
            ) : q ? (
              <EmptyBlock title="No community matches" body="Try the example tools above or build your own." />
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

function EmptyBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="w-full rounded-2xl border border-dashed border-white/10 p-12 text-center">
      <p className="text-white font-bold text-lg">{title}</p>
      <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">{body}</p>
      <Link
        to="/hive-apps/build"
        className="inline-block mt-6 px-6 py-3 rounded-xl bg-bee-amber text-bee-black font-bold text-sm"
      >
        Build your first app
      </Link>
    </div>
  );
}
