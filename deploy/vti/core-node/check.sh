#!/usr/bin/env bash
# check.sh — the core node's health, local and public. Prints; changes nothing.
# A 200 is transport, not identity; pnm health and the admin consoles are the real checks.
probe() { printf '  %-52s %s\n' "$1${2:+ (Host: $2)}" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 ${2:+-H "Host: $2"} "$1" || echo 000)"; }
# the VTC runs in strict host mode since 19 Oct (website on join.mages.city): local probes must name a host it serves
echo "== systemd"; for u in valkey-server cloudflared vti-dids vti-mediator vti-vta vti-vtc; do printf '  %-16s %s\n' "$u" "$(systemctl is-active "$u" 2>/dev/null || echo -)"; done
echo "== local"; probe http://127.0.0.1:8534/; probe http://127.0.0.1:7037/mediator/v1; probe http://127.0.0.1:8100/health; probe http://127.0.0.1:8200/health vtc.mages.city; probe http://127.0.0.1:8200/ join.mages.city
echo "== public"; probe https://dids.mages.city/; probe https://mediator.mages.city/mediator/v1; probe https://vta.mages.city/health; probe https://vtc.mages.city/health; probe https://vtc.mages.city/v1/community/public-profile; probe https://join.mages.city/
echo "== dns"; for h in vta mediator dids vtc join; do printf '  %-20s %s\n' "$h.mages.city" "$(dig +short "$h.mages.city" 2>/dev/null | tr '\n' ' ')"; done
[ -f "$HOME/vti/BINARIES.sha256" ] && { echo "== pinned binaries"; cut -c1-12,65- "$HOME/vti/BINARIES.sha256"; }
