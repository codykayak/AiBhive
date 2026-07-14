import { Link } from 'react-router-dom';
import { ArrowRight, Download, Smartphone, Wrench } from 'lucide-react';

type ProsGetAppCtaProps = {
  tradeName?: string;
  accentColor?: string;
};

export default function ProsGetAppCta({ tradeName, accentColor = '#F5A623' }: ProsGetAppCtaProps) {
  const headline = tradeName
    ? `Get AiBhive Pros for ${tradeName}`
    : 'Get AiBhive Pros on every truck';

  return (
    <section className="py-16 sm:py-20 bg-slate-900 text-white border-t border-white/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider mb-5"
          style={{ borderColor: `${accentColor}55`, color: accentColor }}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Field app
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{headline}</h2>
        <p className="mt-4 text-slate-400 leading-relaxed max-w-2xl mx-auto">
          Install <strong className="text-white">AiBhive Pros</strong> on Android — voice, photo, and chat diagnosis
          with offline trade packs. Sign in with your team code; managers wire up HQ at{' '}
          <Link to="/pros/app" className="text-amber-400 hover:underline">
            aibhive.com/pros/app
          </Link>
          .
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/download.html"
            className="inline-flex items-center justify-center gap-2 rounded-lg font-bold px-8 py-4 text-slate-900 w-full sm:w-auto"
            style={{ backgroundColor: accentColor }}
          >
            <Download className="w-5 h-5" />
            Download the app
          </a>
          <a
            href="/api/download/diagnose-apk"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 font-bold px-8 py-4 w-full sm:w-auto"
          >
            Direct APK
            <ArrowRight className="w-5 h-5" />
          </a>
          <Link
            to="/diagnose"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 font-bold px-8 py-4 w-full sm:w-auto"
          >
            Try Diagnose on web
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/pros/app"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 font-bold px-8 py-4 w-full sm:w-auto"
          >
            <Wrench className="w-5 h-5" />
            Launch company HQ
          </Link>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Android APK · Team code from your manager · Works offline with trade packs
        </p>
      </div>
    </section>
  );
}
