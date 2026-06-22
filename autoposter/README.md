# AiBhive AutoPoster

Automated daily social media pipeline for **Facebook**, **Instagram**, and **X** — lives at [aibhive.com/autoposter](https://www.aibhive.com/autoposter).

- Picks a topic from `functions/config/topics.json`
- Researches industry news (Gemini + Google Search)
- Writes platform-specific captions
- Generates branded images (Gemini)
- Optional daily SMS via Twilio
- Admin UI to review, edit, copy, and approve

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
firebase functions:secrets:set SOCIAL_ADMIN_API_KEY
# Optional Twilio SMS:
firebase functions:secrets:set TWILIO_ACCOUNT_SID
firebase functions:secrets:set TWILIO_AUTH_TOKEN
firebase functions:secrets:set TWILIO_FROM_NUMBER
firebase functions:secrets:set SOCIAL_NOTIFY_PHONE

export FIREBASE_STORAGE_BUCKET=your-project.appspot.com
firebase deploy --only functions,firestore:rules,firestore:indexes
```

### 3. Build & run the UI

From the repo root:

```bash
cd autoposter/admin
cp .env.example .env.local   # set VITE_SOCIAL_API_URL to your socialPosts endpoint
npm ci
npm run dev                  # http://localhost:5175/autoposter/
```

Production build is included in the main site build:

```bash
npm run build                # from repo root — builds main site + cody + autoposter
```

The Express server serves the app at `/autoposter`.

### 4. Scheduler

`socialPostScheduler` runs daily at **7:00 AM Pacific**. Adjust in `functions/index.js`.

## API

HTTP function `socialPosts`:

- `GET ?action=list`
- `GET ?action=config`
- `POST { action: 'generate', force?: boolean }`
- `POST { action: 'approve' | 'reject' | 'markPosted' | 'update' | 'resendNotify' | 'testSms' | 'updateConfig', ... }`

Auth header: `X-Social-Admin-Key`
