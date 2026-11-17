# join-fallback: the City's front door while its node rests

A Cloudflare Worker in front of `join.mages.city/*`, `vtc.mages.city/v1/trust-tasks*` and
`vtc.mages.city/v1/community/*`.

- **Node up:** every request passes straight through to the mages-core tunnel, unchanged.
- **Node down** (the tunnel answers 502–504 or 520–530, or gives no answer within 12 s):
  - the join site is served from `public/join/`, a saved copy, with a resting notice;
  - the DID QR and public profile come from `public/vtc/`;
  - wallets get an honest `trust-task-error` with code `unavailable` and a pointer to `/resting/`.
- **`/resting/`** lets a visitor leave their DID and an optional note.
  - The browser seals it to the City's holding key: RSA-OAEP 3072 wrapping an AES-GCM key.
  - The Worker stores only the ciphertext, in KV (`HELD`), for up to 120 days. It allows 5 per address per hour.
  - The private key never leaves the keeper's machine: `~/keeper_mage/keys/city-join.private.jwk`, fingerprint `38b8b7361848ccc6`.

## Why it can't hold wallets "pending"
These facts were checked on 2026-11-14 against VTC 0.11.58 and Star Key:
- **Signed documents expire fast.** The VTC accepts a signed join document only until `issuedAt + 10 min + 60 s` skew. That's a fixed constant, so a held request can't be replayed later.
- **Pending needs the City's signature.** Star Key shows "Request sent" only for a reply signed by the community DID, with `verdict.effect: refer`.
- **So the fallback can't fake pending.** It would need the City's signing key at the edge, which we won't put there.
- **What it does instead:** it holds the person's *intent* (their DID). The keeper invites them when the node is back, and the real join then runs normally, with the keeper's review.

## Deploy (the keeper)
```
npx wrangler kv namespace create HELD     # once; put the id into wrangler.jsonc
npx wrangler deploy
```
Then test it by stopping mages-core, opening join.mages.city, and starting mages-core again.

## Read held DIDs
```
node tools/read_held.mjs
```

## Refresh the saved copy
Do this when the join site changes. Re-run the snapshot (see the session notes), then copy:
- `snapshot/join` → `public/join`
- `snapshot/vtc` → `public/vtc`

`public/join/resting/` and `public/join/city-join.pub.jwk` are this Worker's own files, not part of the snapshot.
