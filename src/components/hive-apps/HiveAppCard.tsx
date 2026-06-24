import { Link } from 'react-router-dom';
import type { FC } from 'react';
import { Download, Globe, Smartphone } from 'lucide-react';
import type { HiveAppSpec, PublishedWebApp } from '../../lib/hiveAppTypes';
import { brandFor, iconFor, CATEGORY_LABELS } from '../../lib/hiveAppBranding';

type Props = {
  app: HiveAppSpec;
  variant?: 'mobile' | 'web';
  webApp?: PublishedWebApp;
  /** Open full-screen runner instead of store detail page. */
  runDirect?: boolean;
};

const HiveAppCard: FC<Props> = ({ app, variant = 'mobile', webApp, runDirect }) => {
  const brand = brandFor(app.theme);
  const Icon = iconFor(app.icon);
  const href =
    variant === 'web' && webApp
      ? webApp.url
      : runDirect || app.isExample
        ? `/hive-apps/run/${app.id}`
        : `/hive-apps/app/${app.id}`;
  const isExternal = variant === 'web';

  const inner = (
    <>
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-105 transition-transform"
        style={{ background: `linear-gradient(135deg, ${brand.gradientFrom}, ${brand.gradientTo})` }}
      >
        {variant === 'web' ? (
          <Globe className="w-8 h-8 text-white" />
        ) : (
          <Icon className="w-8 h-8" style={{ color: brand.contrastText }} />
        )}
      </div>
      <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 group-hover:text-bee-amber transition-colors">
        {app.title}
      </h3>
      <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
        {app.tagline || app.summary || `${app.pageCount || app.pages?.length || 0} pages`}
      </p>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {variant === 'mobile' && app.category ? (
          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
            {CATEGORY_LABELS[app.category] || app.category}
          </span>
        ) : null}
        {variant === 'mobile' ? (
          <span className="text-[10px] font-bold text-bee-amber flex items-center gap-1">
            <Download className="w-3 h-3" />
            {(app.installCount || 0).toLocaleString()}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-sky-400 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Web app
          </span>
        )}
        {variant === 'mobile' ? (
          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
            <Smartphone className="w-3 h-3" />
            {app.isExample ? 'Try free' : 'Free install'}
          </span>
        ) : null}
      </div>
    </>
  );

  const className =
    'group block p-4 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-bee-amber/20 transition-all';

  if (isExternal && webApp) {
    return (
      <a href={webApp.url} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {inner}
    </Link>
  );
};

export default HiveAppCard;

export function HiveAppCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse">
      <div className="w-16 h-16 rounded-2xl bg-white/10 mb-3" />
      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
      <div className="h-3 bg-white/5 rounded w-full" />
    </div>
  );
}
