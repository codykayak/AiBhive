import { commonsImage } from './commonsImage';

type ExpandedFields = {
  imageUrl: string;
  imageCredit?: string;
  deepDive: string;
};

const W = {
  sun: commonsImage('Sun in the sky.jpg'),
  gut: commonsImage('Small intestine.jpg'),
  herbs: commonsImage('Medicinal Herbs.jpg'),
  yoga: commonsImage('Yoga practice.jpg'),
  cells: commonsImage('Mitochondria electron micrograph.jpg'),
  forest: commonsImage('Forest sunlight rays.jpg'),
  tea: commonsImage('Herbal tea.jpg'),
  microscope: commonsImage('Blood cells.jpg'),
};

export const AUTOIMMUNE_TOPIC_EXPANDED: Record<string, ExpandedFields> = {
  'autoimmune-terrain-overview': {
    imageUrl: W.microscope,
    imageCredit: 'Blood cells — Wikimedia Commons',
    deepDive: `Autoimmune disease is the quiet epidemic of the wealthy indoor world: over 80 named conditions where B cells, T cells, or antibodies mistake self for threat. Genetics load the gun; environment pulls the trigger — infections, gluten in celiac, UV in lupus, smoking in RA, maybe mold, stress, sleep loss, and micronutrient gaps in others.

Mainstream medicine excels at blocking inflammation (steroids, DMARDs, biologics, JAK inhibitors) and preventing organ damage. Integrative and “terrain” medicine asks why tolerance broke and whether removing triggers plus rebuilding mitochondria, gut barrier, and circadian rhythm can lower the dose of drugs needed — or achieve long remission in lucky subsets.

Neither camp owns the whole truth. Biologics saved millions from wheelchairs; lifestyle remission stories inspire but often omit survivorship bias. Your job as a patient-researcher: keep specialists, track labs, experiment safely one variable at a time, and ignore anyone selling certainty.`,
  },
  'hashimotos-thyroiditis': {
    imageUrl: W.sun,
    deepDive: `Hashimoto’s is the most common autoimmune disease in many countries — often decades of rising TPO antibodies before TSH climbs. Conventional care replaces hormone; integrative care asks whether selenium, gluten, vitamin D, gut healing, and circadian light can slow antibody production.

Selenium trials show modest TPO drops at 200 mcg/day in some populations. Strict gluten-free helps when celiac overlap or NCGS exists — not everyone. Iodine is double-edged: deficiency causes hypothyroidism, excess worsens Hashimoto’s in iodine-replete areas — kelp megadoses backfire.

Morning sunlight supports circadian cortisol rhythm that interacts with thyroid conversion (T4→T3). Stress and sleep deprivation raise reverse T3. None of this replaces levothyroxine when hypothyroid — but it may reduce the inflammatory noise around the gland.`,
  },
  'circadian-sunlight-jack-kruse': {
    imageUrl: W.sun,
    deepDive: `Jack Kruse — neurosurgeon turned circadian evangelist — argues that indoor life under blue LED and nnEMF starves mitochondria of the UV and infrared information they evolved with, collapsing immune regulation. Mainstream sleep medicine agrees on circadian disruption, melatonin suppression, and vitamin D deficiency; his stronger claims (5G as primary autoimmune driver, cold thermogenesis as cure-all) remain fringe.

Practical steals from Kruse without the dogma: get outdoor photons in the first hour after waking; avoid bright screens after sunset; align meals with daylight; measure vitamin D and ferritin; fix sleep apnea. For lupus and photosensitive conditions, get light through eyes with hat/shade on skin — balance with rheumatologist.

Compare Nordic and equatorial autoimmune epidemiology: latitude, vitamin D, diet, genetics all confound. Sun is not a panacea — it is a free signal most modern patients lack.`,
  },
  'emf-nnemf-reduction': {
    imageUrl: W.forest,
    deepDive: `Non-native EMF (nnEMF) — Wi‑Fi, cellular, Bluetooth, smart meters — sits at the center of integrative “environmental root cause” thinking and at the fringe of regulatory science. WHO reviews find no confirmed mechanism for “electromagnetic hypersensitivity,” yet sleep disruption from late-night phone use is real and raises inflammatory markers.

Jack Kruse and building biologists recommend wired ethernet, router outside bedroom, airplane mode overnight, and minimizing wearable transmitters. Some patients report symptom relief; others report obsessive anxiety that worsens flares. Pragmatic approach: cheap sleep hygiene first; shielding paint and Faraday canopies only if sleep measurably improves and budget allows.

Separate corporate 5G fear from measurable behavior: reducing nnEMF exposure is low-risk; replacing rheumatology with EMF detox is high-risk.`,
  },
  'mitochondria-bioenergetics': {
    imageUrl: W.cells,
    deepDive: `Fatigue in autoimmune disease is not “laziness” — it is often bioenergetic. Mitochondria in PBMCs show reduced membrane potential in lupus, RA, and MS studies. CoQ10, creatine, magnesium, B vitamins, and paced exercise support electron transport chain function.

Wahls Protocol emphasizes feeding mitochondria: colorful phytonutrients, omega-3, organ meats for B12/iron, removing sugar spikes that drive oxidative stress. Over-supplementing without exercise yields expensive urine; under-exercising from fear worsens deconditioning.

Post-exertional malaise (common in Long COVID overlap) requires heart-rate pacing — different from “push through.” Work with PT familiar with autonomic dysfunction.`,
  },
  'ibd-crohns-colitis': {
    imageUrl: W.gut,
    deepDive: `IBD is gut autoimmunity with knives — fistulas, strictures, colon cancer risk. Biologics (anti-TNF, anti-integrin, anti-IL-12/23, JAK) heal mucosa and change life expectancy. Integrative layers: SCD/AIP/carnivore trials, exclusive enteral nutrition, worm therapy research, fecal microbiota transplant in UC, boswellia and curcumin adjuncts.

German and Israeli research on helminths and FMT continues; DIY stool transplants killed patients — hospital trials only. Smoking cessation is non-negotiable in Crohn’s. Periodontal and gut dysbiosis feed inflammation.

If you explore diet, track fecal calprotectin — symptom relief without mucosal healing still risks colon cancer.`,
  },
  'aip-autoimmune-protocol': {
    imageUrl: W.tea,
    deepDive: `AIP is the strictest common autoimmune elimination diet — removing grains, dairy, legumes, nightshades, eggs, nuts, seeds, alcohol, and industrial additives for a month or more, then reintroducing one food at a time. Mechanism proposed: remove immunogenic proteins, heal gut, reduce LPS.

Evidence: small studies and thousands of anecdotes in Hashimoto’s, psoriasis, IBD. Risks: social isolation, orthorexia, nutrient gaps (calcium, iodine, fiber). Reintroduction phase is the actual test — staying eliminated forever misses tolerance rebuilding.

Work with registered dietitian; do not confuse AIP with carnivore — different risks.`,
  },
  'tcm-autoimmune-zheng': {
    imageUrl: W.herbs,
    deepDive: `Chinese hospitals run integrative wards where RA patients receive methotrexate plus acupuncture and individualized formulas — outcomes published in bilingual journals. TCM pattern diagnosis (Bi, Wei, Yin deficiency heat) maps poorly to Western labels but guides herb selection.

Classic caution: never import raw herbs without testing for pesticides and aristolochic acid; never combine unknown formulas with warfarin or cyclosporine. Licensed acupuncturists with herbal training coordinate with rheumatology in best-case scenarios.`,
  },
  'research-funding-gaps': {
    imageUrl: W.microscope,
    deepDive: `The “conspiracy” feeling in autoimmune communities is partly structural: no one profits from sunlight RCTs like they profit from $6,000/month biologics. NIH funds lifestyle research, but sample sizes are tiny compared to pharma trials. Integrative doctors document remission case series; skeptics demand RCTs no one will fund.

Healthy response: use biologics when indicated; add lifestyle where safe; advocate for research; reject both pharma absolutism and supplement snake oil. Terry Wahls’ funded pilot in MS is the model — small n, but published.`,
  },
};

export function applyAutoimmuneExpanded<T extends { id: string; summary: string }>(
  topics: T[],
): (T & ExpandedFields)[] {
  return topics.map((topic) => {
    const extra = AUTOIMMUNE_TOPIC_EXPANDED[topic.id];
    if (!extra) {
      return {
        ...topic,
        imageUrl: W.herbs,
        imageCredit: 'Wikimedia Commons',
        deepDive: topic.summary,
      };
    }
    return { ...topic, ...extra };
  });
}
