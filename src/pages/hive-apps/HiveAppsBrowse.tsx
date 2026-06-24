import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { TrendingUp, Star, ArrowRight } from 'lucide-react';
import { SEO } from '../../components/SEO';
import HiveAppCard, { HiveAppCardSkeleton } from '../../components/hive-apps/HiveAppCard';
import { fetchStoreCatalog } from '../../lib/hiveStoreApi';
import type { HiveAppSpec, PublishedWebApp, StoreCatalog } from '../../lib/hiveAppTypes';
import { CATEGORY_LABELS } from '../../lib/hiveAppBranding';

const EMPTY: StoreCatalog = {
  apps: [],
  featured: [],
  webApps: [],
  total: 0,
  totalInstalls: 0,
  categories: {},
  query: null,
  category: null,
};

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
        description="Browse community mobile and web apps. Install free, try in your browser, tweak or build from scratch."
        keywords="Hive Apps store, community apps, install free, web app store AiBhive"
      />

      {/* Featured hero */}
      {tab === 'mobile' && !q && catalog.featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-bee-amber fill-bee-amber" />
            <h2 className="text-white font-bold text-lg">Featured</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog.featured.slice(0, 3).map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  to={`/hive-apps/app/${app.id}`}
                  className="block p-5 rounded-2xl border border-bee-amber/20 bg-gradient-to-br from-bee-amber/10 to-transparent hover:border-bee-amber/40 transition-all group"
                >
                  <p className="text-bee-amber text-xs font-bold uppercase tracking-wider mb-2">Featured</p>
                  <h3 className="text-white font-extrabold text-xl group-hover:text-bee-amber transition-colors">{app.title}</h3>
                  <p className="text-slate-400 text-sm mt-2 line-clamp-2">{app.tagline || app.summary}</p>
                  <p className="text-bee-amber text-sm font-bold mt-4 flex items-center gap-1">
                    View app <ArrowRight className="w-4 h-4" />
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar categories — store style */}
          {tab === 'mobile' && (
            <aside className="lg:w-52 shrink-0">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Categories</p>
              <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap text-left transition-colors ${
                      category === c.id
                        ? 'bg-bee-amber text-bee-black'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {CATEGORY_LABELS[c.id] || c.id}{' '}
                    <span className="opacity-70">({c.count})</span>
                  </button>
                ))}
              </nav>

              <div className="hidden lg:block mt-8 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                <TrendingUp className="w-5 h-5 text-bee-amber mb-2" />
                <p className="text-white font-bold text-sm">{catalog.totalInstalls.toLocaleString()}</p>
                <p className="text-slate-500 text-xs">Total installs</p>
                <p className="text-white font-bold text-sm mt-3">{catalog.total}</p>
                <p className="text-slate-500 text-xs">Shared apps</p>
              </div>
            </aside>
          )}

          {/* Main grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-end justify-between mb-5 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {tab === 'web' ? 'Web apps' : q ? `Results for “${q}”` : 'Browse apps'}
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  {tab === 'web'
                    ? `${catalog.webApps.length} exported web apps`
                    : loading
                      ? 'Loading…'
                      : `${catalog.apps.length} app${catalog.apps.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <Link
                to="/hive-apps/build"
                className="text-sm font-bold text-bee-amber hover:underline shrink-0"
              >
                Build from scratch →
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <HiveAppCardSkeleton key={i} />
                ))}
              </div>
            ) : tab === 'web' ? (
              catalog.webApps.length === 0 ? (
                <EmptyState
                  title="No web apps yet"
                  body="When someone exports a Hive app as a web link, it appears here. Build on mobile, then export as a web app."
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {catalog.webApps.map((w) => (
                    <HiveAppCard key={w.id} app={webAppAsCard(w)} variant="web" webApp={w} />
                  ))}
                </div>
              )
            ) : catalog.apps.length === 0 ? (
              <EmptyState
                title={q ? 'No matches' : 'Store is warming up'}
                body={
                  q
                    ? 'Try a different search or build exactly what you need.'
                    : 'Be the first — build an app in AiBhive, use it until you love it, then share to the community.'
                }
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {catalog.apps.map((app) => (
                  <HiveAppCard key={app.id} app={app} variant="mobile" />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-white/10">
      <p className="text-white font-bold text-lg mb-2">{title}</p>
      <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">{body}</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/hive-apps/build"
          className="px-6 py-2.5 rounded-full bg-bee-amber text-bee-black font-bold text-sm"
        >
          Build new app
        </Link>
        <a
          href="https://aibhive.com/api/download/apk"
          className="px-6 py-2.5 rounded-full border border-white/20 text-white font-bold text-sm"
        >
          Download AiBhive
        </a>
      </div>
    </div>
  );
}
