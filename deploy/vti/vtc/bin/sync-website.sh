#!/usr/bin/env bash
# sync-website.sh — put the community-site template on a core node and serve it on its own host.
# Run inside the node as root (on mages-core, privacymage has no passwordless sudo):
#   wsl -d mages-core -u root -- bash /mnt/c/Users/mitch/mages_city/deploy/vti/vtc/bin/sync-website.sh
# Env (template parameters): API_HOST=vtc.mages.city  SITE_HOST=join.mages.city  NODE_USER=privacymage  TUNNEL=mages-core
#
# OpenVTC rule (vtc refuses to start otherwise): a filesystem website needs its own host, distinct from the API/console
# host, so deployed content can never ride the admin session cookie. So, once:
#   vtc config.toml : routing.api.host = routing.admin_ui.host = API_HOST · routing.website.host = SITE_HOST
#                     website.root_dir · cors.allowed_origins += https://SITE_HOST         (backup: *.pre-website-<stamp>)
#   cloudflared     : ingress SITE_HOST → the vtc port, above the wildcard; DNS route on the tunnel  (backup likewise)
# Every later run only re-copies files (live mode, 5 s cache; no restart). If the VTC does not come back, the config
# is restored automatically. Passkeys keep working: the API/console stay on API_HOST, the RP ID is unchanged.
set -euo pipefail
API_HOST="${API_HOST:-vtc.mages.city}"; SITE_HOST="${SITE_HOST:-join.mages.city}"
U="${NODE_USER:-privacymage}"; TUNNEL="${TUNNEL:-mages-core}"; PORT="${VTC_PORT:-8200}"
SRC="$(cd "$(dirname "$0")/../website" && pwd)"
V=/home/$U/vti/vtc; DST=$V/website; CFG=$V/config.toml; CF=/etc/cloudflared/config.yml
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
probe() { curl -s -o /dev/null -w '%{http_code}' --max-time 8 -H "Host: $1" "http://127.0.0.1:$PORT$2"; }

echo "== files → $DST"
install -d -o "$U" -g "$U" -m 755 "$DST"
for f in index.html site.css site.js community.config.json logo.svg .vtc-website.toml; do install -o "$U" -g "$U" -m 644 "$SRC/$f" "$DST/$f"; done

if ! grep -qE '^root_dir *=' "$CFG"; then
  echo "== vtc config: dedicated website host $SITE_HOST, API/console on $API_HOST"
  cp -p "$CFG" "$CFG.pre-website-$STAMP"
  python3 - "$CFG" "$API_HOST" "$SITE_HOST" "$DST" <<'PY'
import re, sys
p, api, site, root = sys.argv[1:]
s = open(p).read()
def set_in(section, key, val):
    global s
    m = re.search(r'(?m)^\[' + re.escape(section) + r'\]\s*$', s)
    if not m: s += f'\n[{section}]\n{key} = {val}\n'; return
    end = re.search(r'(?m)^\[', s[m.end():]); end = m.end() + (end.start() if end else len(s) - m.end())
    body = s[m.end():end]
    if re.search(rf'(?m)^{key}\s*=', body): body = re.sub(rf'(?m)^{key}\s*=.*$', f'{key} = {val}', body)
    else: body = f'\n{key} = {val}' + body
    s = s[:m.end()] + body + s[end:]
set_in('routing.api', 'host', f'"{api}"')
set_in('routing.admin_ui', 'host', f'"{api}"')
set_in('routing.website', 'host', f'"{site}"')
set_in('website', 'root_dir', f'"{root}"')
m = re.search(r'(?m)^allowed_origins\s*=\s*\[(.*?)\]', s, re.S)
origins = [o.strip().strip('"') for o in (m.group(1).split(',') if m else []) if o.strip()]
if f'https://{site}' not in origins: origins.append(f'https://{site}')
set_in('cors', 'allowed_origins', '[' + ', '.join(f'"{o}"' for o in origins) + ']')
open(p, 'w').write(s)
PY
  chown "$U:$U" "$CFG"
  grep -n -E '^\[routing\.|^host *=|^root_dir|^allowed_origins' "$CFG"
  systemctl restart vti-vtc; sleep 15
  if [ "$(systemctl is-active vti-vtc)" != active ] || [ "$(probe "$API_HOST" /health)" != 200 ]; then
    echo "!! vtc did not come back; restoring $CFG.pre-website-$STAMP"
    journalctl -u vti-vtc --no-pager --since -40s | grep -iE "error" | tail -3 | cut -c1-260
    cp -p "$CFG.pre-website-$STAMP" "$CFG"; systemctl restart vti-vtc; sleep 12; systemctl is-active vti-vtc; exit 1
  fi
fi

# Extra origins that may read the public API cross-origin (e.g. the community's front reading /health for its status line).
for o in ${CORS_EXTRA:-https://mages.city}; do
  if ! grep -qE "^allowed_origins *=.*\"$o\"" "$CFG"; then
    echo "== cors: + $o"; cp -p "$CFG" "$CFG.pre-cors-$STAMP"
    sed -i -E "s#^(allowed_origins *= *\[)(.*)\]#\1\2, \"$o\"]#; s#\[, #[#" "$CFG"; grep -n '^allowed_origins' "$CFG"
    RESTART_VTC=1
  fi
done
if [ "${RESTART_VTC:-}" = 1 ]; then
  systemctl restart vti-vtc; sleep 15
  if [ "$(probe "$API_HOST" /health)" != 200 ]; then echo "!! vtc not healthy after cors change; restoring"; cp -p "$CFG.pre-cors-$STAMP" "$CFG"; systemctl restart vti-vtc; exit 1; fi
fi

if ! grep -q "hostname: $SITE_HOST" "$CF"; then
  echo "== tunnel: $SITE_HOST → :$PORT"
  cp -p "$CF" "$CF.pre-website-$STAMP"
  python3 - "$CF" "$SITE_HOST" "$PORT" "$API_HOST" <<'PY'
import sys
p, site, port, api = sys.argv[1:]
s = open(p).read()
anchor = f'  - hostname: {api}\n'
i = s.index(anchor); j = s.index('\n', s.index('service:', i)) + 1
s = s[:j] + f'  - hostname: {site}\n    service: http://127.0.0.1:{port}\n' + s[j:]
open(p, 'w').write(s)
PY
  sudo -u "$U" cloudflared tunnel route dns "$TUNNEL" "$SITE_HOST" || echo "!! DNS route not added (exists already, or cert missing)"
  systemctl restart cloudflared; sleep 6
fi

printf '  vti-vtc %s · cloudflared %s\n' "$(systemctl is-active vti-vtc)" "$(systemctl is-active cloudflared)"
printf '  %s: / %s · /community.config.json %s · /v1 %s (want 404)\n' "$SITE_HOST" "$(probe "$SITE_HOST" /)" "$(probe "$SITE_HOST" /community.config.json)" "$(probe "$SITE_HOST" /v1/community/public-profile)"
printf '  %s: /health %s · /admin/ %s · /v1/community/public-profile %s\n' "$API_HOST" "$(probe "$API_HOST" /health)" "$(probe "$API_HOST" /admin/)" "$(probe "$API_HOST" /v1/community/public-profile)"
