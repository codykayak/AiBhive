# AiBhive Diagnose — how to preview

## Important

Those `Web Bundled` / `Require cycle` logs mean **Metro** (`expo start`) is running.
In Cursor that often shows a **black screen**. Use the static preview instead.

## Correct way (copy/paste)

```bash
cd aibhive-diagnose
# Stop anything old first (Ctrl+C in other terminals), then:
npm run dev:start
```

Wait for:

```
Open:  http://localhost:8082
```

Then in Cursor: **Ports** → **8082** → **Open in Browser** → hard refresh (`Ctrl+Shift+R`).

You should see orange **TradeForge** and a big orange **Voice Chat** button.

## Do not run these for web preview

- `npx expo start`
- `npm start` used to start Metro — it now starts the static preview
- `npm run dev:metro` (only if you know you want Metro)

## Require cycle warning

Fixed in the latest code (`lib/localReply.ts`). If you still see it, you’re on an old Metro process — stop it and use `npm run dev:start`.
