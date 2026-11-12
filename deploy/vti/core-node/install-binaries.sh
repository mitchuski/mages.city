#!/usr/bin/env bash
# install-binaries.sh — the core node's binaries, in WSL Ubuntu. Explore stream, upstream shape:
# valkey from apt, the seven prebuilt x86-64 binaries from download.firstperson.dev into /usr/local/bin.
# Upstream publishes no checksums; we record our own SHA-256 + size into ~/vti/BINARIES.sha256 so
# a later drift is visible. Idempotent. Run as the normal user; sudo is asked for where needed.
set -euo pipefail
BASE=https://download.firstperson.dev
# CHANNEL = latest | main | nightly. `latest` froze on 15 Oct 2026 (vta 0.56 / vtc 0.11.58) while the
# tags moved on (vta 0.68 / vtc 0.16 on 30 Oct); `main` and `nightly` carry current builds, still x86-64 only.
# The node runs `main` since 5 Nov 2026 (vtc 0.24 / vta 0.76): CHANNEL=main bash update-binaries.sh
C="${CHANNEL:-latest}"
declare -A SRC=( [vta]=vta/$C/vta [vtc]=vtc/$C/vtc [pnm]=pnm-server/$C/pnm
  [mediator]=mediator/$C/mediator [mediator-setup]=mediator/$C/mediator-setup
  [did-hosting-daemon]=did-hosting-daemon/$C/did-hosting-daemon [openvtc]=openvtc/$C/openvtc )
mkdir -p "$HOME/vti/bin" && cd "$HOME/vti/bin"
echo "== valkey (the mediator's store)"
if ! command -v valkey-server >/dev/null; then sudo apt-get update -qq && sudo apt-get install -y -qq valkey-server; fi
# the openvtc client links libpcsclite (smart-card support); the minimal image lacks it
ldconfig -p | grep -q libpcsclite.so.1 || sudo apt-get install -y -qq libpcsclite1
sudo systemctl enable --now valkey-server >/dev/null 2>&1 || true
echo "== binaries"
: > "$HOME/vti/BINARIES.sha256.new"
# HOLD = binaries kept as installed (space-separated). The DID host was held on its 2 Sept build until
# Option B; that was done 20 Oct 2026 (upgraded in place, KEEPER_ACTS_2026-10-20 §6), so nothing is held
# by default now. HOLD=did-hosting-daemon keeps it where it is.
# 5 Nov 2026: the `main` mediator build (20 MB, no operator subcommands) answers the VTA 0.76's TSP envelopes
# with 400 e.m.message.tsp.malformed, so a DID publish fails; the 30 Oct nightly mediator (40 MB) speaks it.
# Both mediator binaries are held on that nightly build until a main build accepts the envelope (HOLD= to override).
HOLD="${HOLD-mediator mediator-setup}"
for b in "${!SRC[@]}"; do
  url="$BASE/${SRC[$b]}"
  if [[ " $HOLD " == *" $b "* ]] && [ -x "/usr/local/bin/$b" ]; then
    printf '%s  %s  %s  %s\n' "$(sha256sum "/usr/local/bin/$b" | cut -d' ' -f1)" "$(stat -c %s "/usr/local/bin/$b")" "$b" "held" >> "$HOME/vti/BINARIES.sha256.new"
    echo "  held: $b"; continue
  fi
  curl --proto '=https' --tlsv1.2 -fsSL -o "$b.new" "$url"
  chmod +x "$b.new"
  size=$(stat -c %s "$b.new"); sum=$(sha256sum "$b.new" | cut -d' ' -f1)
  printf '%s  %s  %s  %s\n' "$sum" "$size" "$b" "$url" >> "$HOME/vti/BINARIES.sha256.new"
  sudo install -m 0755 "$b.new" "/usr/local/bin/$b" && rm -f "$b.new"
done
if [ -f "$HOME/vti/BINARIES.sha256" ] && ! diff -q "$HOME/vti/BINARIES.sha256" "$HOME/vti/BINARIES.sha256.new" >/dev/null; then
  echo "!! binaries changed since the last install — diff:"; diff "$HOME/vti/BINARIES.sha256" "$HOME/vti/BINARIES.sha256.new" || true
fi
mv "$HOME/vti/BINARIES.sha256.new" "$HOME/vti/BINARIES.sha256"
echo "== versions"
for b in vta vtc pnm mediator mediator-setup did-hosting-daemon openvtc; do printf '  %-20s %s\n' "$b" "$("$b" --version 2>&1 | head -1 || echo '?')"; done
echo "== recorded: $HOME/vti/BINARIES.sha256"; cat "$HOME/vti/BINARIES.sha256"
