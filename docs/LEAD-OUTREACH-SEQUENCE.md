# Lead outreach sequence (MacroREI primary list)

## Goal

Every owner on the **primary list** (`macrorei`) gets contacted by SMS on a paced schedule. If they **never reply** after **two owner texts**, the system runs a **background relative lookup** and may text associated contacts with a polite “wrong person / trying to reach owner” message.

## Stages (per owner lead)

| Stage | Meaning |
|-------|---------|
| `new` | Not texted yet (touch 0) |
| `touch_1` | First owner SMS sent |
| `touch_2` | Second owner SMS sent |
| `awaiting_reply` | Two touches done; waiting cooldown before relative search |
| `relative_search` | Serp/Grok lookup running |
| `relative_outreach` | Texting relative contacts |
| `replied` | Owner texted back — sequence stops |
| `opted_out` | STOP / opt-out |
| `needs_human` | Lookup failed or compliance flag |

## Rules

1. **Owner touches:** max **2** (config: `outreachMaxOwnerTouches` on business, default 2).
2. **No reply:** zero **inbound** messages on the owner lead thread after touch 2.
3. **Cooldown:** default **72 hours** after touch 2 before relative search (`outreachRelativeCooldownHours`).
4. **Relative SMS:** one message per discovered contact using `relativeOutboundTemplate` (see `outboundMessage.js`).
5. **Daily cap / send window:** still enforced via `canSendOutbound` (9–18 PT, daily limit).
6. **Replies:** any inbound on the owner lead → `replied`, no relative texts.

## Automation

- **Server tick:** `POST /api/lead-agent/outreach/tick` (header `X-Cron-Secret` = `CRON_SECRET` env) processes a small batch per call.
- **Cloud Scheduler** (recommended): every 15–30 min during business hours → hit that endpoint for `businessId=macrorei`.
- **Manual:** employee desk “Text next” still works; touches update the same counters.

## Relative lookup (v1)

Requires **`SERPAPI_KEY`** on Cloud Run. Optional **`XAI_API_KEY`** to parse search snippets into `{ name, phone, relationship }`.

Results are stored on the lead as `relativeContacts[]` and mirrored as child leads (`leadRole: relative`, `parentLeadId`).

**Compliance:** Relative texting may have stricter TCPA/state rules. Default: only numbers found in public records context; honor STOP; flag `needsHuman` when lookup is uncertain.

## Env

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Protect outreach tick endpoint |
| `SERPAPI_KEY` | Relative / associate search |
| `XAI_API_KEY` | Parse search hits into contacts |
| Twilio trio | Send SMS |

## UI

Employee portal → **Automation & SMS** shows sequence settings (read-only until owner-write API exists).
