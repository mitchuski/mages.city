# city_mage claims

Numeric authority: `frontier.json`. Sources resolve through `SOURCES.md`. The evidence is a local, primary-authored integration baseline, not an independent held-out or paired run.

| id | claim | tier | enforced by | evidence | status |
|---|---|---|---|---|---|
| CR-CITY-001 | The latest recorded fixed local check set and current-framework instance conformance passed at its pinned source state. | PROVEN | code | frontier.json latest.run; runs/<latest.run>/receipt.json and source/output files | local-only |
| CR-CITY-002 | Scheduler fixtures exercise cached-receipt revalidation, pending-effect reconciliation, context binding and atomic checkpoint conflict handling. | PROVEN | code | setup.test.mjs; latest run setup.stdout.txt | fixture-scope only |
| CR-CITY-003 | The entry-kit machine manifest is an exact copy of the instance manifest at the latest passing baseline. | PROVEN | code | run.mjs reading-link/manifest check; latest receipt | local-only |
| CR-CITY-004 | Live VTA setup, actual MyTerms/TSP, task execution, website projection and remote memory retention can be connected through trusted adapters. | OPEN | nothing | runtime.json missingAdapters; README.md next connection | adapters required |
| CR-CITY-005 | Isolated Soulbis/Soulbae execution can validate improvements under an independently governed witness bank. | OPEN | nothing | harness.config.mjs currently throws for paired prompts | paired execution not connected |

The initial conformance failure is retained at `runs/2026-09-07T21-16-29-930Z-f38552/`: `conformChecks` was a function where the framework expected an iterable. Local process passes did not override that failure. The corrected hook is an array. No frontier improvement, credential or live access is claimed.
