import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Headphones,
  FileText,
  Phone,
  ArrowRight,
} from 'lucide-react';

/** Relative odds of qualifying a lead by first-response window (indexed: <5 min = 100). */
const SPEED_TO_LEAD_DATA = [
  { window: '<5 min', index: 100, fill: '#f59e0b' },
  { window: '5–10 min', index: 62, fill: '#d97706' },
  { window: '10–30 min', index: 38, fill: '#b45309' },
  { window: '30–60 min', index: 14, fill: '#92400e' },
  { window: '60+ min', index: 5, fill: '#78350f' },
];

/** Share of SMB inbound callers who disengage before a human connects (industry surveys). */
const INBOUND_LEAK_DATA = [
  { name: 'Hang up on voicemail', value: 67, fill: '#f59e0b' },
  { name: 'Call competitor', value: 18, fill: '#d97706' },
  { name: 'Wait & retry later', value: 15, fill: '#64748b' },
];

/** Tier-1 support intents commonly resolved by agentic ops (benchmark ranges). */
const SUPPORT_AUTOMATION_DATA = [
  { task: 'Order status', pct: 72 },
  { task: 'Returns & refunds', pct: 58 },
  { task: 'Appointment reschedule', pct: 65 },
  { task: 'FAQ / policy', pct: 78 },
  { task: 'Account updates', pct: 45 },
];

/** Cost per invoice: manual AP clerk vs IDP-automated (USD, industry benchmarks). */
const INVOICE_COST_DATA = [
  { mode: 'Manual entry', cost: 28, fill: '#64748b' },
  { mode: 'Semi-automated', cost: 12, fill: '#b45309' },
  { mode: 'Agentic IDP', cost: 4, fill: '#f59e0b' },
];

const SOLUTION_LINKS = [
  { label: 'Lead generation agents', href: '/solutions/ai-lead-generation-automation' },
  { label: 'Phone & SMS layer', href: '/solutions/phone-systems-ai-integration' },
  { label: 'Customer operations', href: '/solutions/ai-customer-operations-automation' },
  { label: 'Document & ERP sync', href: '/solutions/intelligent-document-processing-erp' },
  { label: 'Real estate automation', href: '/solutions/real-estate-ai-automation' },
] as const;

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid rgba(245, 158, 11, 0.2)',
  borderRadius: '12px',
  fontSize: '12px',
};

export default function DigitalEmployeesInfographics() {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
        >
          <div className="flex items-start gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-bee-amber flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-white">Speed-to-lead still wins pipelines</h3>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                Lead-response studies show qualification odds fall sharply after the first few minutes.
                Agentic outreach closes the gap 24/7.
              </p>
            </div>
          </div>
          <div className="h-64 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SPEED_TO_LEAD_DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="window" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#94a3b8"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Relative qualify rate', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v} (indexed)`, 'Qualify likelihood']}
                />
                <Bar dataKey="index" radius={[6, 6, 0, 0]} barSize={32}>
                  {SPEED_TO_LEAD_DATA.map((entry) => (
                    <Cell key={entry.window} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
            Source: Lead Response Management study (MIT / InsideSales), cited in Harvard Business Review —
            contacting within 5 minutes vs. 30 minutes can yield ~21× higher qualification odds.
          </p>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
        >
          <div className="flex items-start gap-3 mb-2">
            <Phone className="w-6 h-6 text-bee-amber flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-white">Missed calls bleed revenue</h3>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                Most callers won&apos;t leave voicemail. RAG-trained SMS within ~60s recovers intent
                before they dial the next provider.
              </p>
            </div>
          </div>
          <div className="h-64 w-full mt-4 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={INBOUND_LEAK_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {INBOUND_LEAK_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Share']} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Source: SMB call-tracking benchmarks (Ruby Receptionists, Invoca) — roughly two-thirds of
            callers hang up rather than leave voicemail when a live answer isn&apos;t available.
          </p>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
        >
          <div className="flex items-start gap-3 mb-2">
            <Headphones className="w-6 h-6 text-bee-amber flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-white">Ops agents absorb tier-1 volume</h3>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                Gartner projects conversational AI will cut service labor costs materially by 2026.
                Agents with live CRM/API access outperform scripted chatbots.
              </p>
            </div>
          </div>
          <div className="h-64 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={SUPPORT_AUTOMATION_DATA}
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="task" stroke="#94a3b8" width={110} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Automatable share']} />
                <Bar dataKey="pct" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
            Source: Gartner (2022) — 80% of customer service orgs expected to use generative AI by 2026;
            task-level ranges from CX automation vendor benchmarks (Zendesk, Intercom).
          </p>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
        >
          <div className="flex items-start gap-3 mb-2">
            <FileText className="w-6 h-6 text-bee-amber flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-white">Document AI collapses AP cost</h3>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                Manual invoice handling runs $15–$40 per document at many mid-market firms. Agentic
                extraction + ERP sync targets single-digit dollars.
              </p>
            </div>
          </div>
          <div className="h-64 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={INVOICE_COST_DATA} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="mode" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="#94a3b8"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  unit="$"
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v}`, 'Per invoice']} />
                <Bar dataKey="cost" radius={[6, 6, 0, 0]} barSize={48}>
                  {INVOICE_COST_DATA.map((entry) => (
                    <Cell key={entry.mode} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
            Source: APQC &amp; Ardent Partners accounts-payable benchmarks; McKinsey estimates 30%+
            of back-office tasks are automatable with modern IDP.
          </p>
        </motion.article>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 border-t border-white/10"
      >
        <span className="text-xs text-slate-500 uppercase tracking-wide w-full text-center sm:w-auto sm:text-left mb-1 sm:mb-0">
          Explore agents
        </span>
        {SOLUTION_LINKS.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="text-sm text-bee-amber hover:text-bee-yellow inline-flex items-center gap-1 font-medium"
          >
            {link.label}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
