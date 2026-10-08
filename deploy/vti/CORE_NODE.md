# The core node — this computer runs and issues

7 October 2026. The keeper's own machine becomes the City's core node: the VTA that mints and issues, the mediator, the DID host and the community (VTC) all run here, in WSL2 Ubuntu 26.04, published as `vta.` `mediator.` `dids.` `vtc.mages.city` through a Cloudflare Tunnel. This is upstream's **explore stream** (`vti-setup/sysop/explore/01` + `02`, tested on Ubuntu 26.04 with VTA 0.23.2 · mediator 0.20.2 · did-hosting-daemon 0.8.3 · VTC 0.11.58) with three substitutions and nothing else changed: WSL2 instead of a Hetzner VPS, a tunnel instead of nginx + certbot, systemd units instead of `nohup`. The wizards and every value they print are the keeper's (⚑ decision · 🔑 secret). The agent prepares, checks and records.

Upstream's own warning stands: the explore stream is **not hardened**; binaries from `download.firstperson.dev` carry no checksums or signatures. Mitigation here: the VTA DID is portable, so the issuing VTA can move to a hardened host later without changing its DID; the installer records our own SHA-256 of what was installed so drift is at least visible.

## What this box has (probed 7 October)

| | observed |
|---|---|
| WSL | Ubuntu 26.04 LTS, WSL2 kernel 6.6, `systemd=true`, default user `mitch`, 14 CPU / 25 GB, 864 GB free on the WSL disk |
| binaries | none of vta · vtc · pnm · mediator · did-hosting-daemon · openvtc · valkey · cloudflared present in WSL |
| Windows | `cloudflared.exe` installed; `cargo` installed (Windows cannot build the services; not needed) |
| prebuilt | all seven binaries answer 200 at `download.firstperson.dev/<svc>/latest/…` (built 2 Sept 2026, tag VTI-Dogwood) |
| DNS | zone on Cloudflare; the four trust hosts still CNAME `lb.firstperson.dev` (dark since ≥ 7 Sept, DNS-only) |

## Space on the box (measured 7 October)

The node itself is small. The disk it lands on is not.

| what | size |
|---|---|
| the seven binaries (vta 60 · vtc 51 · pnm 29 · mediator 21 · mediator-setup 26 · did-hosting-daemon 38 · openvtc 29 MB) | ≈ 254 MB |
| valkey + cloudflared packages | ≈ 60 MB |
| data at rest for a town-scale community (fjall stores, DID logs, audit log at 28-day retention, mediator queue in valkey) | tens of MB; budget 1 GB |
| **the node, total** | **< 1.5 GB** |
| the Arena runtimes already in the same WSL home (`sig.golf`, `qsb-*`, `flock`, `eip8200`, `hashsmash_mage`, `.elan` 8.4 GB, mathlib cache 1.3 GB) | 79 GB in `/home/mitch` |
| Ubuntu's `ext4.vhdx` as a file on `C:` | **172.8 GB** (WSL reports 92 GB used inside: ~80 GB is freed-but-unreturned space) |
| free on `C:` (where the vhdx lives) | **20 GB** |
| free on `D:` | 179 GB |

So the constraint is not the node; it is that WSL's "864 GB free" is a number the guest believes while the host drive under it has 20 GB. Everything that grows in WSL — the node's data, a Lean rebuild, a hashsmash census — grows the vhdx on `C:` until `C:` is full, and the memory note of 2026-08-30 is what that looks like. Two keeper moves ⚑, both with WSL stopped (so after any running Lean or solver job has finished; `wsl --shutdown` kills them):

1. **Compact the vhdx** to return the ~80 GB of freed space to `C:`:
   ```powershell
   wsl --shutdown
   diskpart
     select vdisk file="C:\Users\mitch\AppData\Local\wsl\{aa7b45b7-ad52-46eb-bce6-4f5e3d2c6e77}\ext4.vhdx"
     attach vdisk readonly
     compact vdisk
     detach vdisk
     exit
   ```
   (run `sudo fstrim -av` inside Ubuntu first so the guest marks the free blocks). Expected: the file shrinks towards 92 GB; `C:` gains what it loses.
2. **Move the distro to `D:`** (179 GB free) if `C:` is to stay the system drive: `wsl --manage Ubuntu --move D:\wsl\Ubuntu` on current WSL; older WSL needs `--export` to a `.tar` on `D:` and `--import` with `--vhd-size`. Compact first, or the export is 172 GB.

Until one of these is done, keep the node's data small (it is) and watch `C:` before any long Arena build. `.wslconfig` caps memory and CPUs so a Lean build and the node share the box without starving Windows; the example leaves 25 GB → 16 GB to WSL and 10 of 14 CPUs.

## Use `D:` for the node ⚑ (decided 7 October: yes)

WSL here is 2.6.1, which has `wsl --install … --location` and `wsl --manage … --move`. `D:` has 179 GB free and already holds `captures`, `mouse_spellbook`, `zcash`, `zebra`. Two shapes; the first is recommended:

1. **A second, small distro on `D:` for the node only** — `mages-core`. The Arena's Lean builds and solver censuses stay in the existing `Ubuntu` on `C:`; the node's disk cannot be filled by a build, and upstream's "do not put real keys on a throwaway explore box" is at least honoured at the disk level. Ubuntu 26.04 is what upstream tested; install whichever 26.04 image `wsl --list --online` names (`Ubuntu` is currently 26.04 here):
   ```powershell
   wsl --install Ubuntu --name mages-core --location D:\wsl\mages-core --no-launch
   wsl -d mages-core      # first run: create user privacymage; then in it: sudo sh -c 'printf "[boot]\nsystemd=true\n[user]\ndefault=privacymage\n" > /etc/wsl.conf'
   wsl --terminate mages-core
   ```
   Then every step below runs in `mages-core` (`wsl -d mages-core`), and `~/vti` lives on `D:`. Budget for the vhdx: a few GB. The `.wslconfig` caps are per VM and apply to both distros together.
2. **Move the existing `Ubuntu` to `D:`** — only after the compaction above (the move copies the vhdx; 172.8 GB does not fit in 179 GB with margin, ~92 GB does): `wsl --shutdown` then `wsl --manage Ubuntu --move D:\wsl\Ubuntu`. This frees `C:` for good but keeps node and Arena on one disk.

Doing 1 now and 2 later is fine; they do not conflict. With shape 1, replace `/home/privacymage/vti` in the systemd units only if the user name differs; the units assume `privacymage`.

## The kit (`core-node/`)

| file | role |
|---|---|
| `install-binaries.sh` | WSL: valkey + the seven binaries into `/usr/local/bin`, our SHA-256 pin written to `~/vti/BINARIES.sha256`, versions printed |
| `systemd/vti-{dids,mediator,vta,vtc}.service` | one unit per service, ordered dids → mediator → vta → vtc, `WorkingDirectory=~/vti/<svc>` |
| `cloudflared.yml` | tunnel ingress: the four hosts → localhost ports; the farm rules kept |
| `check.sh` | local and public health probes; prints, never changes |
| `wslconfig.example` | keeps the WSL VM alive when no terminal is open |

## 0 · Decide ⚑

- **This machine stays on.** Windows sleep off while the node serves; the `.wslconfig` idle timeout set so WSL does not stop. If the machine is not always on, the node is not up; that is acceptable for the first community and wrong for a farm (and the City is not a farm, `docs/VTAFARM.md`).
- **Tunnel.** One named tunnel `mages-core`, run inside WSL as a systemd service (`cloudflared` installed from Cloudflare's apt repo). The Windows `cloudflared.exe` is the fallback if WSL networking misbehaves.
- **DID host name** is `dids.` (plural) as upstream; a DID cannot be renamed later.
- **Secrets posture** as upstream's defaults for the explore stream (seed in config file; mediator keys plaintext file; VTC seed in config). Revisit on the hardened stream.

## 1 · Prepare WSL · agent prepares, keeper runs

```bash
# in WSL (mages-core on D:, or Ubuntu)
mkdir -p ~/vti && cd ~/vti
bash /mnt/c/Users/mitch/mages_city/deploy/vti/core-node/install-binaries.sh
```

Installs `valkey-server` (apt), downloads the seven binaries, installs them, records `BINARIES.sha256`, prints `--version` for each. *Done when* every `command -v` resolves and `systemctl is-active valkey-server` is `active`.

## 2 · The tunnel and DNS ⚑

```bash
# in WSL
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared
cloudflared tunnel login                      # browser: pick the mages.city zone  🔑 cert.pem lands in ~/.cloudflared
cloudflared tunnel create mages-core          # prints the tunnel id; credentials json in ~/.cloudflared  🔑
```

Then in the Cloudflare dashboard ⚑ **delete the four `lb.firstperson.dev` CNAMEs** (`vta` `mediator` `dids` `vtc`) and let the tunnel claim the names:

```bash
for h in vta mediator dids vtc; do cloudflared tunnel route dns mages-core $h.mages.city; done
```

These records are **proxied** (orange cloud), the opposite of the hosted-farm shape; the tunnel terminates TLS, so no port 80, no certbot. Install the ingress:

```bash
sudo mkdir -p /etc/cloudflared
sed "s/<TUNNEL-ID>/<the id>/g" /mnt/c/Users/mitch/mages_city/deploy/vti/core-node/cloudflared.yml | sudo tee /etc/cloudflared/config.yml
sudo cp ~/.cloudflared/<the id>.json /etc/cloudflared/
sudo cloudflared service install && sudo systemctl enable --now cloudflared
```

*Done when* `https://vta.mages.city/` answers from the tunnel (a 502 is right until the services run) and `dig +short vta.mages.city` returns Cloudflare edge addresses.

## 3 · The VTA (upstream step 1) ⚑ 🔑

```bash
mkdir -p ~/vti/vta && cd ~/vti/vta && vta setup
```

Upstream's prompt table applies with `yourdomain.com` → `mages.city`: VTA REST URL `https://vta.mages.city`; mediator URL `https://mediator.mages.city/mediator/v1`; mediator DID URL `https://dids.mages.city/mediator`; VTA DID URL `https://dids.mages.city/vta`; select all three services incl. TSP. The wizard shows the **24-word mnemonic (1a)** once: the keeper saves it; the agent never sees it. Save **VTA DID (1b)** and **Mediator DID (1c)** into the keeper's notes; the agent gets 1b and 1c only (they are public DIDs).

## 4 · PNM, mediator, DID host (upstream steps 2–4) ⚑

Exactly upstream, in `~/vti/vta`, `~/vti/mediator`, `~/vti/dids` instead of `/root/<svc>`: `pnm setup` → `vta import-did … --role admin`; `mediator-setup` headless with the sealed bundle from `vta contexts reprovision --id mediator …` (digest 3a); `did-hosting-daemon setup` offline phase 1 → `vta contexts create --id webvh --admin-expires 1h --admin-did <4a>` → `vta bootstrap provision-integration …` (digest 4b) → phase 2 (DID 4c) → `did-hosting-daemon invite --role admin --did <4a>` (enrolment URL 🔑, single use).

Where upstream says `nohup <svc> > log.txt 2>&1 &`, install the unit instead:

```bash
sudo cp /mnt/c/Users/mitch/mages_city/deploy/vti/core-node/systemd/vti-*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now vti-dids        # then the browser: enrolment URL → passkey; upload mediator + VTA did.jsonl at https://dids.mages.city/dids
sudo systemctl enable --now vti-mediator    # wait a minute
sudo systemctl enable --now vti-vta
cd ~/vti/vta && pnm did-mgmt servers add --id did-hosting-daemon --did <4c> && pnm health
```

*Done when* `pnm health` passes and `https://dids.mages.city/vta/did.jsonl` resolves the VTA DID from outside.

## 5 · The community (upstream step 5, or DEPLOY.md §2) ⚑ 🔑

Interactive, as upstream: `mkdir -p ~/vti/vtc && cd ~/vti/vtc && vtc setup` with base URL `https://vtc.mages.city`, VTA DID 1b, context **`mages-city`** (not `default`), DID hosting = did-hosting-daemon with path `vtc`, transports TSP + DIDComm. Authorise the ephemeral DID from the other terminal with the printed `pnm contexts create … --admin-expires 1h` **plus `--admin-handoff`** (the headless doc requires it; the interactive wizard tolerates its absence, the flag is harmless). Or headless with `vtc/vtc-setup.toml` per DEPLOY.md §2. Then:

```bash
sudo systemctl enable --now vti-vtc
```

Install URL + claim code 🔑 → browser → passkey → `/admin/`. Continue at **DEPLOY.md §3** (cnm identity), **§4** (criteria), **§5** (website), **§6** (publish the DID).

## 6 · Check · agent

```bash
bash /mnt/c/Users/mitch/mages_city/deploy/vti/core-node/check.sh
```

Local ports 8534 · 7037 · 8100 · 8200 and the four public hosts. Prints only. `node bin/openvtc-status.mjs --online` from the City repo adds the inventory view.

## 7 · Keep it up ⚑

- `%UserProfile%\.wslconfig` ← `core-node/wslconfig.example` (`vmIdleTimeout=-1`), then `wsl --shutdown` once and start Ubuntu again.
- Windows: sleep **Never** on AC; the box is the node.
- Backups: `~/vti/` holds every config and data dir. Upstream `docs/03-vtc/backup-restore.md` for the VTC; the VTA mnemonic (1a) is the recovery of last resort and lives only with the keeper.

## What moves later

Hardened stream (`vti-setup/sysop/deploy/`, a VTA farm on Kubernetes) is out of scope: the City is a community, not a farm. If the issuing VTA must leave this machine, its DID is portable; the community's DID is minted by that VTA and hosted on `dids.mages.city`, which moves with the tunnel.
