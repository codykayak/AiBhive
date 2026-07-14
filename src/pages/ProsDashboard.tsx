import { useCallback, useEffect, useMemo, useState } from 'react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Activity,
  AlertCircle,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardList,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Calendar,
  MapPin,
  Navigation,
  Package,
  Plus,
  RefreshCw,
  Settings,
  Users,
  Wrench,
  Trash2,
} from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { SEO } from '../components/SEO';
import { cn } from '../lib/utils';
import ProsAiKeysPanel from '../components/pros/ProsAiKeysPanel';
import {
  ProsJobsPipelineChart,
  ProsKnowledgeGrowthChart,
} from '../components/pros/ProsKnowledgeCharts';
import ProsManualIngestPanel from '../components/pros/ProsManualIngestPanel';
import ProsNotificationsPanel from '../components/pros/ProsNotificationsPanel';
import ProsSettingsPanel from '../components/pros/ProsSettingsPanel';
import ProsWhereIsEverybody from '../components/pros/ProsWhereIsEverybody';
import ProsAssistantPanel from '../components/pros/ProsAssistantPanel';
import ProsAdminManualPanel from '../components/pros/ProsAdminManualPanel';
import ProsPartsPanel from '../components/pros/ProsPartsPanel';
import ProsDemoPreviewBanner, { DemoSampleBadge } from '../components/pros/ProsDemoPreviewBanner';
import ProsTeamWeeklyReports from '../components/pros/ProsTeamWeeklyReports';
import { prosAdmin as t } from '../components/pros/prosAdminTheme';
import { formatScheduledFor } from '../lib/formatScheduledFor';
import {
  prosExportJobsCsv,
  prosAnalytics,
  prosJson,
  prosMe,
  prosNotifications,
  prosSettings,
  prosTeamLocations,
  prosPatchSettings,
  prosDeleteMember,
  formatJoinedDate,
  formatMemberLabel,
  type ProsAnalytics,
  type ProsCompanySettings,
  type ProsJob,
  type ProsMember,
  type ProsNotification,
  type ProsTeamLocation,
} from '../lib/prosApi';

type Tab =
  | 'overview'
  | 'dispatch'
  | 'parts'
  | 'whereabouts'
  | 'notifications'
  | 'knowledge'
  | 'team'
  | 'ai-keys'
  | 'activity'
  | 'settings'
  | 'help';

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'dispatch', label: 'Jobs', icon: ClipboardList },
  { id: 'parts', label: 'Parts', icon: Package },
  { id: 'whereabouts', label: 'Where is everybody?', icon: Navigation },
  { id: 'notifications', label: 'Notify', icon: Bell },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'ai-keys', label: 'AI Keys', icon: KeyRound },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

const DEFAULT_SETTINGS: ProsCompanySettings = {
  locationTrackingEnabled: false,
  locationPingIntervalMinutes: 15,
  requireJobPhotos: false,
  preferredAiProvider: 'grok',
  defaultPack: 'pool',
  billingStatus: 'trial',
  demoPreviewEnabled: true,
};

export default function ProsDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const tabParam = searchParams.get('tab') as Tab | null;
  const activeTab: Tab = TABS.some((t) => t.id === tabParam) ? (tabParam as Tab) : 'overview';

  const [bootError, setBootError] = useState<string | null>(null);
  const [company, setCompany] = useState<Awaited<ReturnType<typeof prosMe>>['company']>(null);
  const [membership, setMembership] = useState<Awaited<ReturnType<typeof prosMe>>['membership']>(null);
  const [overview, setOverview] = useState<{
    members: number;
    techs: number;
    jobsTotal: number;
    openJobs: number;
    jobsByStatus: Record<string, number>;
    recentActivity: Array<{ id: string; message?: string; type?: string; createdAt?: number | null }>;
  } | null>(null);
  const [analytics, setAnalytics] = useState<ProsAnalytics | null>(null);
  const [jobs, setJobs] = useState<ProsJob[]>([]);
  const [members, setMembers] = useState<ProsMember[]>([]);
  const [notifications, setNotifications] = useState<ProsNotification[]>([]);
  const [locations, setLocations] = useState<ProsTeamLocation[]>([]);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [pingInterval, setPingInterval] = useState(15);
  const [settings, setSettings] = useState<ProsCompanySettings>(DEFAULT_SETTINGS);
  const [loadingData, setLoadingData] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [demoPreview, setDemoPreview] = useState(false);
  const [demoDisclaimer, setDemoDisclaimer] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [tradeType, setTradeType] = useState<'pool' | 'electrical' | 'property' | 'multi'>('pool');
  const [inviteCode, setInviteCode] = useState('');
  const [onboardingBusy, setOnboardingBusy] = useState(false);

  const [jobTitle, setJobTitle] = useState('');
  const [jobAddress, setJobAddress] = useState('');
  const [jobAssignee, setJobAssignee] = useState('');
  const [jobPack, setJobPack] = useState<ProsJob['packId']>('pool');
  const [jobNotes, setJobNotes] = useState('');
  const [jobCustomer, setJobCustomer] = useState('');
  const [jobPhone, setJobPhone] = useState('');
  const [jobScheduledDate, setJobScheduledDate] = useState('');
  const [jobScheduledTime, setJobScheduledTime] = useState('');
  const [jobPriority, setJobPriority] = useState<ProsJob['priority']>('normal');
  const [jobFilter, setJobFilter] = useState<'all' | ProsJob['status']>('all');

  const isManager = membership?.role === 'owner' || membership?.role === 'manager';

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  const refreshAll = useCallback(async (current: User) => {
    setLoadingData(true);
    setBootError(null);
    try {
      const me = await prosMe(current);
      setCompany(me.company);
      setMembership(me.membership);
      if (!me.company) {
        setOverview(null);
        setAnalytics(null);
        setJobs([]);
        setMembers([]);
        setNotifications([]);
        setLocations([]);
        return;
      }

      const [ov, jobsRes, teamRes, notifRes, settingsRes, analyticsRes] = await Promise.all([
        prosJson<NonNullable<typeof overview>>('/api/pros/overview', current),
        prosJson<{ jobs: ProsJob[] }>('/api/pros/jobs', current),
        prosJson<{ members: ProsMember[] }>('/api/pros/team', current),
        prosNotifications(current),
        prosSettings(current),
        prosAnalytics(current),
      ]);

      setOverview(ov);
      setJobs(jobsRes.jobs);
      setMembers(teamRes.members);
      setNotifications(notifRes.notifications);
      setSettings(settingsRes.settings);
      setAnalytics(analyticsRes);

      const preview =
        Boolean((ov as { demoPreview?: boolean }).demoPreview) ||
        Boolean((analyticsRes as { demoPreview?: boolean }).demoPreview) ||
        Boolean((jobsRes as { demoPreview?: boolean }).demoPreview);
      setDemoPreview(preview);
      setDemoDisclaimer(
        (ov as { demoDisclaimer?: string }).demoDisclaimer ||
          (analyticsRes as { demoDisclaimer?: string }).demoDisclaimer ||
          null
      );

      if (me.membership?.role === 'owner' || me.membership?.role === 'manager') {
        const locRes = await prosTeamLocations(current);
        setLocations(locRes.locations);
        setTrackingEnabled(locRes.trackingEnabled);
        setPingInterval(locRes.pingIntervalMinutes);
      }
    } catch (err) {
      setBootError(err instanceof Error ? err.message : 'Failed to load Pros');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user) void refreshAll(user);
  }, [user, refreshAll]);

  const setTab = (tab: Tab) => {
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  const signIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const createCompany = async () => {
    if (!user || !companyName.trim()) return;
    setOnboardingBusy(true);
    try {
      await prosJson('/api/pros/companies', user, {
        method: 'POST',
        body: JSON.stringify({ name: companyName.trim(), tradeType }),
      });
      await refreshAll(user);
    } catch (err) {
      setBootError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setOnboardingBusy(false);
    }
  };

  const joinCompany = async () => {
    if (!user || !inviteCode.trim()) return;
    setOnboardingBusy(true);
    try {
      await prosJson('/api/pros/join', user, {
        method: 'POST',
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      await refreshAll(user);
    } catch (err) {
      setBootError(err instanceof Error ? err.message : 'Join failed');
    } finally {
      setOnboardingBusy(false);
    }
  };

  const createJob = async () => {
    if (!user || !jobTitle.trim()) return;
    const assignee = members.find((m) => m.uid === jobAssignee);
    await prosJson('/api/pros/jobs', user, {
      method: 'POST',
        body: JSON.stringify({
        title: jobTitle.trim(),
        address: jobAddress.trim(),
        customerName: jobCustomer.trim(),
        customerPhone: jobPhone.trim(),
        notes: jobNotes.trim(),
        scheduledFor: formatScheduledFor(jobScheduledDate, jobScheduledTime),
        packId: jobPack,
        priority: jobPriority,
        assigneeUid: jobAssignee || null,
        assigneeName: assignee?.displayName || assignee?.email || null,
      }),
    });
    setJobTitle('');
    setJobAddress('');
    setJobCustomer('');
    setJobPhone('');
    setJobNotes('');
    setJobScheduledDate('');
    setJobScheduledTime('');
    setJobAssignee('');
    await refreshAll(user);
    setTab('dispatch');
  };

  const cycleJobStatus = async (job: ProsJob) => {
    if (!user) return;
    if (job.id.startsWith('demo-')) return;
    const order: ProsJob['status'][] = ['queued', 'in_progress', 'needs_parts', 'done'];
    const status = order[(order.indexOf(job.status) + 1) % order.length];
    await prosJson(`/api/pros/jobs/${job.id}`, user, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await refreshAll(user);
  };

  const rotateInvite = async () => {
    if (!user) return;
    const res = await prosJson<{ inviteCode: string }>('/api/pros/invite/rotate', user, { method: 'POST' });
    setCompany((c) => (c ? { ...c, inviteCode: res.inviteCode } : c));
  };

  const removeMember = async (m: ProsMember) => {
    if (!user || !isManager) return;
    const label = m.displayName || m.email || m.uid;
    if (!window.confirm(`Remove ${label} from the team? They will lose access and their push token will be cleared.`)) {
      return;
    }
    try {
      await prosDeleteMember(user, m.uid);
      await refreshAll(user);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not remove member');
    }
  };

  const filteredJobs = useMemo(() => {
    if (jobFilter === 'all') return jobs;
    return jobs.filter((j) => j.status === jobFilter);
  }, [jobs, jobFilter]);

  const hideDemoPreview = async () => {
    if (!user) return;
    setBannerDismissed(true);
    try {
      const res = await prosPatchSettings(user, { demoPreviewEnabled: false });
      setSettings(res.settings);
      setDemoPreview(false);
      await refreshAll(user);
    } catch {
      // banner stays dismissed locally for this session
    }
  };

  const exportCsv = async () => {
    if (!user) return;
    try {
      const blob = await prosExportJobsCsv(user);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pros-jobs-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setBootError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const techOptions = useMemo(
    () => members.filter((m) => m.status !== 'inactive'),
    [members]
  );

  const pipelineChart = useMemo(() => {
    if (!overview) return [];
    return Object.entries(overview.jobsByStatus).map(([status, count]) => ({
      label: status.replace('_', ' '),
      count,
    }));
  }, [overview]);

  const knowledgeChart = useMemo(() => {
    if (!analytics?.knowledgeGrowth?.length) return [];
    return analytics.knowledgeGrowth.map((row) => ({
      label: row.label,
      tips: row.tips,
      feedback: row.feedback,
      jobsDone: row.jobsDone,
    }));
  }, [analytics]);

  if (loadingAuth) {
    return (
      <div className={t.pageCenter}>
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Pros…
      </div>
    );
  }

  if (!user) {
    return (
      <div className={t.pageCenterAuth}>
        <SEO title="Pros Admin — Sign in" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={t.signInCard}
        >
          <Link to="/pros" className={t.linkAmber}>
            ← Pros overview
          </Link>
          <div className="mt-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center mb-5">
              <Wrench className="w-7 h-7 text-amber-600" />
            </div>
            <h1 className="text-2xl font-black">Company HQ sign-in</h1>
            <p className="mt-3 text-slate-600 text-sm leading-relaxed">
              Dispatch jobs, track your team, and grow your living knowledge base.
            </p>
            <button
              type="button"
              onClick={() => void signIn()}
              className={`mt-8 w-full py-3.5 ${t.btnPrimary}`}
            >
              Continue with Google
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className={t.pageOnboard}>
        <SEO title="Set up Pros" />
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/pros" className={t.linkAmber}>
                ← Pros overview
              </Link>
              <h1 className="text-2xl font-black mt-2">Welcome to Pros</h1>
              <p className="text-slate-600 text-sm mt-1">Signed in as {user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void signOut(auth)}
              className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>

          {bootError ? (
            <div className={`mb-6 flex gap-2 ${t.error}`}>
              <AlertCircle className="w-4 h-4 mt-0.5" /> {bootError}
            </div>
          ) : null}

          <div className="grid md:grid-cols-2 gap-6">
            <div className={`${t.card} p-6 space-y-4`}>
              <Building2 className="w-6 h-6 text-amber-600" />
              <h2 className="text-lg font-bold">Create your company</h2>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Pool Service"
                className={`w-full ${t.input}`}
              />
              <select
                value={tradeType}
                onChange={(e) => setTradeType(e.target.value as typeof tradeType)}
                className={`w-full ${t.input}`}
              >
                <option value="pool">Pool services</option>
                <option value="electrical">Electrical</option>
                <option value="property">Property maintenance</option>
                <option value="multi">Multi-trade</option>
              </select>
              <button
                type="button"
                disabled={onboardingBusy}
                onClick={() => void createCompany()}
                className={`w-full py-3 disabled:opacity-50 ${t.btnPrimary}`}
              >
                Create HQ
              </button>
            </div>

            <div className={`${t.card} p-6 space-y-4`}>
              <Users className="w-6 h-6 text-sky-600" />
              <h2 className="text-lg font-bold">Join with invite code</h2>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="PROS-XXXXXX"
                className={`w-full font-mono uppercase ${t.input}`}
              />
              <button
                type="button"
                disabled={onboardingBusy}
                onClick={() => void joinCompany()}
                className={`w-full py-3 disabled:opacity-50 ${t.btnSecondary}`}
              >
                Join roster
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={t.page}>
      <SEO title={`${company.name} · Pros`} description="AiBhive Pros field operations" />

      <header className={t.header}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${t.avatarSm}`}>
              <Briefcase className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link to="/pros" className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 hover:text-amber-600">
                  AiBhive Pros
                </Link>
                <span className="text-[10px] text-slate-400">·</span>
                <span className="text-[10px] uppercase text-slate-500">Living KB</span>
              </div>
              <h1 className="text-lg font-black leading-tight">{company.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => user && void refreshAll(user)}
              className={t.iconBtn}
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', loadingData && 'animate-spin')} />
            </button>
            <span className="hidden sm:inline text-slate-500">{user.email}</span>
            <span className={t.roleBadge}>
              {membership?.role}
            </span>
            <button
              type="button"
              onClick={() => void signOut(auth)}
              className={t.iconBtn}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto pb-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const hide =
              (tab.id === 'whereabouts' && !isManager) ||
              (tab.id === 'knowledge' && !isManager) ||
              (tab.id === 'parts' && !isManager);
            if (hide) return null;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap',
                  activeTab === tab.id ? t.tabActive : t.tabInactive
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {bootError ? (
          <div className={`mb-6 ${t.error}`}>{bootError}</div>
        ) : null}

        {demoPreview && demoDisclaimer && !bannerDismissed ? (
          <ProsDemoPreviewBanner
            disclaimer={demoDisclaimer}
            onDismiss={() => void hideDemoPreview()}
          />
        ) : null}

        {activeTab === 'overview' && overview ? (
          <div className="space-y-8">
            <div className={`${t.highlightBanner} p-5 flex flex-wrap gap-4 items-center justify-between`}>
              <div className="flex items-start gap-3">
                <BookOpen className="w-6 h-6 text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold text-lg">Living knowledge base</h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                    {analytics?.totals.tips ?? 0} field tips · {analytics?.totals.feedback ?? 0} diagnose feedback ·{' '}
                    {analytics?.totals.fieldNotes ?? 0} job notes — compounded from techs in the field.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTab('notifications')}
                className={`px-4 py-2 text-sm ${t.btnPrimary}`}
              >
                Notify techs
              </button>
            </div>

            {analytics?.platformCosts ? (
              <div className={`${t.card} p-5`}>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Platform API spend (estimate)
                </div>
                <p className="text-sm text-slate-700">
                  Last {analytics.platformCosts.windowDays} days:{' '}
                  <strong>${analytics.platformCosts.totalRawUsd.toFixed(2)}</strong> raw API across{' '}
                  {analytics.platformCosts.countedOps} billed ops
                  {analytics.platformCosts.ttsRawUsd > 0
                    ? ` (Grok $${analytics.platformCosts.grokRawUsd.toFixed(2)} · Cartesia TTS $${analytics.platformCosts.ttsRawUsd.toFixed(2)}`
                    : ` (Grok $${analytics.platformCosts.grokRawUsd.toFixed(2)}`}
                  {analytics.platformCosts.transcribeRawUsd > 0
                    ? ` · STT $${analytics.platformCosts.transcribeRawUsd.toFixed(2)}`
                    : ''}
                  ).
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Typical diagnose + Cartesia voice: ~$
                  {analytics.platformCosts.typicalDiagnoseWithVoiceUsd.toFixed(3)} per turn (Grok + TTS).
                </p>
              </div>
            ) : null}

            {analytics?.featuredTip ? (
              <div className={`${t.featuredTip} p-5`}>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                  Fix of the week
                </div>
                <p className="text-slate-800 leading-relaxed">{analytics.featuredTip.text}</p>
                {analytics.featuredTip.fixSummary ? (
                  <p className="text-sm text-slate-600 mt-2">Fix: {analytics.featuredTip.fixSummary}</p>
                ) : null}
                <div className="text-[11px] text-slate-500 mt-2">
                  {analytics.featuredTip.packId} pack · {analytics.featuredTip.helpfulCount} helpful votes
                </div>
              </div>
            ) : null}

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Open jobs', value: overview.openJobs, icon: ClipboardList },
                { label: 'Field tips', value: analytics?.totals.tips ?? 0, icon: BookOpen },
                { label: 'Techs', value: overview.techs, icon: Wrench },
                { label: 'Jobs done', value: analytics?.totals.jobsDone ?? 0, icon: Briefcase },
              ].map((card) => (
                <div key={card.label} className={`${t.card} p-5`}>
                  <card.icon className="w-5 h-5 text-amber-600 mb-3" />
                  <div className="text-3xl font-black">{card.value}</div>
                  <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`${t.card} p-5`}>
                <h3 className="font-bold mb-2">Knowledge growth</h3>
                {knowledgeChart.length ? (
                  <ProsKnowledgeGrowthChart data={knowledgeChart} variant="light" />
                ) : (
                  <p className="text-sm text-slate-500 py-8 text-center">Charts populate as techs contribute tips and feedback.</p>
                )}
              </div>
              <div className={`${t.card} p-5`}>
                <h3 className="font-bold mb-2">Job pipeline</h3>
                <ProsJobsPipelineChart data={pipelineChart} variant="light" />
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'dispatch' ? (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {(['all', 'queued', 'in_progress', 'needs_parts', 'done'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setJobFilter(f)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-bold uppercase',
                      jobFilter === f ? t.filterActive : t.filterInactive
                    )}
                  >
                    {f === 'all' ? 'All' : f.replace('_', ' ')}
                  </button>
                ))}
              </div>
              {isManager ? (
                <button
                  type="button"
                  onClick={() => void exportCsv()}
                  className={t.btnGhost}
                >
                  Export CSV
                </button>
              ) : null}
            </div>

            {isManager ? (
              <div className={`${t.card} p-5 space-y-4`}>
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-600" /> Assign a job
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Job title"
                    className={`${t.input} md:col-span-2`}
                  />
                  <input
                    value={jobAddress}
                    onChange={(e) => setJobAddress(e.target.value)}
                    placeholder="Address"
                    className={t.input}
                  />
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-500">Scheduled (optional)</span>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="date"
                        value={jobScheduledDate}
                        onChange={(e) => setJobScheduledDate(e.target.value)}
                        className={`flex-1 min-w-[9rem] ${t.input}`}
                        aria-label="Scheduled date"
                      />
                      <input
                        type="time"
                        value={jobScheduledTime}
                        onChange={(e) => setJobScheduledTime(e.target.value)}
                        className={`flex-1 min-w-[7rem] ${t.input}`}
                        aria-label="Scheduled time"
                      />
                    </div>
                  </div>
                  <input
                    value={jobCustomer}
                    onChange={(e) => setJobCustomer(e.target.value)}
                    placeholder="Customer name"
                    className={t.input}
                  />
                  <input
                    value={jobPhone}
                    onChange={(e) => setJobPhone(e.target.value)}
                    placeholder="Customer phone"
                    className={t.input}
                  />
                  <textarea
                    value={jobNotes}
                    onChange={(e) => setJobNotes(e.target.value)}
                    placeholder="Dispatch notes for the tech…"
                    rows={2}
                    className={`${t.textarea} md:col-span-2`}
                  />
                  <select
                    value={jobAssignee}
                    onChange={(e) => setJobAssignee(e.target.value)}
                    className={t.input}
                  >
                    <option value="">Unassigned</option>
                    {techOptions.map((m) => (
                      <option key={m.uid} value={m.uid}>
                        {formatMemberLabel(m)}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <select
                      value={jobPack}
                      onChange={(e) => setJobPack(e.target.value as typeof jobPack)}
                      className={`flex-1 ${t.input}`}
                    >
                      <option value="pool">Pool</option>
                      <option value="electrical">Electrical</option>
                      <option value="property">Property</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="hvac">HVAC</option>
                      <option value="fiber">Fiber Optics</option>
                    </select>
                    <select
                      value={jobPriority}
                      onChange={(e) => setJobPriority(e.target.value as typeof jobPriority)}
                      className={`flex-1 ${t.input}`}
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void createJob()}
                  className={`px-5 py-2.5 text-sm ${t.btnPrimary}`}
                >
                  Dispatch + notify assignee
                </button>
              </div>
            ) : null}

            <div className="space-y-3">
              {filteredJobs.length === 0 ? (
                <p className="text-slate-500 text-sm">No jobs in this filter.</p>
              ) : (
                filteredJobs.map((job) => (
                  <div key={job.id} className={`${t.card} overflow-hidden`}>
                    <button
                      type="button"
                      onClick={() => setExpandedJobId((id) => (id === job.id ? null : job.id))}
                      className={`w-full p-4 flex flex-wrap gap-4 justify-between text-left ${t.jobRowHover}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase px-2 py-1 rounded-full',
                              t.status[job.status]
                            )}
                          >
                            {job.status.replace('_', ' ')}
                          </span>
                          {job.id.startsWith('demo-') ? <DemoSampleBadge /> : null}
                          <span className="text-[10px] uppercase text-slate-500 font-bold">{job.packId}</span>
                        </div>
                        <h3 className="font-bold">{job.title}</h3>
                        <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" /> {job.address || 'Address TBD'}
                        </p>
                        {job.scheduledFor ? (
                          <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                            <Calendar className="w-3.5 h-3.5" /> {job.scheduledFor}
                          </p>
                        ) : null}
                        <p className="text-xs text-slate-500 mt-1">
                          {job.assigneeName || 'Unassigned'} · {job.fieldNotes?.length || 0} notes ·{' '}
                          {job.photos?.length || 0} photos
                        </p>
                      </div>
                    </button>
                    {expandedJobId === job.id ? (
                      <div className={t.jobExpand}>
                        {job.id.startsWith('demo-') ? (
                          <p className="text-xs text-sky-700">
                            Sample job — dispatch a real job to replace preview data.
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void cycleJobStatus(job)}
                            className="text-xs font-bold uppercase text-amber-700"
                          >
                            Cycle status →
                          </button>
                        )}
                        {job.scheduledFor ? (
                          <p className="text-sm text-slate-700 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span className="font-semibold">Scheduled:</span> {job.scheduledFor}
                          </p>
                        ) : null}
                        {job.fieldNotes?.length ? (
                          <div>
                            <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Field notes</h4>
                            <ul className="space-y-2">
                              {job.fieldNotes.map((n) => (
                                <li key={n.id} className="text-sm text-slate-700 border-l-2 border-amber-400 pl-3">
                                  {n.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {job.photos?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {job.photos.map((p) => (
                              <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                                <img src={p.url} alt="" className="h-20 w-20 rounded-lg object-cover border border-slate-200" />
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'parts' && isManager && user ? (
          <ProsPartsPanel user={user} isManager={isManager} onRefresh={() => refreshAll(user)} />
        ) : null}

        {activeTab === 'whereabouts' && isManager ? (
          <ProsWhereIsEverybody
            locations={locations}
            trackingEnabled={trackingEnabled}
            pingIntervalMinutes={pingInterval}
          />
        ) : null}

        {activeTab === 'knowledge' && isManager && user ? (
          <ProsManualIngestPanel user={user} />
        ) : null}

        {activeTab === 'notifications' && user ? (
          <ProsNotificationsPanel
            user={user}
            notifications={notifications}
            members={members}
            jobs={jobs}
            isManager={isManager}
            onRefresh={() => refreshAll(user)}
          />
        ) : null}

        {activeTab === 'team' ? (
          <div className="space-y-4">
            {isManager ? (
              <ProsTeamWeeklyReports
                jobs={jobs}
                members={members}
                isManager={isManager}
                currentUserUid={user?.uid}
              />
            ) : null}
            {isManager && company.inviteCode ? (
              <div className={`${t.card} p-4 flex flex-wrap items-center justify-between gap-3`}>
                <div>
                  <div className="text-xs uppercase text-slate-500 font-bold">Field team code</div>
                  <div className="font-mono text-lg text-amber-700">{company.inviteCode}</div>
                  <p className="mt-2 text-sm text-slate-600 max-w-xl">
                    Techs open the <strong className="text-slate-900">AiBhive Pros</strong> Android app,
                    enter this code plus their name on the Account tab — no Google sign-in required.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void rotateInvite()}
                  className={t.btnGhost}
                >
                  Rotate code
                </button>
              </div>
            ) : null}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((m) => (
                <div key={m.uid} className={`${t.card} p-4`}>
                  <div className="flex items-center gap-3">
                    <div className={t.avatar}>
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (m.displayName || m.email || '?').slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate flex items-center gap-2">
                        {m.displayName || 'Tech'}
                        {m.uid.startsWith('demo-') ? <DemoSampleBadge /> : null}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{m.email || `ID …${m.uid.slice(-6)}`}</div>
                      <div className="text-[11px] text-slate-500 mt-1">Joined {formatJoinedDate(m.joinedAt)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase">
                    <span className={`px-2 py-1 rounded-full ${t.roleBadge}`}>{m.role}</span>
                    <span className={`px-2 py-1 rounded-full ${t.roleBadge}`}>{m.tradePack || '—'}</span>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full',
                        m.hasPushToken ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {m.hasPushToken ? 'Push ✓' : 'No push'}
                    </span>
                    {m.status === 'inactive' ? (
                      <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">Inactive</span>
                    ) : null}
                  </div>
                  {isManager && m.role !== 'owner' && m.uid !== user?.uid ? (
                    <button
                      type="button"
                      onClick={() => void removeMember(m)}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-900"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove member
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {!isManager ? (
              <ProsTeamWeeklyReports
                jobs={jobs}
                members={members}
                isManager={false}
                currentUserUid={user?.uid}
              />
            ) : null}
          </div>
        ) : null}

        {activeTab === 'ai-keys' ? (
          isManager ? (
            <ProsAiKeysPanel user={user} />
          ) : (
            <p className={`${t.muted} text-sm`}>Only owners and managers can manage AI API keys.</p>
          )
        ) : null}

        {activeTab === 'activity' && overview ? (
          <ul className="space-y-3">
            {overview.recentActivity.map((a) => (
              <li key={a.id} className={`${t.cardSubtle} px-4 py-3 text-sm`}>
                <div className="text-slate-800">{a.message || a.type}</div>
                {a.createdAt ? (
                  <div className="text-[11px] text-slate-500 mt-1">{new Date(a.createdAt).toLocaleString()}</div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {activeTab === 'settings' && user && isManager ? (
          <ProsSettingsPanel
            user={user}
            settings={settings}
            companyName={company.name}
            tradeType={company.tradeType}
            timezone={company.timezone}
            onUpdated={(next) => {
              setSettings(next);
              setTrackingEnabled(next.locationTrackingEnabled);
              setPingInterval(next.locationPingIntervalMinutes);
            }}
          />
        ) : activeTab === 'settings' ? (
          <p className={`${t.muted} text-sm`}>Only managers can change company settings.</p>
        ) : null}

        {activeTab === 'help' && user ? <ProsAdminManualPanel user={user} /> : null}
      </main>

      {user && company ? <ProsAssistantPanel user={user} /> : null}
    </div>
  );
}
