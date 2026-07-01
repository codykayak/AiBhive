#!/usr/bin/env bash
# Start AiBhive frontend (:3000) + backend (:3001) for local / Cursor sandbox testing.
set -euo pipefail
cd "$(dirname "$0")/.."

TMUX_CONF="/exec-daemon/tmux.portal.conf"
SESSION="aibhive-dev"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install Node 20+ and run: npm install"
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies…"
  npm install
fi

if [[ ! -f .env.local && ! -f .env ]]; then
  echo ""
  echo "⚠  No .env.local found. Copy .env.example → .env.local and add your keys."
  echo "   See LOCAL_DEV.md for the full setup guide."
  echo ""
fi

tmux_cmd() {
  if [[ -f "$TMUX_CONF" ]]; then
    tmux -f "$TMUX_CONF" "$@"
  else
    tmux "$@"
  fi
}

if tmux_cmd has-session -t "=$SESSION" 2>/dev/null; then
  echo "Dev session '$SESSION' already running."
  echo "  Attach:  npm run dev:attach"
  echo "  Check:   npm run dev:check"
  echo "  Stop:    npm run dev:stop"
  exit 0
fi

tmux_cmd new-session -d -s "$SESSION" -c "$PWD" -- npm run dev

echo "Started AiBhive dev stack in tmux session '$SESSION'."
echo ""
echo "  Frontend:  http://127.0.0.1:3000  (use Cursor port forward for browser)"
echo "  Backend:   http://127.0.0.1:3001  (/api proxied through Vite)"
echo ""
echo "  Attach logs:  npm run dev:attach"
echo "  Smoke test:   npm run dev:check"
echo "  Stop:         npm run dev:stop"
