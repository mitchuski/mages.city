#!/usr/bin/env bash
# install-binaries.sh — the core node's binaries, in WSL Ubuntu. Explore stream, upstream shape:
# valkey from apt, the seven prebuilt x86-64 binaries from download.firstperson.dev into /usr/local/bin.
# Upstream publishes no checksums; we record our own SHA-256 + size into ~/vti/BINARIES.sha256 so
# a later drift is visible. Idempotent. Run as the normal user; sudo is asked for where needed.
set -euo pipefail
BASE=https://download.firstperson.dev
declare -A SRC=( [vta]=vta/latest/vta [vtc]=vtc/latest/vtc [pnm]=pnm-server/latest/pnm
  [mediator]=mediator/latest/mediator [mediator-setup]=mediator/latest/mediator-setup
  [did-hosting-daemon]=did-hosting-daemon/latest/did-hosting-daemon [openvtc]=openvtc/latest/openvtc )
mkdir -p "$HOME/vti/bin" && cd "$HOME/vti/bin"
echo "== valkey (the mediator's store)"
if ! command -v valkey-server >/dev/null; then sudo apt-get update -qq && sudo apt-get install -y -qq valkey-server; fi
# the openvtc client links libpcsclite (smart-card support); the minimal image lacks it
ldconfig -p | grep -q libpcsclite.so.1 || sudo apt-get install -y -qq libpcsclite1
sudo systemctl enable --now valkey-server >/dev/null 2>&1 || true
echo "== binaries"
: > "$HOME/vti/BINARIES.sha256.new"
for b in "${!SRC[@]}"; do
  url="$BASE/${SRC[$b]}"
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
