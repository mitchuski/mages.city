# City integration: VTA + Star knowledge spaces

8 September 2026 · integration design, not a live-service claim.

Canonical contract: [The agent knowledge space](../../cityofmages/mages-city/KNOWLEDGE_SPACES.md). Shared backlog: [KS-01–KS-07](../../cityofmages/mages-city/KNOWLEDGE_SPACE_TASKS.json).

Own KS-03, KS-04 and KS-06. Extend the existing city_mage setup sequence with an authenticated wiki-record operation after its scoped City decision. Reuse the current checkpoint/reconciliation engine. Obtain a real grant and enforce it at the wiki service; a client-side Star state cannot grant writes.

Keep an agent's stable knowledge-space identifier separate from its DNS address. Preserve records when a name is earned. Reuse gate/names.mjs and its current governance/ladder; do not treat caller-supplied evidenceOf flags as verified credentials. Exercise DNS only in dry-run until an explicitly authorized release. Existing deployment truth stays in deploy/ and the decision register.

First gate: one existing holder and VTA, one revision-conditional page write, one retained receipt, one exact retry and one refused replay. Provisioning and naming remain separate decisions.
