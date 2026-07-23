import type { ExternalLink } from './types';

/** Where a featured Living Knowledge essay appears. */
export type FeaturedEssayPage = 'plants-home' | 'holistic' | 'hypnosis' | 'edibles' | 'herbs';

export type FeaturedEssay = {
  id: string;
  page: FeaturedEssayPage;
  title: string;
  /** Short eyebrow / category label on the card */
  categoryLabel: string;
  summary: string;
  /** Long-form article body (~800–1200 words). Supports blank-line paragraphs. */
  deepDive: string;
  /** Optional simple ASCII / markdown chart block rendered after deep dive */
  chartBlock?: string;
  imageUrl: string;
  imageCredit?: string;
  whenPeopleExplore: string;
  approaches: string[];
  safetyWarnings: string[];
  sources: ExternalLink[];
  videoLinks: ExternalLink[];
  relatedPlantIds: string[];
  /** Accent theme for card chrome */
  accent: 'emerald' | 'violet' | 'cyan' | 'lime' | 'amber';
};

export const FEATURED_ESSAYS: FeaturedEssay[] = [
  {
    id: 'regenerative-eyesight-minds-eye',
    page: 'holistic',
    title: 'Regenerative Eyesight & the Mind’s Eye — Magnetism Traditions, Perception Training, and What We Can Honestly Say',
    categoryLabel: 'Featured · Modalities',
    accent: 'violet',
    imageUrl: '/oregon-plant-medicine/regenerative-eyesight-minds-eye.jpg',
    imageCredit: 'AiBhive Living Knowledge — regenerative eyesight & mind’s eye illustration',
    summary:
      'An educational overview of regenerative-eyesight folklore (including Russian magnetic/ophthalmic research and fingertip “biofield” practices), contrasted with the modern Mind’s Eye / mindsight movement — blindfolded card reading, sports drills, and perception training claimed by thousands of students worldwide. Not medical advice.',
    whenPeopleExplore:
      'Interest in vision recovery traditions, Mind’s Eye / blindfold perception demos, or bridging folk magnetism with cautious self-study.',
    approaches: [
      'Fingertip / hand near-eye relaxation practices as traditionally described (never press hard on the globe).',
      'Historical reading of Fyodorov-style pulsed magnetic ophthalmology as clinical device literature — not a home protocol.',
      'Mind’s Eye color → card → dynamic drill progressions as popularly taught.',
      'Open-eye sports vision drills as a separate evidence track from mindsight claims.',
      'Video study with skeptical cross-checks and opaque-mask test conditions.',
    ],
    relatedPlantIds: ['yarrow', 'plantain', 'usnea', 'douglas-fir-tip'],
    safetyWarnings: [
      'Vision changes need an eye doctor; regenerative folklore is not a substitute for exams.',
      'Sudden vision loss, flashes, curtains over the visual field, eye pain, or injury need urgent medical evaluation.',
      'Never press hard on the eyeballs; avoid DIY strong magnets near the head if you have implants or metallic fragments.',
      'Blindfold training can cause falls — clear the room; supervise children.',
      'Do not drive, bike, or operate tools while blindfolded.',
      'If a program promises guaranteed restoration of organic blindness, treat that as a red flag.',
    ],
    videoLinks: [
      {
        label: 'Incredible Kids Can Read While Completely Blindfolded',
        url: 'https://www.youtube.com/watch?v=rC7xZmLcOeY',
        description: 'Popular Mind’s Eye / third-eye blindfold reading demonstration.',
      },
      {
        label: 'Matrixwissen Documentary: Seeing Without Eyes',
        url: 'https://www.youtube.com/watch?v=NhU-_ekGiP4',
        description: 'Documentary tests with Mindfold-style opaque masks.',
      },
      {
        label: '1000 Blindfolds',
        url: 'https://www.youtube.com/watch?v=NoV8ofc88Yo',
        description: 'Overview of mindsight history including Hopkins and blind students.',
      },
      {
        label: 'Mark Komissarov infovision presentation',
        url: 'https://www.youtube.com/watch?v=U8zk9lKuqso',
        description: 'Russian-adjacent blindfold perception demo (study critically).',
      },
    ],
    sources: [
      {
        label: 'Fyodorov et al. — Device and method for restoration of visual functions (US 5,147,284)',
        url: 'https://www.freepatentsonline.com/5147284.html',
        description: 'Pulsed magnetic / inductor ophthalmology patent literature.',
      },
      {
        label: 'Mindsight Journey — eyeless vision training overview',
        url: 'https://mindsightjourney.com/',
        description: 'Contemporary mindsight training framing (not clinical proof).',
      },
      {
        label: 'PMC — High-performance vision training & collegiate batting',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3261847/',
        description: 'Open-eye sports vision training — keep distinct from mindsight claims.',
      },
    ],
    deepDive: `Seeing is usually framed as a simple camera: light hits the retina, nerves fire, the brain builds a picture. Regenerative-eyesight traditions — and the Mind’s Eye movement — ask a different question: can vision improve, reorganize, or even bypass the eyeball when attention, training, and subtle energetic practices are involved?

This library entry is for private study. It is not a treatment plan, a cure claim, or permission to delay ophthalmology care. Sudden vision loss, flashes, curtains over the visual field, eye pain, or injury need urgent medical evaluation.

Part I — Regenerative eyesight and Russian magnetic research

When people speak of “regenerating eyesight,” they often mix three different ideas:

1. Optical correction (glasses, contacts, refractive surgery)
2. Tissue healing (cornea, retina, optic nerve recovering after injury or disease)
3. Perceptual training (the brain getting better at using whatever signal remains)

Soviet and Russian ophthalmology explored the second path with pulsed magnetic fields. The best-documented clinical figure here is Svyatoslav Fyodorov and collaborators, who patented devices and methods for restoring visual function when the optic nerve or retina were affected — including implanted inductors and remote pulsed magnetic stimulation in the roughly 0.1–0.25 tesla range, timed in courses of short daily sessions. Separate Russian work also studied rotating magnetic fields for corneal wound healing. That is laboratory and clinic magnetotherapy, not a folk parlor trick.

Alongside that clinical line sits a looser folk practice many remember only vaguely: fingertips held near or lightly toward the closed eyes, with the claim that the body’s own “magnetism” or biofield supports regeneration. In popular retellings this gets attributed to “Russian researchers,” but it is usually a hand-to-eye energetic / magnetotherapy folk protocol, not the Fyodorov implant literature. Treat fingertip work as a relaxation and attention practice unless a licensed clinician is supervising something else. Do not press hard on the globe; do not use strong neodymium magnets near the eyes without professional guidance; do not stop prescribed care.

Part II — Mind’s Eye as a main topic

Mind’s Eye (also mindsight, eyeless vision, extra-ocular perception) is the claim that people can learn to identify colors, read cards or print, navigate rooms, and even play sports while wearing opaque blindfolds. Teachers and programs from several countries have popularized this — including early U.S. “Mind Sight” training associated with Lloyd F. Hopkins, later European and North American blindfold-perception schools, and Russian-adjacent presentation styles sometimes discussed under names like infovision. Viral clips show children sorting cards, reading pages, kicking balls, or playing games with Mindfold-style masks.

Students usually describe the experience not as ordinary optical sight through the fabric, but as an inner image — a felt picture, light, or knowing that appears in the mind’s eye. Training progressions often move from calm breathing / cardiac coherence, to color patches, shapes and numbers, letters and short words, then cards, objects, and dynamic tasks (catching, aiming, baseball-style drills).

Whether the mechanism is unused sensory channels, light leakage around imperfect masks, cueing, extraordinary attention, or something not yet measured is actively debated. Honest research posture means watching demonstrations and reading skeptical critiques. For Living Knowledge, the useful angle is not “prove magic” — it is mapping a living human-potential literature so readers can study it with curiosity and caution.

Part III — Why baseball and cards keep showing up

Cards are a clean training target: finite symbols, quick feedback, measurable accuracy. Baseball-style drills (tracking a ball, calling color/number, blindfolded catch games in demos) stress dynamic perception under time pressure. Separately, mainstream sports science has shown that conventional vision training (strobe glasses, near-far focus, tracking drills) can improve batting metrics in collegiate players — that is eye-brain motor training with the eyes open, not mindsight. Keep those buckets distinct when you read claims.

How to explore (educational)

Journal baseline vision and stress/sleep; note that rest alone changes subjective clarity. Study Russian magnetotherapy as history of ophthalmology devices, not a home protocol. If curious about Mind’s Eye, watch multiple sources, compare mask types, and note test conditions. Pair curiosity with optometry: healthy tissue still matters for ordinary sight.`,
    chartBlock: `Tradition | What it claimed | Evidence posture
---|---|---
Fyodorov-style pulsed magnetotherapy | Stimulate optic nerve / retinal pathways | Clinical patents & device literature; specialist context
Folk fingertip / hand magnetism | Subtle field near eyes aids regeneration | Anecdotal / traditional; not a validated home cure
Behavioral vision therapy | Train focus, tracking, convergence | Mixed clinical evidence; sports/rehab use exists
Mind’s Eye / mindsight | Perceive while blindfolded | Popular demonstrations; contested by skeptics`,
  },
  {
    id: 'why-we-forage-plant-medicine-vital-force',
    page: 'plants-home',
    title: 'Why We Forage — Plant Medicine, Forest Intelligence, and the Vital Force of Fresh-Picked Herbs',
    categoryLabel: 'Featured · Living Knowledge',
    accent: 'emerald',
    imageUrl: '/oregon-plant-medicine/why-we-forage-vital-force.jpg',
    imageCredit: 'AiBhive Living Knowledge — fresh-harvest foraging illustration',
    summary:
      'A living-knowledge essay on why wild foraging and plant medicine still matter — from Indigenous and classical herbal lineages to the ~80% of humanity that uses traditional plant care — plus the claim that freshly picked plants carry a higher energetic charge, bridged to real phytochemistry on vitamin C and aromatic oils.',
    whenPeopleExplore:
      'Beginning foragers, herbalists comparing fresh vs dried medicine, or anyone wanting the “why” behind Living Knowledge’s plant libraries.',
    approaches: [
      'Seasonal one-plant mastery before expanding the repertoire.',
      'Fresh-first teas and foods when aromatic intensity is the goal.',
      'Ethical wildcrafting — take less than 10%, know land rules, honor stewardship.',
      'Gentle drying only when storage is required — and admit the chemistry tradeoff.',
      'Video + field-guide triangulation with our three-photo ID cards.',
      'Optional gratitude / offering practices as relationship technology.',
    ],
    relatedPlantIds: [
      'stinging-nettle',
      'oregon-grape',
      'yarrow',
      'chanterelle',
      'elderberry',
      'douglas-fir-tip',
    ],
    safetyWarnings: [
      '100% identification or it stays in the ground — many edibles have toxic look-alikes.',
      'Avoid roadsides, spray zones, and polluted water.',
      'Know toxic mushroom look-alikes; cook wild mushrooms thoroughly when required.',
      'Medicinal use in pregnancy, with prescriptions, or in children needs a qualified practitioner.',
      'Foraging on closed, private, or culturally sensitive land without permission is not holistic.',
    ],
    videoLinks: [
      {
        label: 'Pacific Northwest Forest Foraging with Sergei Boutenko',
        url: 'https://www.youtube.com/watch?v=j3a3QdtaE0s',
        description: 'Long Oregon woods plant walk — 30+ wild edibles.',
      },
      {
        label: '5 Wild Edibles in the Pacific Northwest',
        url: 'https://www.youtube.com/watch?v=nAnGusWjhwA',
        description: 'Short Hike Oregon primer.',
      },
      {
        label: 'Oregon Field Guide — Coastal Foraging (PBS)',
        url: 'https://www.pbs.org/video/coastal-foraging-moa0qh/',
        description: 'Coast ecology and ethical harvest.',
      },
      {
        label: 'Original Fare — Beginner’s Guide to Foraging (PBS)',
        url: 'https://www.pbs.org/video/original-fare-the-beginners-guide-to-foraging/',
        description: 'Coast greens and flowers with a chef’s eye.',
      },
    ],
    sources: [
      {
        label: 'WHO — Traditional medicine Q&A',
        url: 'https://www.who.int/news-room/questions-and-answers/item/traditional-medicine',
        description: 'Global use of traditional, complementary, and integrative medicine.',
      },
      {
        label: 'PMC — Growing use of herbal medicines',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3887317/',
        description: 'Widely cited ~80% herbal primary-care estimate and safety discussion.',
      },
      {
        label: 'Herb drying & vitamin C / essential oil losses (review literature)',
        url: 'https://doi.org/10.15611/nit.2015.2.05',
        description: 'Drying can slash ascorbic acid and aromatics vs fresh material.',
      },
      {
        label: 'Lamiaceae drying & antioxidant potential',
        url: 'https://doi.org/10.2478/hepo-2021-0004',
        description: 'Large vitamin C losses; polyphenols sometimes rise after drying.',
      },
    ],
    deepDive: `Walk into a Pacific Northwest forest after rain and the air itself feels medicinal: Douglas-fir resin, wet salal, crushed yarrow on a trail edge. Foraging is not a weekend hobby bolted onto modern life. For most of human history it was the pharmacy, the grocery, and the spiritual classroom. This essay is why Living Knowledge exists — and why we still kneel in the duff with a field guide.

This is educational, not a harvest license and not medical advice. Never eat a wild plant or mushroom without 100% identification. Respect land rules, Indigenous stewardship, and the plant’s right to remain abundant.

Why foraging and plant medicine are valuable

Food that is also medicine. Nettle, miner’s lettuce, rose hips, and chanterelles are calories and micronutrients and traditional remedies. “Food as medicine” is not a slogan here; it is how Willamette Valley and coastal communities ate for millennia.

Relationship, not just extraction. Good foragers learn seasons, soils, look-alikes, and restraint. That relationship builds ecological literacy no supplement aisle can sell.

Resilience. Knowing three spring greens, two safe berries, and one unmistakable mushroom is practical sovereignty — useful in thin supply chains and beautiful on ordinary Tuesdays.

Continuity of knowledge. Plant medicine carries Indigenous PNW knowledge, European eclectic herbalism, Chinese food-medicine homology, Ayurveda, and kitchen witchery. When we ID Oregon grape or usnea, we touch that braid.

Modern pharmacology still drinks from the same well. WHO notes traditional and complementary medicine is used across most member states, and that roughly 40% of pharmaceutical products have a natural-product basis. Aspirin’s story begins with willow; berberine traditions echo in Oregon grape. The forest was the original R&D lab.

How widely it is used

Herbal and traditional plant medicine is not fringe. Roughly 80% of people worldwide rely on herbal or traditional medicine for some primary care (long-cited WHO-linked estimates). WHO’s newer surveys find that in many countries, 40–90%+ of the population uses traditional, complementary, or integrative medicine. In high-income countries, herbal use often sits in the ~40–70% “used at least once” range depending on nation. Forests are routinely called nature’s pharmacies by FAO and conservation bodies — conservation of medicinal plants is a public-health issue, not only a botanical one. You are not weird for wanting a jar of elderberry syrup or a spring nettle soup. You are statistically ordinary.

A short historical thread

Indigenous PNW: food, medicine, fiber, and ceremony woven together — salal, huckleberry, cedar, devil’s club, and dozens more, with harvest protocols that protect future generations. Classical Old World: Dioscorides, Galenic humors, monastery physic gardens. Eclectic and physiomedical herbalists (19th c. North America): bitter tonics, astringents, “vital force.” Twentieth and twenty-first centuries: clinical phytochemistry meets folk practice; WHO traditional-medicine centers; a foraging renaissance in Oregon, California, and beyond. History’s lesson: plants were never only “alternative.” They were primary — and they still are for billions.

The woo (on purpose): fresh-picked plants and higher energy

Holistic herbalists often say a plant’s vital force, qi, or spirit is strongest when it is alive, local, and freshly gathered — that the moment of harvest is a handshake between your nervous system and the plant’s. Some traditions teach speaking to the plant, leaving an offering, harvesting in morning dew, or using the herb within hours so the “green fire” has not gone out.

In that view, a supermarket tea bag is a faint echo. A dried culinary spice jar is useful but “asleep.” A fresh bitter leaf chewed on the trail is awake — higher vibration, cleaner information, medicine that still remembers the forest.

Living Knowledge holds space for that language. You do not have to believe in plant spirits to notice that fresh herbs smell louder, stain greener, and taste more alive. Many herbalists treat that sensory intensity as the vernacular of vitality.

Science that rhymes with the woo

We cannot lab-assay “spirit.” We can measure what fades after harvest — and it often tracks the intuition that fresh is stronger.

Vitamin C (ascorbic acid) is famously fragile. Reviews of herb drying report enormous losses versus fresh material — on the order of ~80–95% for some culinary and medicinal leaves under conventional drying (for example mint, lemon balm, and sage in published drying studies). Spinach left drying at room temperature has been reported to lose the vast majority of its vitamin C within days.

Essential oils and aromatics (the smell of the plant — often the energetic signature in folk terms) can drop by tens of percent up to ~70% depending on species and method.

Polyphenols are messier: sometimes measured higher after drying because cell walls break and extraction improves — so “fresh is always higher in every assay” is false. The honest synthesis: volatile, heat-sensitive, living-tissue chemistry (vitamin C, many oils, bright green chlorophyll character) favors fresh; some stable phenolics survive drying well.

Translation for the woo-friendly reader: if “energy” means the bright, aromatic, perishable life of the plant, science agrees that clock starts at harvest. If “energy” means every antioxidant number on a dry-weight lab report, drying is more nuanced. Fresh-picked still wins the living experience.

Forest ID — learn with your eyes

Pair this essay with real identification practice (Oregon / PNW-friendly) using the videos linked below, then open our Edibles and Plant library tabs for three-photo ID cards, look-alikes, and regional filters.

How to practice (living knowledge, not dogma)

Learn one plant per week to mastery before adding another. Harvest less than 10% of a patch; never strip roots of scarce species. Prefer morning, vigorous plants; process fresh when the medicine is aromatic. Dry gently when you must store — and admit the tradeoff. Keep the woo and the lab in dialogue: smell the difference, then read a drying study.`,
    chartBlock: `Compound class | Fresh | After typical drying (illustrative ranges)
---|---|---
Vitamin C (many herbs) | 100% | ~5–25% retained
Essential oils | 100% | ~30–70% retained (wide range)
Polyphenols (variable) | 100% | often similar or higher in dry-weight assays`,
  },
  {
    id: 'past-life-regression-qhht-hypnosis-healing',
    page: 'hypnosis',
    title: 'Past-Life Regression, Quantum Healing Hypnosis & the Subconscious as Healer',
    categoryLabel: 'Featured · Regression',
    accent: 'cyan',
    imageUrl: '/oregon-plant-medicine/past-life-qhht-hypnosis-healing.jpg',
    imageCredit: 'AiBhive Living Knowledge — past-life regression & QHHT illustration',
    summary:
      'An educational deep dive into past-life regression therapy and hypnosis healing — Dolores Cannon’s Quantum Healing Hypnosis Technique (QHHT), reported miracle case narratives from her work, how her daughter Julia Cannon carries the lineage forward, a light touch on scalar energy, and why hypnosis remains valuable across clinical and spiritual applications. Not therapy or medical advice.',
    whenPeopleExplore:
      'Spiritual curiosity after reading Cannon, unexplained patterns that feel “older than this life,” or interest in subconscious-directed healing alongside conventional care.',
    approaches: [
      'Past-life regression with trauma-informed pacing and integration.',
      'QHHT-style day sessions: intake, deep trance, Subconscious dialogue, requested healing if permitted.',
      'Julia Cannon’s Soul Speak framing — symptoms as body language.',
      'Clinical hypnotherapy with licensed clinicians for pain, habits, and anxiety.',
      'Self-hypnosis for daily nervous-system training.',
      'Curious-but-critical reading of scalar-energy wellness claims.',
    ],
    relatedPlantIds: ['stinging-nettle', 'wild-mint', 'yarrow'],
    safetyWarnings: [
      'Not a replacement for emergency, oncologic, surgical, or psychiatric care.',
      'Trauma history needs trauma-informed facilitators.',
      'Avoid practitioners who guarantee cures or discourage medical treatment.',
      'Past-life material can be emotionally intense — have support.',
      'Verify QHHT certification on the official directory; clinical goals need licensed clinicians.',
    ],
    videoLinks: [
      {
        label: 'QHHT Official — Quantum Healing Hypnosis Technique',
        url: 'https://www.qhhtofficial.com/',
        description: 'Official training, method overview, and practitioner pathways.',
      },
      {
        label: 'Laura’s QHHT Miracle (Dolores Cannon site)',
        url: 'https://dolorescannon.com/lauras-qhht-miracle/',
        description: 'Full first-person testimonial from a 2012 session with Dolores.',
      },
      {
        label: 'Dolores Cannon lectures & talks (YouTube)',
        url: 'https://www.youtube.com/results?search_query=Dolores+Cannon+QHHT',
        description: 'Search official and archival Cannon presentations.',
      },
      {
        label: 'Julia Cannon — Soul Speak / lineage interviews',
        url: 'https://www.positivelife.ie/2020/04/the-souls-voice-we-interview-julia-cannon/',
        description: 'Interview on QHHT legacy and body–soul communication.',
      },
    ],
    sources: [
      {
        label: 'QHHT Official',
        url: 'https://www.qhhtofficial.com/',
        description: 'Dolores Cannon’s Quantum Healing Hypnosis Technique℠.',
      },
      {
        label: 'Laura’s QHHT Miracle',
        url: 'https://dolorescannon.com/lauras-qhht-miracle/',
        description: 'Documented client testimonial (Laura Casto, 2012).',
      },
      {
        label: 'Ozark Mountain Publishing — Dolores Cannon',
        url: 'https://www.ozarkmt.com/',
        description: 'Cannon book catalog including Convoluted Universe series.',
      },
      {
        label: 'American Society of Clinical Hypnosis',
        url: 'https://www.asch.net/',
        description: 'Clinical hypnosis standards for licensed professionals.',
      },
    ],
    deepDive: `Hypnosis is one of the oldest healing technologies that never went away. Strip the stage show and you find a simple human capacity: focused attention, reduced peripheral chatter, and a nervous system willing to rewrite its story. Past-life regression and Dolores Cannon’s Quantum Healing Hypnosis Technique (QHHT) sit on the spiritual edge of that capacity — where clients explore other lifetimes, dialogue with what Cannon called the Subconscious (Higher Self / Oversoul), and sometimes report physical and emotional transformations that look, from the outside, like miracles.

This Living Knowledge essay is for study and orientation. It is not a substitute for medical or psychiatric care, and it does not claim clinical proof of reincarnation or guaranteed cures.

Past-life regression — a basic overview

In a typical past-life regression (PLR), a trained facilitator guides you into trance — not sleep, but a deeply absorbed, dreamlike focus. From there, open questions invite scenes that feel like another identity: clothing, landscape, relationships, a death, a lesson. Some therapists treat these as literal prior incarnations; others as symbolic material from the unconscious that still heals when witnessed. Either frame can be therapeutically useful if the client feels safer, freer, or more compassionate afterward.

Common reasons people explore PLR include recurring fears or relationship patterns that don’t match this life’s biography; grief, purpose questions, or spiritual curiosity; body symptoms that seem emotionally “charged”; and interest after reading authors like Cannon, Brian Weiss, or Michael Newton (life-between-lives). Good practice emphasizes consent, pacing, trauma-informed safety, and integration afterward — journaling, rest, and not making huge life decisions in the first 24 hours.

Dolores Cannon and QHHT

Dolores Cannon (1931–2014) spent roughly four decades refining hypnosis after early experiments with her husband Johnny. What began as curiosity about reincarnation became a full method: day-long sessions, a distinctive induction into what she called the Somnambulistic state, past-life exploration, and — crucially — direct conversation with the client’s Subconscious, which in her model holds the blueprint of the body and soul.

Around 2002 the method was named Quantum Healing Hypnosis Technique (QHHT). In Cannon’s framing, the Subconscious can explain why a condition is present, what lesson it carries, and whether healing is allowed — sometimes delivering energetic or metaphorical “repairs” that clients experience as dramatic relief. She documented thousands of sessions across books such as The Convoluted Universe series, Between Death and Life, and many case-centered volumes, blending healing narratives with cosmology, ET contact themes, and soul mechanics.

A QHHT-style day often includes a long intake (history, questions for the Subconscious), induction into deep trance, one or more past-life scenes relevant to present issues, dialogue with the Subconscious / Higher Self, and requested healing (if permitted) plus review. Official training and practitioner directories live at qhhtofficial.com. Ethical practitioners do not replace oncology, surgery, or psychiatric medication.

Reported miracle cases (as documented — not clinical trials)

Cannon and her community emphasize that many profound healings stay private. A few clients go public. The most detailed first-person account on the official Dolores Cannon site is Laura Casto’s June 20, 2012 session with Dolores herself.

As Laura tells it, she arrived oxygen-dependent and on a walker, with severe cervical arthritis flattening her spinal cord, long-term silicone-related immune damage, uncontrolled asthma, pulmonary hypertension (described as progressive/terminal), chronic pancreatitis, and multiple cysts. Physicians had discussed hospice. During the session she explored past-life “carryover” material (including a death in a dust storm linked to her asthma) and lessons around pride, unworthiness, and learning to ask for help. She reports that mid-session her oxygen concentrator was turned off on guidance that she no longer needed it; she felt her lower lung lobes inflate and could breathe deeply. In the months after, she reports being off asthma meds and oxygen; cervical MRI described as normal after falls; thyroid cyst gone on ultrasound; pancreatitis resolved; improved cardiac findings; and a return to walking outdoors — a life she describes as fully given back. She later became a QHHT practitioner.

Intro material on that same page also notes practitioners witnessing sessions where clients reported restored hearing, cancers remitting, birth defects reversing, and surgeries averted. Those remain anecdotal and testimonial claims — powerful as lived stories, not the same as peer-reviewed medical evidence. Living Knowledge holds both truths: miracles are reported; science has not standardized them.

Julia Cannon — carrying the work forward

After Dolores’s passing in 2014, her daughter Julia Cannon — a former registered nurse with decades in ICU and home health — stepped more fully into stewardship of the lineage. She helps sustain QHHT Official training (including modern online Level 1 pathways), speaks widely on body–soul communication, and authored Soul Speak: The Language of Your Body, which teaches how symptoms can be read as messages. Julia also developed intuitive energy work she calls Lightcasting, describing light directed through hands and eyes to balance physical, mental, and spiritual layers while receiving impressions for the client’s self-healing.

In interviews she frames QHHT less as “Dolores fixes you” and more as remembering that love and knowledge are already inside — the technique is a bridge to the part of you that already knows.

Scalar energy — a light touch

Adjacent to spiritual hypnosis sits scalar energy talk: non-Hertzian / longitudinal “standing” fields associated in popular literature with Tesla and later theorists such as Thomas Bearden, said to interact with biology without behaving like ordinary radio waves. Wellness practitioners market scalar devices and rooms for stress reduction and cellular balance. Mainstream physics does not treat consumer “scalar healing” as established medicine; the useful Living Knowledge stance is curiosity with discernment — interesting metaphysics, thin clinical consensus. Where it meets hypnosis is mostly philosophical: both assume mind and field can organize matter toward coherence. Do not buy devices as a cancer plan.

Why hypnosis still has enormous value

Even if you never chase a past life, hypnosis earns its keep. Clinical hypnotherapy supports pain, procedural anxiety, IBS, and habit change alongside medical care. Trauma-informed trance builds safety and resources before deep material. Self-hypnosis is daily nervous-system training anyone can learn. Spiritual PLR and QHHT offer meaning, forgiveness, identity work, and reported spontaneous healing. Performance and focus applications help athletes, creatives, and test anxiety.

The shared mechanism is suggestion plus absorption plus meaning. Cannon’s gift was pushing that mechanism all the way to the Subconscious as a healing partner.

How to explore safely

Prefer certified QHHT practitioners via the official directory; for clinical goals, seek licensed clinicians with ASCH-style training. Keep your doctors in the loop for physical disease. Read a Cannon book and a clinical hypnosis overview so both hemispheres stay online. After deep sessions: water, rest, gentle integration — no major contracts the same night.`,
    chartBlock: `Application | Why it matters
---|---
Clinical hypnotherapy | Pain, procedural anxiety, IBS, habit change — studied alongside medical care
Trauma-informed trance | Builds safety and resources before deep material
Self-hypnosis | Daily nervous-system training anyone can learn
Spiritual PLR / QHHT | Meaning, forgiveness, identity, reported spontaneous healing
Performance & focus | Athletes, creatives, test anxiety`,
  },
  {
    id: 'mycelium-food-meat-substitutes',
    page: 'edibles',
    title: 'Mycelium on the Menu — Growing Fungal Networks for Food, Meat Alternatives & a Lighter Footprint',
    categoryLabel: 'Featured · Edible fungi',
    accent: 'lime',
    imageUrl: '/oregon-plant-medicine/mycelium-food-meat-substitutes.jpg',
    imageCredit: 'AiBhive Living Knowledge — mycelium food & meat-alternative illustration',
    summary:
      'A living-knowledge tour of culinary mycelium: why people grow oyster, lion’s mane, and mycelium biomass as everyday food and meat substitutes, how sustainable and beginner-friendly home cultivation can be, and the fun science of fungal networks — alongside wild PNW mushrooms in our Edibles library.',
    whenPeopleExplore:
      'Curiosity about plant-based / fungi-based meat alternatives, home mushroom kits, or pairing wild foraging with cultivated mycelium foods.',
    approaches: [
      'Start with ready-to-fruit oyster or lion’s mane kits before full sterile lab technique.',
      'Grow on pasteurized straw, hardwood sawdust, or coffee-ground mixes suited to the species.',
      'Cook mycelium and fruiting bodies thoroughly; explore shredded “pulled” textures as meat alternatives.',
      'Compost spent blocks — circular kitchen gardening.',
      'Compare cultivated mycelium foods with wild edibles (chanterelle, morel) without confusing the two skill sets.',
    ],
    relatedPlantIds: ['oyster-mushroom', 'lions-mane', 'chanterelle', 'wine-cap', 'enoki', 'turkey-tail'],
    safetyWarnings: [
      'Never eat wild mushrooms without 100% identification — cultivation and foraging are different skills.',
      'Use food-grade, known mushroom species only; avoid random outdoor mycelium you cannot ID.',
      'Moldy, foul-smelling, or contaminated bags should be discarded — do not salvage uncertain cultures.',
      'People with mold allergies or severe immune compromise should ask a clinician before intensive grow-room work.',
      'Cook culinary mushrooms and mycelium products; raw wild fungi are a common source of GI distress.',
    ],
    videoLinks: [
      {
        label: 'Pacific Northwest Forest Foraging with Sergei Boutenko',
        url: 'https://www.youtube.com/watch?v=j3a3QdtaE0s',
        description: 'Wild PNW edibles context — pair with cultivated mycelium curiosity.',
      },
      {
        label: 'How to Grow Oyster Mushrooms (home cultivation overview)',
        url: 'https://www.youtube.com/results?search_query=how+to+grow+oyster+mushrooms+at+home',
        description: 'Search beginner oyster grows — filter for clear sterile/pasteurization demos.',
      },
      {
        label: 'Lion’s mane cultivation basics',
        url: 'https://www.youtube.com/results?search_query=lions+mane+mushroom+grow+kit+harvest',
        description: 'Popular gourmet mycelium fruiting at home.',
      },
      {
        label: 'Mycelium meat alternatives explained',
        url: 'https://www.youtube.com/results?search_query=mycelium+meat+alternative+fermentation',
        description: 'Commercial and kitchen-scale mycelium protein explainers.',
      },
    ],
    sources: [
      {
        label: 'FAO — edible insects & alternative proteins context',
        url: 'https://www.fao.org/food-systems/en/',
        description: 'Broader sustainable food-systems framing that includes novel proteins.',
      },
      {
        label: 'Mycological Society of America — education',
        url: 'https://msafungi.org/',
        description: 'Fungal biology literacy for growers and foragers.',
      },
      {
        label: 'PSMS — Pacific Northwest mushroom ID',
        url: 'https://www.psms.org/',
        description: 'Regional wild-mushroom education (do not confuse with cultivation).',
      },
      {
        label: 'Living Knowledge — edible mushrooms library',
        url: 'https://aibhive.com/plants',
        description: 'In-app oyster, lion’s mane, chanterelle, and more ID cards.',
      },
    ],
    deepDive: `Mycelium is the hidden body of the mushroom — a living white (or cream, or pale) web of threads that digests wood, straw, coffee grounds, and other carbon into more of itself. For most of foraging history we chased the fruiting body: the chanterelle in the duff, the morel after a burn. Now kitchens, startups, and backyard growers are falling in love with the network itself. Mycelium can be grown as food, shredded into meaty textures, pressed into cutlets, fermented into bacon-ish strips, or simply fruited into oyster bouquets on a windowsill. This essay is the fun, practical, Living Knowledge overview of why mycelium belongs on the Edibles page.

This is educational, not a sterile-lab certification and not medical advice. Cultivation uses known culinary species. Foraging still requires 100% wild ID. Never eat an unknown outdoor fungus because “it looked like mycelium.”

What mycelium actually is

Think of a mushroom as an apple and mycelium as the whole tree — except the “tree” is a soft, branching network called hyphae. Those hyphae secrete enzymes, break down substrate, and knit into a mat strong enough to hold shape. When conditions are right (humidity, fresh air, light cues), the mat pins and fruits. Gourmet growers harvest either the fruiting bodies or, increasingly, the biomass itself before full fruiting — that biomass is the star of many mycelium meat alternatives.

Why people grow it as food

Protein and fiber with a story. Culinary mycelium (especially from oyster and related species) can be high in protein relative to many vegetables, rich in fiber, and naturally umami. It browns, shreds, and soaks sauces like a good pulled protein.

Flavor playground. Lion’s mane fries into lobster-ish bites. Oysters take garlic and smoke. Wine caps grown in garden beds taste earthy and savory. Enoki brings noodle texture to broths.

Speed. Compared with raising livestock — or even waiting on a tomato crop — oyster kits can colonize and fruit in weeks. That feedback loop is addictive in the best way: you watch a bag turn into dinner.

Kitchen circularity. Spent coffee grounds, pasteurized cardboard, straw, and sawdust become food instead of trash. Many home growers feed spent blocks to gardens as a soil amendment once fruiting slows.

Meat substitutes — the mycelium burger moment

Commercial mycelium meats (think fermentation tanks growing Fusarium or similar food-safe fungi, or gourmet mycelium biomass formed into patties and strips) aim to mimic the chew and browning of animal protein without the feedlot. At home, the low-tech cousin is simple: grow oysters or lion’s mane, sauté hard, shred with a fork, season like carnitas or crab cakes. The fun is that mycelium wants to be fibrous. You are not fighting a soft tofu block — you are collaborating with a network that already built structure.

Sustainability — why fungi feel lighter on the land

Mycelium cultivation can be dramatically land- and water-efficient compared with conventional beef when grown on agricultural byproducts. It does not require clearing pasture. It can upcycle waste streams. Vertical grow rooms pack protein into small footprints. Life-cycle numbers vary by facility and energy source — honest Living Knowledge framing: mycelium is promising, not magic. The greenest grow still depends on clean electricity, smart substrate sourcing, and not shipping novelty snacks across oceans for vibes alone. Even so, a closet oyster farm that turns local coffee waste into weekly dinners is a real climate-friendly hobby with dinner attached.

How easy is it, really?

Beginner easy: buy a reputable ready-to-fruit kit (oyster or lion’s mane). Slice the bag, mist, wait for pins, harvest. Failure mode is usually drying out or giving up too early.

Intermediate: inoculate pasteurized straw or supplemented sawdust with grain spawn. Learn clean technique, not NASA clean rooms. Wine-cap beds outdoors are famously forgiving.

Advanced: agar work, cloning wild stems (where legal and ethical), liquid culture, and monotubs. Fun, geeky, and optional.

The honest learning curve: contamination happens. Green mold teaches humility. Then you try again. That cycle — fail, compost, reinoculate — is part of the mycelial charm.

Fun things worth knowing

Mycelium can sense and route around obstacles; networks share resources in ways that make poets and mycologists equally dramatic.

A single oyster block can flush multiple times — several harvests from one “planting.”

You can grow mushrooms on a bookshelf, in a bathroom (with airflow sense), or in a shaded garden bed.

Lion’s mane looks like a cascading white waterfall and tastes like seafood when pan-seared — conversation starter guaranteed.

Mycelium leather, packaging foam, and building materials are cousins of food mycelium — same kingdom, different product lines. Dinner first; architecture later.

Pairing cultivation with our wild Edibles library

Wild chanterelles and morels are gifts of forest ecology; they are not beginner grow-kit species. Oyster, lion’s mane, wine cap, and enoki bridge the gap: learn fungal life cycles indoors, then take that respect into the woods with our three-photo ID cards and look-alike warnings. Cultivation makes you a better forager because you finally see the organism as a process, not a grocery SKU.

How to start this week

Pick one culinary species. Get a kit or a bag of spawn from a trusted supplier. Read the humidity instructions twice. Photograph every stage. Cook the first harvest simply — butter, salt, garlic — before inventing mycelium carne asada. Compost what fails. Share what fruits.

Mycelium rewards attention. It is food, science fair, climate hobby, and slightly magical roommate all at once — which is exactly why it earns a featured seat above the Edibles grid.`,
    chartBlock: `Path | Effort | Typical timeline | Best for
---|---|---|---
Ready-to-fruit kit (oyster / lion’s mane) | Low | ~1–3 weeks to harvest | Absolute beginners, apartments
Pasteurized straw / sawdust bags | Medium | Colonize then fruit in weeks | Regular home growers
Outdoor wine-cap beds | Medium-low | Season-dependent | Gardeners with shade beds
Commercial mycelium meat fermentation | Industrial | Continuous tanks | Packaged meat alternatives
Wild foraging (chanterelle, morel) | Skill-based | Season & ecology | Forest ID — not a grow kit`,
  },
  {
    id: 'irish-sea-moss-mineral-gel',
    page: 'herbs',
    title: 'Irish Sea Moss — Atlantic Carrageenan, Mineral Gel, and How to Use It Honestly',
    categoryLabel: 'Featured · Coastal herbs',
    accent: 'amber',
    imageUrl: '/oregon-plant-medicine/irish-sea-moss-mineral-gel.jpg',
    imageCredit: 'AiBhive Living Knowledge — Irish sea moss (Chondrus crispus) tide-pool illustration',
    summary:
      'A practical Living Knowledge deep dive on true Irish sea moss (Chondrus crispus): what it is, how traditional Atlantic communities prepared the mineral-rich gel, how it differs from colorful “sea moss” sold online, iodine/heavy-metal cautions, and kitchen uses — educational only, not medical advice.',
    whenPeopleExplore:
      'Interest in sea moss gel, thyroid/iodine folklore, smoothie bowls, vegan thickeners, or Caribbean / Irish coastal food traditions.',
    approaches: [
      'Identify true Chondrus crispus (cartilaginous, branching, purple-to-green) vs look-alike “pool-grown” moss products.',
      'Rinse, soak, and simmer into a neutral gel for soups, smoothies, and sauces.',
      'Use culinary amounts — not megadoses of raw dried moss or unlabeled extracts.',
      'Source from cold Atlantic waters with harvest ethics; prefer tested food-grade product when not foraging yourself.',
      'Pair with whole-food mineral diversity (greens, seafood, dairy/alternatives) rather than sea moss as a sole “92 minerals” cure.',
    ],
    relatedPlantIds: ['usnea', 'douglas-fir-tip', 'oregon-grape', 'yarrow'],
    safetyWarnings: [
      'Seaweeds concentrate iodine and can disrupt thyroid function in excess — people with thyroid disease should ask a clinician before regular use.',
      'Coastal seaweeds can bioaccumulate heavy metals and pollutants — prefer tested food-grade sources; rinse thoroughly.',
      'Foraging intertidal species: check local harvest regulations, leave holdfasts, and avoid polluted harbors.',
      'Not a treatment for COVID, cancer, infertility, or “detox.” Marketing claims of “92 minerals curing disease” are not clinical evidence.',
      'Allergy to iodine/seafood is a reason for caution; start with small culinary amounts.',
      'Educational reference only — not medical advice.',
    ],
    videoLinks: [
      {
        label: 'Sea moss gel preparation (culinary overview)',
        url: 'https://www.youtube.com/results?search_query=irish+sea+moss+gel+chondrus+crispus',
        description: 'Search culinary demos — verify the Latin name on any product shown.',
      },
      {
        label: 'Edible seaweed & forage ethics (educational search)',
        url: 'https://www.youtube.com/results?search_query=chondrus+crispus+irish+moss+biology',
        description: 'Prefer university / natural-history explainers over supplement ads.',
      },
    ],
    sources: [
      {
        label: 'NIH ODS — Iodine fact sheet',
        url: 'https://ods.od.nih.gov/factsheets/Iodine-HealthProfessional/',
        description: 'Iodine physiology, upper limits, and thyroid context for seaweed foods.',
      },
      {
        label: 'FAO — Seaweeds used as human food',
        url: 'https://www.fao.org/4/y4765e/y4765e0b.htm',
        description: 'Global edible seaweed overview including carrageenophytes.',
      },
      {
        label: 'Encyclopedia of Life — Chondrus crispus',
        url: 'https://eol.org/pages/910873',
        description: 'Taxonomy and natural history of Irish moss.',
      },
      {
        label: 'FDA — Carrageenan in foods',
        url: 'https://www.fda.gov/food',
        description: 'Food-additive framing for refined carrageenan vs whole sea moss gel.',
      },
    ],
    deepDive: `Walk an Irish or Maritime Canada tide line at low water and you may find a cartilaginous, branching red alga pressed flat against rock: Chondrus crispus — Irish moss, carrageen moss, the plant behind the classic “sea moss gel” of coastal kitchens. In Living Knowledge we treat it as a featured Herbs essay because it sits at the crossroads of folk materia medica, food thickener, and modern wellness marketing. This page is for honest education: what the organism is, how people traditionally used it, what science can and cannot claim, and how to prepare a gel without swallowing every claim on a supplement pouch.

Not medical advice. If you have thyroid disease, are pregnant, or take medication, talk with a clinician before making seaweed a daily habit.

What Irish sea moss actually is

True Irish sea moss is Chondrus crispus (and closely related red algae in the Gigartinaceae). It is not a terrestrial moss. It is a red seaweed that grows on rocky North Atlantic shores from Europe to eastern North America. Fresh fronds are stiff, fan-branched, and range from deep purple-red to olive-green depending on light and season. When dried they bleach toward pale cream or gold — the color many grocery bags show.

The gel people love comes from cell-wall polysaccharides called carrageenans. When you rinse, soak, and gently simmer the fronds, those polysaccharides hydrate into a smooth, nearly flavorless gel that sets as it cools. That gel thickens soups, smoothies, ice cream, and vegan puddings the way agar or cornstarch might — with a softer, more elastic mouthfeel.

A hard truth about the internet aisle

Much of what is sold as “sea moss” online is not wild Chondrus. Colorful gold, purple, and green “pools” of moss are often Gracilaria or other cultivated red algae grown in tanks or tropical waters, then marketed with Irish-moss folklore attached. Some products are excellent food. Some are mislabeled. Living Knowledge framing: read the Latin name. Prefer Chondrus crispus (or clearly named Gracilaria if that is what you want). Be skeptical of rainbow piles promising pharmaceutical miracles.

Traditional and culinary use

Irish and Scottish coastal communities simmered carrageen in milk for blancmange-style puddings and as a soothing drink during colds — food-as-comfort more than standardized phytotherapy. In parts of the Caribbean, sea moss drinks (often blended with milk, nutmeg, and sweeteners) are cultural staples associated with vitality. Those traditions deserve respect as food culture. They are not the same as a randomized trial proving disease reversal.

Kitchen method (home gel)

1. Inspect: remove grit, shells, and any fronds that smell rotten.
2. Rinse in cool fresh water several times.
3. Soak 4–12 hours until expanded and softer (change water if very salty).
4. Simmer gently in fresh water until fronds break down (often 15–25 minutes).
5. Blend smooth; cool in a clean jar. Refrigerate and use within about a week, or freeze in portions.

Start with a spoonful in a smoothie or soup — culinary seasoning scale — not a cup of gel as a “protocol.”

Minerals, iodine, and the “92 minerals” claim

Seaweeds can contribute iodine, some magnesium, potassium, and trace elements depending on species and ocean chemistry. That does not mean every bag delivers a fixed list of ninety-two minerals in clinically meaningful doses, nor that more is better. Iodine is a Goldilocks nutrient: deficiency harms the thyroid; excess also harms the thyroid. People with Hashimoto’s, Graves’, nodules, or on thyroid hormone should not self-dose seaweed aggressively. NIH iodine fact sheets are better guides than influencer reels.

Heavy metals and harvest ethics

Filter-feeding and mineral-concentrating organisms can also concentrate cadmium, arsenic, lead, or local pollutants. Buy from suppliers who test lots when possible. If you forage: know your coastline, avoid industrial outfalls, follow local rules, and never strip a rock bare — leave holdfasts and enough biomass for the bed to recover.

Carrageenan controversy — keep the categories straight

Refined food-additive carrageenan (extracted, purified) has a separate regulatory and research debate from whole cooked sea moss gel. Internet arguments often mash them together. Whole traditional gel is a food; industrial carrageenan is an ingredient. Neither is a license to ignore personal tolerance — if gel upsets your gut, stop.

How this fits the Herbs library

On /plants/herbs we study Western, Chinese, and Ayurvedic materia medica with preparation and caution front-and-center. Irish sea moss belongs here as a coastal botanical food used like an herbaceous thickener and tonic food — alongside honest limits. It is not a substitute for thyroid medication, not an antiviral prescription, and not a detox cleanse. It is a tide-pool organism that becomes a versatile gel when treated with respect.

A Living Knowledge practice week

Buy a small amount of clearly labeled Chondrus (or skip buying and study photos until you can tell it from look-alikes). Make one jar of gel. Use it three ways: smoothie, soup, and a simple pudding. Journal taste, digestion, and any thyroid-related symptoms if you already track those with a clinician. Compare labels on two commercial “sea moss” products and note which print a Latin binomial. That habit — species first, hype second — is the same discipline we ask of foragers in the plant and mushroom libraries.

Irish sea moss rewards curiosity. Keep the romance of the Atlantic shore, keep the gel in the kitchen, and keep medical claims on a short leash.`,
    chartBlock: `Form | What it is | Best use | Caution
---|---|---|---
Wild / food-grade Chondrus crispus | True Irish moss fronds | Traditional gel, puddings, soups | Iodine + metals; thyroid caution
Cultivated Gracilaria “sea moss” | Different red alga, often pool-grown | Smoothie gels when clearly labeled | Do not assume identical minerals/folklore
Refined carrageenan additive | Purified polysaccharide | Commercial thickeners | Separate debate from whole-plant gel
Sea moss capsules / tonics | Variable extracts | Only if label + testing are clear | Marketing claims ≠ clinical proof`,
  },
];

export function getFeaturedEssay(page: FeaturedEssayPage): FeaturedEssay | undefined {
  return FEATURED_ESSAYS.find((e) => e.page === page);
}

export function getFeaturedEssayById(id: string): FeaturedEssay | undefined {
  return FEATURED_ESSAYS.find((e) => e.id === id);
}
