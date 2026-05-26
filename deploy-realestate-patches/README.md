# Deploy patches for codykayak/realestate

Patches are applied to `codykayak/realestate` by the AiBhive workflow **Deploy NW Investor Site**.

| Patch | What it does |
|-------|----------------|
| `0001-...` | SEO marketing pages + original homepage preserved |
| `0002-...` | Get Cash Offer → `/#offer` (Ready to Move Forward form) + scroll fix |

**Why Cloud Agents cannot `git push` to realestate:** the agent uses **cursor[bot]** (Cursor GitHub App). Your **REALESTATE_GITHUB_TOKEN** secret is only available **inside GitHub Actions** when you run that workflow — it is not passed to the agent shell.

**From your phone:** GitHub → **codykayak/AiBhive** → **Actions** → **Deploy NW Investor Site** → **Run workflow**.

**Or grant write access:** GitHub → **codykayak/realestate** → Settings → GitHub Apps → **Cursor** → allow this repository (Contents: Read & write).
