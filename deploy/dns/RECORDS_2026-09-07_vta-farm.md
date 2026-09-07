# mages.city DNS — the VTA farm records (2026-09-07)

*The records that point the City's trust hosts at the **hosted** OpenVTC VTA Farm run by
FirstPerson. This file is the record of what is in the zone; Cloudflare is the source of
truth, and FirstPerson's own setup page wins on any detail here.*

## Which profile this is

`deploy/vti/README.md` and `deploy/README.md` describe **self-hosting** the VTI stack — the
`vta-service`, `vtc-service`, DID host and DIDComm mediator running on the keeper's own host
(Caddy `reverse_proxy 127.0.0.1:8100/8200/8300`, behind a Cloudflare Tunnel; see
`../Caddyfile.example` and `../cloudflared.example.yml`). In those documents FirstPerson.dev
is named as the *reference deployment* — a shape to copy.

**As of 2026-09-07 that is not what is deployed.** The four trust hosts are CNAMEd to
FirstPerson's load balancer instead, so the stack is hosted, not self-run. The self-hosted
path stays documented and remains the fallback; nothing in `deploy/` has been deleted. Move
back to it by replacing the four CNAMEs with tunnel records.

## The records

Zone `mages.city`, managed at Cloudflare (nameservers `anna` / `kanye.ns.cloudflare.com`).

| Type | Name | Value | Proxy |
|---|---|---|---|
| TXT | `_vtafarm-challenge.mages.city` | `vtafarm-verify=59532881650e390e55c9fd6ab880c3db` | n/a |
| CNAME | `vta.mages.city` | `lb.firstperson.dev` | **DNS only** (grey cloud) |
| CNAME | `mediator.mages.city` | `lb.firstperson.dev` | **DNS only** (grey cloud) |
| CNAME | `dids.mages.city` | `lb.firstperson.dev` | **DNS only** (grey cloud) |
| CNAME | `vtc.mages.city` | `lb.firstperson.dev` | **DNS only** (grey cloud) |

**All four CNAMEs must be unproxied.** A proxied record is answered by our own zone at
Cloudflare's edge and never reaches FirstPerson — their setup page states this explicitly.
TXT records have no proxy setting.

The TXT is a one-time challenge: it is checked at verification and never again, and may be
deleted once verification succeeds.

## Status — all five records in the zone (2026-09-07)

Verified authoritatively against `anna.ns.cloudflare.com`, which bypasses resolver caching:

```
_vtafarm-challenge  TXT   -> vtafarm-verify=59532881650e390e55c9fd6ab880c3db
vta                 CNAME -> lb.firstperson.dev
mediator            CNAME -> lb.firstperson.dev
dids                CNAME -> lb.firstperson.dev
vtc                 CNAME -> lb.firstperson.dev
```

**The four CNAMEs are correctly unproxied.** This is checked, not assumed: Cloudflare
flattens a *proxied* CNAME and answers with its own anycast A records, so a nameserver that
returns the literal `lb.firstperson.dev` target proves the record is grey-cloud DNS only.

Public resolvers lag behind the zone. `1.1.1.1` still answered NO RECORD for the four names
after they existed, because the earlier NXDOMAIN was negatively cached — the "checked before
it existed, up to an hour to clear" case from FirstPerson's setup page. The zone is right;
only the caches are stale. Re-run the setup page's check after the negative TTL expires, and
if it is still pending well past an hour the cause is not this zone.

## Two things to watch

1. **`lb.firstperson.dev` does not resolve.** Checked 2026-09-07 against 1.1.1.1: no A, no
   AAAA, no CNAME. The `firstperson.dev` zone exists (Cloudflare nameservers `meg` / `nico`)
   and its apex answers, but the `lb` host has no record. Cloudflare will still let the
   CNAMEs be created, and verification may well pass on the CNAME target alone — but **no
   traffic can flow to a target that does not resolve.** If the domain verifies and the hosts
   stay dark, this is why, and it is upstream's to fix.

2. **`dids.` here versus `did.` in our own docs.** FirstPerson provisions **`dids.mages.city`**
   (plural). `deploy/vti/README.md` and the host table in `deploy/README.md` both say DID logs
   live at **`did.mages.city/<name>/did.jsonl`** (singular). `did:webvh` embeds the hostname,
   so `did:webvh:dids.mages.city:<name>` and `did:webvh:did.mages.city:<name>` are **different
   identifiers and not interchangeable.** Settle which host is canonical before any agent DID
   is minted — a DID cannot be renamed afterwards without breaking every reference to it.

## Relation to the apex

The apex and `www` are Workers custom domains for the static front (`wrangler.jsonc` →
`site/`), and are proxied. At the time of writing they still resolve to the registrar's
parked lander through Cloudflare; that record has to go when the `mages-city` Worker claims
the custom domain. The four trust hosts above are separate names and do not conflict with
the apex, nor with a `*.mages.city` wildcard — an exact record always wins over a wildcard.
