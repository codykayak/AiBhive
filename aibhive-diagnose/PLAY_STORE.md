# AiBhive Pros — Google Play Store

**Package:** `com.aibhive.diagnose`  
**Display name:** AiBhive Pros  
**Privacy policy (required):** https://aibhive.com/privacy-policy.html  
**Terms of service:** https://aibhive.com/terms-of-service.html  
**Support email:** support@aibhive.com

## In-app legal links

- **Account tab** — Privacy Policy, Terms of Service, support email (`components/LegalLinks.tsx`)
- **Diagnose welcome** — AI / field-work disclaimer in first assistant message
- **Website** — Footer, About/Contact, Pros “Get the app” CTA, Diagnose web Account

## Data safety (Play Console)

Declare collection consistent with the privacy policy:

| Data type | Collected | Purpose |
|-----------|-----------|---------|
| Email, name (optional) | If user signs in | Account, team features |
| Photos / camera | When user captures equipment | AI diagnosis |
| Audio / microphone | When user uses voice input | Speech-to-text, hands-free diagnose |
| Approximate / precise location | When user enables location on a job | Job site context, optional tips |
| App interactions, diagnostics | Yes | Service improvement, support |
| Crash logs | If enabled by OS | Stability |

**Not sold** to third parties. **Encrypted in transit.** Users can request deletion via support@aibhive.com.

**AI disclaimer:** Outputs are assistive only — not a substitute for licensed professional judgment, code compliance, or safety procedures.

## Store listing copy

Pre-written files in `store/android/en-US/`:

- `title.txt` — 30 char max
- `short-description.txt` — 80 char max  
- `full-description.txt` — long description + disclaimer footer

## Graphics (you provide)

| Asset | Size |
|-------|------|
| App icon | 512×512 PNG (use `assets/icon.png` upscaled) |
| Feature graphic | 1024×500 |
| Phone screenshots | 2+ (Diagnose chat, Library, Account with legal links) |

## Build AAB for Play

```bash
cd aibhive-diagnose
npm install
npx eas-cli login   # once
npm run build:android:production   # or: npx eas build --platform android --profile production
```

Download the `.aab` from the EAS build page.

## Submit to internal testing

```bash
npx eas submit --platform android --profile production --latest
```

Or upload the AAB manually in Play Console → Testing → Internal testing.

## Play Console checklist

- [ ] Create app (or open existing) — package `com.aibhive.diagnose`
- [ ] Store listing — paste text from `store/android/en-US/`
- [ ] Graphics — icon, feature graphic, screenshots
- [ ] Privacy policy URL: https://aibhive.com/privacy-policy.html
- [ ] App access — note if login required for team features (anonymous diagnose available)
- [ ] Ads — No
- [ ] Content rating — IARC questionnaire (utility / professional tool)
- [ ] Target audience — 18+ recommended (professional field work)
- [ ] Data safety — match table above
- [ ] Upload AAB to internal testing
- [ ] Add testers, verify install, promote when ready

## Versioning

Bump in `app.json` before each Play upload:

- `expo.version` — user-facing (e.g. `1.2.0`)
- `expo.android.versionCode` — integer, must increase every upload (e.g. `13`)
