import { Link, useParams } from 'react-router-dom';
import { getFaultById, formatFaultAsReply } from '@/lib/knowledge/search';
import { DiagnoseMarkdown } from '../../lib/diagnoseWeb/markdown';

export default function DiagnoseWebFault() {
  const { faultId } = useParams<{ faultId: string }>();
  const fault = faultId ? getFaultById(faultId) : null;

  if (!fault) {
    return <p className="p-8 text-slate-400">Fault not found.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <p className="text-xs uppercase tracking-wider text-slate-500">{fault.packId} · {fault.category}</p>
      <h1 className="text-2xl font-black text-white mt-2">{fault.title}</h1>
      <span className="inline-block mt-2 text-xs font-bold uppercase px-2 py-1 rounded bg-white/5 text-amber-400">
        {fault.severity}
      </span>
      <div className="mt-8">
        <DiagnoseMarkdown text={formatFaultAsReply(fault)} />
      </div>
      <Link
        to={`/diagnose/app/chat?prompt=${encodeURIComponent(fault.title)}`}
        className="inline-block mt-8 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-sm"
      >
        Ask AI about this fault
      </Link>
    </div>
  );
}
