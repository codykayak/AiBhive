# Old Tartar Research — Data Model

Flexible Firestore schema for historical entity extraction and anomaly detection. Core fields are stable; `attributes` and `metadata` bags stay open-ended so you can search anything later without migrations.

## Collections

```
users/{uid}/tartarResearch/
  profile              — hiveCredits, billingMode, defaultAiProvider, enabledApps
  customBuild          — per-user build (visible only when signed in)
  apiSecrets/{provider}— BYOK keys (server-only; denied in client rules)
  sources/{sourceId}   — enabled catalog + user-added sources
  searchTerms/{id}     — custom keywords for ingestion
  ingestionJobs/{id}   — pipeline job status
  mentions/{id}        — every extracted mention (full metadata)
  entities/{id}        — aggregated entity rollups
  anomalies/{id}       — flagged statistical patterns
  usageLog/{id}        — credit usage audit trail

tartarPlatform/        — read-only platform catalog (optional seed)
  apps/
  entityTypes/
  sourceCatalog/
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

- **Hive credits**: platform keys; 30% fee on usage (`PLATFORM_FEE_RATE = 0.3`)
- **BYOK**: user stores keys in `apiSecrets`; no credit charge

## Query patterns

- Filter mentions: entityType, sourceId, year range, createdAt
- Top entities: `mentionCount` descending
- Queued jobs: `status == queued` + `createdAt`

See `src/old-tartar-research/config/schema.js` for TypeScript-style typedefs.
