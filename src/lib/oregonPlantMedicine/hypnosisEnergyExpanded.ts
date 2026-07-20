import { commonsImage } from './commonsImage';

type ExpandedFields = {
  imageUrl: string;
  imageCredit?: string;
  deepDive: string;
};

const W = {
  meditation: commonsImage('Meditation sitting pose siddhasana yoga Gloria.jpg'),
  bowls: commonsImage('Singing bowls.jpg'),
  reiki: commonsImage('Reiki-Hanko.JPG'),
  hypnosis: commonsImage('Hypnotisk seans av Richard Bergh 1887.jpg'),
  yoga: commonsImage('African Yoga styles healthy and wellness practice at sunset.jpg'),
  tuning: commonsImage('Tuning fork.jpg'),
  sound: commonsImage('Singing bowl samye ling.jpg'),
  library: commonsImage('Cayce 1910.jpg'),
  legal: commonsImage('Balance - Scales of Justice (PSF).png'),
};

export const HYPNOSIS_TOPIC_EXPANDED: Record<string, ExpandedFields> = {
  'past-life-regression': {
    imageUrl: W.hypnosis,
    imageCredit: 'Historical hypnosis illustration — Wikimedia Commons',
    deepDive: `Past life regression sits at the intersection of clinical hypnosis, transpersonal psychology, and spiritual inquiry. In a typical session, a trained facilitator guides the client into a relaxed, focused state — not sleep, but a heightened inward attention sometimes called trance. From that state, open-ended questions invite imagery, felt sense, or narrative that the client experiences as belonging to another time or identity.

Practitioners who work ethically emphasize that these experiences are subjective: they may function as metaphor, memory consolidation, or meaning-making rather than verifiable historical record. Brian Weiss and Michael Newton popularized regression in bestselling books; their methods influenced thousands of therapists and spiritual explorers worldwide. Academic psychology remains cautious — false memories can be suggested, especially with leading questions — so reputable clinicians avoid pressing clients toward specific “past lives” and instead track emotional themes: fear, loyalty, grief, or recurring relationship patterns.

Integration matters as much as the trance itself. Journaling, grounding exercises, and follow-up talk therapy help clients distinguish symbolic insight from literal belief. Regression is generally contraindicated as sole treatment for severe PTSD, psychosis, or active substance withdrawal; it works best as an adjunct when a licensed provider screens for dissociation and trauma history. For readers, the value is often reflective: exploring inner stories with curiosity, not replacing medical or psychiatric care.`,
  },
  'life-between-lives': {
    imageUrl: W.meditation,
    imageCredit: 'Meditation — Wikimedia Commons (CC)',
    deepDive: `Life-between-lives (LBL) regression extends past-life work into what Michael Newton described as the soul’s realm between incarnations. Sessions often run two to four hours. After a gentle induction, the facilitator asks the client’s subconscious — in Newton’s framework — to move beyond any single lifetime into a space of guides, soul groups, and life planning. Clients frequently report feelings of peace, unconditional love, or panoramic perspective on current struggles.

LBL is not a religion, but it carries spiritual assumptions that not every client shares. Certified Newton Institute facilitators follow a structured protocol: interview, hypnosis, recorded dialogue, and integration call. Experiences vary widely — some people see vivid landscapes; others receive only body-based knowing or emotion. Researchers have not validated LBL as literal cosmology; many therapists treat the material as archetypal or narrative, similar to active imagination in Jungian work.

People seek LBL after bereavement, during midlife transitions, or when conventional therapy has plateaued. Risks include destabilization if deep trance is pursued without adequate support, or spiritual bypassing — using cosmic stories to avoid grief or accountability. Screening for psychiatric conditions, clear informed consent, and post-session grounding are essential. LBL can be profoundly comforting; it is not a substitute for grief counseling, medication, or crisis care when those are needed.`,
  },
  'edgar-cayce-hypnosis': {
    imageUrl: W.library,
    imageCredit: 'Edgar Cayce — Wikimedia Commons',
    deepDive: `Edgar Cayce (1877–1945) entered self-induced trance thousands of times, dictating readings on health, spirituality, and history while reportedly unconscious. The Association for Research and Enlightenment (A.R.E.) in Virginia Beach preserves his archive and supports study groups worldwide. Cayce’s approach to personal attunement — lying down, clearing the mind, holding a written question — became a template for lay hypnosis and prayerful inquiry.

Cayce readings recommended castor oil packs, spinal adjustments, meditation, and ideals work (setting spiritual intentions). Modern integrative practitioners sometimes reference Cayce historically while relying on contemporary evidence for treatment decisions. A.R.E. explicitly discourages using readings as individualized prescriptions without professional interpretation; full readings are copyrighted and accessed through their channels.

For hypnosis students, Cayce illustrates how trance can be self-directed: breath, relaxation, and expectation shape what emerges. Study groups read cases aloud and discuss application to daily life — more philosophy and folk medicine history than clinical protocol. Readers interested in Cayce should pair archival study with licensed care for serious illness. His legacy is a bridge between early twentieth-century holistic thought and today’s mind-body movement, not a standalone medical system.`,
  },
  'dolores-cannon-qhht': {
    imageUrl: W.hypnosis,
    imageCredit: 'Hypnosis session — historical art, Wikimedia Commons',
    deepDive: `Quantum Healing Hypnosis Technique (QHHT) was developed by Dolores Cannon over decades of practicing hypnosis with thousands of clients. A Level 1–3 training curriculum certifies practitioners to conduct day-long sessions: intake, induction, dialogue with the “subconscious,” and review. Clients often arrive with chronic symptoms, spiritual questions, or curiosity after reading Cannon’s Convoluted Universe series.

During the deepest phase, practitioners ask permission before suggesting metaphorical healing imagery — language matters because clients in trance can be highly suggestible. QHHT does not claim to replace oncology, surgery, or psychiatric medication; ethical practitioners refer out when symptoms require medical workup. The official QHHT directory is the primary way to verify certification.

Critics note the lack of peer-reviewed trials; supporters emphasize anecdotal transformation and spiritual insight. Whether one frames the “subconscious” as higher self, collective unconscious, or therapeutic metaphor, integration after session is critical — rest, hydration, journaling, and avoiding major decisions for twenty-four hours. QHHT sits in the wellness and spiritual hypnosis space; combine it with conventional care, not instead of it.`,
  },
  'modern-clinical-hypnotherapy': {
    imageUrl: W.meditation,
    imageCredit: 'Meditation — Wikimedia Commons',
    deepDive: `Clinical hypnotherapy is hypnosis delivered by licensed mental health or medical professionals within a evidence-informed framework. Unlike stage hypnosis, the goal is therapeutic alliance and measurable outcomes: reduced procedural anxiety, improved IBS symptoms, smoking cessation support, or pain management alongside medical treatment. Organizations such as the American Society of Clinical Hypnosis (ASCH) certify clinicians who already hold degrees in psychology, medicine, nursing, or dentistry.

Gut-directed hypnotherapy has one of the stronger evidence bases — multiple trials show benefit for irritable bowel syndrome when delivered in structured protocols. Medical hypnosis before surgery can lower analgesia requirements and speed recovery in some settings. Cognitive-behavioral hypnotherapy merges CBT techniques (rehearsal, reframing) with trance for habit change and phobia work.

Clients remain aware and in control; hypnosis is not mind control. Contraindications include acute psychosis, certain personality disorders without specialized care, and using hypnosis to recover repressed memories without proper trauma training. If you seek a hypnotherapist, verify licensure in your state plus ASCH or equivalent certification. Clinical hypnosis is a skill set within professional practice — one of the most research-grounded branches of the broader hypnosis world.`,
  },
  'somatic-hypnosis-trauma': {
    imageUrl: W.yoga,
    imageCredit: 'Yoga at sunset — Wikimedia Commons',
    deepDive: `Trauma-informed hypnosis respects the nervous system’s need for safety before depth. Practitioners trained in somatic approaches — often drawing from Peter Levine, Bessel van der Kolk, or Internal Family Systems — use light trance to build resources: a safe place, protector figures, or calming breath anchors. Only when the client is regulated do they approach difficult material, and then in titrated doses (pendulation between stress and calm).

This contrasts with dramatic regression that floods the system with intense imagery. Micro-trances of two to five minutes can be homework between sessions, reinforcing agency. Hypnosis here supports embodiment: noticing shoulder tension, stomach flutter, or the urge to flee without judgment.

Trauma work requires a trauma-trained therapist; DIY deep regression recordings are risky for complex PTSD. Dissociative disorders need specialist assessment. Somatic hypnosis can complement EMDR or talk therapy when the provider understands both modalities. The goal is nervous-system regulation and integrated memory processing — not reliving pain for its own sake.`,
  },
  'self-hypnosis-daily': {
    imageUrl: W.meditation,
    imageCredit: 'Meditation — Wikimedia Commons',
    deepDive: `Self-hypnosis is a learnable skill: breath, repetition, and visualization without a live facilitator. Athletes, surgeons’ patients, and insomnia sufferers use short scripts to enter calm focus. Common entry techniques include 4-7-8 breathing, progressive muscle relaxation from toes to scalp, or imagining descending a staircase with each step doubling relaxation.

Recorded apps and audio programs vary in quality. Look for scripts that emphasize comfort and choice (“you can emerge anytime”) rather than fear-based suggestions. Anchor words or hand gestures — pressing thumb and finger together while calm — create quick access to the state later.

Never listen to deep trance recordings while driving or operating machinery. If distress increases, stop and consult a professional. Self-hypnosis works best for performance anxiety, sleep hygiene, and mild stress — not as sole treatment for trauma or major depression. Pair daily practice with medical care when symptoms are severe. Five minutes before bed often beats hour-long sessions you cannot sustain.`,
  },
  'reiki-overview': {
    imageUrl: W.reiki,
    imageCredit: 'Reiki treatment — Wikimedia Commons',
    deepDive: `Reiki originated in early twentieth-century Japan through Mikao Usui’s spiritual practice, later spread to the West through Hawaiian lineages. Practitioners channel “ki” or universal life energy through hands placed on or near the body. Sessions typically last forty-five to sixty minutes; recipients remain clothed and may feel warmth, tingling, or deep relaxation.

Hospitals in several countries offer Reiki as a complementary comfort measure for cancer, surgery, and hospice — not as cure, but to support relaxation and emotional ease. Usui’s five principles (gassho, gratitude, compassion) frame daily practice beyond the treatment table. Training progresses through attunements at Level I, II, and Master levels depending on lineage.

Research is mixed but generally shows stress reduction and subjective well-being; mechanisms may include parasympathetic activation and therapeutic touch. Reiki does not replace emergency medicine, antibiotics, or oncology protocols. Choose practitioners trained through recognized lineages and disclose Reiki to your medical team. Self-Reiki — hands on heart, belly, temples — is a portable grounding tool many clients use between sessions.`,
  },
  'chakra-energy-system': {
    imageUrl: W.yoga,
    imageCredit: 'Yoga — Wikimedia Commons',
    deepDive: `The chakra model maps seven energy centers from root (Muladhara) to crown (Sahasrara), rooted in yogic and Ayurvedic tradition. Each center is associated with color, sound, element, and psychological themes: survival, creativity, will, love, expression, intuition, and transcendence. Western wellness adopted chakras for meditation, yoga sequencing, sound healing, and Reiki language.

Practices include visualizing colored light at each center while breathing, chanting bija mantras (LAM, VAM, RAM, etc.), and pairing hip openers or heart openers with intention. Reiki practitioners may scan the field for congestion or depletion before hands-on work.

Chakra language is symbolic anatomy — not a substitute for medical diagnosis. “Blocked chakra” metaphors can help people articulate emotional stuckness, but they should not mask symptoms needing lab work or psychiatry. Kundalini awakening stories sometimes overlap with mania or psychosis; seek medical evaluation for sleeplessness, grandiosity, or hallucination. Used wisely, chakra work offers a structured map for contemplative practice and body-based self-awareness.`,
  },
  'pranic-energy-healing': {
    imageUrl: W.reiki,
    imageCredit: 'Energy healing hands — Wikimedia Commons',
    deepDive: `Pranic Healing, developed by Master Choa Kok Sui, teaches practitioners to sense and cleanse the “aura” without physical touch — sweeping stagnant energy, energizing depleted areas, and disposing of waste energy in salt water. Therapeutic Touch in nursing shares similar assumptions about the human biofield.

Sessions may feel cool, warm, or tingling; skeptics attribute effects to relaxation and attention. Training institutes offer standardized levels with protocols for headaches, respiratory discomfort, and stress — always with instructions to refer medical emergencies to hospitals.

Pranic Healing is adjunctive. Broken bones, chest pain, infections, and acute abdominal pain need conventional diagnosis first. Document what helps with your physician. The method appeals to people who want structured energy hygiene beyond intuitive laying-on of hands — a middle path between Reiki’s simplicity and acupuncture’s meridian precision.`,
  },
  'tuning-forks-therapy': {
    imageUrl: W.tuning,
    imageCredit: 'Tuning fork — Wikimedia Commons',
    deepDive: `Weighted tuning forks (often Otto 128 Hz and 64 Hz) vibrate tissue when placed on bone or muscle; unweighted forks ring near the ears for auditory effect. Sound therapists, acupuncturists, and massage therapists use them to encourage parasympathetic down-regulation and localized release.

Biofield Tuning, developed by Eileen McKusick, sweeps forks through the aura while clients lie on a treatment table — practitioners report sensing turbulence in the field. Chakra-tuned fork sets assign notes (C through B) to energy centers for sequential sessions.

Evidence is largely experiential; few large RCTs exist. Avoid strong skull vibration with tinnitus or vestibular disorders. Pregnant clients should consult providers before abdominal work. Tuning forks pair well with meditation and bodywork as low-risk complementary tools — not replacements for physical therapy or pain management when structural injury is present.`,
  },
  'singing-bowls-sound-baths': {
    imageUrl: W.bowls,
    imageCredit: 'Singing bowls — Wikimedia Commons',
    deepDive: `Tibetan metal bowls and crystal singing bowls produce sustained harmonics when rimmed or struck. Group sound baths — forty-five to ninety minutes of lying down while gongs, bowls, and chimes weave — have exploded in yoga studios and retreat centers. Private sessions may target specific tension areas or chakra sequences.

The mechanism is partly auditory: slow rhythmic sound entrains breathing and heart rate variability toward calm. Partly ritual: lying still in community creates permission to rest. Home practice can be a single bowl at bedtime for five minutes of wind-down.

Very loud gongs can trigger migraine or PTSD startle; choose gentler sessions if sound-sensitive. Sound baths do not treat hearing loss or ear infections. Research on music and health supports relaxation benefits without proving disease-specific cures. Treat sound immersion as nervous-system hygiene — powerful for stress, complementary to medical care for everything else.`,
  },
  'solfeggio-healing-frequencies': {
    imageUrl: W.sound,
    imageCredit: 'Gong — Wikimedia Commons',
    deepDive: `The modern Solfeggio list — 174, 285, 396, 417, 528, 639, 741, 852, and 963 Hz — circulates widely on streaming platforms and meditation apps. Proponents assign each tone emotional or spiritual qualities: liberation from fear, DNA repair language, connection, intuition. The list blends historical solfège syllables with New Age marketing; scholarly history is murkier than social media suggests.

Listening is low-risk: headphones or speakers during meditation, sleep hygiene, or creative work. Some practitioners embed tones under guided hypnosis recordings. Evidence for specific Hz curing disease is weak; benefits likely come from relaxation, expectation, and time spent in contemplative states.

Keep volume hearing-safe. Epilepsy patients should consult neurologists before combining flickering lights with intense auditory stimulation. Use Solfeggio playlists as subjective comfort tools — not substitutes for antibiotics, chemotherapy, or psychiatric medication. Blind listening experiments can help you notice what genuinely soothes your nervous system without dogma.`,
  },
  '432hz-528hz-debate': {
    imageUrl: W.sound,
    imageCredit: 'Gong — Wikimedia Commons',
    deepDive: `Concert pitch standardized near A=440 Hz in the twentieth century; alternative tuning advocates promote A=432 Hz as more “natural” or calming. The “528 Hz love frequency” often appears in transformation meditations and water-structure claims. YouTube and Spotify host thousands of remixed tracks retuned to these references.

Psychoacoustics research shows subtle preference differences in blind tests, but not universal superiority. Cultural and aesthetic factors dominate — some listeners find 432 Hz warmer; others hear no difference. The debate is philosophic and experiential more than medical.

Retuning digital audio or buying instruments calibrated to 432 Hz is harmless for most people. Do not reject proven treatments in favor of frequency playlists alone. Music therapy literature supports music for mood and pain in clinical settings without mandating a single tuning standard. Explore with curiosity; keep expectations grounded.`,
  },
  'binaural-beats-hypnosis': {
    imageUrl: W.meditation,
    imageCredit: 'Meditation — Wikimedia Commons',
    deepDive: `Binaural beats occur when each ear hears a slightly different frequency; the brain perceives a beat equal to the difference — for example 200 Hz left and 206 Hz right yields a 6 Hz perceived pulse in the theta range. Marketing claims tie delta beats to sleep, theta to meditation, beta to focus. Isochronic tones pulse in a single ear without requiring stereo headphones.

Some small studies show modest effects on anxiety and attention; results are mixed. Hypnosis recordings sometimes layer beats under verbal scripts to deepen trance — evidence for synergy is limited. Mechanisms may include masking mental chatter and encouraging steady breathing rather than literal brainwave forcing.

Epilepsy or seizure history warrants neurologist consultation before auditory entrainment. Manage expectations: binaural beats are adjuncts, not magic switches. Combine with good sleep hygiene, therapy, or clinical hypnosis when addressing clinical conditions.`,
  },
  'hypnosis-energy-legal-safety': {
    imageUrl: W.legal,
    imageCredit: 'Scales of justice — Wikimedia Commons',
    deepDive: `Regulation of hypnosis and energy work varies by country and state. Clinical hypnosis is typically practiced by licensed psychologists, physicians, dentists, or counselors with additional ASCH or NBCH certification. Reiki, sound healing, and past-life sessions often fall under unregulated complementary wellness — check local business and touch laws before practicing professionally.

Informed consent should cover scope, fees, that experiences are subjective, and when to seek medical care. Past-life and QHHT practitioners must avoid practicing psychotherapy without a license; licensed therapists must stay within their scope when using trance. Energy workers should not diagnose or claim to cure disease.

Crisis resources: US mental health line 988; emergency 911 for medical emergencies. Report unethical conduct to state licensing boards when applicable. App publishers distributing educational content — like Living Knowledge — should maintain clear disclaimers: reference library, not telehealth. Consumers benefit from asking credentials, reading contracts, and maintaining a primary care relationship alongside exploratory work.`,
  },
};

export function applyHypnosisExpanded<T extends { id: string; summary: string }>(
  topics: T[],
): (T & ExpandedFields)[] {
  return topics.map((topic) => {
    const extra = HYPNOSIS_TOPIC_EXPANDED[topic.id];
    if (!extra) {
      return {
        ...topic,
        imageUrl: W.meditation,
        imageCredit: 'Wikimedia Commons',
        deepDive: topic.summary,
      };
    }
    return { ...topic, ...extra };
  });
}
