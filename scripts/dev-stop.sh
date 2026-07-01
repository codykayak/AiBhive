#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

TMUX_CONF="/exec-daemon/tmux.portal.conf"
SESSION="aibhive-dev"

tmux_cmd() {
  if [[ -f "$TMUX_CONF" ]]; then
    tmux -f "$TMUX_CONF" "$@"
  else
    tmux "$@"
  fi
}

if tmux_cmd has-session -t "=$SESSION" 2>/dev/null; then
  tmux_cmd kill-session -t "$SESSION"
  echo "Stopped dev session '$SESSION'."
else
  echo "No dev session '$SESSION' running."
fi
