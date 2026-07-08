/**
 * Old Tartar Research — flexible Firestore document shapes.
 *
 * Design principles:
 * - Core fields are stable; `attributes` and `metadata` bags stay open-ended.
 * - Entity types, roles, and source kinds come from registries — not hardcoded enums.
 * - Every mention links entity ↔ project ↔ source ↔ time ↔ place.
 */

/** @typedef {'builder'|'architect'|'engineer'|'author'|'publisher'|'organization'|'contractor'|'cartographer'|'other'} EntityTypeId */

/**
 * @typedef {Object} TartarMention
 * @property {string} id
 * @property {string} entityName — normalized display name
 * @property {string} [entityId] — link to aggregated entity doc
 * @property {EntityTypeId|string} entityType
 * @property {string} [role] — e.g. "architect", "builder", "author"
 * @property {string} [project] — building, book, map, newspaper article, etc.
 * @property {string} [projectType] — building | book | map | article | forum_post | ...
 * @property {string|number} [date] — ISO date, year, or free-text period
 * @property {number} [year] — parsed year for range queries
 * @property {number} [yearEnd] — end of range when applicable
 * @property {string} [location] — free-text place
 * @property {string} [locationCountry]
 * @property {string} [locationRegion]
 * @property {string} [locationCity]
 * @property {number} [lat]
 * @property {number} [lng]
 * @property {string} sourceId — registry or user source id
 * @property {string} sourceKind — internet_archive | loc_maps | chronicling_america | ...
 * @property {string} sourceUrl — canonical URL at source
 * @property {string} [sourceTitle]
 * @property {string} [sourceExcerpt] — surrounding text
 * @property {string} [ingestionJobId]
 * @property {string} [searchTermId]
 * @property {Record<string, unknown>} [attributes] — extensible key/value
 * @property {Record<string, unknown>} [metadata] — pipeline provenance, AI model, confidence
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} [updatedAt]
 */

/**
 * @typedef {Object} TartarEntity
 * @property {string} id
 * @property {string} name — canonical name
 * @property {string[]} [aliases]
 * @property {EntityTypeId|string} primaryType
 * @property {string[]} [roles]
 * @property {number} mentionCount
 * @property {number} [projectCount] — distinct projects
 * @property {number} [firstYear]
 * @property {number} [lastYear]
 * @property {string[]} [locations]
 * @property {Record<string, number>} [mentionsByYear] — year → count
 * @property {Record<string, unknown>} [attributes]
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} [updatedAt]
 */

/**
 * @typedef {Object} TartarSource
 * @property {string} id
 * @property {string} name
 * @property {string} kind — adapter id (internet_archive, reddit, custom_http, ...)
 * @property {string} [description]
 * @property {string} [homepageUrl]
 * @property {string} [searchUrlTemplate] — e.g. https://archive.org/search?query={query}
 * @property {boolean} enabled
 * @property {boolean} isCustom — user-added vs platform catalog
 * @property {string[]} [defaultSearchTerms]
 * @property {Record<string, unknown>} [adapterConfig] — per-source API keys, rate limits
 * @property {Record<string, unknown>} [metadata]
 */

/**
 * @typedef {Object} TartarSearchTerm
 * @property {string} id
 * @property {string} term
 * @property {string[]} [sourceIds] — empty = all enabled sources
 * @property {boolean} enabled
 * @property {string} [notes]
 */

/**
 * @typedef {Object} TartarIngestionJob
 * @property {string} id
 * @property {'queued'|'running'|'completed'|'failed'|'cancelled'} status
 * @property {string[]} sourceIds
 * @property {string[]} [searchTerms]
 * @property {number} [itemsProcessed]
 * @property {number} [mentionsExtracted]
 * @property {string} [error]
 * @property {string} [aiProvider] — gemini | grok | kimi | none
 * @property {import('firebase/firestore').Timestamp} createdAt
 * @property {import('firebase/firestore').Timestamp} [startedAt]
 * @property {import('firebase/firestore').Timestamp} [completedAt]
 */

/**
 * @typedef {Object} TartarAnomaly
 * @property {string} id
 * @property {string} entityId
 * @property {string} entityName
 * @property {EntityTypeId|string} entityType
 * @property {'high_output_narrow_window'|'role_mismatch'|'geographic_cluster'|'custom'} kind
 * @property {number} score — 0–100 severity
 * @property {number} [count] — e.g. projects in window
 * @property {number} [windowYears]
 * @property {number} [windowStartYear]
 * @property {number} [windowEndYear]
 * @property {string} summary — human-readable explanation
 * @property {Record<string, unknown>} [details]
 * @property {'open'|'reviewed'|'dismissed'} status
 * @property {import('firebase/firestore').Timestamp} detectedAt
 */

/**
 * @typedef {Object} TartarProfile
 * @property {number} hiveCredits — platform credits balance
 * @property {'hive_credits'|'byok'} billingMode
 * @property {string} [defaultAiProvider] — gemini | grok | kimi
 * @property {Record<string, boolean>} [enabledApps] — appId → enabled
 * @property {import('firebase/firestore').Timestamp} [createdAt]
 */

/**
 * @typedef {Object} TartarCustomBuild
 * @property {string} name
 * @property {string} [description]
 * @property {string[]} enabledSourceIds
 * @property {string[]} enabledEntityTypes
 * @property {string[]} [dashboardWidgets] — mentions | anomalies | timeline | map
 * @property {Record<string, unknown>} [anomalyRules] — thresholds user can tune
 * @property {Record<string, unknown>} [theme]
 * @property {import('firebase/firestore').Timestamp} updatedAt
 */

/** Firestore path helpers (client-safe) */
export const TARTAR_ROOT = 'tartarResearch';

export const paths = {
  profile: (uid) => `users/${uid}/${TARTAR_ROOT}/profile`,
  customBuild: (uid) => `users/${uid}/${TARTAR_ROOT}/customBuild`,
  mentions: (uid) => `users/${uid}/${TARTAR_ROOT}/mentions`,
  mention: (uid, id) => `users/${uid}/${TARTAR_ROOT}/mentions/${id}`,
  entities: (uid) => `users/${uid}/${TARTAR_ROOT}/entities`,
  entity: (uid, id) => `users/${uid}/${TARTAR_ROOT}/entities/${id}`,
  sources: (uid) => `users/${uid}/${TARTAR_ROOT}/sources`,
  source: (uid, id) => `users/${uid}/${TARTAR_ROOT}/sources/${id}`,
  searchTerms: (uid) => `users/${uid}/${TARTAR_ROOT}/searchTerms`,
  ingestionJobs: (uid) => `users/${uid}/${TARTAR_ROOT}/ingestionJobs`,
  anomalies: (uid) => `users/${uid}/${TARTAR_ROOT}/anomalies`,
  usageLog: (uid) => `users/${uid}/${TARTAR_ROOT}/usageLog`,
  platformApps: () => 'tartarPlatform/apps',
  platformEntityTypes: () => 'tartarPlatform/entityTypes',
  platformSourceCatalog: () => 'tartarPlatform/sourceCatalog',
};

/** Platform fee on Hive credit AI usage (30% upkeep) */
export const PLATFORM_FEE_RATE = 0.3;

/** Default credits for new researchers */
export const DEFAULT_STARTING_CREDITS = 100;
