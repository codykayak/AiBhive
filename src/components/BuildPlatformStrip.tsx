import { Link } from 'react-router-dom';
import { Globe, Smartphone } from 'lucide-react';

/** Web + Android CTA — use on app build and hive-apps pages. */
export default function BuildPlatformStrip({ className = '' }: { className?: string }) {
  return (
    <section className={`border-t border-white/5 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid sm:grid-cols-2 gap-4">
        <Link
          to="/hive-apps/build"
          className="flex items-center gap-4 rounded-2xl bg-bee-amber/10 border border-bee-amber/30 p-6 hover:bg-bee-amber/15 transition-colors"
        >
          <Globe className="w-8 h-8 text-bee-amber shrink-0" />
          <div>
            <p className="text-white font-extrabold">Build on the web</p>
            <p className="text-slate-400 text-sm">Bhive Builder — describe, approve, use</p>
          </div>
        </Link>
        <a
          href="/api/download/apk"
          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-bee-amber/30 transition-colors"
        >
          <Smartphone className="w-8 h-8 text-bee-amber shrink-0" />
          <div>
            <p className="text-white font-extrabold">Full experience on Android</p>
            <p className="text-slate-400 text-sm">Download AiBhive APK</p>
          </div>
        </a>
      </div>
    </section>
  );
}
