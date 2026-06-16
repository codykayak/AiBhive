# Shared Hive mission

**Canonical file:** [`hive-mission.md`](./hive-mission.md)

This document is the single source of truth for what Taylored Mobile is, what every AI agent's job is, and when to route work to Cursor vs existing tools.

## Who reads it

| Consumer | How |
|----------|-----|
| Server triage (Gemini) | `shared/hiveMission.js` → `getMissionPromptBlock('triage')` |
| Cursor build agents | `getMissionPromptBlock('cursor')` appended to spawn prompt |
| Mobile chat / local triage | Bundled copy + `GET /api/hive/mission` cache |
| Humans | Edit `hive-mission.md` directly |

## After editing

```bash
npm run sync:mission
```

This regenerates bundled fallbacks in `server/hiveMissionBundled.js` and `taylored-mobile/src/constants/hiveMissionBundled.ts` so the app works offline before the server is redeployed.

## API

`GET https://aibhive.com/api/hive/mission` returns `{ version, markdown, updatedAt }` once deployed.
