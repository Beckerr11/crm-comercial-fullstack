# CRM refresh progress

Scope: CRM first; other three projects remain separate upcoming work.
Authorization: user approved proposal and implementation with “pode fazer”. Execute inline.
Ruling: isolated local clone on codex/crm-product-refresh; no shared checkout or remote edits.
Ruling: use MongoDB native driver with one aggregate document and CAS instead of multi-document transaction requirements. Sessions/accounts are separate. This keeps atomic domain updates and works on standalone MongoDB.
Ruling: Docker daemon unavailable. Use mongodb-memory-server to launch real local mongod for tests and persistent development path, not an in-memory JavaScript store.
Ruling: operational CRM uses warm light background and deep green for reading/forms; the chosen portfolio remains dark. No decorative terminals or fake business metrics.
Task 1: complete. Domain tests observed red then green; MongoDB CAS, snapshots, limits and state transitions implemented.
Task 2: complete. Session/CSRF/isolation/share tests pass. Actual MongoDB restart exposed journal durability issue; writeConcern j:true fixed it and restart test passed.
Task 3: complete. E2E observed red for missing flow, then label/mobile bugs, then 2 green browser tests including independent public decision.
Task 4: complete locally. Final suite:15 Node tests,5 browser tests,lint,format,build,audit(0 reported) pass. Local production smoke verifies routes/secure-cookie flags. Independent reviewer fixes reproduced red then green and rechecked. Screenshots/README/case/CI written. No remote CI run or deployment.
Final: public release remains pending Node hosting, MongoDB production configuration and HTTPS verification. Other selected projects were not implemented in this CRM plan.
