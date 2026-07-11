import { useCallback, useEffect, useMemo, useState } from 'react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Activity,
  AlertCircle,
  Briefcase,
  Building2,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { SEO } from '../components/SEO';
import { cn } from '../lib/utils';
import {
  prosJson,
  prosMe,
  type ProsJob,
  type ProsMember,
} from '../lib/prosApi';
import ProsAiKeysPanel from '../components/pros/ProsAiKeysPanel';

type Tab =
  | 'overview'
  | 'dispatch'
  | 'team'
  | 'ai-keys'
  | 'activity'
  | 'settings';

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'dispatch', label: 'Dispatch', icon: ClipboardList },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'ai-keys', label: 'AI Keys', icon: KeyRound },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const STATUS_COLORS: Record<string, string> = {
  queued: 'bg-slate-500/20 text-slate-300',
  in_progress: 'bg-sky-500/20 text-sky-300',
  needs_parts: 'bg-amber-500/20 text-amber-300',
  done: 'bg-emerald-500/20 text-emerald-300',
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
  const [jobs, setJobs] = useState<ProsJob[]>([]);
  const [members, setMembers] = useState<ProsMember[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // onboarding
  const [companyName, setCompanyName] = useState('');
  const [tradeType, setTradeType] = useState<'pool' | 'electrical' | 'property' | 'multi'>('pool');
  const [inviteCode, setInviteCode] = useState('');
  const [onboardingBusy, setOnboardingBusy] = useState(false);

  // new job form
  const [jobTitle, setJobTitle] = useState('');
  const [jobAddress, setJobAddress] = useState('');
  const [jobAssignee, setJobAssignee] = useState('');
  const [jobPack, setJobPack] = useState<'pool' | 'electrical' | 'property'>('pool');
  const [jobPriority, setJobPriority] = useState<'normal' | 'high' | 'emergency'>('normal');

  const isManager = membership?.role === 'owner' || membership?.role === 'manager';

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  const refreshAll = useCallback(
    async (current: User) => {
      setLoadingData(true);
      setBootError(null);
      try {
        const me = await prosMe(current);
        setCompany(me.company);
        setMembership(me.membership);
        if (!me.company) {
          setOverview(null);
          setJobs([]);
          setMembers([]);
          return;
        }
        const [ov, jobsRes, teamRes] = await Promise.all([
          prosJson<NonNullable<typeof overview>>('/api/pros/overview', current),
          prosJson<{ jobs: ProsJob[] }>('/api/pros/jobs', current),
          prosJson<{ members: ProsMember[] }>('/api/pros/team', current),
        ]);
        setOverview(ov);
        setJobs(jobsRes.jobs);
        setMembers(teamRes.members);
      } catch (err) {
        setBootError(err instanceof Error ? err.message : 'Failed to load Pros');
      } finally {
        setLoadingData(false);
      }
    },
    []
  );

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
        packId: jobPack,
        priority: jobPriority,
        assigneeUid: jobAssignee || null,
        assigneeName: assignee?.displayName || assignee?.email || null,
      }),
    });
    setJobTitle('');
    setJobAddress('');
    setJobAssignee('');
    await refreshAll(user);
    setTab('dispatch');
  };

  const cycleJobStatus = async (job: ProsJob) => {
    if (!user) return;
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

  const techOptions = useMemo(
    () => members.filter((m) => m.status !== 'inactive'),
    [members]
  );

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Pros…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-white flex items-center justify-center px-4">
        <SEO title="AiBhive Pros" description="Field ops admin for trade companies" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-8 text-center"
        >
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-5">
            <Wrench className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            AiB<span className="text-amber-400">hive</span> Pros
          </h1>
          <p className="mt-3 text-slate-400 text-sm leading-relaxed">
            Dispatch jobs, manage techs, and plug in Grok, Claude, Kimi, and Gemini for Diagnose —
            all from one company HQ.
          </p>
          <button
            type="button"
            onClick={() => void signIn()}
            className="mt-8 w-full rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5"
          >
            Continue with Google
          </button>
          <p className="mt-4 text-xs text-slate-500">
            Field app: Diagnose · Admin: <span className="text-slate-400">aibhive.com/pros</span>
          </p>
        </motion.div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-white px-4 py-16">
        <SEO title="Set up Pros" />
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black">Welcome to Pros</h1>
              <p className="text-slate-400 text-sm mt-1">Signed in as {user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void signOut(auth)}
              className="text-sm text-slate-400 hover:text-white inline-flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>

          {bootError ? (
            <div className="mb-6 rounded-xl bg-red-500/15 text-red-300 px-4 py-3 text-sm flex gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" /> {bootError}
            </div>
          ) : null}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <Building2 className="w-6 h-6 text-amber-400" />
              <h2 className="text-lg font-bold">Create your company</h2>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Pool Service"
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm"
              />
              <select
                value={tradeType}
                onChange={(e) => setTradeType(e.target.value as typeof tradeType)}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm"
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
                className="w-full rounded-xl bg-amber-500 text-black font-bold py-3 disabled:opacity-50"
              >
                Create HQ
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <Users className="w-6 h-6 text-sky-400" />
              <h2 className="text-lg font-bold">Join with invite code</h2>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="PROS-XXXXXX"
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm font-mono uppercase"
              />
              <button
                type="button"
                disabled={onboardingBusy}
                onClick={() => void joinCompany()}
                className="w-full rounded-xl border border-white/15 hover:border-sky-400/50 font-bold py-3 disabled:opacity-50"
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
    <div className="min-h-screen bg-[#0B0F14] text-white">
      <SEO title={`${company.name} · Pros`} description="AiBhive Pros field operations" />

      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/80">
                AiBhive Pros
              </div>
              <h1 className="text-lg font-black leading-tight">{company.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => user && void refreshAll(user)}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', loadingData && 'animate-spin')} />
            </button>
            <span className="hidden sm:inline text-slate-500">{user.email}</span>
            <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-white/5 text-slate-300">
              {membership?.role}
            </span>
            <button
              type="button"
              onClick={() => void signOut(auth)}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto pb-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap',
                  activeTab === t.id
                    ? 'bg-amber-500 text-black'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {bootError ? (
          <div className="mb-6 rounded-xl bg-red-500/15 text-red-300 px-4 py-3 text-sm">{bootError}</div>
        ) : null}

        {activeTab === 'overview' && overview ? (
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Open jobs', value: overview.openJobs, icon: ClipboardList },
                { label: 'Team', value: overview.members, icon: Users },
                { label: 'Techs', value: overview.techs, icon: Wrench },
                { label: 'Jobs total', value: overview.jobsTotal, icon: Briefcase },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <card.icon className="w-5 h-5 text-amber-400 mb-3" />
                  <div className="text-3xl font-black">{card.value}</div>
                  <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-bold mb-4">Pipeline</h3>
                <div className="space-y-2">
                  {Object.entries(overview.jobsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold', STATUS_COLORS[status])}>
                        {status.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-slate-300">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-bold mb-4">Recent activity</h3>
                <ul className="space-y-3">
                  {overview.recentActivity.length === 0 ? (
                    <li className="text-sm text-slate-500">No activity yet — create a job to get rolling.</li>
                  ) : (
                    overview.recentActivity.map((a) => (
                      <li key={a.id} className="text-sm text-slate-300 border-b border-white/5 pb-2">
                        {a.message || a.type}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-amber-200">AI not configured yet?</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Add Grok, Claude, Kimi, and Gemini keys so Diagnose can talk to your models.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTab('ai-keys')}
                className="rounded-xl bg-amber-500 text-black font-bold px-4 py-2 text-sm"
              >
                Open AI Keys
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === 'dispatch' ? (
          <div className="space-y-8">
            {isManager ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" /> Assign a job
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Job title — e.g. Salt cell inspect"
                    className="rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm"
                  />
                  <input
                    value={jobAddress}
                    onChange={(e) => setJobAddress(e.target.value)}
                    placeholder="Address"
                    className="rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm"
                  />
                  <select
                    value={jobAssignee}
                    onChange={(e) => setJobAssignee(e.target.value)}
                    className="rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {techOptions.map((m) => (
                      <option key={m.uid} value={m.uid}>
                        {m.displayName || m.email} ({m.role})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <select
                      value={jobPack}
                      onChange={(e) => setJobPack(e.target.value as 'pool' | 'electrical' | 'property')}
                      className="flex-1 rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm"
                    >
                      <option value="pool">Pool pack</option>
                      <option value="electrical">Electrical pack</option>
                      <option value="property">Property pack</option>
                    </select>
                    <select
                      value={jobPriority}
                      onChange={(e) => setJobPriority(e.target.value as typeof jobPriority)}
                      className="flex-1 rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm"
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
                  className="rounded-xl bg-amber-500 text-black font-bold px-5 py-2.5 text-sm"
                >
                  Dispatch job
                </button>
              </div>
            ) : null}

            <div className="space-y-3">
              {jobs.length === 0 ? (
                <p className="text-slate-500 text-sm">No jobs yet.</p>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-wrap gap-4 justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <button
                          type="button"
                          onClick={() => void cycleJobStatus(job)}
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full',
                            STATUS_COLORS[job.status]
                          )}
                        >
                          {job.status.replace('_', ' ')}
                        </button>
                        <span className="text-[10px] uppercase text-slate-500 font-bold">{job.packId}</span>
                        {job.priority !== 'normal' ? (
                          <span className="text-[10px] uppercase text-red-300 font-bold">{job.priority}</span>
                        ) : null}
                      </div>
                      <h3 className="font-bold text-white">{job.title}</h3>
                      <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" /> {job.address || 'Address TBD'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {job.assigneeName || 'Unassigned'}
                        {job.fieldNotes?.length ? ` · ${job.fieldNotes.length} field notes` : ''}
                        {job.photos?.length ? ` · ${job.photos.length} photos` : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'team' ? (
          <div className="space-y-4">
            {isManager && company.inviteCode ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase text-slate-500 font-bold">Invite code</div>
                  <div className="font-mono text-lg text-amber-300">{company.inviteCode}</div>
                </div>
                <button
                  type="button"
                  onClick={() => void rotateInvite()}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:border-amber-500/40"
                >
                  Rotate code
                </button>
              </div>
            ) : null}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((m) => (
                <div key={m.uid} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-amber-500/20 overflow-hidden flex items-center justify-center text-amber-300 font-bold">
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (m.displayName || m.email || '?').slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold truncate">{m.displayName || 'Tech'}</div>
                      <div className="text-xs text-slate-500 truncate">{m.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 text-[10px] font-bold uppercase">
                    <span className="px-2 py-1 rounded-full bg-white/5 text-slate-300">{m.role}</span>
                    <span className="px-2 py-1 rounded-full bg-white/5 text-slate-300">{m.tradePack || '—'}</span>
                    <span className="px-2 py-1 rounded-full bg-white/5 text-slate-300">{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'ai-keys' ? (
          isManager ? (
            <ProsAiKeysPanel user={user} />
          ) : (
            <p className="text-slate-400 text-sm">Only owners and managers can manage AI API keys.</p>
          )
        ) : null}

        {activeTab === 'activity' && overview ? (
          <ul className="space-y-3">
            {overview.recentActivity.map((a) => (
              <li key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                <div className="text-slate-200">{a.message || a.type}</div>
                {a.createdAt ? (
                  <div className="text-[11px] text-slate-500 mt-1">{new Date(a.createdAt).toLocaleString()}</div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {activeTab === 'settings' ? (
          <div className="space-y-6 max-w-xl">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
              <h2 className="font-bold">Company</h2>
              <p className="text-sm text-slate-400">
                Trade focus: <span className="text-white">{company.tradeType}</span>
              </p>
              <p className="text-sm text-slate-400">
                Timezone: <span className="text-white">{company.timezone || '—'}</span>
              </p>
              <p className="text-sm text-slate-500">
                Mobile field app is <strong className="text-slate-300">AiBhive Diagnose</strong>. Techs sign in,
                see assigned jobs, add notes/photos, and sync back here.
              </p>
              <Link to="/" className="text-sm text-amber-400 hover:underline inline-block mt-2">
                ← Back to AiBhive
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
