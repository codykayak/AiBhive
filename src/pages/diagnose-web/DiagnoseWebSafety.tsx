import { useDiagnoseWeb } from '../../context/DiagnoseWebContext';

const CHECKS: Record<string, string[]> = {
  pool: [
    'Lock out pump and heater breakers before opening wet equipment.',
    'Verify GFCI protection on pool light and outlet circuits.',
    'Wear eye protection when handling acid or chlorine concentrates.',
    'Never bypass pressure switches or flow sensors on heaters.',
  ],
  electrical: [
    'LOTO — verify absence of voltage before touching conductors.',
    'Assume all wires are live until proven dead.',
    'Use insulated tools and rated PPE for the voltage class.',
    'Do not work alone inside energized panels when possible.',
  ],
  property: [
    'Lock out power, gas, and water before opening appliances.',
    'Use mats on wet bathroom floors during tub/shower work.',
    'Ventilate when using solvents or drain cleaners.',
  ],
  plumbing: [
    'Locate main shutoff before opening supply lines.',
    'Open drains slowly — sewage exposure risk on backups.',
    'Gas odor → evacuate, no switches, call gas utility from outside.',
  ],
  hvac: [
    'LOTO outdoor and indoor units before panel work.',
    'Check for gas leaks and CO when servicing furnaces.',
    'Recover refrigerant — no venting (EPA 608).',
  ],
  fiber: [
    'Never look into live fiber or open ports — laser eye hazard.',
    'Cap unused ports. PON power can exceed Class 1.',
    'Use proper eyewear when splicing with active illumination.',
  ],
};

export default function DiagnoseWebSafety() {
  const { activePack } = useDiagnoseWeb();
  const items = CHECKS[activePack.id] || CHECKS.property;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white">Safety checklist</h1>
      <p className="text-slate-400 text-sm mt-2">{activePack.name}</p>
      <ul className="mt-8 space-y-4">
        {items.map((item) => (
          <li key={item} className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-slate-200">
            <span className="text-red-400 font-bold">!</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
