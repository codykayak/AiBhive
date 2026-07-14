import { useMemo, useState } from 'react';
import {
  POOL_CHEM_TARGETS,
  estimateAcidOz,
  estimateLiquidChlorineOz,
  estimateSaltLbs,
  slamFcTarget,
} from '@/lib/knowledge/pool/chemistry';

export default function DiagnoseWebPoolChem() {
  const [gallons, setGallons] = useState('15000');
  const [ph, setPh] = useState('7.8');
  const [targetPh, setTargetPh] = useState('7.4');
  const [fcDelta, setFcDelta] = useState('2');
  const [saltDelta, setSaltDelta] = useState('400');
  const [cya, setCya] = useState('60');

  const g = Number(gallons) || 0;
  const acid = useMemo(() => estimateAcidOz(g, Number(ph) || 0, Number(targetPh) || 0), [g, ph, targetPh]);
  const chlorine = useMemo(() => estimateLiquidChlorineOz(g, Number(fcDelta) || 0), [g, fcDelta]);
  const salt = useMemo(() => estimateSaltLbs(g, Number(saltDelta) || 0), [g, saltDelta]);
  const slam = useMemo(() => slamFcTarget(Number(cya) || 0), [cya]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white">Pool chemistry lab</h1>
      <p className="text-slate-400 text-sm mt-2">Field estimators — confirm with a good test kit.</p>

      <h2 className="text-sm font-bold uppercase text-slate-500 mt-8 mb-3">Targets</h2>
      <div className="grid sm:grid-cols-2 gap-2">
        {POOL_CHEM_TARGETS.map((t) => (
          <div key={t.name} className="rounded-xl border border-white/10 p-3 text-sm">
            <p className="font-bold text-white">{t.name}</p>
            <p className="text-cyan-400">{t.min}–{t.max} {t.unit}</p>
            <p className="text-slate-500 text-xs mt-1">{t.tip}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <Field label="Pool gallons" value={gallons} onChange={setGallons} />
        <CalcCard title="Lower pH (muriatic ~31%)">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Now" value={ph} onChange={setPh} />
            <Field label="Target" value={targetPh} onChange={setTargetPh} />
          </div>
          <p className="text-lg font-bold text-cyan-400 mt-2">≈ {acid} oz acid</p>
        </CalcCard>
        <CalcCard title="Raise FC (12.5% liquid chlorine)">
          <Field label="Δ ppm" value={fcDelta} onChange={setFcDelta} />
          <p className="text-lg font-bold text-cyan-400 mt-2">≈ {chlorine} oz</p>
        </CalcCard>
        <CalcCard title="Add salt">
          <Field label="Δ ppm" value={saltDelta} onChange={setSaltDelta} />
          <p className="text-lg font-bold text-cyan-400 mt-2">≈ {salt} lbs</p>
        </CalcCard>
        <CalcCard title="SLAM FC target from CYA">
          <Field label="CYA ppm" value={cya} onChange={setCya} />
          <p className="text-lg font-bold text-amber-400 mt-2">Aim ≈ {slam} ppm FC</p>
        </CalcCard>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-500 text-xs">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-[#0c1018] border border-white/10 text-white"
      />
    </label>
  );
}

function CalcCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0c1018] p-4">
      <p className="font-bold text-white">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
