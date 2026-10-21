# Get Star Key — the City's browser wallet

> Status (21 October 2026): version 0.2.0, loaded unpacked. The fork is not on the Chrome Web Store: a Store listing of the wallet is the upstream publisher's to make, and the fork is taken from the City or the release. The same build, two places to take it from.

`machines qualify · humans admit · brokers release`

## What you are installing

Star Key is **agentprivacy's fork of [OpenVTC's browser wallet](https://github.com/OpenVTC/vta-browser-plugin)**, the extension that connects a browser to a Verifiable Trust Agent (VTA). Upstream is the wallet; the fork adds the Star (what your Hold reveals, as a figure), the 🤝 join by a community's DID, and the Agreements catalogue of the privacy terms you hold with sites, MyTerms first. The fork tracks upstream and carries its licence. Source: [mitchuski/star-key](https://github.com/mitchuski/star-key).

The wallet never holds a signing key. It holds your DIDs and the connection to your own agent; every token a site receives is minted by your VTA. The City keeps no custody of anything you carry.

## Download

| | Address | Note |
|---|---|---|
| From the City | [star-key-0.2.0.zip](downloads/star-key-0.2.0.zip) | the file served here, 1.7 MB |
| From the source | [GitHub release 0.2.0](https://github.com/mitchuski/star-key/releases/latest) | the same file, attached to the release on the fork |

SHA-256 of the zip, either place: `fd553854da3d7c689980ef86e2125930a3c2d736953402fbc4cd87357d37ef52`

Or build it yourself: clone the fork, `npm install`, `npm run build`, and load `packages/extension/dist`.

## Load it in Chrome · you type

1. Unzip the file into a folder you will keep. Chrome loads the extension from that folder each start; delete it and the wallet is gone.
2. Open `chrome://extensions`, switch on **Developer mode** (top right).
3. **Load unpacked**, choose the folder. The extension is named **Star — Trust Experiment**; pin it from the puzzle-piece menu so the Star sits in your toolbar.
4. Setup opens on its own. It asks for your VTA's DID first: continue on the [Star Key page](starkey.md), which walks the connection, the grant at your agent, and the passkey.

Chrome asks for no permission at install. The wallet asks per site, in the click, the first time you use it there.

## Then

- **Connect it to your agent**: [starkey.md](starkey.md). You need a VTA of your own; the [VTA farm](https://vtafarm.firstperson.dev/) is the easiest.
- **Join the City**: press the 🤝 in the Star's header on [join.mages.city](https://join.mages.city/) and give it the community's DID, or [walk in by the members door](https://join.mages.city/members/).
- **Your agreements**: Options → Agreements, where you choose the terms you present at a door.

Related: [starkey.md](starkey.md) · [community.md](community.md) · [join.html](join.html) · [the upstream wallet](https://github.com/OpenVTC/vta-browser-plugin) · [OpenVTC](https://openvtc.net/)
