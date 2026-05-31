import { useState, useEffect } from 'react';
import { signInWithPopup, User, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { SEO } from '../components/SEO';
import { LayoutDashboard, Settings, LogOut, Users, Loader2, AlertCircle, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

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

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'settings'>('leads');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preferredModel, setPreferredModel] = useState<string>('gemini');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoadingAuth(false);
      if (u) {
        fetchAdminData(u);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Login failed:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed');
      }
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setLeads([]);
  };

  const fetchAdminData = async (currentUser: User) => {
    setLoadingData(true);
    setError(null);
    try {
      const token = await currentUser.getIdToken();

      // Fetch Leads
      const leadsRes = await fetch(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/admin/leads` : '/api/admin/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!leadsRes.ok) throw new Error(await leadsRes.text());
      const leadsData = await leadsRes.json();
      setLeads(leadsData.leads);

      // Fetch Settings
      const settingsRes = await fetch(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/admin/settings` : '/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!settingsRes.ok) throw new Error(await settingsRes.text());
      const settingsData = await settingsRes.json();
      setPreferredModel(settingsData.settings?.preferredModel || 'gemini');

    } catch (err: unknown) {
      console.error('Error fetching admin data:', err);
      setError('Unauthorized or Failed to load admin data. Ensure your email is whitelisted.');
      signOut(auth); // Force signout if they aren't authorized by backend
    } finally {
      setLoadingData(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    setSavingSettings(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/admin/settings` : '/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ preferredModel })
      });
      if (!res.ok) throw new Error('Failed to save settings');
      alert('Settings saved successfully!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Error: ' + err.message);
      } else {
        alert('An error occurred');
      }
    } finally {
      setSavingSettings(false);
    }
  };

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
            <LogOut className="w-10 h-10 text-bee-amber ml-1" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-slate-400 mb-8">Authorized access required to manage operations.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start text-sm">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-left">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center shadow-lg"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <LayoutDashboard className="w-8 h-8 text-bee-amber mr-3" />
            Control Panel
          </h1>
          <p className="text-slate-400">Welcome, {user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-slate-300 font-medium rounded-xl transition-colors flex items-center"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </button>
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('leads')}
          className={cn(
            "px-6 py-3 rounded-xl font-medium transition-all flex items-center",
            activeTab === 'leads'
              ? "bg-bee-amber text-bee-black shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              : "bg-white/5 text-slate-300 hover:bg-white/10"
          )}
        >
          <Users className="w-5 h-5 mr-2" />
          Recent Leads
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "px-6 py-3 rounded-xl font-medium transition-all flex items-center",
            activeTab === 'settings'
              ? "bg-bee-amber text-bee-black shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              : "bg-white/5 text-slate-300 hover:bg-white/10"
          )}
        >
          <Settings className="w-5 h-5 mr-2" />
          Pipeline Settings
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-start">
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {loadingData ? (
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Services</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">
                        {lead.createdAt?.seconds
                          ? new Date(lead.createdAt.seconds * 1000).toLocaleString()
                          : 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium flex w-max items-center",
                          lead.status === 'completed' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          lead.status === 'failed' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-bee-amber/10 text-bee-amber border border-bee-amber/20"
                        )}>
                          {lead.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {lead.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                          {lead.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {lead.error && <p className="text-red-400 text-xs mt-1 truncate max-w-[150px]" title={lead.error}>{lead.error}</p>}
                      </td>
                      <td className="px-6 py-4">
                        {lead.email || <span className="text-slate-500 italic">No email</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {lead.services?.legalMedical && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded border border-blue-500/20">Legal/Med</span>}
                          {lead.services?.voiceCloning && <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] rounded border border-purple-500/20">Voice</span>}
                          {lead.services?.transcribeTranslate && <span className="px-2 py-0.5 bg-white/10 text-white text-[10px] rounded border border-white/20">T+T</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        ${lead.calculatedPrice?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {lead.fileUrls?.[0] && (
                           <a href={lead.fileUrls[0]} target="_blank" rel="noreferrer" className="text-bee-amber hover:underline text-xs inline-flex items-center">
                             <FileText className="w-3 h-3 mr-1" /> Source
                           </a>
                        )}
                        {lead.cleanTranslatedTextUrl && (
                           <a href={lead.cleanTranslatedTextUrl} target="_blank" rel="noreferrer" className="text-green-400 hover:underline text-xs inline-flex items-center ml-3">
                             <CheckCircle2 className="w-3 h-3 mr-1" /> Output
                           </a>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No leads found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-8 max-w-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">AI Pipeline Configuration</h2>

              <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
                <h3 className="text-lg font-medium text-white mb-4">Multi-Model Verification Engine</h3>
                <p className="text-sm text-slate-400 mb-6">
                  Select the Large Language Model used for the secondary "High-Risk Context Accuracy Check" (Pass 2).
                  This model scans the initial translation for medical and legal terminology.
                </p>

                <div className="space-y-4">
                  <label className={cn(
                    "flex items-center p-4 rounded-xl cursor-pointer border transition-all",
                    preferredModel === 'gemini' ? "bg-bee-amber/10 border-bee-amber/50" : "bg-black/20 border-white/10 hover:border-white/30"
                  )}>
                    <input type="radio" name="model" value="gemini" checked={preferredModel === 'gemini'} onChange={(e) => setPreferredModel(e.target.value)} className="w-5 h-5 text-bee-amber bg-black border-white/20 focus:ring-bee-amber focus:ring-offset-gray-900" />
                    <div className="ml-4 flex-grow">
                      <span className="block text-white font-medium">Google Gemini 2.5 Pro</span>
                      <span className="block text-sm text-slate-400">Current Default. Highly capable reasoning engine.</span>
                    </div>
                  </label>

                  <label className={cn(
                    "flex items-center p-4 rounded-xl cursor-pointer border transition-all",
                    preferredModel === 'claude' ? "bg-bee-amber/10 border-bee-amber/50" : "bg-black/20 border-white/10 hover:border-white/30"
                  )}>
                    <input type="radio" name="model" value="claude" checked={preferredModel === 'claude'} onChange={(e) => setPreferredModel(e.target.value)} className="w-5 h-5 text-bee-amber bg-black border-white/20 focus:ring-bee-amber focus:ring-offset-gray-900" />
                    <div className="ml-4 flex-grow">
                      <span className="block text-white font-medium">Anthropic Claude 3.5 Sonnet</span>
                      <span className="block text-sm text-slate-400">Excellent nuance and safety adherence. (API integration pending)</span>
                    </div>
                  </label>

                  <label className={cn(
                    "flex items-center p-4 rounded-xl cursor-pointer border transition-all",
                    preferredModel === 'grok' ? "bg-bee-amber/10 border-bee-amber/50" : "bg-black/20 border-white/10 hover:border-white/30"
                  )}>
                    <input type="radio" name="model" value="grok" checked={preferredModel === 'grok'} onChange={(e) => setPreferredModel(e.target.value)} className="w-5 h-5 text-bee-amber bg-black border-white/20 focus:ring-bee-amber focus:ring-offset-gray-900" />
                    <div className="ml-4 flex-grow">
                      <span className="block text-white font-medium">xAI Grok</span>
                      <span className="block text-sm text-slate-400">Real-time knowledge focus. (API integration pending)</span>
                    </div>
                  </label>
                </div>
              </div>

              <button
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
