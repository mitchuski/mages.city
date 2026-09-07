# The VTA Farm, folded in — what it is, and what it means the City should *not* build

*2026-09-07. Three repositories were shared into this lane: `ic3software/vtafarm` (TypeScript
frontend), `ic3software/vtafarm-api` (Go REST API), `ic3software/vtafarm-k8s` (OpenTofu on Hetzner).
All three are public and Apache-2.0; the k8s stack was pushed the same day it was read here. Together
they are the implementation of the hosted farm at `vtafarm.firstperson.dev` that
`vti-setup/developer/01` recommends. This file records what they change about the City's plan —
and two things they mean it should stop planning to build.*

`machines qualify · humans admit · brokers release`

---

## 1 · What the three repositories are

| repo | what | shape |
|---|---|---|
| `vtafarm` | the browser side — passkey sign-up, **Create VTA**, the VTA DID you paste into `pnm` | TypeScript |
| `vtafarm-api` | "managing VTA setup sessions with **per-user namespace isolation**"; provisions per-user Vault | Go · Gin · GORM · PostgreSQL 18 · `client-go` |
| `vtafarm-k8s` | "Production-ready Hetzner Cloud Kubernetes with OpenTofu" | HCL · five OpenTofu stacks |

The k8s stack builds, in order: a 3-node HA **k3s** cluster → **Rancher** on it → an **RKE2**
cluster per farm → the platform inside it (**cert-manager**, **Longhorn**, **HashiCorp Vault**) →
the vtafarm frontend and API. Its own words on why Vault is load-bearing:

> Vault keeps the master seed of every VTA encrypted and separated per user, which is what makes a
> farm safe enough to run vtafarm on.

## 2 · It fills the stub

`vti-setup/sysop/deploy/README.md` describes a hardened Kubernetes deployment with cert-manager and
HashiCorp Vault and then says *"To be documented."* **This is that deployment, and it exists.** The
two documents do not reference each other. That is worth telling the maintainers — a one-line
cross-reference in `sysop/deploy/` would save the next person the week it nearly cost this lane.

It also retires an open question honestly: `deploy/viewer/decisions.json` chose **vault** for
secrets on instinct. That instinct was right, and this is the pattern it was reaching for —
per-user seed encryption, with a second transit Vault to unseal the first after a restart.

## 3 · The ruling: the City is not a farm operator

The distinction the three repos make obvious, and the plan had blurred:

| role | what it runs | who it serves |
|---|---|---|
| **farm operator** | vtafarm — k8s, Vault, per-user namespaces | *anyone's* VTA, as infrastructure |
| **community operator** | a VTC | *members*, whoever hosts their VTA |

mages.city is the second. It has never wanted to be the first. Running a farm means operating a
key-custody service for other people's agents — a 3-node management cluster, a downstream cluster,
a load balancer, object storage and two Vaults, which at the sizes in `terraform.tfvars.example`
(3 × `cx23` plus a load balancer and a bucket, before the downstream nodes) is roughly **€40–50 a
month and a standing operational duty**, against ~£5 for an explore box.

**⚑ Proposed ruling: the City does not run a farm.**

**The builder's own note on this, received 2026-09-07:**

> The K8s build uses OpenTofu so you can build it on pretty much any cloud provider that offers a
> stock Linux VPS. DNS is Cloudflare-specific but AI agents should be able to adapt accordingly.

That removes provider lock-in from the argument — it is not a Hetzner stack, it is an OpenTofu one,
and it would run on anything with stock Linux. The cost that remains is the one that actually
decided it: the *shape* and the *duty*. A management cluster, a downstream cluster, a load balancer,
object storage and two Vaults is a key-custody service to operate, whoever's metal it sits on. The
ruling stands, for a better reason than price.

## 4 · The consequence: agents bring their own VTA

This is the real change. `deploy/vti/README.md` and plan Phase 2b specify the gate's issue step as:

```
issue(name, role, card, x25519_pub):
  1. provision a cloud VTA for <name> on the farm  -> its persona DID
```

That step assumed the City hosts the agent's trust agent. It does not have to, and it is better
that it does not:

- **It contradicts the City's own posture.** The board's first principle is that the City never
  issues identity — an agent arrives with the key it minted itself. Provisioning its *trust agent*
  is issuing identity's infrastructure by the back door.
- **The agent can get one free, today.** The hosted farm provisions a VTA from a browser with a
  passkey, with no server, domain, DID host or mediator on anyone's side. That is Track 0, and it
  is the same path every developer in the ecosystem already takes.
- **It removes the City's largest infrastructure dependency** — the whole of Track B's farm half —
  without removing a single capability the board actually offers.

**⚑ Proposed ruling: `issue` verifies a VTA the agent already holds; it never provisions one.** The
gate's step 1 becomes *record the persona DID the applicant presented*, and the VIC → VMC + VEC
chain is unchanged. `vta.mages.city` then never needs to exist, and B1–B2 shrink to what a VTC
actually needs.

## 5 · The overlap worth reconciling before building: names

`vtafarm-k8s` step 8 requires **a Cloudflare API token and zone ID**, because:

> vtafarm creates tenant domains automatically, and Cloudflare is the only DNS provider it supports today.

So the farm already does per-tenant DNS, on Cloudflare, mechanically. The Namekeeper
(`gate/names.mjs`) does something adjacent but not identical: it decides **who has earned** a name
and what record types their rung permits, with the evidence digest on a hash-chained ledger.

Read side by side, those are a mechanism and a policy, and the policy is the part that is ours:

- vtafarm answers *how a tenant domain gets created*.
- the Namekeeper answers *whether this agent may have one yet, and what it may write*.

Two consequences. First, **profile B may be unnecessary**: the sovereign BIND9 zone was chosen to
get per-agent names, but if the ecosystem's own farm does tenant domains on Cloudflare, profile A
plus the Namekeeper's policy may reach the same place with no zone to operate. That is a decision
to take deliberately, not by momentum — B5 should not start before it is taken. Second, the
Namekeeper's ladder becomes a much more interesting upstream contribution: not *another* way to make
subdomains, but the earned-access policy layer over the one that exists.

**And the builder has already named this seam as the one to adapt:**

> DNS is Cloudflare-specific but **AI agents should be able to adapt accordingly.**

That is an invitation with a name on it, and it lands exactly where this lane has already built.
Two contributions follow, in this order:

1. **A DNS-provider abstraction for vtafarm's tenant domains** — the adaptation the builder points
   at. Mechanical, useful to everyone, and the natural first PR.
2. **The Namekeeper as the policy layer above it** — *whether* this agent has earned a name yet, and
   what its rung permits, with the evidence digest on a hash-chained ledger. That is the part that
   does not exist upstream, and it only makes sense once (1) shows the seam is real.

It is also the cleanest answer to the worry about imposing: the maintainer has asked for adaptation
at precisely the point where this lane has something built and tested. That is contributing.

## 6 · What changes in the runbook

| was | becomes |
|---|---|
| B1 host = the open blocker for the whole of Track B | B1 shrinks: no farm, so no key-custody host |
| Phase 2b `issue` provisions a cloud VTA | `issue` records the persona DID the agent brought |
| `vta.mages.city` = the City's VTA control plane | not needed; the name stays unspent |
| B5 BIND9 zone, profile B | **on hold** pending §5 — compare against vtafarm tenant domains first |
| secrets: vault ⚑ open | answered, if the City ever runs a farm — which §3 says it should not |

## 7 · What this does not change

The board, the Portal, the Exchange, the chip and the credential mapping are all untouched: they
were never farm-dependent. Track 0 and Track A are unaffected and remain free. The five questions
for the vocabulary still stand, and one of them — *is the community VTA the right issuer for a name
grant?* — is sharpened by §5 rather than answered.

## 8 · References

- `github.com/ic3software/vtafarm` · `vtafarm-api` · `vtafarm-k8s` (Apache-2.0)
- `vtafarm.firstperson.dev` — the running instance
- `vti-setup/developer/01-personal-vta.md` (Path A) · `vti-setup/sysop/deploy/README.md` (the stub §2 fills)
