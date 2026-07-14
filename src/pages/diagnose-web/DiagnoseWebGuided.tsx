import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { guidedFlows, getGuidedFlows } from '@/lib/knowledge/guided';
import { getFaultById, formatFaultAsReply } from '@/lib/knowledge/search';
import { useDiagnoseWeb } from '../../context/DiagnoseWebContext';
import { DiagnoseMarkdown } from '../../lib/diagnoseWeb/markdown';

export default function DiagnoseWebGuidedList() {
  const { activePack } = useDiagnoseWeb();
  const flows = getGuidedFlows(activePack.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white">Guided flows</h1>
      <p className="text-slate-400 text-sm mt-2">Yes/no decision trees that land on fault playbooks.</p>
      <div className="mt-8 space-y-3">
        {flows.map((f) => (
          <Link
            key={f.id}
            to={`/diagnose/app/guided/${f.id}`}
            className="block rounded-xl border border-white/10 bg-[#0c1018] p-4 hover:border-amber-500/30"
          >
            <p className="font-bold text-white">{f.title}</p>
            <p className="text-sm text-slate-500 mt-1">{f.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DiagnoseWebGuidedPlayer() {
  const { flowId } = useParams<{ flowId: string }>();
  const flow = guidedFlows.find((f) => f.id === flowId);
  const [stepId, setStepId] = useState(flow?.startStepId ?? '');

  if (!flow) return <p className="p-8 text-slate-400">Flow not found.</p>;

  const step = flow.steps[stepId];
  if (!step) return <p className="p-8 text-slate-400">Invalid step.</p>;

  if (step.resultFaultId) {
    const fault = getFaultById(step.resultFaultId);
    const text = fault ? formatFaultAsReply(fault) : 'Playbook not found.';
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-white mb-6">{flow.title} — result</h1>
        <DiagnoseMarkdown text={text} />
        <Link to="/diagnose/app/guided" className="inline-block mt-8 text-amber-400 font-bold text-sm">
          ← All guided flows
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{flow.title}</p>
      <h1 className="text-xl font-bold text-white mt-2">{step.prompt}</h1>
      <div className="mt-8 flex gap-3">
        {step.yesNext && (
          <button
            type="button"
            onClick={() => setStepId(step.yesNext!)}
            className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold"
          >
            Yes
          </button>
        )}
        {step.noNext && (
          <button
            type="button"
            onClick={() => setStepId(step.noNext!)}
            className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold"
          >
            No
          </button>
        )}
      </div>
    </div>
  );
}
