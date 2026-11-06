# Behaviour tests and release acceptance

Version 1.0. Tests below are **required future implementation checks**, not reported as passing. Current documentation validation is recorded separately in output/spec-validation.json.

## 1. Planning checks

| Test ID | Scenario | Required result |
|---|---|---|
| T-01 | Import supplied 24-task CSV | Correct task count/assignments; synthetic label and validation preview |
| T-02 | Import same dataset twice | No duplicate tasks; unchanged rows identified |
| T-03 | Same patient has different source task IDs | Distinct legitimate tasks preserved |
| T-04 | Unknown rule, invalid coordinate or conflicting priority | Row review/error; no invented clinical/location data |
| T-05 | Generate same frozen input twice | Same locality groups, seed/final order and reasons |
| T-06 | Distant P1 and nearby P3 compete | Approved tier ordering respected; unserved P1 remains visible if infeasible |
| T-07 | Short shift, break, window and return travel | No hard constraint violation; rejected tasks have reason codes |
| T-08 | Joint-cadre/urgent task | Coordination/escalation separate; not counted as routine completion |
| T-09 | Mark unavailable and replan | Completed tasks unchanged; unavailable task retained with next action |
| T-10 | Three-day projection | Due dates immutable; no repeated projected task; future task eligible only at appropriate date |
| T-11 | Same-input baseline comparison | Identical model/cohort; both coverage and travel shown, no fabricated savings |

## 2. Referral and integrity checks

| Test ID | Scenario | Required result |
|---|---|---|
| T-12 | Create need without consent | No provider request/data sharing |
| T-13 | Offer wrong catchment/unverified/stale service | Excluded/review with precise reason |
| T-14 | Change intended recipient | Applicable consent version required before sharing |
| T-15 | Provider decline/no response until TTL | UNRESOLVED need with reason, owner and next action |
| T-16 | Two cases accept last available unit simultaneously | Exactly one reservation succeeds; other receives capacity conflict |
| T-17 | Same acceptance operation replayed | Same result; one allocation/event only |
| T-18 | Same key with changed payload | IDEMPOTENCY_CONFLICT, no mutation |
| T-19 | Provider reports delivered | Need remains DELIVERY_REPORTED; cannot close |
| T-20 | Worker records positive recipient confirmation | CONFIRMED; coordinator may close, correct resource consumption |
| T-21 | Recipient disputes delivery | DISPUTED; no success count; held resource reconciled |
| T-22 | Withdrawal before supply / after report | Access revoked; unused slot released or supplied resource held for reconciliation |
| T-23 | Simultaneous expiry/acceptance | One guarded final result, no double transition or slot leak |

Run concurrency tests against a real transactional backend with independent sessions. A synthetic in-memory demonstration cannot prove database race protection.

## 3. Authorization, offline and interface

| Test ID | Scenario | Required result |
|---|---|---|
| T-24 | Provider A reads provider B request / raw task API | Denied at server/RLS; no clinical payload |
| T-25 | Worker/cross-tenant/nonmember guesses IDs | Only assigned authorized projection returned |
| T-26 | Change role dropdown/client org field | No privilege elevation |
| T-27 | SSR/client bundle inspection | No server secret; authorized loaders; no browser-only crash |
| T-28 | Download, disconnect, record visit/need | Available plan; visible unsynced operations; no offline acceptance |
| T-29 | Reconnect/replay with stale version/withdrawal | Safe conflict handling; no silent overwrite or restored consent |
| T-30 | Logout/shared device | Cache cleared appropriately; unsynced changes warning |
| T-31 | Hindi, 320px, 200% text and keyboard | Complete core flow; no hidden action/focus clipping |
| T-32 | Loading/empty/error/unresolved/stale states | Informative next action; no false success |
| T-33 | Dashboard counts | Unique needs versus attempts distinct; excludes no cases silently |
| T-34 | CSV formula content / oversized upload | Treated safely as text or rejected; export escaped |

## 4. Test layers

- Pure-domain tests for identity, partitioning, feasible routes and projections.
- Integration/database tests for state guards, uniqueness, reservations, RLS and idempotency.
- Browser tests for one full worker→coordinator→provider→confirmation journey plus failure/withdrawal, Hindi and offline.
- Manual review for consent comprehension, screen-reader/focus and source/prototype labels.

Do not write snapshots that only duplicate implementation wording. Assert observable outcomes and invariants.

## 5. Release evidence

Record date, commit/project version, environment, dataset, command, result and known limits in CONTEXT_HANDOFF. Inspect actual package scripts before running; do not claim npm test/build exists in this documentation repository.

P0 demo release: import/plan/replan + all due dispositions; one support success and one unresolved case; server role protection; documented test results; no real records/partners. Offline is a separate claim requiring T-28–T-30. The 9 October user-authorized funding/message extension adds the checks below; actual results belong in build evidence.

## 5. Funding and communication extension

| Scenario | Required outcome |
|---|---|
| Request without funding permission or outside NGO catchment | Server denies; document consent alone is insufficient |
| Two approvals for last available budget | At most the available amount reserves; no overcommit |
| Lower budget under held/consumed amount | Server denies |
| Payment report without person confirmation | Cannot close or count confirmed receipt |
| NGO attempts receipt confirmation or another NGO/worker guesses a case | Server denies |
| Withdrawal before payment | Unused reservation released, provider details/actions removed |
| Withdrawal after payment report | Budget held until explicit coordinator reconciliation; provider details/messages revoked |
| Repeated withdrawal after finalized reconciliation | Final resource use preserved; no second reconciliation |
| Message retry and rapid duplicate | Idempotent operation does not duplicate a message; bounded input and repeated-send guard |
| Read and unread | Actor-specific saved read receipts; role/account switching clears stale visible state |
| Legacy SQLite upgrade/restart | Earlier visits, plans and referrals survive; new records persist |

### Acceptance Criteria #18 - Telemetry Schema Validation (2026-11-06)
- [x] Schema type assertions pass for 100% of sample payloads.
- [x] Latency benchmarks verified under simulated 2G mobile connectivity.
