# Upgrading the community node to vtc 0.12 · plan · 2026-10-26

For the keeper to run. Goal: the member portal goes live. vtc 0.12 serves it at a fixed `/members/` mount, so
`join.mages.city/members/` (the DID document's `SignInPortal`) and `vtc.mages.city/members/` both answer with upstream's
portal, and the join page's "member portal" link can come back.

## Where things stand (checked 2026-10-26)

| | now |
|---|---|
| node | `mages-core` WSL distro on D:, user `privacymage`, services under systemd: `vti-vtc`, `vti-vta`, `vti-mediator`, `vti-dids`, `cloudflared` (all active) |
| vtc | **0.11.58**, `/usr/local/bin/vtc`, 85,927,040 bytes, sha256 `36ec3712…67470` (`~/vti/BINARIES.sha256`) |
| vta | **0.56.0** (upstream is at vta-service 0.64.0) |
| website | `~/vti/vtc/website` (`[website] root_dir`, live mode); the City's static door is at `website/members/` today |
| upstream | **vtc-service v0.12.0** released on GitHub 2026-10-18 (with vta-service 0.64.0 the same day). **No binaries are attached to the GitHub releases.** |
| download server | `download.firstperson.dev/vtc/latest/vtc` is still the 0.11.58 build (Last-Modified 15 Oct, same size and hash as installed). No versioned `vtc/0.12.0/` path. |

So there is no 0.12 binary to download yet. Two ways to get one: wait for the download server's `latest` to move, or
build it from the tag.

## What 0.12 changes that matters here (from the release notes)

- **The member portal** at `/members/*` (fixed mount): sign-in through the wallet, standing, the community's rooms and
  room offers, theming through the console's *Theme* card (City colours there, not a fork). An operator site that
  replaces the default page "should keep a link to `/members/`".
- **Breaking, admin:** an admin's own passkeys and the cookie bridge are served only as signed documents (#1641). Expect
  the console sign-in to change; sign in once right after the upgrade.
- **Breaking, rooms:** `rooms/owner/register` 0.2 and `group/remove` 0.3 (0.1/0.2 still served); `witness` 0.2.
- **New optional config key** `vta_context` (written by `vtc setup`); the existing `config.toml` stays valid.
- **Its dependencies moved:** trust-tasks-rs 0.32. The VTA here is 0.56.0; check whether 0.12 needs a newer VTA (step 3).

## The steps

### 0 · Before anything (5 min)

1. **Make the node stay up.** The keep-alive task dies with the interactive session, and the distro halts (Cloudflare
   error 1033). In Task Scheduler, set it to *Run whether user is logged on or not*, *Run with highest privileges*,
   and add a trigger *At startup*. (Needs your Windows password; see MEMBER_DOOR plan, 22 Oct 17:50.)
2. Tell the window working on the member door: once 0.12 is in, upstream's portal takes `/members/`, and its static
   door page at `website/members/` stops being served at that address (its plan's D2: "upstream's portal replaces
   the landing at the same URL; our page becomes the City's skin over it").

### 1 · Get the 0.12 binary

**A · Wait for the download server** (simplest). Check:

```bash
curl -sI https://download.firstperson.dev/vtc/latest/vtc | grep -iE 'last-modified|content-length'
```

When it is newer than 15 Oct and the size differs from 85,927,040, the installer can fetch it (step 4).

**B · Build from the tag** (now). In the `Ubuntu` distro (the solver one has room; `mages-core` has no cargo):

```bash
git clone --depth 1 --branch vtc-service-v0.12.0 https://github.com/OpenVTC/verifiable-trust-infrastructure ~/vti-src-0.12
cd ~/vti-src-0.12 && cargo build --release -p vtc-service       # use the repo's rust-toolchain if it has one
./target/release/vtc --version                                   # expect 0.12.0
sha256sum target/release/vtc
```

Copy it to the node: `wsl -d mages-core -e bash -lc 'install -m 0755 /mnt/wsl/... ~/vti/bin/vtc-0.12.0'` (or via
`/mnt/c/...`).

### 2 · Back up (2 min)

```bash
wsl -d mages-core
sudo cp /usr/local/bin/vtc /usr/local/bin/vtc-0.11.58
cp -a ~/vti/vtc ~/vti/vtc.bak-$(date +%F)            # config.toml, store, website
cp ~/vti/BINARIES.sha256 ~/vti/BINARIES.sha256.bak-$(date +%F)
```

### 3 · Check the VTA question first

Read the 0.12 notes and `docs/03-vtc/` at the tag for a minimum VTA. If 0.12 needs a newer VTA, upgrade
`vta` the same way after vtc is verified, as its own step with its own backup. If nothing says so, keep 0.56.0 and
watch step 5's trust-task checks.

### 4 · Install and restart (5 min)

```bash
sudo systemctl stop vti-vtc
sudo install -m 0755 ~/vti/bin/vtc-0.12.0 /usr/local/bin/vtc     # or: HOLD="did-hosting-daemon vta pnm mediator mediator-setup openvtc" bash install-binaries.sh once latest moves
vtc --version
sudo systemctl start vti-vtc && sleep 5 && systemctl is-active vti-vtc
journalctl -u vti-vtc -n 60 --no-pager
```

Record the new hash in `~/vti/BINARIES.sha256` (the installer does it if used).

### 5 · Verify (15 min)

| check | expect |
|---|---|
| `curl -s https://vtc.mages.city/v1/community/public-profile` | 200, the City's profile |
| https://join.mages.city/ | the City's site, its 8-link navigation, the DID and QR |
| https://join.mages.city/members/ and https://vtc.mages.city/members/ | upstream's portal sign-in page |
| the console | sign in with your passkey (the signed-document change); the community still there |
| a member's sign-in | with Star Key, *Enter the door* on the portal; standing reads as a member |
| a join request (openvtc client or a test wallet) | arrives *pending*, as before |
| `bash core-node/check.sh` (if present) | all green |

### 6 · Finish

- In the console's *Theme* card, give the portal the City's colours (the website's `community.config.json` palette).
- Turn the join page's member-portal link back on: `"memberPortal": true` in
  `deploy/vti/vtc/website/community.config.json` (it is on in the repo today; off only if you approved hiding the
  dead link meanwhile), copy that one file to `~/vti/vtc/website/`.
- Note the upgrade in `KEEPER_ACTIONS.md` and the member door plan.

### Roll back

```bash
sudo systemctl stop vti-vtc
sudo install -m 0755 /usr/local/bin/vtc-0.11.58 /usr/local/bin/vtc
rsync -a ~/vti/vtc.bak-<date>/ ~/vti/vtc/      # only if 0.12 rewrote the store or config
sudo systemctl start vti-vtc
```

## After the portal: the members' view of the quests

Not part of this upgrade. Each quest's members' build (`runs/site/<quest>/revealed/` in blake3_mage) exists only on
the keeper's machine. Serving it to signed-in members means a members' route the portal guards, then the member page
links to it. A plan of its own once the portal is live.
