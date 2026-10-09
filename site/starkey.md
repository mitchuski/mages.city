# Star Key — your wallet into the City, and your first invitation

> Status (9 October 2026): live. The City's keeper administers the community from a Star Key wallet; this page is the path a newcomer walks to do the same as a member. Read it with your agent, or read it to your agent. Every step says who types it.

`machines qualify · humans admit · brokers release`

## What Star Key is

Star Key is the agentprivacy fork of OpenVTC's browser wallet, the extension that connects a browser to a Verifiable Trust Agent (VTA). Your VTA holds your keys and credentials, presents only what you agree to, and can say no on your behalf. The wallet never holds a signing key: when a site asks you to sign in, the token is minted by your agent. The City keeps no custody of anything you carry.

- Repository: [mitchuski/star-key](https://github.com/mitchuski/star-key). Load `packages/extension/dist` unpacked in Chrome (Developer mode, Load unpacked). The name is **Star — Trust Experiment**.
- You need a VTA of your own first: the easiest is the [VTA farm](https://vtafarm.firstperson.dev/); or self-host from the [Verifiable Trust Infrastructure](https://github.com/OpenVTC/verifiable-trust-infrastructure). The City's own agent is not yours to connect to; members bring their own.

## Connect the wallet to your agent · you type, your agent reads

1. **Setup opens on install.** Step 1, *Your trust agent*: paste your VTA's `did:webvh:…`. Chrome asks permission for your VTA's host; allow it. The mediator is read from your agent's own record; nothing to enter.
2. **Choose the scope.** *Work inside one context* is a member's wallet: it acts as you in one context and sees no others. *Manage the whole agent* is an operator's. Name the context; the City's keeper used `swordsman` for the keeper's seat, by the two-seat setup's lore.
3. **Grant the wallet at your VTA.** The wallet prints a line for your own `pnm`, of the form `pnm acl create --did did:key:… --role … --capabilities persona-holder --expires 1h --handoff`. Run it where your pnm is connected to your VTA. If your pnm is older and refuses `--capabilities` or `--handoff`, drop those two flags. If it times out, add `--transport rest` before `acl`.
4. **Continue.** The wallet rotates its temporary key to a long-term one through your agent; the hour-long grant hands off to it.
5. **Lock the wallet with a passkey.** Without it, anyone using this browser is you.
6. **Enable the wallet on a site** when you first visit it: the popup offers *Enable on <site>*.

Gotchas the keeper met, in `deploy/vti/KEEPER_ACTIONS.md` of the City repo: the context must exist at your VTA (`pnm contexts create --id <name> --name "<Name>"`), a VTA that booted before its DID host skips messaging until restarted, and a mediator restart stales every session until the clients reconnect.

## Get your first invitation from the keeper · you ask, a human admits

The City's first door is `invited`: an invitation credential the community issues to your DID, which you present when you join, and the join is admitted automatically. The keeper issues it from the console after a short conversation; that conversation is the admission.

1. **Say who you are and what you bring.** Open a thread at the Portal (`swarms-forming` or `how-do-i-get-in`) or write to `mage@agentprivacy.ai`: your name, your agent, the research you are doing or the problem you want solved, and the persona DID you will join with (a `did:webvh:…` or `did:key:…` your VTA holds). Nothing secret: a DID is public.
2. **The keeper issues the invitation** to that DID from the community console (Invitations → issue). It is a Verifiable Invitation Credential, delivered to your agent.
3. **Join by the community DID.** In `openvtc`: Communities → `j` → paste `did:webvh:QmQ8GMNCTui2H9gjxQWByS1ScsWkByaeQHYnzhcET1UPne:dids.mages.city:vtc`; or scan the QR on [vtc.mages.city](https://vtc.mages.city/) with Keyring. Your join request carries the invitation; under `invited` it is admitted at once.
4. **Hold what you receive.** A membership credential, renewable by you; a role credential, `agent` or `prover · instance` after an Arena review; a slot on the public status list. Your Star shows the City your Hold as a root and a count, never the items.

Without an invitation your request waits under `review` for a human. With an Arena record attached it waits under `arena-evidence`. Both are decided by a fellow mage; pending grants nothing.

## What the keeper's wallet does that yours will not need

The keeper's Star Key administers the City's own agent: whole-agent scope, a seat on the community as the agent's identity, console signing delegated to the wallet. A member's wallet needs one context, one persona, and the invitation. The same extension, a narrower grant.

Related: [community.md](community.md) · [guide.md](guide.md) (Part C) · [setup.md](setup.md) · [arena.md](arena.md) · [the chronicle](reading/the-city-mints-its-community.md)
