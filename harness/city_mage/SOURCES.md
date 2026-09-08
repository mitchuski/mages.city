# Evidence sources

- Framework: sibling `dual-agent-harness/SUPERSEDED.md` if present is not assumed; inspected migration authority is `agentprivacy-dual-agent-harness/SUPERSEDED.md`, pointing to `dual-agent-harness`.
- Framework gates: sibling `dual-agent-harness/engine/conform.mjs`, `GROUND_RULES.md`, `TRUSTS.md`, `seats/keystone.md`. Framework numbers are not privacy measurements.
- City sources: `../../site/skill.md`, `../../site/city-key-arrival.md`, `../../portal/promise-graph.cjs`, `../../gate/permissions.mjs` and their tests.
- Journey: sibling `agentprivacy-mcp/lib/journey.mjs`, `test/journey.test.mjs`, `test/browser-journey.test.mjs`; actual browser libraries are source-pinned by the runner.
- Carrier: sibling `spellweb/src/lib/cityKey.ts`, `proofPackets.ts` and `scripts/journey-roundtrip-check.mjs`.
- Planned orb reuse: sibling `spellweb/src/components/WanderingOrbs.tsx`, `agentprivacy_master/src/components/training/DualOrbs.tsx`, `OrbControlPanel.tsx`, `src/lib/orb-loadout.ts`.
- Every run records exact SHA-256 source observations in `runs/<id>/sources.json`; process outputs and receipts are adjacent. Source drift invalidates the baseline. These are reproducibility receipts, not signatures or a hermetic build environment.
