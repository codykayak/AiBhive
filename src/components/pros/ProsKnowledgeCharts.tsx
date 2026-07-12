import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type ChartPoint = {
  label: string;
  tips: number;
  feedback: number;
  jobsDone: number;
};

type Props = {
  data: ChartPoint[];
  variant?: 'dark' | 'light';
  className?: string;
};

const tooltipStyle = {
  dark: { background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 },
  light: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 },
};

export function ProsKnowledgeGrowthChart({ data, variant = 'dark', className = '' }: Props) {
  const axis = variant === 'dark' ? '#94a3b8' : '#64748b';
  const grid = variant === 'dark' ? 'rgba(255,255,255,0.06)' : '#e2e8f0';

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="prosTips" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5A623" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#F5A623" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="prosFeedback" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} strokeDasharray="4 4" />
          <XAxis dataKey="label" tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle[variant]} labelStyle={{ color: variant === 'dark' ? '#e2e8f0' : '#0f172a' }} />
          <Legend wrapperStyle={{ fontSize: 12, color: axis }} />
          <Area type="monotone" dataKey="tips" name="Field tips" stroke="#F5A623" fill="url(#prosTips)" strokeWidth={2} />
          <Area type="monotone" dataKey="feedback" name="Diagnose feedback" stroke="#1E3A8A" fill="url(#prosFeedback)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProsJobsPipelineChart({
  data,
  variant = 'dark',
  className = '',
}: {
  data: Array<{ label: string; count: number }>;
  variant?: 'dark' | 'light';
  className?: string;
}) {
  const axis = variant === 'dark' ? '#94a3b8' : '#64748b';
  const grid = variant === 'dark' ? 'rgba(255,255,255,0.06)' : '#e2e8f0';

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke={grid} strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: axis, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle[variant]} />
          <Bar dataKey="count" name="Jobs" fill="#F5A623" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Illustrative growth curve for the public landing page */
export const LANDING_CHART_DEMO: ChartPoint[] = [
  { label: 'Jan', tips: 24, feedback: 18, jobsDone: 12 },
  { label: 'Feb', tips: 38, feedback: 29, jobsDone: 19 },
  { label: 'Mar', tips: 52, feedback: 41, jobsDone: 28 },
  { label: 'Apr', tips: 71, feedback: 58, jobsDone: 36 },
  { label: 'May', tips: 96, feedback: 74, jobsDone: 48 },
  { label: 'Jun', tips: 128, feedback: 102, jobsDone: 61 },
];
