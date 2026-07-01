# AiBhive

AI-powered transcription, document processing, Hive apps, and internal tools.

## Local development

**Test changes locally before opening a PR.**

```bash
npm install
cp .env.example .env.local   # add your API keys
npm run dev:start            # frontend :3000 + backend :3001
npm run dev:check            # smoke test
```

Forward port **3000** in Cursor (or open http://127.0.0.1:3000) to use the app in your browser.

Full setup (GCP credentials, env vars, troubleshooting): **[LOCAL_DEV.md](./LOCAL_DEV.md)**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev servers (foreground) |
| `npm run dev:start` | Dev servers in tmux (background) |
| `npm run dev:check` | Health / smoke check |
| `npm run build` | Production build |
| `npm run lint` | TypeScript check |

## Deploy

Production runs on Cloud Run. Merges to `main-fixed` deploy via GitHub Actions.
