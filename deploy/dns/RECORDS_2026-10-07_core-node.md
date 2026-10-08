# mages.city DNS — the core-node records (planned 2026-10-07 · APPLIED 2026-10-08: tunnel `mages-core` 37513f30-14c1-4942-8dcd-578abfee497b; the four lb.firstperson.dev CNAMEs deleted; all four hosts answer 502 via Cloudflare)

Supersedes `RECORDS_2026-09-07_vta-farm.md` once applied. The four trust hosts stop pointing at the
hosted farm's load balancer (`lb.firstperson.dev`, NXDOMAIN since ≥ 2026-09-07) and become
**proxied CNAMEs to the City's own tunnel**, run on the keeper's machine (`../vti/CORE_NODE.md`).

| Type | Name | Value | Proxy | how |
|---|---|---|---|---|
| CNAME | `vta.mages.city` | `<TUNNEL-ID>.cfargotunnel.com` | **Proxied** (orange) | `cloudflared tunnel route dns mages-core vta.mages.city` |
| CNAME | `mediator.mages.city` | same | Proxied | same |
| CNAME | `dids.mages.city` | same | Proxied | same |
| CNAME | `vtc.mages.city` | same | Proxied | same |
| TXT | `_vtafarm-challenge.mages.city` | (delete) | n/a | the hosted-farm challenge; no longer needed |

Order: delete the four `lb.firstperson.dev` CNAMEs in the dashboard first (`route dns` refuses to
overwrite an existing record), then run the four `route dns` commands. The apex and `*.mages.city`
are unchanged. Proxied is correct here and was wrong for the hosted farm: the tunnel terminates TLS.
