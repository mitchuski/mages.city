#!/usr/bin/env bash
# update-binaries.sh — refresh the core node's seven binaries to the current tagged release, with a rollback.
#   1. snapshot ~/vti (configs + data) and the current binaries → ~/vti/rollback/<stamp>/
#   2. stop the four units (vtc → vta → mediator → dids)
#   3. run install-binaries.sh (downloads `latest`, re-pins SHA-256, prints versions; shows the drift vs the old pin)
#   4. start the four units in order and probe local health
# Roll back: bash update-binaries.sh --rollback <stamp>   (restores binaries AND ~/vti state from that snapshot)
# Keys never leave the node; the snapshot stays in ~/vti/rollback (mode 700).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
UNITS_DOWN=(vti-vtc vti-vta vti-mediator vti-dids)
UNITS_UP=(vti-dids vti-mediator vti-vta vti-vtc)
BINS=(vta vtc pnm mediator mediator-setup did-hosting-daemon openvtc)
RB="$HOME/vti/rollback"; mkdir -p -m 700 "$RB"

health() {
  for u in "${UNITS_UP[@]}"; do printf '  %-14s %s\n' "$u" "$(systemctl is-active "$u" 2>&1)"; done
  for p in 8534/ 7037/mediator/v1/.well-known/did 8100/health 8200/health; do printf '  :%-42s HTTP %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "http://127.0.0.1:$p")"; done
}

if [ "${1:-}" = "--rollback" ]; then
  S="$RB/${2:?stamp}"; [ -d "$S" ] || { echo "no snapshot $S"; exit 1; }
  echo "== rolling back to $S"; for u in "${UNITS_DOWN[@]}"; do sudo systemctl stop "$u" || true; done
  for b in "${BINS[@]}"; do [ -f "$S/bin/$b" ] && sudo install -m 0755 "$S/bin/$b" "/usr/local/bin/$b"; done
  for d in vta vtc mediator dids; do [ -d "$S/state/$d" ] && { rm -rf "$HOME/vti/$d"; cp -a "$S/state/$d" "$HOME/vti/$d"; }; done
  [ -f "$S/BINARIES.sha256" ] && cp "$S/BINARIES.sha256" "$HOME/vti/BINARIES.sha256"
  for u in "${UNITS_UP[@]}"; do sudo systemctl start "$u"; sleep 4; done; health; exit 0
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"; S="$RB/$STAMP"; mkdir -p -m 700 "$S/bin" "$S/state"
echo "== snapshot → $S"
for b in "${BINS[@]}"; do [ -x "/usr/local/bin/$b" ] && cp "/usr/local/bin/$b" "$S/bin/$b"; done
for d in vta vtc mediator dids; do [ -d "$HOME/vti/$d" ] && cp -a "$HOME/vti/$d" "$S/state/$d"; done
[ -f "$HOME/vti/BINARIES.sha256" ] && cp "$HOME/vti/BINARIES.sha256" "$S/BINARIES.sha256"
echo "== stopping"; for u in "${UNITS_DOWN[@]}"; do sudo systemctl stop "$u" || true; done
echo "== installing current tagged release"; bash "$HERE/install-binaries.sh"
echo "== starting"; for u in "${UNITS_UP[@]}"; do sudo systemctl start "$u"; sleep 5; done
sleep 10; echo "== health"; health
echo "== if anything above is not active/200: bash $0 --rollback $STAMP"
