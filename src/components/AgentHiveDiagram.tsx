import { motion } from 'motion/react';
import { Scale, Stethoscope, FileSearch, Languages, ShieldCheck, Database } from 'lucide-react';

const AGENTS = [
  {
    icon: FileSearch,
    name: 'Transcription Agent',
    role: 'Pass 1 — Acoustic & structural capture',
    description: 'Produces the initial transcript with speaker diarization and timestamp fidelity.',
  },
  {
    icon: Stethoscope,
    name: 'Medical Specialist Agent',
    role: 'Pass 2 — Clinical terminology',
    description: 'Validates drug names, dosages, ICD references, and SOAP structure for healthcare content.',
  },
  {
    icon: Scale,
    name: 'Legal Specialist Agent',
    role: 'Pass 2 — Legal terminology',
    description: 'Cross-checks citations, procedural language, and jurisdiction-specific phrasing.',
  },
  {
    icon: Languages,
    name: 'Linguistic QA Agent',
    role: 'Pass 3 — Flow & clarity',
    description: 'Ensures readability, consistent tense, and faithful meaning without altering legal/medical facts.',
  },
  {
    icon: Database,
    name: 'RAG Verification Agent',
    role: 'Pass 4 — Knowledge grounding',
    description: 'Queries private corpora (SNOMED, ORS, firm playbooks) to flag unsupported claims.',
  },
  {
    icon: ShieldCheck,
    name: 'Compliance Agent',
    role: 'Pass 5 — HITL gate',
    description: 'Halts output for human review when risk scores exceed thresholds or PHI/legal hold rules apply.',
  },
];

export default function AgentHiveDiagram() {
  return (
    <section className="mb-16 rounded-2xl border border-bee-amber/25 bg-gradient-to-br from-bee-amber/10 via-bee-black to-bee-black p-8 md:p-12 glow-halo">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <p className="text-bee-amber text-xs font-bold uppercase tracking-widest mb-3">
          Multi-Agent Hive Architecture
        </p>
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
          Six specialized agents. One auditable transcript.
        </h2>
        <p className="text-slate-400 leading-relaxed">
          Each pass is performed by a purpose-built agent—not a single model guessing at legal and medical
          nuance. Agents cross-check one another before anything reaches your team or your client.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {AGENTS.map((agent, i) => (
          <motion.article
            key={agent.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="relative rounded-xl border border-white/10 bg-bee-black/60 p-5 hover:border-bee-amber/40 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-bee-amber/15 flex items-center justify-center">
                <agent.icon className="w-5 h-5 text-bee-amber" aria-hidden />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm leading-tight">{agent.name}</h3>
                <p className="text-bee-amber/90 text-xs font-mono mt-0.5">{agent.role}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{agent.description}</p>
          </motion.article>
        ))}
      </div>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
        <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold">
          ✓ Cross-agent disagreement → flagged for review
        </div>
        <div className="px-4 py-2 rounded-lg bg-bee-amber/10 border border-bee-amber/20 text-bee-amber text-sm font-semibold">
          ✓ Full audit log per pass
        </div>
      </div>
    </section>
  );
}
