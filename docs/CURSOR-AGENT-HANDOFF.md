# Cursor agent handoff (read this first)

**Last updated:** 2026-10-11 ~7:10 PM PT  
**Repo root (canonical):** `C:\Users\AiBhive\aibhiverepo\aibhive-main-fixed`  
**Nested workspace folder:** `...\aibhive-main-fixed\aibhive-main-fixed` is a duplicate/nested tree — edit files in the **parent** repo root above, not the nested copy.

**Product:** [aibhive.com](https://aibhive.com) — autonomous AI / ops for MacroREI, ManyDoors, Lead Agent, employee call center.

**Human context (Oct 2026):** Owner lost phone; needs **laptop employee portal** (call/text/lists), **Twilio** linked with credits added, **Grok voice** on return calls. Cursor **billing** was failing (declined / unpaid invoice loop) — human may switch Cursor accounts; do not depend on prior chat memory.

---

## Git & deploy (as of 2026-10-11)

| Item | Value |
|------|--------|
| Production branch | `main-fixed` |
| Live commit | `4e8d240` (2026-10-08 9:30 PM PT) — employee **Call center ops** revamp |
| Prior live commit | `9ff8a56` (2026-10-04) — dev login bypass, Grok return-call bridge, CSV/dialer |
| Feature branch | `cursor/employee-laptop-floor-c7f3` (same SHA as `main-fixed` for deployed work) |
| Ship command | `npm run ship` from repo root (pushes `cursor/*` → PR automation → merge → deploy) |
| **Do not** | `gcloud builds submit` from Windows for routine deploys |
| Cloud Run | Service `aibhive`, region **us-west1**, project `project-c223f844-6371-4c3f-a0c` |
| PR automation | Often **does not open PRs** (GitHub token). Direct push used: `git push origin <branch>:main-fixed` |

### Uncommitted work (must ship for Twilio linking UI)

**Not on production yet** — local only as of handoff:

- `server/twilioStatus.js` (new) — `GET /api/twilio/status` setup guide + env booleans
- `server/employeePortal/desk.js` — `POST /api/employee-portal/desk/link-twilio`
- `server/index.js` — registers Twilio status routes
- `src/lib/employeePortalApi.ts` — `linkEmployeeDeskTwilio`, `fetchTwilioStatus`
- `src/components/employee-portal/EmployeeDesk.tsx` — Lines panel “Link Twilio to list”
- `.env.example` — Twilio comments

**Action for next agent:** `npm run build`, commit, `git push origin cursor/employee-laptop-floor-c7f3:main-fixed` (or fresh `cursor/*` branch + `npm run ship`).

---

## Employee portal / call center (top priority)

**URL:** https://aibhive.com/employee  
**Route:** `src/pages/EmployeePortalPage.tsx`  
**Main UI:** `src/components/employee-portal/EmployeeDesk.tsx` — full **ops console** with nav:

1. **Command center** — queue stats, open list, recent activity  
2. **Live dialer** — power dial, Twilio browser call, SMS, dispositions  
3. **Lead board** — filters, sort, flags (needs human, callback)  
4. **List import** — CSV/TSV/Excel + paste (`src/lib/leadListImport.ts`)  
5. **Automation & SMS** — read-only tuning from Lead Agent business config  
6. **Lines & Grok voice** — Twilio health, webhook URLs (copy buttons)

**API:** `server/employeePortal/desk.js` — `GET /api/employee-portal/desk` returns `analytics`, `tuning`, `infrastructure`, `queue.openPreview`, `syncedAt`.

**Auth:**

- Production: Google sign-in + employee allowlist (`EMPLOYEE_PORTAL_EMAILS`, Lead Agent team, admin emails). See `server/employeePortal/routes.js`.
- **Local dev bypass** (not on Cloud Run): `server/employeePortal/devAuth.js` + `/employee?dev=1` or “Enter portal (local dev)”. Token `aibhive-local-employee-dev`. Blocked when `K_SERVICE` set.

**User preference:** Timestamp **date/time PT** when deploying or reporting status.

---

## Twilio (blocking work — credits added, server not configured)

Employee desk SMS uses **server env** (`preferServerTwilio: true`), not the phone app.

### Required env (minimum SMS + inbound)

```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...   # E.164
```

**Local:** repo-root `.env.local` (gitignored). Restart API on **3001**.  
**Production:** Cloud Run → `aibhive` → Variables → **new revision**. Keys are **not** in GitHub Actions from laptop.

### Optional (browser dialer from employee desk)

```env
TWILIO_sk_key=
TWILIO_API_SECRET=
TWILIO_TWIML_APP_SID=   # Voice URL → POST https://aibhive.com/api/employee-portal/voice/twiml
```

### Webhooks (Twilio Console → your number)

After deploy, get URLs from `GET /api/twilio/status` (once shipped) or:

- **SMS inbound:** `https://aibhive.com/api/lead-agent/twilio/inbound?businessId=macrorei&uid=<LEAD_AGENT_OWNER_UID>`
- **Voice return calls:** `https://aibhive.com/api/lead-agent/twilio/voice/inbound?businessId=macrorei&uid=<LEAD_AGENT_OWNER_UID>`
- Implementation: `server/leadAgent/inboundVoice.js` bridges to Grok PSTN line (`MACROREI_GROK_VOICE_PHONE_E164`)

### Link list to Twilio in Firestore

`POST /api/employee-portal/desk/link-twilio` sets `smsProvider: 'twilio'` on business doc (requires `smsReady` on server).

**Check:** Employee ops → Lines & Grok voice — green “Twilio SMS” pill when configured.

---

## Lead Agent (mobile APK + shared backend)

- Workspaces: `lead_agent_workspaces/{uid}/businesses/{businessId}/leads`
- Default uid: `LEAD_AGENT_OWNER_UID` or builtin — `server/leadAgent/workspaceAccess.js`
- Android app: `mobile/lead-agent/` — dialer, CSV import, Work Mode tab (`workmode.tsx`) for Grok call forwarding
- Inbound SMS Grok: `server/leadAgent/inboundHandler.js`, `grokAgent.js`
- Employee desk imports same lists as APK (`/api/employee-portal/desk/import`)

---

## MacroREI Grok voice

- `server/macroreiVoiceSession.js`, `macroreiVoiceInstructions.js`
- Browser session: `POST /api/macrorei/voice/session`
- Work mode guide: `GET /api/lead-agent/work-mode/macrorei`
- `log-interest` writes callback leads to Firestore

---

## Local dev

```powershell
cd C:\Users\AiBhive\aibhiverepo\aibhive-main-fixed
npm install
# .env.local — see LOCAL_DEV.md + Twilio section above
npm run dev:start    # :3000 Vite, :3001 API
npm run dev:check
```

- Employee local: http://127.0.0.1:3000/employee?dev=1  
- API health: http://127.0.0.1:3001/api/health  

Without `GOOGLE_APPLICATION_CREDENTIALS`, Firestore features fail; dev bypass still loads UI.

---

## Key files map

| Area | Files |
|------|--------|
| Employee desk API | `server/employeePortal/desk.js`, `routes.js`, `devAuth.js` |
| Employee desk UI | `src/components/employee-portal/EmployeeDesk.tsx`, `src/lib/employeePortalApi.ts` |
| CSV import | `src/lib/leadListImport.ts` |
| Twilio SMS send | `server/leadAgent/smsProvider.js` |
| Return-call voice | `server/leadAgent/inboundVoice.js`, `routes.js` (twilio voice inbound) |
| Twilio status (unshipped) | `server/twilioStatus.js` |
| Deploy rules | `AGENTS.md`, `docs/GIT-AND-DEPLOY.md` |

---

## What the human wanted done (backlog)

1. **Ship uncommitted Twilio linking** + verify `/api/twilio/status` on production.  
2. **Configure Twilio env on Cloud Run** (human has credits; agent cannot paste secrets — guide human or use GCP console).  
3. **Paste webhooks** in Twilio for SMS + voice return calls.  
4. **Optional:** Editable tuning (daily cap, greeting) from ops UI — needs owner write API.  
5. **Optional:** Custom SMS body from dialer textarea (today server uses `personalizeOutbound` only).  
6. **VPN app request** — declined (free VPN aggregator); offered WireGuard/Tailscale instead.

---

## Commits reference (employee floor arc)

| When (PT) | SHA | Summary |
|-----------|-----|---------|
| 2026-10-03 | `fdd522c` | Upload lists, message threads on laptop floor |
| 2026-10-04 | `9ff8a56` | Dev login bypass, Grok voice return-call bridge, import fixes |
| 2026-10-08 | `4e8d240` | Full call-center ops command center UI + desk analytics API |
| (local) | uncommitted | Twilio status route + link-twilio + UI |

---

## Agent conventions

- **Commits:** Only when human asks.  
- **Deploy:** `npm run ship` or push to `main-fixed` when asked to go live.  
- **Branch:** Fresh `cursor/<name>-c7f3` per PR; do not reuse merged branches.  
- **Lint:** `npm run lint` has many baseline errors; worry about files you change.  
- **Build:** `npm run build` must pass before ship.

---

## Verify live after deploy

1. https://github.com/codykayak/AiBhive/actions — Auto-deploy on `main-fixed`  
2. Hard refresh https://aibhive.com/employee — tab **Call center ops**  
3. https://aibhive.com/api/health  
4. After Twilio env on Cloud Run: ops → Lines → Twilio SMS green; test text from dialer
