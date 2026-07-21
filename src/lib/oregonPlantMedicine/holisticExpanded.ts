import { commonsImage } from './commonsImage';

type ExpandedFields = {
  imageUrl: string;
  imageCredit?: string;
  deepDive: string;
};

const W = {
  herbs: commonsImage('Herbal medicine in white bowls.jpg'),
  dandelion: commonsImage('Dandelion-2005-03-13 edit.jpg'),
  liver: commonsImage('Liver annotated.jpg'),
  gut: commonsImage('Digestive system diagram en.svg'),
  sleep: commonsImage('Sleeping baby in a teddy bear themed blanket.jpg'),
  immune: commonsImage('Sambucus nigra 002.JPG'),
  diet: commonsImage('Mediterranean diet.jpg'),
  stress: commonsImage('Ashwagandha Withania somnifera.jpg'),
  skin: commonsImage('Calendula officinalis flowers.jpg'),
  water: commonsImage('Large drop.jpg'),
  fasting: commonsImage('IF breakfast.jpg'),
  legal: commonsImage('Balance - Scales of Justice (PSF).png'),
  mushroom: commonsImage('Ganoderma oregonense 02.jpg'),
  plant: commonsImage('Mahonia aquifolium.jpg'),
  castor: commonsImage('Castor oil bottle.jpg'),
  bath: commonsImage('Salt baths at the Dead Sea.jpg'),
  cayce: commonsImage('Cayce 1910.jpg'),
  detox: commonsImage('Activated charcoal tablets.jpg'),
};

export const HOLISTIC_TOPIC_EXPANDED: Record<string, ExpandedFields> = {
  'parasite-cleanse-overview': {
    imageUrl: W.herbs,
    imageCredit: 'Herbal medicine — Wikimedia Commons',
    deepDive: `The phrase "parasite cleanse" circulates widely in wellness culture, but herbalists and integrative clinicians mean something more specific than the dramatic imagery suggests. The classic folk trio — wormwood (Artemisia absinthium), black walnut hull (Juglans nigra), and clove — has roots in Ayurvedic, European, and Native American traditions. Wormwood contains sesquiterpene lactones thought to disrupt certain parasite membranes; clove provides eugenol with antimicrobial properties; black walnut hull contains juglone, a natural phenol. These are studied botanicals, not magic bullets, and their effectiveness against specific parasites varies widely.

The critical first step is diagnosis. Stool ova-and-parasite tests, PCR panels for Giardia or Cryptosporidium, and blood antibody panels can identify actual infections. Self-treating suspected parasites without confirmation is an expensive gamble at best; delaying care for pinworm, hookworm, or Giardia can prolong suffering when simple prescription treatments exist. Dietary adjuncts — raw pumpkin seeds for their cucurbitacin content, papaya seeds, and garlic — are frequently discussed as food-based support between or after a supervised protocol.

Cycle-based protocols (three weeks on, one week off) appear in serious herbal texts to address life stages of various organisms. Reputable formulations from established herbal companies carry dosing guidelines with caution windows for pregnancy, liver disease, and seizure disorders. Wormwood is particularly significant: thujone content varies by species, and continuous high-dose use carries toxicity risk. This is not medical advice, and any suspicion of systemic parasitic infection — especially with travel history, fever, diarrhea, or unexplained weight loss — requires physician evaluation, stool testing, and when warranted, prescription treatment. This library entry is educational context for curious minds, not a protocol.`,
  },

  'heavy-metal-detox-support': {
    imageUrl: W.detox,
    imageCredit: 'Activated charcoal — Wikimedia Commons',
    deepDive: `Heavy metals — lead, mercury, arsenic, cadmium, and others — accumulate in tissue through occupational exposure, old paint, contaminated water, fish consumption, or dental amalgam. True medical chelation involves prescription agents such as DMSA (dimercaptosuccinic acid) or EDTA, administered by a physician after blood or urine testing confirms clinically significant elevation. These protocols carry real risks — they mobilize metals and must be coupled with adequate excretion pathways, hydration, and monitoring. Self-directed high-dose chelation outside a clinical setting can redistribute metals into vulnerable tissues including the brain.

What integrative practitioners discuss as "supportive" approaches are distinct from chelation: reducing ongoing exposure is step one. Avoid old lead paint and test water in pre-1986 plumbing. Reduce large predatory fish if eating frequently. For mercury-exposed individuals, crucifers (broccoli, arugula, Brussels sprouts) support glutathione synthesis, the liver's primary detox molecule. Soluble fiber — pectin from apples and psyllium — binds some metals in the gut and limits reabsorption from bile. Chlorella and cilantro circulate widely in wellness content; the evidence for their chelating ability at food doses is weak, and high-dose chlorella is not without GI side effects.

In Oregon and the Pacific Northwest, fishing communities and agricultural workers may have specific exposure profiles worth discussing with occupational health specialists or naturopathic doctors trained in environmental medicine. Children with any measured elevation of blood lead should be under pediatric specialist care — no herbal protocol substitutes. This entry is a starting orientation: get tested if exposure history is real, address the source first, and use supportive nutrition as exactly that — support alongside, not instead of, appropriate medical workup.`,
  },

  'seasonal-spring-detox': {
    imageUrl: W.dandelion,
    imageCredit: 'Dandelion — Wikimedia Commons',
    deepDive: `Spring detox traditions predate modern nutritional science. European and indigenous peoples across the Northern Hemisphere reached for early-emerging bitter greens after winter — dandelion, burdock, chickweed, cleavers, and nettles — partly from necessity and partly from accumulated folk wisdom that bitterness stimulates bile flow and liver function. In naturopathic and Eclectic medical traditions, "blood cleansing" referred to supporting the organs of elimination — liver, kidneys, bowels, skin, and lymph — after months of denser winter food.

Dandelion root (Taraxacum officinale) is the Pacific Northwest's most accessible bitter tonic. It appears in disturbed ground from sea level to foothills, unmistakable in early spring. The root contains inulin, a prebiotic fiber that feeds beneficial gut bacteria; bitter compounds (taraxacin) stimulate bile production and help emulsify dietary fats. Young leaves are edible as salad greens, and roasted root makes a coffee substitute. Burdock (Arctium lappa), naturalized across Oregon, offers a milder bitter with insulin-like fructooligosaccharides beneficial for blood sugar metabolism.

A practical spring protocol doesn't require anything extreme: two to three weeks of reduced alcohol, processed sugar, and industrial seed oils combined with daily bitter greens, adequate hydration, and increased walking covers most of what traditional spring tonics targeted. Aggressive laxative teas sold commercially — often heavy in senna or cascara — are not traditional spring medicine; they cause electrolyte imbalance when overused. For anyone with gallstones, bile duct obstruction, or active liver disease, strong bitters may be inappropriate — always a conversation with your provider first. This is seasonal self-care with real botanical allies, not a medical cleanse.`,
  },

  'lymphatic-movement': {
    imageUrl: W.water,
    imageCredit: 'Water — Wikimedia Commons',
    deepDive: `The lymphatic system is often called the body's second circulatory system, but it has no dedicated pump. Unlike blood, lymph moves through one-way valves propelled entirely by muscle contraction, breathing, and gentle pressure gradients. This means sedentary living is its enemy. Naturopathic physicians, manual lymph drainage therapists, and wellness educators all converge on the same basic point: movement is the primary lymph medicine.

Walking, yoga, rebounding on a mini trampoline, and swimming activate skeletal muscles rhythmically, squeezing lymph vessels and driving fluid toward the thoracic duct for filtration and return to circulation. Deep diaphragmatic breathing — belly breaths that push down against abdominal organs — creates pressure waves that move lymph in the thoracic cavity. These are free interventions with zero risk for most people.

Dry skin brushing, popularized in Cayce readings and European spa traditions, uses a natural bristle brush in long strokes toward the heart before showering. The research evidence is modest; the parasympathetic relaxation response from the ritual itself likely contributes. Herbal allies discussed in lymphatic contexts include cleavers (Galium aparine), a cool, moist spring plant that trails through PNW stream margins; red clover; and calendula. These are traditionally considered "lymphagogues" — herbs that encourage lymph movement — though human trial data is sparse.

Lymphedema, a diagnosed condition of chronic lymph fluid accumulation usually following cancer surgery or radiation, requires certified manual lymph drainage therapy and compression garments — not dry brushing or tinctures. Swelling in a single limb, especially after breast or pelvic cancer treatment, is a medical matter. For everyone else, the prescription is refreshingly simple: move your body, breathe deeply, and drink enough water.`,
  },

  'edgar-cayce-remedies-overview': {
    imageUrl: W.cayce,
    imageCredit: 'Edgar Cayce 1910 — Wikimedia Commons',
    deepDive: `Edgar Cayce (1877–1945) was a Kentucky-born photographer who entered voluntary self-hypnosis thousands of times over his life, dictating detailed health readings while reportedly unconscious. Those readings — preserved by the Edgar Cayce Foundation and accessible through the Association for Research and Enlightenment (A.R.E.) in Virginia Beach, Virginia — recommended a remarkably consistent set of interventions: castor oil packs, osteopathic spinal adjustments, dietary modification toward alkaline foods, peanut oil massage, the "apple diet" for liver flushing, and attitudinal prayer.

What makes Cayce unusual as a historical figure is that many of his recommendations — emphasizing whole foods, avoiding fried fats, supporting the liver and bowels, and maintaining spinal alignment — resemble modern integrative medicine even though the metaphysical framing is very different. The A.R.E. health database allows researchers to search readings by diagnosis keyword and cross-reference suggestions; this is the proper way to engage with Cayce material, not through social media summaries.

Modern practitioners approach Cayce historically. Some suggestions are outdated or contradicted by current safety data — his recommendations were for specific named individuals, not the general public, and should not be applied directly without professional interpretation. A.R.E. explicitly cautions against treating readings as prescriptions. The value for contemporary readers is contextual: a window into early twentieth-century mind-body holistic thought, a record of consistent dietary and manual therapy principles, and a stimulus for inquiry. For serious illness, his legacy is best honored by pairing historical curiosity with licensed medical and naturopathic care — exactly as the A.R.E. recommends.`,
  },

  'castor-oil-packs': {
    imageUrl: W.castor,
    imageCredit: 'Castor oil — Wikimedia Commons',
    deepDive: `Castor oil packs are among the most durable recommendations in the Cayce canon and have been adopted by naturopathic physicians as a gentle, low-risk supportive therapy. The procedure involves saturating a piece of wool or cotton flannel with cold-pressed castor oil, placing it over the right abdomen (liver area) or wherever directed, covering it with a layer of plastic wrap, and applying gentle heat from a heating pad for forty-five to sixty minutes while resting.

The oil itself — pressed from Ricinus communis seeds — contains ricinoleic acid, a fatty acid with documented anti-inflammatory properties in topical animal studies. Proposed mechanisms for pack benefits include increased local circulation, stimulation of the hepatic-portal system, and lymphatic movement. Controlled human trial data is limited, but practitioners and patients report benefits for constipation, abdominal cramping, menstrual discomfort, and post-illness fatigue when used as an adjunct to other care.

Practical protocol: use organic, cold-pressed, hexane-free oil; store the flannel in a glass jar between uses (add a few drops of oil if it dries); wash the skin thoroughly afterward to avoid irritation. Packs are typically used three to four evenings per week during a support period, not continuously indefinitely. The experience is deeply relaxing — warm, still, quiet time that independently supports the parasympathetic nervous system.

This is external use only. Ingesting castor oil is a powerful laxative with very different dose dynamics and risks. Do not apply packs during pregnancy without provider guidance, over fresh wounds, surgical sites, or active skin infections, or over tumors without an integrative oncologist's clearance. Consider castor oil packs a restorative self-care ritual, not a treatment for pathology.`,
  },

  'atlantic-sea-salt-baths': {
    imageUrl: W.bath,
    imageCredit: 'Salt baths — Wikimedia Commons',
    deepDive: `Mineral salt baths appear across healing traditions worldwide — from the Dead Sea bathers of biblical times to Japanese onsen to the Cayce readings that frequently prescribed salt and soda soaks for skin, joint, and nervous system conditions. Atlantic sea salt, Himalayan pink salt, and Epsom salts (magnesium sulfate) each carry different mineral profiles and different claims. What the science most confidently supports is the bath itself: warm water immersion induces parasympathetic activation, lowers cortisol, eases muscle tension, and improves sleep onset when taken in the evening.

Transdermal mineral absorption from baths is modest and difficult to study, but not zero. Magnesium, in particular, has been studied via Epsom salt baths with some evidence of skin absorption sufficient to raise red blood cell magnesium levels. For many people who are dietary-magnesium-insufficient — a common condition given processed food diets — a weekly soak may contribute usefully alongside dietary sources. Sea salt provides trace iodine, bromide, and magnesium but in lower concentration per volume than Epsom formulations.

Edgar Cayce's recommendations for salt-and-soda baths (often equal parts sea salt and baking soda) were typically prescribed for skin conditions and "body purification." The alkalinizing bath environment may temporarily soothe itch and irritation. Cayce often paired these baths with his full protocol — castor oil packs, dietary changes, and rest — so attributing outcomes to any single element is speculative.

Practical guidance: one to two cups of sea salt in a warm bath for twenty minutes, with adequate hydration before and after. Moisturize the skin afterward as salts can be mildly drying. Those with heart disease, uncontrolled hypertension, or open skin lesions should consult their provider before hot or heavily mineralized baths.`,
  },

  'gut-microbiome-support': {
    imageUrl: W.gut,
    imageCredit: 'Digestive system — Wikimedia Commons',
    deepDive: `The gut microbiome — the roughly 38 trillion bacterial cells living primarily in the colon — has become one of the most intensively researched frontiers in medicine over the past two decades. What emerged from landmark studies including the Human Microbiome Project is that diversity is the foundation: people who eat a wide variety of plant foods consistently show more diverse, resilient microbial communities than those eating narrow, processed diets. Researchers at the British Gut Project popularized the "30 plants per week" target — not 30 large servings, but 30 distinct species including herbs, spices, nuts, seeds, legumes, vegetables, fruits, and whole grains.

Fermented foods add live organisms alongside microbial metabolites. Sauerkraut, kimchi, plain yogurt, kefir, and water kefir provide lactobacilli and bifidobacteria alongside the food matrix that carries them. A Stanford study in 2021 showed that high-fermented-food diets increased microbiome diversity faster than high-fiber diets alone; the two approaches appear synergistic. Start with small portions if histamine sensitivity or SIBO is suspected — fermented foods can exacerbate symptoms in those conditions.

Prebiotic fibers — inulin and fructooligosaccharides in onion, garlic, leeks, Jerusalem artichoke, dandelion root, and oats — feed existing beneficial bacteria rather than adding new ones. Increasing these foods too rapidly causes gas and bloating; a gradual ramp over three to four weeks is kinder to the gut. Polyphenol-rich foods (berries, dark leafy greens, herbs, coffee, dark chocolate) feed specific beneficial species including Akkermansia muciniphila, associated with gut-lining integrity.

No single supplement replaces dietary diversity. Probiotic capsules are useful adjuncts during antibiotic courses or for specific conditions, but the evidence base is strain- and condition-specific. Work with a registered dietitian for IBS, IBD, or SIBO.`,
  },

  'liver-gallbladder-bitters': {
    imageUrl: W.liver,
    imageCredit: 'Liver anatomy — Wikimedia Commons',
    deepDive: `Bitter taste receptors (TAS2Rs) in the mouth, esophagus, stomach, and small intestine trigger a cascade of digestive preparation: increased saliva, gastric acid secretion, bile release from the gallbladder, and pancreatic enzyme output. This "bitter reflex" was evolutionarily essential for triggering complete digestion when humans ate wild, varied, bitter-tasting plants. Modern diets, engineered toward sweetness, have removed most dietary bitterness — and many integrative practitioners believe this contributes to sluggish digestion, fat malabsorption, and gallbladder stagnation.

Oregon grape (Mahonia aquifolium and M. nervosa) is the Pacific Northwest's signature liver bitter. The bright yellow inner bark and root contain berberine, one of the most studied plant alkaloids with demonstrated effects on bile secretion, gut microbiome modulation, and glucose metabolism. It is a genuinely potent botanical — respected as medicine in multiple traditions (Ayurveda uses barberry, a close relative; Traditional Chinese Medicine uses huang lian) — and should be used thoughtfully. Small amounts in tincture form fifteen minutes before large meals stimulate bile flow; high doses over long periods affect gut flora significantly.

Dandelion root adds gentler bile-stimulating bitter compounds alongside inulin prebiotic fiber. Artichoke leaf extract (Cynara scolymus) has the strongest clinical trial evidence among liver bitters for functional dyspepsia and fat digestion. Milk thistle (Silybum marianum), while commonly grouped with liver herbs, is primarily hepatoprotective — it supports liver cell membrane integrity rather than bile stimulation, making it more relevant for recovery from liver stress than for digestive bitters work.

Active gallstones change the calculation: strong bitters can trigger biliary colic by stimulating forceful gallbladder contraction against an obstructed duct. Jaundice, right upper-quadrant pain, or dark urine are medical urgencies — not a call for more dandelion tea.`,
  },

  'sleep-nervous-system': {
    imageUrl: W.sleep,
    imageCredit: 'Sleep — Wikimedia Commons',
    deepDive: `Sleep is arguably the most important holistic health intervention — the process during which the brain clears metabolic waste via the glymphatic system, consolidates memory, regulates immune function, and resets cortisol rhythms. Before turning to any herbal or supplement approach, the evidence-based framework of sleep hygiene deserves full implementation: consistent rise and bed times anchored to circadian rhythm, elimination of blue light two hours before bed, a cool sleeping environment (65–68°F is near-optimal for most adults), and avoiding alcohol, which suppresses REM sleep even at moderate amounts.

The nervine herbs most consistently discussed for sleep support cluster around sedative and anxiolytic mechanisms. Valerian root (Valeriana officinalis) has several randomized controlled trials showing modest reduction in sleep onset time and improved subjective sleep quality; it appears to bind GABA-A receptors. Passionflower (Passiflora incarnata) has emerging evidence for mild anxiolytic effects via the same pathway. Lemon balm (Melissa officinalis) paired with valerian outperforms valerian alone in some trial designs. Hops strobiles provide 2-methyl-3-buten-2-ol when dried, a mild sedative compound.

In the Pacific Northwest, California poppy (Eschscholzia californica) grows wild in west-side meadows and gardens — a gentle alkaloid-containing nervine with a mild sedative reputation appropriate for adults, distinct from opium poppy and without the same risk profile. Skullcap (Scutellaria lateriflora) is a North American wood-edge plant used by Eclectic physicians for nervous exhaustion and racing thoughts.

Magnesium glycinate and L-theanine are non-herbal supplements with reasonable supporting evidence for sleep onset. Rule out sleep apnea (especially with snoring, morning headache, or daytime fatigue) and thyroid dysfunction before pursuing long-term supplementation. Valerian-GABA combinations should not be stacked with benzodiazepines or alcohol without pharmacist review.`,
  },

  'immune-tonic-herbs': {
    imageUrl: W.immune,
    imageCredit: 'Elderberry — Wikimedia Commons',
    deepDive: `Immune tonic herbs sit in a category sometimes called immunomodulators — they don't simply stimulate the immune system but appear to help it calibrate. This distinction matters: for someone with an already overactive immune response (autoimmune conditions, allergies), pure immunostimulants may worsen inflammation. The most evidence-supported group includes medicinal mushrooms and certain root adaptogens, studied for their polysaccharide and beta-glucan content.

Elderberry (Sambucus nigra) is among the most researched for respiratory viral illness. Meta-analyses suggest elderberry extract reduces duration and severity of influenza and cold symptoms. Critically, berries must be cooked — raw elderberries contain cyanogenic glycosides that cause nausea and vomiting. Pacific Northwest black elderberry (S. racemosa ssp. melanocarpus) grows along stream edges throughout Oregon and Washington; harvest ripe black or blue-black berries only, not the red-berried species more common at high elevation.

Turkey tail mushroom (Trametes versicolor) may be the most clinically studied PNW immune herb, appearing on virtually every dead log in our region as overlapping fan-shaped shelves. It contains polysaccharopeptide (PSP) and polysaccharide K (PSK), the latter approved in Japan as adjunct therapy during cancer chemotherapy. Tea from simmered turkey tail is one of the most accessible and well-researched herbal preparations a Pacific Northwesterner can make.

Astragalus root (Astragalus membranaceus) from Traditional Chinese Medicine and Echinacea from North American herbalism round out the commonly discussed tonics. Rest, adequate protein, vitamin D status (notoriously low in overcast Pacific Northwest winters), and zinc are the nutritional foundations on which all herbal immune support builds. Vaccines and antibiotics remain irreplaceable for their specific indications.`,
  },

  'anti-inflammatory-diet': {
    imageUrl: W.diet,
    imageCredit: 'Mediterranean diet — Wikimedia Commons',
    deepDive: `Chronic low-grade inflammation underlies cardiovascular disease, type 2 diabetes, several cancers, neurodegenerative conditions, and much of what we call metabolic syndrome. Dietary patterns that reduce inflammatory biomarkers (CRP, IL-6, TNF-alpha) are among the most studied interventions in nutritional epidemiology — and the Mediterranean dietary pattern has the strongest evidence base, supported by landmark trials including PREDIMED.

The anti-inflammatory dietary framework is not a list of forbidden foods but a pattern: emphasize fatty fish (salmon, sardines, herring) two to three times weekly for EPA and DHA; include olive oil as the primary cooking fat; eat abundant colorful vegetables and fruits for polyphenols and carotenoids; include legumes, nuts, and seeds for plant-based protein and fiber; and minimize ultra-processed foods, refined grains, and industrial omega-6 seed oils (corn, soybean, cottonseed) that skew the omega-3:6 ratio toward the inflammatory end.

In the Pacific Northwest, seasonal eating aligns naturally with this pattern. Wild Alaskan salmon from local fishmongers provides the highest omega-3 content of any common fish. Foraged nettles (spring), salmonberries, huckleberries, and Oregon crab apples contribute polyphenols and vitamin C without supplements. Purslane, a common garden "weed," is exceptionally rich in plant omega-3s (ALA).

Spices deserve mention: turmeric with black pepper (for curcumin bioavailability), ginger, rosemary, and oregano add meaningful polyphenol load to everyday cooking. Food allergy, celiac disease, and individual metabolic differences mean that no single diet is universally optimal — a registered dietitian can personalize anti-inflammatory eating to individual labs, history, and goals. Supplementing curcumin in isolation without dietary foundation is a poor substitute for whole-diet change.`,
  },

  'stress-adrenal-support': {
    imageUrl: W.stress,
    imageCredit: 'Ashwagandha — Wikimedia Commons',
    deepDive: `The term "adrenal fatigue" was popularized in wellness culture but is not a recognized medical diagnosis — adrenal insufficiency (Addison's disease) is a serious autoimmune endocrine condition requiring testing and hormone replacement. What integrative practitioners and naturopaths address is the very real phenomenon of chronic HPA-axis dysregulation: prolonged psychological stress leading to altered cortisol rhythms, disrupted sleep-wake cycles, persistent fatigue, and impaired cognitive performance. This is where adaptogen herbs have the most compelling traditional and emerging evidence.

Rhodiola rosea (arctic root) has multiple clinical trials showing reduced mental fatigue, improved attention, and modest cortisol normalization in stressed adults — it appears to inhibit monoamine oxidase and influence cortisol metabolism. Ashwagandha (Withania somnifera) has at least a dozen well-designed RCTs supporting its effects on perceived stress, morning cortisol, thyroid function, and sleep quality. It is the most studied Western adaptogen for this indication. Eleuthero (Siberian ginseng) has decades of Soviet-era research followed by more rigorous Western trials showing improved mental and physical stamina.

Licorice root (Glycyrrhiza glabra) is sometimes included for its cortisol-sparing effect (it inhibits cortisol breakdown), but it raises blood pressure at doses used for extended periods — anyone with hypertension should avoid it, and it requires blood pressure monitoring in normotensive individuals beyond four to six weeks.

These herbs are adjuncts to — not substitutes for — the structural changes that HPA dysregulation demands: adequate sleep, reduced workload, movement, and where needed, psychotherapy. "Wired and tired" people who take adaptogens without addressing sleep debt are slowing the bleeding without closing the wound. Short cycles of eight to twelve weeks with breaks, or working with a naturopathic physician for tailored protocols, produces better outcomes than indefinite mega-dosing.`,
  },

  'skin-topical-botanicals': {
    imageUrl: W.skin,
    imageCredit: 'Calendula — Wikimedia Commons',
    deepDive: `Plant-based topical preparations have a long record as first-line first aid in communities that lived close to the land. The Pacific Northwest offers extraordinary skin botanicals: plantain (Plantago major and P. lanceolata) grows in virtually every disturbed soil in Oregon, providing allantoin and aucubin — compounds with documented anti-inflammatory and wound-healing properties. A fresh plantain spit poultice applied to a bee sting or mosquito bite can reduce immediate itch and swelling within minutes — genuine field-expedient medicine that any hiker should know.

Calendula (Calendula officinalis), a garden annual that reseeds freely in Oregon, produces resin-rich orange flowers with triterpenoids, flavonoids, and polysaccharides demonstrating wound-healing, antifungal, and anti-inflammatory activity in topical clinical trials. Calendula-infused oil in olive or jojoba provides a shelf-stable base for salve-making. Cottonwood bud balm — made by infusing early spring cottonwood buds (Populus trichocarpa) in oil — produces a rich balm of Gilead containing salicylates and propolis-like compounds; it is exceptional for cracked winter skin, dry cuticles, and minor muscle discomfort.

Yarrow (Achillea millefolium) brings astringent and hemostatic properties — powdered dry leaf pressed to a minor cut slows bleeding and discourages infection. Oregon grape root ground in water or poulticed provides berberine for minor infected wounds, consistent with its use across Plateau and Coast peoples.

For chronic skin conditions — eczema, psoriasis, rosacea — topical botanicals may be comfort-supporting adjuncts, but a dermatology evaluation addresses the underlying mechanism. Deep wounds, spreading cellulitis, fever with a skin wound, or any red streak from an injury are medical emergencies requiring antibiotics. Patch-testing new preparations is essential, especially with nut-oil bases for those with tree nut allergies.`,
  },

  'hydrotherapy-basics': {
    imageUrl: W.water,
    imageCredit: 'Water — Wikimedia Commons',
    deepDive: `Hydrotherapy — the therapeutic use of water at varying temperatures and pressures — is among the oldest medical practices in human history, documented in Roman balneology, European naturopathy, Ayurvedic tradition, Japanese mizu-no-kokoro, and the Cayce readings. Modern naturopathic medical schools teach formal hydrotherapy as a core clinical skill; integrative practitioners adapt its principles for home use with excellent safety profiles for most people.

The foundation is temperature contrast. Hot water dilates peripheral blood vessels; cold water constricts them. Alternating between the two creates a pumping effect that drives circulation, clears metabolic waste from muscle tissue, and activates the sympathetic (cold) and parasympathetic (warm) nervous systems in deliberate sequence. A simple contrast shower — three minutes warm followed by thirty seconds cold, repeated twice and ending cold — improves alertness and circulation. Studies on cold immersion (popularized by Wim Hof protocols) show increased norepinephrine, improved mood, and anti-inflammatory effects; the mechanism is real, though dramatic cold plunges require careful cardiovascular screening.

Warm foot baths with dissolved ginger powder or mustard seed draw blood to the periphery, useful for cold feet, early-stage chills, and headaches with peripheral constriction. A cool compress on the forehead while feet are warm creates a therapeutic temperature gradient in classic naturopathic tradition. Constitutional hydrotherapy — alternating hot and cold towel applications to the torso by a trained practitioner — is a formal clinical procedure shown to support immune function and autonomic balance in small trials.

Those with Raynaud's syndrome, peripheral neuropathy, cardiovascular disease, or poorly controlled diabetes should consult their provider before pursuing temperature extremes. During pregnancy, avoid hot tubs and very hot baths in the first trimester. For most healthy adults, these are among the lowest-risk self-care practices available.`,
  },

  'fasting-overview': {
    imageUrl: W.fasting,
    imageCredit: 'Breakfast — Wikimedia Commons',
    deepDive: `Fasting — voluntary food restriction for defined periods — is one of the oldest health practices across virtually every spiritual tradition and is now among the most intensively studied dietary interventions in metabolic medicine. The most accessible and evidence-supported form is time-restricted eating (TRE): compressing daily food intake into an eight-to-twelve-hour window aligned with daylight hours. A twelve-hour overnight fast (eating done by 8 pm, first meal at 8 am) is achievable for most healthy adults without medical supervision and initiates hepatic glycogen depletion, ketone production, and autophagy — cellular cleanup processes that appear protective against metabolic disease.

Intermittent fasting protocols (16:8, 5:2, and alternate-day fasting) have demonstrated benefits in clinical trials: improved insulin sensitivity, modest weight reduction, reduced inflammatory markers, and in some studies improved cognitive performance. The mechanisms include reduced IGF-1 signaling, activated AMPK pathways, and increased autophagy — the same cellular processes that caloric restriction extends in animal longevity models. Whether these translate to longer human lifespans is not established.

Extended fasting — more than twenty-four hours — significantly amplifies these metabolic effects but requires more caution. Electrolyte management (sodium, potassium, magnesium) becomes essential beyond twenty-four hours. Water fasting beyond two or three days in a non-clinical setting carries meaningful risk of cardiac arrhythmia, dangerous hypoglycemia, and refeeding syndrome if broken improperly. Medically supervised multi-day fasting programs, such as the ProLon fasting-mimicking diet studied at USC, provide safety guardrails.

Absolute contraindications include type 1 diabetes without insulin adjustment, active eating disorders, pregnancy and breastfeeding, and underweight status. Type 2 diabetics on medication need close glucose monitoring. Breaking any extended fast should be done gently — clear broth, then soft cooked vegetables — not with a large meal.`,
  },

  'oregon-psilocybin-law-safety': {
    imageUrl: W.legal,
    imageCredit: 'Scales of justice — Wikimedia Commons',
    deepDive: `Oregon became the first US state to legalize supervised psilocybin therapy when voters passed Measure 109 in November 2020. The Oregon Health Authority opened the licensing framework in 2023, allowing trained facilitators to provide psilocybin sessions at licensed service centers — with no requirement for a mental health diagnosis and no prescription. This is a significant policy innovation: access is structured around set and setting, facilitator training, and integration support, not the medical model alone.

Legally, psilocybin services in Oregon must occur at licensed premises; possession and personal cultivation remain outside Measure 109's protections. Federally, psilocybin remains Schedule I — meaning federal employees, those with security clearances, or anyone entering federal land or federal jurisdiction does not have the same protections Oregon state law provides. Travel with psilocybin across state lines is federal drug trafficking regardless of Oregon licensure. Employment drug testing in Oregon may still screen for psilocybin, and employer policies vary.

For wild foraging, the Pacific Northwest is home to Psilocybe cyanescens (wavy caps, common on wood chips in urban gardens and forest margins), Psilocybe azurescens (potent, found on coastal dunes near the Columbia River mouth), and several other species. Wild identification carries serious risk: deadly Galerina marginata grows in identical habitats and at a glance resembles small brown Psilocybe species. The only reliable differentiation is expert-guided spore print examination, caps-under-microscope gill characteristics, and blue bruising (not definitive on its own). This library does not include cultivation guidance, and nothing here should be read as endorsing wild harvest without expert verification.

Integration support — therapy, journaling, and community — significantly improves long-term outcomes in psilocybin research. Oregon Psilocybin Services maintains the official facilitator and service center registry.`,
  },

  'wild-mushroom-safety': {
    imageUrl: W.mushroom,
    imageCredit: 'Ganoderma — Wikimedia Commons',
    deepDive: `Wild mushroom foraging in the Pacific Northwest offers extraordinary culinary and medicinal rewards — golden chanterelles in October Douglas-fir forests, morels emerging on burned hillsides in May, oyster mushrooms fanning from alder logs year-round. It also presents the most lethal botanical identification challenge in temperate North America. Amanita phalloides, the death cap, was introduced to the Pacific Northwest with European horticultural imports and is now established from Vancouver Island to Northern California. It causes acute liver failure within seventy-two hours of ingestion; there is no antidote and transplant is the only intervention after severe poisoning. It must be the first mushroom every forager learns to recognize and reject.

The four-pillar identification framework: confirm species to 100% certainty before consuming anything; begin with species that have no dangerous lookalikes (oyster mushrooms, giant puffballs, chicken-of-the-woods); learn the deadly species first; and preserve a sample in a paper bag in the refrigerator for twenty-four hours after eating any new species. If symptoms develop — nausea, vomiting, or any abdominal pain — bring the sample to the emergency room.

Spore prints are essential. Amanita produces white spores; Galerina (deadly) and Cortinarius (deadly) produce rusty brown. Print every unidentified specimen on both black and white paper overnight. Gill attachment, ring and cup (volva) structure, habitat, and season must all match the identification. Digital photo apps are dangerously unreliable — documented poisonings have occurred from their use.

Oregon Mycological Society in Portland and Cascade Mycological Society in Eugene lead guided forays for beginners. The Pacific Northwest has some of the world's most active amateur mycology communities; joining one before solo foraging is genuinely life-protective, not just a nicety.`,
  },

  'womens-cycle-herbs': {
    imageUrl: W.herbs,
    imageCredit: 'Herbal medicine — Wikimedia Commons',
    deepDive: `Women's botanical medicine — herbs used across cultures and generations to support menstrual cycle health — represents one of the most coherent and accessible areas of traditional plant medicine, with some of the longest continuous human use records. The key framing is support and comfort, not hormone replacement: these are gentle allies for cycle regularity, cramping, heavy flow, and perimenopausal transition, not substitutes for progesterone, estrogen, or medical treatment when those are indicated.

Red raspberry leaf (Rubus idaeus) is among the most universally recommended uterine tonics in Western herbalism. Its mechanism is thought to involve fraxine — a compound that tones uterine muscle — and a high mineral profile including magnesium and iron. Traditional use involves drinking leaf tea during the second half of the cycle (luteal phase) rather than continuously. Stinging nettle infusion (cold infusion of one ounce dried leaf per quart of water, steeped overnight) provides highly bioavailable calcium, magnesium, iron, and vitamin K — a genuine mineral-dense food-herb appropriate for anyone with heavy menstrual bleeding or vegetarian mineral concerns.

Cramp bark (Viburnum opulus) and its North American relative black haw (V. prunifolium) contain valtrate compounds with antispasmodic properties; they are taken at onset of cramping rather than as daily tonics. Chaste tree (Vitex agnus-castus) is the best-clinically-studied women's cycle herb, with multiple RCTs showing reduced PMS symptoms, breast tenderness, and mood disturbance when taken continuously. It is thought to work on pituitary dopamine receptors, modestly raising luteal phase progesterone — notable for PCOS management alongside medical care.

Pregnancy is the critical contraindication across uterine herbs: emmenagogues that stimulate menstrual flow are uterine stimulants by definition. Always disclose herbal use to midwives and OBs.`,
  },

  'mens-vitality-tonics': {
    imageUrl: W.herbs,
    imageCredit: 'Herbal medicine — Wikimedia Commons',
    deepDive: `Men's herbal medicine has a quieter tradition than women's but is no less rich — rooted in European phytotherapy, Ayurvedic rasayana tonics, and North American woodland medicine. The conversation most often emerges around lower urinary tract symptoms, prostate health, energy and libido, and cardiovascular vitality. Herbs in this space work best as part of a broader lifestyle that includes resistance exercise, adequate protein, restful sleep, and preventive screening — PSA testing and blood pressure checks cannot be replaced by tinctures.

Nettle root (Urtica dioica root, distinct from the aerial parts used for other purposes) is among the most studied European phytotherapy herbs for benign prostatic hyperplasia (BPH) — the common age-related prostate enlargement causing night waking and slow stream. German Commission E has approved nettle root for irritative urinary symptoms of stage 1–2 BPH. The mechanism involves inhibition of sex hormone-binding globulin and 5-alpha-reductase activity. Nettle root is often combined with saw palmetto (Serenoa repens) in European urological formulas; meta-analyses of saw palmetto alone show inconsistent results, but the combination has more consistent trial evidence.

Pumpkin seeds (Cucurbita pepo) provide beta-sitosterol, zinc, and lignan precursors relevant to prostate health — regular dietary inclusion is the most evidence-aligned approach rather than heroic supplementation. Ashwagandha root has multiple RCTs showing improved testosterone levels, sperm motility, and exercise performance in men — the most clinically solid herb for male vitality discussions.

Tribulus terrestris is widely marketed but has inconsistent human evidence; the animal data that excited researchers did not translate consistently to clinical trials. Always rule out prostate cancer, urinary tract infection, and kidney disease before attributing urinary symptoms to benign enlargement — urological evaluation is the responsible first step.`,
  },

  'children-gentle-remedies': {
    imageUrl: W.herbs,
    imageCredit: 'Herbal medicine — Wikimedia Commons',
    deepDive: `Herbal medicine for children requires more caution than adult herbalism, not less. Children are not small adults — metabolic pathways mature at different rates through infancy and childhood, elimination capacities differ, and weight-based dosing applies to virtually everything. This field is best navigated with a pediatric-trained herbalist or naturopathic doctor, not self-directed adult dose halving.

The most accessible and evidence-supported children's herbs operate in food-dose ranges. Chamomile (Matricaria chamomilla) — a very dilute tea, a few tablespoons in warm water for older infants with provider guidance, up to a standard cup for children over two — has calming, antispasmodic, and mild anti-inflammatory properties. A German study on colic found chamomile-fennel-lemon balm combination reduced crying time significantly over placebo. Fennel seed tea similarly relaxes intestinal smooth muscle and reduces infant gas when used in moderation.

Honey is emphatically contraindicated under twelve months due to Clostridium botulinum spore risk — even raw local honey. This applies to herbal syrups made with honey. After twelve months, honey becomes an excellent delivery vehicle for herb-infused preparations.

Elder flower (Sambucus nigra flowers, not berries) as a gentle diaphoretic tea for childhood fevers has centuries of European use. Fever management in children under three months is a medical emergency regardless of herbal options. Fever without other symptoms in children over three months in otherwise healthy kids may be supportable at home, but any fever with stiff neck, rash, difficulty breathing, extreme lethargy, or lasting more than three days warrants immediate medical evaluation. Echinacea in age-appropriate doses has some pediatric trial data for reducing cold duration; dosing from a qualified source matters. The default for sick children is always: call the pediatrician first, reach for herbs second.`,
  },

  'mold-environmental-sensitivity': {
    imageUrl: W.detox,
    imageCredit: 'Environmental health — Wikimedia Commons',
    deepDive: `Mold-related illness occupies a contentious space in medicine: that mold causes acute toxic effects at high exposure is well established (Stachybotrys chartarum, the "black mold," produces trichothecene mycotoxins that are genuinely dangerous). That low-level chronic mold exposure causes a distinct syndrome — sometimes called chronic inflammatory response syndrome (CIRS), associated with Dr. Ritchie Shoemaker's work — is accepted by a subset of functional and integrative medicine but not recognized by mainstream toxicology as a distinct diagnostic entity. The lived experience of many patients in water-damaged buildings is real; the mechanistic explanations remain scientifically debated.

Pacific Northwest conditions — high rainfall, damp wood construction, inadequate attic ventilation, and basement moisture — create some of North America's highest household mold risk. Oregon, Washington, and Northern California all have building stock with frequent moisture intrusion. For anyone with unexplained chronic sinusitis, cognitive symptoms ("brain fog"), fatigue, unusual sensitivity to chemical exposures, and a history of water-damaged building exposure, environmental medicine evaluation is appropriate.

The first and most important intervention is not supplemental — it is environmental: professional mold inspection (not a DIY kit) followed by professional remediation of confirmed growth. Removing the source is irreplaceable. HEPA filtration reduces airborne spore load in already-remediated spaces; dehumidifiers reduce humidity below the 50% threshold that molds require for active growth.

Medical binders such as cholestyramine or activated charcoal are sometimes discussed for mycotoxin binding in the gut; cholestyramine is a prescription medication that requires proper workup and follow-up lab monitoring. High-dose supplemental binders from wellness sources carry their own risks and nutrient depletion concerns. Immunosuppressed individuals should avoid disturbing suspected mold growth without PPE and professional guidance.`,
  },

  'dental-mercury-awareness': {
    imageUrl: W.detox,
    imageCredit: 'Environmental health — Wikimedia Commons',
    deepDive: `Dental amalgam has been used for over 150 years and remains the most durable restorative material available. It consists of approximately 50% mercury — bound in a stable alloy with silver, tin, copper, and zinc — which releases small amounts of mercury vapor through chewing and grinding. The FDA updated its guidance in 2020, recommending against amalgam placement in pregnant and nursing women, children under six, people with kidney disease, and those with neurological conditions. For the general population, FDA considers existing amalgam fillings as generally safe.

The holistic dental community, organized through IAOMT (International Academy of Oral Medicine and Toxicology), developed the SMART protocol (Safe Mercury Amalgam Removal Technique) for patients electing removal: rubber dam isolation, sectioning the amalgam into large pieces rather than grinding, high-volume evacuation, supplemental filtration, and nasal oxygen for the patient. This protocol significantly reduces mercury vapor inhalation during removal compared to conventional drilling. IAOMT-trained dentists can be located through their directory.

The timing debate: some practitioners recommend antioxidant preloading (vitamin C, selenium, NAC) in the weeks before removal. Simultaneously administering oral chelators (DMSA, DMPS) around dental procedures can increase urinary mercury excretion but also increase redistribution risk — this requires experienced medical oversight, not simultaneous self-directed supplementation.

Composite alternatives vary in biocompatibility. BPA-free composites are widely available; ceramic inlays and porcelain are further options. Patients with multiple chemical sensitivities or autoimmune conditions may want biocompatibility testing from a MELISA (Memory Lymphocyte Immunostimulation Assay) lab before selecting materials. Pregnancy: defer all elective dental work including amalgam removal until after delivery unless clinically urgent — this is the one period where benefits clearly don't outweigh risks.`,
  },

  'anxiety-herbal-nervines': {
    imageUrl: W.sleep,
    imageCredit: 'Rest and calm — Wikimedia Commons',
    deepDive: `Anxiety is the most common mental health presentation worldwide, and herbal nervines — herbs that calm, nourish, and restore the nervous system — have been used across every culture to address its physical and emotional signatures. The distinction between sedative nervines (passionflower, valerian, California poppy) and trophorestorative nervines (milky oat, lemon balm, ashwagandha) matters clinically: sedatives dampen nervous system activity in the moment, while trophorestoratives nourish depleted nervous tissue over time.

Milky oat seed (Avena sativa, harvested when the grain is milky, not dried) is perhaps the most valued trophorestorative in Western botanical medicine. Taken as a fresh plant tincture, it is appropriate for the "fried nerve" picture: chronic stress, adrenal depletion, nervous exhaustion, and hypersensitivity. Effects are cumulative over weeks to months rather than immediate. Lemon balm (Melissa officinalis), a member of the mint family that grows readily in Pacific Northwest gardens, contains rosmarinic acid and volatile compounds with GABA-A modulating effects — studies show reduced anxiety and improved sleep quality at moderate doses, and it is gentle enough for children with provider guidance.

Skullcap (Scutellaria lateriflora), a North American woodland nervine, is best as fresh plant tincture for mental restlessness, circular thoughts, and tension headache. Ashwagandha's anxiolytic effects are now well-documented across a dozen clinical trials.

Critical safety framing: suicidal ideation or crisis-level anxiety requires the 988 Suicide and Crisis Lifeline immediately — herbal nervines are absolutely not sufficient. Panic disorder, OCD, and PTSD have specific evidence-based treatments (CBT, EMDR, SSRIs, SNRIs) that significantly outperform herbs as primary interventions. The interaction between St. John's wort and SSRIs, MAOIs, or anticoagulants is clinically significant — never stack these without pharmacist review.`,
  },

  'colon-fiber-hydration': {
    imageUrl: W.gut,
    imageCredit: 'Digestive system — Wikimedia Commons',
    deepDive: `Colon health sits at the intersection of mechanics and microbiology. Constipation — defined clinically as fewer than three bowel movements per week, with straining, incomplete evacuation, or hard stools — affects an estimated sixteen percent of adults and increases significantly with age. Before reaching for any supplement or herb, the fundamentals deserve full implementation: twenty-five to thirty-five grams of dietary fiber daily (most Americans consume ten to fifteen), at minimum sixty-four ounces of water, and daily movement, particularly morning walks that activate the gastrocolic reflex.

Soluble fiber — psyllium husk, oat bran, ground flaxseed, beans, and apples — absorbs water and forms a gel that softens stool and slows glucose absorption. It also feeds Bifidobacteria and Lactobacillus species in the colon, producing short-chain fatty acids (SCFAs) — particularly butyrate — that serve as primary fuel for colonocytes and maintain the mucosal barrier. Insoluble fiber from whole grains, vegetable skins, and bran adds bulk and reduces transit time. A fiber-rich diet provides both; increasing too quickly causes significant gas and cramping, so a gradual ramp over two to four weeks is kinder.

Psyllium husk has the strongest FDA-approved health claim of any dietary supplement for reducing cardiovascular risk through LDL cholesterol reduction — one gram of soluble fiber per day from psyllium reduces LDL about five percent. Ground flaxseed adds lignans, plant omega-3s (ALA), and mucilaginous fiber. Both require substantial water to function properly; psyllium without adequate water can worsen constipation.

Any rectal bleeding, pencil-thin stools, unexplained weight loss, iron-deficiency anemia, or change in bowel habits in adults over forty-five requires colonoscopy referral — these are colorectal cancer screening indications, not a call for more fiber.`,
  },

  'devils-club-pnw': {
    imageUrl: W.plant,
    imageCredit: 'Pacific Northwest plant — Wikimedia Commons',
    deepDive: `Devil's club (Oplopanax horridus) is one of the most distinctive and ecologically significant plants of the Pacific Northwest. Growing to three meters in moist, shaded forest understory from the Alaska coast south to northern California, it announces itself unmistakably — enormous maple-shaped leaves up to fifty centimeters across, main stems armored with densely packed golden spines, and brilliant red berry clusters in late summer. The pain of accidentally brushing against devil's club is immediate and memorable.

Culturally, it is one of the most important medicinal plants across coastal and interior Indigenous peoples. Haida, Tlingit, Heiltsuk, Coast Salish, and dozens of other nations used the inner bark extensively: for joint pain and arthritis, for blood sugar regulation, for respiratory conditions, and as a ceremonial purifying medicine. The inner bark is harvested from older stems by carefully removing the spiny outer layer with gloves and a sharp blade — a harvest requiring respect, skill, and ethical restraint (never strip the only stem or take more than one-third from a stand).

Phytochemically, devil's club contains saponins, diterpene acids, and polysaccharides with adaptogenic and blood sugar-modulating activity. It is often compared to its close relative American ginseng (Panax quinquefolius) and more distantly to Asian ginseng, reflecting the Araliaceae family chemistry. Laboratory studies show effects on glucose metabolism consistent with its traditional use by peoples with high traditional-diet fish protein, transitioning to diets with increased carbohydrate after colonial contact.

In contemporary herbalism, devil's club inner bark appears as tincture in small doses — it is intensely bitter and somewhat nauseating in excess. Pregnancy contraindication is consistent across Indigenous and modern sources. Blood sugar lowering effects mean diabetic monitoring is essential if combining with medications.`,
  },

  'cascara-sagrada-pnw': {
    imageUrl: W.plant,
    imageCredit: 'Pacific Northwest plant — Wikimedia Commons',
    deepDive: `Cascara sagrada — "sacred bark" in Spanish — is the dried, aged bark of Rhamnus purshiana (also classified as Frangula purshiana), native to the Pacific Coast from northern California to British Columbia. It was the principal ingredient in commercial laxative products for much of the twentieth century until manufacturers reformulated when FDA reclassified anthraquinone laxatives from OTC to non-monograph status in 2002. Before that, it was likely the world's most widely sold herbal laxative.

The mechanism is straightforward: anthraquinone glycosides (primarily cascarosides) pass undigested to the colon, where gut bacteria convert them to active anthraquinones that stimulate colon smooth muscle contraction and reduce water reabsorption, producing a bowel movement eight to twelve hours after ingestion. This makes cascara more gentle and slower-acting than senna (Cassia), which is more potent and more cramping-prone.

The critical safety point is aging. Fresh bark contains emodin and related compounds in a form that causes severe vomiting, cramping, and diarrhea. Bark must be aged for at least one year — traditionally by drying and storing, or commercially by heat treatment that converts the harsh compounds to milder cascarosides. Never use fresh bark.

In the PNW, cascara is identifiable by its veined, alternate leaves with parallel veins running to the leaf margin, smooth gray bark, and black ripe berries in fall (blue-green before ripe). It grows in forest edges, riparian corridors, and disturbed moist woods. Responsible wild harvest takes no more than one-third of any individual tree's accessible bark and avoids the cambium to allow regrowth. Cascara is appropriate only for occasional use — daily laxative dependence of any kind, including herbal, can lead to electrolyte imbalance and reduced bowel tone. Contraindications include all inflammatory bowel conditions, pregnancy, and concurrent prescription laxative use.`,
  },

  'mullein-respiratory': {
    imageUrl: W.plant,
    imageCredit: 'Pacific Northwest plant — Wikimedia Commons',
    deepDive: `Mullein (Verbascum thapsus) is one of the most recognizable roadside plants in the Pacific Northwest and throughout temperate North America. A biennial, it produces a large, soft, silvery-gray basal rosette of flannel-textured leaves in its first year, then sends up a dramatic flower spike — often two meters tall, densely set with small yellow flowers — in its second summer. Find it in disturbed ground, roadsides, logged clearcuts, dry east-slope Oregon, and rocky hillsides from the coast to the high desert.

The leaves — filtered through fine cloth because the tiny surface hairs irritate the throat if swallowed — make an effective demulcent tea for dry, irritated, or inflamed respiratory mucous membranes. Saponins and mucilage in the leaves coat and soothe inflamed tissue, reduce the dry irritation of smoker's cough, and support the mucociliary clearance mechanism of the bronchial tree. Mullein is specifically for dry, unproductive cough — a cough that feels tight, hot, and irritating. For wet, productive cough, a demulcent-drying herb like mullein may be counterproductive.

The flowers, infused in olive oil for several weeks in a warm location, produce a traditional ear drop preparation used across European folk medicine for earache pain. This use is appropriate for pain relief only in ears with intact eardrums — never use oil drops if eardrum perforation is possible (following a swim with pressure barotrauma, after a head injury, or if the ear is draining). Acute ear infections in children require medical evaluation.

Second-year leaves harvested before or during early flowering offer the most medicinal activity. The seeds are the longest-lived of most PNW plants — they can germinate after eighty years in storage, which explains why mullein appears on land disturbed for the first time in decades.`,
  },

  'california-poppy-nervine': {
    imageUrl: W.plant,
    imageCredit: 'Pacific Northwest meadow plant — Wikimedia Commons',
    deepDive: `California poppy (Eschscholzia californica) is California's state flower and a cheerful self-seeding annual that has naturalized widely in dry west-side Oregon meadows, disturbed slopes, and gardens throughout the Pacific Northwest. The plant produces satiny orange, yellow, or cream-colored four-petaled cups on slender stems from gray-green, finely divided foliage — the flowers close at night and on overcast days. Despite the "poppy" name and the family membership in Papaveraceae, California poppy contains no opiates whatsoever. It is not a scheduled substance and is legal to harvest and use.

The plant's nervine action comes from a distinct set of alkaloids — primarily californidine, eschscholtzine, and protopine — that interact with GABA and serotonin receptors. The effect is calming, mildly anxiolytic, and conducive to sleep without the dependency profile or respiratory depression risk of true opiates. Traditional Indigenous use by California peoples, and subsequent adoption by Eclectic physicians, emphasized it for pain, anxiety, and insomnia in children and adults. Its milder and gentler character compared to other nervines makes it one of the few herbs sometimes discussed for children's sleep support, with appropriate weight-based guidance from a qualified herbalist.

The whole aerial plant — leaves, stems, and seed pods — contains the most active alkaloids; the root is traditionally used as well but harvesting kills the plant. Fresh plant tincture preserves more of the volatile alkaloids than dried herb preparation. Blending with lemon balm or passionflower produces a complementary gentle evening formula.

The critical caution is confusion risk: opium poppy (Papaver somniferum) has very different leaf morphology, a milky latex when scored, and is the source of actual opiates. California poppy has no latex, very different leaves, and entirely different chemistry. Avoid using any poppy herb close to scheduled surgery or with sedative medications without provider consultation.`,
  },

  'mugwort-dream-herb': {
    imageUrl: W.plant,
    imageCredit: 'Pacific Northwest streamside plant — Wikimedia Commons',
    deepDive: `Mugwort in the Pacific Northwest refers primarily to Artemisia douglasiana, native to stream banks, roadsides, and disturbed moist ground from the coast ranges inland. Its silvery-white leaf undersides and strong aromatic scent — sharper and more medicinal than tarragon, its culinary relative — make it identifiable to the nose as much as the eye. Closely related wormwood (A. absinthium) and western mugwort (A. ludoviciana) share similar but distinct chemistries; most PNW herbalism uses A. douglasiana or imported A. vulgaris.

In traditional Chinese medicine, mugwort is the primary moxibustion plant: the dried, aged leaf is ground into moxa wool and burned on or near acupuncture points to stimulate circulation and dispel cold. Direct and indirect moxa are formal clinical techniques requiring training; DIY use carries skin burn risk. In European folk tradition and Pacific Coast Indigenous use, mugwort leaf in a pillow or burned briefly as incense is said to promote vivid, memorable dreams — likely through inhalation of thujone and volatile monoterpenes affecting limbic function. Anecdotal reports of enhanced dream recall during small-amount mugwort use are widespread enough to warrant taking seriously as a phenomenological observation.

Digestive use: mugwort bitter compounds in tiny amounts (a few leaves in a salad or a weak tea) act as gentle digestive stimulants — appropriate for occasional use by non-pregnant adults. Strong or prolonged use raises thujone exposure concerns.

The absolute contraindication is pregnancy: all Artemisia species are traditional uterine stimulants and have well-documented abortifacient use across cultures. Avoid entirely during pregnancy and breastfeeding. Ragweed (Ambrosia) allergy often means cross-reactivity with Artemisia pollen — those with severe ragweed allergy should start cautiously.`,
  },

  'yerba-buena-tea': {
    imageUrl: W.plant,
    imageCredit: 'Pacific Northwest forest plant — Wikimedia Commons',
    deepDive: `Yerba buena — "good herb" in Spanish — is the common name for Clinopodium douglasii (formerly Satureja douglasii), a delicate trailing perennial that carpets shaded forest floors, particularly in Coast Range and Cascades foothills from British Columbia south through Oregon and California. Tiny round-to-oval leaves on wiry stems grow close to the ground in dappled light; the distinguishing feature is the unmistakable mint-family fragrance — clean, sweet, slightly spicy, more delicate than peppermint and quite distinct from upright wild mint (Mentha arvensis). The fragrance test is the most reliable field identification tool.

Yerba buena was among the most valued tea plants of the peoples of coastal Oregon and California. Spanish missionaries named it; coastal Ohlone, Kalapuya, and others used it for stomachaches, headaches, colds, and general wellness long before European contact. Its pleasant flavor and gentle action made it appropriate across ages. The mission-era Californios regarded it as a reliable remedy for colic, digestive discomfort, and fever in children.

Constituents include pulegone (in small amounts, lower than pennyroyal), carvacrol, thymol, and other monoterpenes with antispasmodic and carminative properties — well-suited for gentle stomach soothing. A simple fresh or dried leaf infusion is the traditional preparation: pour just-boiled water over leaves, steep covered for five minutes, strain, and enjoy as a light herbal tea.

Harvest ethics are important for this trailing plant: it grows slowly and can be devastated by over-picking. Take no more than one-third from any patch, never strip an entire area, and return to the same spots across seasons only if they show healthy recovery. The cold infusion of yerba buena in room-temperature water for several hours produces a subtler, more aromatic flavor appropriate for summer hiking. No significant safety concerns at reasonable food-herb doses; as always, confirm mint aroma before any tasting.`,
  },

  'kinnikinnick-urinary': {
    imageUrl: W.plant,
    imageCredit: 'Pacific Northwest plant — Wikimedia Commons',
    deepDive: `Kinnikinnick, bearberry, or uva-ursi (Arctostaphylos uva-ursi) is a prostrate, mat-forming evergreen shrub that colonizes dry, rocky open forests, sand dunes, and sunny exposed slopes across the Pacific Northwest and boreal regions worldwide. Its small, leathery, spatula-shaped leaves, pinkish urn-shaped flowers in spring, and distinctive bright red round berries in fall make it a recognizable companion on dry Douglas-fir ridges and Ponderosa pine forests east of the Cascades. On the coast, it grows on fore-dunes and headland edges alongside other low-growing natives.

The leaves contain arbutin — a hydroquinone glycoside that is converted by alkaline urine into free hydroquinone, a known urinary antiseptic. European phytotherapy, Commission E approval, and multiple clinical studies support short-term uva-ursi leaf use for uncomplicated lower urinary tract infection symptoms in adult women. Critically, this means symptoms must genuinely localize to the bladder (frequency, burning, urgency without systemic signs): UTI accompanied by fever, chills, flank pain, or confusion indicates kidney involvement (pyelonephritis) and requires antibiotic therapy urgently — herbal care is insufficient for upper tract infection.

Arbutin conversion to active hydroquinone is most efficient in alkaline urine; combining uva-ursi with alkalinizing foods (citrus, baking soda) or supplements is sometimes recommended in European herbalism. Duration is explicitly limited — no more than one week per episode, no more than five short courses per year — because chronic hydroquinone exposure has tissue toxicity concerns at sustained doses. High-dose or long-duration use is not appropriate.

Berries are mealy and astringent; traditional smoking blends (tobacco mixed with kinnikinnick) were widespread across North America. Leaves are the medicinal part. Pregnancy, lactation, and kidney disease are contraindications. Start a UTI evaluation with a urinalysis or dipstick test — culture and sensitivity guides antibiotic selection when necessary.`,
  },

  'hawthorn-heart': {
    imageUrl: W.plant,
    imageCredit: 'Pacific Northwest plant — Wikimedia Commons',
    deepDive: `Hawthorn (Crataegus species) holds a unique position in botanical medicine as one of the few herbs with both long traditional use and genuine clinical trial evidence for cardiovascular effects. The genus includes dozens of species worldwide; in the Pacific Northwest, Crataegus douglasii (black hawthorn) grows native from valley bottoms to mid-elevation forests, identifiable by its deeply lobed leaves, sharp thorns, and clusters of small black-purple pomes in late summer. Ornamental hawthorns (C. monogyna, C. laevigata, and cultivars) are planted throughout Oregon and Washington parks and gardens.

The medicinal parts include the berries, leaves, and flowers, all containing oligomeric proanthocyanidins (OPCs), flavonoids, and triterpene acids. Mechanistic studies show hawthorn increases coronary blood flow, reduces peripheral vascular resistance, improves myocardial ATP production, and has antioxidant activity in endothelial tissue. The largest clinical trial (SPICE, 2008) followed 2,681 patients with heart failure and found no overall mortality difference, though a subgroup with higher ejection fraction showed benefit.

European Commission E and the British Herbal Pharmacopoeia approve hawthorn for declining cardiac performance in stage NYHA II heart failure, used alongside — not instead of — cardiac medications. For people without diagnosed heart disease, hawthorn is discussed as a long-term tonic for mild blood pressure elevation and palpitations associated with anxiety. A berry syrup from simmered hawthorn fruits sweetened with honey is a delicious and accessible preparation that concentrates the polyphenols effectively.

The interaction caution is significant: hawthorn potentiates cardiac glycosides (digoxin), antihypertensive medications, and nitrates. Anyone on cardiac medication should discuss hawthorn with their cardiologist or pharmacist before use. This is not a heart attack herb — acute chest pain is an emergency call to 911.`,
  },

  'reishi-pnw': {
    imageUrl: W.mushroom,
    imageCredit: 'Ganoderma — Wikimedia Commons',
    deepDive: `Reishi mushroom (Ganoderma species) is among the most globally revered medicinal fungi — called lingzhi in Traditional Chinese Medicine, where texts dating to the Han Dynasty describe it as a superior medicine for longevity, immune strengthening, and "calming the heart and mind." In the Pacific Northwest, Ganoderma oregonense is the dominant species, growing as an annual shelf fungus on the base and roots of dying conifers — particularly western hemlock, Douglas-fir, and true firs — throughout the Coast Range and Cascades. Its distinctively lacquered, reddish-brown cap surface and pore layer on the underside make identification straightforward for intermediate foragers, though expert confirmation before consumption is always appropriate.

Active compounds include beta-glucan polysaccharides (particularly ganoderan), triterpenoids (ganoderic acids), sterols, and nucleosides. The polysaccharides are immunomodulating — they appear to both upregulate appropriate immune responses and modulate excessive inflammatory activity, rather than simply stimulating. This bidirectional regulation is what distinguishes immunomodulators from simple immunostimulants. Japanese pharmaceutical research led to the development of PSK (polysaccharide K) from a related species as an adjunct to cancer chemotherapy, approved in Japan since 1977.

Preparation matters because reishi's active compounds are locked in woody chitin cell walls that hot water and alcohol must extract separately. A long decoction (two to four hours at low simmer) extracts polysaccharides; alcohol tincture extracts triterpenoids. Quality commercial dual extracts — verified for beta-glucan content by the producer — offer convenience. Wild harvest involves slicing the fruiting body and simmering in water; taste is intensely bitter.

Anticoagulant and immunosuppressant interactions are the primary safety concern. Spore clouds during sporulation are allergenic and potentially pulmonary-toxic — harvest before or after sporulation and avoid the dense orange-brown cloud. Not a substitute for cancer treatment.`,
  },

  'lions-mane-cognitive': {
    imageUrl: W.mushroom,
    imageCredit: 'Hericium — Wikimedia Commons',
    deepDive: `Lion's mane mushroom (Hericium erinaceus and related species) is at once one of the most visually striking fungi in Pacific Northwest forests and one of the most compelling subjects in current neuroscience research. Growing on the wounds and logs of hardwoods — particularly maple, alder, and oak — and occasionally on conifers, it produces a cascading mass of icicle-like, downward-pointing white spines, resembling a brain coral, a waterfall, or — as the name suggests — a lion's mane. No dangerous look-alikes exist in our region among toothed fungi growing white from wood; this makes it one of the safest first mushrooms for beginners.

The culinary value alone justifies seeking it out: fresh lion's mane has a texture reminiscent of crab or lobster when properly sautéed in butter with garlic, and a delicate seafood-like flavor. It sautés best when sliced thickly, pressed in a dry pan to release moisture before adding fat.

The cognitive interest centers on two compounds — hericenones (from the fruiting body) and erinacines (from the mycelium) — that stimulate nerve growth factor (NGF) synthesis. NGF is essential for the survival, maintenance, and growth of neurons, and declines with aging. Small human clinical trials show improvements in mild cognitive impairment scores, reduced depression and anxiety in menopausal women, and enhanced concentration after eight to sixteen weeks of supplementation. A 2009 Japanese RCT — the landmark study — showed significant cognitive score improvement in older adults during supplementation, with reversal of gains after washout, suggesting ongoing use is necessary.

Dual-extract products preserving both water-soluble polysaccharides and alcohol-soluble erinacines offer the most complete active compound profile for daily nootropic use. Fresh culinary use provides compounds in their most bioavailable food-matrix form. Start at low doses if new to medicinal fungi; occasional GI sensitivity occurs.`,
  },
};

export function applyHolisticExpanded<T extends { id: string; summary: string }>(
  topics: T[],
): (T & ExpandedFields)[] {
  return topics.map((topic) => {
    const extra = HOLISTIC_TOPIC_EXPANDED[topic.id];
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
