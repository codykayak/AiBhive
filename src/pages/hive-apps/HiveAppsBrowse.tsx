import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Play, Sparkles, Wrench, Share2, ArrowRight } from 'lucide-react';
import { SEO } from '../../components/SEO';
import BuildPlatformStrip from '../../components/BuildPlatformStrip';
import HiveAppCard, { HiveAppCardSkeleton } from '../../components/hive-apps/HiveAppCard';
import HiveAppLivePanel from '../../components/hive-apps/HiveAppLivePanel';
import { fetchStoreCatalog } from '../../lib/hiveStoreApi';
import { EXAMPLE_TOOLS, EXAMPLE_APP_IDS } from '../../lib/hiveExampleApps';
import { PLATFORM_WEB_APPS, platformAppAsCard } from '../../lib/platformWebApps';
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

function useDesktopStore() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isDesktop;
}

export default function HiveAppsBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'web' ? 'web' : 'mobile';
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const activeAppId = searchParams.get('app');

  const [catalog, setCatalog] = useState<StoreCatalog>(EMPTY);
  const [loading, setLoading] = useState(true);
  const isDesktop = useDesktopStore();

  useEffect(() => {
    setLoading(true);
    fetchStoreCatalog({ q, category: category === 'all' ? '' : category, limit: 48 })
      .then(setCatalog)
      .finally(() => setLoading(false));
  }, [q, category]);

  const examples = catalog.examples ?? [];
  const runnableApps = useMemo(
    () => [...examples, ...catalog.apps],
    [examples, catalog.apps]
  );

  const selectApp = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('app', id);
    setSearchParams(next);
  };

  useEffect(() => {
    if (!isDesktop || q || tab === 'web' || activeAppId) return;
    selectApp(EXAMPLE_APP_IDS.socialPostHunter);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only seed desktop preview once
  }, [isDesktop, q, tab, activeAppId]);

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

  const showSplit = isDesktop && tab === 'mobile' && !q;

  const catalogSection = (
    <>
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

      {tab !== 'web' && !q && (
        <div className="mb-8">
          <h2 className="text-white font-bold text-lg mb-3 px-1">AiBhive Labs</h2>
          <p className="text-slate-500 text-sm mb-3 px-1">
            Built-in web tools — OCR and multilingual transcription.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PLATFORM_WEB_APPS.map((app) => (
              <HiveAppCard key={app.id} app={platformAppAsCard(app)} variant="web" webApp={app} />
            ))}
          </div>
        </div>
      )}

      {tab !== 'web' && !q && (
        <div className="mb-8">
          <Link
            to="/hive-apps/run/example-social-post-hunter"
            className="block w-full rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-950/80 via-[#0b0f14] to-bee-black p-6 sm:p-8 hover:border-violet-400/60 transition-colors hive-tile-glow"
          >
            <p className="text-violet-300 text-xs font-bold uppercase tracking-widest">Featured app</p>
            <p className="text-white text-2xl sm:text-3xl font-black mt-1">Social Post Hunter</p>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Discover threads by topic, draft replies, Reddit-safe search, and missed-opportunity radar — run it
              free in your browser.
            </p>
            <span className="inline-flex items-center gap-2 mt-4 text-bee-amber font-extrabold text-sm">
              <Play className="w-4 h-4 fill-current" />
              Open Social Post Hunter
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      )}

      {tab !== 'web' && !q && (
        <div className="mb-8">
          <h2 className="text-white font-bold text-lg mb-3 px-1">Example tools</h2>
          <p className="text-slate-500 text-sm mb-3 px-1">
            {showSplit ? 'Click to run instantly in the panel →' : 'Tap to try live in your browser.'}
          </p>
          <div className="space-y-3">
            {EXAMPLE_TOOLS.map((tool) =>
              showSplit ? (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => selectApp(tool.id)}
                  className={`w-full flex items-center justify-between rounded-2xl border p-5 transition-colors text-left ${
                    activeAppId === tool.id
                      ? 'border-bee-amber/50 bg-bee-amber/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-bee-amber/30'
                  } ${'featured' in tool && tool.featured ? 'ring-1 ring-violet-500/30' : ''}`}
                >
                  <div>
                    <p className="text-white font-bold">
                      {tool.title}
                      {'featured' in tool && tool.featured ? (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-violet-300 font-bold">
                          Featured
                        </span>
                      ) : null}
                    </p>
                    <p className="text-slate-400 text-sm">{tool.sub}</p>
                  </div>
                  <Play className="w-5 h-5 text-bee-amber shrink-0 fill-current" />
                </button>
              ) : (
                <Link
                  key={tool.id}
                  to={`/hive-apps/run/${tool.id}`}
                  className={`w-full flex items-center justify-between rounded-2xl border p-5 hover:border-bee-amber/30 transition-colors ${
                    'featured' in tool && tool.featured
                      ? 'border-violet-500/40 bg-violet-950/30'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <div>
                    <p className="text-white font-bold">
                      {tool.title}
                      {'featured' in tool && tool.featured ? (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-violet-300 font-bold">
                          Featured
                        </span>
                      ) : null}
                    </p>
                    <p className="text-slate-400 text-sm">{tool.sub}</p>
                  </div>
                  <Play className="w-5 h-5 text-bee-amber shrink-0 fill-current" />
                </Link>
              )
            )}
          </div>
        </div>
      )}

      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl font-bold text-white">
            {tab === 'web' ? 'Web apps' : q ? `Results for “${q}”` : 'All apps'}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {tab === 'web'
              ? `${catalog.webApps.length} published`
              : loading
                ? 'Loading…'
                : `${runnableApps.length} runnable · ${catalog.totalInstalls.toLocaleString()} community installs`}
          </p>
        </div>
        <Link to="/hive-apps/build" className="text-bee-amber font-bold text-sm flex items-center gap-1">
          <Wrench className="w-4 h-4" />
          Build
        </Link>
      </div>

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
            {[...PLATFORM_WEB_APPS, ...catalog.webApps.filter((w) => !w.id.startsWith('platform/'))].map((w) => (
              <HiveAppCard key={w.id} app={webAppAsCard(w)} variant="web" webApp={w} />
            ))}
          </div>
        )
      ) : runnableApps.length === 0 ? (
        <EmptyBlock
          title={q ? 'No matches' : 'Store is warming up'}
          body="Build an app, love it, then share to the community."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {runnableApps.map((app) =>
            showSplit ? (
              <HiveAppCard
                key={app.id}
                app={app}
                variant="mobile"
                selected={activeAppId === app.id}
                onSelect={selectApp}
              />
            ) : (
              <HiveAppCard key={app.id} app={app} variant="mobile" runDirect={app.isExample} />
            )
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      <SEO
        title="Hive Apps Store — Install, Try & Build | AiBhive"
        description="Your first app $1–$5. Browse the community pool — install free, tweak, share."
      />

      <div className={`mx-auto px-4 sm:px-6 pb-16 ${showSplit ? 'max-w-7xl' : 'max-w-5xl'}`}>
        {tab !== 'web' && !q && (
          <section className="mt-6 mb-8">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f14]">
              <video
                className="w-full aspect-video object-cover"
                autoPlay
                loop
                muted
                playsInline
                poster="/og-image.png"
              >
                <source src="/aibhive_mobile_app_builder_ai.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-[#070a0f] via-[#070a0f]/40 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="text-bee-amber text-xs font-bold uppercase tracking-widest">Hive Apps</p>
                <h1 className="text-white text-3xl sm:text-4xl font-black mt-1 max-w-2xl">
                  Build any app in plain English
                </h1>
                <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
                  Describe a tool on your phone — live in under a minute. Install community apps free, tweak for
                  pennies, or customize from a few dollars.
                </p>
              </div>
            </div>

            <Link
              to="/hive-apps/build"
              className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-bee-amber/35 bg-bee-amber/10 p-5 sm:p-6 hover:border-bee-amber/55 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-bee-amber text-xs font-bold uppercase tracking-widest">Featured</p>
                <p className="text-white text-xl sm:text-2xl font-black mt-1">Your first app: $1 to $5</p>
                <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                  Most apps appear on your phone in under a minute — no app store wait.
                </p>
              </div>
              <span className="inline-flex items-center justify-center gap-2 shrink-0 text-bee-black font-extrabold text-sm bg-bee-amber px-4 py-2.5 rounded-xl">
                <Sparkles className="w-4 h-4" />
                Build from scratch
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </section>
        )}

        {showSplit ? (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(380px,480px)] gap-6 lg:gap-8 items-start">
            <div className="min-w-0">{catalogSection}</div>
            <div className="lg:sticky lg:top-44">
              <p className="text-white font-bold text-sm mb-3 px-1">Live preview</p>
              <HiveAppLivePanel appId={activeAppId} />
              {activeAppId ? (
                <Link
                  to={`/hive-apps/run/${activeAppId}`}
                  className="mt-3 block text-center text-bee-amber text-sm font-bold hover:underline"
                >
                  Open full screen
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          catalogSection
        )}
      </div>
      <BuildPlatformStrip />
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
