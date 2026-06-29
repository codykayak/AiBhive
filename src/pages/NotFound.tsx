import { Link } from 'react-router-dom';
import { ArrowRight, Home, LayoutGrid, Search, Wand2 } from 'lucide-react';
import { SEO } from '../components/SEO';

/** Shown when no route matches — avoids a blank main area. */
export default function NotFound() {
  return (
    <>
      <SEO title="Page not found | AiBhive" description="This page does not exist. Try the App hub, Hive Apps, or Research." />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-bee-amber text-xs font-bold uppercase tracking-widest mb-3">404</p>
        <h1 className="text-3xl md:text-4xl font-black text-white">This page does not exist</h1>
        <p className="text-slate-400 mt-4 leading-relaxed">
          The link may be outdated or not deployed yet. These destinations are live and working:
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mt-10 text-left">
          <Link
            to="/app"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-bee-amber/40 transition-colors"
          >
            <LayoutGrid className="w-5 h-5 text-bee-amber shrink-0" />
            <div>
              <p className="text-white font-bold text-sm">AiBhive Apps</p>
              <p className="text-slate-500 text-xs">/app</p>
            </div>
          </Link>
          <Link
            to="/hive-apps/build"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-bee-amber/40 transition-colors"
          >
            <Wand2 className="w-5 h-5 text-bee-amber shrink-0" />
            <div>
              <p className="text-white font-bold text-sm">Build an app</p>
              <p className="text-slate-500 text-xs">/hive-apps/build</p>
            </div>
          </Link>
          <Link
            to="/app/research"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-bee-amber/40 transition-colors"
          >
            <Search className="w-5 h-5 text-bee-amber shrink-0" />
            <div>
              <p className="text-white font-bold text-sm">Research / Intel Agent</p>
              <p className="text-slate-500 text-xs">/app/research</p>
            </div>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-bee-amber/40 transition-colors"
          >
            <Home className="w-5 h-5 text-bee-amber shrink-0" />
            <div>
              <p className="text-white font-bold text-sm">Home</p>
              <p className="text-slate-500 text-xs">aibhive.com</p>
            </div>
          </Link>
        </div>
        <Link
          to="/hive-apps"
          className="inline-flex items-center gap-2 mt-10 text-bee-amber font-bold hover:underline"
        >
          Browse Hive Apps <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </>
  );
}
