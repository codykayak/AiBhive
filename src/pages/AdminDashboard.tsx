import { useCallback, useEffect, useMemo, useState } from 'react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import { useSearchParams } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { SEO } from '../components/SEO';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Users,
  Loader2,
  AlertCircle,
  FileText,
  CheckCircle2,
  XCircle,
  Megaphone,
  RefreshCw,
  Search,
  Copy,
  Check,
  BarChart3,
  Ticket,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { adminJson } from '../lib/adminApi';
import RagSourcesPanel from '../components/admin/RagSourcesPanel';
import AutoSocialPanel from '../components/admin/AutoSocialPanel';
import AdminAnalyticsPanel from '../components/admin/AdminAnalyticsPanel';
import AdminPromoCodesPanel from '../components/admin/AdminPromoCodesPanel';

interface Lead {
  id: string;
  email: string | null;
  status: string;
  calculatedPrice: number;
  createdAt: { seconds: number; nanoseconds: number } | null;
  fileUrls: string[];
  fileType: string;
  cleanTranslatedTextUrl?: string;
  error?: string;
  services: {
    transcribeTranslate?: boolean;
    legalMedical?: boolean;
    voiceCloning?: boolean;
  };
}

type SettingsResponse = { settings: { preferredModel?: string } };
type LeadsResponse = { leads: Lead[] };

const STATUS_FILTERS = ['all', 'completed', 'paid', 'processing', 'failed', 'pending'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function formatLeadDate(createdAt: Lead['createdAt']) {
  if (!createdAt?.seconds) return '—';
  return new Date(createdAt.seconds * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').toUpperCase();
}

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const tabParam = searchParams.get('tab');
  const initialTab =
    tabParam === 'auto-social' ||
    tabParam === 'settings' ||
    tabParam === 'analytics' ||
    tabParam === 'promos'
      ? tabParam
      : 'leads';
  const [activeTab, setActiveTab] = useState<
    'leads' | 'settings' | 'auto-social' | 'analytics' | 'promos'
  >(initialTab);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [preferredModel, setPreferredModel] = useState<string>('gemini');
  const [savingSettings, setSavingSettings] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAdminData = useCallback(async (currentUser: User) => {
    setLoadingData(true);
    setError(null);
    try {
      const [leadsData, settingsData] = await Promise.all([
        adminJson<LeadsResponse>('/api/admin/leads', currentUser),
        adminJson<SettingsResponse>('/api/admin/settings', currentUser),
      ]);
      setLeads(leadsData.leads ?? []);
      setPreferredModel(settingsData.settings?.preferredModel || 'gemini');
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      console.error('Error fetching admin data:', err);
      const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0;
      if (status === 403) {
        setError('Access denied. Your Google account is not on the admin allowlist.');
        await signOut(auth);
      } else {
        setError(
          err instanceof Error ? err.message : 'Failed to load admin data. Try refreshing.'
        );
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoadingAuth(false);
      if (u) fetchAdminData(u);
    });
    return () => unsubscribe();
  }, [fetchAdminData]);

  const switchTab = useCallback(
    (tab: 'leads' | 'settings' | 'auto-social' | 'analytics' | 'promos') => {
      setActiveTab(tab);
      if (tab === 'leads') {
        searchParams.delete('tab');
        setSearchParams(searchParams, { replace: true });
      } else {
        setSearchParams({ tab }, { replace: true });
      }
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (
      tabParam === 'auto-social' ||
      tabParam === 'settings' ||
      tabParam === 'analytics' ||
      tabParam === 'promos'
    ) {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      setActiveTab('leads');
    }
  }, [tabParam]);

  const handleLogin = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setLeads([]);
    setLastRefreshed(null);
  };

  const saveSettings = async () => {
    if (!user) return;
    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      await adminJson('/api/admin/settings', user, {
        method: 'POST',
        body: JSON.stringify({ preferredModel }),
      });
      setSettingsMessage({ type: 'success', text: 'Pipeline settings saved.' });
    } catch (err: unknown) {
      setSettingsMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not save settings',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const copyLeadId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const stats = useMemo(() => {
    const total = leads.length;
    const completed = leads.filter((l) => l.status === 'completed').length;
    const failed = leads.filter((l) => l.status === 'failed').length;
    const inProgress = leads.filter((l) =>
      ['paid', 'processing', 'pending'].includes(l.status)
    ).length;
    const revenue = leads.reduce((sum, l) => sum + (l.calculatedPrice || 0), 0);
    return { total, completed, failed, inProgress, revenue };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus =
        statusFilter === 'all' || lead.status === statusFilter;
      const matchesSearch =
        !q ||
        lead.id.toLowerCase().includes(q) ||
        (lead.email?.toLowerCase().includes(q) ?? false);
      return matchesStatus && matchesSearch;
    });
  }, [leads, statusFilter, searchQuery]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-12 h-12 text-bee-amber animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-24 px-4">
        <SEO title="Admin Login | AiBhive" description="Authorized personnel only." />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 max-w-md w-full rounded-3xl text-center"
        >
          <div className="w-20 h-20 bg-bee-amber/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <LayoutDashboard className="w-10 h-10 text-bee-amber" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-slate-400 mb-8">Sign in with an allowlisted Google account.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start text-sm text-left">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center shadow-lg"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <SEO title="Dashboard | Admin | AiBhive" description="Operations Dashboard" />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <LayoutDashboard className="w-8 h-8 text-bee-amber mr-3" />
            Control Panel
          </h1>
          <p className="text-slate-400 text-sm">
            {user.email}
            {lastRefreshed && (
              <span className="text-slate-500">
                {' '}
                · Updated {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fetchAdminData(user)}
            disabled={loadingData}
            className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-medium rounded-xl transition-colors flex items-center disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', loadingData && 'animate-spin')} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-slate-300 font-medium rounded-xl transition-colors flex items-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Recent leads', value: stats.total, accent: 'text-white' },
          { label: 'In progress', value: stats.inProgress, accent: 'text-bee-amber' },
          { label: 'Completed', value: stats.completed, accent: 'text-green-400' },
          { label: 'Failed', value: stats.failed, accent: 'text-red-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card rounded-2xl p-4 border border-white/10"
          >
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{stat.label}</p>
            <p className={cn('text-2xl font-bold', stat.accent)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={() => switchTab('leads')}
          className={cn(
            'px-6 py-3 rounded-xl font-medium transition-all flex items-center',
            activeTab === 'leads'
              ? 'bg-bee-amber text-bee-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          )}
        >
          <Users className="w-5 h-5 mr-2" />
          Recent Leads
        </button>
        <button
          type="button"
          onClick={() => switchTab('auto-social')}
          className={cn(
            'px-6 py-3 rounded-xl font-medium transition-all flex items-center',
            activeTab === 'auto-social'
              ? 'bg-bee-amber text-bee-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          )}
        >
          <Megaphone className="w-5 h-5 mr-2" />
          Auto Social
        </button>
        <button
          type="button"
          onClick={() => switchTab('analytics')}
          className={cn(
            'px-6 py-3 rounded-xl font-medium transition-all flex items-center',
            activeTab === 'analytics'
              ? 'bg-bee-amber text-bee-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          )}
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          Analytics
        </button>
        <button
          type="button"
          onClick={() => switchTab('promos')}
          className={cn(
            'px-6 py-3 rounded-xl font-medium transition-all flex items-center',
            activeTab === 'promos'
              ? 'bg-bee-amber text-bee-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          )}
        >
          <Ticket className="w-5 h-5 mr-2" />
          Promo codes
        </button>
        <button
          type="button"
          onClick={() => switchTab('settings')}
          className={cn(
            'px-6 py-3 rounded-xl font-medium transition-all flex items-center',
            activeTab === 'settings'
              ? 'bg-bee-amber text-bee-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          )}
        >
          <Settings className="w-5 h-5 mr-2" />
          Pipeline Settings
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start">
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loadingData && leads.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-bee-amber animate-spin" />
        </div>
      ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl overflow-hidden border border-white/10"
        >
          {activeTab === 'leads' && (
            <>
              <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="search"
                    placeholder="Search by email or lead ID…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-bee-amber/50"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-bee-amber/50"
                >
                  {STATUS_FILTERS.map((s) => (
                    <option key={s} value={s}>
                      {s === 'all' ? 'All statuses' : statusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Lead ID</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Services</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4 text-right">Files</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                          {formatLeadDate(lead.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => copyLeadId(lead.id)}
                            className="font-mono text-xs text-slate-400 hover:text-bee-amber flex items-center gap-1 max-w-[120px]"
                            title={lead.id}
                          >
                            {lead.id.slice(0, 8)}…
                            {copiedId === lead.id ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-medium flex w-max items-center',
                              lead.status === 'completed'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : lead.status === 'failed'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-bee-amber/10 text-bee-amber border border-bee-amber/20'
                            )}
                          >
                            {lead.status === 'completed' && (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            )}
                            {lead.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                            {statusLabel(lead.status)}
                          </span>
                          {lead.error && (
                            <p
                              className="text-red-400 text-xs mt-1 truncate max-w-[180px]"
                              title={lead.error}
                            >
                              {lead.error}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {lead.email || (
                            <span className="text-slate-500 italic">No email</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1 flex-wrap">
                            {lead.services?.legalMedical && (
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded border border-blue-500/20">
                                Legal/Med
                              </span>
                            )}
                            {lead.services?.voiceCloning && (
                              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] rounded border border-purple-500/20">
                                Voice
                              </span>
                            )}
                            {lead.services?.transcribeTranslate && (
                              <span className="px-2 py-0.5 bg-white/10 text-white text-[10px] rounded border border-white/20">
                                T+T
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono">
                          ${lead.calculatedPrice?.toFixed(2) ?? '0.00'}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          {lead.fileUrls?.[0] && (
                            <a
                              href={lead.fileUrls[0]}
                              target="_blank"
                              rel="noreferrer"
                              className="text-bee-amber hover:underline text-xs inline-flex items-center"
                            >
                              <FileText className="w-3 h-3 mr-1" /> Source
                            </a>
                          )}
                          {lead.cleanTranslatedTextUrl && (
                            <a
                              href={lead.cleanTranslatedTextUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-green-400 hover:underline text-xs inline-flex items-center"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Output
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          {leads.length === 0
                            ? 'No leads in the database yet.'
                            : 'No leads match your filters.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'auto-social' && <AutoSocialPanel user={user} />}

          {activeTab === 'analytics' && <AdminAnalyticsPanel user={user} />}

          {activeTab === 'promos' && <AdminPromoCodesPanel user={user} />}

          {activeTab === 'settings' && (
            <div className="p-8 max-w-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">AI Pipeline Configuration</h2>

              {settingsMessage && (
                <div
                  className={cn(
                    'mb-6 p-4 rounded-xl border text-sm',
                    settingsMessage.type === 'success'
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  )}
                >
                  {settingsMessage.text}
                </div>
              )}

              <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
                <h3 className="text-lg font-medium text-white mb-4">
                  Pass 2: Base Accuracy Verification Engine
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Model used for the secondary high-risk context accuracy check (legal and medical
                  terminology).
                </p>

                <div className="space-y-4">
                  {(
                    [
                      {
                        value: 'gemini',
                        title: 'Google Gemini 2.5 Pro',
                        desc: 'Default. Strong reasoning for verification passes.',
                      },
                      {
                        value: 'claude',
                        title: 'Anthropic Claude 3.5 Sonnet',
                        desc: 'Excellent nuance (API wiring in processing pipeline).',
                      },
                      {
                        value: 'grok',
                        title: 'xAI Grok',
                        desc: 'Real-time knowledge focus (API wiring pending).',
                      },
                    ] as const
                  ).map((model) => (
                    <label
                      key={model.value}
                      className={cn(
                        'flex items-center p-4 rounded-xl cursor-pointer border transition-all',
                        preferredModel === model.value
                          ? 'bg-bee-amber/10 border-bee-amber/50'
                          : 'bg-black/20 border-white/10 hover:border-white/30'
                      )}
                    >
                      <input
                        type="radio"
                        name="model"
                        value={model.value}
                        checked={preferredModel === model.value}
                        onChange={(e) => setPreferredModel(e.target.value)}
                        className="w-5 h-5 text-bee-amber bg-black border-white/20 focus:ring-bee-amber"
                      />
                      <div className="ml-4 flex-grow">
                        <span className="block text-white font-medium">{model.title}</span>
                        <span className="block text-sm text-slate-400">{model.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <RagSourcesPanel user={user} />

              <button
                type="button"
                onClick={saveSettings}
                disabled={savingSettings}
                className="px-8 py-3 bg-bee-amber text-bee-black font-bold rounded-xl hover:bg-bee-yellow transition-all flex items-center disabled:opacity-50"
              >
                {savingSettings && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                Save Changes
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
