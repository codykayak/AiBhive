import { useEffect, useMemo, useState } from 'react';
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
  Boxes,
  Download,
  Sparkles,
  Share2,
  Wand2,
  Code2,
  ArrowRight,
  Users,
  Zap,
  Shield,
} from 'lucide-react';
import { SEO } from '../components/SEO';

type ToolkitApp = {
  id: string;
  title: string;
  tagline?: string;
  summary?: string;
  installCount?: number;
  pages?: { length: number }[];
};

const TIER_DATA = [
  { tier: 'Install', cost: 0, minutes: 0, fill: '#22c55e' },
  { tier: 'Quick Tweak', cost: 0.5, minutes: 1, fill: '#f59e0b' },
  { tier: 'New Spec Build', cost: 1, minutes: 2, fill: '#d97706' },
  { tier: 'Full Customize', cost: 4, minutes: 18, fill: '#b45309' },
  { tier: 'Web Export', cost: 5, minutes: 22, fill: '#92400e' },
];

const NETWORK_PIE = [
  { name: 'Private (your copy)', value: 55, fill: '#64748b' },
  { name: 'Community (opt-in)', value: 25, fill: '#f59e0b' },
  { name: 'Installed remixes', value: 20, fill: '#22c55e' },
];

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid rgba(245, 158, 11, 0.2)',
  borderRadius: '12px',
  fontSize: '12px',
};

function FlowStep({
  icon: Icon,
  title,
  body,
  accent,
}: {
  icon: typeof Download;
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center text-center max-w-[160px]">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border border-white/10"
        style={{ backgroundColor: `${accent}22` }}
      >
        <Icon className="w-7 h-7" style={{ color: accent }} />
      </div>
      <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
      <p className="text-slate-400 text-xs leading-relaxed">{body}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="hidden md:flex items-center justify-center px-2 text-bee-amber/60">
      <ArrowRight className="w-6 h-6" />
    </div>
  );
}

export default function HiveApps() {
  const [toolkit, setToolkit] = useState<ToolkitApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hive/toolkit')
      .then((r) => (r.ok ? r.json() : { apps: [] }))
      .then((data) => setToolkit(Array.isArray(data.apps) ? data.apps : []))
      .catch(() => setToolkit([]))
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    const top = [...toolkit]
      .sort((a, b) => (b.installCount || 0) - (a.installCount || 0))
      .slice(0, 8)
      .map((a) => ({
        name: a.title.length > 18 ? `${a.title.slice(0, 16)}…` : a.title,
        installs: a.installCount || 0,
      }));
    if (top.length) return top;
    return [
      { name: 'Habit Tracker', installs: 42 },
      { name: 'Tip Calculator', installs: 38 },
      { name: 'Expense Log', installs: 31 },
      { name: 'Interview Prep', installs: 24 },
      { name: 'Water Tracker', installs: 19 },
    ];
  }, [toolkit]);

  const totalInstalls = toolkit.reduce((n, a) => n + (a.installCount || 0), 0);

  return (
    <main className="py-16 md:py-24">
      <SEO
        title="Hive Apps — Community App Pool | AiBhive"
        description="Install, tweak, and customize apps built by the AiBhive community. Free installs from the shared toolkit, quick spec tweaks, or full Cursor customization."
        keywords="Hive Apps, community app pool, AiBhive toolkit, no-code apps, AI app builder, customize apps"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-bee-amber/10 text-bee-amber text-sm font-bold uppercase tracking-widest mb-8">
            <Boxes className="w-4 h-4" />
            Hive Apps
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            The community{' '}
            <span className="text-gradient">app pool</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Every AiBhive user can build tools in plain English. When someone loves what they made,
            they opt in to share it. Everyone else installs free — then tweaks or customizes their own copy.
          </p>
        </motion.header>

        {/* Flow diagram */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-[2rem] p-8 md:p-12 mb-16 border border-bee-amber/10"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 text-center">
            How the pool works
          </h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-10 text-sm md:text-base">
            We never publish half-built apps. Sharing happens only when the builder opts in — after the app
            is ready and useful.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-2 flex-wrap">
            <FlowStep
              icon={Sparkles}
              title="Build"
              body="Describe an app on your phone. Most ship in seconds as a live spec app (~$1)."
              accent="#f59e0b"
            />
            <FlowArrow />
            <FlowStep
              icon={Shield}
              title="Private first"
              body="Your app stays in My Apps. Only you see it until you choose to share."
              accent="#94a3b8"
            />
            <FlowArrow />
            <FlowStep
              icon={Share2}
              title="Opt-in share"
              body='Tap "Share to Community Toolkit" when you are proud of it.'
              accent="#22c55e"
            />
            <FlowArrow />
            <FlowStep
              icon={Download}
              title="Free install"
              body="Anyone finds a match and adds it to My Apps — no rebuild charge."
              accent="#38bdf8"
            />
            <FlowArrow />
            <FlowStep
              icon={Wand2}
              title="Tweak or Customize"
              body="Quick spec edits (~$0.50) or full Cursor code (~$4+)."
              accent="#f59e0b"
            />
          </div>

          {/* ASCII-style architecture block */}
          <pre className="mt-12 p-6 rounded-xl bg-black/40 border border-white/5 text-xs md:text-sm text-slate-400 overflow-x-auto leading-relaxed font-mono">
{`┌─────────────────────────────────────────────────────────────────┐
│                     AiBhive Community Pool                       │
├─────────────────────────────────────────────────────────────────┤
│  Builder A ──► hive_apps (private) ──opt-in──► visibility:      │
│                │                              community          │
│                ▼                                                 │
│         DynamicAppHost renders spec instantly on any phone       │
│                │                                                 │
│                ▼                                                 │
│  User B searches toolkit ──match──► installCommunityApp (free)   │
│                │                                                 │
│                ├──► POST /tweak      (~$0.50, spec iteration)    │
│                └──► POST /customize  (~$4+, Cursor host_screen)│
└─────────────────────────────────────────────────────────────────┘`}
          </pre>
        </motion.section>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
          >
            <div className="flex items-start gap-3 mb-2">
              <Zap className="w-6 h-6 text-bee-amber flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-white">Price tiers (typical)</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Install from the pool is always free. You pay only when you build new or upgrade.
                </p>
              </div>
            </div>
            <div className="h-72 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TIER_DATA} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="tier" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis
                    stroke="#94a3b8"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, _name, item) => [
                      `$${value} · ~${(item.payload as { minutes: number }).minutes} min`,
                      'Estimate',
                    ]}
                  />
                  <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
                    {TIER_DATA.map((entry) => (
                      <Cell key={entry.tier} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
          >
            <div className="flex items-start gap-3 mb-2">
              <Users className="w-6 h-6 text-bee-amber flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-white">Pool composition</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Most apps stay private. The shared slice grows as builders opt in — quality over quantity.
                </p>
              </div>
            </div>
            <div className="h-72 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={NETWORK_PIE}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {NETWORK_PIE.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Share']} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.article>
        </div>

        {/* Live toolkit chart */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 mb-16"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">
                {loading ? 'Loading toolkit…' : 'Live community toolkit'}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {toolkit.length
                  ? `${toolkit.length} shared apps · ${totalInstalls} total installs`
                  : 'Sample data shown until the first apps are shared'}
              </p>
            </div>
            <a
              href="https://aibhive.com/api/download/apk"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-bee-amber text-bee-black font-bold rounded-full hover:bg-bee-yellow transition-all text-sm"
            >
              Get the Android app
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  stroke="#94a3b8"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="installs" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Three tiers cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: Download,
              title: 'Tier 1 — Install',
              price: 'Free',
              body: 'Search the toolkit or let Grok on Home find a match. One tap adds a working copy to My Apps.',
            },
            {
              icon: Wand2,
              title: 'Tier 2 — Quick Tweak',
              price: '~$0.50',
              body: 'Change pages, theme, or copy on your copy. Same dynamic app — your on-device data stays.',
            },
            {
              icon: Code2,
              title: 'Tier 3 — Full Customize',
              price: '~$4+',
              body: 'Cursor writes real React Native code — custom branding, layouts, and behavior beyond spec pages.',
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl p-6 border border-white/5"
            >
              <card.icon className="w-8 h-8 text-bee-amber mb-4" />
              <h3 className="text-white font-bold text-lg mb-1">{card.title}</h3>
              <p className="text-bee-amber font-extrabold text-sm mb-3">{card.price}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{card.body}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center glass-card rounded-[2rem] p-10 md:p-14 border border-bee-amber/20"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            The hive gets smarter every time someone shares
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8">
            Download AiBhive, build something useful, and opt in when you are ready. That is how the pool grows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://aibhive.com/api/download/apk"
              className="px-8 py-3 bg-bee-amber text-bee-black font-bold rounded-full hover:bg-bee-yellow transition-all neon-glow"
            >
              Download AiBhive
            </a>
            <Link
              to="/faq"
              className="px-8 py-3 border border-white/20 text-white font-bold rounded-full hover:border-bee-amber/50 transition-all"
            >
              Read the FAQ
            </Link>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
