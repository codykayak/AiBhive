# MacroREI Lead Agent (Android + iPhone)

SMS automation for Eugene investor outreach: upload an owner list, send paced texts from **your phone** (Android) or Messages/Twilio (iPhone), Grok replies using **macrorei.com** on aibhive.com.

## Install on Android (physical phone — recommended for automation)

**No PC** — after GitHub builds the APK (~15 min after merge to `main-fixed`):

1. On your Android phone, open **Chrome**.
2. Go to **https://aibhive.com/api/download/lead-agent** (or Employee portal → Dialer & tools).
3. Download **aibhive-lead-agent.apk** → tap the file → **Install**.
4. If blocked: **Settings → Apps → Chrome → Install unknown apps → Allow**.
5. Open **AiBhive Lead Agent** → allow **SMS** and **Phone** permissions.
6. **Sign in with Google** (same email your manager invited).

### Install from Windows PC (USB)

From the repo root:

```powershell
npm run lead-agent:phone
```

Uses **JDK 17**, builds the APK, copies **AiBhive-Lead-Agent.apk** to your **Desktop**, and runs `adb install` if USB debugging is on.

## Install on iPhone (TestFlight)

Paced background SMS from your personal number is **Android-only**. On iPhone the app still handles **lists, dialer, Google sign-in, and Twilio** when enabled.

1. Install **TestFlight** from the App Store.
2. Open your manager’s **TestFlight invite link** (shown on https://aibhive.com/employee when `LEAD_AGENT_IOS_TESTFLIGHT_URL` is set).
3. Install **AiBhive Lead Agent** → **Sign in with Google**.
4. Import leads; **Dial/SMS** opens Phone or **Messages** with the text ready — tap Send per message, or use **Settings → Twilio** when ops turns it on.

### Build iOS for TestFlight (managers / Mac)

```bash
cd mobile/lead-agent
npm ci
npx eas-cli login
npx eas-cli build --platform ios --profile preview
```

Requires Expo account, Apple Developer membership, and credentials in [expo.dev](https://expo.dev). CI: GitHub Actions **Build Lead Agent iOS (EAS)** when `EXPO_TOKEN` is configured.

## Use the app
1. **Leads** → **Upload CSV** or **Paste CSV** (`Owner Name`, `Property Address`, `Phone`).
2. Check the **Sample SMS** preview.
3. **Automation** → **Send 1 test SMS now** (try your own number first).
4. **Settings** → **Test server** / **Refresh RAG** (macrorei.com for inbound Grok).

### Share the marketing list with a partner

1. On **Leads**, tap **Invite partner** and enter their **Google email** (or tap **Share link**).
2. They install Lead Agent, tap **Sign in with Google**, and use the same email you invited.
3. They get **view-only** access to your MacroREI owner list (synced from aibhive.com).

Keep the app **open in the foreground** while automation runs.

## CSV example

```text
Owner Name,Property Address,Phone
John Smith,123 Oak St Eugene OR,5415551234
```

## Server

API: `https://aibhive.com/api/lead-agent/*` — device auth is preconfigured unless you override in Settings.
