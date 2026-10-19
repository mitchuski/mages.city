#!/usr/bin/env bash
# sync-console.sh — put the City's console plugins on the core node (the workshop loop for the admin console).
#   wsl -d mages-core -u root -- bash /mnt/c/Users/mitch/mages_city/deploy/vti/vtc/bin/sync-console.sh
# Copies deploy/vti/vtc/admin-plugins/* → ~/vti/vtc/admin-plugins, writes mages-city/node.json (services, binaries,
# holds; read by the desk), and the first time only sets admin_ui.plugin_dir in the VTC config (backup beside it,
# restored automatically if the VTC does not come back). After that: edit → run → refresh the console tab.
set -euo pipefail
U="${NODE_USER:-privacymage}"; API_HOST="${API_HOST:-vtc.mages.city}"; PORT="${VTC_PORT:-8200}"
SRC="$(cd "$(dirname "$0")/../admin-plugins" && pwd)"
V=/home/$U/vti; DST=$V/vtc/admin-plugins; CFG=$V/vtc/config.toml
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
probe() { curl -s -o /dev/null -w '%{http_code}' --max-time 8 -H "Host: $API_HOST" "http://127.0.0.1:$PORT$1"; }

echo "== plugins → $DST"
install -d -o "$U" -g "$U" -m 755 "$DST"
for d in "$SRC"/*/; do
  id="$(basename "$d")"; install -d -o "$U" -g "$U" -m 755 "$DST/$id"
  for f in "$d"*; do install -o "$U" -g "$U" -m 644 "$f" "$DST/$id/"; done
  echo "  $id: $(ls "$d" | tr '\n' ' ')"
done

echo "== node.json"
python3 - "$V" "$DST/mages-city/node.json" <<'PY'
import json, subprocess, sys, datetime, os
v, out = sys.argv[1:]
svc = {}
for u in ["valkey-server", "cloudflared", "vti-dids", "vti-mediator", "vti-vta", "vti-vtc"]:
    svc[u] = subprocess.run(["systemctl", "is-active", u], capture_output=True, text=True).stdout.strip() or "unknown"
bins = []
p = os.path.join(v, "BINARIES.sha256")
if os.path.exists(p):
    for line in open(p):
        parts = line.split()
        if len(parts) >= 4: bins.append({"name": parts[2], "sha12": parts[0][:12], "held": parts[3] == "held"})
notes = []
if any(b["held"] for b in bins): notes.append("did-hosting-daemon held on its 2 Sept build until Option B (KEEPER_ACTIONS §5)")
json.dump({"checkedAt": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%MZ"), "services": svc, "binaries": bins, "notes": notes}, open(out, "w"), indent=1)
PY
chown "$U:$U" "$DST/mages-city/node.json"

if ! grep -qE '^plugin_dir *=' "$CFG"; then
  echo "== vtc config: admin_ui.plugin_dir = $DST"
  cp -p "$CFG" "$CFG.pre-plugins-$STAMP"
  sed -i -E "s#^\[admin_ui\]\$#[admin_ui]\nplugin_dir = \"$DST\"#" "$CFG"
  grep -n -A2 '^\[admin_ui\]' "$CFG"
  systemctl restart vti-vtc; sleep 15
  if [ "$(systemctl is-active vti-vtc)" != active ] || [ "$(probe /health)" != 200 ]; then
    echo "!! vtc did not come back; restoring"; journalctl -u vti-vtc --no-pager --since -40s | grep -i error | tail -2 | cut -c1-240
    cp -p "$CFG.pre-plugins-$STAMP" "$CFG"; systemctl restart vti-vtc; exit 1
  fi
fi
printf '  /health %s · /admin/plugins.json → %s\n' "$(probe /health)" "$(curl -s --max-time 8 -H "Host: $API_HOST" "http://127.0.0.1:$PORT/admin/plugins.json" | head -c 300)"
