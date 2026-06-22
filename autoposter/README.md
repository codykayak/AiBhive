# AiBhive AutoPoster

Automated daily social media pipeline for **Facebook**, **Instagram**, and **X** — lives at [aibhive.com/autoposter](https://www.aibhive.com/autoposter).

- Picks a topic from `functions/config/topics.json`
- Researches industry news (Gemini + Google Search)
- Writes platform-specific captions
- Generates branded images (Gemini)
- Optional daily SMS via Twilio
- Admin UI to review, edit, copy, and approve

**Authentication:** Sign in with Google (same admin allowlist as `/admin`). No manual API key in the browser.

## Folder layout

```
autoposter/
  admin/           React UI (Vite) — served at /autoposter
  functions/       Firebase Cloud Functions + config
  firebase.json
  firestore.rules
```

## Quick start

### 1. Customize config

Edit `functions/config/` before first run:

- `brand.json` — name, site URL, admin URL, voice, image style
- `topics.json` — rotating post topics + site links
- `knowledge.txt` — product/brand context for captions

### 2. Deploy Firebase functions

```bash
cd autoposter/functions
npm ci
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set SOCIAL_ADMIN_API_KEY   # server-side only
# Optional Twilio SMS:
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_FROM_NUMBER
firebase functions:secrets:set SOCIAL_NOTIFY_PHONE

export FIREBASE_STORAGE_BUCKET=your-project.appspot.com
firebase deploy --only functions,firestore:rules,firestore:indexes
```

### 3. Configure the main site server

Add to your server `.env` (never commit real values):

```bash
SOCIAL_API_URL=https://us-central1-YOUR_PROJECT.cloudfunctions.net/socialPosts
SOCIAL_ADMIN_API_KEY=your-secret-key-matching-firebase-secret
# ADMIN_EMAILS=you@gmail.com   # optional extra allowlist emails
```

The Express server proxies `/api/autoposter` → Firebase function using that key. Clients only send a Google ID token.

### 4. Build & run the UI

From the repo root:

```bash
cd autoposter/admin && npm ci && npm run dev   # http://localhost:5175/autoposter/
```

Production build is included in the main site build:

```bash
npm run build   # from repo root
```

Open `/autoposter`, click **Continue with Google**, and start generating posts.

### 5. Scheduler

`socialPostScheduler` runs daily at **7:00 AM Pacific**. Adjust in `functions/index.js`.

## API

Browser → `GET/POST /api/autoposter` (Google admin auth)

Server → Firebase `socialPosts` function (server-side `X-Social-Admin-Key`)

Actions: `list`, `config`, `generate`, `approve`, `reject`, `markPosted`, `update`, `resendNotify`, `testSms`, `updateConfig`

## Admin access

Allowed emails are defined in `server/index.js` (`DEFAULT_ADMIN_EMAILS`) and can be extended via the `ADMIN_EMAILS` env var — same list as the main `/admin` dashboard.
