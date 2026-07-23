import type { HerbsCategory, HerbsTopic } from './herbsTypes';
import { applyHerbsExpanded } from './herbsExpanded';

const HERBS_LIBRARY_BASE = [
  {
    id: 'ashwagandha',
    title: 'Ashwagandha (Withania somnifera) — adaptogen overview',
    category: 'ayurvedic-far-east' as HerbsCategory,
    summary:
      'A cornerstone Rasayana in Ayurveda, traditionally used for stress resilience, sleep support, and vitality. Modern trials focus on cortisol, anxiety scores, and thyroid markers — quality and dose vary widely between products.',
    whenPeopleExplore:
      'Burnout, poor sleep, low morning energy, or interest after reading about “adaptogens” for stress without stimulants.',
    approaches: [
      'Standardized root extract (often withanolides) once or twice daily with food.',
      'Traditional churna (powder) in warm milk or ghee — lower concentration, slower titration.',
      'Cycled use (e.g. 8–12 weeks on, break) when using higher extracts — discuss with a clinician if on thyroid medication.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Avoid in pregnancy; may stimulate thyroid — monitor if on levothyroxine.',
      'Can cause drowsiness — caution with sedatives and before driving until you know your response.',
      'Nightshade family — rare sensitivity in some people.',
    ],
    sources: [
      { label: 'NIH ODS — Ashwagandha', url: 'https://ods.od.nih.gov/factsheets/Ashwagandha-HealthProfessional/' },
      { label: 'PubMed — Withania somnifera trials', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=withania+somnifera' },
    ],
  },
  {
    id: 'turmeric-curcumin',
    title: 'Turmeric & curcumin (Jiang Huang / Haridra)',
    category: 'ayurvedic-far-east' as HerbsCategory,
    summary:
      'Bright yellow rhizome used in Ayurveda and TCM for digestion, joint comfort, and liver support. Curcumin is poorly absorbed alone — formulations with piperine or lipids improve uptake.',
    whenPeopleExplore:
      'Joint stiffness, inflammatory diets, liver “spring cleanse” curiosity, or cooking with golden milk.',
    approaches: [
      'Culinary turmeric in fat-containing dishes (black pepper optional).',
      'Standardized curcumin with piperine or phytosome/lipid complexes for supplemental doses.',
      'Fresh root tea or tincture — bitter, warming, often combined with ginger.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'High doses may thin blood — stop before surgery; caution with anticoagulants.',
      'Gallbladder disease or bile duct obstruction — avoid high-dose curcumin without medical guidance.',
      'Can worsen reflux in sensitive individuals.',
    ],
    sources: [
      { label: 'NIH ODS — Turmeric', url: 'https://ods.od.nih.gov/factsheets/Turmeric-HealthProfessional/' },
    ],
  },
  {
    id: 'ginseng-panax',
    title: 'Ginseng — Panax (Ren Shen) & American (Xi Yang Shen)',
    category: 'chinese-tcm' as HerbsCategory,
    summary:
      'Panax ginseng is a prized Qi tonic in TCM — often for fatigue, recovery, and cognitive stamina. American ginseng (P. quinquefolius) is considered cooler and less stimulating. Species and preparation (white vs red) change the traditional indication.',
    whenPeopleExplore:
      'Afternoon crashes, convalescence after illness, exam season focus, or comparing Korean red ginseng to American.',
    approaches: [
      'Decoction slices simmered 45–90 minutes — classic TCM preparation.',
      'Standardized extract capsules — verify Panax species on label.',
      'American ginseng for heat signs, irritability, or night sweats in TCM pattern language.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'May raise blood pressure or cause insomnia in sensitive users — start low.',
      'Interacts with warfarin and some diabetes medications — pharmacist review advised.',
      'Not for acute infections with fever in classical TCM framing.',
    ],
    sources: [
      { label: 'NIH ODS — Asian Ginseng', url: 'https://ods.od.nih.gov/factsheets/AsianGinseng-HealthProfessional/' },
    ],
  },
  {
    id: 'astragalus-huang-qi',
    title: 'Astragalus (Huang Qi) — Wei Qi & immune tonic',
    category: 'chinese-tcm' as HerbsCategory,
    summary:
      'Huang Qi is among the most common TCM herbs for “building Qi” and supporting defensive energy (Wei Qi). Used in soups, decoctions, and formulas like Yu Ping Feng San for recurrent colds — distinct from acute echinacea-style use.',
    whenPeopleExplore:
      'Frequent minor illnesses, post-viral fatigue, or integrating TCM tonics after antibiotics.',
    approaches: [
      'Long-simmered root in bone broth or herbal soup — traditional kitchen medicine.',
      'Extract or granules in classic formulas — work with a TCM practitioner for pattern diagnosis.',
      'Often combined with dong quai, codonopsis, or licorice in composite blends.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Generally avoided during acute fever or active infection in classical TCM.',
      'Immunosuppressant medications — discuss with your physician before daily use.',
      'Quality matters — root should be sweet, fibrous, and pale yellow inside.',
    ],
    sources: [
      { label: 'American Botanical Council — Astragalus', url: 'https://www.herbalgram.org/' },
    ],
  },
  {
    id: 'dong-quai-dang-gui',
    title: 'Dong quai (Dang Gui) — women\'s tonic herb',
    category: 'chinese-tcm' as HerbsCategory,
    summary:
      'Angelica sinensis is a blood-nourishing herb in TCM, widely used for menstrual discomfort, cycle regulation, and menopausal support in formula context (not as a single-herb panacea). Often paired with peony, ligusticum, or rehmannia.',
    whenPeopleExplore:
      'Painful periods, irregular cycles, perimenopause, or interest after reading about “female ginseng.”',
    approaches: [
      'Classic formulas (e.g. Si Wu Tang variants) prescribed by licensed acupuncturists.',
      'Decoction or extract — rarely used as a solo herb in traditional practice.',
      'Topical dilutions in some folk liniments — patch test first.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'May increase photosensitivity — use sun protection.',
      'Avoid in pregnancy and with heavy menstrual bleeding without professional guidance.',
      'Anticoagulant and hormone therapies — interaction check required.',
    ],
    sources: [
      { label: 'NIH NCCIH — Dong Quai', url: 'https://www.nccih.nih.gov/health/dong-quai' },
    ],
  },
  {
    id: 'reishi-lingzhi',
    title: 'Reishi mushroom (Ling Zhi) — spirit & immunity',
    category: 'chinese-tcm' as HerbsCategory,
    summary:
      'Ganoderma lucidum is the “mushroom of immortality” in East Asian tradition — used for calm energy, sleep, and immune modulation. Bitter fruiting bodies are simmered for hours; modern extracts standardize beta-glucans and triterpenes.',
    whenPeopleExplore:
      'Stress insomnia, adjunct immune support, or pairing with other medicinal mushrooms.',
    approaches: [
      'Dual-extract tinctures or powdered capsules — check triterpene and beta-glucan labeling.',
      'Long decoction tea — bitter; often blended with chai spices or cocoa.',
      'Cross-link to wild turkey tail and PNW polypore species in the plant library.',
    ],
    relatedPlantIds: ['turkey-tail'],
    safetyWarnings: [
      'Generally well tolerated; rare GI upset or skin rash.',
      'Blood thinners and immunosuppressants — medical review advised.',
      'Not a replacement for cancer treatment — discuss adjunct use with oncology team.',
    ],
    sources: [
      { label: 'Memorial Sloan Kettering — Reishi', url: 'https://www.mskcc.org/cancer-care/integrative-medicine/herbs/reishi-mushroom' },
    ],
  },
  {
    id: 'schisandra-wu-wei-zi',
    title: 'Schisandra (Wu Wei Zi) — five-flavor berry',
    category: 'chinese-tcm' as HerbsCategory,
    summary:
      'Schisandra chinensis berries taste sour, sweet, bitter, pungent, and salty — hence “five flavor.” Used in TCM for cough, night sweats, and liver support; Russian adaptogen research explored endurance and mental performance.',
    whenPeopleExplore:
      'Liver detox curiosity, athletic recovery, or astringent tonics for night sweating.',
    approaches: [
      'Berry decoction or chew a few dried berries before meals — intensely sour.',
      'Standardized extract in adaptogen blends — often with rhodiola or eleuthero.',
      'Classic formula Sheng Mai San for Qi and Yin deficiency patterns.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'May stimulate GI motility — start with small doses.',
      'Pregnancy and gastroesophageal reflux — use cautiously.',
      'Can interact with medications metabolized by liver enzymes.',
    ],
    sources: [
      { label: 'PubMed — Schisandra chinensis', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=schisandra+chinensis' },
    ],
  },
  {
    id: 'goji-gou-qi-zi',
    title: 'Goji berry (Gou Qi Zi) — Yin & eye support',
    category: 'chinese-tcm' as HerbsCategory,
    summary:
      'Lycium barbarum fruit nourishes Liver and Kidney Yin in TCM — traditionally for dry eyes, dizziness, and low back weakness. Popular as a snack, tea, and smoothie ingredient; research examines zeaxanthin and polysaccharides.',
    whenPeopleExplore:
      'Screen fatigue, mild vision support, longevity diets, or adding to morning oatmeal.',
    approaches: [
      'Soaked berries in hot water or broth — do not overcook delicate antioxidants.',
      'Powder in smoothies — watch total sugar if using sweetened products.',
      'Combined with chrysanthemum flower tea for “computer eyes” in folk TCM pairings.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Warfarin interaction reported — monitor INR if on blood thinners.',
      'Allergy to nightshades (rare) — discontinue if rash or GI upset.',
      'Dried berries are calorie-dense — portion awareness for blood sugar.',
    ],
    sources: [
      { label: 'NIH NCCIH — Goji', url: 'https://www.nccih.nih.gov/health/goji' },
    ],
  },
  {
    id: 'licorice-gan-cao',
    title: 'Licorice root (Gan Cao) — harmonizer & caution',
    category: 'chinese-tcm' as HerbsCategory,
    summary:
      'Glycyrrhiza glabra is in more TCM formulas than any other herb — it “harmonizes” blends and sweetens decoctions. Also a Western demulcent for sore throat. Glycyrrhizin can raise blood pressure and lower potassium with chronic high doses.',
    whenPeopleExplore:
      'Sore throat teas, adrenal fatigue protocols, or understanding why TCM formulas taste sweet.',
    approaches: [
      'Short-term demulcent tea for throat — deglycyrrhizinated (DGL) for longer GI use.',
      'Only in balanced formulas for daily TCM use — not candy licorice.',
      'Monitor blood pressure if using whole root extracts beyond two weeks.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Hypertension, heart failure, kidney disease — avoid high-glycyrrhizin products.',
      'Potassium depletion with diuretics or digoxin — dangerous combination.',
      'Pregnancy — avoid except under direct professional supervision.',
    ],
    sources: [
      { label: 'NIH NCCIH — Licorice Root', url: 'https://www.nccih.nih.gov/health/licorice-root' },
    ],
  },
  {
    id: 'holy-basil-tulsi',
    title: 'Holy basil / Tulsi (Ocimum tenuiflorum)',
    category: 'ayurvedic-far-east' as HerbsCategory,
    summary:
      'Sacred in Ayurveda as an adaptogen for stress, respiratory comfort, and metabolic balance. Distinct from culinary basil — peppery, clove-like aroma. Studies explore cortisol, blood sugar, and anxiety.',
    whenPeopleExplore:
      'Daily stress tea ritual, blood sugar support alongside diet, or caffeine replacement.',
    approaches: [
      'Fresh or dried leaf tea — steep covered 5–10 minutes.',
      'Tincture or standardized extract for consistent dosing.',
      'Garden cultivation in warm summers — pinch flowers for leaf harvest.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'May lower blood sugar — monitor if on diabetes medications.',
      'Avoid in pregnancy at medicinal doses.',
      'Surgery — stop two weeks before due to possible blood sugar effects.',
    ],
    sources: [
      { label: 'PubMed — Ocimum sanctum', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=ocimum+sanctum' },
    ],
  },
  {
    id: 'triphala',
    title: 'Triphala — three-fruit Ayurvedic formula',
    category: 'ayurvedic-far-east' as HerbsCategory,
    summary:
      'Equal parts Amalaki, Bibhitaki, and Haritaki — one of Ayurveda’s most used formulas for gentle bowel regulation, antioxidant support, and Rasayana (rejuvenation). Taste is sour, astringent, and bitter.',
    whenPeopleExplore:
      'Constipation, gentle detox, or eye and skin support in traditional texts.',
    approaches: [
      '½ teaspoon powder in warm water at bedtime — adjust to bowel response.',
      'Tablets for travel — take with plenty of water.',
      'Not a harsh laxative — works gradually over days for many people.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Diarrhea if overdosed — reduce dose.',
      'Diabetes medications — may affect blood sugar; monitor.',
      'Pregnancy and acute diarrhea — avoid.',
    ],
    sources: [
      { label: 'NIH NCCIH — Triphala', url: 'https://www.nccih.nih.gov/health/triphala' },
    ],
  },
  {
    id: 'bacopa-brahmi',
    title: 'Bacopa (Brahmi) — memory & calm focus',
    category: 'ayurvedic-far-east' as HerbsCategory,
    summary:
      'Bacopa monnieri is Medhya Rasayana in Ayurveda — traditionally for memory, learning, and anxiety. Modern RCTs examine cognitive performance over 8–12 weeks; effects are modest and not instant.',
    whenPeopleExplore:
      'Study support, age-related memory curiosity, or ADHD-adjacent focus without stimulants.',
    approaches: [
      'Standardized bacoside extract with fat-containing meal — lipids aid absorption.',
      'Traditional ghrita (medicated ghee) preparations in Ayurvedic clinics.',
      'Allow 8–12 weeks before judging cognitive outcomes.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'GI upset and fatigue possible — take with food.',
      'Thyroid hormones — theoretical interaction; discuss with prescriber.',
      'Not a substitute for evaluation of cognitive decline.',
    ],
    sources: [
      { label: 'PubMed — Bacopa monnieri cognition', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=bacopa+monnieri+cognition' },
    ],
  },
  {
    id: 'milk-thistle',
    title: 'Milk thistle (Silybum marianum) — liver ally',
    category: 'western-herbalism' as HerbsCategory,
    summary:
      'Silymarin from milk thistle seed is among the most studied Western herbs for liver cell protection — fatty liver, toxin exposure, and adjunct support during some medications. Bitter seeds are often taken as extract.',
    whenPeopleExplore:
      'Post-holiday liver support, NAFLD education, or protecting liver during known hepatotoxic drugs.',
    approaches: [
      'Standardized silymarin extract 140–420 mg/day divided — often 70–80% silymarin content.',
      'Ground seed in capsules — less standardized but traditional.',
      'Combine with diet change — herb does not override alcohol or metabolic syndrome.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Allergy to aster family (ragweed, daisy) — possible cross-reaction.',
      'May affect metabolism of some drugs via liver enzymes — pharmacist check.',
      'Not a treatment for hepatitis or cirrhosis without medical care.',
    ],
    sources: [
      { label: 'NIH NCCIH — Milk Thistle', url: 'https://www.nccih.nih.gov/health/milk-thistle' },
    ],
  },
  {
    id: 'valerian-sleep',
    title: 'Valerian root — sleep & nervous system',
    category: 'western-herbalism' as HerbsCategory,
    summary:
      'Valeriana officinalis root smells earthy and polarizing — used since ancient Greece for insomnia and anxiety. Meta-analyses suggest modest benefit for sleep latency; quality varies. Often combined with hops or passionflower.',
    whenPeopleExplore:
      'Trouble falling asleep, muscle tension, or avoiding prescription sedatives.',
    approaches: [
      '300–600 mg standardized extract 30–60 minutes before bed.',
      'Tea from dried root — cover while steeping to trap volatile oils.',
      'Trial 2–4 weeks; not for acute panic — different mechanism than benzodiazepines.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Morning grogginess — reduce dose.',
      'Additive with alcohol, benzodiazepines, and other sedatives — dangerous.',
      'Rare vivid dreams or headache.',
    ],
    sources: [
      { label: 'NIH NCCIH — Valerian', url: 'https://www.nccih.nih.gov/health/valerian' },
    ],
  },
  {
    id: 'echinacea-immune',
    title: 'Echinacea — acute immune support',
    category: 'western-herbalism' as HerbsCategory,
    summary:
      'Purple coneflower root and aerial parts are classic North American immune herbs — best evidence for shortening cold duration when started at first symptoms, not for daily prevention in all studies.',
    whenPeopleExplore:
      'First tickle in the throat, travel season, or comparing angustifolia vs purpurea products.',
    approaches: [
      'Tincture or tea at onset — frequent small doses first 24–48 hours in traditional use.',
      'Standardized alkamide or polysaccharide extracts per label.',
      'Avoid continuous year-round use — traditional pulsed at illness onset.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Aster allergy — avoid.',
      'Autoimmune conditions — discuss with rheumatologist before immune-stimulating herbs.',
      'Not for progressive serious infection — seek medical care for high fever or shortness of breath.',
    ],
    sources: [
      { label: 'NIH NCCIH — Echinacea', url: 'https://www.nccih.nih.gov/health/echinacea' },
    ],
  },
  {
    id: 'st-johns-wort',
    title: 'St. John\'s wort — mood herb & interaction risk',
    category: 'western-herbalism' as HerbsCategory,
    summary:
      'Hypericum perforatum has RCT support for mild-to-moderate depression in some meta-analyses — but it is a potent CYP3A4 inducer that can invalidate birth control, transplant drugs, and SSRIs. Sun-sensitive; blooms around summer solstice.',
    whenPeopleExplore:
      'Seasonal low mood, wanting a “natural antidepressant,” or harvesting yellow-flowered roadside herbs (ID carefully).',
    approaches: [
      'Standardized 0.3% hypericin or hyperforin extract — consistent dosing matters.',
      'Allow 4–6 weeks for mood trials; track with a mood scale.',
      'Pharmacist medication review mandatory before starting.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Major drug interactions — contraceptives, warfarin, HIV meds, immunosuppressants, many SSRIs.',
      'Serotonin syndrome risk if combined with antidepressants without supervision.',
      'Photosensitivity — sunscreen and hat in bright sun.',
    ],
    sources: [
      { label: 'NIH NCCIH — St. John\'s Wort', url: 'https://www.nccih.nih.gov/health/st-johns-wort' },
    ],
  },
  {
    id: 'devils-club-pnw',
    title: 'Devil\'s club (Oplopanax horridus) — PNW sacred medicine',
    category: 'pacific-northwest' as HerbsCategory,
    summary:
      'Spiny understory shrub of coastal rainforests — spiritually significant to many Indigenous nations and used by Pacific Northwest herbalists for blood sugar, joint pain, and ritual protection. Inner bark is bitter and potent.',
    whenPeopleExplore:
      'Regional materia medica, diabetes support discussions, or ethical wildcrafting on private/traditional lands.',
    approaches: [
      'Small amounts of inner bark tincture — extremely bitter; low dose.',
      'Respect harvest ethics — never strip ring-bark; seek permission on tribal lands.',
      'Often taught alongside Oregon grape and cascara in PNW herbal courses.',
    ],
    relatedPlantIds: ['devils-club'],
    safetyWarnings: [
      'Spines cause painful wounds — leather gloves for harvest.',
      'Blood sugar medications — additive hypoglycemia risk.',
      'Cultural sensitivity — not a commodity herb; learn provenance and permission.',
    ],
    sources: [
      { label: 'USDA PLANTS — Oplopanax horridus', url: 'https://plants.usda.gov/home/plantProfile?symbol=OPHO' },
    ],
  },
  {
    id: 'oregon-grape-root',
    title: 'Oregon grape root (Mahonia aquifolium) — berberine ally',
    category: 'pacific-northwest' as HerbsCategory,
    summary:
      'State flower of Oregon — yellow roots contain berberine, shared with goldenseal. Used for skin conditions (psoriasis creams studied), digestive bitters, and antimicrobial support. Berry is tart edible; root is the medicine.',
    whenPeopleExplore:
      'Local substitute for endangered goldenseal, skin protocols, or spring bitter tonics.',
    approaches: [
      'Root tincture as digestive bitter before meals — small doses.',
      'Topical creams for mild psoriasis — follow product trials data.',
      'Sustainable root harvest from abundant patches only — prefer cultivated sources.',
    ],
    relatedPlantIds: ['oregon-grape'],
    safetyWarnings: [
      'Pregnancy and breastfeeding — avoid berberine-containing roots.',
      'May interact with cyclosporine and some metabolic drugs.',
      'Do not confuse with invasive English holly.',
    ],
    sources: [
      { label: 'Memorial Sloan Ketterer — Oregon Grape', url: 'https://www.mskcc.org/cancer-care/integrative-medicine/herbs/oregon-grape' },
    ],
  },
  {
    id: 'ginger-sheng-jiang',
    title: 'Ginger (Sheng Jiang / Gan Jiang) — warming digestive',
    category: 'chinese-tcm' as HerbsCategory,
    summary:
      'Fresh ginger (Sheng Jiang) disperses cold and stops nausea in TCM; dried ginger (Gan Jiang) is hotter and more interior-warming. Universal kitchen medicine — motion sickness, morning sickness (with OB approval), and circulation.',
    whenPeopleExplore:
      'Nausea, cold hands, menstrual cramps, or cold-season immunity soups.',
    approaches: [
      'Fresh juice or tea for acute nausea — sip small amounts.',
      'Candied ginger for travel — watch sugar.',
      'Dried ginger in baked goods and decoctions for “internal cold” patterns.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Gallstones and bleeding disorders — high doses may increase bleeding risk.',
      'Blood thinners — moderate culinary amounts usually fine; confirm with clinician.',
      'Heartburn in some people — reduce dose or use with food.',
    ],
    sources: [
      { label: 'NIH NCCIH — Ginger', url: 'https://www.nccih.nih.gov/health/ginger' },
    ],
  },
  {
    id: 'herbal-teas-decoctions',
    title: 'Teas, infusions & decoctions — preparation basics',
    category: 'preparation-safety' as HerbsCategory,
    summary:
      'How you prepare herbs changes potency: delicate flowers and leaves need short infusions; roots, bark, and mushrooms need simmering decoctions. Volume, time, and water chemistry (hard vs soft) all matter.',
    whenPeopleExplore:
      'First home apothecary setup, making tonics from bulk herbs, or why your tea “does nothing.”',
    approaches: [
      'Infusion: pour boiling water over leaf/flower; steep 10–20 min covered.',
      'Decoction: simmer roots/bark 20–45 min; start with cold water.',
      'Maceration/tincture: alcohol or glycerin extracts for shelf-stable dosing.',
    ],
    relatedPlantIds: ['stinging-nettle', 'wild-mint'],
    safetyWarnings: [
      'Identify plants 100% before wildcrafting — toxic look-alikes exist.',
      'Storage: mold in wet plant material — dry thoroughly.',
      'Children and pregnancy — many herbs are not kid-safe at adult doses.',
    ],
    sources: [
      { label: 'American Herbalists Guild — finding a practitioner', url: 'https://www.americanherbalistsguild.com/' },
    ],
  },
];

export const HERBS_LIBRARY = applyHerbsExpanded(HERBS_LIBRARY_BASE);

export const HERBS_CATEGORY_ORDER: HerbsCategory[] = [
  'western-herbalism',
  'chinese-tcm',
  'ayurvedic-far-east',
  'pacific-northwest',
  'preparation-safety',
];

export function matchesHerbsCategory(topic: HerbsTopic, category: HerbsCategory | 'all'): boolean {
  if (category === 'all') return true;
  return topic.category === category;
}
