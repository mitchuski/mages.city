#!/usr/bin/env bash
# Resync the vendored Sigil (johnservil/sigil) into every copy we keep.
# Usage: bash ~/mages_city/bin/sigil-resync.sh [ref]   (default: upstream HEAD)
# Touches files only: no commit, no build, no deploy. Undo with git checkout on the paths it lists.
set -euo pipefail
export NO_COLOR=1 TERM=dumb
REF="${1:-HEAD}"
H="${HOME:-/c/Users/mitch}"
B3="$H/blake3-mage/blake3-mage"
MC="$H/mages_city"
TARGETS=(
  "$B3/levers/vendor/sigil"
  "$MC/site/sigil"
  "$MC/deploy/sigil.mages.city/public/sigil"
  "$MC/deploy/guide.mages.city/public/sigil"
  "$MC/deploy/soul.mages.city/public/sigil"
  "$MC/deploy/_home/hashsmash.mages.city/sigil"
  "$B3/deploy/hashsmash.mages.city/public/sigil"
  "$H/soulbis website/star/sigil"
  "$H/hitchhikers/hitchhikers-guide-to-trust/site/public/sigil"
  "$H/hitchhikers/iiw43-trust-graph-deck/dontpanic.mages.city/public/sigil"
)
UP="$(mktemp -d)/sigil"
git clone -q --filter=blob:none https://github.com/johnservil/sigil "$UP"
git -C "$UP" checkout -q "$REF"
SHA="$(git -C "$UP" rev-parse HEAD)"; SHORT="${SHA:0:12}"
DATE="$(git -C "$UP" log -1 --format=%cs)"
echo "upstream $SHORT ($DATE)"
OLD="$(grep -o 'commit [0-9a-f]\{12\}' "$MC/site/sigil/NOTICE.md" | cut -d' ' -f2)"
STALE=0; for T in "${TARGETS[@]}"; do [ -f "$T/sigilcode.js" ] && ! cmp -s "$UP/web/sigilcode.js" "$T/sigilcode.js" && STALE=1; done
[ "$STALE" = 0 ] && { echo "every copy already at $SHORT, nothing to do"; exit 0; }
echo "pinned   $OLD -> $SHORT"
[ "$OLD" != "$SHORT" ] && git -C "$UP" log --oneline "$OLD..$SHA" -- web/sigilcode.js web/fonts web/fonts.css vectors.json typescript 2>/dev/null | head -30 || true

for T in "${TARGETS[@]}"; do
  [ -d "$T" ] || { echo "skip (missing) $T"; continue; }
  cp "$UP/web/sigilcode.js" "$T/sigilcode.js"
  [ -f "$T/vectors.json" ]   && cp "$UP/vectors.json" "$T/vectors.json"
  [ -f "$T/LICENSE-APACHE" ] && cp "$UP/LICENSE-APACHE" "$T/LICENSE-APACHE"
  if [ -d "$T/fonts" ]; then rm -rf "$T/fonts"; cp -r "$UP/web/fonts" "$T/fonts"; fi
  [ -f "$T/NOTICE.md" ] && sed -i "s/commit [0-9a-f]\{12\} ([0-9-]*)/commit $SHORT ($DATE)/" "$T/NOTICE.md"
  echo "synced   $T"
done

# fonts.css is ours (paths differ from upstream); flag if upstream's font set changed
if [ "$OLD" != "$SHORT" ] && ! git -C "$UP" diff --quiet "$OLD" "$SHA" -- web/fonts web/fonts.css 2>/dev/null; then
  echo "NOTE: upstream fonts changed -> review our fonts.css (site/sigil/fonts.css + deploy copies, pb3 builds)"
  git -C "$UP" diff --stat "$OLD" "$SHA" -- web/fonts web/fonts.css || true
fi

echo "--- conformance (pb3_sigil_test) ---"
( cd "$B3" && node levers/pb3_sigil_test.mjs ) || echo "TEST FAILURES above: expected where v1 assumptions (26 chars, ᑭ/ᓕ swap, layout) changed; update the test with the new spec"
cat <<EOF
--- next ---
1. rebuild family sites in WSL (sites_build.py inlines vendor/sigil/sigilcode.js), refresh deploy copies
2. rebuild scrolls (mages_city bin/*-scroll.mjs, sigil-site.mjs copy site/sigil)
3. grep for seals pasted as text (letters, poems, Yukon notes)
4. deploy only on Mitch's word
EOF
