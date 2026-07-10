# AiBhive Diagnose — how to preview (simple)

This is a **phone app**. The web preview is only for a quick look.

## See the app (2 minutes)

1. In the terminal, run:
   ```bash
   cd aibhive-diagnose
   npm run dev:start
   ```
   Wait until you see: `Accepting connections at http://0.0.0.0:8082`

2. In Cursor, open the **Ports** tab (near Terminal).
3. Find port **8082** → click **Open in Browser** (globe / browser icon).
   - Prefer your real Chrome/Edge window, not a tiny embedded preview.
4. You should see **TradeForge Diagnose** with an orange **Voice Chat** button.

## If you still see a black screen

1. Hard refresh: `Ctrl+Shift+R` (Mac: `Cmd+Shift+R`).
2. Confirm Ports shows **8082**, not a random number like 41907.
3. Stop the old server (`Ctrl+C` in that terminal) and run `npm run dev:start` again.
4. Open **8082** in a normal browser window again.

## Optional: play the video intro

Add `?intro=1` to the URL, e.g. `http://localhost:8082/?intro=1`

## Cloud Run note

Merging this app does **not** put it on Google Cloud Run. Cloud Run is for the website (`aibhive.com`). Diagnose is a separate mobile package until we wire EAS/APK deploy.
