# AiBhive Diagnose

Voice-first AI co-pilot for tradespeople. MVP Trade Packs: **Pool Services** and **Electrical**.

Built with Expo SDK 57, Expo Router, NativeWind, and Grok as the reasoning engine.

## Quick start

```bash
cd aibhive-diagnose
npm install
npx expo start
```

Optional: set a Grok key for live AI (otherwise local pack guidance is used):

```bash
export EXPO_PUBLIC_GROK_API_KEY=xai-...
```

## App structure

| Tab | Purpose |
| --- | --- |
| Home | Dashboard — voice chat, camera diagnosis, Trade Packs |
| Diagnose | Main AI chat with voice + photo input |
| Jobs | Placeholder job list for field work |
| Packs | Switch Pool / Electrical packs |

## Trade Packs

Packs live in `lib/packs/`. Each pack owns:

- System prompt for Grok
- Quick prompts
- Equipment categories
- Accent / icon metadata

Add a new pack by creating a file under `lib/packs/` and registering it in `lib/packs/index.ts`.

## Next up

- Pool Services Pack depth (pumps, filters, salt, automation)
- Electrical Pack depth (panels, breakers, wiring, code)
- Real speech-to-text
- Offline pack knowledge cache
- Invoicing / parts ordering
