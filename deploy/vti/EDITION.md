# Mages City edition of OpenVTC

Working implementation plan, 23 September 2026. This is the current integration entry point under `deploy/`. The earlier deployment proposals remain historical inputs; their unverified commands and status claims are not deployment evidence.

See [the three-lane plan](LANES.md) for upstream contributions, City experiments and the Star interface roadmap.

## Boundary and ownership

Mages City operates a community using OpenVTC. The Star stays in our own projects. A successful admission must work with upstream clients before any Star presentation is attached. City-specific policy, branding, wiki publication and agent workflows belong here; reusable protocol fixes and operator documentation belong upstream.

The edition starts as configuration and integration around upstream services. It does not require a permanent source fork of every component. Members bring their own VTA; the community still needs its own trust infrastructure and operator credentials. Hosting other members' keys is not part of this implementation.

| Existing project | Responsibility | Contribution boundary |
| --- | --- | --- |
| `mitchuski/mages.city` | Front, Portal, Hall, Exchange, deployment and City policy | Keep City content and policy here |
| `mitchuski/star-key` | Browser-plugin-derived wallet experiment, upstream remote configured | Star panes, Hold and geometry remain downstream |
| `mitchuski/star` and related agentprivacy projects | Star presentation and research | Optional credential consumers; no upstream dependency |
| `mitchuski/vti-setup` | Actual GitHub fork for contribution branches | Generic operator instructions and setup checks |
| `OpenVTC/verifiable-trust-infrastructure` local checkout | Services, SDKs, PNM and CNM | Clean upstream-based branches for reproducible defects |
| `OpenVTC/openvtc` | CLI/TUI | Clean local checkout at `~/openvtc/openvtc`, tracking `upstream/main` |

GitHub reports `star-key` as a standalone repository rather than a GitHub fork, despite its upstream ancestry and remote. Do not replace it or treat its entire diff as an upstream contribution.

## Evidence and repeatable inventory

Run from the City repository with Node 22+ and Git:

```sh
node bin/openvtc-status.mjs
node bin/openvtc-status.mjs --online --json
```

The default checks local checkout revisions, branches and dirty state. `--online` makes bounded, unauthenticated GET requests to the public endpoints in `edition.json`. It makes no configuration, account, key, policy or membership changes. Exit zero means the diagnostic ran; it is not a deployment acceptance check. Service root responses, including 404, are transport observations only. A matching front-page marker establishes front content, not a working community. Missing network access cannot establish that a service is globally down.

`edition.json` records component ownership, expected public endpoints and explicit unverified acceptance items. Its observed checkout revisions are not compatible release pins. Only record a tested release lock after the end-to-end exercise below succeeds. Never place keys, tokens, claim codes or private applicant evidence in this inventory.

Measured on 23 September: the front answered HTTP 200; `vtc.mages.city` failed DNS resolution from the contributor machine. The historical load-balancer target `lb.firstperson.dev` also failed DNS resolution. The farm portal `/api/health` returned its HTML application shell, not a health payload, so that response cannot establish backend health. The user confirmed that the earlier subdomain and hosting work was exploration, not an established deployment. Existing documents conflict about the Hall's hosting and the farm's status, so neither is promoted to verified here.

## First complete journey

| Stage | Work | Acceptance evidence |
| --- | --- | --- |
| 1. Establish the deployment | Choose a test deployment and identify its community VTA, VTC, mediator and DID host; use the earlier exploration as reference | Operator confirms host/control, public DIDs resolve to the intended deployment, selected binary versions and features recorded |
| 2. Bootstrap the community | Follow the selected revision's VTC setup and community creation flow; configure operator access and restart persistence | Community DID resolves, operator can administer its context, services survive restart |
| 3. Admit one synthetic participant | Participant brings a separate VTA/persona; submit supported join evidence; human reviews and approves under a tested City policy | Pending request grants no membership; approval issues the expected membership credential to the intended subject |
| 4. Verify independently | Use the upstream client/verifier to check issuer, subject, proof, expiry and credential status | Genuine credential succeeds; altered proof, wrong subject, expired and revoked cases do not grant access |
| 5. Attach City presentation | Publish the minimum approved membership view to the Hall and front | Publication follows confirmed issuance, is retry-safe and cannot itself authorise admission; unavailable status remains unknown |
| 6. Exercise departure and recovery | Revoke/remove the test member, retry any interrupted publication, restart services | Loss of membership is reflected; stale City pages do not preserve access; retry does not duplicate admission |
| 7. Optional Star integration | Let Star consume credentials through existing interfaces | The same admission remains usable with upstream clients alone |

Record command versions, synthetic identities, expected and observed results, and redacted failures for every stage. Verify commands against the selected revision before executing them. Bootstrap, policy uploads and admission are mutations; the status tool performs none of these.

## Implementation sequence

1. Foundation: inventory, status tool and this plan (built locally in this change).
2. Choose hosting and confirm operator access. Earlier subdomains were exploratory; recovering a historical Full Stack claim is optional, not a prerequisite. Check for any existing identities before minting new ones.
3. Select compatible upstream releases and execute stages 1–4. Read `docs/03-vtc/getting-started.md`, `non-interactive-setup.md`, `community-lifecycle.md` and the applicable specification at that revision. The old `cnm`-only bootstrap outline is not a tested recipe.
4. Document the successful generic bootstrap in `vti-setup/community-manager/01-bootstrap-vtc.md`. It remains a stub on upstream at this inspection. Submit a small issue/proposal and a tested guide, with City-specific policy retained here.
5. Implement the City admission adapter after observing the actual request, approval, issuance and status contracts. It records request identifiers and publication receipts; it does not implement its own issuer, transport, credential format or trust-task dialect.
6. Complete departure/recovery, then attach the existing Star work without moving it upstream.

The agent-only admission rule and the mapping between an AgentCard and a VTA persona need explicit acceptance cases. A submitted label, matching display name or City Key is not proof of control of a persona. Decide the binding using supported upstream mechanisms; do not invent a signed claim format as a shortcut. Human operator identities and agent membership are separate policy concerns.

## Upstream contribution queue

| Item | Current evidence | Next action |
| --- | --- | --- |
| [Setup PR 42](https://github.com/OpenVTC/vti-setup/pull/42) | Open, DCO passed; no review at inspection | Address review; establish actual lint results before describing CI as green |
| [Setup PR 43](https://github.com/OpenVTC/vti-setup/pull/43) | Open, DCO passed; no review at inspection | Review release-guard lifecycle against maintainer feedback; merging does not publish the missing release |
| Community bootstrap guide | Upstream page still has placeholder sections | Derive instructions from stages 1–4, including verification and restart behaviour |
| Admission/credential regression | No new defect demonstrated yet | Reproduce against current upstream with synthetic data before proposing a fix |
| VTI 1651 / 1652 | Both now closed | Retire earlier recommendations; read landed work before choosing another issue |

Use one branch per upstream problem, based on current upstream, in an isolated checkout. Sign off commits and follow the repository's current contribution requirements. No Star files, City branding, private configuration or unrelated local work in upstream diffs. A City edition branch is warranted when an actual source patch must be carried; until then upstream binaries plus configuration avoid unnecessary divergence.

## Maintenance and release evidence

For each edition release record: source commit for the City integration; immutable upstream tags/commits; binary/platform/feature set and verified provenance; configuration/policy revision; the end-to-end test record; and the last tested rollback target. Do not equate a local SHA, a file size, or an HTTP 200 with an authenticated release.

Upstream updates should be tested in isolation against the complete admission/revocation journey before promotion. Existing working trees have unrelated edits; keep them intact. Pushing City `main` may deploy the public front, so contribution work uses separate branches/worktrees.

Historical correction: the setup script's recorded `febbed32...ce831` digest was a CRLF Windows working-file hash. The inspected upstream Git blob has SHA-256 `c59f53c74f423327a233bb3178651bf7958449efd88df05df8c2f8d179db1340`. That explains the mismatch; it does not authenticate any future download or make an unpublished release available. Recheck the chosen release and provenance at deployment time.

