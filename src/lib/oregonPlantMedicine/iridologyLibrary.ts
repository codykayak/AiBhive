import type { IridologyCategory, IridologyTopic } from './iridologyTypes';
import { commonsImage } from './commonsImage';

const W = {
  eye: commonsImage('Human eye close up.jpg'),
  iris: commonsImage('Iris recognition eye.jpg'),
  chart: commonsImage('Iridology chart.jpg'),
  fibers: commonsImage('Iris fibers.jpg'),
};

export const IRIDOLOGY_LIBRARY: IridologyTopic[] = [
  {
    id: 'integrated-methodology',
    title: 'Integrated iridology — how schools combine',
    category: 'methodology',
    summary:
      'Integrated iridology cross-checks zone signs, fiber structure, and constitutional typing before stating a tendency. Multiple converging signs raise confidence; single isolated marks stay speculative.',
    imageUrl: W.chart,
    imageCredit: 'Iridology chart — Wikimedia Commons',
    whenPeopleExplore:
      'After reading conflicting iridology books, or when a single pigment spot seems to “diagnose” everything.',
    approaches: [
      'Start with photo quality — blur and glare invalidate fine fiber reading.',
      'Note iris color and fiber density (constitutional layer) before mapping zones.',
      'Require two or more independent signs before calling a “tendency” in educational language.',
      'Label Rayid or personality reads as non-medical if mentioned at all.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Integrated iridology is still not validated clinical science — educational framing only.',
      'Never skip medical evaluation for symptoms based on iris patterns.',
    ],
    sources: [
      { label: 'IIPA — professional iridology education', url: 'https://www.iridologyassn.org/' },
    ],
    deepDive: `Integrated iridology emerged as practitioners noticed that Bernard Jensen’s clock-face zones, European physical signs (lacunae, nerve rings, arcus), and constitutional color typing sometimes pointed in different directions. Integrated teachers train students to treat the iris as layered evidence: first assess whether the photograph is usable, then note global texture and color, then map localized signs to zone charts with explicit uncertainty.

A lacuna in the lung sector alone does not justify strong language about respiratory disease. Integrated practice asks: Is fiber density open or closed? Is there a constitutional lymphatic or biliary pattern? Are there corroborating nerve rings or pigment clusters? Only when multiple independent markers align does the literature support a cautious “tendency” phrase — and even then, mainstream medicine does not accept iridology as diagnosis.

AiBhive’s AI analyzer defaults to integrated methodology for this reason. It is the most conservative educational stance available within iridology’s own pedagogical traditions.`,
  },
  {
    id: 'jensen-zone-chart',
    title: 'Bernard Jensen zone iridology — clock-face organ map',
    category: 'zone-chart',
    summary:
      'Classic zone iridology maps organ reflex areas on the iris like a clock face: right iris reflects right body side, left iris left side. Used for educational correlation, not clinical proof.',
    imageUrl: W.chart,
    imageCredit: 'Iridology chart — Wikimedia Commons',
    whenPeopleExplore:
      'Learning the “7–8 o’clock lung sector” references, or comparing right vs left eye charts.',
    approaches: [
      'Orient the photo: 12 o’clock is superior (toward forehead), 6 o’clock inferior.',
      'Right iris → right side zones; left iris → left side (classic Jensen convention).',
      'Map pigment spots and lacunae to nearest sector with low-confidence language.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Zone charts vary between authors — treat mapping as approximate.',
      'Chest or abdominal symptoms require medical evaluation, not iris zone reads alone.',
    ],
    sources: [
      { label: 'Bernard Jensen — iridology literature (historical)', url: 'https://en.wikipedia.org/wiki/Iridology' },
    ],
    deepDive: `Bernard Jensen (1898–2001) popularized zone iridology in North America, describing the iris as a miniature map of the body arranged radially like a clock. Head and brain zones sit toward 12 o’clock; digestive bands toward 5–6 o’clock; kidney/adrenal sectors near 9 o’clock in many charts. Practitioners locate lacunae, crypts, and pigment deposits and relate them to organ “reflex” areas.

The right-left mirroring rule is foundational: the right iris is read for the right side of the body, the left iris for the left. Bilateral signs may indicate systemic themes in iridology texts, but this remains controversial and unproven in controlled trials. AiBhive presents Jensen zones as historical educational vocabulary — “iridology literature associates this sector with respiratory themes” — never as “you have lung disease.”

Photo orientation errors are common. If the eyelids obscure sectors or the iris is photographed at an angle, zone placement should be withheld. Our AI analysis includes a photo quality gate for this reason.`,
  },
  {
    id: 'physical-european-signs',
    title: 'Physical / European iridology — fibers, lacunae, rings',
    category: 'signs-fibers',
    summary:
      'European physical iridology emphasizes stromal texture: open vs dense fibers, lacunae, crypts, pigment spots, nerve rings, and arcus senilis as constitutional and terrain markers.',
    imageUrl: W.fibers,
    imageCredit: 'Iris detail — Wikimedia Commons',
    whenPeopleExplore:
      'Noticing “holes” in the iris, white rings, or brown spots and wondering what iridology texts say about them.',
    approaches: [
      'Assess global fiber density before interpreting local pits.',
      'Lacunae (open pits) vs crypts (closed pits) carry different traditional emphases.',
      'Nerve rings suggest nervous-system sensitivity themes — not anxiety diagnoses.',
      'Arcus senilis at the limbus is age-related; cardiovascular themes in texts are speculative.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Pigment spots can be benign nevi — only an ophthalmologist can evaluate pathology.',
      'Sudden iris changes or vision loss are medical emergencies.',
    ],
    sources: [
      { label: 'Wikipedia — Iridology (controversy overview)', url: 'https://en.wikipedia.org/wiki/Iridology' },
    ],
    deepDive: `Physical iridology, strong in German and Eastern European lineages, reads the iris stroma as a record of inherited tendencies and chronic irritation. Open fibers (loosely arranged trabeculae) are classically linked to lymphatic/reactive constitutions; dense fibers to biliary or hematogenic patterns. Lacunae appear as dark pits — open cavities in the stroma — while crypts are deeper closed variants emphasized in some European texts.

Nerve rings (concentric white arcs) are interpreted as markers of autonomic stress or heightened sensitivity — useful language for wellness exploration but not a DSM diagnosis. Pigment spots (rust-brown deposits) are mapped to nearest zones with caution; they may be benign melanin clusters visible to any camera. Arcus senilis, a grey-white ring at the corneal limbus, appears with age and is associated in iridology with cardiovascular “terrain” themes — epidemiology links arcus to lipid metabolism in some populations, but iridology extrapolations remain unproven.

AiBhive’s vision model is prompted to describe only what is visible at photo resolution and to recommend retakes when fiber detail is ambiguous.`,
  },
  {
    id: 'constitutional-types',
    title: 'Constitutional iris types — lymphatic, biliary, hematogenic',
    category: 'constitutional',
    summary:
      'Classic iridology typing links iris color and fiber texture to broad constitutional tendencies — lymphatic (blue-grey, open), biliary (mixed yellow-brown, dense), hematogenic (brown, dense), neurogenic (nerve rings).',
    imageUrl: W.eye,
    imageCredit: 'Human eye — Wikimedia Commons',
    whenPeopleExplore:
      'Wondering why two irises look completely different, or what “lymphatic constitution” means in iridology books.',
    approaches: [
      'Observe base iris color in daylight — camera white balance skews typing.',
      'Pair color with fiber density before assigning a type.',
      'Use types as wellness vocabulary, not destiny or diagnosis.',
      'Integrated readers treat mixed patterns as common — avoid forced labels.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Constitutional typing is subjective between practitioners.',
      'Ethnic iris pigmentation varies — avoid stereotyped health claims.',
    ],
    sources: [
      { label: 'Iridology constitutional typing (educational overview)', url: 'https://www.iridologyassn.org/' },
    ],
    deepDive: `Constitutional iridology attempts to summarize global iris architecture into a handful of types. The lymphatic type — blue, grey, or blue-grey with open fibers — is associated in texts with mucus congestion, reactive immunity, and sluggish drainage themes. Biliary types show mixed brown-yellow hues with denser fibers and digestive/inflammatory narratives. Hematogenic types feature brown irises with tight structure and metabolic/blood themes. Neurogenic patterns highlight nerve rings, fine radial stress lines, and autonomic sensitivity.

These types function like Ayurvedic doshas or TCM patterns: heuristic maps for education and lifestyle conversation, not lab results. Mixed irises are the norm; forcing a single label violates integrated methodology. AiBhive reports constitutional suggestions with explicit confidence levels and rationale tied to visible color and texture — always paired with disclaimers that genetics, lighting, and photography alter appearance.

When AI confidence is low, the structured JSON omits a firm type and recommends better photos or professional iridology study — not self-diagnosis.`,
  },
  {
    id: 'iris-photo-guide',
    title: 'How to photograph your iris for AI analysis',
    category: 'photo-guide',
    summary:
      'Natural light, no flash, fill the frame with the iris, hold steady, remove contact lenses, and capture left and right eyes separately for zone comparison.',
    imageUrl: W.iris,
    imageCredit: 'Eye close-up — Wikimedia Commons',
    whenPeopleExplore:
      'Before uploading to AiBhive iridology analysis, or after a “poor photo quality” retake prompt.',
    approaches: [
      'Stand near a window — indirect daylight works best.',
      'Use rear camera macro if available; pull eyelids gently without distorting the globe.',
      'One eye per photo unless comparing both deliberately.',
      'Avoid red-eye reduction flash — it washes out fiber detail.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Never shine lasers or bright LEDs directly into the eye.',
      'If eyes are painful, red, or vision is changing — see an ophthalmologist, do not photograph for iridology.',
    ],
    sources: [],
    deepDive: `Iridology reads fine stromal detail that consumer phone cameras compress away. AiBhive applies vision-grade compression (forVision mode) but cannot recover blur, glare, or cropped irises. The best results come from indirect daylight: stand sideways to a window, stabilize the phone on both hands, and fill at least 40% of the frame with the iris. Pull the upper eyelid up slightly while looking straight ahead — avoid rolling the eye, which rotates zone orientation.

Contact lenses and recent eye drops create artifacts. Post-LASIK irises may show surgical ring patterns unrelated to iridology “signs.” For bilateral comparison, capture matching angles on left and right eyes separately rather than one wide face photo. If the AI returns photoQuality: poor or populated retakeAdvice, follow it — guessing from bad data contradicts integrated methodology and our safety prompts.`,
  },
  {
    id: 'iridology-safety-limits',
    title: 'Safety, controversy, and what iridology cannot do',
    category: 'safety',
    summary:
      'Iridology is not validated as clinical diagnostic science. AiBhive provides educational interpretation only — never delay emergency or primary care based on iris photos.',
    imageUrl: W.eye,
    imageCredit: 'Human eye — Wikimedia Commons',
    whenPeopleExplore:
      'Before first use of AI iris analysis, or after alarming “findings” that cause anxiety.',
    approaches: [
      'Treat all AI output as literature-based tendencies with uncertainty.',
      'Confirm serious concerns with licensed medical providers and ophthalmology when indicated.',
      'Use iridology alongside — not instead of — conventional screening.',
      'Re-read disclaimers before sharing results with others.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Controlled trials have not validated iridology for disease detection.',
      'Urgent symptoms → emergency services, not iris reading.',
      'Children’s irises change — extra caution with minors.',
    ],
    sources: [
      { label: 'NIH — complementary health overview', url: 'https://www.nccih.nih.gov/' },
    ],
    deepDive: `Mainstream medicine classifies iridology as a pseudoscientific diagnostic method: multiple controlled studies have failed to show practitioners can detect diseases from iris photographs at rates better than chance. That does not stop iridology from persisting as a holistic education tradition — but AiBhive must be explicit about the evidentiary gap.

Our AI iridology feature uses Grok vision with strict prompting: educational phrasing only, mandatory uncertainty, photo quality gates, and “see a doctor” escalations for patterns that could reflect real pathology (even when the model should not diagnose). Users must accept a hold-harmless disclaimer before access. Hive Research billing applies unless locally exempt — credits buy computational interpretation, not medical truth.

If you feel frightened by an AI iris report, step back. Note what is explicitly labeled low confidence. Schedule appropriate medical care for symptoms you already have. Iridology is best treated as a lens for curiosity and wellness journaling — not a verdict on your health.`,
  },
  {
    id: 'rayid-personality-read',
    title: 'Rayid model — personality patterns (non-medical)',
    category: 'methodology',
    summary:
      'Rayid iridology maps iris structure to personality and emotional patterns. AiBhive labels Rayid content as exploratory and non-medical — optional read-only context in “all schools” mode.',
    imageUrl: W.iris,
    imageCredit: 'Iris — Wikimedia Commons',
    whenPeopleExplore:
      'Curiosity about emotional/personality iridology after seeing Rayid charts online.',
    approaches: [
      'Separate Rayid reads from physical health implications entirely.',
      'Use as reflective journaling prompts, not psychological diagnosis.',
      'Prefer integrated or physical methodology for wellness-oriented exploration.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'Rayid is not psychotherapy or psychiatric assessment.',
      'Do not use personality iris reads to justify avoiding mental health care.',
    ],
    sources: [],
    deepDive: `Rayid (sometimes linked to Denny Johnson’s work) interprets iris shapes and patterns as reflections of personality structure — jewels, flowers, streams, and related metaphors. It sits outside medical iridology entirely. Some integrated teachers mention Rayid for client communication; others exclude it.

AiBhive includes Rayid in the knowledge corpus only so the AI does not invent unsupported medical claims from personality frameworks. When methodology is "all", Rayid observations may appear clearly tagged as non-medical personality exploration. Default integrated analysis de-emphasizes Rayid unless the user’s notes request it. This protects users from conflating emotional metaphors with organ zone pathology language.`,
  },
  {
    id: 'left-right-eye-reading',
    title: 'Left vs right eye — bilateral reading basics',
    category: 'zone-chart',
    summary:
      'Traditional iridology treats each iris as a lateralized map: right iris for right-side body reflexes, left iris for left-side. Bilateral comparison can highlight asymmetry in educational reports.',
    imageUrl: W.chart,
    imageCredit: 'Iridology chart — Wikimedia Commons',
    whenPeopleExplore:
      'Uploading both eyes, or wondering which eye photo to send first.',
    approaches: [
      'Label photos left or right when uploading both.',
      'Compare symmetric zones only when photo quality matches on both sides.',
      'Asymmetry in iridology texts may suggest localized themes — state uncertainty.',
    ],
    relatedPlantIds: [],
    safetyWarnings: [
      'One-sided eye pain or redness — medical evaluation, not iridology.',
    ],
    sources: [],
    deepDive: `Bilateral iris analysis is standard in professional iridology sessions but technically demanding on phones. Each eye must be photographed with the same lighting and magnification for fair comparison. AiBhive accepts one or two attachments per request; when both are provided, the vision model is prompted to note lateralization and avoid merging zones across eyes.

If only one eye is uploaded, analysis proceeds with eye: left|right|unknown in structured JSON. Unknown orientation triggers conservative zone language (“if this is the right iris, sector X…”). Users should specify eye side in the optional notes field when known. Integrated methodology treats conflicting signs between eyes as a reason to lower confidence rather than double the number of alarming tendencies.`,
  },
];

export const IRIDOLOGY_CATEGORY_ORDER: IridologyCategory[] = [
  'methodology',
  'zone-chart',
  'constitutional',
  'signs-fibers',
  'photo-guide',
  'safety',
];

export function matchesIridologyCategory(topic: IridologyTopic, category: IridologyCategory | 'all'): boolean {
  if (category === 'all') return true;
  return topic.category === category;
}
