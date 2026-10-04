# Server command and query contracts

Version 1.3 · Names below are logical target contracts. The actual local HTTP endpoints and envelope are documented in [backend/README](../asha-saath-lovable/backend/README.md): `/api/session`, `/api/state`, `/api/commands` and `/api/health`. SQLite transactions implement the current adapter; the PostgreSQL/TanStack wrappers below remain a future deployment design.

For a future hosted PostgreSQL adapter, use authenticated **TanStack Start server functions/server routes supported by the generated project** as wrappers around domain services and database transactions. Preserve the platform's generated configuration and the tested local domain meanings. Do not treat the open fictional demo account catalogue as production identity provisioning.

## 1. Shared envelope

```json
{
  "requestId": "client-generated-uuid",
  "idempotencyKey": "stable-operation-uuid",
  "expectedVersion": 3,
  "payload": {}
}
```

The server derives actor, tenant, role and organization from authenticated membership. Ignore caller-supplied authority claims. Mutations require a validated input, current authorization, allowed state and domain guards. GET/read-only queries do not transition state.

Response:

```json
{
  "ok": true,
  "data": {"entityId": "uuid", "version": 4},
  "requestId": "uuid",
  "replayed": false
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "CAPACITY_CHANGED",
    "messageKey": "errors.capacityChanged",
    "retryable": false,
    "fieldErrors": []
  },
  "requestId": "uuid"
}
```

No raw SQL, secrets or clinical data in errors. A query pagination cursor is opaque and tenant-bound.

## 2. Queries

| Query | Input | Output / authorization |
|---|---|---|
| getSessionContext | None | Authorized role/capabilities/geography and synthetic mode |
| getCaseload | worker/date/filter/cursor | Assigned/authorized task projection, counts and rule source |
| getDailyPlan | worker/date/version? | Ordered stops, reasons, dispositions and freshness; private no-store |
| getCoverageProjection | authorized config/date horizon 1–7 | Preview only; no task date/status mutations |
| getNeed | needId | Role-scoped state/timeline/consent summary and allowed actions |
| listEligibleOffers | needId | Eligible/review/excluded offers with reasons and freshness |
| listProviderRequests | cursor/status | Current organization-scoped referral projection |
| getCapacity | offer/window | Current units, held/consumed summary and server timestamp |
| getRecoveryQueue | assigned geography/status/age | Coordinator-owned next actions |
| getReports | fixed cohort/date/filters | Counts with denominator and simulation labels |

Queries remain server-authorized even when a browser hides the link.

## 3. Mutation catalogue

| Command | Input / actor | Result / guards |
|---|---|---|
| previewImport | file rows/source dataset; coordinator | Accepted/review/error rows + preview hash; no task mutations |
| commitImport | preview hash/approved row IDs; coordinator | Atomic approved import; conflict checking and audit |
| generatePlan | worker/date/config; coordinator | Pure preview + input hash and every disposition |
| savePlan | validated preview/input hash; coordinator | New plan version, guarded against changed inputs |
| recordVisit | task/outcome/capture time/reason; assigned worker | Visit event + task state; cadre checks; duplicate safe |
| replanRemaining | plan/current time/location; authorized actor | New remaining preview; completed visits preserved |
| createNeed | visit/category/locality/preference; assigned worker | DRAFT or CONSENT_REQUIRED; no provider sharing |
| recordConsent | need/purpose/fields/recipient/text version/decision; permitted recorder | New immutable consent version; READY_TO_MATCH if adequate |
| offerReferral | need/offer/consent/TTL; coordinator | OFFERED attempt; one active attempt; live catchment/verification checks |
| acceptReferral | attempt/capacity window; assigned provider | Atomic acceptance/reservation; units not client-chosen |
| declineReferral | attempt/reason; assigned provider | DECLINED + UNRESOLVED need + next action owner |
| arrangeService | attempt/mode/time window; provider or assigned coordinator | ARRANGED; current consent and valid accepted allocation |
| reportDelivery | attempt/supplied time/structured outcome; provider | DELIVERY_REPORTED; cannot close |
| confirmReceipt | attempt/person decision/capture time; authorized worker/coordinator | CONFIRMED or DISPUTED; provider cannot invoke |
| closeNeed | need/confirmation reference; coordinator | CLOSED only after positive confirmation |
| withdrawConsent | consent/need/reason?; permitted assisted recorder | Immediate server access revocation; cancel active attempt; release or reconcile capacity |
| resolveDispute | need/outcome/confirmation/evidence reference; coordinator | Guarded CONFIRMED or UNRESOLVED; resource reconciliation |
| expireOffer | attempt/server time; job/coordinator | EXPIRED if genuinely eligible; duplicate safe |
| updateCapacity | offer/window/total/freshness; provider scoped | New version; cannot reduce below held/consumed |
| verifyService | offer/evidence/catchment; coordinator | Verification status and review date; not blanket government endorsement |
| setRecoveryAction | need/owner/action/due; coordinator | Explicit ownership without forging fulfillment |

The local synthetic funding and communication commands are defined in [the current extension contract](FUNDING_AND_COMMUNICATION.md). They use the same scoped HTTP/SQLite command boundary. No money-transfer API is connected.

## 4. Acceptance transaction example

```text
acceptReferral(attemptId, capacityWindowId, expectedVersion, idempotencyKey)
  authenticate actor and derive provider membership
  look up identical prior operation; reject payload mismatch
  begin transaction
  lock need -> attempt -> capacity window in consistent order
  verify membership, consent grant, status, TTL, catchment and verification
  verify offer matches capacity window and current availability freshness
  verify free units >= server-calculated units_per_case
  insert reservation; update attempt and need versions/status
  append audit event; persist idempotent response
  commit
  return persisted response; then notify interested authorized clients
```

If a lock/unique conflict occurs, translate to a safe domain error; do not retry a different allocation silently. No HTTP notification inside an open database transaction.

## 5. Error codes and UI handling

| Code | Meaning | UI |
|---|---|---|
| VALIDATION_ERROR | Invalid field/row | Inline errors + summary; preserve input |
| UNAUTHENTICATED | Session required/expired | Sign-in; no private payload |
| FORBIDDEN | Actor lacks relationship/capability | Access denied; no entity existence leak |
| VERSION_CONFLICT | Current version differs | Show refresh/resolve and retain draft |
| IDEMPOTENCY_CONFLICT | Key reused for different payload | Stop replay; generate corrected distinct operation |
| INVALID_TRANSITION | Predecessor state disallows action | Reload allowed actions |
| CONSENT_REQUIRED | Missing/expired/wrong recipient scope | Return to permission review |
| CONSENT_WITHDRAWN | Sharing revoked | Withdrawn state; block actions |
| OFFER_EXPIRED | Acceptance deadline passed | Recovery owner and alternatives |
| CAPACITY_CHANGED | Insufficient current units | Refresh; no accepted UI |
| CAPACITY_STALE | Availability validity ended | Reconfirm capacity |
| CATCHMENT_MISMATCH | Service does not cover need area | Exclusion reason |
| ELIGIBILITY_REVIEW | Required facts unresolved | Coordinator review |
| RULE_REVIEW | Unknown/unapproved clinical rule | Planning review queue |
| OFFLINE_UNSUPPORTED | Action requires server transaction | Save permitted draft or reconnect |

## 6. Offline replay

Queue operation has UUID, command, minimal payload, expectedVersion, capturedAt and retry metadata. Only permitted visit/need/consent capture commands enter the queue. Provider reservation cannot.

Reauthenticate on reconnect; replay unchanged operation with same key; resolve version/permission changes individually. Never rewrite a past capture timestamp as receipt time. Server clocks decide TTL/capacity validity. Keep unsynced versus synchronized state visible.

## 7. Implementation checks

Inspect actual generated framework APIs before implementing wrappers. Use a typed validation library already supported by the scaffold if available; centralize schemas. Check database/RLS and server behaviour with different authenticated users. Do not present these contract names as available integrations to RCH, U-WIN, Darpan, ABDM or real NGOs.
