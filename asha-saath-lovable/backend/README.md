# Local application API and database

This is the working **synthetic demonstration backend**, imported alongside the Lovable application. It uses Node 24's built-in HTTP and SQLite modules; no backend package installation is needed. The provisioned Lovable/Supabase Cloud database has not been connected or migrated by this implementation. SQLite is the actual database serving the local app.

Run from the application directory:

```powershell
node backend/server.mjs
node --test backend/http.test.mjs
```

The API listens on `127.0.0.1:4318`. Configure the frontend's `/api` development proxy to this address. `ASHA_API_PORT` and `ASHA_DB_PATH` optionally override the port and SQLite filename. The default database is `backend/data/asha-saath.sqlite`; its WAL sidecars and session records stay in that ignored directory. Do not include the database in the source ZIP.

## API

| Request | Result |
|---|---|
| `GET /api/session` | Current session or `null`, plus the preapproved synthetic account catalog |
| `POST /api/session` with `{actorId}` | Rotated opaque HttpOnly cookie; current authorized state and version |
| `POST /api/mobile/session` with `{actorId}` | Native opaque bearer token, current authorized state/version and expiry; does not set a browser cookie |
| `POST /api/session/logout` | Deletes the supplied bearer session or the browser cookie session; cookie transport also clears the cookie |
| `POST /api/mobile/session/logout` | Deletes the explicitly supplied native bearer session without clearing a website cookie |
| `GET /api/state` | Authorized state projection, global version and session; requires a session |
| `POST /api/commands` with `{name,args,expectedVersion?,idempotencyKey}` | Applies a validated command in a database transaction and returns the authorized current projection |
| `GET /api/health` | Nonidentifying backend status |

Every POST requires `Content-Type: application/json` and `X-ASHA-Client: 1`. Website requests use the same-origin development proxy and cookie. There is no permissive CORS policy; browser cross-site mutations are rejected, including native-session endpoints. Responses use `private, no-store` and `Vary: Cookie, Authorization`. Only the explicit native login response exposes its newly issued bearer token; website session/state/command responses do not return tokens.

`args` is a positional array matching the original application's command functions. Client actor labels are discarded. CSV rows are reconstructed from their raw columns and validated again. Plans are recomputed from the server's tasks and validated planning parameters; submitted stops/totals never become authoritative.

## Identity and permissions

The account catalog contains the fictional coordinator, two assigned ASHAs and three provider branches. Selecting an account **explicitly signs into a preapproved synthetic account**, creates a server session and invalidates that browser's previous session. A role label or request-provided organization does not authorize a command. This open demonstration login is intentionally accessible for hackathon testing; it is not password/OTP authentication or a production identity system.

## Separate Android application session — 9 October 2026

The Android client uses the same authoritative database and command policy through a separate native session transport. Login is `POST /api/mobile/session` with the sole body field `{ "actorId": "ASHA-DEMO-01" }`. The result is:

```json
{
  "token": "<64 lowercase hexadecimal characters>",
  "session": { "actorId": "ASHA-DEMO-01", "role": "worker", "label": "Demo rural ASHA" },
  "state": "<the authorized state projection>",
  "version": 1,
  "expiresAt": "<Unix timestamp in milliseconds>"
}
```

The shown `state`/`expiresAt` placeholders describe their shape; actual state is an object and expiry is a number. The session object is the existing server-derived actor record, including any server membership fields. The random token lasts **12 hours** and only its SHA-256 hash is persisted in the existing SQLite `sessions` table. Native login never sets or exposes the website's HttpOnly cookie. A current explicit bearer on native login rotates that bearer; an unrelated website cookie remains usable.

The client supplies `Authorization: Bearer <token>` to `GET /api/session`, `GET /api/state`, `POST /api/commands` and logout. The exact header syntax requires `Bearer ` followed by 64 lowercase hexadecimal characters. A supplied bearer takes precedence over a cookie. A malformed, unknown, revoked or expired bearer cannot fall back to a valid cookie; session/state/command requests return `401`. With no supplied bearer, the website retains its existing cookie behaviour, including `GET /api/session` returning `session: null` when signed out.

Both logout routes accept a bearer and delete only that token's session without changing the website cookie. `/api/mobile/session/logout` with no bearer is an idempotent signed-out response and does not consume a cookie. The native app must retain its token in device SecureStore, clear account state on logout/401 and configure its reachable backend origin; this backend extension itself does not implement device storage, offline synchronization or production identity. Origin/request-header checks, scoped reads, expected versions, idempotency and transactional command guards apply equally to both clients.

Workers receive only their assigned tasks/plans/needs. Providers receive `state.providerRows` with current recipient-granted referral details; raw tasks, plans, visits, needs, consents and attempts are empty. Withdrawn/expired/closed referral receipts have no locality, preferences or delivery details. Resource units for a provider's own offer are aggregated by held state, without reservation/attempt identifiers, to calculate occupied capacity. Clinical escalation and joint work cannot be completed through the routine visit command.

## Cash support and case communication — 9 October 2026

The user selected the **demo funding flow first**. This backend persists cash-support coordination, fictional NGO budget declarations and in-app case messages. It does not transfer money, hold donations, verify a bank balance or contact a real NGO. Read [funding/communication contract](../../docs/FUNDING_AND_COMMUNICATION.md) and [support verification](../../docs/NGO_SUPPORT_REVIEW_2026-10-09.md).

| Commands | Authorized behaviour |
|---|---|
| `requestFunding(needId, providerId, purpose, requestedRupees, reason, permission)` | Assigned worker/coordinator creates a request for a covered locality with a separate named-recipient funding grant; whole INR from 1 to 100000 |
| `decideFunding(id, approved, approvedRupees, reason)` | The recipient NGO approves/reserves up to the requested amount or declines; free budget is checked within the transaction |
| `updateFundingBudget(totalRupees)` | The NGO updates its own synthetic total; it cannot undercut reserved or confirmed-used allocations |
| `reportFundingPayment(id, reference, note)` | The NGO records an external assistance claim, awaiting independent confirmation; this command performs no transfer |
| `confirmFundingReceipt(id, receivedRupees, note)` | Assigned worker/coordinator records the person's answer; a mismatch remains disputed |
| `closeFunding(id)` | Coordinator closes only after permitted full receipt confirmation |
| `withdrawFunding(id)` / `cancelFunding(id, reason)` | Authorized withdrawal/coordinator cancellation ends the grant; unused allocation releases, reported allocation remains held |
| `reconcileFunding(id, usedRupees, note)` | Coordinator records a verified used amount for a withdrawn/cancelled held allocation; releases the remainder without restoring NGO access |
| `sendCaseMessage(threadKey, text)` / `markCaseRead(threadKey)` | Currently authorized case participant sends a 1–1000-character in-app message or marks visible messages read |

Funding follows `REQUESTED → APPROVED → PAYMENT_REPORTED → RECEIVED → CLOSED`, with decline, dispute, withdrawal and cancellation branches. One active funding request per need is enforced through a partial unique index; the same `BEGIN IMMEDIATE` transaction updates state, budget calculations, normalized funding rows, audit and idempotency. Budget totals are exposed as authoritative `fundingAvailability` values: total, held, used and available.

Worker/coordinator projections contain only their authorized full `fundingRequests`. Provider projections leave that array empty and use recipient-specific `fundingRows`, the provider's own budget totals and authorized case threads/messages. Ended grants produce a minimal `ACCESS_ENDED` receipt without purpose, locality, reason, amount, payment, confirmation or history. Worker identifiers and other accounts' read-receipt identifiers are sanitized from provider messages. Retrying an earlier command cannot restore revoked details.

Threads use `funding:<fundingId>` and `referral:<attemptId>`. Message authorization is rechecked against the current funding/referral grant on every read and command. A message does not change case state, accept funding or substitute for permission. Withdrawal from the original document-help need also ends associated funding grants and provider message access, even when that document case was already closed; its prior closure is preserved and a privacy-withdrawal marker blocks fresh grants on that need.

Existing SQLite state receives a versioned additive migration for funding budgets/requests and messages. The migration preserves earlier task, plan, referral, consent and session data. Runtime-generated modules and database/session files remain outside source packaging.

## Database integrity

`BEGIN IMMEDIATE` encloses the current-state read, session-derived command policy, predecessor/recipient/catchment/freshness checks, free-capacity check, reservation, state transition, normalized integrity tables, audit and idempotency record. The SQLite write lock serializes independent clients. A partial unique index enforces one active attempt per need; a unique allocation index enforces one reservation per attempt. Capacity decreases cannot undercut held, committed or reconciliation units.

Provider reports remain `DELIVERY_REPORTED` until a worker/coordinator records the person's independent decision. Every new nomination, including the same provider again, supersedes the prior permission and clears the current grant. A refusal cannot reactivate an old grant through rematching. Withdrawal immediately ends provider reads/actions. Unused capacity is released; reported supply stays held for coordinator reconciliation. Idempotent retries recheck current permissions and return a fresh authorized projection, preventing a previously cached response from restoring withdrawn access. The optional expected version detects stale edits; state guards remain required even when it is absent.

Arrangements are checked against the selected offer's actual delivery capability and the person's stated help preference. Remote offers accept only coordinator-relayed phone assistance. Local offers accept only help-desk or accompanied home-visit methods. A mode mismatch remains unavailable for automatic offering until the preference/service is reviewed; it cannot become a valid arrangement by changing a browser dropdown.

The original generated state machine was copied into `domain.ts`. The startup compiler recreates `backend/runtime` from the actual frontend CSV/planner/fixture/time modules using Node's native TypeScript stripping. This preserves the same declared scheduling algorithm and approved fixture inputs. The runtime directory is generated and ignored.

## Verification and limits

`http.test.mjs` tests real HTTP requests with separate cookie actors: assignment and organization denials, unknown membership, role forgery, origin rejection, cookie rotation/logout, private caching, a concurrent last-unit acceptance race, idempotency conflicts/replay/revocation, stale versions, independent confirmation, database restart persistence, withdrawal resource handling, server recomputation and recipient changes/expiry.

The latest suite passed **19/19 real HTTP/SQLite tests** on 9 October, including the prior 15 funding/referral tests and four native-session scenarios: hashed persistence and restore across SQLite restart, independent website-cookie retention, native rotation/expiry/logout, strict bearer precedence and malformed-header denial, assignment/recipient checks, actor forgery and unchanged cross-site/request-header rejection. A separate earlier [isolated independent funding audit passed 8/8](../../output/verification/ngo-support-independent-2026-10-09/audit-results.json). These are synthetic runtime checks; direct browser funding/message evidence is recorded separately in the support review and Android device execution is a separate frontend check.

The backend is local and synthetic. No live NGO, government record, OTP, payment, clinical rule approval, cross-district tenant, offline synchronization or Supabase RLS integration is claimed. A real pilot needs approved identity provisioning, partner agreements, a reviewed production data host and the security/privacy work listed in the project specifications.
