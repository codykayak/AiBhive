# AiBhive Diagnose

Voice-first AI co-pilot for tradespeople. MVP Trade Packs: **Pool Services** and **Electrical**.

Built with Expo SDK 57, Expo Router, NativeWind, Reanimated motion, and Grok + offline pack intelligence.

## Quick start

```bash
cd aibhive-diagnose
npm install
npm run dev:start
```

That starts Expo on web at **http://localhost:8081**.

Other useful scripts:

```bash
npm start          # Expo chooser (press w / i / a)
npm run web        # Web only
npm run typecheck  # TypeScript
```

Optional live AI:

```bash
export EXPO_PUBLIC_GROK_API_KEY=xai-...
```

## What’s inside

- Animated splash + pulsing diagnose loaders
- Home dashboard with guided flows, tips, recent diagnoses
- Diagnose chat (camera / voice / text) backed by a searchable fault library
- Jobs tracker with status cycling
- Trade Pack switcher (Pool + Electrical)
- Field tools: fault library, error codes, pool chemistry dosing, wire/torque charts, safety checklists
- Offline-capable local diagnosis engine (works without Grok)

## Structure

| Path | Purpose |
| --- | --- |
| `app/(tabs)` | Home, Diagnose, Jobs, Packs |
| `app/tools` | Field reference tools |
| `app/fault/[id]` | Full fault playbooks |
| `app/guided/[id]` | Yes/No guided triage |
| `lib/knowledge` | Faults, codes, chemistry, electrical refs |
| `lib/grok.ts` | Grok client + library grounding |

## Next

- Real speech-to-text
- Deeper brand-specific code matrices
- Parts ordering / invoicing
- Offline pack sync
