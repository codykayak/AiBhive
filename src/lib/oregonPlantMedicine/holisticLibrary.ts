import type { HolisticCategory, HolisticTopic } from './holisticTypes';

export const HOLISTIC_LIBRARY: HolisticTopic[] = [
  {
    id: 'parasite-cleanse-overview',
    title: 'Parasite cleanse — educational overview',
    category: 'detox',
    summary:
      'What herbalists and integrative practitioners mean by “parasite protocols,” common botanicals discussed, and why medical diagnosis matters before any cleanse.',
    whenPeopleExplore:
      'Travel history, persistent GI symptoms, or interest in traditional anthelmintic herbs — always confirm with stool testing and a clinician.',
    approaches: [
      'Wormwood, black walnut hull, and clove are classic trio herbs in folk protocols (often as short-term tincture blends).',
      'Dietary support: bitter greens, garlic, pumpkin seeds — discussed as adjuncts, not cures.',
      'Cycle-based protocols with rest periods; aggressive continuous use is discouraged in reputable herbal literature.',
    ],
    relatedPlantIds: ['oregon-grape', 'wild-mint', 'yarrow'],
    safetyWarnings: [
      'Wormwood contains thujone — avoid in pregnancy and with seizure disorders.',
      'Never self-treat with veterinary or livestock dewormers.',
      'Fever, blood in stool, or weight loss require medical evaluation — not an herbal cleanse alone.',
    ],
    sources: [
      {
        label: 'CDC — Parasites',
        url: 'https://www.cdc.gov/parasites/',
        description: 'When to seek testing and treatment.',
      },
    ],
  },
  {
    id: 'heavy-metal-detox-support',
    title: 'Heavy metal detox — gentle support (not chelation)',
    category: 'detox',
    summary:
      'Educational overview of how clinicians approach lead, mercury, and arsenic exposure — and what supportive foods and binders are discussed versus prescription chelation.',
    whenPeopleExplore:
      'Old housing paint, occupational exposure, dental amalgam concerns, or fish consumption worries.',
    approaches: [
      'Confirmed elevation is treated with medical chelation under supervision — not DIY high-dose supplements.',
      'Supportive foods discussed: crucifers, cilantro (controversial), fiber-rich meals to reduce reabsorption.',
      'Sweating, hydration, and reducing ongoing exposure sources come first.',
    ],
    relatedPlantIds: ['dandelion', 'burdock', 'cleavers'],
    safetyWarnings: [
      'Do not use high-dose chlorella, ALA, or DMSA without practitioner oversight.',
      'Mobilizing metals without excretion pathways can worsen symptoms.',
      'Children and pregnant people need specialist care only.',
    ],
    sources: [
      {
        label: 'ATSDR — Toxic substances',
        url: 'https://www.atsdr.cdc.gov/',
      },
    ],
  },
  {
    id: 'seasonal-spring-detox',
    title: 'Seasonal spring detox & bitter tonics',
    category: 'detox',
    summary:
      'Traditional spring “blood cleansing” with bitter roots and greens — supporting liver and lymph after winter, not extreme fasting.',
    whenPeopleExplore:
      'Sluggish digestion after winter, interest in dandelion/chicory coffee substitutes, or gentle liver support.',
    approaches: [
      'Bitter greens and roots (dandelion, burdock) as tea or food.',
      'Reduced processed sugar and alcohol for 2–3 weeks.',
      'Daily movement and hydration emphasized over aggressive laxatives.',
    ],
    relatedPlantIds: ['dandelion', 'burdock', 'cleavers', 'miners-lettuce'],
    safetyWarnings: [
      'Avoid drastic calorie restriction or senna-heavy “detox teas” for extended periods.',
      'Gallstones or bile duct issues — consult a doctor before strong bitters.',
    ],
    sources: [
      {
        label: 'NIH — Liver disease',
        url: 'https://www.niddk.nih.gov/health-information/liver-disease',
      },
    ],
  },
  {
    id: 'lymphatic-movement',
    title: 'Lymphatic support & dry brushing',
    category: 'modalities',
    summary:
      'Gentle practices to support circulation and lymph flow — movement, hydration, and skin brushing as discussed in naturopathic and Cayce-influenced literature.',
    whenPeopleExplore:
      'Swelling, sedentary work, post-illness fatigue, or interest in low-risk self-care rituals.',
    approaches: [
      'Walking, rebounding, and yoga twists as primary “pumps.”',
      'Dry skin brushing toward the heart before showering.',
      'Adequate protein and minerals — lymph needs osmotic balance.',
    ],
    relatedPlantIds: ['cleavers', 'red-clover', 'stinging-nettle'],
    safetyWarnings: [
      'Lymphedema or cancer history — get manual lymph drainage from a certified therapist.',
      'Do not brush broken or infected skin.',
    ],
    sources: [
      {
        label: 'Cleveland Clinic — Lymphatic system',
        url: 'https://health.clevelandclinic.org/lymphatic-system',
      },
    ],
  },
  {
    id: 'edgar-cayce-remedies-overview',
    title: 'Edgar Cayce remedies — how to use this library',
    category: 'traditions',
    summary:
      'Orientation to Cayce’s “readings” on diet, castor oil packs, and spinal health — with pointers to A.R.E. resources, not full text reproduction.',
    whenPeopleExplore:
      'Interest in holistic American folk medicine, vibrational or prayerful healing, or specific Cayce remedies heard from family.',
    approaches: [
      'Readings often combine diet, attitude, and simple physical treatments — rarely a single “magic bullet.”',
      'Castor oil packs, peanut oil rubs, and apple diets appear frequently — always check modern safety.',
      'Locate reading numbers via Edgar Cayce Foundation / A.R.E. search tools for full context.',
    ],
    relatedPlantIds: ['cottonwood', 'plantain', 'dandelion'],
    safetyWarnings: [
      'Cayce material is historical — some suggestions are outdated or unsafe by modern standards.',
      'Do not delay conventional care for serious symptoms.',
    ],
    sources: [
      {
        label: 'Edgar Cayce A.R.E.',
        url: 'https://www.edgarcayce.org/',
        description: 'Official archive and health database.',
      },
    ],
  },
  {
    id: 'castor-oil-packs',
    title: 'Castor oil packs (Cayce tradition)',
    category: 'modalities',
    summary:
      'External castor oil flannel packs over the abdomen — a staple Cayce recommendation for circulation and relaxation, not ingestion.',
    whenPeopleExplore:
      'Constipation support, menstrual cramping, or liver-area discomfort under clinician guidance.',
    approaches: [
      'Wool flannel soaked in cold-pressed castor oil, covered with plastic and heat pad for 45–60 minutes.',
      'Store flannel in a jar for reuse; wash skin afterward.',
      'Often done several evenings per week, not daily indefinitely.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Do not use during pregnancy without provider approval.',
      'Open wounds, recent surgery, or active infection over the application site — avoid.',
      'Ingesting castor oil is a strong laxative — this entry is external use only.',
    ],
    sources: [
      {
        label: 'A.R.E. — Castor oil packs',
        url: 'https://www.edgarcayce.org/',
      },
    ],
  },
  {
    id: 'atlantic-sea-salt-baths',
    title: 'Atlantic sea salt baths',
    category: 'modalities',
    summary:
      'Mineral bath soaks as discussed in Cayce readings and spa traditions — skin absorption is minimal; warmth and rest are the main benefits.',
    whenPeopleExplore:
      'Muscle soreness, stress relief, or skin conditions — as adjunct to medical treatment.',
    approaches: [
      '1–2 cups sea salt in warm bath, 20 minutes soak.',
      'Hydrate before and after; moisturize skin.',
      'Combine with Epsom salt only if tolerated — magnesium absorption is modest.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Heart conditions or dizziness — avoid very hot baths.',
      'Open eczema with cracked skin may sting — patch test.',
    ],
    sources: [],
  },
  {
    id: 'gut-microbiome-support',
    title: 'Gut microbiome & fermented foods',
    category: 'digestive',
    summary:
      'Fiber, diversity of plants, and fermented foods as foundational digestive support — the base layer before any supplement stack.',
    whenPeopleExplore:
      'Bloating, antibiotic recovery, or interest in probiotic foods.',
    approaches: [
      '30+ plant species per week goal (diversity feeds diverse microbes).',
      'Sauerkraut, kimchi, yogurt — start small if histamine sensitive.',
      'Prebiotic fibers: onions, garlic, oats — increase slowly to reduce gas.',
    ],
    relatedPlantIds: ['plantain', 'chickweed', 'wild-mint'],
    safetyWarnings: [
      'SIBO or IBD flares — fermented foods may worsen symptoms; work with a GI specialist.',
      'Home ferments must be mold-free and properly salted.',
    ],
    sources: [
      {
        label: 'NIH — Probiotics',
        url: 'https://www.nccih.nih.gov/health/probiotics-what-you-need-to-know',
      },
    ],
  },
  {
    id: 'liver-gallbladder-bitters',
    title: 'Liver & gallbladder bitters',
    category: 'digestive',
    summary:
      'Oregon grape, dandelion root, and artichoke leaf as bitter tonics discussed for bile flow and fat digestion.',
    whenPeopleExplore:
      'Heavy meals, gallbladder removal recovery (modified), or yellowish skin — jaundice needs urgent care.',
    approaches: [
      'Bitter tincture or tea 15 minutes before meals.',
      'Oregon grape (Mahonia) is a PNW native — see our plant entry for ID.',
      'Pair with whole foods and reduced fried fats.',
    ],
    relatedPlantIds: ['oregon-grape', 'dandelion', 'burdock'],
    safetyWarnings: [
      'Active gallstones can trigger colic — bitters may not be appropriate.',
      'Pregnancy — avoid strong berberine-containing herbs unless prescribed.',
    ],
    sources: [],
  },
  {
    id: 'sleep-nervous-system',
    title: 'Sleep & nervous system calm',
    category: 'nervous-system',
    summary:
      'Nervine herbs, sleep hygiene, and stress reduction — valerian, passionflower, and milky oat as commonly discussed allies.',
    whenPeopleExplore:
      'Insomnia, anxiety, or shift-work disruption — rule out sleep apnea and thyroid issues with a doctor.',
    approaches: [
      'Consistent sleep/wake times; dim light after sunset.',
      'Chamomile, lemon balm, or passionflower tea 1 hour before bed.',
      'Magnesium glycinate discussed — start low; check interactions.',
    ],
    relatedPlantIds: ['wild-mint', 'yarrow'],
    safetyWarnings: [
      'Valerian can interact with sedatives — do not combine with alcohol or benzodiazepines without guidance.',
      'Persistent insomnia over 3 weeks warrants medical evaluation.',
    ],
    sources: [
      {
        label: 'NIH — Sleep disorders',
        url: 'https://www.ninds.nih.gov/health-information/disorders/sleep-disorders',
      },
    ],
  },
  {
    id: 'immune-tonic-herbs',
    title: 'Immune tonic herbs',
    category: 'immune',
    summary:
      'Adaptogens and immunomodulators — elderberry, turkey tail, and astragalus as discussed for seasonal support, not acute infection monotherapy.',
    whenPeopleExplore:
      'Cold season prevention or recovery — not a replacement for vaccines or antibiotics when indicated.',
    approaches: [
      'Elderberry syrup for short-term use during exposure (cooked berries only).',
      'Turkey tail mushroom tea or extract — researched for adjunct immune support.',
      'Rest, vitamin D status, and protein intake remain foundational.',
    ],
    relatedPlantIds: ['elderberry', 'turkey-tail', 'usnea', 'oregon-grape'],
    safetyWarnings: [
      'Autoimmune conditions — immunostimulants may flare; consult a specialist.',
      'Raw elderberries are toxic — always heat-process.',
    ],
    sources: [],
  },
  {
    id: 'anti-inflammatory-diet',
    title: 'Anti-inflammatory eating patterns',
    category: 'digestive',
    summary:
      'Mediterranean-style whole foods, omega-3s, and reduced ultra-processed oils — the dietary backbone behind many holistic protocols.',
    whenPeopleExplore:
      'Joint pain, metabolic syndrome, or skin inflammation — work with RD or doctor for personalized plans.',
    approaches: [
      'Fatty fish, walnuts, flax, and wild greens for omega balance.',
      'Colorful berries and herbs as polyphenol sources.',
      'Minimize refined sugar and industrial seed oils.',
    ],
    relatedPlantIds: ['salmonberry', 'huckleberry', 'stinging-nettle', 'purslane'],
    safetyWarnings: [
      'Food allergies and celiac must be diagnosed — elimination diets need supervision.',
    ],
    sources: [
      {
        label: 'Harvard — Anti-inflammatory diet',
        url: 'https://www.health.harvard.edu/staying-healthy/foods-that-fight-inflammation',
      },
    ],
  },
  {
    id: 'stress-adrenal-support',
    title: 'Stress & adrenal support (adaptogens)',
    category: 'nervous-system',
    summary:
      'Rhodiola, ashwagandha, and licorice root as discussed in adaptogen literature — for resilience, not to mask burnout.',
    whenPeopleExplore:
      'Fatigue, feeling “wired and tired,” or high cortisol from chronic stress.',
    approaches: [
      'Sleep and boundary-setting first — herbs are adjunct.',
      'Short cycles of adaptogens with breaks; rotate rather than mega-dose.',
      'Licorice only if blood pressure is normal and monitored.',
    ],
    relatedPlantIds: ['licorice-fern', 'turkey-tail', 'stinging-nettle'],
    safetyWarnings: [
      'Hypertension — avoid licorice.',
      'Thyroid medication interactions with ashwagandha — check with pharmacist.',
    ],
    sources: [],
  },
  {
    id: 'skin-topical-botanicals',
    title: 'Skin support — topical botanicals',
    category: 'modalities',
    summary:
      'Plantain, calendula, and cottonwood bud salves for minor cuts, insect bites, and dry skin — external use fundamentals.',
    whenPeopleExplore:
      'Summer bug bites, minor scrapes, or eczema flares — severe infection needs antibiotics.',
    approaches: [
      'Plantain spit poultice or salve for stings (field first aid).',
      'Calendula oil for dry or irritated skin.',
      'Cottonwood balm (balm of Gilead) for cracked winter skin.',
    ],
    relatedPlantIds: ['plantain', 'cottonwood', 'yarrow'],
    safetyWarnings: [
      'Deep wounds, spreading redness, or fever — seek urgent care.',
      'Patch-test new salves; nut oils if allergic.',
    ],
    sources: [],
  },
  {
    id: 'hydrotherapy-basics',
    title: 'Hydrotherapy basics',
    category: 'modalities',
    summary:
      'Contrast showers, foot baths, and compresses — simple water therapies from naturopathic and Cayce traditions.',
    whenPeopleExplore:
      'Circulation, mild congestion, or muscle recovery.',
    approaches: [
      'Hot-cold shower finishes (30 sec cold) for alertness — avoid if heart issues.',
      'Warm foot bath with mustard or ginger powder for chills.',
      'Cool compress on forehead for headache alongside hydration.',
    ],
    relatedPlantIds: ['wild-mint', 'stinging-nettle'],
    safetyWarnings: [
      'Raynaud’s, neuropathy, or cardiovascular disease — skip extreme temperature swings.',
    ],
    sources: [],
  },
  {
    id: 'fasting-overview',
    title: 'Fasting — educational overview',
    category: 'modalities',
    summary:
      'Time-restricted eating and medically supervised fasting — benefits and risks without promoting extended unsupervised fasts.',
    whenPeopleExplore:
      'Weight management, metabolic health, or spiritual fasting traditions.',
    approaches: [
      '12–14 hour overnight fast is low risk for many healthy adults.',
      'Longer fasts require medical supervision and electrolyte monitoring.',
      'Break fasts gently with broth and cooked vegetables.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Diabetes, eating disorders, pregnancy — fasting contraindicated without team care.',
      'Dizziness or fainting — stop and eat.',
    ],
    sources: [],
  },
  {
    id: 'oregon-psilocybin-law-safety',
    title: 'Oregon psilocybin — law, safety & field ID',
    category: 'legal-safety',
    summary:
      'Measure 109 licensed services, federal law, wild wood-lover identification, and deadly look-alikes — educational reference, not cultivation.',
    whenPeopleExplore:
      'Legal therapeutic access in Oregon, or wild foraging curiosity in the PNW.',
    approaches: [
      'Licensed facilitation centers for legal psilocybin services in Oregon.',
      'Wild ID requires spore prints and expert confirmation — see mushroom library.',
      'Federal Schedule I status remains — understand travel and employment implications.',
    ],
    relatedPlantIds: ['psilocybe-cyanescens', 'psilocybe-azurescens', 'amanita-muscaria'],
    safetyWarnings: [
      'Never eat a wild mushroom without 100% ID.',
      'This library does not include cultivation instructions.',
    ],
    sources: [
      {
        label: 'Oregon Psilocybin Services',
        url: 'https://www.oregon.gov/oha/Pages/Psilocybin-Services.aspx',
      },
    ],
    pdfLinks: [
      {
        title: 'Oregon Psilocybin — Law, Safety & Field ID (PDF)',
        pdfUrl: '/oregon-plant-medicine/guides/oregon-psilocybin-law-id-safety.pdf',
        description: 'Extended reference — law, wild species, look-alikes.',
      },
    ],
  },
  {
    id: 'wild-mushroom-safety',
    title: 'Wild mushroom foraging safety',
    category: 'legal-safety',
    summary:
      'The four pillars: 100% ID, start with easy species, learn look-alikes first, and keep a sample when trying something new.',
    whenPeopleExplore:
      'Beginning mushroom foraging in Oregon or Northern California.',
    approaches: [
      'Join a local mycological society for guided walks.',
      'Spore print every unknown — color and shape matter.',
      'Cook all wild mushrooms thoroughly; some are toxic raw.',
    ],
    relatedPlantIds: ['chanterelle', 'morel', 'amanita-muscaria'],
    safetyWarnings: [
      'Amanita phalloides (death cap) grows in the PNW — learn it before anything else.',
      'Alcohol + ink caps (Coprinopsis) cause sickness — know interaction species.',
    ],
    sources: [
      {
        label: 'North American Mycological Association',
        url: 'https://namyco.org/',
      },
    ],
  },
  {
    id: 'womens-cycle-herbs',
    title: "Women's cycle support — gentle herbs",
    category: 'immune',
    summary:
      'Raspberry leaf, nettle, and cramp bark as discussed for menstrual comfort — not hormone replacement.',
    whenPeopleExplore:
      'Cramping, heavy flow, or perimenopause symptom research.',
    approaches: [
      'Red raspberry leaf tea in second half of cycle (traditional timing).',
      'Nettle infusion for iron-rich mineral support.',
      'Heat, magnesium, and movement alongside herbs.',
    ],
    relatedPlantIds: ['stinging-nettle', 'yarrow', 'red-clover'],
    safetyWarnings: [
      'Pregnancy — many uterine herbs are contraindicated; consult midwife or OB.',
      'Bleeding between periods or clots larger than a quarter — medical evaluation.',
    ],
    sources: [],
  },
  {
    id: 'mens-vitality-tonics',
    title: "Men's vitality & prostate-aware herbs",
    category: 'immune',
    summary:
      'Saw palmetto, nettle root, and pumpkin seeds as discussed for urinary comfort — PSA screening still essential.',
    whenPeopleExplore:
      'Nighttime urination or interest in traditional male tonics.',
    approaches: [
      'Pumpkin seed zinc and beta-sitosterols from food.',
      'Nettle root tea as discussed in European phytotherapy.',
      'Exercise and pelvic floor health for urinary symptoms.',
    ],
    relatedPlantIds: ['stinging-nettle', 'burdock'],
    safetyWarnings: [
      'Rising PSA or urinary retention — urology visit, not herbs alone.',
      'Hormone-sensitive cancers — avoid unsupervised phytoestrogen stacks.',
    ],
    sources: [],
  },
  {
    id: 'children-gentle-remedies',
    title: "Children's gentle remedies — caution first",
    category: 'nervous-system',
    summary:
      'Age-appropriate doses, honey restrictions under 1 year, and when to call the pediatrician — herbs are last resort for kids.',
    whenPeopleExplore:
      'Colic, teething, or cold symptoms in children.',
    approaches: [
      'Chamomile tea in very dilute form for older infants (provider approved).',
      'Honey only after 12 months — botulism risk.',
      'Hydration and rest outperform most supplements for viral colds.',
    ],
    relatedPlantIds: ['wild-mint'],
    safetyWarnings: [
      'Never give adult doses to children — weight-based dosing with a pediatric herbalist.',
      'Fever in infants under 3 months — emergency care.',
    ],
    sources: [
      {
        label: 'AAP — When to call the doctor',
        url: 'https://www.healthychildren.org/',
      },
    ],
  },
  {
    id: 'mold-environmental-sensitivity',
    title: 'Mold & environmental sensitivity',
    category: 'detox',
    summary:
      'Indoor air quality, HEPA filtration, and leaving contaminated environments — herbs do not replace remediation.',
    whenPeopleExplore:
      'Musty smell, chronic sinus issues after water damage, or CIRS discussions online.',
    approaches: [
      'Professional mold inspection and remediation first.',
      'HEPA air purifiers and dehumidifiers in damp climates.',
      'Binders like cholestyramine are prescription — not DIY.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Immunosuppressed individuals — avoid disturbing mold without PPE and pros.',
    ],
    sources: [
      {
        label: 'EPA — Mold',
        url: 'https://www.epa.gov/mold',
      },
    ],
  },
  {
    id: 'dental-mercury-awareness',
    title: 'Dental mercury awareness',
    category: 'detox',
    summary:
      'Amalgam removal protocols discussed in holistic dentistry — only with rubber dam and proper ventilation, not fear-based extraction.',
    whenPeopleExplore:
      'Considering amalgam removal before pregnancy or due to sensitivity concerns.',
    approaches: [
      'IAOMT-trained dentist for safe removal if elected.',
      'Pretreatment antioxidant support discussed — not high-dose chelation same day.',
      'Composite alternatives — discuss biocompatibility testing if reactive.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Pregnant or nursing — defer elective amalgam removal unless urgent.',
      'Do not take unsupervised chelators around dental work.',
    ],
    sources: [
      {
        label: 'FDA — Dental amalgam',
        url: 'https://www.fda.gov/medical-devices/dental-devices/dental-amalgam',
      },
    ],
  },
  {
    id: 'anxiety-herbal-nervines',
    title: 'Anxiety & herbal nervines',
    category: 'nervous-system',
    summary:
      'Skullcap, lemon balm, and milky oat seed as gentle anxiolytics — therapy and crisis lines remain primary for severe anxiety.',
    whenPeopleExplore:
      'Daily worry, social anxiety, or adjunct support alongside counseling.',
    approaches: [
      'Lemon balm tea during afternoon stress windows.',
      'Milky oat (Avena sativa) tincture for nervous exhaustion.',
      'Breathwork and CBT skills in parallel with herbs.',
    ],
    relatedPlantIds: ['wild-mint', 'yarrow', 'stinging-nettle'],
    safetyWarnings: [
      'Suicidal thoughts — call 988 (US) immediately; herbs are not enough.',
      'SSRI interactions with St. John’s wort — avoid stacking without pharmacist review.',
    ],
    sources: [
      {
        label: '988 Suicide & Crisis Lifeline',
        url: 'https://988lifeline.org/',
      },
    ],
  },
  {
    id: 'colon-fiber-hydration',
    title: 'Colon health — fiber, hydration & movement',
    category: 'digestive',
    summary:
      'The non-sexy foundation: water, soluble fiber, and walking — before laxatives or aggressive cleanses.',
    whenPeopleExplore:
      'Constipation, diverticulosis prevention, or post-antibiotic bowel changes.',
    approaches: [
      '25–35 g fiber daily from food; increase slowly.',
      'Ground flax or psyllium with plenty of water.',
      'Morning walk to stimulate peristalsis.',
    ],
    relatedPlantIds: ['plantain', 'dandelion', 'burdock'],
    safetyWarnings: [
      'Blood in stool, unexplained weight loss, or pencil-thin stools — colonoscopy referral.',
      'Bowel obstruction symptoms — emergency care.',
    ],
    sources: [],
  },
];

export const HOLISTIC_CATEGORY_ORDER: HolisticCategory[] = [
  'detox',
  'digestive',
  'immune',
  'nervous-system',
  'traditions',
  'modalities',
  'legal-safety',
];

export function getHolisticTopic(id: string): HolisticTopic | undefined {
  return HOLISTIC_LIBRARY.find((t) => t.id === id);
}

export function matchesHolisticCategory(topic: HolisticTopic, category: HolisticCategory | 'all'): boolean {
  if (category === 'all') return true;
  return topic.category === category;
}
