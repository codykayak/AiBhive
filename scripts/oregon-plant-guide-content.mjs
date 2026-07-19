/** HTML bodies for Oregon Plant Medicine PDF guides (educational / legal / ID only). */

export const PSILOCYBIN_GUIDE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Oregon Psilocybin — Law, Safety &amp; Field Identification</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 7in; margin: 0 auto; padding: 0.6in; color: #111; line-height: 1.55; font-size: 11pt; }
  h1 { font-size: 22pt; border-bottom: 2px solid #166534; padding-bottom: 0.2em; color: #14532d; }
  h2 { font-size: 14pt; margin-top: 1.4em; color: #166534; page-break-after: avoid; }
  h3 { font-size: 12pt; margin-top: 1em; color: #334155; }
  .disclaimer { background: #fef3c7; border: 1px solid #d97706; padding: 12px 14px; margin: 1em 0; font-size: 10pt; }
  .legal { background: #fee2e2; border: 1px solid #dc2626; padding: 12px 14px; margin: 1em 0; font-size: 10pt; }
  ul, ol { margin: 0.4em 0 0.8em 1.2em; }
  li { margin-bottom: 0.35em; }
  table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 10pt; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #ecfdf5; }
  .footer { margin-top: 2em; font-size: 9pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 0.8em; }
  @media print { body { padding: 0.5in; } h2 { page-break-before: auto; } }
</style>
</head>
<body>

<h1>Oregon Psilocybin — Law, Safety &amp; Field Identification</h1>
<p><strong>Private educational reference · Eugene &amp; Florence, Oregon · AiBhive Oregon Plant Medicine</strong></p>

<div class="legal">
<strong>Not a cultivation manual.</strong> This document does <em>not</em> contain instructions for growing, propagating, or manufacturing psilocybin mushrooms. Home cultivation remains illegal under U.S. federal law and is not authorized by Oregon Measure 109 licensed service centers. Possession outside approved contexts may still carry criminal penalties.
</div>

<div class="disclaimer">
<strong>Educational use only.</strong> Wild mushroom misidentification kills. Never consume any mushroom unless a qualified expert confirms identity. Call Oregon Poison Center <strong>1-800-222-1222</strong> for exposures.
</div>

<h2>1. Oregon law in plain language</h2>
<p>Oregon voters passed <strong>Measure 109 (2020)</strong>, creating a regulated framework for <strong>psilocybin services</strong> at licensed facilities with trained facilitators. This is <em>not</em> a home-grow or wild-foraging permit.</p>
<ul>
  <li><strong>Licensed services (Measure 109):</strong> Adults 21+ may consume psilocybin at state-licensed centers after preparation sessions. Products are produced under OLCC oversight — not harvested from your local wood chips.</li>
  <li><strong>Measure 110 / decriminalization:</strong> Personal possession of small amounts of controlled substances was reclassified; this is <em>not</em> legalization of manufacture or distribution.</li>
  <li><strong>Federal law:</strong> Psilocybin remains Schedule I. Interstate activity, large quantities, and manufacturing (including cultivation) can trigger federal prosecution.</li>
  <li><strong>Wild foraging:</strong> Taking mushrooms from public or private land may violate park rules, trespass law, and drug statutes depending on quantity and intent.</li>
</ul>
<p>Official resource: <strong>Oregon Psilocybin Services (OLCC)</strong> — oregon.gov/olcc/psilocybin</p>

<h2>2. Wild Oregon species vs. “Golden Teacher” and indoor strains</h2>
<p>Online forums often discuss <em>Psilocybe cubensis</em> varieties such as <strong>Golden Teacher</strong>, <strong>B+</strong>, or “Penis Envy.” These are <strong>tropical/subtropical species</strong> associated with <em>indoor laboratory cultivation</em> — they are <strong>not</strong> native wild mushrooms of the Willamette Valley or Oregon coast.</p>
<p>In western Oregon you are far more likely to encounter <strong>wood-loving psilocybes</strong> on mulch and forest debris:</p>

<table>
  <tr><th>Species</th><th>Where near Eugene / Florence</th><th>Key ID features</th></tr>
  <tr>
    <td><em>Psilocybe cyanescens</em><br/>Wavy cap</td>
    <td>Wood-chip beds, landscaped areas, trail margins after fall rains</td>
    <td>Caramel cap with wavy edge; stem bruises blue; purple-brown spore print; on wood not pasture</td>
  </tr>
  <tr>
    <td><em>Psilocybe azurescens</em><br/>Flying saucer</td>
    <td>Coastal wood chips, dune edges — Florence north toward Astoria</td>
    <td>Large cap; potent; strong blue bruising; coastal specialty</td>
  </tr>
  <tr>
    <td><em>Psilocybe semilanceata</em><br/>Liberty cap</td>
    <td>Occasional in valley pastures in cool wet weather</td>
    <td>Tiny conical cap; grows from grass not logs</td>
  </tr>
</table>

<p><strong>Why “easiest strain” advice does not map to Oregon fields:</strong> Beginner-friendly cubensis strains refer to controlled indoor grows. Outdoor Oregon foraging requires expert mycology — different species, different habitats, deadly lookalikes.</p>

<h2>3. Deadly lookalikes — learn these first</h2>
<h3><em>Galerina marginata</em> (funeral bell)</h3>
<p>Grows on the <strong>same wood substrates</strong> as psilocybes. Contains amatoxins — same toxin class as death cap. Brown cap, brown spore print (not purple-brown), rust-brown gills. A spore print is mandatory for any wood-inhabiting gilled mushroom.</p>
<h3>Jack-o-lantern (<em>Omphalotus</em>)</h3>
<p>Orange clustered mushrooms on wood — not psilocybes but cause severe GI illness.</p>
<h3><em>Amanita</em> species</h3>
<p>Fly agaric and panther cap are psychoactive but not psilocybin-based; several amanitas are lethal. See companion library entries.</p>

<h2>4. Field identification workflow (safety)</h2>
<ol>
  <li><strong>Habitat first:</strong> Wood chips vs. pasture vs. dung — rules out many species immediately.</li>
  <li><strong>Spore print:</strong> Place cap on white and dark paper 4–12 hours. Psilocybes: purple-brown to blackish brown.</li>
  <li><strong>Bruising:</strong> Blue-green bruising on stem/cap suggests psilocybin chemistry — not definitive alone.</li>
  <li><strong>Microscopy / expert:</strong> Use Mushroom Observer, PSMS, or a mycological society before any consumption decision.</li>
  <li><strong>Document:</strong> Photograph cap, gills, stem base, and habitat — never rely on a single angle.</li>
</ol>

<h2>5. Seasonality — Eugene &amp; Florence</h2>
<ul>
  <li><strong>Valley (Eugene):</strong> Wood-chip psilocybes peak after first sustained fall rains (October–December). Frost ends most fruiting.</li>
  <li><strong>Coast (Florence):</strong> Milder temperatures extend season; <em>P. azurescens</em> often later into winter. Higher humidity — more slime molds and rot; ID harder.</li>
  <li><strong>Spring:</strong> Generally poor for wood-lovers; edible morels and oysters are different season entirely.</li>
</ul>

<h2>6. Harm reduction (if using licensed Oregon services)</h2>
<ul>
  <li>Complete preparation and integration sessions with licensed facilitators.</li>
  <li>Disclose medications (SSRIs, lithium, tramadol) — serious interactions possible.</li>
  <li>Do not combine with alcohol or cannabis without facilitator guidance.</li>
  <li>Arrange sober transport; no driving the day of a session.</li>
</ul>

<h2>7. Why cultivation guides are excluded from this library</h2>
<p>Sterile cultivation of psilocybin-containing fungi involves manufacturing a Schedule I substance under federal law. Oregon’s licensed model uses approved production facilities — not home “tek” guides. For legal access in Oregon, use the OLCC licensee directory. For wild specimens, prioritize <strong>identification education</strong> and mycological societies.</p>

<h2>8. Further reading (external)</h2>
<ul>
  <li>Oregon Psilocybin Services — OLCC</li>
  <li>Puget Sound Mycological Society (PNW-applicable ID resources)</li>
  <li>Mushroom Observer — community photos with GPS</li>
  <li>Paul Stamets, <em>Psilocybin Mushrooms of the World</em> (identification focus)</li>
</ul>

<div class="footer">
AiBhive Oregon Plant Medicine · Private educational PDF · Not medical or legal advice · Generated for regional reference (Eugene &amp; Florence, OR)
</div>
</body>
</html>`;

export const DMT_BOTANY_GUIDE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>PNW Entheogen Botany — DMT-Related Plants (Reference Only)</title>
<style>
  body { font-family: Georgia, serif; max-width: 7in; margin: 0 auto; padding: 0.6in; color: #111; line-height: 1.55; font-size: 11pt; }
  h1 { font-size: 22pt; border-bottom: 2px solid #5b21b6; padding-bottom: 0.2em; color: #4c1d95; }
  h2 { font-size: 14pt; margin-top: 1.4em; color: #5b21b6; }
  h3 { font-size: 12pt; margin-top: 1em; }
  .legal { background: #fee2e2; border: 1px solid #dc2626; padding: 12px 14px; margin: 1em 0; font-size: 10pt; }
  .disclaimer { background: #ede9fe; border: 1px solid #7c3aed; padding: 12px 14px; margin: 1em 0; font-size: 10pt; }
  ul { margin: 0.4em 0 0.8em 1.2em; }
  table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 10pt; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
  th { background: #f5f3ff; }
  .footer { margin-top: 2em; font-size: 9pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 0.8em; }
</style>
</head>
<body>

<h1>PNW Entheogen Botany — DMT-Related Plants (Reference Only)</h1>
<p><strong>Botanical &amp; legal reference · Oregon wetlands &amp; flora · No extraction chemistry</strong></p>

<div class="legal">
<strong>No extraction or concentration instructions.</strong> DMT (N,N-dimethyltryptamine) is a Schedule I controlled substance in the United States. Manufacturing, extracting, or concentrating DMT — including from local plants — is a serious federal crime. This document provides <em>botanical identification and legal context only</em>.
</div>

<div class="disclaimer">
<strong>Educational use only.</strong> Plant chemistry varies by population, season, and stress. Alkaloid content is unpredictable. Many extraction solvents and processes are toxic or explosive. Do not experiment.
</div>

<h2>1. What is DMT in a botanical context?</h2>
<p>DMT is a tryptamine alkaloid found in trace amounts in some plants and animals. It is not “active” in the plant in a simple edible form — traditional Amazonian ayahuasca combines plants containing DMT with MAO-inhibiting plants to allow oral activity. Chemistry, legality, and toxicity of any extraction are outside the scope of responsible regional field guides.</p>

<h2>2. Plants of interest in / near Oregon (botany only)</h2>

<h3>Reed canary grass — <em>Phalaris arundinacea</em></h3>
<p><strong>Habitat:</strong> Extremely common in Oregon wetlands, ditches, and riparian zones — Willamette Valley and coast. Aggressive perennial grass.</p>
<p><strong>Identification:</strong> Flat leaf blades; compact panicle seed head; often in monoculture stands in wet soil.</p>
<p><strong>Chemistry note:</strong> Some populations contain <em>variable</em> levels of DMT-related alkaloids and gramine (toxic to livestock). Content is unreliable and many plants are low or nil. <strong>Not suitable for any DIY use.</strong></p>

<h3>Acacias &amp; mimosas</h3>
<p>Popular in online extraction forums (<em>Mimosa hostilis</em>, <em>Acacia confusa</em>) — <strong>not native to Oregon</strong> and not wild-forageable locally. Nursery ornamentals may appear in southern Oregon but are not “local plants” for Eugene/Florence field work.</p>

<h3><em>Diplopterys cabrerana</em> / chacruna</h3>
<p>Amazonian ayahuasca admixtures — not found wild in Oregon.</p>

<table>
  <tr><th>Plant</th><th>In Oregon wild?</th><th>Notes</th></tr>
  <tr><td><em>Phalaris arundinacea</em></td><td>Yes — ubiquitous wetland grass</td><td>Variable alkaloids; toxic gramine; no practical field use</td></tr>
  <tr><td><em>Mimosa / Acacia</em> spp.</td><td>Not native; rare ornamental</td><td>Internet “tek” sources refer to imported bark</td></tr>
  <tr><td><em>Psychotria viridis</em> (chacruna)</td><td>No</td><td>Tropical</td></tr>
</table>

<h2>3. Why “local DMT extraction” guides are absent from reputable sources</h2>
<ul>
  <li><strong>Illegality:</strong> Extraction = manufacture of Schedule I substance.</li>
  <li><strong>Unreliable yield:</strong> Phalaris chemotypes differ; most standing biomass is not meaningfully psychoactive.</li>
  <li><strong>Toxic co-alkaloids:</strong> Gramine and related compounds harm livestock and humans.</li>
  <li><strong>Hazardous chemistry:</strong> Non-polar solvents, lye, and improper ventilation cause fires, burns, and poisonings.</li>
  <li><strong>Ethical / ecological:</strong> Wetland harvesting damages sensitive habitat.</li>
</ul>

<h2>4. Legal landscape (United States &amp; Oregon)</h2>
<p>DMT is Schedule I federally. Penalties for manufacture can exceed possession charges. Religious exemptions (e.g., certain ayahuasca church rulings) are narrow federal court exceptions — not a general right to extract local plants. Oregon has not legalized DMT parallel to Measure 109 psilocybin services.</p>

<h2>5. If you are researching academically</h2>
<ul>
  <li>Consult peer-reviewed phytochemistry literature via university libraries.</li>
  <li>Dr. Duke’s Phytochemical Database (USDA) for reported constituents — not extraction protocols.</li>
  <li>Oregon Flora Project for correct plant ID before any discussion of chemistry.</li>
</ul>

<h2>6. Poisoning &amp; emergencies</h2>
<p>Plant exposures, solvent inhalation, or unknown concentrates: <strong>Oregon Poison Center 1-800-222-1222</strong> · 911 for immediate danger.</p>

<div class="footer">
AiBhive Oregon Plant Medicine · Botanical reference only · No extraction procedures · Not medical or legal advice
</div>
</body>
</html>`;
