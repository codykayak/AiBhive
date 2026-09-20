# MacroREI Lead Agent (Android)

SMS automation for Eugene investor outreach: upload an owner list, send paced texts from your phone, Grok replies using **macrorei.com** RAG on aibhive.com.

## Quick start (phone)

1. Install the debug APK: `android/app/build/outputs/apk/debug/app-debug.apk` (rebuild after code changes — see below).
2. Open app → lands on **Leads**.
3. **Upload CSV** or **Paste CSV** with columns like `Owner Name`, `Property Address`, `Phone`.
4. Check the **Sample SMS** preview (uses Cody / Eugene / property address template).
5. **Automation** tab → **Send 1 test SMS now** (grants SMS permission) → then toggle **Run automation**.
6. **Settings** → API `https://aibhive.com` → **Test server** → **Refresh RAG** (macrorei.com knowledge for inbound Grok).

Keep the app **open in the foreground** while automation runs (Android).

## CSV format

Header row (recommended):

```text
Owner Name,Property Address,Phone
John Smith,123 Oak St Eugene OR,5415551234
Jane & Bob Doe,456 Pine Ave Springfield OR,541-555-9876
```

Or three columns without headers: name, address, phone.

## SMS template

First outbound (automation):

> Hi {FirstName}, my name is Cody, I'm a real estate investor in Eugene. I'm wondering if you still own the property at {address} and if you may be interested in selling it?

Edit in **Settings → Greeting** (MacroREI uses `{address}` in the template).

## Rebuild APK (required after JS changes)

Needs **JDK 17** and Android SDK:

```powershell
cd mobile\lead-agent
npm install
npm run build:apk:debug
```

APK: `mobile/lead-agent/android/app/build/outputs/apk/debug/app-debug.apk`

## Server

Lead Agent API on aibhive.com: `/api/lead-agent/*`. Device auth uses built-in secret (see `lib/builtinAccess.ts`) unless you override in Settings.

Ship server changes via `npm run ship` from repo root so bulk import + RAG updates deploy to Cloud Run.
