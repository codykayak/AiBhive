import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  BookOpen,
  CheckSquare,
  Download,
  ExternalLink,
  Headphones,
  Loader2,
  LogOut,
  Phone,
  Smartphone,
  Sparkles,
  Apple,
  Monitor,
} from 'lucide-react';
import { motion } from 'motion/react';
import { auth, googleProvider } from '../firebase';
import { SEO } from '../components/SEO';
import EmployeePortalChat from '../components/employee-portal/EmployeePortalChat';
import {
  BRAND_PLAYBOOKS,
  DAILY_CHECKLIST,
  LEAD_AGENT_INSTALL,
  type BrandId,
} from '../content/employeePortalBrands';
import {
  fetchEmployeePortalMe,
  saveEmployeePortalProfile,
  type EmployeePortalMe,
} from '../lib/employeePortalApi';

type Tab = 'operations' | BrandId | 'tools';

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function EmployeePortalPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [portal, setPortal] = useState<EmployeePortalMe | null>(null);
  const [portalError, setPortalError] = useState('');
  const [tab, setTab] = useState<Tab>('operations');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  const loadPortal = useCallback(async (u: User) => {
    setPortalError('');
    try {
      const me = await fetchEmployeePortalMe(u);
      setPortal(me);
    } catch (e) {
      setPortal(null);
      setPortalError(e instanceof Error ? e.message : 'Could not load portal');
    }
  }, []);

  useEffect(() => {
    if (user) void loadPortal(user);
    else setPortal(null);
  }, [user, loadPortal]);

  const checklist = useMemo(() => {
    const stored = portal?.profile.dailyChecklist || {};
    const date = portal?.profile.lastChecklistDate;
    if (date !== todayKey()) return {} as Record<string, boolean>;
    return stored;
  }, [portal]);

  const toggleCheck = async (id: string) => {
    if (!user || !portal) return;
    const next = { ...checklist, [id]: !checklist[id] };
    setSaving(true);
    try {
      await saveEmployeePortalProfile(user, {
        dailyChecklist: next,
        lastChecklistDate: todayKey(),
        shiftNotes: portal.profile.shiftNotes,
        displayName: portal.profile.displayName,
      });
      setPortal({
        ...portal,
        profile: {
          ...portal.profile,
          dailyChecklist: next,
          lastChecklistDate: todayKey(),
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async (shiftNotes: string) => {
    if (!user || !portal) return;
    setSaving(true);
    try {
      await saveEmployeePortalProfile(user, {
        shiftNotes,
        dailyChecklist: checklist,
        lastChecklistDate: todayKey(),
        displayName: portal.profile.displayName,
      });
      setPortal({ ...portal, profile: { ...portal.profile, shiftNotes } });
    } finally {
      setSaving(false);
    }
  };

  const signIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const activeBrand = BRAND_PLAYBOOKS.find((b) => b.id === tab);

  return (
    <div className="min-h-screen bg-[#05080f] text-white">
      <SEO
        title="Employee Portal | AiBhive"
        description="AiBhive call center operations hub — brand playbooks, Lead Agent dialer, and AI assistant for MacroREI and ManyDoors AI."
        noIndex
      />

      <div className="relative overflow-hidden border-b border-bee-amber/20">
        <div className="absolute inset-0 bg-gradient-to-br from-bee-amber/10 via-transparent to-emerald-900/20 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20 relative">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-bee-amber text-xs font-bold uppercase tracking-[0.2em] mb-3">Team operations</p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight max-w-3xl">
              Employee portal — outbound & inbound command center
            </h1>
            <p className="text-slate-400 mt-4 max-w-2xl text-lg leading-relaxed">
              Playbooks for AiBhive, MacroREI, and ManyDoors AI, daily checklists, Lead Agent for{' '}
              <strong className="text-white">Android (APK)</strong> and <strong className="text-white">iPhone (TestFlight)</strong>,
              and a Grok assistant for anything you need on shift.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {authLoading ? (
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : !user ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-12 text-center max-w-lg mx-auto">
            <Sparkles className="w-10 h-10 text-bee-amber mx-auto mb-4" />
            <h2 className="text-xl font-bold">Sign in with Google</h2>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed">
              Use the Google account your manager invited. Your checklist and shift notes save to your profile.
            </p>
            <button
              type="button"
              onClick={() => void signIn()}
              className="mt-6 w-full rounded-xl bg-bee-amber text-bee-black font-extrabold py-3 hover:bg-bee-yellow transition-colors"
            >
              Continue with Google
            </button>
          </div>
        ) : portalError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-6 max-w-xl">
            <p className="font-bold text-red-200">Access</p>
            <p className="text-red-100/80 mt-2 text-sm">{portalError}</p>
            <button
              type="button"
              onClick={() => void signOut(auth)}
              className="mt-4 text-sm text-bee-amber hover:underline"
            >
              Sign out
            </button>
          </div>
        ) : portal ? (
          <div className="grid lg:grid-cols-[240px_1fr] gap-8">
            <aside className="space-y-2 lg:sticky lg:top-24 h-fit">
              <p className="text-xs text-slate-500 px-2 mb-2">{portal.email}</p>
              {(
                [
                  ['operations', 'Daily ops', Headphones],
                  ['aibhive', 'AiBhive', BookOpen],
                  ['macrorei', 'MacroREI', Phone],
                  ['manydoors', 'ManyDoors AI', Sparkles],
                  ['tools', 'Dialer & tools', Smartphone],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    tab === id ? 'bg-bee-amber text-bee-black' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void signOut(auth)}
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:text-white mt-4"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </aside>

            <div className="min-w-0">
              {tab === 'operations' ? (
                <section className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-black flex items-center gap-2">
                      <CheckSquare className="w-7 h-7 text-bee-amber" /> Daily checklist
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Resets each calendar day · saved to your profile</p>
                    <ul className="mt-4 space-y-2">
                      {DAILY_CHECKLIST.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 cursor-pointer hover:border-bee-amber/30"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(checklist[item.id])}
                            onChange={() => void toggleCheck(item.id)}
                            className="mt-1 accent-amber-500"
                          />
                          <span className={checklist[item.id] ? 'text-slate-400 line-through' : ''}>{item.label}</span>
                        </label>
                      ))}
                    </ul>
                    {saving ? <p className="text-xs text-slate-500 mt-2">Saving…</p> : null}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5">
                      <h3 className="font-bold text-emerald-200">Outbound</h3>
                      <ul className="text-sm text-slate-300 mt-3 space-y-2 list-disc pl-4">
                        <li>Paced SMS from Lead Agent — property address in every text.</li>
                        <li>Automation tab: keep app open on Android during sends.</li>
                        <li>Log objections in shift notes for coaching.</li>
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-5">
                      <h3 className="font-bold text-sky-200">Inbound</h3>
                      <ul className="text-sm text-slate-300 mt-3 space-y-2 list-disc pl-4">
                        <li>Grok replies using macrorei.com when Lead Agent is open.</li>
                        <li>Escalate hot leads — book time on Cody&apos;s calendar.</li>
                        <li>Honor STOP / opt-out immediately in the app.</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold">Shift notes</h3>
                    <textarea
                      defaultValue={portal.profile.shiftNotes}
                      onBlur={(e) => void saveNotes(e.target.value)}
                      rows={5}
                      placeholder="Calls handled, objections heard, follow-ups needed…"
                      className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 p-4 text-sm text-white placeholder:text-slate-600"
                    />
                  </div>
                </section>
              ) : null}

              {tab === 'tools' ? (
                <section className="space-y-8">
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="rounded-3xl border-2 border-bee-amber/40 bg-gradient-to-br from-bee-amber/15 to-transparent p-6 md:p-8 flex flex-col">
                      <p className="text-bee-amber text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Smartphone className="w-4 h-4" /> Android
                      </p>
                      <h2 className="text-xl md:text-2xl font-black mt-2">{LEAD_AGENT_INSTALL.android.title}</h2>
                      <p className="text-slate-300 mt-2 text-sm leading-relaxed flex-1">
                        {LEAD_AGENT_INSTALL.android.subtitle}
                      </p>
                      <a
                        href={LEAD_AGENT_INSTALL.android.downloadPath}
                        className="inline-flex items-center justify-center gap-3 mt-6 rounded-2xl bg-bee-amber text-bee-black font-extrabold text-lg px-6 py-4 hover:bg-bee-yellow transition-colors shadow-lg shadow-bee-amber/25"
                      >
                        <Download className="w-6 h-6" />
                        Download APK
                      </a>
                      <p className="text-xs text-slate-500 mt-3 break-all">{LEAD_AGENT_INSTALL.android.publicUrl}</p>
                    </div>

                    <div
                      id="iphone-install"
                      className="rounded-3xl border-2 border-white/25 bg-gradient-to-br from-white/10 to-transparent p-6 md:p-8 flex flex-col scroll-mt-28"
                    >
                      <p className="text-slate-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Apple className="w-4 h-4" /> iPhone
                        {portal.links.leadAgentIosReady ? (
                          <span className="ml-auto text-emerald-400 normal-case tracking-normal text-xs font-bold">
                            Install ready
                          </span>
                        ) : (
                          <span className="ml-auto text-amber-400/90 normal-case tracking-normal text-xs font-bold">
                            TestFlight setup
                          </span>
                        )}
                      </p>
                      <h2 className="text-xl md:text-2xl font-black mt-2">{LEAD_AGENT_INSTALL.ios.title}</h2>
                      <p className="text-slate-300 mt-2 text-sm leading-relaxed flex-1">
                        {LEAD_AGENT_INSTALL.ios.subtitle}
                      </p>
                      <a
                        href={LEAD_AGENT_INSTALL.ios.downloadPath}
                        className="inline-flex items-center justify-center gap-3 mt-6 rounded-2xl bg-white text-bee-black font-extrabold text-lg px-6 py-4 hover:bg-slate-100 transition-colors"
                      >
                        <Apple className="w-6 h-6" />
                        {portal.links.leadAgentIosReady
                          ? LEAD_AGENT_INSTALL.ios.buttonReady
                          : LEAD_AGENT_INSTALL.ios.buttonPending}
                      </a>
                      <p className="text-xs text-slate-500 mt-3 break-all">{LEAD_AGENT_INSTALL.ios.publicUrl}</p>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="rounded-2xl bg-black/40 border border-white/10 p-4 text-sm text-slate-300">
                      <p className="font-bold text-white mb-2">Android install steps</p>
                      <ol className="list-decimal pl-4 space-y-2 leading-relaxed max-h-64 overflow-y-auto">
                        {LEAD_AGENT_INSTALL.android.steps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                      <p className="font-bold text-amber-200 mt-4 mb-2">Troubleshooting</p>
                      <ul className="list-disc pl-4 space-y-2 text-slate-300">
                        {LEAD_AGENT_INSTALL.android.troubleshooting.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-white/10 p-4 text-sm text-slate-300">
                      <p className="font-bold text-white mb-2">iPhone install steps</p>
                      <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                        {LEAD_AGENT_INSTALL.ios.testFlightSteps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                      <ul className="mt-4 space-y-2 text-sm text-amber-100/90 list-disc pl-5">
                        {LEAD_AGENT_INSTALL.ios.limitations.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                      <a
                        href="https://apps.apple.com/app/testflight/id899247664"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-bee-amber text-sm font-bold mt-4"
                      >
                        Get TestFlight from App Store <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 p-5 text-sm text-slate-400">
                    <p className="font-bold text-slate-200 mb-2">For managers — ship the iPhone build</p>
                    <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                      {LEAD_AGENT_INSTALL.ios.managerBuildSteps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="rounded-2xl border border-sky-500/30 bg-sky-950/15 p-6">
                    <p className="font-bold text-sky-200 flex items-center gap-2">
                      <Monitor className="w-5 h-5" /> {LEAD_AGENT_INSTALL.pc.title}
                    </p>
                    <ol className="mt-3 list-decimal pl-5 space-y-2 text-sm text-slate-300 leading-relaxed">
                      {LEAD_AGENT_INSTALL.pc.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 p-5">
                      <h3 className="font-bold">Twilio (coming online)</h3>
                      <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                        Server and Lead Agent already support Twilio SMS. When ops enables credentials, switch Settings →
                        SMS provider → Twilio for team-owned numbers and webhooks.
                      </p>
                      <a
                        href="/solutions/phone-systems-ai-integration"
                        className="inline-flex items-center gap-1 text-bee-amber text-sm font-bold mt-3"
                      >
                        Phone & SMS stack <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="rounded-2xl border border-white/10 p-5">
                      <h3 className="font-bold">Quick links</h3>
                      <ul className="mt-3 space-y-2 text-sm">
                        <li>
                          <a href={portal.links.macrorei} className="text-bee-amber hover:underline" target="_blank" rel="noreferrer">
                            macrorei.com
                          </a>
                        </li>
                        <li>
                          <a href={portal.links.manydoors} className="text-bee-amber hover:underline" target="_blank" rel="noreferrer">
                            manydoorsai.com
                          </a>
                        </li>
                        <li>
                          <a href="/jobs" className="text-bee-amber hover:underline">
                            Jobs & commission info
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>
              ) : null}

              {activeBrand && tab !== 'operations' && tab !== 'tools' ? (
                <section className="space-y-8">
                  <div>
                    <a
                      href={activeBrand.siteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-bold inline-flex items-center gap-1"
                      style={{ color: activeBrand.accent }}
                    >
                      {activeBrand.siteUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                    <h2 className="text-3xl font-black mt-1">{activeBrand.name}</h2>
                    <p className="text-slate-400 mt-1">{activeBrand.tagline}</p>
                    <p className="mt-4 text-lg text-slate-200 leading-relaxed">{activeBrand.elevatorPitch}</p>
                  </div>

                  <div>
                    <h3 className="font-bold text-bee-amber">Sell points</h3>
                    <ul className="mt-3 grid sm:grid-cols-2 gap-3">
                      {activeBrand.sellPoints.map((p) => (
                        <li key={p} className="rounded-xl bg-white/[0.04] border border-white/10 p-4 text-sm text-slate-300">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-bee-amber">Industry vocabulary</h3>
                    <dl className="mt-3 space-y-3">
                      {activeBrand.vocabulary.map((v) => (
                        <div key={v.term} className="rounded-xl border border-white/10 p-4">
                          <dt className="font-bold text-white">{v.term}</dt>
                          <dd className="text-sm text-slate-400 mt-1">{v.meaning}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div>
                    <h3 className="font-bold text-bee-amber">Objections</h3>
                    <div className="mt-3 space-y-3">
                      {activeBrand.objectionHandlers.map((o) => (
                        <div key={o.objection} className="rounded-xl bg-white/[0.03] p-4 border border-white/10">
                          <p className="text-red-300/90 text-sm font-semibold">&ldquo;{o.objection}&rdquo;</p>
                          <p className="text-slate-300 text-sm mt-2">{o.response}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-bee-amber">Call & SMS scripts</h3>
                    <div className="mt-3 space-y-4">
                      {activeBrand.callScripts.map((s) => (
                        <div key={s.title} className="rounded-xl border border-bee-amber/20 p-4">
                          <p className="font-bold">{s.title}</p>
                          <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap font-mono leading-relaxed">{s.script}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        ) : (
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
        )}
      </div>

      {user && portal && !portalError ? <EmployeePortalChat user={user} /> : null}
    </div>
  );
}
