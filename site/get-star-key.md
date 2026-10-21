# Get Star Key — the City's browser wallet

> Status (21 October 2026): version 0.2.0, loaded unpacked. The fork is not on the Chrome Web Store: a Store listing of the wallet is the upstream publisher's to make, and the fork is taken from the City or the release. The same build, two places to take it from.

`machines qualify · humans admit · brokers release`

## What you are installing

Star Key is **agentprivacy's fork of [OpenVTC's browser wallet](https://github.com/OpenVTC/vta-browser-plugin)**, the extension that connects a browser to a Verifiable Trust Agent (VTA). Upstream is the wallet; the fork adds the Star (the figure the wallet shows for your City Key, the same solid as its icon), the 📤 reading of a City Key and the 🪬 Hold verified locally, the 🤝 join by a community's DID, and the Agreements catalogue of the privacy terms you hold with sites, MyTerms first. The fork tracks upstream and carries its licence. Source: [mitchuski/star-key](https://github.com/mitchuski/star-key).

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

## What the Star holds · the three marks in the header

The wallet's header carries the Star and three marks. Each is a door the upstream wallet does not have.

- **📤 Read your City Key.** Inspect a local City Key before anything travels: the reading carries the name, the palette and, only if you tick it, the lit vertices. Everything else the key holds is listed as counts, never values. The reading can be given a content address (κ, canonical JSON, SHA-256) for a UOR registry; the address is not an identity.
- **🪬 What the Star holds.** Choose a Hold file and every item in it is re-verified in the browser with WebCrypto: the signatures, the refs, the Merkle root, the bearer's signature, and whether the key's `holds{root,count}` agrees. Nothing is sent anywhere. A projection of counts and states can be downloaded; it is linkable, not permission.
- **🤝 Join a community.** By its DID: paste, QR or camera. The window reads the community's DID document, shows the terms it takes against the ones you present, and the agreements already standing with it.

The byte ladder is the point. Measured on the reference Hold of seven signed items, the same fixture three verifiers agree on:

| What | Bytes |
|---|---|
| Hold file on disk | 18,992 |
| Signed envelopes retained inside it | 6,478 of a 24,576 budget |
| Projection, counts and states only | 2,192 |
| Whole City Key, canonical | 504 |
| What the key carries of the Hold, `holds{root,count}` | 92 |

What a community sees of your Hold at the door today is the last line: a root and a count, one seventieth of the signed bytes, with every item still verifiable later against that root. Presenting chosen items under the root (k vouches, a Merkle path each) is the next rung and is not built yet; the pane says exactly that.

## Then

- **Connect it to your agent**: [starkey.md](starkey.md). You need a VTA of your own; the [VTA farm](https://vta.farm/) is the easiest.
- **Join the City**: press the 🤝 in the Star's header on [join.mages.city](https://join.mages.city/) and give it the community's DID, or [walk in by the members door](https://join.mages.city/members/).
- **Your agreements**: Options → Agreements, where you choose the terms you present at a door.

Related: [starkey.md](starkey.md) · [community.md](community.md) · [join.html](join.html) · [the upstream wallet](https://github.com/OpenVTC/vta-browser-plugin) · [OpenVTC](https://openvtc.net/)
