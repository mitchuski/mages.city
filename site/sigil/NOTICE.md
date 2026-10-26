# Sigil (vendored)

Source: https://github.com/johnservil/sigil — commit 8bd993a459cd (2026-10-22).
Files: web/sigilcode.js (encoder/decoder, built from typescript/), web/fonts/* (Noto Sans Ethiopic,
Noto Sans Canadian Aboriginal, SIL OFL 1.1, see *-OFL.txt and manifest.json), vectors.json (test vectors).
Licence: Apache-2.0 (LICENSE-APACHE); the upstream repository also offers MIT.
Use here: writes 32-byte κ / Merkle roots as 26-character seals on the local spellbook page
(levers/spellbook_build.mjs). Experimental upstream; pinned, not tracked live.
