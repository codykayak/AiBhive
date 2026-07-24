/** Official product name — web app and Android APK. */
export const AIBHIVE_PLANTS_APP_NAME = 'AiBhivePlants';

/** @deprecated use AIBHIVE_PLANTS_APP_NAME */
export const PLANT_APP_DISPLAY_NAME = AIBHIVE_PLANTS_APP_NAME;

export const LIVING_KNOWLEDGE_APP_NAME = AIBHIVE_PLANTS_APP_NAME;

export const LIVING_KNOWLEDGE_SHORT_NAME = 'AiBhivePlants';

/** Direct APK download (Google Play listing pending). */
export const PLANTS_APK_DOWNLOAD_PATH = '/api/download/plants-apk';

export const PLANTS_APK_DOWNLOAD_URL = `https://aibhive.com${PLANTS_APK_DOWNLOAD_PATH}`;

export const PLANTS_APK_FILENAME = 'AiBhivePlants.apk';

/** Top-left brand line on the plant medicine home shell. */
export const COMMUNITY_NAV_BRAND = 'Community Living Knowledgebase';

/** Primary product name shown on the home hero and key headings. */
export const EARTH_PLANT_MEDICINE_NAME = "Earth's Plant Medicine";

/** Plants tab — Ask AI / field guide hero beside the agent panel. */
export const PLANT_ASK_GUIDE_IMAGE = '/oregon-plant-medicine/edible-plant-id-ask-ai-aibhive-guide.jpg';

export const LIVING_KNOWLEDGE_TAGLINE =
  'Pacific Northwest foraging field guide — wild plants, mushrooms, and protocols. The plant library is primary; holistic, hypnosis, and animal health are adjacent research libraries.';

/** Meta description for /plants and AI corpus summaries. */
export const LIVING_KNOWLEDGE_SEO_DESCRIPTION =
  'AiBhivePlants — free Pacific Northwest plant ID and holistic remedies app. 178+ Oregon, Washington, and Northern California wild plants and mushrooms with photos, look-alikes, and harvest notes. Herbs, supplements, holistic protocols, hypnosis & energy, and animal health libraries. Community posts and featured essays. Free to browse on web; download the AiBhivePlants Android APK (Google Play pending). Hive Research uses Bhive Credits for Ask AiBhive and photo ID.';

export const LIVING_KNOWLEDGE_SEO_KEYWORDS =
  'AiBhivePlants, AiBhive Plants APK, Android plant identification app, Oregon wild edibles, Northern California foraging, edible mushrooms, medicinal plants, plant identification, holistic remedies, herbs TCM Ayurveda, supplements, Edgar Cayce, hypnosis QHHT, Reiki, animal health, community foraging, AiBhive';

export const HOLISTIC_SEO_DESCRIPTION =
  '35+ educational holistic remedy topics — PNW materia medica, Edgar Cayce traditions, detox overviews, nervines, and safety notes with deep-dive articles, site search, community posts, and featured essays. Cross-linked to the plant library. Not medical advice.';

export const HYPNOSIS_SEO_DESCRIPTION =
  'Hypnosis and energy work library — past life regression, Edgar Cayce, Dolores Cannon QHHT, clinical hypnotherapy, Reiki, chakras, Solfeggio frequencies, and community contributions with comments and featured essays. Not therapy or medical advice.';

export const ANIMAL_HEALTH_SEO_DESCRIPTION =
  'Holistic animal health education for dogs, cats, horses, and livestock — gut health, herbs, CBD, Reiki, nutrition debates, and community notes with upvotes and comments. Not veterinary advice.';

export const PRIMARY_LIBRARY_HEADING = 'Plant library';

export const ADJACENT_RESEARCH_HEADING = 'Adjacent research libraries';

export const ADJACENT_RESEARCH_DESCRIPTION =
  'Separate research tracks for holistic protocols, hypnosis & energy work, and animal health — alongside the core plant field guide, not a replacement for it.';

export const LIVING_KNOWLEDGE_HERO_LEAD =
  'Contribute your photos. Add to the states. Together, we document homeopathic remedies and edibles — growing one shared field guide for everyone.';

export const BUILDER_PATH = '/hive-apps/build';
export const CREDITS_PATH = '/app/settings';

/** Canonical public URL for the living knowledge plant library. */
export const PLANTS_PUBLIC_PATH = '/plants';

/** Flat rate to open a new state in the living knowledge base. */
export const STATE_CONTRIBUTION_USD = 3;

/** Holistic, hypnosis, and animal research topics are free via Builder for now. */
export const HOLISTIC_CONTRIBUTION_USD = 0;

export const HYPNOSIS_ENERGY_CONTRIBUTION_USD = 0;

export const ANIMAL_HEALTH_CONTRIBUTION_USD = 0;

/** Default Bhive Credits signup / top-up shown in the app footer bar. */
export const BHIVE_CREDITS_SIGNUP_USD = 5;

/** User-facing label for paid AI lookup (Ask agent, photo ID, post enrichment). */
export const HIVE_RESEARCH_LABEL = 'Hive Research';

/** Short attribution shown beside Hive Research features. */
export const HIVE_RESEARCH_POWERED_BY = 'Powered by AiBhive';

/** @deprecated use BHIVE_CREDITS_SIGNUP_USD */
export const GROK_CREDITS_SIGNUP_USD = BHIVE_CREDITS_SIGNUP_USD;

/** Minimum Hive credit top-up (recharge). */
export const MIN_RECHARGE_USD = 3;

/** Canonical URL segment for the holistic remedies tab (full path below). */
export const HOLISTIC_REMEDIES_SLUG = 'holistic-remedies-and-protocols';

export const HOLISTIC_REMEDIES_PATH = `${PLANTS_PUBLIC_PATH}/${HOLISTIC_REMEDIES_SLUG}`;

export const HOLISTIC_TAB_LABEL = 'Holistic remedies & protocols';

export const HOLISTIC_TAB_SHORT_LABEL = 'Holistic protocols';

/** Canonical URL segment for hypnosis & energy (full path below). */
export const HYPNOSIS_ENERGY_SLUG = 'hypnosis-and-energy';

export const HYPNOSIS_ENERGY_PATH = `${PLANTS_PUBLIC_PATH}/${HYPNOSIS_ENERGY_SLUG}`;

export const HYPNOSIS_ENERGY_TAB_LABEL = 'Hypnosis & Energy';

export const HYPNOSIS_ENERGY_TAB_SHORT_LABEL = 'Hypnosis & Energy';

/** Canonical URL segment for animal health (full path below). */
export const ANIMAL_HEALTH_SLUG = 'animal-health';

export const ANIMAL_HEALTH_PATH = `${PLANTS_PUBLIC_PATH}/${ANIMAL_HEALTH_SLUG}`;

export const ANIMAL_HEALTH_TAB_LABEL = 'Animal Health';

export const ANIMAL_HEALTH_TAB_SHORT_LABEL = 'Animal Health';

/** Canonical URL segment for herbs materia medica (full path below). */
export const HERBS_SLUG = 'herbs';

export const HERBS_PATH = `${PLANTS_PUBLIC_PATH}/${HERBS_SLUG}`;

export const HERBS_TAB_LABEL = 'Herbs';

export const HERBS_TAB_SHORT_LABEL = 'Herbs';

export const HERBS_SEO_DESCRIPTION =
  'Herbs library — Western herbalism, Chinese medicine (TCM), Ayurveda, and Pacific Northwest materia medica with in-depth summaries, traditional uses, safety warnings, and community notes. Not medical advice.';

/** Canonical URL segment for supplements education (full path below). */
export const SUPPLEMENTS_SLUG = 'supplements';

export const SUPPLEMENTS_PATH = `${PLANTS_PUBLIC_PATH}/${SUPPLEMENTS_SLUG}`;

export const SUPPLEMENTS_TAB_LABEL = 'Supplements';

export const SUPPLEMENTS_TAB_SHORT_LABEL = 'Supplements';

export const SUPPLEMENTS_SEO_DESCRIPTION =
  'Supplements library — vitamins, minerals, omega-3, probiotics, and specialty compounds with evidence summaries, dosing context, drug interaction notes, and quality guidance. Not medical advice.';
