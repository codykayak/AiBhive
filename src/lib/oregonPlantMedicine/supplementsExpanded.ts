type ExpandedFields = {
  imageUrl: string;
  deepDive: string;
};

/** Supplements library uses text-only cards — imageUrl stays empty. */
export const SUPPLEMENTS_TOPIC_EXPANDED: Record<string, ExpandedFields> = {
  'vitamin-d3': {
    imageUrl: '',
    deepDive: `Vitamin D is technically a secosteroid hormone synthesized in skin from UVB light — yet Pacific Northwest winters, indoor work, and sunscreen leave many people deficient. Cholecalciferol (D3) raises 25-hydroxyvitamin D more reliably than ergocalciferol (D2). Blood testing (25(OH)D) guides therapy: many clinicians target 30–50 ng/mL, though optimal ranges are debated.

Beyond bones, vitamin D receptors exist on immune cells — the link to infection risk and autoimmune disease is plausible but trial results for supplementation in already-replete adults are disappointing. Mood and seasonal affective disorder benefit from light and D together in some studies.

Toxicity causes hypercalcemia — kidney stones, confusion, cardiac arrhythmia — usually from very high doses (10,000+ IU daily for months) without monitoring. Fat malabsorption (celiac, bariatric surgery) requires higher doses. Vitamin K2 discussions center on directing calcium to bone rather than arteries — evidence is emerging, not settled. Always pair supplementation with dietary calcium and weight-bearing exercise for skeletal health.`,
  },
  'vitamin-b12': {
    imageUrl: '',
    deepDive: `Vitamin B12 (cobalamin) requires intrinsic factor from the stomach for absorption — pernicious anemia and long-term proton pump inhibitors break this chain. Vegans must supplement or eat fortified foods; lacto-ovo vegetarians often borderline. Metformin for diabetes depletes B12 over years — guidelines suggest periodic testing.

Deficiency causes macrocytic anemia, peripheral neuropathy (tingling, balance problems), and cognitive fog — sometimes irreversible if late. Folate supplementation can correct anemia while masking B12 damage to nerves — check both. Methylcobalamin vs cyanocobalamin: cyanocobalamin is stable and well-studied; methyl form is popular in functional medicine with less long-term data.

Oral high-dose B12 (1,000 mcg) often works even without intrinsic factor via passive diffusion — injections are not always necessary. Sublingual marketing exceeds evidence vs swallowing. Hydroxocobalamin is used in some countries for injection. If neuropathy persists despite repletion, pursue other causes — diabetes, thyroid, structural spine disease.`,
  },
  'vitamin-c': {
    imageUrl: '',
    deepDive: `Ascorbic acid is a water-soluble antioxidant and essential cofactor for prolyl hydroxylase in collagen cross-linking — scurvy is the classic deficiency (bleeding gums, poor wound healing). Humans lost the ability to synthesize vitamin C — we must eat citrus, peppers, and greens.

Linus Pauling popularized megadose vitamin C for colds; Cochrane reviews show minimal prevention benefit and slight duration reduction at best. IV vitamin C at pharmacologic doses is an oncology research topic — not standard care. For iron deficiency, 100–200 mg vitamin C with plant iron meals meaningfully improves absorption.

Bowel tolerance limits oral dosing — diarrhea defines your ceiling. Kidney stone formers (calcium oxalate) should avoid chronic multi-gram doses. Smokers need higher intake due to oxidative stress. Liposomal C marketing claims superior absorption — evidence is limited vs plain ascorbic acid. Whole food vitamin C provides flavonoids; supplemental ascorbic acid is still effective for deficiency prevention.`,
  },
  'magnesium-forms': {
    imageUrl: '',
    deepDive: `Magnesium is the fourth most abundant mineral in the body — cofactor for ATP, DNA repair, and GABA modulation. Dietary gaps come from refined grains and low vegetable intake. Serum magnesium is a poor status marker because most Mg is intracellular; RBC magnesium is sometimes measured but controversial.

Magnesium oxide is 60% elemental but poorly absorbed — mainly a laxative. Citrate pulls water into bowels — good for constipation, loose for others. Glycinate/bisglycinate is chelated to amino acid — popular for sleep and anxiety with less GI effect. Threonate (Magtein) crosses blood-brain barrier in rodent studies — human cognitive data is early. Malate pairs with fatigue and fibromyalgia anecdotes.

Drug interactions: magnesium lowers absorption of thyroid hormone and quinolone antibiotics — separate by hours. Kidney failure patients can develop dangerous hypermagnesemia from supplements. Topical magnesium oil evidence for raising blood levels is weak — oral remains primary. Epsom salt baths are relaxing; transdermal magnesium science is limited.`,
  },
  'zinc-immune': {
    imageUrl: '',
    deepDive: `Zinc is a trace mineral in 300+ enzymes — immune cell development, wound healing, taste, and testosterone metabolism. Oysters are the classic food source; vegetarians and alcoholics risk deficiency. Acrodermatitis enteropathica is genetic zinc malabsorption — rash around orifices.

Cold lozenge trials use zinc acetate or gluconate releasing ionic zinc in the oropharynx — timing at symptom onset matters; daily prevention lozenges are not supported. Chronic supplementation above 40–50 mg daily depletes copper — balance with 1–2 mg copper if using high zinc months.

Dermatology uses zinc for acne and diaper rash (topical). Wilson’s disease uses zinc to block copper absorption — opposite concern from casual supplementing. Picolinate and bisglycinate are gentler forms; sulfate is cheap and harsh. Nasal zinc sprays caused permanent smell loss — FDA warnings followed. Test zinc if hair loss, poor taste, or slow healing — but ferritin and thyroid matter too.`,
  },
  'iron-cautions': {
    imageUrl: '',
    deepDive: `Iron deficiency is the world’s most common nutrient deficiency — fatigue, restless legs, hair shedding, and pica. Causes include menstrual blood loss, GI bleeding (occult colon cancer until proven otherwise in older adults), pregnancy, and endurance sport. Ferritin reflects stores; hemoglobin reflects anemia — both matter.

Supplement without diagnosis risks hemochromatosis carriers and men — iron overload damages liver and heart. Ferrous sulfate is standard but constipating; bisglycinate is better tolerated. Every-other-day dosing in some studies improves absorption vs daily by letting hepcidin reset.

Vitamin C enhances absorption; calcium, coffee, tea, and PPIs block it — timing separation helps. IV iron is for intolerance or malabsorption. Plant-based eaters need more dietary iron but should still test before mega-dosing. Black stool is normal on iron — do not confuse with GI bleed unless tarry and symptomatic. Keep supplements locked from children — iron overdose kills.`,
  },
  'omega-3-fish-algae': {
    imageUrl: '',
    deepDive: `Long-chain omega-3 fatty acids EPA and DHA integrate into cell membranes, modulating inflammation and producing resolvins. Fatty fish twice weekly meets most needs; supplements fill gaps for vegans (algae oil) and therapeutic triglyceride lowering (prescription icosapent ethyl is EPA-only drug).

Cardiovascular meta-analyses show modest benefit in high-risk populations; null results in general prevention for healthy adults muddy the message. Mental health trials (depression adjunct) show small effects. Pregnancy DHA supports fetal brain development — many prenatals include 200–300 mg DHA.

Rancidity is real — oxidized fish oil pro-inflammatory. Smell test, refrigerate after opening, choose brands with oxidation limits (TOTOX). Fish burps mean poor enteric coating or rancidity. Blood thinning at 3+ grams EPA+DHA — stop before surgery per surgeon schedule. Krill oil has phospholipid-bound omega-3 — marketing premium; fish oil remains evidence standard. Flax ALA converts poorly to EPA/DHA — not a full substitute.`,
  },
  coq10: {
    imageUrl: '',
    deepDive: `Coenzyme Q10 (ubiquinone) shuttles electrons in mitochondrial respiratory chain — every cell with mitochondria needs it. Statin drugs block HMG-CoA reductase and coQ10 synthesis — muscle pain on statins sometimes improves with coQ10, though trials are mixed. Heart failure guidelines in some countries mention adjunct coQ10; US guidelines are cautious.

Ubiquinol is the reduced form — better absorption in older adults in some pharmacokinetic studies. Doses 100–300 mg daily with fat-containing meals. Migraine prevention trials use 100 mg three times daily — commitment required.

CoQ10 may lower blood pressure and blood sugar slightly — monitor if on medications. Warfarin interaction is case-reported — INR checks after starting. Fertility clinics sometimes use coQ10 for egg quality — emerging data, not miracle. It is not a stimulant — energy claims refer to cellular ATP, not caffeine-like buzz.`,
  },
  creatine: {
    imageUrl: '',
    deepDive: `Creatine monohydrate is the most studied ergogenic supplement — phosphorylates to phosphocreatine, buffering ATP during explosive effort. Meta-analyses confirm strength and lean mass gains with resistance training. Loading (20 g/day × 5 days) saturates faster but 3–5 g daily reaches same steady state in a month.

Vegetarians start lower in muscle creatine — bigger relative response. Cognitive studies in sleep-deprived or aging adults show small benefits — not a nootropic miracle. Depression adjunct trials are early.

Monohydrate is as effective as expensive buffered or ethyl ester forms — save money. Kidney disease: creatine raises serum creatinine without harming kidneys in healthy people, but nephrologists may advise avoidance in CKD. Hair loss fear from DHT study is weak epidemiology — not established. Hydration prevents cramping myths. It is not a steroid — safe for teens in athletic programs per ISSN position with parental and coach awareness.`,
  },
  'collagen-peptides': {
    imageUrl: '',
    deepDive: `Collagen is structural protein in skin, bone, tendon, and cartilage — hydrolysis breaks it into peptides absorbed as amino acids. Marketing promises wrinkle erasure; RCTs show modest skin elasticity and hydration over 8–12 weeks. Joint trials (type II collagen) show some knee pain improvement — effect smaller than NSAIDs.

Collagen is not complete protein — low in tryptophan, poor for muscle protein synthesis vs whey. Bone broth contains collagen but variable doses. Vitamin C is required for hydroxylation of proline in collagen synthesis — diet matters alongside peptides.

Marine vs bovine source — allergy consideration for shellfish. Heavy metals in cheap bone-derived collagen — third-party testing essential. Vegan “collagen boosters” provide building blocks (vitamin C, silica) not actual collagen. Manage expectations: topical retinoids and sun protection outperform oral collagen for photoaging.`,
  },
  'probiotics-gut': {
    imageUrl: '',
    deepDive: `The microbiome is ecosystem — probiotics are temporary immigrants, not permanent residents in most cases. Strain-level evidence matters: Lactobacillus rhamnosus GG for antibiotic-associated diarrhea; Saccharomyces boulardii for C. difficile prevention alongside antibiotics; Bifidobacterium infantis 35624 for some IBS.

CFU count on label may not equal live cultures at expiration — refrigeration and stability testing matter. Spore-formers (Bacillus coagulans) survive shelf and stomach acid — different pharmacology. Prebiotics (fiber) feed native bacteria — often more sustainable than endless probiotic pills.

SIBO patients may flare on generic lactobacillus — work with gastroenterologist. Immunocompromised patients: probiotic bacteremia/sepsis documented — risk-benefit essential. Fecal transplant is medicine for recurrent C. diff — not DIY. Yogurt and kefir are food-grade probiotics — fine for maintenance. Post-antibiotic course of 2–4 weeks is common practice; lifelong daily probiotics lack strong indication for healthy adults.`,
  },
  'melatonin-sleep': {
    imageUrl: '',
    deepDive: `Melatonin is pineal hormone signaling night — production suppressed by blue light from screens. Supplemental melatonin shifts circadian phase rather than sedating like benzodiazepines. Jet lag eastward: take at destination bedtime; westward may need less. Delayed sleep phase in teens sometimes responds to low-dose evening melatonin plus morning bright light.

US supplements often sell 5–10 mg — physiologic doses are 0.3–1 mg. High doses cause nightmares, grogginess, and next-day impairment. Extended-release helps sleep maintenance insomnia; immediate-release helps sleep onset.

Children: pediatrician guidance only — affects puberty hormones in theory. Pregnancy and breastfeeding — insufficient safety data. Autoimmune disease: melatonin stimulates Th1 in some models — discuss with rheumatologist. It is not habit-forming like benzos but psychological dependence on “I need my gummy” happens. Fix sleep hygiene: cool dark room, consistent wake time, caffeine cutoff.`,
  },
  'nac-glutathione': {
    imageUrl: '',
    deepDive: `N-acetylcysteine (NAC) is acetylated cysteine — precursor to glutathione, the master intracellular antioxidant. Hospital IV NAC saves lives in acetaminophen overdose by replenishing liver glutathione. Oral NAC thins mucus in COPD protocols (prescription products exist).

Psychiatry explores NAC for OCD, trichotillomania, and bipolar depression — 2–3 g daily in trials, months for effect. PCOS and fertility studies are smaller. Bioavailability is moderate — sulfurous smell and GI upset common.

FDA attempted to exclude NAC from dietary supplement definition because it was approved as a drug first — legal status shifted; verify current US availability. Interacts with nitroglycerin (hypotension) and anticoagulants. Inhaled NAC is mucolytic in clinics — different from oral capsules. Liposomal glutathione marketing claims bypass need for NAC — absorption debates continue.`,
  },
  'berberine-metabolic': {
    imageUrl: '',
    deepDive: `Berberine is yellow alkaloid from Berberis, Coptis, and Hydrastis genera — Oregon grape root in the PNW. It activates AMPK similarly to metformin in cell studies; small human trials show HbA1c and lipid improvements in type 2 diabetes over three months. Not FDA-approved as drug; supplement quality varies.

GI cramping and diarrhea limit dosing — titrate slowly with meals. CYP2D6 and CYP3A4 inhibition means drug interactions with antidepressants, statins, and cyclosporine — pharmacist review mandatory. Pregnancy contraindicated — uterine stimulant in animal data.

SIBO herbal protocols sometimes include berberine — evidence mixed vs rifaximin. Do not stop metformin for berberine without physician — hypoglycemia risk combined. Sustainable sourcing avoids endangered wild goldenseal — cultivated Oregon grape or barberry preferred. Cycle use if long-term to monitor liver enzymes.`,
  },
  'alpha-lipoic-acid': {
    imageUrl: '',
    deepDive: `Alpha-lipoic acid (ALA) is mitochondrial antioxidant — both water and fat soluble, regenerates vitamins C and E. R-lipoic acid is the natural enantiomer; many products are racemic mixture. German approval exists for diabetic neuropathy at 600 mg daily — burning feet and paresthesia may improve over weeks.

Insulin sensitivity trials show modest benefit in type 2 diabetes — monitor glucose. ALA chelates metals in theory — separate from iron supplements by hours. High-dose biotin in ALA complexes can skew thyroid labs — tell lab before blood draw.

Thiamine deficiency (common in alcohol use disorder) must be corrected before ALA — Wernicke risk. Skin rash is rare allergy. IV ALA is used in some integrative clinics for neuropathy — oral is standard outpatient. Not a weight loss drug despite marketing.`,
  },
  'multivitamin-debate': {
    imageUrl: '',
    deepDive: `Multivitamins are dietary insurance — not license to skip vegetables. Large prevention trials (Physicians’ Health Study II, COSMOS) show no major cardiovascular benefit for generic multis in well-nourished adults. Exceptions with stronger rationale: pregnancy (folic acid prevents neural tube defects), confirmed deficiencies, malabsorption, and restrictive diets.

Formula matters: postmenopausal women often need less iron; menstruating adults need more. Smokers should avoid beta-carotene-heavy formulas (lung cancer risk in trials). Methylfolate vs folic acid — MTHFR polymorphism debates; folic acid still prevents spina bifida at population level.

Whole-food blend marketing implies superior absorption — often minuscule powder of plants plus synthetic vitamins. Expensive is not better — USP verified basics suffice. Mega multis exceed UL for zinc, niacin, vitamin A — chronic excess harms. Treat multivitamin as bridge, not foundation — sleep, fiber, protein, and movement remain primary.`,
  },
  'supplement-quality-testing': {
    imageUrl: '',
    deepDive: `Dietary supplements are regulated as food in the US — manufacturers attest to safety; FDA reacts to problems post-market. New York Attorney General DNA tests famously found herbal supplements without labeled species — industry responded with better testing, but gaps remain. Heavy metals (lead in turmeric, arsenic in rice protein) and microbial contamination happen.

Third-party seals: USP Verified, NSF International, NSF Certified for Sport (banned substance testing for athletes), Informed Sport, and ConsumerLab (subscription testing) reduce risk. Certificate of Analysis (COA) per batch should show identity, potency, heavy metals, microbes.

Red flags: proprietary blends hiding doses, unrealistic disease cure claims, weight loss and sexual enhancement categories (frequent pharmaceutical adulterants), prices too good to be true. Buy from manufacturer or authorized retailer — Amazon commingling invites counterfeits. Expiration dates matter for probiotics and oils. When in doubt, pharmacist or clinical dietitian review saves money and harm.`,
  },
  'drug-interactions': {
    imageUrl: '',
    deepDive: `Supplement-drug interactions are underreported — patients rarely tell doctors, and doctors rarely ask. St. John’s wort induces CYP3A4, dropping levels of birth control, HIV meds, and immunosuppressants — pregnancy on inadequate contraception has occurred. Berberine and goldenseal affect multiple CYP enzymes. Fish oil, garlic, ginkgo, and high-dose vitamin E add bleeding risk with warfarin and before surgery.

Serotonin syndrome: SSRIs plus St. John’s wort, 5-HTP, SAMe, or high-dose tryptophan — agitation, hyperthermia, clonus — emergency. Diabetes stack: berberine, cinnamon, chromium, alpha-lipoic acid plus metformin — hypoglycemia. Thyroid: calcium, iron, and soy isolate block levothyroxine absorption — separate by four hours.

Transplant patients: never self-prescribe immune “boosters” — graft rejection risk. Chemotherapy: antioxidant timing debates — oncologist must approve. Anesthesia: stop MAO-inhibiting herbs (some aged extracts) weeks ahead. Solutions: one-page supplement list with doses, pharmacist brown-bag review yearly, Medscape interaction checker, and skepticism toward influencer stacks. Natural is pharmacologically active — respect it.`,
  },
};

export function applySupplementsExpanded<T extends { id: string; summary: string }>(
  topics: T[],
): (T & ExpandedFields)[] {
  return topics.map((topic) => {
    const extra = SUPPLEMENTS_TOPIC_EXPANDED[topic.id];
    if (!extra) {
      return { ...topic, imageUrl: '', deepDive: topic.summary };
    }
    return { ...topic, ...extra };
  });
}
