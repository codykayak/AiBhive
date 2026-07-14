import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, MessageSquare, Route, ScanSearch } from 'lucide-react';
import { useDiagnoseWeb } from '../../context/DiagnoseWebContext';
import { getGuidedFlows } from '@diagnose/lib/knowledge/guided';

export default function DiagnoseWebHome() {
  const { activePack } = useDiagnoseWeb();
  const flows = getGuidedFlows(activePack.id).slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f1520] to-[#0a0e16] p-6 md:p-10">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: activePack.accentColor }}>
          {activePack.name}
        </p>
        <h1 className="text-3xl md:text-4xl font-black text-white mt-2">What are you troubleshooting?</h1>
        <p className="text-slate-400 mt-3 max-w-2xl">{activePack.description}</p>
        <Link
          to="/diagnose/app/chat"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400"
        >
          <MessageSquare className="w-4 h-4" />
          Open diagnose chat
        </Link>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Quick prompts</h2>
        <div className="flex flex-wrap gap-2">
          {activePack.quickPrompts.map((prompt) => (
            <Link
              key={prompt}
              to={`/diagnose/app/chat?prompt=${encodeURIComponent(prompt)}`}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:border-amber-500/40 hover:text-white"
            >
              {prompt}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        <Link
          to="/diagnose/app/tools/library"
          className="rounded-2xl border border-white/10 bg-[#0c1018] p-5 hover:border-white/20 transition-colors group"
        >
          <BookOpen className="w-6 h-6 text-amber-400 mb-3" />
          <p className="font-bold text-white group-hover:text-amber-400">Fault library</p>
          <p className="text-sm text-slate-500 mt-1">Search every playbook in the active pack</p>
        </Link>
        <Link
          to="/diagnose/app/tools/codes"
          className="rounded-2xl border border-white/10 bg-[#0c1018] p-5 hover:border-white/20 transition-colors group"
        >
          <ScanSearch className="w-6 h-6 text-amber-400 mb-3" />
          <p className="font-bold text-white group-hover:text-amber-400">Error codes</p>
          <p className="text-sm text-slate-500 mt-1">Brand and generic code lookup</p>
        </Link>
        <Link
          to="/diagnose/app/guided"
          className="rounded-2xl border border-white/10 bg-[#0c1018] p-5 hover:border-white/20 transition-colors group"
        >
          <Route className="w-6 h-6 text-amber-400 mb-3" />
          <p className="font-bold text-white group-hover:text-amber-400">Guided flows</p>
          <p className="text-sm text-slate-500 mt-1">{flows.length} flows for {activePack.shortName}</p>
        </Link>
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-white font-bold">Switch trade pack</p>
          <p className="text-sm text-slate-500">Pool, electrical, plumbing, HVAC, fiber, property</p>
        </div>
        <Link to="/diagnose/app/packs" className="flex items-center gap-1 text-amber-400 font-bold text-sm">
          Browse packs <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
