import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, Globe, ArrowRight, Zap, BarChart3, PieChart as PieIcon, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

import translationVoiceDubbingImg from '../Translation_voice_dubing_for_content_growth.png';
import growContentCreatorsImg from '../grow_content_creators_podcator_veiwership_translations.png';
import mrBeastMultiplierImg from '../mr_beast_translation_content_multiplyer.jpg';

const languageData = [
  { name: 'Hindi', users: 462, views: 73, color: '#fbbf24' },
  { name: 'Spanish', users: 559, views: 55, color: '#f59e0b' },
  { name: 'Portuguese', users: 260, views: 38, color: '#d97706' },
  { name: 'Indonesian', users: 200, views: 32, color: '#b45309' },
  { name: 'Russian', users: 258, views: 42, color: '#92400e' },
];

const countryData = [
  { name: 'India', users: 462 },
  { name: 'USA', users: 239 },
  { name: 'Brazil', users: 142 },
  { name: 'Indonesia', users: 139 },
];

export default function GrowGlobally() {
  return (
    <main className="py-24">
      <SEO 
        title="Global AI Growth Strategies - Localization & Reach | AiBhive"
        description="Unlock 2-5x more views and revenue by localizing your content. AiBhive's global growth hub provides data-driven insights into why AI translation and voice cloning are essential for creators."
        keywords="global content growth, YouTube localization, AI translation ROI, multilingual content strategy, AiBhive, international reach"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-6 py-2 rounded-full bg-bee-amber/10 text-bee-amber text-sm font-bold uppercase tracking-widest mb-6"
          >
            Global Expansion
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-white mb-8"
          >
            Grow <span className="text-gradient">Globally</span>
          </motion.h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Multiply Views 2-5x — Translate & Clone Your Voice. The numbers don't lie: localization is the ultimate growth rocket.
          </p>
        </header>

        {/* Top Image Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mb-24 img-frame-sharp relative group"
        >
          <img
            src={translationVoiceDubbingImg}
            alt="Translation Voice Dubbing For Content Growth"
            className="w-full object-cover max-h-[640px] transition-transform duration-[1500ms] group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bee-black/70 via-transparent to-transparent" />
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          <section className="glass-card rounded-[2.5rem] p-10">
            <h2 className="text-2xl font-bold text-white mb-10 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-bee-amber" />
              Non-English Viewership (Millions)
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={languageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="views" radius={[10, 10, 0, 0]} barSize={40}>
                    {languageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-slate-500 text-sm mt-6 italic text-center">
              Data based on 2025-2026 YouTube localization studies.
            </p>
          </section>

          <section className="glass-card rounded-[2.5rem] p-10">
            <h2 className="text-2xl font-bold text-white mb-10 flex items-center">
              <PieIcon className="w-6 h-6 mr-3 text-bee-amber" />
              User Base by Country (Millions)
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={countryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="users"
                    stroke="none"
                  >
                    {countryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={languageData[index % languageData.length].color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '16px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-6">
              {countryData.map((item, index) => (
                <div key={item.name} className="flex items-center text-sm bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="w-4 h-4 rounded-full mr-3 shadow-lg" style={{ backgroundColor: languageData[index % languageData.length].color }} />
                  <span className="text-slate-300 font-medium">{item.name}: <span className="text-white font-extrabold ml-1">{item.users}M</span></span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="glass-card rounded-[3rem] p-16 mb-24 border-bee-amber/20 bg-bee-amber/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
            <article className="relative">
              <div className="text-5xl font-extrabold text-bee-amber mb-3">80%+</div>
              <h3 className="text-slate-300 text-lg font-medium">Increase from translated subtitles alone</h3>
              <div className="hidden md:block absolute top-1/2 -right-8 w-px h-12 bg-white/10 -translate-y-1/2" />
            </article>
            <article className="relative">
              <div className="text-5xl font-extrabold text-bee-amber mb-3">37%</div>
              <h3 className="text-slate-300 text-lg font-medium">Revenue spike in 30 days with Spanish captions</h3>
              <div className="hidden md:block absolute top-1/2 -right-8 w-px h-12 bg-white/10 -translate-y-1/2" />
            </article>
            <article>
              <div className="text-5xl font-extrabold text-bee-amber mb-3">80M</div>
              <h3 className="text-slate-300 text-lg font-medium">Extra views from localization (MrBeast Case Study)</h3>
            </article>
          </div>
        </section>

        {/* Middle Image Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mb-24 img-frame-sharp relative group"
        >
          <img
            src={growContentCreatorsImg}
            alt="Grow Content Creators Podcast Viewership Translation"
            className="w-full object-cover max-h-[640px] transition-transform duration-[1500ms] group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bee-black/70 via-transparent to-transparent" />
        </motion.section>

        {/* Detailed Content Section */}
        <article className="prose prose-invert max-w-none mb-32">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">The Economic Reality of Global Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-slate-400 leading-relaxed text-lg">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Breaking the Language Barrier</h3>
              <p className="mb-6">
                For years, content creators were limited by the language they spoke. An English-speaking creator could only hope to reach the 1.5 billion English speakers worldwide. While that sounds like a lot, it's only about 20% of the global population.
              </p>
              <p>
                By localizing your content into just five additional languages—Hindi, Spanish, Portuguese, Russian, and Indonesian—you can unlock access to an additional <span className="text-white font-bold">2.5 billion potential viewers</span>. This isn't just about "more views"; it's about tapping into markets with rapidly growing middle classes and increasing digital ad spend.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">The "MrBeast" Effect</h3>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="mb-6 img-frame-sharp"
              >
                <img
                  src={mrBeastMultiplierImg}
                  alt="Mr Beast Translation Content Multiplier"
                  className="w-full h-auto"
                />
              </motion.div>
              <p className="mb-6">
                Jimmy Donaldson (MrBeast) proved that localization is the ultimate growth hack. By creating dedicated channels for different languages and using high-quality dubbing, he was able to replicate his success in entirely different cultural contexts.
              </p>
              <p>
                AiBhive brings this "Enterprise-level" strategy to every creator. Our Hive of agents doesn't just translate words; they adapt cultural references and ensure that the <span className="text-bee-amber font-bold">emotional impact</span> of your content remains consistent across borders. This leads to higher retention rates and better algorithmic performance in international markets.
              </p>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="glass-card p-10 rounded-3xl">
              <Target className="w-12 h-12 text-bee-amber mb-6" />
              <h4 className="text-white font-bold text-2xl mb-4">Hyper-Targeting</h4>
              <p className="text-slate-400">Identify which languages your specific niche is trending in and target those markets first for maximum ROI.</p>
            </div>
            <div className="glass-card p-10 rounded-3xl">
              <Globe className="w-12 h-12 text-bee-amber mb-6" />
              <h4 className="text-white font-bold text-2xl mb-4">Cultural Nuance</h4>
              <p className="text-slate-400">Our agents ensure that jokes, idioms, and metaphors are translated culturally, not just literally.</p>
            </div>
            <div className="glass-card p-10 rounded-3xl">
              <TrendingUp className="w-12 h-12 text-bee-amber mb-6" />
              <h4 className="text-white font-bold text-2xl mb-4">Revenue Multiplier</h4>
              <p className="text-slate-400">Localized content often sees a higher CPM in specific regions, diversifying your income streams.</p>
            </div>
          </div>
        </article>

        <section className="text-center">
          <h2 className="text-4xl font-bold text-white mb-10">Ready to Unlock Billions of Consumers?</h2>
          <Link 
            to="/get-started" 
            className="inline-flex items-center px-12 py-6 bg-bee-amber text-bee-black font-extrabold rounded-full hover:bg-bee-yellow transition-all neon-glow text-xl"
          >
            Translate Your Videos <ArrowRight className="ml-3 w-7 h-7" />
          </Link>
        </section>
      </div>
    </main>
  );
}

