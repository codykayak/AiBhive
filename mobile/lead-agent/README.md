# MacroREI Lead Agent (Android)

SMS automation for Eugene investor outreach: upload an owner list, send paced texts from **your phone**, Grok replies using **macrorei.com** on aibhive.com.

## Install on your physical phone (easiest)

**No PC, no PowerShell** — after the app is built on GitHub (~15 min after a merge to `main-fixed`):

1. On your Android phone, open **Chrome**.
2. Go to: **https://aibhive.com/api/download/lead-agent**
3. Download **aibhive-lead-agent.apk** → tap it → **Install** (allow unknown apps if asked).
4. Open **AiBhive Lead Agent** → allow **SMS** permissions.

## Install from your PC (USB or copy file)

From the repo root:

```powershell
npm run lead-agent:phone
```

This uses **JDK 17**, builds the APK, copies it to your **Desktop**, and runs `adb install` if your phone is plugged in with USB debugging.

## Use the app

1. **Leads** → **Upload CSV** or **Paste CSV** (`Owner Name`, `Property Address`, `Phone`).
2. Check the **Sample SMS** preview.
3. **Automation** → **Send 1 test SMS now** (try your own number first).
4. **Settings** → **Test server** / **Refresh RAG** (macrorei.com for inbound Grok).

Keep the app **open in the foreground** while automation runs.

## CSV example

```text
Owner Name,Property Address,Phone
John Smith,123 Oak St Eugene OR,5415551234
```

## Server

API: `https://aibhive.com/api/lead-agent/*` — device auth is preconfigured unless you override in Settings.
