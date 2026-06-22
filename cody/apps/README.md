# Hive web-app delivery channel

When a Hive build's triage decides `target: "web_app"`, the build agent
generates a static site under:

```
cody/apps/<owner>/<slug>/
```

…and appends an entry to `cody/apps/index.json`:

```json
{
  "apps": [
    {
      "owner": "shared",
      "slug": "lead-form",
      "title": "Lead form",
      "summary": "Capture leads, send to Stripe checkout.",
      "taskId": "hive_..."
    }
  ]
}
```

## How it ships to users

1. The Cursor agent commits both the app folder and the registry update on a
   `cursor/hive-<slug>-<short>` branch.
2. The Hive server auto-merges the PR.
3. The push-to-main-fixed workflow (`.github/workflows/auto-deploy.yml`) runs
   `vite build` for each registered app and uploads the result to Firebase
   Hosting / Cloud Storage. The Cloud Run server proxies
   `https://aibhive.com/u/<owner>/<slug>/` to the built bundle (see
   `server/index.js` — `/u/:owner/:slug/*` route).

For first-version delivery, builds can ship as a single `index.html` (with
inline JS/CSS) and the server will serve them straight from
`dist/cody/apps/<owner>/<slug>/index.html`. The full Vite build is reserved
for builds that need bundling.

## Local development

```bash
cd cody
npm install
npm run dev          # static playground
```

Production build is invoked from the repo root with:

```bash
npm run build        # runs vite build + cody build
```

## Owner namespacing

`owner` is the Hive user id (Firebase uid or anonymous device id). Anonymous
builds use `owner: "shared"`. We do not expose anonymous ids in URLs, and the
URL path is the only place the owner appears in plaintext, so:

- Encourage signed-in users for shareable web apps (they get pretty paths
  like `/u/jane123/lead-form/`).
- Anonymous builds collapse into `/u/shared/<slug>/`.
