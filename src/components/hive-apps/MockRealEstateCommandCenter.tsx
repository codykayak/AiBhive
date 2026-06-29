import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Building2,
  Mail,
  Moon,
  Plug,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';

const PORTFOLIO = {
  properties: 1200,
  unitsOccupied: 1134,
  vacancyPct: 5.5,
  cashOnCashPct: 8.4,
  noiMonthly: 892000,
  afterHoursResolvedPct: 73,
  emailAutoPct: 80,
  applicationsAutoPct: 62,
};

const CASH_ON_CASH = [
  { market: 'Phoenix', coc: 9.2 },
  { market: 'Tampa', coc: 8.8 },
  { market: 'Dallas', coc: 8.1 },
  { market: 'Atlanta', coc: 7.6 },
  { market: 'Charlotte', coc: 7.2 },
];

const VACANCY_TREND = [
  { month: 'Jan', rate: 6.8 },
  { month: 'Feb', rate: 6.4 },
  { month: 'Mar', rate: 6.1 },
  { month: 'Apr', rate: 5.9 },
  { month: 'May', rate: 5.7 },
  { month: 'Jun', rate: 5.5 },
];

const TRIAGE = [
  { name: 'AI resolved', value: 73, color: '#f59e0b' },
  { name: 'Escalated human', value: 27, color: '#475569' },
];

const PMS = [
  { name: 'Yardi Voyager', status: 'Connected (demo)' },
  { name: 'RealPage', status: 'Ready to connect' },
  { name: 'AppFolio', status: 'Ready to connect' },
];

type Props = { expanded?: boolean };

/** Static demo — Mock Up Real Estate command center (no live APIs). */
export default function MockRealEstateCommandCenter({ expanded }: Props) {
  return (
    <div
      className={`flex flex-col gap-6 ${expanded ? 'min-h-[calc(100vh-8rem)]' : ''}`}
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Demo dashboard</p>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1">Mock Up Real Estate</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Static sample dashboard — {PORTFOLIO.properties.toLocaleString()} rental units, automation flows, and
            property-management integrations (illustrative only).
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Plug className="w-3.5 h-3.5" />
          Demo data · not connected to live systems
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Building2, label: 'Properties', value: PORTFOLIO.properties.toLocaleString() },
          { icon: TrendingUp, label: 'Cash-on-cash', value: `${PORTFOLIO.cashOnCashPct}%` },
          { icon: Users, label: 'Vacancy', value: `${PORTFOLIO.vacancyPct}%` },
          { icon: Wallet, label: 'Monthly NOI', value: `$${(PORTFOLIO.noiMonthly / 1000).toFixed(0)}k` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <Icon className="w-5 h-5 text-bee-amber mb-2" />
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 md:p-5">
          <p className="text-white font-bold mb-4">Cash-on-cash by market</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CASH_ON_CASH}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="market" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="coc" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 md:p-5">
          <p className="text-white font-bold mb-4">Vacancy rate trend</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={VACANCY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[5, 7]} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
                />
                <Line type="monotone" dataKey="rate" stroke="#34d399" strokeWidth={2.5} dot={{ fill: '#34d399' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-violet-400" />
            <p className="text-white font-bold">After-hours triage</p>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Maintenance and lockout texts routed overnight. AI resolves {PORTFOLIO.afterHoursResolvedPct}% without
            waking on-call staff.
          </p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={TRIAGE} dataKey="value" innerRadius={45} outerRadius={65} paddingAngle={2}>
                  {TRIAGE.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-sky-400" />
            <p className="text-white font-bold">Automated email response</p>
          </div>
          <p className="text-3xl font-black text-white">{PORTFOLIO.emailAutoPct}%</p>
          <p className="text-slate-400 text-sm">
            Of tenant and prospect emails handled by Bhive Builder flows — pricing questions, tour scheduling, and
            policy FAQs — eliminating most human replies.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-bee-amber" />
            <p className="text-white font-bold">Auto application processing</p>
          </div>
          <p className="text-3xl font-black text-white">{PORTFOLIO.applicationsAutoPct}%</p>
          <p className="text-slate-400 text-sm">
            Applications pre-screened, income docs flagged, and ready-for-review packets assembled before a leasing
            agent opens the queue.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
        <p className="text-white font-bold mb-3 flex items-center gap-2">
          <Plug className="w-5 h-5 text-bee-amber" />
          Property management software (plug-in ready)
        </p>
        <p className="text-slate-500 text-sm mb-4">
          Illustrative connectors — no live API hooks in this demo. Your build can wire real credentials in Bhive
          Builder.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {PMS.map((p) => (
            <div key={p.name} className="rounded-xl border border-dashed border-white/15 px-4 py-3">
              <p className="text-white font-bold text-sm">{p.name}</p>
              <p className="text-emerald-400/90 text-xs mt-1 font-semibold">{p.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
