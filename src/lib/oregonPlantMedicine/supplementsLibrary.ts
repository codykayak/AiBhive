import type { SupplementsCategory, SupplementsTopic } from './supplementsTypes';
import { applySupplementsExpanded } from './supplementsExpanded';

const SUPPLEMENTS_LIBRARY_BASE = [
  {
    id: 'vitamin-d3',
    title: 'Vitamin D3 — sunshine hormone & bone health',
    category: 'vitamins' as SupplementsCategory,
    summary:
      'Cholecalciferol supports calcium absorption, immune function, and mood. Deficiency is common at northern latitudes (including the Pacific Northwest). Blood 25(OH)D testing guides dosing — more is not always better.',
    whenPeopleExplore:
      'Winter fatigue, bone density concerns, autoimmune discussions, or post-bloodwork “low D” results.',
    approaches: [
      'D3 (not D2) with fat-containing meal — typical maintenance 1,000–2,000 IU/day after repletion.',
      'Loading doses only under medical supervision when severely deficient.',
      'Pair with vitamin K2 (MK-7) in some protocols — discuss if on anticoagulants.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Hypercalcemia risk at very high doses — test levels periodically.',
      'Granulomatous diseases (sarcoidosis) — vitamin D sensitivity.',
      'Thiazide diuretics plus high D — monitor calcium.',
    ],
    sources: [
      { label: 'NIH ODS — Vitamin D', url: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/' },
    ],
  },
  {
    id: 'vitamin-b12',
    title: 'Vitamin B12 — nerves, energy & methylation',
    category: 'vitamins' as SupplementsCategory,
    summary:
      'Cobalamin is essential for red blood cells, myelin, and homocysteine metabolism. Vegans, older adults with low stomach acid, and people on metformin or PPIs often need supplementation. Methylcobalamin vs cyanocobalamin debates continue.',
    whenPeopleExplore:
      'Plant-based diet, tingling fingers, macrocytic anemia, or high homocysteine on labs.',
    approaches: [
      'Oral 500–1,000 mcg daily often corrects deficiency without injections.',
      'Sublingual forms for absorption debates — evidence mixed vs swallowing.',
      'Test B12 and methylmalonic acid — folate alone can mask B12 deficiency.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Acne flare in some people with high doses.',
      'Potassium shift during correction of severe anemia — medical supervision.',
      'Cyanocobalamin is stable; rare allergy to cobalt.',
    ],
    sources: [
      { label: 'NIH ODS — Vitamin B12', url: 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/' },
    ],
  },
  {
    id: 'vitamin-c',
    title: 'Vitamin C — antioxidant & collagen cofactor',
    category: 'vitamins' as SupplementsCategory,
    summary:
      'Ascorbic acid supports collagen synthesis, iron absorption, and immune cell function. Megadose cold prevention is overstated; deficiency (scurvy) is rare but marginal intake happens with poor diets.',
    whenPeopleExplore:
      'Iron deficiency alongside iron pills, wound healing, or liposomal C trends.',
    approaches: [
      '200–500 mg divided doses often saturate tissue without GI upset.',
      'Take with plant-based iron meals to enhance absorption.',
      'Buffered (mineral ascorbate) if plain ascorbic acid causes diarrhea.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'High doses may cause diarrhea and kidney stone risk in susceptible people.',
      'G6PD deficiency — high IV C is contraindicated (medical setting).',
      'False negatives on some stool occult blood tests.',
    ],
    sources: [
      { label: 'NIH ODS — Vitamin C', url: 'https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/' },
    ],
  },
  {
    id: 'magnesium-forms',
    title: 'Magnesium — forms matter (glycinate, citrate, threonate)',
    category: 'minerals' as SupplementsCategory,
    summary:
      'Magnesium participates in 300+ enzymatic reactions — sleep, muscle relaxation, blood pressure, and insulin sensitivity. Oxide is cheap but laxative; glycinate and malate are popular for sleep and muscles; citrate for constipation.',
    whenPeopleExplore:
      'Leg cramps, insomnia, migraines, or “calming” mineral stacks.',
    approaches: [
      '200–400 mg elemental magnesium from labeled form — count elemental, not total salt weight.',
      'Glycinate or bisglycinate evening for sleep; citrate if bowels are sluggish.',
      'Test RBC magnesium if clinically indicated — serum Mg is poor marker.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Kidney failure — hypermagnesemia risk; medical guidance only.',
      'Additive with laxatives and magnesium-containing antacids.',
      'May lower blood pressure — monitor with antihypertensives.',
    ],
    sources: [
      { label: 'NIH ODS — Magnesium', url: 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/' },
    ],
  },
  {
    id: 'zinc-immune',
    title: 'Zinc — immune, skin & taste',
    category: 'minerals' as SupplementsCategory,
    summary:
      'Zinc supports wound healing, taste/smell, and immune function. Lozenges at cold onset have mixed trial support; chronic high dose depletes copper. Picolinate, bisglycinate, and gluconate differ in tolerance.',
    whenPeopleExplore:
      'Acne protocols, loss of smell, vegetarian diet, or frequent colds.',
    approaches: [
      '15–30 mg daily with food if diet is low — avoid chronic 50+ mg without copper balance.',
      'Zinc lozenges (not chew) at first cold symptoms — some trials use 75 mg/day short term only.',
      'Topical zinc oxide for skin — different from oral immune use.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Nausea on empty stomach — always take with food.',
      'Copper deficiency with long-term high zinc — supplement ratio if months of use.',
      'Nasal zinc sprays linked to anosmia — avoid.',
    ],
    sources: [
      { label: 'NIH ODS — Zinc', url: 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/' },
    ],
  },
  {
    id: 'iron-cautions',
    title: 'Iron — when to supplement & when to stop',
    category: 'minerals' as SupplementsCategory,
    summary:
      'Iron deficiency anemia needs diagnosis — fatigue has many causes. Ferrous bisglycinate is gentler on GI than sulfate; vitamin C enhances absorption. Hemochromatosis and men make blind supplementation dangerous.',
    whenPeopleExplore:
      'Heavy periods, vegan diet, endurance running, or low ferritin on labs.',
    approaches: [
      'Confirm ferritin and CBC before supplementing — treat cause of loss.',
      'Every-other-day dosing may absorb better than daily in some studies.',
      'Separate from calcium, coffee, and PPIs by two hours.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Iron overload is toxic — never supplement without labs unless prescribed.',
      'Constipation and black stool common — dose timing and form matter.',
      'Keep away from children — overdose is emergency.',
    ],
    sources: [
      { label: 'NIH ODS — Iron', url: 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/' },
    ],
  },
  {
    id: 'omega-3-fish-algae',
    title: 'Omega-3 — fish oil, algae oil & EPA/DHA',
    category: 'omegas-fats' as SupplementsCategory,
    summary:
      'EPA and DHA from marine sources support cardiovascular health, triglycerides, and brain structure. Algae oil suits vegans. Oxidized rancid oil is harmful — smell and refrigerate.',
    whenPeopleExplore:
      'High triglycerides, mood support, pregnancy DHA, or anti-inflammatory diet gaps.',
    approaches: [
      '1–2 g combined EPA+DHA daily for cardiometabolic goals — follow label EPA/DHA, not “fish oil mg.”',
      'Algae-derived DHA for pregnancy and vegan diets.',
      'Enteric-coated if fish burps; take with meals.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Blood thinning at high doses — surgery and anticoagulant caution.',
      'Fish allergy — use purified or algae sources.',
      'Check for heavy metals — third-party tested brands.',
    ],
    sources: [
      { label: 'NIH ODS — Omega-3 Fatty Acids', url: 'https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/' },
    ],
  },
  {
    id: 'coq10',
    title: 'Coenzyme Q10 — mitochondria & statin support',
    category: 'specialty-compounds' as SupplementsCategory,
    summary:
      'Ubiquinone/ubiquinol fuels cellular ATP production and acts as antioxidant. Levels fall with age and statin drugs. Trials explore heart failure adjunct, migraine prevention, and fertility — effects are modest.',
    whenPeopleExplore:
      'Statin muscle pain, heart failure education, or egg quality discussions.',
    approaches: [
      'Ubiquinol may absorb better over 40 — 100–200 mg with fat.',
      'Allow 8–12 weeks for migraine trials.',
      'Separate from warfarin dosing changes — monitor INR.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'May lower blood pressure and blood sugar slightly.',
      'Warfarin interaction possible — medical monitoring.',
      'Insomnia if taken late evening in sensitive people.',
    ],
    sources: [
      { label: 'NIH NCCIH — Coenzyme Q10', url: 'https://www.nccih.nih.gov/health/coenzyme-q10' },
    ],
  },
  {
    id: 'creatine',
    title: 'Creatine monohydrate — muscle, brain & energy',
    category: 'amino-performance' as SupplementsCategory,
    summary:
      'One of the most evidence-backed sports supplements — increases phosphocreatine stores for strength and sprint performance. Emerging research on cognitive fatigue and depression adjunct. Monohydrate is cheap and effective.',
    whenPeopleExplore:
      'Gym performance, vegetarian diet (lower baseline creatine), or brain fog studies.',
    approaches: [
      '3–5 g monohydrate daily — loading phase optional, not required.',
      'Mix in water or shake; consistency beats timing.',
      'Drink adequate water — intracellular water retention is normal.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Kidney disease — avoid without nephrologist approval (creatinine lab artifact too).',
      'Weight gain from water — not fat.',
      'Rare GI cramping — split dose or take with food.',
    ],
    sources: [
      { label: 'ISSN — Creatine position stand', url: 'https://jissn.biomedcentral.com/' },
    ],
  },
  {
    id: 'collagen-peptides',
    title: 'Collagen peptides — skin, joints & gut hype',
    category: 'amino-performance' as SupplementsCategory,
    summary:
      'Hydrolyzed collagen provides amino acids (glycine, proline) marketed for skin elasticity and joint comfort. Some RCTs show modest skin hydration and knee pain improvement; not a complete protein for muscle building.',
    whenPeopleExplore:
      'Wrinkle creams failing, osteoarthritis curiosity, or bone broth replacement.',
    approaches: [
      '10–15 g hydrolyzed collagen daily — type I/III for skin, type II for some joint products.',
      'Vitamin C cofactor for collagen synthesis — diet or supplement.',
      'Do not rely on collagen alone for protein RDA — low in tryptophan.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Fish/shellfish allergy — marine collagen sources.',
      'Heavy metal contamination in poor brands — third-party test.',
      'Unrealistic “erase wrinkles” marketing — manage expectations.',
    ],
    sources: [
      { label: 'PubMed — collagen supplementation skin', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=collagen+peptides+skin' },
    ],
  },
  {
    id: 'probiotics-gut',
    title: 'Probiotics — strains, CFUs & gut ecology',
    category: 'gut-immune' as SupplementsCategory,
    summary:
      'Live microorganisms confer benefit when administered in adequate amounts — but strain specificity matters enormously. L. rhamnosus GG for some antibiotic diarrhea; S. boulardii for C. diff prevention; IBS strains differ from immune strains.',
    whenPeopleExplore:
      'Post-antibiotic recovery, bloating, or yogurt not enough.',
    approaches: [
      'Match strain to indication — “50 billion CFU” without strain name is marketing.',
      'Refrigerated vs shelf-stable — follow storage; dead cultures do not count.',
      'Prebiotic fiber (inulin, GOS) feeds resident microbes — often paired.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Immunocompromised and central lines — probiotic sepsis risk (rare but serious).',
      'SIBO — some probiotics worsen bloating.',
      'Not regulated as drugs — quality varies.',
    ],
    sources: [
      { label: 'NIH NCCIH — Probiotics', url: 'https://www.nccih.nih.gov/health/probiotics-what-you-need-to-know' },
    ],
  },
  {
    id: 'melatonin-sleep',
    title: 'Melatonin — circadian hormone for sleep timing',
    category: 'specialty-compounds' as SupplementsCategory,
    summary:
      'Melatonin signals darkness to the brain — useful for jet lag, shift work, and some insomnia when timing is wrong. Low doses (0.3–1 mg) often work better than megadoses; extended-release for sleep maintenance.',
    whenPeopleExplore:
      'Jet lag, delayed sleep phase, or children’s sleep (pediatrician first).',
    approaches: [
      'Take 30–60 minutes before desired sleep; bright light in morning anchors rhythm.',
      'Start 0.5–1 mg — more causes grogginess and vivid dreams.',
      'Short-term use; address sleep hygiene and light exposure long term.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Hormonal effects — pregnancy, fertility, and hormone-sensitive cancers: caution.',
      'Additive with sedatives and alcohol.',
      'Vivid dreams and morning hangover at high doses.',
    ],
    sources: [
      { label: 'NIH NCCIH — Melatonin', url: 'https://www.nccih.nih.gov/health/melatonin-what-you-need-to-know' },
    ],
  },
  {
    id: 'nac-glutathione',
    title: 'NAC — mucolytic, glutathione precursor & mental health',
    category: 'specialty-compounds' as SupplementsCategory,
    summary:
      'N-acetylcysteine replenishes glutathione and thins mucus — hospital use for acetaminophen overdose. OTC supplements explore OCD adjunct, PCOS, and liver support; FDA has moved to restrict some OTC NAC sales in the US — check current status.',
    whenPeopleExplore:
      'Lung mucus, psychiatric adjunct research, or hangover prevention myths.',
    approaches: [
      '600 mg twice daily in some psychiatric trials — medical supervision for mental health use.',
      'Take away from meals if GI upset — sulfurous smell normal.',
      'Verify legal OTC status and quality in your region.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Bleeding risk with nitroglycerin and anticoagulants.',
      'Asthma — inhalation different from oral; oral can rarely bronchospasm.',
      'Drug status changes — pharmacist update advised.',
    ],
    sources: [
      { label: 'PubMed — N-acetylcysteine', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=n-acetylcysteine' },
    ],
  },
  {
    id: 'berberine-metabolic',
    title: 'Berberine — metabolic support from plants',
    category: 'specialty-compounds' as SupplementsCategory,
    summary:
      'Alkaloid from Oregon grape, goldenseal, and barberry — studied for blood sugar, lipids, and PCOS with effects compared to metformin in some small trials. Poor bioavailability; GI side effects common.',
    whenPeopleExplore:
      'Prediabetes, metabolic syndrome, or SIBO herbal protocols.',
    approaches: [
      '500 mg two to three times daily with meals — start low for GI tolerance.',
      'Cycle or monitor liver enzymes with long-term use.',
      'Not interchangeable with prescription metformin without physician oversight.',
    ],
    relatedPlantIds: ['oregon-grape'],
    safetyWarnings: [
      'Hypoglycemia with diabetes drugs — glucose monitoring.',
      'CYP drug interactions — many medications affected.',
      'Pregnancy and breastfeeding — avoid.',
    ],
    sources: [
      { label: 'PubMed — berberine glucose', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=berberine+glucose' },
    ],
  },
  {
    id: 'alpha-lipoic-acid',
    title: 'Alpha-lipoic acid — antioxidant & neuropathy',
    category: 'specialty-compounds' as SupplementsCategory,
    summary:
      'ALA is a mitochondrial cofactor and regenerates other antioxidants. R-alpha-lipoic is the bioactive enantiomer. Studied for diabetic peripheral neuropathy and insulin sensitivity — evidence is moderate.',
    whenPeopleExplore:
      'Burning feet in diabetes, antioxidant stacks, or chelation myths.',
    approaches: [
      '600 mg R-ALA daily in neuropathy trials — weeks to months for effect.',
      'Take on empty stomach for absorption — or with food if nausea.',
      'Biotin interference on labs — inform doctor before thyroid tests.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Hypoglycemia with diabetes medications.',
      'Thiamine deficiency (alcoholism) — replenish B1 before ALA.',
      'Skin rash rare.',
    ],
    sources: [
      { label: 'PubMed — alpha lipoic acid neuropathy', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=alpha+lipoic+acid+neuropathy' },
    ],
  },
  {
    id: 'multivitamin-debate',
    title: 'Multivitamins — insurance policy or waste?',
    category: 'quality-safety' as SupplementsCategory,
    summary:
      'Daily multivitamins fill micronutrient gaps in imperfect diets but rarely replace vegetables, sleep, and movement. Large trials show no heart benefit for most adults; prenatal multis are evidence-based for pregnancy.',
    whenPeopleExplore:
      '“Cover my bases” mentality, picky eaters, or comparing whole-food vs synthetic blends.',
    approaches: [
      'Choose age/sex-specific formulas — iron for menstruating adults, none for postmenopausal without deficiency.',
      'Prenatal with methylfolate and DHA for pregnancy planning.',
      'Split dose with meals to reduce nausea.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Fat-soluble vitamin accumulation (A, D, E, K) in high-dose multis.',
      'Vitamin K in multis interacts with warfarin — consistent daily dose or avoid.',
      'Megadoses of B6 cause neuropathy over time.',
    ],
    sources: [
      { label: 'NIH ODS — Multivitamin/mineral supplements', url: 'https://ods.od.nih.gov/factsheets/MVMS-HealthProfessional/' },
    ],
  },
  {
    id: 'supplement-quality-testing',
    title: 'Quality, third-party testing & label trust',
    category: 'quality-safety' as SupplementsCategory,
    summary:
      'Supplements are not FDA-approved like drugs — adulteration, wrong species, and heavy metals occur. USP, NSF, ConsumerLab, and ISO 17025 labs verify contents. Proprietary blends hide doses — skepticism warranted.',
    whenPeopleExplore:
      'Choosing brands, reading Certificates of Analysis, or after news of contaminated protein powder.',
    approaches: [
      'Look for NSF Certified for Sport or USP Verified when available.',
      'Avoid “proprietary blends” that do not list milligrams per ingredient.',
      'Batch COA on manufacturer website — lead, arsenic, microbes.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Weight loss and sexual enhancement supplements — frequent drug adulterants (sibutramine, Viagra analogs).',
      'Kava liver toxicity linked to poor extraction and wrong parts.',
      'Amazon counterfeit risk — buy direct from reputable brands.',
    ],
    sources: [
      { label: 'FDA — Dietary Supplements', url: 'https://www.fda.gov/food/dietary-supplements' },
      { label: 'USP Dietary Supplement Verification', url: 'https://www.usp.org/verification-services/dietary-supplements-verification-program' },
    ],
  },
  {
    id: 'drug-interactions',
    title: 'Supplement–drug interactions — what to watch',
    category: 'quality-safety' as SupplementsCategory,
    summary:
      'Natural does not mean safe with pharmaceuticals. St. John’s wort, goldenseal, berberine, and high-dose fish oil alter drug levels. Surgery requires stopping blood thinners, MAO inhibitors, and some herbs weeks ahead.',
    whenPeopleExplore:
      'Starting prescriptions while on a supplement stack, or pharmacist “brown bag” review.',
    approaches: [
      'Maintain a written list of all supplements with doses — share at every appointment.',
      'Use Medscape or NIH interaction checkers — not exhaustive but a start.',
      'Stop high-risk herbs before surgery per anesthesiologist schedule.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Warfarin, transplant drugs, HIV regimens, and chemotherapy — zero casual stacking.',
      'SSRIs plus 5-HTP or SAMe — serotonin syndrome risk.',
      'Diabetes and blood pressure meds — many supplements shift numbers.',
    ],
    sources: [
      { label: 'Memorial Sloan Kettering — About Herbs', url: 'https://www.mskcc.org/cancer-care/diagnosis-treatment/symptom-management/integrative-medicine/herbs' },
    ],
  },
];

export const SUPPLEMENTS_LIBRARY = applySupplementsExpanded(SUPPLEMENTS_LIBRARY_BASE);

export const SUPPLEMENTS_CATEGORY_ORDER: SupplementsCategory[] = [
  'vitamins',
  'minerals',
  'amino-performance',
  'omegas-fats',
  'gut-immune',
  'specialty-compounds',
  'quality-safety',
];

export function matchesSupplementsCategory(
  topic: SupplementsTopic,
  category: SupplementsCategory | 'all',
): boolean {
  if (category === 'all') return true;
  return topic.category === category;
}
