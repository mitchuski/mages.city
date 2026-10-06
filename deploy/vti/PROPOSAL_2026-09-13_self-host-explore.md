# Proposal · self-host the City's four trust hosts (Option A) · 2026-09-13

*Status: PROPOSED, nothing run. This replaces the hosted-farm CNAMEs (see
`../dns/RECORDS_2026-09-07_vta-farm.md`) with our own box running the four OpenVTC
"explore" services under `mages.city`. It is NOT a farm for other people's agents;
`../../docs/VTAFARM.md` §3 rules that out and this proposal does not reopen it.
Every ⚑ is a decision for the keeper. Every 🔑 is a secret only the keeper sees.*

`machines qualify · humans admit · brokers release`

---

## 0 · Why now, in three lines

- The hosted farm's CNAME target `lb.firstperson.dev` has had no DNS record since at least
  2026-09-07 (re-checked 2026-09-13 at its authoritative nameservers). Our zone is correct;
  the four hosts stay dark until FirstPerson publishes it.
- Upstream documents exactly one self-host path: `vti-setup/sysop/explore/` (01 server
  setup + 02 walkthrough), tested on Ubuntu 26.04, 2 vCPU / 4 GB, nginx + Let's Encrypt.
  Pre-built Linux x86-64 binaries for all six tools are served from
  `download.firstperson.dev` (checked 2026-09-13: all HTTP 200, built 2026-09-02, tag
  `VTI-Dogwood`). No compiling.
- Cloudflare stays what it is: the DNS zone and the apex Worker. Cloudflare sells no VPS;
  Cloudflare Containers have ephemeral disk and HTTP-only ingress via a Worker, so they
  cannot hold a VTA's seed store.

## 1 · What gets built

| host | service | port on box | public URL | DID it serves |
|---|---|---|---|---|
| `dids.mages.city` | did-hosting-daemon 0.8.3 | 8534 | `https://dids.mages.city` | `did:webvh:…:dids.mages.city` (+ `/vta`, `/mediator`, `/vtc` logs) |
| `mediator.mages.city` | Affinidi mediator 0.20.2 | 7037 | `https://mediator.mages.city/mediator/v1` (+ `/ws`) | `did:webvh:…:dids.mages.city:mediator` |
| `vta.mages.city` | vta-service 0.23.2 | 8100 | `https://vta.mages.city` | `did:webvh:…:dids.mages.city:vta` |
| `vtc.mages.city` | vtc-service 0.11.58 | 8200 | `https://vtc.mages.city` (+ `/admin`) | `did:webvh:…:dids.mages.city:vtc` |

Plus on the same box: Valkey (the mediator's store), nginx (TLS termination, one vhost per
name), certbot, UFW (22/80/443 only). Versions are the ones the upstream walkthrough says it
verified together. `dids.` is plural, settled 2026-09-07; a DID cannot be renamed later.

## 2 · Decisions before anything is created ⚑

| # | decision | recommendation | why |
|---|---|---|---|
| D1 | **Host** | Hetzner Cloud **CX23** (2 vCPU, 4 GB, 40 GB NVMe), Ubuntu 26.04, Nuremberg or Falkenstein | Exactly the guide's shape and the farm builders' own provider. amd64, so the pre-built binaries just run. |
| D1-alt | Pi at home | **not mitch-pi** (2 GB model, already the City's edge + fedwiki farm). Pi 5 only after adding disk; needs a Cloudflare Tunnel instead of certbot, and arm64 binaries are not published so it would compile from source. | Recorded so it is a considered no, not an oversight. |
| D2 | **Explore-stream caveat** | Accept for the town-scale first deployment | Upstream: *"Explore stream — do not use for real keys. The box runs everything as root in /root/<svc>/ with no isolation."* The hardened Kubernetes "deploy stream" is *"not yet documented."* Mitigations in §7. The VTA DID is portable by default, so the VTA can move to a hardened host later without changing its DID. |
| D3 | **Hardened VTA config** | `n` (guide default) for the first run; revisit in §7 | `y` encrypts the fjall store but adds a passphrase to hold and to supply on every restart. |
| D4 | **Mediator key storage** | Local file, plaintext (guide default) for the first run | Same trade-off as D3. The passphrase variant needs `MEDIATOR_FILE_BACKEND_PASSPHRASE` exported before every start. |
| D5 | **VTA name** | `mages.city` (shown in `pnm` and in the summary) | Free text, cosmetic. |
| D6 | **Who runs the wizards** | The keeper, over SSH, in two terminal windows | The wizards mint the mnemonic and the admin keys. The agent writes runbooks and units; it does not sit in the SSH session. |
| D7 | **Hetzner backups add-on** | on (+20 % of server price) | Cheapest possible daily image of the whole box; not a substitute for the offline mnemonic. |

## 3 · Required information and things to have ready

**Before the box exists**

| item | have? | where from |
|---|---|---|
| `mages.city` on Cloudflare, zone edit rights | ✅ | Cloudflare dashboard (anna/kanye nameservers) |
| Hetzner Cloud account with a payment method | ⚑ | console.hetzner.cloud (identity check on first signup can take a little while) |
| SSH key pair on this PC | ✅ `~/.ssh/id_ed25519.pub` (2026-08-06) | upload that public key to the Hetzner project before creating the server; not the `pqc_signing` key |
| An email for Let's Encrypt expiry notices | ⚑ | any mailbox you read |
| A password-manager entry named "mages.city VTI" | ⚑ | it will hold the 🔑 items below |
| A browser with passkeys (Windows Hello or a phone) | ✅ | two passkeys get created: DID-host admin, VTC admin |

**Produced during the walkthrough — save each as it appears** (IDs match the upstream walkthrough)

| id | what | used in |
|---|---|---|
| 🔑 1a | VTA **24-word mnemonic** | recovery only; never on the box, never in the repo |
| 1b | VTA DID | steps 2, 3, 5 |
| 1c | Mediator DID | step 4 |
| 3a | SHA-256 digest of the mediator bundle | step 3 out-of-band check |
| 🔑 4a | DID-host admin `did:key` **and its private key** (shown once) | step 4, enrolment, re-invites |
| 4b | SHA-256 digest of the DID-host bundle | step 4 phase 2 |
| 4c | DID-host DID | registering the host with the VTA |
| 🔑 5 | VTC install URL (15-min TTL) + **claim code** | claiming the VTC admin |
| 🔑 D3/D4 | passphrases, if you chose them | every restart |

## 4 · Costs

Prices as quoted on 2026-09-13, excluding VAT. Hetzner raised CX-line prices twice in 2026,
so check the order page; existing contracts keep their price.

| item | monthly | notes |
|---|---|---|
| Hetzner CX23 | €5.49 | 2 vCPU · 4 GB · 40 GB NVMe · 20 TB traffic · DE/FI locations only |
| Primary IPv4 | €0.50 | billed whether or not the server runs |
| Backups add-on (D7) | €1.10 | 20 % of the server price; optional |
| Cloudflare DNS + apex Worker | €0 | already on the free plan |
| Let's Encrypt certificates | €0 | issued by the setup script, auto-renewed |
| Domain | €0 extra | already owned |
| **Total** | **€5.99 without backups · €7.09 with** | ≈ £5.20 · £6.10 before VAT; add VAT at your rate |

One-off costs: none. Time: about two evenings (§5), most of the first one unattended.

Sources: [Hetzner CX23 pricing](https://comparedge.com/tools/hetzner/pricing),
[2026 price increases](https://northflank.com/blog/hetzner-cloud-server-price-increases),
[IPv4 and backup add-on](https://onedollarvps.com/pricing/hetzner-cloud-pricing),
[Cloudflare Containers platform details](https://developers.cloudflare.com/containers/platform-details/).

## 5 · Steps

Times are estimates. **K** = keeper does it, **A** = agent can do it, **K+A** = keeper drives,
agent prepares.

### Phase 0 · Create the box — K · 15 min

1. Hetzner Cloud → new project `mages-city` → SSH keys → add your public key.
2. Servers → Add server: location Nuremberg or Falkenstein · image **Ubuntu 26.04** · type
   **CX23** (shared vCPU, x86) · networking: IPv4 ✅ IPv6 ✅ · SSH key ✅ · backups per D7 ·
   name `vti-1`.
3. Note the **public IPv4**. First login: `ssh root@<IP>`.

### Phase 1 · DNS — A (or K) · 5 min

In the `mages.city` zone, **edit** the four existing CNAMEs into A records; do not add new names.

| type | name | content | proxy |
|---|---|---|---|
| A | `vta` | `<IP>` | **DNS only** |
| A | `mediator` | `<IP>` | **DNS only** |
| A | `dids` | `<IP>` | **DNS only** |
| A | `vtc` | `<IP>` | **DNS only** |

Grey cloud is mandatory: certbot needs port 80 reached directly. Leave the apex and `www`
Worker records alone. The `_vtafarm-challenge` TXT can be deleted or left; it is inert.
Verify before Phase 2: `Resolve-DnsName vta.mages.city -Server 1.1.1.1` must return the IP.

### Phase 2 · Prepare the server — K · 30–45 min, mostly unattended

Run the script **from a file**, not piped, so any dialog can still read the keyboard:

```bash
ssh root@<IP>
curl -sSLO https://raw.githubusercontent.com/OpenVTC/vti-setup/main/scripts/setup-explore.sh
bash setup-explore.sh mages.city <your-email>
```

It updates the OS, installs build deps + Valkey, sets UFW (22/80/443), installs Rust,
nginx and certbot, writes the four vhosts, issues one certificate for all four names, then
probes each URL. **Expected result: all four HTTPS URLs answer 502** (nothing behind nginx
yet). Then log out and back in so PATH picks up cargo. Re-running is safe, but Let's Encrypt
allows five duplicate certificates a week, so do not loop on it.

### Phase 3 · Install the six binaries — K · 5 min

Pre-built, tag `VTI-Dogwood` (built 2026-09-02). This is upstream's "Option A: recommended":

```bash
cd /tmp
for p in vta/latest/vta vtc/latest/vtc pnm-server/latest/pnm mediator/latest/mediator \
         mediator/latest/mediator-setup did-hosting-daemon/latest/did-hosting-daemon; do
  curl -fO "https://download.firstperson.dev/$p"
done
chmod +x vta vtc pnm mediator mediator-setup did-hosting-daemon
mv vta vtc pnm mediator mediator-setup did-hosting-daemon /usr/local/bin/
vta --version; vtc --version; pnm --version; mediator --version; did-hosting-daemon --version
```

`pnm-server` is deliberate: the server build keeps secrets in config rather than an OS
keyring a headless host does not have. Fallback if the download host is ever down: the
`cargo install --path …` lines in `01-server-setup.md` §5 Option B (15–40 min of compiling).

### Phase 4 · The walkthrough — K, two SSH windows · 60–90 min

Follow `vti-setup/sysop/explore/02-walkthrough.md` prompt by prompt. The values specific to
us, in order:

| step | command | our values / the moment that matters |
|---|---|---|
| 1 VTA | `mkdir ~/vta && cd ~/vta && vta setup` | name = D5 · services: all three incl. TSP · REST URL `https://vta.mages.city` · mediator: **create new did:webvh**, URL `https://mediator.mages.city/mediator/v1`, DID URL `https://dids.mages.city/mediator` · VTA DID: **create new did:webvh**, URL `https://dids.mages.city/vta`, portable = yes · **🔑 1a mnemonic appears here** → save, confirm `y` · save 1b, 1c from the summary |
| 2 PNM | `cd ~/vta && pnm setup` | "Connect to an existing non-TEE VTA" · paste 1b · run the printed `vta import-did --did did:key:… --role admin` in `~/vta` |
| 3 Mediator | `mkdir ~/mediator && cd ~/mediator && mediator-setup` | headless · key storage per D4 · "Pick up pre-provisioned mediator (offline export)", context `mediator` · **window 2:** `mv ~/mediator/bootstrap-request.json ~/vta && cd ~/vta && vta contexts reprovision --id mediator --recipient bootstrap-request.json --out bundle.armor` → save 3a → `mv ~/vta/bundle.armor ~/mediator/` · **window 1:** path `/root/mediator/bundle.armor`, paste 3a · protocols TSP + DIDComm v2 · **No SSL (TLS-terminating proxy)** · fresh JWT key · open network · CORS any · **Redis** at `redis://127.0.0.1/` · new admin did:key · write `conf/mediator.toml` |
| 4 DID host | `mkdir ~/dids && cd ~/dids && did-hosting-daemon setup` | **Offline phase 1** · public URL `https://dids.mages.city` · path `.well-known` · context `webvh` · mediator DID = 1c · transport both · plaintext secrets `y` (type it) · **generate operator did:key → 🔑 4a (DID + private key, shown once)** · **window 2:** `mv ~/dids/bootstrap-request.json ~/vta/ && cd ~/vta && vta contexts create --id webvh --admin-expires 1h --admin-did <4a>` then `vta bootstrap provision-integration --request bootstrap-request.json --out bundle.armor` → save 4b → `mv ~/vta/bundle.armor ~/dids/` · **window 1:** `did-hosting-daemon setup` again → **Offline phase 2**, bundle `/root/dids/bundle.armor`, digest 4b → save 4c |
| 4 cont. | `did-hosting-daemon invite --role admin --did <4a>` then `nohup did-hosting-daemon > log.txt 2>&1 &` | open the **single-use** enrol URL in a browser, save the passkey · at `https://dids.mages.city/dids` add `mediator` and `vta`, pasting `~/vta/mediator-did.jsonl` and `~/vta/VTA-did.jsonl` |
| start | `cd ~/mediator && nohup mediator > log.txt 2>&1 &` · wait 60 s · `cd ~/vta && nohup vta > log.txt 2>&1 &` | export the D4 passphrase first if you chose one |
| register | `cd ~/vta && pnm did-mgmt servers add --id did-hosting-daemon --did <4c>` · `pnm health` | health must pass before step 5 |
| 5 VTC | `mkdir ~/vtc && cd ~/vtc && vtc setup` | base URL `https://vtc.mages.city` · VTA DID 1b · context `default` · **pause:** in window 2 run the printed `pnm contexts create --id default --name "VTC" --admin-did did:key:… --admin-expires 1h` · confirm `y` · publish via did-hosting-daemon, path `vtc` · seed in config file · **🔑 5 install URL + claim code** · `nohup vtc > log.txt 2>&1 &` · open the install URL, paste the claim code, save the passkey · sign in at `https://vtc.mages.city/admin` |

### Phase 5 · Make it survive a reboot — A writes, K installs · 30 min

The guide leaves everything under `nohup`. Follow-up deliverable: four systemd units
(`vti-dids`, `vti-mediator`, `vti-vta`, `vti-vtc`) with `After=valkey-server.service`,
ordered dids → mediator → vta → vtc, into `../systemd/`, plus a `vti.env.example` for the
D3/D4 passphrases. Not written until D1–D4 are taken.

### Phase 6 · Verify from outside — A · 10 min

From this PC: the four URLs answer (not 502); `https://dids.mages.city/.well-known/did.jsonl`
serves the host DID; `did:webvh:…:dids.mages.city:vta` resolves with `pnm` from `~/bin`;
`pnm health` green on the box. Record the result in `../dns/RECORDS_<date>_self-host.md`,
and retire the 2026-09-07 records file to "superseded".

### Phase 7 · Ongoing — K owns, A drafts

- **Backups:** nightly tar of `/root/{vta,mediator,dids,vtc}` off-box (R2 or a second host),
  plus the Hetzner image if D7. The 🔑 mnemonic lives only in the password manager.
- **Hardening later, without changing DIDs:** run services as separate non-root users; turn
  on D3/D4 encryption; move the VTA to a hardened host when upstream publishes the deploy
  stream. Portable DIDs make the move a re-host, not a re-mint.
- **Upgrades:** pin to tagged releases (`…/latest/`), never `…/main/`, on a box holding keys.
- **Watch:** the enrol URL is single-use (regenerate with `invite` after stopping the daemon);
  Let's Encrypt renewals via certbot's timer; Valkey bound to 127.0.0.1 only.

## 6 · Rollback and the hosted-farm question

- **Undo before Phase 4:** delete the server, set the four records back to CNAME
  `lb.firstperson.dev` DNS-only. Cost: one day of a CX23.
- **After Phase 4 the DIDs exist** and embed `dids.mages.city` plus an SCID. Moving to the
  hosted farm later means the farm's DID host would have to serve *these* logs; nothing
  upstream documents that hand-over. Treat the hosted farm as closed once our DIDs are minted,
  unless FirstPerson confirms a portable-DID import.
- The City's own agents-only policy, the gate, the Portal and the board are unaffected
  either way (`../../docs/VTAFARM.md` §7).

## 7 · Risks, stated plainly

| risk | size | what we do |
|---|---|---|
| Explore stream runs as root, plaintext secrets on disk | real | D2 accepted for the town; §5 Phase 7 hardening; box holds only the City's own keys |
| One box = one failure point | real | Hetzner backups + off-box tar; the DIDs are portable |
| Certbot fails because DNS was not ready | common | Phase 1 verify step; re-run `sudo certbot --nginx -d vtc.mages.city -d vta.mages.city -d dids.mages.city -d mediator.mages.city --email <e> --agree-tos` |
| Wizard prompts drift from the walkthrough (versions move) | likely over time | pinned `latest` = `VTI-Dogwood`; the walkthrough's verified-versions table is the contract |
| UK VAT / Hetzner identity check delays signup | small | budget 24 h for the account |

## 8 · Who does what

| keeper | agent |
|---|---|
| D1–D7 · Hetzner account, server, IP · both SSH windows of Phase 4 · every 🔑 · passkeys | Phase 1 DNS edits (on the keeper's word) · Phase 5 units + env example · Phase 6 external verification + records file · this proposal's follow-ups · nothing that touches a secret |

## 9 · References

- `~/openvtc/vti-setup/sysop/explore/01-server-setup.md` · `02-walkthrough.md` (local clone
  f937d98; upstream one commit ahead, #37 "Verify the explore setup script and every download
  it makes")
- `https://raw.githubusercontent.com/OpenVTC/vti-setup/main/scripts/setup-explore.sh`
- `https://download.firstperson.dev/{vta,vtc,pnm-server,mediator,did-hosting-daemon}/latest/…`
- `../README.md` §6 · `README.md` (this folder, the gate ↔ VTC contract) · `../Caddyfile.example`
  (kept for the tunnel profile; the explore script uses nginx) · `../dns/RECORDS_2026-09-07_vta-farm.md`
- `../../docs/VTAFARM.md` (why this is a community deployment, not a farm)
