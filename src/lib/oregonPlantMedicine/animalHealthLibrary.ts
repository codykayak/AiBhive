import type { AnimalHealthCategory, AnimalHealthTopic } from './animalHealthTypes';
import { commonsImage } from './commonsImage';

/** Wikimedia Commons hero images for research topic cards. */
const IMG = {
  vet: commonsImage(
    'Guantanamo dog handler comforts his partner during a veterinary exam.jpg',
  ),
  dog: commonsImage('Collage of Nine Dogs.jpg'),
  cat: commonsImage('Cat03.jpg'),
  firstAid: commonsImage('Calendula arvensis blossom.jpg'),
  essentialOils: commonsImage('YlangYlangEssentialOil.png'),
  reiki: commonsImage('Reiki-Hanko.JPG'),
  horse: commonsImage('Nokota Horses cropped.jpg'),
  livestock: commonsImage('Cow female black white.jpg'),
  rawFeeding: commonsImage('Raw_food.jpg'),
  hemp: commonsImage('Cannabis sativa leaf.jpg'),
  bachFlowers: commonsImage('Bach flower remedies.jpg'),
  emergency: commonsImage(
    'Medical Department - Veterinary Corps - PREPARATION FOR THROWING MULE ON EMERGENCY TABLE - NARA - 45499585.jpg',
  ),
};

export const ANIMAL_HEALTH_LIBRARY: AnimalHealthTopic[] = [
  {
    id: 'holistic-veterinary-overview',
    title: 'Holistic veterinary medicine — an overview',
    category: 'holistic-vet',
    summary:
      'What "holistic" or "integrative" veterinary medicine actually means: licensed veterinarians who combine conventional diagnostics with complementary therapies, treating the whole animal rather than a single symptom.',
    imageUrl: IMG.vet,
    imageCredit: 'Veterinary examination — Wikimedia Commons (public domain, US Navy)',
    deepDive: `Holistic — or more accurately, integrative — veterinary medicine describes licensed veterinarians who blend conventional science-based care with complementary approaches such as nutrition therapy, acupuncture, physical rehabilitation, and botanical medicine. The word "holistic" simply means treating the whole animal: physical body, behavior, environment, and the human family around it, rather than chasing one isolated symptom. Crucially, reputable integrative vets are graduates of accredited veterinary colleges who still order bloodwork, imaging, and biopsies. They add complementary tools; they do not abandon the diagnostic foundation.

In practice, an integrative visit might pair a standard exam and lab panel with a discussion of diet, weight, stress, and movement. A dog with arthritis could receive conventional pain medication alongside laser therapy, targeted supplements, and an exercise plan. The philosophy prizes minimally invasive support and quality of life, especially for chronic conditions where drugs alone plateau.

Organizations such as the American Holistic Veterinary Medical Association (AHVMA) and the American Association of Veterinary Acupuncture help owners find practitioners with real credentials. Certification programs exist for veterinary acupuncture (CVA), rehabilitation (CCRT), and veterinary botanical medicine. The key distinction is between a licensed veterinarian offering integrative options and an unlicensed "animal healer" with no medical training — only the former can legally diagnose and prescribe.

Skepticism is healthy. Evidence quality varies enormously: acupuncture and physical rehabilitation have growing research support, while some modalities rest mainly on tradition and anecdote. A good integrative vet is transparent about what is proven, what is plausible, and what is simply comforting. This library is educational and never a substitute for a hands-on veterinary exam. The safest model is collaboration — a conventional veterinarian who welcomes complementary support, or an integrative vet who never delays urgent care.`,
    whenPeopleExplore:
      'A chronic condition (arthritis, allergies, GI issues) that conventional care alone has not resolved, an aging pet, or a desire to reduce long-term medication load while keeping a veterinarian in charge.',
    approaches: [
      'Start with a licensed veterinarian — integrative care builds on real diagnostics, never replaces them.',
      'Look for recognized credentials: AHVMA membership, CVA (acupuncture), or CCRT (rehabilitation).',
      'Combine conventional treatment with adjuncts like nutrition, rehab, laser, or acupuncture for chronic issues.',
      'Ask any practitioner to distinguish what is evidence-based, what is plausible, and what is purely traditional.',
    ],
    relatedPlantIds: ['dandelion', 'burdock', 'wild-mint'],
    safetyWarnings: [
      'Only a licensed veterinarian can legally diagnose illness and prescribe treatment for your animal.',
      'Never let complementary care delay urgent evaluation of bleeding, breathing trouble, collapse, or suspected poisoning.',
      'This content is educational, not veterinary advice — always consult your own vet before changing care.',
    ],
    sources: [
      {
        label: 'American Holistic Veterinary Medical Association',
        url: 'https://www.ahvma.org/',
        description: 'Find credentialed integrative veterinarians.',
      },
      {
        label: 'AVMA — Complementary and integrative veterinary medicine',
        url: 'https://www.avma.org/resources-tools/avma-policies/complementary-and-integrative-veterinary-medicine',
      },
    ],
  },
  {
    id: 'dog-gut-health-probiotics',
    title: 'Dog gut health & probiotics',
    category: 'dogs-cats',
    summary:
      'How the canine microbiome affects digestion, immunity, and even mood — and what the evidence says about probiotics, prebiotics, fiber, and diet changes for dogs with loose stools or sensitive stomachs.',
    imageUrl: IMG.dog,
    imageCredit: 'Dogs — Wikimedia Commons (CC BY-SA)',
    deepDive: `A dog's gut hosts trillions of bacteria that help digest food, synthesize vitamins, train the immune system, and produce signaling molecules that influence behavior. When this community is disrupted — by antibiotics, abrupt diet changes, stress, or infection — the result is often loose stool, gas, or a "sensitive stomach." Supporting the canine microbiome has become one of the most popular topics in integrative pet care, and unlike many complementary areas, parts of it have reasonable research behind them.

Probiotics are live beneficial bacteria. Veterinary-specific products (containing strains such as Enterococcus faecium or Bifidobacterium animalis) have been studied for acute diarrhea and stress colitis, with several trials showing shorter recovery times. Prebiotics are fibers that feed those bacteria — psyllium, beet pulp, and inulin are common. Diet itself matters most: a consistent, complete, and balanced food usually does more for stool quality than any supplement. Human yogurt is a weak, inconsistent probiotic source and may upset lactose-sensitive dogs.

The gut-brain connection is real but often oversold. Emerging research links the microbiome to anxiety and behavior, yet no supplement reliably "fixes" behavior on its own. Fiber, gradual food transitions (over 7–10 days), and reducing table scraps are foundational moves that address most mild cases.

Red flags demand a veterinarian, not a probiotic: bloody diarrhea, vomiting, lethargy, dehydration, weight loss, or symptoms lasting more than 48 hours. Chronic GI disease — food allergy, inflammatory bowel disease, exocrine pancreatic insufficiency, parasites — needs diagnosis, sometimes with fecal tests, diet trials, or biopsy. Probiotics are a reasonable, low-risk adjunct once serious causes are ruled out, but they are supportive care, not a cure. Choose products with veterinary research and guaranteed live counts, and introduce any change slowly while watching your dog's response.`,
    whenPeopleExplore:
      'Recurring loose stools, gas, a "sensitive stomach," recovery after antibiotics, or wanting to support digestion in an otherwise healthy dog.',
    approaches: [
      'Keep diet consistent; transition foods gradually over 7–10 days to avoid microbiome disruption.',
      'Choose veterinary probiotic strains with guaranteed live counts rather than human yogurt or generic pills.',
      'Add soluble fiber (psyllium, pumpkin) for mild loose stool as a gentle first step.',
      'Rule out parasites, food allergy, and IBD with a vet before assuming a "probiotic deficiency."',
    ],
    relatedPlantIds: ['plantain', 'wild-mint', 'burdock'],
    safetyWarnings: [
      'Bloody stool, vomiting, lethargy, or diarrhea lasting over 48 hours needs a veterinary exam — not supplements.',
      'Avoid xylitol-sweetened human probiotic products; xylitol is toxic to dogs.',
      'Puppies and dehydrated dogs can decline quickly — seek care early.',
    ],
    sources: [
      {
        label: 'AKC — Probiotics for dogs',
        url: 'https://www.akc.org/expert-advice/health/probiotics-for-dogs/',
      },
      {
        label: 'WSAVA — Global nutrition guidelines',
        url: 'https://wsava.org/global-guidelines/global-nutrition-guidelines/',
      },
    ],
  },
  {
    id: 'cat-kidney-urinary-support',
    title: 'Cat kidney & urinary support',
    category: 'dogs-cats',
    summary:
      'Why kidney and lower urinary tract problems are so common in cats, how hydration and diet form the backbone of support, and where complementary care fits alongside essential veterinary monitoring.',
    imageUrl: IMG.cat,
    imageCredit: 'Domestic cat — Wikimedia Commons (CC BY-SA)',
    deepDive: `Cats are prone to two overlapping problem areas: chronic kidney disease (CKD), especially in older cats, and feline lower urinary tract disease (FLUTD), which includes cystitis, crystals, and stones. Both are heavily influenced by hydration, because cats evolved as desert animals with a low thirst drive and often live in a mild state of dehydration on dry-food diets. This makes water intake the single most important lever owners can pull.

Chronic kidney disease is progressive and cannot be cured, but it can be managed for years. The cornerstones are veterinary staging (bloodwork including SDMA and creatinine, urinalysis, blood pressure) and therapeutic renal diets that are lower in phosphorus and protein of high quality. Complementary support — omega-3 fatty acids, adequate hydration via wet food or fountains, and stress reduction — can complement, never replace, this medical management. Some integrative vets use appetite support and anti-nausea strategies to keep cats eating.

FLUTD is different. A large share of cases are "idiopathic" cystitis driven by stress, and environmental enrichment is genuinely therapeutic: multiple clean litter boxes, water fountains, hiding spots, and predictable routines. Increasing moisture through canned food dilutes urine and reduces crystal risk. Certain diets dissolve struvite crystals; others prevent recurrence.

A critical safety point: a male cat straining to urinate and producing little or nothing may have a urethral blockage, which is a life-threatening emergency within hours. This is never a moment for home remedies. Cranberry and D-mannose, popular for human urinary health, have little evidence in cats and can even be counterproductive depending on the crystal type. The safe pattern is diagnosis first, hydration and diet as the backbone, and complementary measures layered on with veterinary guidance and regular monitoring bloodwork.`,
    whenPeopleExplore:
      'An older cat with weight loss or increased drinking, a cat with recurring urinary issues or litter-box accidents, or wanting to support kidney health preventively.',
    approaches: [
      'Maximize water intake: wet food, fountains, and multiple water stations reduce both kidney and urinary strain.',
      'Use veterinary-prescribed therapeutic diets for diagnosed kidney disease or urinary crystals.',
      'Reduce stress with enrichment and clean, plentiful litter boxes — key for idiopathic cystitis.',
      'Track disease with regular bloodwork (SDMA, creatinine), urinalysis, and blood pressure checks.',
    ],
    relatedPlantIds: ['cleavers', 'dandelion', 'wild-mint'],
    safetyWarnings: [
      'A male cat straining with little or no urine is a life-threatening blockage — go to an emergency vet immediately.',
      'Do not give human cranberry or D-mannose products to cats without veterinary guidance; crystal type matters.',
      'Many human supplements and pain relievers are toxic to cats — never dose without a vet.',
    ],
    sources: [
      {
        label: 'Cornell Feline Health Center — Chronic kidney disease',
        url: 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/chronic-kidney-disease',
      },
      {
        label: 'International Cat Care — FLUTD',
        url: 'https://icatcare.org/advice/feline-lower-urinary-tract-disease-flutd/',
      },
    ],
  },
  {
    id: 'herbal-first-aid-pets',
    title: 'Herbal first aid for pets (educational)',
    category: 'herbs-nutrition',
    summary:
      'A cautious educational look at gentle botanicals discussed for minor pet issues — soothing skin, calming, mild digestive upset — and the strict limits of what belongs in a home first-aid kit versus the vet clinic.',
    imageUrl: IMG.firstAid,
    imageCredit: 'Calendula flower — Wikimedia Commons (CC BY-SA)',
    deepDive: `Herbal first aid for pets is one of the most misunderstood corners of natural pet care. The honest framing is this: a small number of gentle botanicals may soothe very minor, superficial issues, but the list of plants that are unsafe for animals is far longer than the list that helps. This entry is educational — it explains what herbalists discuss, not a protocol to treat your animal at home.

For minor skin irritation, diluted calendula and chamomile compresses appear in traditional first-aid literature as soothing washes, and plain colloidal oatmeal is a mainstream itch-reducer. Aloe vera gel is used topically for minor irritation but is toxic if licked and ingested, so it is rarely appropriate for pets who groom. For very mild digestive upset in dogs, a bland diet (plain boiled chicken and rice) and time are the classic home measures; slippery elm is discussed as a demulcent but should be cleared with a vet, especially around other medications.

The dangers are the real lesson. Cats lack key liver enzymes and are exquisitely sensitive to many plants and essential oils that are fine for dogs or humans. Garlic and onion cause anemia in both dogs and cats. Many "natural" flea remedies contain concentrated essential oils that have poisoned pets. Herbs can interact with prescription drugs, alter clotting, or mask worsening disease. Dosing by body weight in small animals leaves almost no margin for error.

The safe boundary: home first aid means stabilizing and transporting, not treating. Control minor bleeding with pressure, rinse a superficial wound, keep the animal calm and warm, and call a veterinarian or poison line. Anything involving deep wounds, eyes, heavy bleeding, vomiting, breathing trouble, or a suspected toxin is a clinic visit, not a herbal remedy. Keep the ASPCA Animal Poison Control number saved before you ever need it.`,
    whenPeopleExplore:
      'Building a pet first-aid kit, curiosity about gentle botanicals for minor itch or upset, or wanting to know which "natural" remedies are actually dangerous.',
    approaches: [
      'Treat home first aid as stabilize-and-transport, not diagnose-and-treat.',
      'Colloidal oatmeal and a vet-cleared bland diet are safer, mainstream options for minor itch and mild GI upset.',
      'Verify every botanical against species-specific toxicity lists before it comes near a pet.',
      'Save the ASPCA Animal Poison Control number before an emergency happens.',
    ],
    relatedPlantIds: ['plantain', 'yarrow', 'self-heal'],
    safetyWarnings: [
      'Many plants and essential oils safe for humans are toxic to pets, especially cats — never assume "natural" means safe.',
      'Garlic, onion, and concentrated essential-oil flea remedies can poison dogs and cats.',
      'Deep wounds, eye injuries, heavy bleeding, vomiting, or suspected poisoning require a vet, not herbs.',
    ],
    sources: [
      {
        label: 'ASPCA Animal Poison Control Center',
        url: 'https://www.aspca.org/pet-care/animal-poison-control',
        description: '24/7 hotline: (888) 426-4435.',
      },
      {
        label: 'Pet Poison Helpline — Poisonous plants',
        url: 'https://www.petpoisonhelpline.com/poisons/',
      },
    ],
  },
  {
    id: 'essential-oils-pets-toxicity',
    title: 'Essential oils & pets — toxicity overview',
    category: 'legal-safety',
    summary:
      'A safety-first briefing on why concentrated essential oils and diffusers can seriously harm cats, dogs, and birds — which oils are most dangerous, how exposure happens, and the signs of poisoning.',
    imageUrl: IMG.essentialOils,
    imageCredit: 'Essential oils — Wikimedia Commons (CC BY-SA)',
    deepDive: `Essential oils are marketed as gentle and natural, but they are highly concentrated plant compounds, and around pets they are a common source of poisoning. This topic exists primarily as a warning. Cats are the most vulnerable because they lack the glucuronyl transferase liver enzymes needed to metabolize many of the phenols and terpenes in oils, so toxins accumulate. Birds have extremely sensitive respiratory systems and can be harmed by airborne oils alone. Dogs are more resilient but still at real risk.

Exposure happens three ways: skin contact (spot-on "natural" flea products, spilled oils, human skin the pet licks), ingestion (grooming oil off fur, chewing containers), and inhalation (diffusers, sprays). Oils repeatedly flagged as dangerous include tea tree (melaleuca), pennyroyal, wintergreen, pine, citrus/d-limonene, peppermint, cinnamon, clove, eucalyptus, and ylang-ylang. Even "pet-safe" diffuser blends can trigger problems in sensitive animals or in poorly ventilated rooms.

Signs of essential-oil poisoning include drooling, vomiting, tremors, wobbliness or difficulty walking, low body temperature, weakness, difficulty breathing, redness or burns at the application site, and a strong oil smell on the breath or coat. Respiratory signs — coughing, wheezing, labored breathing — are especially urgent in cats and birds. Because oils are absorbed quickly, symptoms can appear within hours.

The safe approach is caution bordering on avoidance. Do not apply undiluted essential oils to pets, and never use tea tree oil on animals. Keep diffusers out of rooms where cats and birds live, or avoid them entirely in multi-pet homes; ensure any diffuser use is brief, in a well-ventilated space, with the pet free to leave. Store oils securely. If exposure occurs, do not induce vomiting — wipe off skin oil, move the pet to fresh air, and call a veterinarian or animal poison control immediately with the product name in hand.`,
    whenPeopleExplore:
      'Using a diffuser at home with pets, considering a "natural" essential-oil flea product, or worried a pet licked or inhaled an oil.',
    approaches: [
      'Never apply undiluted essential oils to pets; avoid tea tree oil on animals entirely.',
      'Keep diffusers out of rooms with cats or birds, or skip them in multi-pet homes.',
      'Store oils securely and clean up spills a grooming pet could lick.',
      'If exposure happens, wipe off oil, move to fresh air, and call poison control — do not induce vomiting.',
    ],
    relatedPlantIds: ['wild-mint'],
    safetyWarnings: [
      'Tea tree, pennyroyal, wintergreen, citrus, pine, and peppermint oils are among those toxic to pets.',
      'Cats and birds are extremely sensitive — inhaled oils alone can cause harm.',
      'Tremors, drooling, wobbliness, or breathing trouble after oil exposure is an emergency.',
    ],
    sources: [
      {
        label: 'Pet Poison Helpline — Essential oils and cats',
        url: 'https://www.petpoisonhelpline.com/poison/essential-oils/',
      },
      {
        label: 'ASPCA — Essential oil diffusers and pets',
        url: 'https://www.aspca.org/news/what-you-need-know-about-essential-oil-diffusers-and-pets',
      },
    ],
  },
  {
    id: 'reiki-energy-work-animals',
    title: 'Reiki & energy work for animals',
    category: 'energy-modalities',
    summary:
      'A grounded look at Reiki and energy work offered for animals as a calming, relationship-based comfort practice — what actually happens in a session, realistic expectations, and firm limits around medical care.',
    imageUrl: IMG.reiki,
    imageCredit: 'Reiki treatment — Wikimedia Commons (CC BY-SA)',
    deepDive: `Reiki is a Japanese relaxation practice in which a practitioner places hands on or near the body with the intention of supporting calm and wellbeing. Applied to animals, it is offered mainly as a gentle, low-stress comfort measure — for anxious shelter animals, pets recovering from illness or surgery, or companions in hospice and end-of-life care. Honest framing matters: there is no robust scientific evidence that Reiki treats disease, and any benefit is best understood as relaxation, stress reduction, and the calming effect of quiet, attentive human presence.

Animal Reiki looks different from the human version. Good practitioners work on the animal's terms, often at a distance, letting the animal approach or move away freely rather than restraining it. Sessions are quiet and slow, and many animals visibly relax — softening posture, yawning, lying down, or falling asleep. For a fearful dog or an over-stimulated cat, that reduction in arousal can be genuinely valuable and can make handling, vet visits, or recovery less stressful.

The mechanism debate is unresolved and, for practical purposes, secondary. Whether one attributes changes to "energy," to the animal responding to a calm human, or to simply being given uninterrupted quiet time, the reasonable use is the same: as a complementary comfort practice, never as a treatment. This is where care must be taken. Energy work must never delay diagnosis or treatment of a sick or injured animal, and no ethical practitioner will claim to cure disease, replace medication, or diagnose illness.

If you explore it, choose a practitioner who respects consent-based, low-stress handling, works alongside your veterinarian, and makes modest, honest claims. Reiki can be a soothing addition to palliative care and stress management. It is not medicine, and the moment an animal shows signs of pain, decline, or illness, the veterinarian comes first.`,
    whenPeopleExplore:
      'A highly anxious or fearful animal, comfort during recovery or hospice, or wanting a calm bonding ritual alongside veterinary care.',
    approaches: [
      'Treat Reiki as a relaxation and comfort practice, not a medical treatment.',
      'Choose practitioners who work consent-based and let the animal approach or leave freely.',
      'Use it as an adjunct in stress reduction, recovery, and end-of-life comfort — alongside your vet.',
      'Be wary of anyone claiming energy work can cure disease or replace medication.',
    ],
    relatedPlantIds: ['wild-mint', 'yarrow'],
    safetyWarnings: [
      'Energy work has no proven ability to cure disease and must never delay veterinary care.',
      'A sick, injured, or declining animal needs a veterinarian first — comfort practices come second.',
      'Reject any practitioner who offers to diagnose illness or stop prescribed medication.',
    ],
    sources: [
      {
        label: 'NCCIH — Reiki',
        url: 'https://www.nccih.nih.gov/health/reiki',
      },
      {
        label: 'AVMA — Complementary and integrative veterinary medicine',
        url: 'https://www.avma.org/resources-tools/avma-policies/complementary-and-integrative-veterinary-medicine',
      },
    ],
  },
  {
    id: 'horse-bodywork-acupuncture',
    title: 'Horse bodywork & acupuncture overview',
    category: 'horses-livestock',
    summary:
      'How equine massage, stretching, chiropractic, and veterinary acupuncture are used to support performance, comfort, and rehabilitation in horses — with attention to credentials and the legal role of the veterinarian.',
    imageUrl: IMG.horse,
    imageCredit: 'Horses — Wikimedia Commons (CC BY-SA)',
    deepDive: `Horses are large athletes whose careers and comfort depend on musculoskeletal health, which is why bodywork and acupuncture are widely used in the equine world. Equine massage, myofascial release, stretching, and chiropractic manipulation aim to reduce muscle tension, improve range of motion, and support recovery from the repetitive strain of riding, driving, and competition. Veterinary acupuncture — the insertion of fine needles at specific points — is used for pain management, particularly for back soreness and osteoarthritis, and has a growing evidence base for analgesia in animals.

These modalities work best as part of a plan that starts with a diagnosis. Many "behavioral" or "training" problems in horses — bucking, refusing jumps, girthiness, uneven gaits — are actually pain signals from the back, hocks, stomach ulcers, or ill-fitting tack. A veterinarian should evaluate lameness and rule out injury before bodywork begins, because massaging or manipulating an area with a fracture, infection, or acute injury can cause harm. Once serious problems are excluded or being treated, bodywork can genuinely aid comfort and maintenance.

Credentials and legality matter more than many owners realize. In most jurisdictions, acupuncture and chiropractic on animals are veterinary acts that must be performed or directly supervised by a licensed veterinarian; certifying bodies include IVAS (International Veterinary Acupuncture Society) and the AVCA for animal chiropractic. Equine massage therapists often work under veterinary referral. Choosing certified practitioners protects the horse and keeps care within the law.

Realistic expectations help. Bodywork and acupuncture are supportive and maintenance therapies — they ease tension, may reduce pain, and can complement rehabilitation, but they do not fix structural injuries, replace joint injections when indicated, or substitute for proper farriery, saddle fit, and conditioning. The strongest results come from a team: veterinarian, farrier, trainer, and a credentialed bodyworker, all communicating around one horse.`,
    whenPeopleExplore:
      'A performance horse with stiffness or tension, a horse with back soreness or subtle gait changes, or rehabilitation after injury under veterinary guidance.',
    approaches: [
      'Get a veterinary lameness and pain workup before bodywork — many "attitude" problems are pain.',
      'Use certified practitioners: IVAS for acupuncture, AVCA for animal chiropractic.',
      'Layer bodywork with proper saddle fit, farriery, and conditioning rather than in place of them.',
      'Treat acupuncture and massage as maintenance and comfort therapies, not fixes for structural injury.',
    ],
    relatedPlantIds: ['yarrow', 'wild-mint', 'burdock'],
    safetyWarnings: [
      'In most areas, animal acupuncture and chiropractic are veterinary acts requiring a licensed vet or supervision.',
      'Never manipulate or massage an acutely injured, fractured, or infected area.',
      'Sudden lameness, severe pain, colic signs, or neurologic changes require immediate veterinary care.',
    ],
    sources: [
      {
        label: 'International Veterinary Acupuncture Society (IVAS)',
        url: 'https://www.ivas.org/',
      },
      {
        label: 'AAEP — Owner resources',
        url: 'https://aaep.org/horse-owners/',
      },
    ],
  },
  {
    id: 'livestock-natural-parasite-support',
    title: 'Livestock natural parasite support (not DIY pharma)',
    category: 'horses-livestock',
    summary:
      'Evidence-informed grazing and management strategies that reduce parasite burden in sheep, goats, and cattle — pasture rotation, FAMACHA scoring, and targeted deworming — and why herbal "dewormers" are not reliable substitutes.',
    imageUrl: IMG.livestock,
    imageCredit: 'Cattle — Wikimedia Commons (CC BY-SA)',
    deepDive: `Internal parasites, especially the barber pole worm (Haemonchus contortus) in small ruminants, are a leading cause of illness and death in pastured livestock. Rising drug resistance has made producers eager for "natural" solutions — but the most effective natural strategy is management, not a herbal potion. This topic focuses on sustainable parasite control that reduces reliance on dewormers while keeping animals safe, rather than promoting DIY herbal pharmacy.

The backbone is grazing management. Parasite larvae live on the lower few inches of pasture, so rotational grazing, resting paddocks, higher grazing heights, and multi-species grazing (cattle and small ruminants clean up each other's parasites) all lower exposure. Good nutrition — adequate protein and minerals such as copper and cobalt — helps animals mount their own resistance. Genetic selection for parasite-resistant animals is a powerful long-term tool.

Targeted selective treatment replaces routine whole-flock deworming. The FAMACHA system scores anemia by eyelid color, identifying only the individuals that actually need treatment, which preserves "refugia" — the parasite population still susceptible to drugs — and slows resistance. Fecal egg counts guide decisions and check whether a dewormer still works.

Where do plants fit? Some forages genuinely help: condensed-tannin plants like sericea lespedeza and birdsfoot trefoil have research support for reducing worm burden, and copper oxide wire particles show effect against Haemonchus in some settings. But garlic, diatomaceous earth, and most herbal "dewormer" blends have weak or no evidence and can lull producers into a false sense of security while animals quietly become dangerously anemic. When drugs are needed, they are needed — a heavily parasitized animal can die.

The responsible model combines pasture management, nutrition, genetics, FAMACHA-guided targeted treatment, and a working relationship with a large-animal veterinarian who can run fecal counts and prescribe effective dewormers when scores demand it.`,
    whenPeopleExplore:
      'Managing worms in sheep, goats, or cattle; facing dewormer resistance; or wanting to reduce chemical inputs sustainably on pasture.',
    approaches: [
      'Prioritize rotational and multi-species grazing to break the parasite life cycle.',
      'Use FAMACHA scoring and fecal egg counts to treat only the animals that need it.',
      'Support resistance with good protein, minerals, and selective breeding for hardy animals.',
      'Consider evidence-backed forages (sericea lespedeza, birdsfoot trefoil) as adjuncts, not replacements.',
    ],
    relatedPlantIds: ['burdock', 'dandelion', 'yarrow'],
    safetyWarnings: [
      'Herbal "dewormers," garlic, and diatomaceous earth are not reliable — animals can become fatally anemic while owners wait.',
      'Never dose livestock with human or off-label products without veterinary guidance and correct withdrawal times.',
      'Pale gums, bottle jaw, weakness, or rapid decline signal severe parasitism needing prompt veterinary treatment.',
    ],
    sources: [
      {
        label: 'American Consortium for Small Ruminant Parasite Control (ACSRPC)',
        url: 'https://www.wormx.info/',
      },
      {
        label: 'FAMACHA and integrated parasite management',
        url: 'https://www.wormx.info/famacha',
      },
    ],
  },
  {
    id: 'raw-feeding-species-appropriate-diets',
    title: 'Raw feeding & species-appropriate diets debate',
    category: 'herbs-nutrition',
    summary:
      'A balanced look at the raw and "species-appropriate" feeding movement for dogs and cats — the arguments on each side, the documented risks of raw diets, and how to feed safely whichever path you choose.',
    imageUrl: IMG.rawFeeding,
    imageCredit: 'Raw meat — Wikimedia Commons (CC BY-SA)',
    deepDive: `Few pet topics generate as much passion as raw feeding. Advocates argue that dogs and cats evolved to eat raw meat, bone, and organ, and that "species-appropriate" diets improve coat, digestion, dental health, and energy. Critics — including most veterinary nutrition bodies — point to documented risks. This entry lays out both sides so owners can make an informed, honest decision, ideally with a veterinarian who understands nutrition.

The case for raw and fresh feeding: cats are obligate carnivores with genuinely high protein needs, and dogs are facultative carnivores. Fresh, minimally processed diets can be highly palatable and digestible, and some owners report visible improvements. Home-prepared and commercial raw options give control over ingredients and appeal to those wary of ultra-processed kibble.

The documented risks are the crux of the debate. Raw meat frequently carries Salmonella, Listeria, and E. coli, which can sicken the pet and, importantly, the humans in the household — a public-health concern in homes with children, elderly, or immunocompromised people. Many home-prepared raw diets are nutritionally unbalanced; studies repeatedly find deficiencies or excesses in calcium, phosphorus, and vitamins that cause real harm over time, especially in growing puppies and kittens. Whole bones can fracture teeth or cause obstructions. Cooked diets, by contrast, reduce pathogen risk but must still be formulated correctly — a plain-chicken-and-rice recipe is not complete.

The reasonable middle ground: whatever you feed, insist on nutritional completeness. Look for diets formulated by a board-certified veterinary nutritionist and meeting AAFCO/WSAVA standards, or work with one to balance a home recipe. If choosing raw, practice strict food-safety hygiene and reconsider it in high-risk households. The "kibble versus raw" war is less important than the quiet requirement that every bowl be complete, balanced, safe, and matched to that individual animal's life stage and health.`,
    whenPeopleExplore:
      'Considering a raw or fresh-food diet, hearing conflicting advice online, or wanting to feed a "species-appropriate" diet safely.',
    approaches: [
      'Demand nutritional completeness: AAFCO/WSAVA standards or a board-certified veterinary nutritionist recipe.',
      'If feeding raw, follow strict food-safety hygiene to protect both pets and people.',
      'Reconsider raw in homes with children, elderly, or immunocompromised members.',
      'Match any diet to the animal\'s life stage and health — puppies, kittens, and sick pets are least forgiving.',
    ],
    relatedPlantIds: ['dandelion', 'burdock', 'plantain'],
    safetyWarnings: [
      'Raw meat can carry Salmonella and other pathogens dangerous to pets and humans alike.',
      'Home-prepared diets are often nutritionally unbalanced — get a professional recipe, especially for young animals.',
      'Whole bones can fracture teeth or cause life-threatening obstructions.',
    ],
    sources: [
      {
        label: 'WSAVA — Global nutrition guidelines',
        url: 'https://wsava.org/global-guidelines/global-nutrition-guidelines/',
      },
      {
        label: 'FDA — Get the facts about raw pet food',
        url: 'https://www.fda.gov/animal-veterinary/animal-health-literacy/get-facts-raw-pet-food-diets-can-be-dangerous-you-and-your-pet',
      },
    ],
  },
  {
    id: 'cbd-hemp-pets-research',
    title: 'CBD & hemp for pets — what research says',
    category: 'herbs-nutrition',
    summary:
      'An evidence-focused summary of cannabidiol (CBD) for dogs and cats: the promising early research on canine arthritis, the many unknowns, product-quality pitfalls, and the crucial THC-toxicity warning.',
    imageUrl: IMG.hemp,
    imageCredit: 'Cannabis leaf — Wikimedia Commons (CC BY-SA)',
    deepDive: `CBD (cannabidiol) products for pets have exploded in popularity, and unlike many complementary trends, there is a growing body of actual research — though it remains early and mostly limited to dogs. CBD is one of many compounds in hemp and cannabis; unlike THC, it is not intoxicating. Interest centers on pain, arthritis, anxiety, and seizures.

The strongest evidence is for canine osteoarthritis. Several small controlled studies from institutions such as Cornell and Baylor found that CBD oil improved comfort and activity in arthritic dogs at appropriate doses, generally with good tolerance. Research into CBD for canine epilepsy has shown mixed but somewhat encouraging results as an add-on to standard medication. Evidence for anxiety is much weaker and inconsistent, and studies in cats are sparse — cats appear to metabolize CBD differently and may need different dosing.

The unknowns are significant. Optimal doses, long-term safety, and drug interactions are not fully established; CBD is processed by liver enzymes that also handle many medications, so combining it with other drugs warrants veterinary oversight. The most common lab finding is elevated liver enzymes, meaning monitoring bloodwork is prudent for regular use.

Product quality is a serious, practical problem. The market is poorly regulated, and independent testing repeatedly finds products that contain far less CBD than labeled, or more THC than allowed. That leads to the single most important safety point: THC is toxic to pets, and marijuana or high-THC product ingestion causes a recognizable poisoning (wobbliness, urine dribbling, sensitivity to sound and touch, low heart rate) that requires veterinary care. Human edibles are doubly dangerous because chocolate and xylitol may also be present.

If exploring CBD, involve your veterinarian, choose products with a certificate of analysis from third-party testing, verify THC content is minimal, start low, and monitor. Treat it as a promising adjunct for arthritis in dogs — not a proven cure-all, and not something to buy blindly online.`,
    whenPeopleExplore:
      'An arthritic older dog, a pet with anxiety or seizures on standard treatment, or curiosity about hemp products marketed for animals.',
    approaches: [
      'Involve your veterinarian, especially if the pet takes other medications metabolized by the liver.',
      'Choose products with a third-party certificate of analysis confirming CBD content and minimal THC.',
      'Start with a low, weight-based dose and monitor; consider periodic liver bloodwork for regular use.',
      'Set realistic expectations — evidence is strongest for canine arthritis, weak for anxiety, and thin in cats.',
    ],
    relatedPlantIds: ['wild-mint', 'yarrow'],
    safetyWarnings: [
      'THC is toxic to pets — marijuana and high-THC products cause poisoning needing veterinary care.',
      'The CBD market is poorly regulated; mislabeled products may contain little CBD or unsafe THC.',
      'Human edibles are especially dangerous — chocolate and xylitol may be present alongside THC.',
    ],
    sources: [
      {
        label: 'AKC Canine Health Foundation — CBD research',
        url: 'https://www.akcchf.org/',
      },
      {
        label: 'Pet Poison Helpline — Marijuana',
        url: 'https://www.petpoisonhelpline.com/poison/marijuana/',
      },
    ],
  },
  {
    id: 'bach-flower-remedies-anxious-animals',
    title: 'Bach flower remedies for anxious animals',
    category: 'energy-modalities',
    summary:
      'What Bach flower remedies (including "Rescue Remedy") are, why they are popular for stressed pets, what the evidence actually shows, and how to keep behavioral anxiety in the hands of professionals.',
    imageUrl: IMG.bachFlowers,
    imageCredit: 'Rock rose (Helianthemum) — a classic Bach remedy plant, Wikimedia Commons (CC BY-SA)',
    deepDive: `Bach flower remedies are dilute liquid preparations made from flowers, developed in the 1930s by physician Edward Bach, who believed emotional states could be gently rebalanced. The best-known product, "Rescue Remedy," is widely marketed for stressed pets — fireworks, thunderstorms, travel, vet visits, and separation. They are extremely popular precisely because they are gentle, but honesty about the evidence is essential.

Controlled studies of Bach remedies in humans have generally found effects no greater than placebo, and there is essentially no quality evidence that they treat anxiety in animals. The remedies are highly diluted, contain no pharmacologically active dose of the plant, and most pet formulations are preserved in a small amount of alcohol or glycerin. The reasonable interpretation is that any observed calming is placebo (felt by the owner), coincidence, or the effect of the owner slowing down and comforting the animal — not a specific pharmacological action.

That said, the safety profile is very favorable: alcohol-free glycerin versions are widely considered low-risk, and the alcohol content of standard versions is tiny, though it is still best avoided in small pets and, especially, in cats, who are sensitive to alcohol. Because the risk is low, some owners use them as a harmless ritual alongside genuine behavioral tools.

The important point is what Bach remedies should not replace. Meaningful pet anxiety — noise phobias, separation distress, aggression — responds to evidence-based approaches: gradual desensitization and counterconditioning, environmental management, pheromone products, and, when appropriate, prescription anti-anxiety medication from a veterinarian or veterinary behaviorist. Untreated fear tends to worsen and can seriously harm welfare. So the safe pattern is to treat Bach remedies as, at most, a benign complement while pursuing real behavioral help. If an animal is truly suffering with anxiety, a veterinary behaviorist — not a flower tincture — is the answer.`,
    whenPeopleExplore:
      'A pet stressed by fireworks, storms, travel, or vet visits, or wanting a gentle, low-risk ritual alongside behavior work.',
    approaches: [
      'Treat Bach remedies as, at most, a benign complement — not a treatment for real anxiety.',
      'Prefer alcohol-free glycerin formulations, especially for cats and small pets.',
      'Pursue evidence-based behavior tools: desensitization, counterconditioning, and environmental management.',
      'See a veterinarian or veterinary behaviorist for phobias, separation distress, or aggression.',
    ],
    relatedPlantIds: ['wild-mint', 'self-heal'],
    safetyWarnings: [
      'There is no good evidence Bach remedies treat anxiety — do not rely on them for genuine distress.',
      'Avoid alcohol-based tinctures in cats and small animals; choose glycerin versions.',
      'Severe or worsening anxiety and aggression need a veterinary behaviorist, not a flower remedy.',
    ],
    sources: [
      {
        label: 'NCCIH — Are flower remedies effective?',
        url: 'https://www.nccih.nih.gov/health/homeopathy',
      },
      {
        label: 'American College of Veterinary Behaviorists',
        url: 'https://www.dacvb.org/',
      },
    ],
  },
  {
    id: 'emergency-vs-holistic-when-to-go',
    title: 'Emergency vet vs holistic care — when to go now',
    category: 'legal-safety',
    summary:
      'A practical, potentially life-saving guide to recognizing true veterinary emergencies where complementary care must be set aside immediately — and how to prepare so you never hesitate in a crisis.',
    imageUrl: IMG.emergency,
    imageCredit: 'Animal hospital emergency care — Wikimedia Commons (CC BY-SA)',
    deepDive: `The single most important lesson in any discussion of natural and holistic pet care is knowing when to stop and drive to an emergency clinic. Complementary approaches have a place in chronic, stable, and comfort-focused situations. They have no place in an emergency, where minutes matter and delay can be fatal. This topic is a clear-eyed guide to that line.

Certain signs mean go now, without stopping for home remedies: difficulty breathing, blue or gray gums, or open-mouth breathing in cats; collapse, sudden weakness, or inability to stand; seizures, or repeated seizures; a distended, hard abdomen with unproductive retching (bloat/GDV in dogs is a rapid killer); a male cat straining in the litter box producing little urine (urinary blockage); heavy or uncontrolled bleeding; suspected poisoning (chocolate, xylitol, antifreeze, rodenticide, medications, lilies in cats); heatstroke; trauma such as being hit by a car; a bloated or painful belly; pale white gums; inability to deliver during labor; and severe, sudden pain or crying.

For toxins specifically, act immediately and call ASPCA Animal Poison Control ((888) 426-4435) or Pet Poison Helpline while heading to a clinic — do not wait for symptoms, and do not induce vomiting unless a professional instructs you to. Cats are exquisitely sensitive to lilies and to many household products; even small exposures can be deadly.

Preparation removes hesitation. Before you ever need it, save your regular vet, the nearest 24-hour emergency hospital, and poison control numbers in your phone. Know your route and keep a carrier ready. Have a basic sense of your pet's normal — gum color, breathing rate, appetite — so you can recognize change fast.

None of this diminishes complementary care; it defines its scope. Integrative therapies support wellness and chronic conditions between crises. But when the warning signs above appear, there is only one correct response, and it is the emergency vet. When in doubt, call and go — it is always better to be told your pet is fine than to arrive too late.`,
    whenPeopleExplore:
      'Wanting to know exactly when natural care must yield to emergency medicine, or building a plan before a crisis happens.',
    approaches: [
      'Memorize the "go now" signs: breathing trouble, collapse, seizures, bloat, urinary blockage, heavy bleeding, poisoning.',
      'For suspected toxins, call poison control and head to a clinic immediately — do not wait for symptoms.',
      'Save your vet, a 24-hour emergency hospital, and poison-control numbers before you need them.',
      'Know your pet\'s normal (gums, breathing, appetite) so you can spot dangerous change fast.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Breathing trouble, collapse, seizures, bloat, urinary blockage, heavy bleeding, or poisoning are emergencies — go now.',
      'Do not induce vomiting unless a veterinarian or poison-control professional tells you to.',
      'When in doubt, call and go — complementary care never substitutes for emergency medicine.',
    ],
    sources: [
      {
        label: 'ASPCA Animal Poison Control Center',
        url: 'https://www.aspca.org/pet-care/animal-poison-control',
        description: '24/7 hotline: (888) 426-4435.',
      },
      {
        label: 'AVMA — Emergency care for pets',
        url: 'https://www.avma.org/resources-tools/pet-owners/emergencycare',
      },
    ],
  },
];

export const ANIMAL_HEALTH_CATEGORY_ORDER: AnimalHealthCategory[] = [
  'holistic-vet',
  'dogs-cats',
  'horses-livestock',
  'herbs-nutrition',
  'energy-modalities',
  'legal-safety',
];

export function getAnimalHealthTopic(id: string): AnimalHealthTopic | undefined {
  return ANIMAL_HEALTH_LIBRARY.find((t) => t.id === id);
}

export function matchesAnimalHealthCategory(
  topic: AnimalHealthTopic,
  category: AnimalHealthCategory | 'all',
): boolean {
  if (category === 'all') return true;
  return topic.category === category;
}
