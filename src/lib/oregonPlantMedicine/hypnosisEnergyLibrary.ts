import type { HypnosisEnergyCategory, HypnosisEnergyTopic } from './hypnosisEnergyTypes';
import { applyHypnosisExpanded } from './hypnosisEnergyExpanded';

const HYPNOSIS_ENERGY_LIBRARY_BASE = [
  {
    id: 'past-life-regression',
    title: 'Past life regression therapy — overview',
    category: 'regression',
    summary:
      'A hypnotic method where clients explore imagery or narratives framed as memories from prior lifetimes — used by some therapists for insight, phobia work, and meaning-making, not as proven historical fact.',
    whenPeopleExplore:
      'Unexplained fears, recurring relationship patterns, curiosity after reading Michael Newton or Brian Weiss, or interest in spiritual biography.',
    approaches: [
      'Progressive relaxation and safe-place imagery before any “memory” emerges.',
      'Open-ended prompts (“What do you notice?”) rather than leading questions — reduces false-memory risk.',
      'Integration session afterward: journaling, grounding, and distinguishing metaphor from literal belief.',
      'Often paired with talk therapy when trauma or dissociation is present.',
    ],
    relatedPlantIds: ['wild-mint', 'douglas-fir-tip'],
    safetyWarnings: [
      'Not appropriate as sole treatment for PTSD, psychosis, or active substance withdrawal.',
      'Leading therapists can implant vivid but inaccurate “memories.”',
      'Seek licensed clinicians trained in regression ethics (e.g. ASCH-affiliated hypnotherapists).',
    ],
    sources: [
      {
        label: 'APA — Hypnosis',
        url: 'https://www.apa.org/topics/hypnosis',
        description: 'What clinical hypnosis is and is not.',
      },
      {
        label: 'Michael Newton Institute',
        url: 'https://www.newtoninstitute.org/',
        description: 'Life-between-lives regression training (spiritual framework).',
      },
    ],
  },
  {
    id: 'life-between-lives',
    title: 'Life-between-lives (LBL) regression',
    category: 'regression',
    summary:
      'An extension of past-life work popularized by Michael Newton — clients in deep trance describe a “between lives” realm, soul groups, and life planning. Explored for grief, purpose, and existential comfort.',
    whenPeopleExplore:
      'After a loved one’s death, midlife questioning, or following Newton’s Journey of Souls.',
    approaches: [
      'Multi-hour sessions with certified LBL facilitators.',
      'Pre-session intention setting and post-session integration calls.',
      'Contrasted with brief “past life” glimpses — LBL aims for transcendent, archetypal imagery.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Deep trance is contraindicated for some psychiatric conditions without medical clearance.',
      'Spiritual interpretations vary — not empirically verified as literal cosmology.',
    ],
    sources: [
      {
        label: 'The Newton Institute',
        url: 'https://www.newtoninstitute.org/',
      },
    ],
  },
  {
    id: 'edgar-cayce-hypnosis',
    title: 'Edgar Cayce — hypnosis & the subconscious',
    category: 'traditions',
    summary:
      'The “Sleeping Prophet” entered self-induced trance to give thousands of readings on health, spirituality, and past lives. Modern Cayce work blends suggestion, prayer, and attunement before sleep.',
    whenPeopleExplore:
      'Interest in holistic health history, A.R.E. study groups, or Cayce’s approach to “ideals” and subconscious healing.',
    approaches: [
      'Cayce’s own method: lie down, clear the mind, hold a written question, allow imagery or impressions.',
      'A.R.E. study groups read and discuss readings with emphasis on application, not fortune-telling.',
      'Some practitioners combine Cayce-inspired suggestion with clinical hypnosis for habit change.',
    ],
    relatedPlantIds: ['wild-mint', 'cottonwood'],
    safetyWarnings: [
      'Readings are spiritual/historical reference — not individualized medical prescriptions today.',
      'Do not delay evidence-based care for serious illness based on a Cayce summary.',
    ],
    sources: [
      {
        label: 'Edgar Cayce\'s A.R.E.',
        url: 'https://www.edgarcayce.org/',
        description: 'Official archive and education.',
      },
    ],
  },
  {
    id: 'dolores-cannon-qhht',
    title: 'Dolores Cannon & QHHT',
    category: 'traditions',
    summary:
      'Quantum Healing Hypnosis Technique (QHHT) uses a specific induction to access “the subconscious” for physical and emotional insight. Dolores Cannon trained practitioners worldwide before her passing in 2014.',
    whenPeopleExplore:
      'Chronic symptoms unexplained by conventional tests, spiritual awakening, or interest in Cannon’s Convoluted Universe series.',
    approaches: [
      'Day-long sessions: interview, hypnosis, recorded dialogue with “the subconscious.”',
      'Practitioners ask permission before suggesting metaphorical healing imagery.',
      'Level 1–3 practitioner training through QHHT official curriculum.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'QHHT is not a replacement for oncology, surgery, or psychiatric medication.',
      'Verify practitioner certification on the official QHHT directory.',
      'Intense sessions may require rest and integration; not for acute psychosis.',
    ],
    sources: [
      {
        label: 'QHHT Official',
        url: 'https://www.qhhtofficial.com/',
      },
      {
        label: 'Dolores Cannon — Ozark Mountain Publishing',
        url: 'https://www.ozarkmountainpublishing.com/',
      },
    ],
  },
  {
    id: 'modern-clinical-hypnotherapy',
    title: 'Modern clinical hypnotherapy for healing',
    category: 'hypnotherapy',
    summary:
      'Evidence-informed hypnosis used by licensed professionals for pain, IBS, anxiety, habit change, and procedural distress — distinct from stage hypnosis or entertainment trance.',
    whenPeopleExplore:
      'Chronic pain, smoking cessation, medical procedure anxiety, or referrals from integrative clinics.',
    approaches: [
      'Cognitive-behavioral hypnotherapy (CBH) — combines CBT with trance for rehearsal and reframing.',
      'Gut-directed hypnotherapy for IBS (validated in multiple trials).',
      'Medical hypnosis before surgery or childbirth — reduces analgesia needs in some studies.',
      'EMDR-adjacent resource installation using light trance states.',
    ],
    relatedPlantIds: ['wild-mint', 'douglas-fir-tip'],
    safetyWarnings: [
      'Use only licensed or certified clinical hypnotherapists (check ASCH, NBCH).',
      'Hypnosis does not grant supernatural control — you remain able to emerge.',
    ],
    sources: [
      {
        label: 'American Society of Clinical Hypnosis',
        url: 'https://www.asch.net/',
      },
      {
        label: 'NIH — Hypnosis for IBS',
        url: 'https://www.nccih.nih.gov/health/providers/digest/irritable-bowel-syndrome-and-complementary-health-approaches',
      },
    ],
  },
  {
    id: 'somatic-hypnosis-trauma',
    title: 'Somatic & trauma-informed hypnosis',
    category: 'hypnotherapy',
    summary:
      'Gentle trance paired with body awareness — pendulation, titration, and “parts” work — to support nervous-system regulation without re-traumatizing.',
    whenPeopleExplore:
      'PTSD, chronic tension, or when talk therapy alone feels stuck; often after reading Bessel van der Kolk or Richard Schwartz.',
    approaches: [
      'Resource anchoring: safe place, protector figures, or supportive imagery before touching difficult material.',
      'Ego-state and Internal Family Systems–informed hypnosis.',
      'Short “micro-trances” (2–5 minutes) for daily self-regulation homework.',
    ],
    relatedPlantIds: ['yarrow', 'wild-mint'],
    safetyWarnings: [
      'Trauma work requires a trauma-trained therapist — not DIY deep regression.',
      'Dissociative disorders need specialized assessment first.',
    ],
    sources: [
      {
        label: 'ISTSS — Trauma treatment',
        url: 'https://istss.org/',
      },
    ],
  },
  {
    id: 'self-hypnosis-daily',
    title: 'Self-hypnosis & audio inductions',
    category: 'hypnotherapy',
    summary:
      'Learnable skills for relaxation, sleep, performance, and pain coping — using breath, repetition, and visualization without a live facilitator.',
    whenPeopleExplore:
      'Insomnia, public speaking nerves, pre-surgical anxiety, or wanting tools between therapy sessions.',
    approaches: [
      '4-7-8 breathing or box breathing as entry to trance.',
      'Recorded scripts: progressive muscle relaxation, beach or forest imagery.',
      'Anchor words or hand gestures to re-enter calm states quickly.',
    ],
    relatedPlantIds: ['wild-mint', 'douglas-fir-tip'],
    safetyWarnings: [
      'Do not listen to deep regression recordings while driving or operating machinery.',
      'If distress increases, stop and consult a professional.',
    ],
    sources: [
      {
        label: 'Mayo Clinic — Hypnosis',
        url: 'https://www.mayoclinic.org/tests-procedures/hypnosis/about/pac-20394405',
      },
    ],
  },
  {
    id: 'reiki-overview',
    title: 'Reiki — universal life energy',
    category: 'reiki-chakra',
    summary:
      'A Japanese hands-on or hands-near-body practice where practitioners channel “ki” to support relaxation and holistic wellness. Widely offered in hospitals as a complementary comfort measure.',
    whenPeopleExplore:
      'Stress, cancer supportive care, post-surgery comfort, or curiosity after Reiki Level 1 training.',
    approaches: [
      'Traditional Usui Reiki: attunements, hand positions, five principles (gassho, gratitude).',
      'Hospital Reiki: light touch or no touch at bedside with consent.',
      'Self-Reiki daily for grounding — palms on heart, belly, or temples.',
    ],
    relatedPlantIds: ['wild-mint', 'douglas-fir-tip'],
    safetyWarnings: [
      'Reiki does not replace emergency medicine or oncology protocols.',
      'Choose practitioners trained through recognized lineages (Usui, Holy Fire, etc.).',
    ],
    sources: [
      {
        label: 'Reiki.org — History of Reiki',
        url: 'https://www.reiki.org/faqs/history-of-reiki',
      },
      {
        label: 'NCCIH — Reiki',
        url: 'https://www.nccih.nih.gov/health/reiki',
      },
    ],
  },
  {
    id: 'chakra-energy-system',
    title: 'Chakra energy system — seven centers',
    category: 'reiki-chakra',
    summary:
      'Yogic and Ayurvedic map of energy centers from root to crown — each linked to physical, emotional, and spiritual themes. Used in meditation, yoga, sound healing, and Reiki attunement language.',
    whenPeopleExplore:
      'Yoga practice, Reiki training, interest in subtle body anatomy, or balancing “blocked” feelings.',
    approaches: [
      'Root (Muladhara) — safety, grounding; sacral (Svadhisthana) — creativity; solar plexus (Manipura) — will.',
      'Heart (Anahata), throat (Vishuddha), third eye (Ajna), crown (Sahasrara) — each with bija mantras and colors.',
      'Chakra meditation: visualize colored light at each center while breathing.',
      'Pairing with asana (e.g. hip openers for sacral) in yoga therapy contexts.',
    ],
    relatedPlantIds: ['wild-mint', 'yarrow'],
    safetyWarnings: [
      '“Kundalini awakening” stories can mask psychiatric symptoms — seek medical evaluation for mania or psychosis.',
      'Chakra language is symbolic — not a substitute for anatomy or lab work.',
    ],
    sources: [
      {
        label: 'Yoga Journal — Chakra basics',
        url: 'https://www.yogajournal.com/yoga-101/chakras-101/',
      },
    ],
  },
  {
    id: 'pranic-energy-healing',
    title: 'Pranic & subtle energy healing',
    category: 'reiki-chakra',
    summary:
      'Systems like Pranic Healing and Therapeutic Touch work with the “aura” and chakras — sweeping, energizing, and cleansing the biofield without physical manipulation.',
    whenPeopleExplore:
      'Interest beyond Reiki, Master Choa Kok Sui’s books, or nursing continuing education in energy modalities.',
    approaches: [
      'Scanning hands to sense congestion or depletion in the energy field.',
      'Sweeping stagnant energy into a salt water bowl or visualized grounding.',
      'Localized energizing after cleansing — often paired with breathing and intention.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Broken bones, infections, and chest pain need conventional care first.',
      'Energy healing is adjunctive — document what helps with your medical team.',
    ],
    sources: [
      {
        label: 'Pranic Healing',
        url: 'https://www.pranichealing.com/',
      },
    ],
  },
  {
    id: 'tuning-forks-therapy',
    title: 'Tuning forks — vibrational therapy',
    category: 'sound-frequency',
    summary:
      'Weighted and unweighted forks struck and placed on or near the body — used in sound therapy, acupuncture adjunct practice, and nervous-system down-regulation.',
    whenPeopleExplore:
      'Muscle tension, sound-bath curiosity, or integrative bodywork after trying forks at a spa.',
    approaches: [
      'Otto 128 Hz and 64 Hz forks — common for tissue and joint vibration.',
      'Unweighted forks (e.g. 256 Hz, 512 Hz) held near ears for binaural effect.',
      'Chakra-tuned fork sets (C–B notes) aligned with Solfeggio-adjacent frameworks.',
      'Biofield tuning: forks swept through the aura as in Eileen McKusick’s method.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Avoid direct skull application with strong vibration if you have tinnitus or vestibular disorders.',
      'Pregnancy — consult provider before abdominal or strong vibrational work.',
    ],
    sources: [
      {
        label: 'Biofield Tuning',
        url: 'https://biofieldtuning.com/',
      },
    ],
  },
  {
    id: 'singing-bowls-sound-baths',
    title: 'Singing bowls & sound baths',
    category: 'sound-frequency',
    summary:
      'Tibetan metal bowls, crystal bowls, and gongs played in group or private sessions to induce meditative states and parasympathetic relaxation.',
    whenPeopleExplore:
      'Meditation groups, yoga studios, stress relief, or pairing sound with Reiki or massage.',
    approaches: [
      'Tibetan bowls — rim rubbing and mallet strikes around the body’s energy field.',
      'Crystal bowls — each sized to a note; often arranged in chakra sequences.',
      'Sound baths: 45–90 minutes lying down while multiple instruments weave.',
      'Home practice: single bowl at bedtime for 5-minute wind-down.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Very loud gongs can trigger migraine or PTSD startle — choose gentler sessions if sensitive.',
      'Not a treatment for hearing loss or acute ear infection.',
    ],
    sources: [
      {
        label: 'Sound Healing Network',
        url: 'https://www.soundhealersassociation.org/',
      },
    ],
  },
  {
    id: 'solfeggio-healing-frequencies',
    title: 'Solfeggio & healing frequency lists',
    category: 'sound-frequency',
    summary:
      'A modern catalog of Hz tones (174, 285, 396, 417, 528, 639, 741, 852, 963) promoted for emotional release, DNA repair language, and spiritual alignment — popular on streaming platforms and in meditation apps.',
    whenPeopleExplore:
      'YouTube “healing frequency” playlists, 528 Hz “love frequency” trends, or chakra-matched tone charts.',
    approaches: [
      'Listen through speakers or headphones during meditation or sleep hygiene routines.',
      'Combine with breathwork — no special equipment required.',
      'Some practitioners embed tones under guided hypnosis recordings.',
      'Contrast with clinical binaural beats research (different mechanism, modest evidence for focus).',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'No robust clinical proof that specific Hz cures disease or rewrites DNA.',
      'Keep volume low to protect hearing; epilepsy — consult neurologist before flickering light + sound combos.',
    ],
    sources: [
      {
        label: 'NCCIH — Music and health',
        url: 'https://www.nccih.nih.gov/health/music-and-health-what-you-need-to-know',
      },
    ],
  },
  {
    id: '432hz-528hz-debate',
    title: '432 Hz vs 440 Hz & the 528 Hz debate',
    category: 'sound-frequency',
    summary:
      'Alternative tuning philosophies argue that A=432 Hz or the “miracle” 528 Hz tone feel more natural and calming than concert pitch (A=440 Hz). Explored in wellness music, not mainstream orchestras.',
    whenPeopleExplore:
      'Spotify “432 Hz” remixes, debates on natural resonance, or wanting calmer background music for yoga.',
    approaches: [
      'Retune digital audio or use instruments calibrated to 432 Hz.',
      '528 Hz often layered in “transformation” meditations — subjective comfort, not prescription.',
      'Blind listening: notice what helps your nervous system without dogma.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Tuning debates are cultural and aesthetic — not medical mandates.',
      'Do not reject proven treatments in favor of frequency playlists alone.',
    ],
    sources: [
      {
        label: 'BBC — 432 Hz myth?',
        url: 'https://www.bbc.com/culture/article/20180608-why-do-we-use-440-hz-to-tune-music',
      },
    ],
  },
  {
    id: 'binaural-beats-hypnosis',
    title: 'Binaural beats & brainwave entrainment',
    category: 'sound-frequency',
    summary:
      'Two slightly different tones in each ear create a perceived beat — marketed for delta (sleep), theta (meditation), and alpha (calm focus) states. Sometimes bundled with hypnosis scripts.',
    whenPeopleExplore:
      'Focus apps, sleep headphones, or combining beats with self-hypnosis recordings.',
    approaches: [
      'Theta-range (4–7 Hz) paired with guided imagery for light trance.',
      'Delta-range for sleep onset — use only when safely in bed.',
      'Isochronic tones as an alternative when stereo headphones are unavailable.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Epilepsy or seizure history — avoid flashing lights and consult doctor about auditory entrainment.',
      'Evidence for cognitive enhancement is mixed — manage expectations.',
    ],
    sources: [
      {
        label: 'NIH — Binaural beat research',
        url: 'https://pubmed.ncbi.nlm.nih.gov/?term=binaural+beats',
      },
    ],
  },
  {
    id: 'hypnosis-energy-legal-safety',
    title: 'Legal landscape & practitioner ethics',
    category: 'legal-safety',
    summary:
      'How hypnosis and energy work are regulated varies by state and country. Know credentials, scope of practice, and when to choose medical care instead.',
    whenPeopleExplore:
      'Choosing a practitioner, opening a wellness practice, or app-store compliance for educational content.',
    approaches: [
      'Clinical hypnosis: often licensed counselors, psychologists, or physicians with ASCH or equivalent training.',
      'Reiki & sound healing: generally unlicensed “complementary” — check local touch and business rules.',
      'Past-life and QHHT: spiritual coaching frameworks — not regulated psychotherapy unless provider is licensed.',
      'Informed consent: scope, fees, and that experiences are subjective.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Crisis line (US): 988. Hypnosis is not emergency mental health care.',
      'Report unethical conduct to state licensing boards when applicable.',
    ],
    sources: [
      {
        label: 'ASCH — Find a certified professional',
        url: 'https://www.asch.net/',
      },
      {
        label: 'SAMHSA — Find treatment',
        url: 'https://findtreatment.samhsa.gov/',
      },
    ],
  },
];

export const HYPNOSIS_ENERGY_LIBRARY = applyHypnosisExpanded(HYPNOSIS_ENERGY_LIBRARY_BASE);

export const HYPNOSIS_ENERGY_CATEGORY_ORDER: HypnosisEnergyCategory[] = [
  'hypnotherapy',
  'regression',
  'traditions',
  'reiki-chakra',
  'sound-frequency',
  'legal-safety',
];

export function matchesHypnosisEnergyCategory(
  topic: HypnosisEnergyTopic,
  category: HypnosisEnergyCategory | 'all',
): boolean {
  if (category === 'all') return true;
  return topic.category === category;
}
