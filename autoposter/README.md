# AiBhive AutoPoster

Automated daily social media pipeline for **Facebook**, **Instagram**, and **X** — lives at [aibhive.com/autoposter](https://www.aibhive.com/autoposter).

**No separate Firebase deploy required.** AutoPoster runs on the same Cloud Run service as aibhive.com and uses the existing `GEMINI_API_KEY`, Firestore, and `aibhive-media` storage bucket.

## Features

- AI researches industry news, writes platform-specific captions, generates branded images
- Google sign-in (same admin allowlist as `/admin`) — no API keys in the browser
- Optional daily SMS via Twilio
- Daily scheduler at 7:00 AM Pacific (in-process + optional Cloud Scheduler hook)

## Folder layout

```
autoposter/
  admin/              React UI (Vite) — served at /autoposter
  functions/          Original Firebase reference implementation (optional)
  functions/config/   Brand, topics, knowledge — read by the Cloud Run server
```

## Setup (zero extra secrets for Gemini)

AutoPoster is included in the main site build and server. When you deploy aibhive.com to Cloud Run:

1. **`GEMINI_API_KEY`** — already on Cloud Run for the main site. AutoPoster uses the same key.
2. **Google sign-in** — use your allowlisted Google account at `/autoposter`.
3. **Optional Twilio SMS** — set on Cloud Run if you want daily texts:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER`
   - `SOCIAL_NOTIFY_PHONE` (default notify number)

### Customize content

Edit before generating posts:

- `functions/config/brand.json`
- `functions/config/topics.json`
- `functions/config/knowledge.txt`

### Build

```bash
npm run build   # from repo root — includes autoposter UI
```

### Optional: Cloud Scheduler (more reliable than in-process)

Create a Cloud Scheduler job that POSTs daily at 7 AM Pacific:

```
POST https://www.aibhive.com/api/autoposter/cron
Header: X-Cron-Secret: <your-secret>   # if AUTOPOSTER_CRON_SECRET is set on Cloud Run
```

Set `DISABLE_AUTOPOSTER_SCHEDULER=true` on Cloud Run if you only want the external cron.

### Admin access

Same allowlist as `/admin`: `codykayak@gmail.com`, `admin@aibhive.com`, plus `ADMIN_EMAILS` env var.

## API

Browser → `GET/POST /api/autoposter` (Google Bearer token)

Actions: `list`, `config`, `generate`, `approve`, `reject`, `markPosted`, `update`, `resendNotify`, `testSms`, `updateConfig`
