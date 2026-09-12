import type { AutoimmuneCategory, AutoimmuneTopic } from './autoimmuneTypes';
import { applyAutoimmuneExpanded } from './autoimmuneExpanded';

const AUTOIMMUNE_LIBRARY_BASE = [
  {
    id: 'autoimmune-terrain-overview',
    title: 'Autoimmune terrain — why the immune system attacks self',
    category: 'conditions' as AutoimmuneCategory,
    summary:
      'Autoimmunity is not one disease but a family: the adaptive immune system loses tolerance to self-antigens. Integrative and functional models emphasize genetics, gut barrier, infections, toxins, stress, light deficiency, and mitochondrial failure as overlapping triggers — not excuses to skip rheumatology.',
    whenPeopleExplore:
      'New diagnosis, “why me?”, comparing functional medicine maps to standard specialist care, or searching for root-cause frameworks beyond “take this biologic forever.”',
    approaches: [
      'Map your diagnosis (antibodies, organ damage, flare pattern) with a specialist — terrain work complements, not replaces, monitoring.',
      'Track sleep, morning light, diet, stress, and symptom journals for 90 days before major protocol shifts.',
      'Read international traditions (TCM, Ayurveda, biological medicine) as cultural lenses on the same biology.',
    ],
    relatedPlantIds: ['turmeric', 'oregon-grape'],
    safetyWarnings: [
      'Flares can permanently damage joints, nerves, kidneys, or vision — do not delay standard-of-care.',
      '“Cure” claims on social media are often anecdotal or selling supplements.',
    ],
    sources: [
      { label: 'NIH — Autoimmune diseases overview', url: 'https://www.niams.nih.gov/health-topics/autoimmune-diseases' },
    ],
  },
  {
    id: 'hashimotos-thyroiditis',
    title: "Hashimoto's thyroiditis — thyroid autoimmunity",
    category: 'conditions' as AutoimmuneCategory,
    summary:
      'Anti-TPO/Tg antibodies drive gradual thyroid destruction. Conventional care uses levothyroxine; integrative layers add selenium, gluten trials, gut repair, circadian light, and iodine caution (excess can worsen autoimmunity in some).',
    whenPeopleExplore:
      'Fatigue, weight gain, hair loss, normal TSH but high antibodies, or debate about gluten/dairy elimination.',
    approaches: [
      'Selenium 100–200 mcg/day studied for antibody reduction in some trials — discuss with endocrinologist.',
      'Strict gluten elimination trial (3–6 months) — especially if celiac serology or HLA-DQ2/DQ8 positive.',
      'Morning outdoor light, stress reduction, and sleep regularity for HPT axis support.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Do not stop thyroid hormone without labs and physician oversight.',
      'High-dose iodine kelp supplements can flare Hashimoto’s in susceptible people.',
    ],
    sources: [
      { label: 'American Thyroid Association — Hashimoto’s', url: 'https://www.thyroid.org/hashimotos-thyroiditis/' },
    ],
  },
  {
    id: 'rheumatoid-arthritis',
    title: 'Rheumatoid arthritis (RA) — symmetric joint autoimmunity',
    category: 'conditions' as AutoimmuneCategory,
    summary:
      'RF and anti-CCP antibodies mark systemic inflammation attacking synovium. DMARDs and biologics prevent joint erosion. Adjunct terrain work explores omega-3, turmeric/boswellia, periodontal treatment, smoking cessation, and anti-inflammatory diets.',
    whenPeopleExplore:
      'Morning stiffness, swollen knuckles, fear of methotrexate, or interest in AIP diet and fasting for RA.',
    approaches: [
      'Treat gum disease — oral bacteria linked to citrullinated protein immune cross-reactivity in research.',
      'Mediterranean or AIP elimination diet with registered dietitian — monitor CRP/ESR with rheumatologist.',
      'Omega-3 EPA/DHA 2–3 g/day adjunct; curcumin with piperine — watch blood thinners.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Untreated RA causes irreversible joint damage within months.',
      'Herbs are not substitutes for DMARDs in moderate–severe disease.',
    ],
    sources: [
      { label: 'ACR — Rheumatoid arthritis', url: 'https://rheumatology.org/patients/rheumatoid-arthritis' },
    ],
  },
  {
    id: 'lupus-sle',
    title: 'Systemic lupus erythematosus (SLE)',
    category: 'conditions' as AutoimmuneCategory,
    summary:
      'Multi-system autoimmunity with ANA and organ-specific antibodies. Sun sensitivity is hallmark — UV triggers flares. Hydroxychloroquine is cornerstone therapy. Integrative focus: strict photoprotection, vitamin D repletion, stress, sleep, and avoiding alfalfa sprouts (can flare lupus in animal models).',
    whenPeopleExplore:
      'Butterfly rash, photosensitivity, joint pain with positive ANA, or balancing sun “for vitamin D” with lupus flares.',
    approaches: [
      'UV protection (clothing, shade, mineral sunscreen) — non-negotiable in most SLE.',
      'Vitamin D guided by labs; some use low-dose hydroxychloroquine for skin/joint — physician managed.',
      'Anti-inflammatory nutrition; avoid known flare triggers individually mapped.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Lupus nephritis and CNS lupus are emergencies — never self-treat with herbs alone.',
      'Echinacea and immune-stimulating herbs often discouraged — ask rheumatologist.',
    ],
    sources: [
      { label: 'Lupus Foundation of America', url: 'https://www.lupus.org/resources' },
    ],
  },
  {
    id: 'multiple-sclerosis',
    title: 'Multiple sclerosis (MS) — CNS demyelination',
    category: 'conditions' as AutoimmuneCategory,
    summary:
      'Immune attack on myelin with relapsing or progressive courses. Disease-modifying therapies reduce relapses. Wahls Protocol, vitamin D, omega-3, exercise, heat management, and circadian alignment are widely discussed adjuncts. Swank low saturated fat diet has long history in MS communities.',
    whenPeopleExplore:
      'New MRI lesions, fatigue, heat sensitivity, or Wahls/mito diet after diagnosis.',
    approaches: [
      'Vitamin D optimization per neurologist (often 40–60 ng/mL targets debated).',
      'Structured exercise and cooling strategies — heat worsens conduction block.',
      'Elimination of ultra-processed foods; some use gluten/dairy trials with dietitian.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Stop MS DMT without neurologist — relapse risk is real.',
      'High-dose antioxidant stacks without guidance can interact with therapies.',
    ],
    sources: [
      { label: 'National MS Society', url: 'https://www.nationalmssociety.org/' },
    ],
  },
  {
    id: 'ibd-crohns-colitis',
    title: "Crohn's disease & ulcerative colitis (IBD)",
    category: 'conditions' as AutoimmuneCategory,
    summary:
      'Gut-confined autoimmunity with structural damage risk. Biologics and immunomodulators heal mucosa. Integrative and “alternative” communities heavily discuss SCD, AIP, carnivore, fecal microbiota transplant research, worm therapy trials, and boswellia — always with gastroenterology partnership.',
    whenPeopleExplore:
      'Bloody stool, urgency, weight loss, or dietary remission stories on forums.',
    approaches: [
      'Exclusive enteral nutrition (medical formula diet) — evidence in pediatric Crohn’s; adult variants with GI team.',
      'AIP or SCD under dietitian — reintroduce systematically; monitor calprotectin/colonoscopy.',
      'Stress management, sleep, smoking cessation (strong Crohn’s risk factor).',
    ],
    relatedPlantIds: ['plantain-broadleaf'],
    safetyWarnings: [
      'Strictures and fistulas need surgical/GI care — fiber and herb experiments can obstruct.',
      'Herbal antimicrobials (berberine, oregano oil) can disrupt gut during flares.',
    ],
    sources: [
      { label: 'Crohn’s & Colitis Foundation', url: 'https://www.crohnscolitisfoundation.org/' },
    ],
  },
  {
    id: 'celiac-gluten-sensitivity',
    title: 'Celiac disease & gluten-related autoimmunity',
    category: 'conditions' as AutoimmuneCategory,
    summary:
      'Celiac is autoimmune destruction of small intestine villi from gluten. Non-celiac gluten sensitivity is debated but real symptoms occur. Strict gluten elimination is lifelong for celiac. Cross-contamination and hidden gluten in cosmetics/meds matter.',
    whenPeopleExplore:
      'Bloating, dermatitis herpetiformis, thyroid autoimmunity co-occurring, or failed “gluten-free” because of contamination.',
    approaches: [
      'tTG-IgA and total IgA testing before gluten-free trial — otherwise tests false-negative.',
      '100% gluten-free kitchen; oats only if certified GF.',
      'Heal gut with time; some add zinc, glutamine, bone broth — evidence mixed.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Cheating on gluten with celiac raises lymphoma risk over time.',
      'Do not start GF diet before celiac blood tests unless doctor advises.',
    ],
    sources: [
      { label: 'Beyond Celiac', url: 'https://www.beyondceliac.org/' },
    ],
  },
  {
    id: 'psoriasis-psoriatic-arthritis',
    title: 'Psoriasis & psoriatic arthritis',
    category: 'conditions' as AutoimmuneCategory,
    summary:
      'Skin and joint Th17-driven inflammation. Biologics transformed care. Integrative layers: anti-inflammatory diet, weight loss, alcohol reduction, curcumin, Oregon sunshine with caution, and gut–skin axis work (SIBO, celiac screening).',
    whenPeopleExplore:
      'Scalp plaques, nail pitting, joint swelling, or “leaky gut” protocols for skin.',
    approaches: [
      'Weight and metabolic health — strong evidence for psoriasis severity.',
      'Trial gluten elimination if celiac markers or IBD overlap.',
      'Topical herbal oils (indigo, Oregon grape/barberry berberine) — patch test; not for open cracks.',
    ],
    relatedPlantIds: ['oregon-grape'],
    safetyWarnings: [
      'Psoriatic arthritis erodes joints silently — rheumatology monitoring required.',
      'St. John’s wort and immune stimulants may interfere with biologics.',
    ],
    sources: [
      { label: 'National Psoriasis Foundation', url: 'https://www.psoriasis.org/' },
    ],
  },
  {
    id: 'sjogrens-type1-diabetes',
    title: "Sjögren's syndrome & type 1 diabetes — organ-specific autoimmunity",
    category: 'conditions' as AutoimmuneCategory,
    summary:
      'Sjögren’s attacks moisture glands (dry eyes/mouth); T1D destroys pancreatic beta cells. Both need specialist monitoring. Integrative support: hydration, omega-3, punctal plugs, CGM for T1D, and careful hydration/electrolytes — no insulin replacement with herbs.',
    whenPeopleExplore:
      'Dry mouth destroying teeth, positive SSA/SSB, or adult-onset T1D/LADA confusion.',
    approaches: [
      'Dental and ophthalmology follow-up — Sjögren’s carries lymphoma risk (monitor).',
      'For T1D: technology (CGM/pump) plus anti-inflammatory nutrition — no “reverse diabetes” herbs.',
      'Moisture chamber goggles, humidifiers, pilocarpine/cevimeline when prescribed.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Insulin is non-negotiable in T1D — DKA kills quickly.',
      'Immune stimulants contraindicated in many organ-specific autoimmunities.',
    ],
    sources: [
      { label: 'Sjögren’s Foundation', url: 'https://sjogrens.org/' },
    ],
  },
  {
    id: 'leaky-gut-intestinal-barrier',
    title: 'Leaky gut (intestinal hyperpermeability) & immune tolerance',
    category: 'gut-terrain' as AutoimmuneCategory,
    summary:
      'Zonulin, tight junction proteins, and microbiome metabolites regulate what crosses the gut wall. Integrative medicine links barrier breakdown to food antigens, LPS translocation, and autoimmune flares — mainstream gastroenterology acknowledges permeability in IBD and celiac but debates “leaky gut syndrome” as universal cause.',
    whenPeopleExplore:
      'Multiple food sensitivities, post-infectious autoimmunity, or functional medicine stool panels.',
    approaches: [
      'Remove confirmed triggers (celiac gluten, diagnosed allergies) before generic “gut healers.”',
      'Prebiotic fiber if tolerated; avoid if strictures or SIBO bloating — test with clinician.',
      'Bone broth, glutamine, zinc carnosine, spore probiotics — mixed evidence; track symptoms.',
    ],
    relatedPlantIds: ['plantain-broadleaf', 'wild-mint'],
    safetyWarnings: [
      'Aggressive antimicrobial “gut cleanses” can worsen dysbiosis.',
      'Lactulose/mannitol permeability tests are research tools — not universally standardized.',
    ],
    sources: [
      { label: 'PubMed — intestinal permeability autoimmunity', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=intestinal+permeability+autoimmune' },
    ],
  },
  {
    id: 'microbiome-diversity',
    title: 'Microbiome diversity & immune training',
    category: 'gut-terrain' as AutoimmuneCategory,
    summary:
      'Hygiene hypothesis and old-friends hypothesis: reduced microbial exposure (C-section, antibiotics, urban life) may skew immunity toward allergy/autoimmunity. FMT, probiotics, fermented foods, and soil exposure are explored — quality varies wildly.',
    whenPeopleExplore:
      'After repeated antibiotics, living ultra-sanitized, or comparing rural vs urban autoimmune rates.',
    approaches: [
      'Fermented foods if tolerated (histamine-sensitive people may react).',
      'Garden/soil contact with safe hand hygiene — not eating unknown soil.',
      'Avoid unnecessary antibiotics; discuss prokinetics/SIBO if bloating dominates.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'FMT is medical procedure with infection risk — not DIY.',
      'Immunocompromised patients: probiotic bacteremia reported — ask oncologist/rheumatologist.',
    ],
    sources: [
      { label: 'Nature — microbiome and immunity reviews', url: 'https://www.nature.com/subjects/microbiome' },
    ],
  },
  {
    id: 'molecular-mimicry-foods',
    title: 'Molecular mimicry — when foods resemble self-proteins',
    category: 'gut-terrain' as AutoimmuneCategory,
    summary:
      'Theory: immune responses to microbes or foods cross-react with joint, thyroid, or nerve tissue (e.g., gluten/celiac, Yersinia/RA debates, casein peptides). Elimination diets test individual response — not one list fits all.',
    whenPeopleExplore:
      'Flares after specific foods, positive celiac workup, or AIP/carnivore evangelism online.',
    approaches: [
      'Structured elimination with reintroduction journal — dietitian helps avoid malnutrition.',
      'Prioritize proven triggers (gluten in celiac) over speculative long avoid lists.',
      'Treat infections (periodontal, gut) that drive mimicry antigens.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Long-term restrictive diets cause nutrient deficiencies — monitor ferritin, B12, D.',
      'IgG food panels are widely criticized — not standard diagnostic tools.',
    ],
    sources: [
      { label: 'PubMed — molecular mimicry autoimmunity', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=molecular+mimicry+autoimmune' },
    ],
  },
  {
    id: 'mitochondria-bioenergetics',
    title: 'Mitochondria — cellular power plants in autoimmune fatigue',
    category: 'mitochondria-light' as AutoimmuneCategory,
    summary:
      'Mitochondrial dysfunction appears in MS, lupus, RA fatigue, and Long COVID overlap. CoQ10, PQQ, creatine, B vitamins, magnesium, and exercise train biogenesis. Wahls and functional medicine emphasize feeding mitochondria while reducing oxidative junk.',
    whenPeopleExplore:
      'Crushing fatigue despite normal labs, exercise intolerance, or “mito stack” supplement lists.',
    approaches: [
      'Graded exercise / physical therapy — paradoxically improves mitochondrial function when paced.',
      'CoQ10 100–300 mg, magnesium glycinate, riboflavin (B2) — especially if on statins or migraines.',
      'Reduce ultra-processed oils; prioritize whole-food fats (olive, avocado, small oily fish).',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Post-exertional malaise (ME/CFS overlap) — aggressive exercise worsens; use pacing.',
      'Supplement stacks without labs can mask B12 deficiency or anemia.',
    ],
    sources: [
      { label: 'PubMed — mitochondrial dysfunction autoimmune', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=mitochondrial+dysfunction+autoimmune' },
    ],
  },
  {
    id: 'circadian-sunlight-jack-kruse',
    title: 'Circadian biology, morning sunlight & Jack Kruse framework',
    category: 'mitochondria-light' as AutoimmuneCategory,
    summary:
      'Neurosurgeon Jack Kruse argues modern indoor life — blue light at night, nnEMF, lack of UV/IR — collapses mitochondrial signaling and immune regulation. Mainstream agrees on circadian disruption and vitamin D; his stronger EMF claims are controversial. Morning outdoor light without sunglasses (brief, safe exposure) aligns with sleep medicine consensus.',
    whenPeopleExplore:
      'Insomnia with autoimmunity, seasonal flares, vitamin D deficiency, or Kruse blog rabbit holes.',
    approaches: [
      '10–30 minutes outdoor morning light daily; dim screens after sunset; fixed sleep/wake times.',
      'Vitamin D from sun + labs — balance with lupus photosensitivity (protect skin).',
      'Seasonal affective disorder lamps (10,000 lux morning) if latitude prevents sun.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Lupus and photosensitive conditions — sun can flare; work with rheumatologist.',
      'Kruse cold thermogenesis and extreme protocols not safe for everyone — cardiac risk.',
    ],
    sources: [
      { label: 'Jack Kruse — circadian blog (controversial)', url: 'https://jackkruse.com/' },
      { label: 'CDC — sleep and health', url: 'https://www.cdc.gov/sleep/about_sleep/index.html' },
    ],
  },
  {
    id: 'cold-thermogenesis',
    title: 'Cold exposure & hormetic stress',
    category: 'mitochondria-light' as AutoimmuneCategory,
    summary:
      'Cold showers, ice baths, and winter swimming activate brown fat, norepinephrine, and perceived immune “training.” Nordic countries embed cold + sauna culture. Autoimmune patients report mixed results — flares possible with extreme stress.',
    whenPeopleExplore:
      'Wim Hof method, Finnish sauna+cold cycles, or Kruse cold thermogenesis.',
    approaches: [
      'End with 30–60 seconds cool shower — build slowly; avoid if Raynaud’s uncontrolled.',
      'Sauna 2–3×/week with hydration and electrolytes — cardiovascular clearance first.',
      'Never cold plunge alone or with cardiac history without physician OK.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Raynaud’s phenomenon (common in scleroderma, lupus) — cold can trigger vasospasm.',
      'Hypothyroid patients feel cold easily — monitor core temperature and stress.',
    ],
    sources: [
      { label: 'PubMed — sauna health outcomes', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=sauna+health' },
    ],
  },
  {
    id: 'red-light-photobiomodulation',
    title: 'Red & near-infrared light — photobiomodulation',
    category: 'mitochondria-light' as AutoimmuneCategory,
    summary:
      'Red/NIR light (630–850 nm) may enhance cytochrome c oxidase and ATP production — used for skin, pain, and fatigue experiments. Less EMF controversy than wireless tech; devices vary in power and snake oil.',
    whenPeopleExplore:
      'Joint pain adjunct, skin healing, or mitochondrial stacks beyond oral supplements.',
    approaches: [
      'FDA-cleared panels for target areas 10–20 min — follow manufacturer dosing.',
      'Combine with morning sunlight for circadian + local tissue support.',
      'Track joint swelling — if worsens, stop and tell rheumatologist.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Photosensitive lupus rashes — UV content in some devices; choose red-only panels.',
      'Eye protection per device instructions.',
    ],
    sources: [
      { label: 'PubMed — photobiomodulation mitochondria', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=photobiomodulation+mitochondria' },
    ],
  },
  {
    id: 'emf-nnemf-reduction',
    title: 'EMF, nnEMF & electrosensitivity — reduction strategies',
    category: 'environment-emf' as AutoimmuneCategory,
    summary:
      'Jack Kruse and electrosensitive communities blame non-native EMF (Wi‑Fi, 4G/5G, smart meters) for mitochondrial and immune disruption. WHO and major reviews find no proven causation for “EMF allergy,” yet sleep disruption from devices is real. Pragmatic reduction: airplane mode at night, wired ethernet, router distance from bed.',
    whenPeopleExplore:
      'Insomnia near router, tinnitus, fatigue attributed to 5G towers, or Faraday bed canopies.',
    approaches: [
      'Remove electronics from bedroom; wired internet where feasible; airplane mode on phones overnight.',
      'Measure with quality meters if hobbyist — focus on behavior changes over fear.',
      'Fix sleep hygiene and circadian light before expensive shielding products.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Anxiety from EMF obsession can worsen autoimmune symptoms via stress hormones.',
      'Avoid ungrounded “dirty electricity” filters that violate electrical code.',
    ],
    sources: [
      { label: 'WHO — EMF and public health', url: 'https://www.who.int/teams/environment-climate-change-and-health/radiation-and-health/non-ionizing' },
    ],
  },
  {
    id: 'mold-mycotoxins-cirs',
    title: 'Mold, mycotoxins & CIRS-like illness',
    category: 'environment-emf' as AutoimmuneCategory,
    summary:
      'Water-damaged buildings grow molds producing inflammagens. Shoemaker/CIRS protocol and functional mold doctors link exposure to fatigue, cognitive fog, and immune dysregulation overlapping autoimmunity. Remediation beats endless binders if still exposed.',
    whenPeopleExplore:
      'Musty home, worse symptoms indoors, or post-hurricane/flood building.',
    approaches: [
      'Professional inspection/remediation — leave during work if severely sensitized.',
      'HEPA air, dehumidify, discard porous contaminated materials.',
      'Binders (cholestyramine, charcoal) only under clinician if labs support — not while re-exposed.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Mold remediation stirs spores — N95/respirator and containment required.',
      'CIRS diagnosis is contested — still validate other causes (Lyme, autoimmune labs).',
    ],
    sources: [
      { label: 'EPA — mold cleanup', url: 'https://www.epa.gov/mold' },
    ],
  },
  {
    id: 'environmental-toxins-glyphosate',
    title: 'Pesticides, glyphosate & environmental load',
    category: 'environment-emf' as AutoimmuneCategory,
    summary:
      'Rising autoimmune incidence correlates (imperfectly) with industrial chemical load. Glyphosate, PFAS, heavy metals, and air pollution appear in integrative etiology lists. Organic produce, water filtration, and occupational safety reduce load — detox fad kits often scam.',
    whenPeopleExplore:
      'Farming community exposure, well water concerns, or “chemicals caused my AI” forums.',
    approaches: [
      'Reverse osmosis or certified filters for PFAS if local water reports show hits.',
      'Organic for dirty dozen produce when budget allows; wash all produce.',
      'Sauna/sweat for some metals — only with provoked testing interpretation by toxicologist.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Chelation without true toxicity injures — avoid mail-order “heavy metal detox.”',
      'Mercury amalgam removal without proper protocol can spike exposure.',
    ],
    sources: [
      { label: 'EWG — Dirty Dozen', url: 'https://www.ewg.org/foodnews/summary.php' },
    ],
  },
  {
    id: 'tcm-autoimmune-zheng',
    title: 'Traditional Chinese Medicine — Zheng patterns in autoimmunity',
    category: 'international-traditions' as AutoimmuneCategory,
    summary:
      'TCM does not use “autoimmune” but maps Bi syndrome (painful obstruction), Gu syndrome (parasitic/toxic accumulation), Yin deficiency heat, and Liver Qi stagnation. Formulas (e.g., Qing Fei, Liu Wei variants) are individualized — never self-prescribe with immunosuppressants without licensed acupuncturist/herbalist coordination.',
    whenPeopleExplore:
      'Acupuncture for RA pain, Chinese herbs alongside methotrexate, or travel to China for integrative hospitals.',
    approaches: [
      'Licensed acupuncturist with hospital privileges for complex cases.',
      'Classical formulas modified to avoid herb–drug interactions (e.g., glycyrrhiza + corticosteroids).',
      'Tai chi/qigong — evidence for balance and pain in arthritis studies.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Aristolochia and other adulterants in black-market herbs — kidney failure risk.',
      'TCM “heat clearing” herbs can interact with anticoagulants.',
    ],
    sources: [
      { label: 'NCCIH — Chinese herbal medicine', url: 'https://www.nccih.nih.gov/health/traditional-chinese-medicine-what-you-need-to-know' },
    ],
  },
  {
    id: 'ayurveda-autoimmune-ama',
    title: 'Ayurveda — Ama, Ojas, and immune vitality',
    category: 'international-traditions' as AutoimmuneCategory,
    summary:
      'Ayurveda frames autoimmunity as Ama (undigested toxic residue) blocking channels plus Ojas (immune essence) depletion. Panchakarma, kitchari mono-diet, turmeric, guduchi, ashwagandha appear — must be adapted for modern diagnoses and medications.',
    whenPeopleExplore:
      'Kerala panchakarma retreats, practitioner recommendations for “rebuilding Ojas.”',
    approaches: [
      'Work with AAPNA-certified or NAMA-recognized practitioners who understand Western labs.',
      'Gentle kitchari reset — not during active IBD flare or malnutrition.',
      'Rasayana herbs (ashwagandha, shatavari) — monitor thyroid and blood pressure.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Panchakarma laxatives/dehydration dangerous with kidney disease or diuretics.',
      'Ayurvedic products may contain heavy metals — third-party tested brands only.',
    ],
    sources: [
      { label: 'NCCIH — Ayurvedic medicine', url: 'https://www.nccih.nih.gov/health/ayurvedic-medicine-in-depth' },
    ],
  },
  {
    id: 'german-biological-medicine',
    title: 'German biological medicine & terrain regulation',
    category: 'international-traditions' as AutoimmuneCategory,
    summary:
      'European biological medicine (Günther Enderlein lineage, isopathy, milieu therapy) focuses on internal milieu, pleomorphism, and sanum remedies — highly controversial in Anglo medicine. Sanum/isopathic products remain legal in Germany; US FDA status varies. Explore with skepticism and licensed integrative MD if at all.',
    whenPeopleExplore:
      'Sanum kits, “regulation therapy,” or Swiss/German clinic tourism for chronic illness.',
    approaches: [
      'Only under physician importing legal products with documented batch testing.',
      'Pair with conventional monitoring — antibodies, imaging, calprotectin.',
      'Reject claims of curing lupus/MS with oral “fungal phase” drops alone.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Unregulated isopathy products can be contaminated.',
      'Delaying biologics for “milieu therapy” risks organ damage.',
    ],
    sources: [
      { label: 'PubMed — complementary medicine Germany chronic disease', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=biological+medicine+chronic+disease' },
    ],
  },
  {
    id: 'japan-kampo-sho',
    title: 'Japanese Kampō — Sho patterns & autoimmune adjuvants',
    category: 'international-traditions' as AutoimmuneCategory,
    summary:
      'Kampō is standardized TCM-derived formulas in Japanese national health insurance. Sho (pattern) diagnosis guides use. Research exists on formulas for RA adjunct, atopic dermatitis, and IBD symptoms — quality-controlled granules reduce adulteration risk vs raw herb markets.',
    whenPeopleExplore:
      'Tokyo Kampō clinics, research on rikkunshito for gut motility, or Sho surveys online.',
    approaches: [
      'Licensed Kampō physician in Japan or trained practitioner abroad.',
      'Granule formulas (e.g., boswellia combinations studied in OA/RA contexts).',
      'Coordinate with rheumatologist — some formulas contain ephedra-like or blood-moving herbs.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Ephedra-containing formulas banned or restricted in many countries.',
      'Import regulations on prescription Kampō products.',
    ],
    sources: [
      { label: 'PubMed — Kampo rheumatoid arthritis', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=kampo+rheumatoid+arthritis' },
    ],
  },
  {
    id: 'latin-american-curanderismo',
    title: 'Latin American curanderismo & plant limpias',
    category: 'international-traditions' as AutoimmuneCategory,
    summary:
      'Curanderismo blends Indigenous, African, and Catholic healing — limpias (spiritual cleansing), herbal baths, and dietary counsel. Emotional and community dimensions of autoimmune suffering are addressed alongside plants (rue, rosemary, chamomile). Respect cultural context; avoid appropriation without lineage teachers.',
    whenPeopleExplore:
      'Community healers, spiritual aspect of chronic illness, or herbal baños for “mal de ojo” overlap with stress.',
    approaches: [
      'Seek practitioners within your cultural community with trusted referrals.',
      'Use spiritual care alongside — not instead of — rheumatology/endocrinology.',
      'Document herbs used for drug interaction review with pharmacist.',
    ],
    relatedPlantIds: ['wild-mint', 'yarrow'],
    safetyWarnings: [
      'Rue (Ruta) is abortifacient and hepatotoxic at high doses — dangerous in pregnancy.',
      'Some limpia smoke can trigger asthma — ventilate.',
    ],
    sources: [
      { label: 'Smithsonian — curanderismo overview', url: 'https://www.nationalmuseumofamericanhistory.si.edu/' },
    ],
  },
  {
    id: 'aip-autoimmune-protocol',
    title: 'Autoimmune Protocol (AIP) diet',
    category: 'diet-protocols' as AutoimmuneCategory,
    summary:
      'AIP eliminates grains, dairy, legumes, nightshades, eggs, nuts, seeds, alcohol, and processed foods for 30–90 days, then reintroduces systematically. Popular in Hashimoto’s, IBD, and psoriasis communities. Evidence is mostly anecdotal + small trials; malnutrition risk if prolonged without guidance.',
    whenPeopleExplore:
      'Sarah Ballantyne / Mickey Trescott books, failed gluten-free alone, or Instagram AIP meal prep.',
    approaches: [
      'Work with RD experienced in AIP — calcium, fiber, and iodine monitoring.',
      'Reintroduction one food every 5–7 days with symptom journal.',
      'Do not stay in elimination phase indefinitely without reintro attempts.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Eating disorder history — strict elimination can trigger relapse.',
      'IBD flares may need elemental diet instead — GI team decides.',
    ],
    sources: [
      { label: 'PubMed — autoimmune protocol diet', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=autoimmune+protocol+diet' },
    ],
  },
  {
    id: 'carnivore-elimination-debate',
    title: 'Carnivore & lion diet — extreme elimination debate',
    category: 'diet-protocols' as AutoimmuneCategory,
    summary:
      'All-meat elimination removes plant antigens entirely — anecdotal remission stories in IBD and Hashimoto’s forums. Mechanism debated (fiber removal, lectin avoidance, placebo, calorie simplicity). Long-term cardiovascular and microbiome risks unknown; many rheumatologists oppose.',
    whenPeopleExplore:
      'Mikhaila Peterson story, zero-fiber experiment after failed AIP, or short carnivore trial.',
    approaches: [
      'If attempting: medical supervision, baseline lipids/calcium/magnesium, limited duration trial with exit plan.',
      'Prefer less restrictive proven steps first (celiac testing, AIP, Mediterranean).',
      'Reintroduce plants slowly if symptoms improve — sustainability matters.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'ApoE4, kidney disease, gout, and hyperlipidemia — high meat diets risky.',
      'SCAD and cardiac events reported in extreme low-carb communities — rare but real.',
    ],
    sources: [
      { label: 'PubMed — carnivore diet (limited literature)', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=carnivore+diet' },
    ],
  },
  {
    id: 'fasting-autophagy',
    title: 'Time-restricted eating & fasting for immune reset',
    category: 'diet-protocols' as AutoimmuneCategory,
    summary:
      'Fasting induces autophagy and may shift immune cell metabolism — Valter Longo’s fasting-mimicking diet studied in MS and RA pilots. Not for everyone: T1D, pregnancy, eating disorders, underweight, or active IBD flares contraindicate.',
    whenPeopleExplore:
      '16:8 intermittent fasting, 3-day FMD kits, or religious fasts with autoimmune meds timing.',
    approaches: [
      '12–14 hour overnight fast window — gentle start if metabolically stable.',
      'ProLon or clinician-supervised FMD only with medication adjustment plan.',
      'Never fast through hypoglycemia on insulin or sulfonylureas.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Corticosteroids + fasting — blood sugar swings; medical guidance required.',
      'Women: menstrual irregularity with aggressive fasting — monitor.',
    ],
    sources: [
      { label: 'PubMed — fasting mimicking autoimmune', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=fasting+mimicking+diet+autoimmune' },
    ],
  },
  {
    id: 'mcas-histamine-oxalate',
    title: 'MCAS, histamine & oxalate overload overlaps',
    category: 'diet-protocols' as AutoimmuneCategory,
    summary:
      'Mast cell activation syndrome overlaps autoimmune symptoms (flushing, GI, pain). Low-histamine and low-oxalate diets help subsets — not universal autoimmune cures. DAO supplements, quercetin, and cromolyn (Rx) appear in integrative MCAS care.',
    whenPeopleExplore:
      'Random hives with SLE, wine/chocolate triggers, or kidney stones with spinach smoothies.',
    approaches: [
      'Low-histamine trial 4 weeks — fresh cooked meat, avoid aged cheese/wine.',
      'Oxalate reduction if documented hyperoxaluria or vulvodynia pattern.',
      'Specialist diagnosis — MCAS is clinical diagnosis of exclusion.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Over-restrictive histamine diets cause malnutrition — dietitian support.',
      'Quercetin high dose — CYP interactions.',
    ],
    sources: [
      { label: 'PubMed — mast cell activation syndrome', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=mast+cell+activation+syndrome' },
    ],
  },
  {
    id: 'vagus-nerve-polyvagal',
    title: 'Vagus nerve, polyvagal theory & inflammatory tone',
    category: 'nervous-system' as AutoimmuneCategory,
    summary:
      'Chronic sympathetic dominance raises cytokines. Vagus nerve stimulation (implant Rx) reduces inflammation in trials; accessible tools: humming, gargling, cold face splash, slow breathing, singing. Polyvagal theory links safety perception to immune state — somatic therapies help some patients.',
    whenPeopleExplore:
      'Trauma history with lupus flares, breathwork after diagnosis, or tVNS devices online.',
    approaches: [
      '4-7-8 or box breathing 5–10 min twice daily.',
      'Humming/chanting activates vagal afferents — low cost, low risk.',
      'Somatic experiencing or EMDR for trauma stored as body tension — parallel to medical care.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Implantable VNS is prescription — not DIY electrical neck devices.',
      'Breathwork can trigger panic — go slowly with therapist if PTSD.',
    ],
    sources: [
      { label: 'PubMed — vagus nerve inflammation', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=vagus+nerve+inflammation' },
    ],
  },
  {
    id: 'trauma-aces-autoimmunity',
    title: 'Trauma, ACE scores & immune dysregulation',
    category: 'nervous-system' as AutoimmuneCategory,
    summary:
      'Adverse childhood experiences correlate with adult autoimmune incidence in epidemiology — HPA axis and epigenetic mechanisms proposed. Not blame: understanding links trauma-informed care to flares. Therapy, community, and nervous system regulation as legitimate adjuncts.',
    whenPeopleExplore:
      'ACE questionnaire matching diagnosis age, or flares during relational stress.',
    approaches: [
      'Trauma-informed therapist (EMDR, IFS, somatic modalities).',
      'Support groups — isolation worsens cytokines and adherence.',
      'Boundary work to reduce chronic cortisol — not “all in your head,” but nervous system is real input.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Retraumatization from poorly trained practitioners — vet credentials.',
      'Do not let psychological framing deny need for biologics.',
    ],
    sources: [
      { label: 'PubMed — ACE autoimmune', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=adverse+childhood+experiences+autoimmune' },
    ],
  },
  {
    id: 'herbs-boswellia-curcumin-reishi',
    title: 'Plant allies — turmeric, boswellia, cat\'s claw, reishi',
    category: 'plant-allies' as AutoimmuneCategory,
    summary:
      'Most-studied botanical adjuncts for inflammatory autoimmunity: curcumin (RA, IBD trials), boswellia (IBD/RA), cat\'s claw (RA small trials), reishi and green tea polyphenols. Always check interactions with methotrexate, warfarin, and biologics.',
    whenPeopleExplore:
      'Adding “natural anti-inflammatories” to DMARDs or seeking MTX alternatives.',
    approaches: [
      'Curcumin phytosome 500 mg 2×/day with food — pause before surgery.',
      'Boswellia serrata standardized AKBA — GI tolerance varies.',
      'Cat\'s claw (Uncaria tomentosa) — avoid if pregnant; monitor if on blood thinners.',
    ],
    relatedPlantIds: ['oregon-grape'],
    safetyWarnings: [
      'Uncaria guianensis looks similar — wrong species risks.',
      'Immune-stimulating mushrooms contraindicated in some transplant patients.',
    ],
    sources: [
      { label: 'PubMed — boswellia inflammatory bowel', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=boswellia+inflammatory+bowel' },
    ],
  },
  {
    id: 'helminth-worm-therapy',
    title: 'Helminth therapy — intentional parasite inoculation',
    category: 'research-context' as AutoimmuneCategory,
    summary:
      'Hygiene hypothesis spawned experimental helminth (pig whipworm, human hookworm) use in MS, IBD, and allergy — some open-label improvements, not FDA-approved. Legal gray market; infection risks real. University trials continue; DIY is dangerous.',
    whenPeopleExplore:
      'Worm therapy forums, TSO purchases online, or comparison to Finland/Russia epidemiology.',
    approaches: [
      'Only via clinical trials with ethics oversight — not mail-order larvae.',
      'Discuss with gastroenterologist — flares vs improvement unpredictable.',
      'Track stool pathogens — immunosuppressed patients must avoid entirely.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Anemia, bowel obstruction, and sepsis from uncontrolled parasites.',
      'Illegal importation seized; quality unknown.',
    ],
    sources: [
      { label: 'PubMed — helminth therapy autoimmunity', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=helminth+therapy+autoimmune' },
    ],
  },
  {
    id: 'research-funding-gaps',
    title: 'Why remission stories outrun RCTs — incentive & funding gaps',
    category: 'research-context' as AutoimmuneCategory,
    summary:
      'Pharmaceutical trials fund biologics, not sun, diet, or EMF reduction — creating evidence asymmetry integrative patients feel as “conspiracy.” NIH funds some lifestyle work but not at pharma scale. Remission anecdotes (Terry Wahls, AIP bloggers) drive exploration; rigorous n is small. Critical thinking: distinguish under-researched from disproven.',
    whenPeopleExplore:
      'Feeling gaslit by rheumatologist dismissing diet, or convinced Big Pharma hides cures.',
    approaches: [
      'Demand shared decision-making — bring journals, ask what is safe to combine.',
      'Participate in legitimate trials (ClinicalTrials.gov).',
      'Skeptically evaluate supplement brands selling “Big Pharma doesn’t want you to know.”',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Anti-medication ideology kills — biologics prevent wheelchair and bowel resection.',
      'Conspiracy stress raises cortisol — ironically worsens autoimmunity.',
    ],
    sources: [
      { label: 'ClinicalTrials.gov — autoimmune lifestyle', url: 'https://clinicaltrials.gov/search?cond=autoimmune' },
    ],
  },
  {
    id: 'remission-case-studies',
    title: 'Documented remission patterns — Wahls, AIP, FMT, lifestyle stacks',
    category: 'research-context' as AutoimmuneCategory,
    summary:
      'Case series and n=1 stories cluster around multi-modal lifestyle: Wahls (MS), AIP (Hashimoto’s/IBD), periodontal treatment (RA), celiac strict GF (dermatitis herpetiformis), FMT (ulcerative colitis trials). Patterns: remove trigger, heal gut, sleep, move, reduce toxin load — rarely single magic bullet.',
    whenPeopleExplore:
      'YouTube remission tours, functional medicine “before/after labs,” or despair after first biologic failure.',
    approaches: [
      'Copy processes not personalities — track your labs, not their Instagram.',
      'Stack changes slowly to know what helps.',
      'Celebrate partial remission — quality of life counts even if antibodies remain.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Paid coaching programs oversell outcomes — ask for conflict of interest.',
      'Stopping meds without flare-free year + doctor agreement risks relapse.',
    ],
    sources: [
      { label: 'Wahls Protocol — published MS study (small n)', url: 'https://pubmed.ncbi.nlm.nih.gov/25577297/' },
    ],
  },
  {
    id: 'safety-labs-specialist-care',
    title: 'Safety rails — labs, specialists & when herbs lose',
    category: 'research-context' as AutoimmuneCategory,
    summary:
      'Holistic exploration succeeds when anchored to rheumatology, endocrinology, neurology, or gastroenterology monitoring. Baseline and follow-up: CBC, CMP, CRP/ESR, disease-specific antibodies, imaging. If CRP rises or function declines while “going natural,” escalate standard care immediately.',
    whenPeopleExplore:
      'Choosing naturopath only, or shame about needing biologics.',
    approaches: [
      'One specialist quarterback; integrative providers communicate in writing.',
      'Carry updated med/herb list to every appointment.',
      'Red flags: weight loss, hemoptysis, hematuria, neurologic deficits — ER, not herbs.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Naturopathic licensure varies by state — verify training.',
      'Delaying cancer workup for “detox” misses lymphoma masquerading as autoimmune.',
    ],
    sources: [
      { label: 'ACR — finding a rheumatologist', url: 'https://rheumatology.org/patients/find-a-rheumatologist' },
    ],
  },
];

export const AUTOIMMUNE_LIBRARY = applyAutoimmuneExpanded(AUTOIMMUNE_LIBRARY_BASE);

export const AUTOIMMUNE_CATEGORY_ORDER: AutoimmuneCategory[] = [
  'conditions',
  'gut-terrain',
  'mitochondria-light',
  'environment-emf',
  'international-traditions',
  'diet-protocols',
  'nervous-system',
  'plant-allies',
  'research-context',
];

export function matchesAutoimmuneCategory(topic: AutoimmuneTopic, category: AutoimmuneCategory | 'all'): boolean {
  if (category === 'all') return true;
  return topic.category === category;
}
