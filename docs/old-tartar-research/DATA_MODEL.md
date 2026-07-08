# Old Tartar Research — Data Model

Flexible Firestore schema for historical entity extraction and anomaly detection. Core fields are stable; `attributes` and `metadata` bags stay open-ended so you can search anything later without migrations.

## Collections

```
users/{uid}/tartarResearch/
  profile              — hiveCredits, billingMode, defaultAiProvider, enabledApps, promo fields, shareWithCommunity
  customBuild          — per-user build (visible only when signed in)
  data                 — anchor document for subcollections
  data/apiSecrets/{provider} — BYOK keys (server-only; denied in client rules)
  data/sources/{sourceId}    — enabled catalog + user-added sources
  data/searchTerms/{id}      — custom keywords for ingestion
  data/ingestionJobs/{id}    — pipeline job status
  data/mentions/{id}         — every extracted mention (full metadata)
  data/entities/{id}         — aggregated entity rollups
  data/anomalies/{id}        — flagged statistical patterns
  data/usageLog/{id}         — credit usage audit trail

tartarPlatform/        — read-only platform catalog (optional seed)
  catalog/promoCodes/{code} — partner codes (server-managed redemptions)
  pool/mentions/{id}   — opt-in pooled mentions (deduped)
  pool/anomalies/{id}  — opt-in pooled anomalies
  pool/anomalyCache/{key} — cached anomaly results (7-day TTL)
  pool/meta/stats      — contributor counts
```

## Mention document (example)

```json
{
  "entityName": "John Smith",
  "entityId": "john_smith",
  "entityType": "architect",
  "role": "architect",
  "project": "State Capitol Building",
  "projectType": "building",
  "date": "1892",
  "year": 1892,
  "location": "Sacramento, CA",
  "sourceId": "chronicling_america",
  "sourceKind": "chronicling_america",
  "sourceUrl": "https://chroniclingamerica.loc.gov/...",
  "sourceTitle": "Sacramento Daily Union",
  "attributes": {},
  "metadata": { "aiProvider": "gemini", "confidence": 0.92 }
}
```

## Extensibility

| Add later | How |
|-----------|-----|
| New source | `tartarAddSource` + adapter in `functions/lib/tartar/ingestion/` |
| New entity type | `entityTypeRegistry.js` — no DB migration |
| New anomaly rule | `anomalyDetection.js` + `customBuild.anomalyRules` |
| New AI provider | `aiProviders.js` + secret in Firebase |

## Billing

- **Hive credits**: cover processing (ingestion, indexing) and AI API costs (extraction, analysis)
- **Partner / promo codes**: reduced processing rates on Hive credits (`TARTAR_PROMO_CODES` or Firestore `tartarPlatform/catalog/promoCodes`)
- **BYOK**: user stores keys in `data/apiSecrets`; pay AI providers directly

## Query patterns

- Filter mentions: entityType, sourceId, year range, createdAt
- Top entities: `mentionCount` descending
- Queued jobs: `status == queued` + `createdAt`

See `src/old-tartar-research/config/schema.js` for TypeScript-style typedefs.
