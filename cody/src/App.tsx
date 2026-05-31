/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import {
  Terminal,
  Cpu,
  Construction,
  Home,
  Award,
  MapPin,
  Mail,
  Phone,
  Globe,
  ArrowRight,
  ShieldCheck,
  Zap,
  Wrench,
  History,
  GraduationCap
} from "lucide-react";
import { useEffect } from "react";
import codyImage from "./cody_m_sims.png";

// --- SEO & Schema Markup ---
const SEO = () => {
  useEffect(() => {
    const title = "Cody M Sims | AI Systems Architect & Technical Leader";
    const description = "Portfolio of Cody M Sims. Specializing in AI agentic flows, RAGs, and multi-industry technical leadership in Real Estate and Construction.";

    document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Set canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', 'https://www.aibhive.com/cody');

    // JSON-LD Schema
    const schema = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Cody M Sims",
      "jobTitle": "AI Systems Architect",
      "url": "https://www.aibhive.com/cody",
      "sameAs": [
        "https://www.aibhive.com"
      ],
      "alumniOf": {
        "@type": "CollegeOrUniversity",
        "name": "Portland Community College"
      },
      "knowsAbout": ["AI Agentic flows", "RAGs", "Real Estate", "Construction Management"]
    };

    const script = document.createElement('script');
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
};

// --- Components ---

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-12">
    <div className="flex items-center gap-4 mb-2">
      <div className="h-[1px] w-12 bg-gold/50" />
      <h2 className="font-serif text-3xl md:text-4xl text-gold uppercase tracking-widest">{title}</h2>
    </div>
    {subtitle && <p className="font-mono text-xs text-teal-accent/70 uppercase tracking-tighter ml-16">{subtitle}</p>}
  </div>
);

const SkillBadge = ({ name, icon: Icon }: { name: string; icon: any }) => (
  <motion.div
    whileHover={{ y: -5, borderColor: "var(--color-gold)" }}
    className="flex items-center gap-3 px-4 py-3 border border-white/10 bg-white/5 rounded-lg transition-colors group"
  >
    <Icon className="w-5 h-5 text-teal-accent group-hover:text-gold transition-colors" />
    <span className="font-mono text-sm tracking-tight">{name}</span>
  </motion.div>
);

const ExperienceCard = ({ company, period, role, description }: any) => (
  <article className="relative pl-8 pb-12 border-l border-white/10 last:pb-0">
    <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] bg-gold rounded-full glow-gold" />
    <div className="mb-1">
      <span className="font-mono text-[10px] text-teal-accent uppercase tracking-[0.2em]">{period}</span>
    </div>
    <h3 className="font-serif text-xl text-white mb-1">{role}</h3>
    <div className="font-sans text-sm text-gold/80 mb-3">{company}</div>
    <p className="text-white/60 text-sm leading-relaxed max-w-2xl">{description}</p>
  </article>
);

export default function App() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-gold/30 selection:text-gold pb-20 relative">
      <div className="noise" />
      <SEO />

      {/* Background Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(var(--color-gold) 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }} />
      </div>

      <header className="container mx-auto px-6 py-8 flex justify-between items-center bg-black/60 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
        <div className="font-serif text-2xl tracking-[0.3em] text-gold">AIBHIVE</div>
        <nav className="hidden md:flex gap-8 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
          <a href="#about" className="hover:text-gold transition-colors">// 01 About</a>
          <a href="#experience" className="hover:text-gold transition-colors">// 02 Logic</a>
          <a href="#skills" className="hover:text-gold transition-colors">// 03 Tools</a>
          <a href="#contact" className="hover:text-gold transition-colors">// 04 Signal</a>
        </nav>
      </header>

      <main className="container mx-auto px-6 pt-20">
        {/* Hero Section */}
        <section id="hero" className="min-h-[80vh] flex flex-col md:flex-row items-center gap-16 mb-40">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 order-2 md:order-1"
          >
            <div className="mb-6">
              <span className="font-mono text-xs text-teal-accent uppercase tracking-[0.4em] mb-4 block">System.init(Cody_M_Sims)</span>
              <h1 className="font-serif text-6xl md:text-8xl text-white leading-none mb-4">
                CODY <span className="text-gold">M</span> <br /> SIMS
              </h1>
              <p className="font-mono text-sm text-white/40 italic max-w-md border-l-2 border-gold/30 pl-4 py-2">
                "Mixed but overlapping background in Real Estate, construction and technical undertakings."
              </p>
            </div>

            <div className="flex gap-4 items-center pt-8">
              <a href="#contact" className="px-8 py-4 bg-gold text-black font-sans font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors flex items-center gap-2">
                Init Contact <ArrowRight className="w-4 h-4" />
              </a>
              <div className="h-[1px] w-20 bg-white/20" />
              <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Architect of Intelligence</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1 }}
            className="relative w-72 h-72 md:w-96 md:h-96 order-1 md:order-2"
          >
            <div className="absolute inset-0 border border-gold/20 translate-x-4 translate-y-4" />
            <div className="absolute inset-0 border border-teal-accent/20 -translate-x-4 -translate-y-4" />
            <div className="relative w-full h-full grayscale hover:grayscale-0 transition-all duration-700 overflow-hidden bg-white/5 border border-white/10 group">
              <img
                src={codyImage}
                alt="Cody M Sims - AI Systems Architect"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%]" />

              <div className="absolute top-4 right-4 flex flex-col items-end">
                <div className="font-mono text-[8px] text-teal-accent/50 tracking-widest uppercase mb-1">Core_V_1.0</div>
                <div className="h-[1px] w-12 bg-teal-accent/30" />
              </div>

              <div className="absolute bottom-4 left-4 font-mono text-[8px] text-gold/50 tracking-widest uppercase">
                INDEX: CMS_541_321_2630
              </div>
            </div>
          </motion.div>
        </section>

        {/* About Section */}
        <section id="about" className="mb-40 max-w-4xl">
          <SectionTitle title="The Profile" subtitle="Core Processor & Origin" />
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <p className="text-xl font-serif italic text-white/80 leading-relaxed">
                Looking for a great company. I'm a reliable team leader who learns quickly and solves problems quickly.
              </p>
              <div className="h-[1px] w-full bg-gradient-to-r from-gold/50 to-transparent" />
            </div>
            <div className="font-sans text-white/60 space-y-4 leading-relaxed">
              <p>
                My background is built on a multidisciplinary foundation where Real Estate, complex construction, and advanced technical systems converge. I specialize in tripling productivity while fostering positive environments for high-performance teams.
              </p>
              <p>
                Currently, I am architecting AI systems that bridge the gap between ancient wisdom and modern precision, focusing on semantic accuracy in legal, medical, and historical contexts.
              </p>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section id="skills" className="mb-40">
          <SectionTitle title="The Toolkit" subtitle="Technical & Structural Modules" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="font-mono text-xs text-gold uppercase tracking-widest mb-6 border-b border-gold/20 pb-2">// AI & Systems</h3>
              <div className="grid gap-3">
                <SkillBadge name="AI Agentic Flows" icon={Zap} />
                <SkillBadge name="RAG Architectures" icon={Cpu} />
                <SkillBadge name="LANG / Semantics" icon={Terminal} />
                <SkillBadge name="Web Development" icon={Globe} />
              </div>
            </div>
            <div>
              <h3 className="font-mono text-xs text-gold uppercase tracking-widest mb-6 border-b border-gold/20 pb-2">// Real Estate & Asset</h3>
              <div className="grid gap-3">
                <SkillBadge name="Property Acquisitions" icon={Home} />
                <SkillBadge name="Real Estate / Mortgage" icon={ShieldCheck} />
                <SkillBadge name="Rehabs / Flips / General" icon={History} />
              </div>
            </div>
            <div>
              <h3 className="font-mono text-xs text-gold uppercase tracking-widest mb-6 border-b border-gold/20 pb-2">// Technical Craft</h3>
              <div className="grid gap-3">
                <SkillBadge name="Maintenance (Plumb/Elec)" icon={Wrench} />
                <SkillBadge name="Finished Carpentry" icon={Construction} />
                <SkillBadge name="Industrial Logistics" icon={Award} />
              </div>
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section id="experience" className="mb-40">
          <SectionTitle title="The Sequence" subtitle="Operational Timeline" />
          <div className="max-w-3xl">
            <ExperienceCard
              company="AiBhive"
              period="2025 - PRESENT"
              role="AI Systems Architect"
              description="Building and designing translation applications focusing on Ancient texts, Legal and Medical records where high accuracy interpretation and semantics are critical. Ensuring technical fidelity in high-stakes environments."
            />
            <ExperienceCard
              company="CHS Nutrition INC"
              period="2023 - 2025"
              role="Nutritionalist Supervisor"
              description="Led animal nutritionalist and feed production teams. Managed small production units and implemented rigorous quality and contamination testing protocols."
            />
            <ExperienceCard
              company="SouthEstestren Fire Protection"
              period="2020 - 2022"
              role="Fire Inspector"
              description="Conducted fire suppression and safety inspections and certifications in supervisor capacity. Inspected complex HVAC units for enterprise clients including Walmart (Florida region)."
            />
            <ExperienceCard
              company="Spies Real Estate Group"
              period="2016 - 2019"
              role="Property Acquisitions"
              description="Managed rehab for 100+ properties. Executed acquisitions of approximately 60 properties with full cost assessment and market analysis responsibilities."
            />
          </div>
        </section>

        {/* Education Section */}
        <section id="education" className="mb-40 grid md:grid-cols-2 gap-12">
          <div>
            <SectionTitle title="The Registry" subtitle="Academic Modules" />
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="p-3 bg-white/5 border border-white/10 h-fit rounded">
                  <GraduationCap className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h4 className="font-serif text-lg">AAS - Web Development</h4>
                  <p className="font-mono text-xs text-teal-accent">2009 - 2011</p>
                  <p className="text-white/40 text-sm">Portland Community College</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-3 bg-white/5 border border-white/10 h-fit rounded">
                  <History className="w-6 h-6 text-teal-accent" />
                </div>
                <div>
                  <h4 className="font-serif text-lg">GED / General Studies</h4>
                  <p className="font-mono text-xs text-teal-accent">2007</p>
                  <p className="text-white/40 text-sm">Blue Mountain Community</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-lg flex flex-col justify-center">
            <h3 className="font-mono text-[10px] text-gold uppercase tracking-[0.3em] mb-4">// Certifications</h3>
            <ul className="space-y-3 font-serif italic text-white/80">
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-teal-accent rounded-full" />
                CPR Certified (Active)
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-teal-accent rounded-full" />
                Forklift Certification (2023-2025)
              </li>
              <li className="flex items-center gap-3 text-white/40">
                <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                OSHA Standards Compliance
              </li>
            </ul>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="mb-20">
          <div className="bg-black border border-gold/30 p-12 md:p-20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-accent/5 blur-[120px] rounded-full" />

            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <SectionTitle title="The Interface" />
              <p className="text-white/60 mb-12 font-serif text-lg italic">
                Currently available for strategic inquiries and technical leadership opportunities. Reach out via the channels below.
              </p>

              <div className="grid md:grid-cols-2 gap-8 text-left">
                <a href="mailto:CodyKayak@gmail.com" className="flex items-center gap-4 group/item">
                  <div className="p-4 border border-white/10 group-hover/item:border-gold transition-colors">
                    <Mail className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-white/40">Email</span>
                    <span className="font-sans text-sm">CodyKayak@gmail.com</span>
                  </div>
                </a>
                <div className="flex items-center gap-4 group/item">
                  <div className="p-4 border border-white/10 group-hover/item:border-teal-accent transition-colors">
                    <Phone className="w-6 h-6 text-teal-accent" />
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-white/40">Phone</span>
                    <span className="font-sans text-sm">(541) 321-2630</span>
                  </div>
                </div>
                <a href="https://www.AiBhive.com/Cody" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group/item">
                  <div className="p-4 border border-white/10 group-hover/item:border-gold transition-colors">
                    <Globe className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-white/40">Network</span>
                    <span className="font-sans text-sm">www.AiBhive.com/Cody</span>
                  </div>
                </a>
                <div className="flex items-center gap-4 group/item">
                  <div className="p-4 border border-white/10 group-hover/item:border-teal-accent transition-colors">
                    <MapPin className="w-6 h-6 text-teal-accent" />
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] uppercase text-white/40">Presence</span>
                    <span className="font-sans text-sm">Remote / Tactical</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-6 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 font-mono text-[9px] uppercase tracking-widest text-white/20">
        <div>© 2026 CODY M SIMS // ALL RIGHTS RESERVED</div>
        <div className="flex gap-8">
          <span>LAT: 45.523062</span>
          <span>LONG: -122.676482</span>
          <span>AIBHIVE_SYSTEM_ID: CMS-001</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-teal-accent rounded-full animate-pulse" />
          SYSTEM STATUS: OPTIMAL
        </div>
      </footer>
    </div>
  );
}
