#!/usr/bin/env bash
# migrate-config.sh — carry the node's configs across the 8 Oct 2026 tagged release (vta 0.23.4 → 0.56.0 era).
# Three edits, idempotent, each config backed up beside itself as *.pre-migrate-<stamp>:
#   vta/config.toml  · `trust_xff = false`  → `trust_xff_cidrs = ["127.0.0.1/32"]`   (the retired key is REFUSED by the new build;
#   vtc/config.toml  · same                                                           cloudflared on this box is the one proxy)
#   dids/config.toml · `[secrets]` gains `backend = "plaintext"` and `confirm_plaintext = true`
#                      (the new daemon refuses to guess a store, and refuses plaintext without the acknowledgement;
#                       the OS keyring is not compiled into the prebuilt)
# Then the four units restart in order and local health is probed. Rollback stays: update-binaries.sh --rollback <stamp>.
set -euo pipefail
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"; V="$HOME/vti"
bk() { cp -p "$1" "$1.pre-migrate-$STAMP"; }

xff() { # $1 = config file
  if grep -qE '^trust_xff *= *(true|false)' "$1"; then
    bk "$1"; sed -i -E 's#^trust_xff *= *(true|false).*#trust_xff_cidrs = ["127.0.0.1/32"]#' "$1"; echo "  trust_xff → trust_xff_cidrs"
  else echo "  already migrated"; fi
}
echo "== vta"; xff "$V/vta/config.toml"
echo "== vtc"; xff "$V/vtc/config.toml"

echo "== dids"; f="$V/dids/config.toml"
if ! grep -q '^\[secrets\]' "$f"; then bk "$f"; printf '\n[secrets]\n' >> "$f"; echo "  [secrets] added"; fi
if ! grep -qE '^backend *=' "$f"; then bk "$f"; sed -i -E 's#^\[secrets\]$#[secrets]\nbackend = "plaintext"#' "$f"; echo '  backend = "plaintext"'; else echo "  backend already set"; fi
if ! grep -qE '^confirm_plaintext *=' "$f"; then bk "$f"; sed -i -E 's#^backend = "plaintext"$#backend = "plaintext"\nconfirm_plaintext = true#' "$f"; echo "  confirm_plaintext = true"; else echo "  confirm_plaintext already set"; fi

echo "== restart"; for u in vti-vtc vti-vta vti-mediator vti-dids; do sudo systemctl stop "$u" || true; done
for u in vti-dids vti-mediator vti-vta vti-vtc; do sudo systemctl start "$u"; sleep 8; done
sleep 15; echo "== health"
for u in vti-dids vti-mediator vti-vta vti-vtc; do printf '  %-14s %s\n' "$u" "$(systemctl is-active "$u" 2>&1)"; done
for p in 8534/ 7037/mediator/v1/.well-known/did 8100/health 8200/health; do printf '  :%-42s HTTP %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "http://127.0.0.1:$p")"; done
echo "== last errors, if any"; for u in vti-dids vti-mediator vti-vta vti-vtc; do journalctl -u "$u" --no-pager --since "-2min" 2>&1 | grep -iE "error|refus|failed to parse" | tail -2 | cut -c1-200; done
