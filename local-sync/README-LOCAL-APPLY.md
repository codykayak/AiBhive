# Apply iridology changes on your PC (no GitHub)

The cloud agent cannot write to `C:\Users\...` directly. Use one of these methods on your Windows machine.

## Option A — Batch script (easiest)

1. Make sure this repo folder on your PC includes:
   - `local-sync/iridology-bundle/` (all iridology source files)
   - `scripts/Apply-Iridology-Local.bat`
2. Double-click **`scripts\Apply-Iridology-Local.bat`**
3. It copies files into `C:\Users\AiBhive\aibhiverepo\aibhive-main-fixed\aibhive-main-fixed` and runs `git commit`.

Edit the `REPO=` line in the `.bat` if your path differs.

## Option B — Git patch

From your local repo root:

```bat
cd C:\Users\AiBhive\aibhiverepo\aibhive-main-fixed\aibhive-main-fixed
git apply --ignore-whitespace C:\path\to\iridology-local.patch
git add -A
git commit -m "Add AI Iridology: camera, analysis, history, follow-up chat (local)"
```

The patch file is at the repo root: **`iridology-local.patch`**

## Option C — Manual copy

Copy everything under `local-sync/iridology-bundle/` into your repo root (merge folders), then:

```bat
git add server/iridology* src/**/Iridology* src/lib/oregonPlantMedicine/iridology* ...
git commit -m "Add AI Iridology (local)"
```

## What's included

- `/plants/iridology` page + nav
- Live iris camera + photo guide
- Grok vision analysis + in-depth report
- Saved analysis history (Firestore when online, localStorage fallback)
- Follow-up chat on each report

## Local test

1. `.env.local` with `XAI_API_KEY` (and Firebase if you want cloud history)
2. `Start-AiBhive-Plants.bat`
3. Open `http://127.0.0.1:<port>/plants/iridology`
