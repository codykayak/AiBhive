import { Link } from 'react-router-dom';
import { Key, Settings, Sliders } from 'lucide-react';

/** Compact build preferences — links to full settings for BYOK geeks. */
export default function WebBuildSettingsStrip() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sliders className="w-5 h-5 text-bee-amber" />
        <h2 className="text-white font-black text-lg">Build settings</h2>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed">
        Default builds use Bhive Cloud credits — simple and predictable. Power users can bring their own API keys
        on mobile today; web advanced settings are expanding to match.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <Key className="w-4 h-4 text-bee-amber mb-2" />
          <p className="text-white font-bold text-sm">Bring your own keys (BYOK)</p>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Connect your LLM and search providers. You pay your vendor directly; AiBhive adds a small platform
            pass-through on orchestration — similar to how dev tools mark up model usage.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <Settings className="w-4 h-4 text-bee-amber mb-2" />
          <p className="text-white font-bold text-sm">Advanced (mobile today)</p>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Model choice, response style, auto-approve limits, and proactive prefs live in the Android app Settings
            tab — syncing to web soon.
          </p>
        </div>
      </div>
      <Link to="/app/settings" className="inline-flex text-bee-amber font-bold text-sm hover:underline">
        Open web settings →
      </Link>
    </section>
  );
}
