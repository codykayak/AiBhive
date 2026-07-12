# AiBhive Diagnose

Voice-first AI co-pilot for tradespeople. Trade Packs: **Pool**, **Electrical**, and **Property Maintenance**.

Built with Expo SDK 57, Expo Router, NativeWind, and Grok + offline pack intelligence.

## Mobile (Expo Go) — recommended for phone testing

This project is **SDK 57**. You need the **SDK 57** Expo Go build from [expo.dev/go](https://expo.dev/go) (store builds may still be on an older SDK and will spin forever).

```bash
cd aibhive-diagnose
npm install
npm run dev:mobile
```

That starts Metro with an ngrok tunnel. In Expo Go, open:

```text
exp://<the-host-shown>.exp.direct
```

Or scan the QR printed in the terminal.

> Do **not** use `npm start` / `npm run dev` for Expo Go — those serve a static **web** preview on port 8082 for Cursor browser testing.

### If `npm install` hits ENOTEMPTY

```bash
rm -rf node_modules
npm ci
npm install --save-dev @expo/ngrok@^4.1.3
```

## Web preview (Cursor browser)

```bash
cd aibhive-diagnose
npm run dev:start
```

Forward port **8082** and open it in the browser.

## Optional live AI

```bash
export EXPO_PUBLIC_GROK_API_KEY=xai-...
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev:mobile` | Metro + tunnel for Expo Go on your phone |
| `npm run dev:start` | Static web build on `:8082` (Cursor preview) |
| `npm run typecheck` | TypeScript |

## What’s inside

- Home dashboard with guided flows, tips, recent diagnoses
- Diagnose chat (camera / real voice / text) with session persistence + structured step cards
- Offline-first routing (pack library when offline; Pros AI when signed in)
- Jobs tracker (local + Pros sync) with “Diagnose this job”
- Trade Packs: Pool, Electrical, Property Maintenance (cross-pack + appliance RAG)
- Field tools: library, shop tips, how-tos, codes, chemistry, wire charts, safety
- Native Google sign-in via Expo Auth Session (set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`)
