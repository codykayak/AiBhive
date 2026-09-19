# AiBhive Lead Agent (Android)

Multi-business SMS + dialer app with Grok auto-reply. Businesses: MacroREI, ManyDoors AI, AiBhive Pros.

## Install on your phone (no Developer Mode required)

1. Copy **`app-debug.apk`** to the phone (USB → Download folder, Drive, email, etc.).
2. On the phone: **Settings → Apps → Special app access → Install unknown apps**.
3. Enable **Allow from this source** for **Files** (or Chrome/Gmail — whichever app opens the APK).
4. Open **Files → Downloads → app-debug.apk → Install**.
5. If Play Protect warns: **Install anyway** (this is your local debug build).
6. Grant **SMS**, **Phone**, and **Calls**; set battery to **Unrestricted**.

**Developer Mode / USB debugging is NOT required** for sideload install.

If nothing happens when you tap the file, you are usually opening it on PC or unknown-apps is blocked for that app.

### Optional: install from PC with USB

Requires Developer options + USB debugging, then:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r "android\app\build\outputs\apk\debug\app-debug.apk"
```

## Build APK on Windows

Prerequisites: Node 20+, JDK 17, Android SDK (`ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk`).

```powershell
$env:JAVA_HOME="C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
$env:GRADLE_USER_HOME="C:\gradle-home"
cd C:\Users\AiBhive\aibhiverepo\aibhive-main-fixed\mobile\lead-agent
npm install
npm run build:apk
```

APK output:

`android\app\build\outputs\apk\debug\app-debug.apk`

## Permissions

Grant SMS, Phone, and disable battery optimization so inbound texts reach Grok while you work.

## Server / Grok

API routes at `/api/lead-agent/*` and `/api/macrorei/voice/*` on aibhive.com (**requires deploy**).

### Enable automation (outbound + Grok inbound)

1. On the server (`.env.local` / Cloud Run): `XAI_API_KEY`, `LEAD_AGENT_DEVICE_SECRET`, `LEAD_AGENT_OWNER_UID`.
2. In the app **Settings**: API URL `https://aibhive.com`, paste the **device secret**, tap **Test server**.
3. **Leads** tab: import or add leads (status **new**).
4. **Automation** tab: pick MacroREI / ManyDoors / AiBhive Pros, turn **Run automation** ON, keep the app **foreground**.
5. Adjust **Daily max** on Automation (paced 6–15 min between cold texts; send window 9am–6pm by default).

Grok loads **website RAG** for each business (macrorei.com, manydoorsai.com, aibhive.com/pros). Tap **Refresh RAG** in Settings after site changes.

### MacroREI Work Mode (Grok answers calls)

1. In **xAI Voice Agent Builder**, create a MacroREI agent (paste training from Settings → AI knowledge in app).
2. Set env on server: `MACROREI_GROK_AGENT_ID`, optional separate `MACROREI_GROK_VOICE_PHONE_E164`.
3. In app: select **MacroREI** → **Work Mode** tab → forward cell to Grok line (`*72…` / `*73` cancel).
4. Test: call your cell from another phone; Grok should answer after forward delay.

See `.env.example` for `MACROREI_*` variables.

## Map CMS (`macrorei.com/app`)

The **Investor Map CMS** UI (pins, property lists, login) lives in the separate repo **`codykayak/realestate`** (Firebase `realestate-map-23692`) — not in this AiBhive tree. This mobile app is the new dialer/SMS layer; a future pass can mirror Map CMS styling or sync property imports from that repo.

Reference dialer UX in-repo: ManyDoors **`LeedsPage`** at `manydoorsai-worktree/src/pages/LeedsPage.jsx` (phone, notes, call log).
