import { Link } from 'react-router-dom';
import { BookOpen, Calculator, Cable, Droplets, ScanSearch, Shield, Wind } from 'lucide-react';
import { useDiagnoseWeb } from '../../context/DiagnoseWebContext';
import type { TradePackId } from '../../../aibhive-diagnose/lib/packs/types';

type Tool = {
  to: string;
  title: string;
  subtitle: string;
  icon: typeof BookOpen;
  packs?: TradePackId[];
};

const TOOLS: Tool[] = [
  { to: '/diagnose/app/tools/library', title: 'Fault library', subtitle: 'Search every common field failure', icon: BookOpen },
  { to: '/diagnose/app/tools/codes', title: 'Error code lookup', subtitle: 'Brand codes across all trade packs', icon: ScanSearch },
  { to: '/diagnose/app/tools/safety', title: 'Safety checklists', subtitle: 'LOTO, chemical, laser, bonding', icon: Shield },
  { to: '/diagnose/app/tools/chemistry', title: 'Pool chemistry lab', subtitle: 'Targets + dosing estimators', icon: Calculator, packs: ['pool'] },
  { to: '/diagnose/app/tools/wire', title: 'Wire & torque charts', subtitle: 'Ampacity + lug reminders', icon: Cable, packs: ['electrical'] },
  { to: '/diagnose/app/tools/pipe', title: 'Pipe & venting charts', subtitle: 'Sizing, slope, pressure', icon: Droplets, packs: ['plumbing'] },
  { to: '/diagnose/app/tools/hvac', title: 'HVAC charge targets', subtitle: 'Superheat, subcool, delta-T', icon: Wind, packs: ['hvac'] },
  { to: '/diagnose/app/tools/fiber', title: 'Fiber loss & wavelengths', subtitle: 'Budgets, GPON nm, laser safety', icon: Cable, packs: ['fiber'] },
];

export default function DiagnoseWebTools() {
  const { activePack } = useDiagnoseWeb();
  const visible = TOOLS.filter((t) => !t.packs || t.packs.includes(activePack.id));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white">Field tools</h1>
      <p className="text-slate-400 text-sm mt-2">Reference charts and lookup desks for {activePack.shortName}.</p>
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {visible.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.to}
              to={tool.to}
              className="rounded-2xl border border-white/10 bg-[#0c1018] p-5 hover:border-amber-500/30 transition-colors"
            >
              <Icon className="w-6 h-6 text-amber-400 mb-3" />
              <p className="font-bold text-white">{tool.title}</p>
              <p className="text-sm text-slate-500 mt-1">{tool.subtitle}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
