# Keeper actions · stand up the core node on this computer

8 October 2026. The checklist of what **you** type, in order, to bring up the City's own VTA, DID host, mediator, PNM and community on this machine. Everything else is prepared: the installer, the units, the tunnel ingress, the check script (`core-node/`), the full runbook (`CORE_NODE.md`), the acceptance stages (`EDITION.md`). ⚑ = a decision · 🔑 = a secret only you see · ⏱ = roughly how long.

**Terminals.** `PS>` is Windows PowerShell. `$` is inside WSL. Open WSL with `wsl -d mages-core` once step 1 is done; until then `wsl -d Ubuntu`.

## 0 · Before anything · ⏱ 10 min · ⚠ NOT while a solver runs

> **8 Oct: the hashsmash r32 blind route search is MID-RUN in the `Ubuntu` distro (952k CPU-s so far) and sig_mage builds are live. `wsl --shutdown` kills them.** Do this step only after `~/hashsmash_mage/RESUME_r32.md` says the run finished. **Steps 1–3 do not need a shutdown** and can go first: a new distro installs beside the running one. The `.wslconfig` caps apply at the next restart of the VM; until then skip them.

1. Finish or stop any Lean or solver job in WSL (the next step shuts WSL down).
2. Return the freed space and keep `C:` safe:
   ```
   $   sudo fstrim -av
   PS> wsl --shutdown
   PS> diskpart
         select vdisk file="C:\Users\mitch\AppData\Local\wsl\{aa7b45b7-ad52-46eb-bce6-4f5e3d2c6e77}\ext4.vhdx"
         attach vdisk readonly
         compact vdisk
         detach vdisk
         exit
   ```
3. Keep WSL alive when no terminal is open: copy `core-node/wslconfig.example` to `C:\Users\mitch\.wslconfig`, then `PS> wsl --shutdown` once more.
4. Windows → Settings → Power: sleep **Never** on AC ⚑. The box is the node.

## 1 · The node's own distro on D: · ⏱ 5 min · safe while the solver runs · ✅ DONE 8 Oct (Ubuntu 26.04.1, 1 TB vhdx on D:, 955 GB free)

> **Gotcha met and fixed:** both distros share one WSL VM; a user with UID 1000 in the new distro collides with the solver VM's `mitch` (UID 1000) on the user session cgroup (`user@1000.service: Failed to spawn executor: Device or resource busy`, systemd `degraded`). Fix: `usermod -u 1001 privacymage && groupmod -g 1001 privacymage && chown -R 1001:1001 /home/privacymage`, mask `getty@tty1`, terminate and relaunch → `running`, no failed units.

```
PS> wsl --install Ubuntu --name mages-core --location D:\wsl\mages-core --no-launch
PS> wsl -d mages-core                      # first run asks for a user: privacymage
$   sudo sh -c 'printf "[boot]\nsystemd=true\n[user]\ndefault=privacymage\n" > /etc/wsl.conf'
$   exit
PS> wsl --terminate mages-core
PS> wsl -d mages-core
$   systemctl is-system-running             # expect: running
```

## 2 · Binaries and valkey · ⏱ 5 min · ✅ DONE 8 Oct (vta 0.23.4 · vtc 0.11.58 · did-hosting-daemon 0.8.3 · pnm/mediator/mediator-setup present · valkey 9.0.4 active · libpcsclite1 added for the openvtc client; pin at ~/vti/BINARIES.sha256, sizes equal upstream)

```
$   mkdir -p ~/vti && bash /mnt/c/Users/mitch/mages_city/deploy/vti/core-node/install-binaries.sh
```
It installs valkey, downloads the seven binaries (vta · vtc · pnm · mediator · mediator-setup · did-hosting-daemon · openvtc), records our own SHA-256 pin and prints every `--version`. Done when every version prints.

## 3 · The tunnel and DNS · ⏱ 15 min ⚑ 🔑 · ✅ 3a + 3b DONE 8 Oct (connector 2026.10.0, 4 edge connections; vta/mediator/dids/vtc proxied → tunnel, all 502 from outside as expected): tunnel `mages-core` id `37513f30-14c1-4942-8dcd-578abfee497b` (credentials at ~/.cloudflared/<id>.json on the node, never copied here)

```
$   # cloudflared from Cloudflare's apt repo (three lines in CORE_NODE.md §2), then:
$   cloudflared tunnel login                # browser opens: choose the mages.city zone
$   cloudflared tunnel create mages-core    # note the tunnel id
```
In the Cloudflare dashboard, DNS for mages.city: **delete** the four CNAMEs `vta` `mediator` `dids` `vtc` that point at `lb.firstperson.dev`. Then:
```
$   for h in vta mediator dids vtc; do cloudflared tunnel route dns mages-core $h.mages.city; done
$   sudo mkdir -p /etc/cloudflared
$   sed "s/<TUNNEL-ID>/<the id>/g" /mnt/c/Users/mitch/mages_city/deploy/vti/core-node/cloudflared.yml | sudo tee /etc/cloudflared/config.yml
$   sudo cp ~/.cloudflared/<the id>.json /etc/cloudflared/
$   sudo cloudflared service install && sudo systemctl enable --now cloudflared
```
Done when `curl -sI https://vta.mages.city/` answers from Cloudflare (a 502 is right for now).

## 4 · The VTA · ⏱ 15 min 🔑 · ✅ DONE 8 Oct (vta 0.23.4; 1b = `did:webvh:QmPbiGWYyLGRmuD8iVNkXCStuFWqcQGTMXFWk3jK2KySC6:dids.mages.city:vta` · 1c = `did:webvh:QmeBZpgvVSaKXJm54ehwrJ8pRnAkwLcFuKdRuTXLUByRXS:dids.mages.city:mediator`; 0.23.4 stores the mnemonic in the seed backend instead of showing it → `pnm backup export` after the first admin connects)

```
$   mkdir -p ~/vti/vta && cd ~/vti/vta && vta setup
```
Answer with upstream's table (`CORE_NODE.md` §3), `yourdomain.com` → `mages.city`; select all three services including TSP. **Save the 24-word mnemonic (1a)** where only you can read it; it is the recovery of last resort. Save the **VTA DID (1b)** and **mediator DID (1c)** from the summary; those two are public and you can paste them to me.

## 5 · PNM on, mediator, DID host · ⏱ 30 min 🔑 · 5a ✅ · 5b ✅ · 5c ✅ · 5d ✅ ALL DONE 8 Oct (mediator + VTA live via tunnel; pnm health: VTA ✓ mediator pong ✓ DIDComm pong ✓, TSP ping ✗ — admin key rotated by pnm on first connect to did:key:z6MkrhJ6…gvR8 and pnm's TSP sender kept the old key; open item, not blocking; backup exported with `pnm --transport rest backup export`, the descriptor flow is REST-only) (vti-dids unit live; passkey enrolled; mediator + vta DID logs uploaded, both resolve publicly). Gotchas: `invite` opens the store directly → stop the unit first; a phase-1 `setup` wizard left open holds the same lock — quit it; (DID host 4c `did:webvh:QmWW65o9t2sUBjKqbPdwh5JLRn8Bm6dPcg6ArnuTnk9NzF:dids.mages.city`; admin rolled to did:key:z6MkwdnAe6dnxa17akmnUG3cgediPyHpgXV85tF1E17GU71n — invite THAT one; (mediator configured via sealed bundle, keys passphrase-encrypted, admin did:key:z6MkmpyT1gC5sdYynZXCtRghhDLtvw6o2pdA5nBuq8ECubry; pnm connected; first admin `did:key:z6Mko81cVFTQWaj2fQRsTGez1hrX1mR43BqGCoffHBEauc7K` label privacymage, Option A)

```
$   cd ~/vti/vta && pnm setup                # "Connect to an existing non-TEE VTA", paste 1b
$   vta import-did --did <did:key printed by pnm> --role admin
$   mkdir -p ~/vti/mediator && cd ~/vti/mediator && mediator-setup      # headless · file keys · "Pick up pre-provisioned mediator (offline export)" · context mediator
```
Second terminal (`wsl -d mages-core`):
```
$   mv ~/vti/mediator/bootstrap-request.json ~/vti/vta/ && cd ~/vti/vta
$   vta contexts reprovision --id mediator --recipient bootstrap-request.json --out bundle.armor    # save digest 3a
$   mv ~/vti/vta/bundle.armor ~/vti/mediator/
```
Back in the mediator wizard: path `/home/privacymage/vti/mediator/bundle.armor`, digest 3a; TSP + DIDComm; No SSL (proxy); fresh JWT key; open network; CORS any; Redis at default; new admin did:key; write `conf/mediator.toml`.
```
$   mkdir -p ~/vti/dids && cd ~/vti/dids && did-hosting-daemon setup   # offline phase 1 · public URL https://dids.mages.city · mediator DID 1c · plaintext secrets: y · generate operator did:key → save 4a
$   mv ~/vti/dids/bootstrap-request.json ~/vti/vta/ && cd ~/vti/vta
$   vta contexts create --id webvh --admin-expires 1h --admin-did <4a>
$   vta bootstrap provision-integration --request bootstrap-request.json --out bundle.armor       # save digest 4b
$   mv ~/vti/vta/bundle.armor ~/vti/dids/ && cd ~/vti/dids && did-hosting-daemon setup           # offline phase 2 · bundle path · digest 4b → save DID 4c
$   did-hosting-daemon invite --role admin --did <4a>                    # one-time enrolment URL 🔑
```
Start the services as units instead of upstream's `nohup`:
```
$   sudo cp /mnt/c/Users/mitch/mages_city/deploy/vti/core-node/systemd/vti-*.service /etc/systemd/system/ && sudo systemctl daemon-reload
$   sudo systemctl enable --now vti-dids
```
Browser: open the enrolment URL, register a passkey; at `https://dids.mages.city/dids` add `mediator` and `vta` and paste `~/vti/vta/mediator-did.jsonl` and `~/vti/vta/VTA-did.jsonl`.
```
$   sudo systemctl enable --now vti-mediator      # wait a minute
$   sudo systemctl enable --now vti-vta
$   cd ~/vti/vta && pnm did-mgmt servers add --id did-hosting-daemon --did <4c> && pnm health
```
Done when `pnm health` passes and `https://dids.mages.city/vta/did.jsonl` loads from your phone.

## 6 · The community · ⏱ 20 min 🔑 · ✅ DONE 8 Oct 22:40Z (VTC DID `did:webvh:QmQ8GMNCTui2H9gjxQWByS1ScsWkByaeQHYnzhcET1UPne:dids.mages.city:vtc`, admin claimed by passkey, public profile + DID QR + console live via tunnel). Gotchas: pnm 0.14.3 has no `--admin-handoff` (drop it, the interactive wizard proceeds); the unit must be started before the install URL answers (502 until then); the URL lives 15 min, `vtc admin invite --did <admin>` re-mints it with the daemon stopped

```
$   mkdir -p ~/vti/vtc && cd ~/vti/vtc && vtc setup
```
Base URL `https://vtc.mages.city`; VTA DID 1b; context **`mages-city`**; no trust registry yet; the VTA's mediator; TSP + DIDComm. When it pauses, in the other terminal:
```
$   cd ~/vti/vta && pnm contexts create --id mages-city --name "Mages City" --admin-did <printed did:key> --admin-expires 1h --admin-handoff
```
Back in the wizard: y; DID hosting = did-hosting-daemon, path `vtc`; seed in config. **Save the install URL and claim code (🔑, 15-minute TTL).**
```
$   sudo systemctl enable --now vti-vtc
```
Browser: the install URL → claim code → passkey → sign in at `https://vtc.mages.city/admin/`. **Do this before adding any other admin.** Then paste me the `VTC DID` line; I write it into `community.json`, `edition.json` and the pages, and you push `main`.

## 7 · Hand the rest to the agent · ⏱ 10 min

```
$   bash /mnt/c/Users/mitch/mages_city/deploy/vti/core-node/check.sh
```
From here `DEPLOY.md` §3–§7 is mostly mine with you clicking approve: the `cnm` identity, the three join criteria (`invited` · `arena-evidence` · `review`), the community site into `website.root_dir`, the first synthetic admission and revocation. The recorded versions go into `EDITION.md`.

## What never leaves your hands

The mnemonic (1a), the three bundle digests, the enrolment URL, the install URL and claim code, the passkeys, every private key. I only ever need the public DIDs (1b, 1c, 4c, the VTC DID) and the output of `pnm health` and `check.sh`.
