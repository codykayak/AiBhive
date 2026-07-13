# AiBhive Pros — Administrator & Manager User Manual

**Version:** 1.0 · **URL:** https://aibhive.com/pros/app  
**Audience:** Company owners, office managers, and dispatchers using Pros HQ. Field technicians use the **AiBhive Diagnose** mobile app.

---

## 1. What AiBhive Pros is

AiBhive Pros is **headquarters for trade companies** — pool service, HVAC, electrical, plumbing, and property maintenance. It connects:

| Piece | Who uses it | What it does |
|--------|-------------|--------------|
| **Pros HQ** (web) | Managers & dispatch | Jobs, team roster, GPS map, push notifications, knowledge base, settings |
| **AiBhive Diagnose** (mobile) | Field techs | Voice/photo diagnosis, trade packs, job notes, alerts, periodic GPS pings |

The **living knowledge base** grows when techs diagnose in the field, confirm fixes, and when managers ingest OEM manuals. Every job makes the next call faster.

---

## 2. Getting started

### 2.1 Create your company HQ

1. Go to **https://aibhive.com/pros/app** and sign in with Google.
2. Choose **Create HQ**.
3. Enter your **company name** and **primary trade** (Pool, Electrical, Property, or Multi-trade).
4. You become the **owner** with full manager permissions.

### 2.2 Invite technicians

1. Open the **Team** tab (managers only).
2. Copy the **invite code** (format `PROS-XXXXXX`).
3. Share it with techs — they install **AiBhive Diagnose** from https://aibhive.com/download.html
4. In the mobile app: **Account → Join Pros team** and enter the code.

### 2.3 Point techs to the field app

- **Download:** https://aibhive.com/download.html or direct APK at `/api/download/apk`
- After install, techs sign in, join with invite code, and pick their **trade pack** (Pool, HVAC, etc.).

---

## 3. Pros HQ tabs — complete guide

### 3.1 Overview

The **Overview** tab is your morning dashboard.

- **Headline stats:** team size, open jobs, jobs by status.
- **Knowledge growth chart:** tips, feedback, and completed jobs over time (example curve on marketing site; yours shows real data once techs contribute).
- **Recent activity:** diagnose AI usage, manual ingests, job changes, notifications.
- **Featured tip:** a high-value field tip from your shop or the anonymized network.

**Tip:** Click **Refresh** (top right) after dispatching jobs or when waiting for field updates.

---

### 3.2 Jobs (Dispatch)

Create, assign, and track work orders.

#### Create a job

1. Open **Jobs** tab.
2. Click **New job**.
3. Fill in:
   - **Title** — short description (e.g. "Pump not priming — Oak St")
   - **Address** — for routing and context
   - **Customer name** (optional)
   - **Trade pack** — Pool, HVAC, Electrical, Property, Plumbing
   - **Priority** — normal / urgent
   - **Assignee** — pick a tech from your roster
   - **Notes** — dispatch instructions
4. Save. Assigned techs receive a **push notification** in Diagnose (Alerts tab) if push is enabled.

#### Job statuses

| Status | Meaning |
|--------|---------|
| **Queued** | Created, not started |
| **In progress** | Tech is on site or working |
| **Needs parts** | Waiting on parts order |
| **Done** | Completed |

Managers can change status from the job card. Techs update status from the mobile **Jobs** tab.

#### Job detail (expanded card)

- **Field notes** — synced from Diagnose when techs diagnose on the job
- **Photos** — attached from the field
- **Diagnose** shortcut — opens context for that equipment

#### Export jobs (CSV)

Managers: use **Export CSV** on the Jobs tab to download all jobs for spreadsheets, billing, or asset tracking. Columns include id, title, status, assignee, address, notes count, photos count, and timestamps.

---

### 3.3 Where is everybody?

**Managers only.** Periodic GPS check-ins — **not** live stalking.

#### How it works

1. Enable **location tracking** in **Settings** (see §3.8).
2. Techs must allow **foreground location** permission in Diagnose when prompted.
3. The app pings HQ every **N minutes** (default 15, minimum 5) while tracking is on and the tech is signed in.
4. The **Where is everybody?** tab shows a **map** with last-known positions and roster list.

#### What you see

- Tech name and email
- Last ping time
- Accuracy (meters)
- Optional **on-job** link if they had a job open during ping

#### Privacy & best practices

- Tell your team tracking is enabled in company policy.
- Use for dispatch ("who's closest to the callback?"), not minute-by-minute surveillance.
- Techs can deny OS permission; they simply won't appear on the map.

**Common question:** *"How do I view where all my team members are at?"*  
→ Open **Where is everybody?** tab (Navigation icon). Ensure **Settings → Location tracking** is ON and techs have granted location permission in Diagnose.

---

### 3.4 Notify (Push notifications)

Send push messages to techs' phones via Diagnose **Alerts**.

#### Send a notification

1. Open **Notify** tab.
2. Choose **audience:** all techs, one assignee, or linked to a job.
3. Enter **title** and **message**.
4. Send. Techs see it in **Alerts**; tapping can open the related job.

#### Job-linked alerts

When you create or update a job with an assignee, the system can push **"New job assigned"** style updates. Techs can **Accept** or **Decline** from the alert; response syncs to HQ.

#### Featured tip of the week

Managers can pin a **featured tip** visible to the whole shop (Knowledge / Overview depending on version).

---

### 3.5 Knowledge

**Managers only.** Your shop's **living knowledge base**.

#### What's in the knowledge base

| Source | Description |
|--------|-------------|
| **Field tips** | Confirmed fixes from tech feedback ("that worked") |
| **Diagnose feedback** | Structured outcomes after AI/local diagnosis |
| **Manual chunks** | OEM PDF text you've ingested |
| **Job completion fixes** | Fixes captured when jobs are marked done |

#### Manual ingest (OEM RAG)

1. Open **Knowledge** tab → **Manual knowledge ingest**.
2. Enter **brand** (Pentair, Carrier, etc.), **manual title**, **trade pack**.
3. Add **model prefixes** (comma-separated) — e.g. `011013, INT-` for matching nameplates.
4. Paste **extracted PDF text** (one chunk at a time for now).
5. Optional **source URL** for citation.
6. Choose **company** (shop only) or **global** (platform admin only).
7. Click ingest.

When a tech asks Diagnose about equipment matching those prefixes, the AI gets **manual excerpts** in context.

#### Manual search fallback (automatic)

If **no ingested manual matches** a model number in the tech's question, Diagnose shows **Manual Search** links — Google dork queries for PDFs on ManualsLib and the open web. Techs tap to open results in the browser. Managers can later ingest the PDF they find.

#### Analytics

Knowledge tab / Overview charts show growth: tips, feedback, manual chunks, jobs completed.

---

### 3.6 Team

**Managers only.**

- View all **members** with role (owner, manager, tech).
- **Invite code** — rotate if compromised (**Rotate invite**).
- See who has registered **push tokens** (for dispatch alerts).
- Roles:
  - **Owner** — full access, billing, delete company
  - **Manager** — jobs, knowledge, GPS, settings, export
  - **Tech** — field app only; cannot access manager tabs on web

---

### 3.7 AI Keys

Connect **Grok (xAI)** for live Diagnose AI in the field.

1. Open **AI Keys** tab.
2. Add your **xAI API key** OR use the platform key if your plan includes it.
3. Choose **preferred provider** in Settings.

Without a key, techs still get the **offline pack library** (fault playbooks, codes, guided flows) but not live vision/chat AI.

**Billing:** Companies in **trial** or **active** billing status can use live AI. Suspended accounts get pack library only.

---

### 3.8 Settings

| Setting | Description |
|---------|-------------|
| **Location tracking** | Master switch for periodic GPS pings |
| **Ping interval** | Minutes between check-ins (min 5) |
| **Require job photos** | Prompt techs to attach photos on job complete |
| **Default trade pack** | Default for new jobs |
| **Preferred AI provider** | Grok model routing |
| **Billing status** | trial / active / suspended (platform) |

Changes apply on next tech app sync.

---

### 3.9 Activity

Read-only **audit log**: job creates, diagnose AI calls, manual ingests, notification sends, invite rotations. Useful for troubleshooting "why didn't my tech get the alert?"

---

### 3.10 Help & User Manual

This document. Use the **Pros Assistant** chat (bottom right on HQ) to ask natural-language questions like:

- "How do I view where all my team members are at?"
- "How do I ingest a Pentair manual?"
- "How do techs join my company?"

The assistant is trained on this manual and your logged-in role.

---

## 4. Field app (AiBhive Diagnose) — what managers should know

### 4.1 Trade packs

Each company can use packs: **Pool, HVAC, Electrical, Plumbing, Property Maintenance**. Techs pick a pack on Home or Packs; managers set default pack in Settings.

### 4.2 Diagnose flow

1. **Voice chat** or **camera photo** or typed question.
2. App searches **local fault library** first (works offline).
3. When online + signed into Pros: **shop tips** + **ingested manuals** + **Grok AI**.
4. If no manual hit: **Manual Search** PDF dork links appear.
5. After fix: **"Did this work?"** feedback feeds the knowledge base.

### 4.3 Jobs on mobile

**Jobs** tab lists assigned work. Opening a job allows diagnose in context, notes, and photos. Completing a job can prompt **"What was the fix?"** to capture knowledge.

### 4.4 Alerts

Push notifications from HQ appear under **Alerts**. Techs respond to job assignments here.

---

## 5. Troubleshooting

| Problem | Fix |
|---------|-----|
| Tech not on map | Enable tracking in Settings; tech grants location in Diagnose; wait one ping interval |
| No push alerts | Tech must open Diagnose on a **development build or APK** — Expo Go has limited push on SDK 53+ |
| Live AI unavailable | Check AI Keys, billing status, tech joined Pros company |
| Manual not in diagnose | Verify model prefixes match nameplate; ingest more chunks |
| Invite code rejected | Rotate code; ensure tech uses latest APK |
| CSV export empty | Create jobs first; refresh |

---

## 6. URLs quick reference

| Resource | URL |
|----------|-----|
| Pros HQ | https://aibhive.com/pros/app |
| Pros marketing | https://aibhive.com/pros |
| Download Diagnose | https://aibhive.com/download.html |
| APK direct | https://aibhive.com/api/download/apk |

---

## 7. Assistant instructions (for AI)

When answering Pros HQ questions:

1. Identify if the user is a **manager** or **tech** (managers see GPS, Knowledge, Team, export).
2. Give **step-by-step** paths using exact tab names: Overview, Jobs, Where is everybody?, Notify, Knowledge, Team, AI Keys, Activity, Settings, Help.
3. For GPS: always mention Settings → Location tracking ON + tech permission in mobile app.
4. For manuals: explain ingest in Knowledge tab AND automatic Manual Search fallback in Diagnose.
5. Never invent features not listed in this manual.
6. Prefer concise, friendly prose — dispatchers are busy.
