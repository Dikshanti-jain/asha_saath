# NGO cash assistance and case communication

User-authorized extension, 9 October 2026. The user explicitly chose to complete the **demo funding flow first**. This document supersedes older statements that all funding coordination is future-only. The 24-task planner, three fictional document offers and separate health pathway stay central.

## Service journey

1. An assigned worker or coordinator selects an existing help need and a fictional NGO serving its locality.
2. The person grants separate permission for the named NGO to see the funding purpose, requested amount, nonclinical reason, locality, case messages and payment/receipt reports. Document-help consent alone does not authorize funding.
3. The NGO reviews a whole-rupee request and either declines with a reason or approves up to the requested amount. Approval reserves the amount inside a server/SQLite transaction against its budget.
4. The NGO records a fictional external payment reference. The application does not move money or store bank/UPI details.
5. A worker/coordinator separately records the amount the person says they received. A difference becomes DISPUTED; the NGO cannot confirm its own payment.
6. The coordinator closes a positively confirmed request. Withdrawn/cancelled reported payments remain held until restricted resource reconciliation records verified use. Reconciliation does not restore provider access or create person confirmation.

Cash purposes: document fees, travel support, accessibility support or another short nonclinical access need. These are fictional grant purposes, not guaranteed government entitlements, verified NGO programmes or prescribed charges.

## States and money meaning

`REQUESTED → APPROVED → PAYMENT_REPORTED → RECEIVED → CLOSED`.

REQUESTED can be DECLINED. Unequal receipt becomes DISPUTED and requires assisted follow-up. Active requests may be WITHDRAWN or coordinator-CANCELLED. A closed request can lose privacy permission while keeping its completed history. At most one active funding request exists per underlying need.

All amounts use bounded integer **INR whole rupees**. Seeded NGO totals are fictional: A ₹25,000, B ₹15,000 and C ₹10,000. They are unrelated to document-help appointment slots. An NGO can update only its own budget; it cannot reduce the total below held or consumed amounts.

Free budget = total − held − used. Approval holds the approved amount. Report/dispute or revoked reported payment keeps it held. Confirmed receipt/closure consumes it. Reconciliation records verified external use, releasing only the verified unused balance. Changing financial decisions never changes clinical priority, task deadlines or visit completion.

## Communication

Every conversation belongs to `funding:<requestId>` or `referral:<attemptId>`. The current authorized NGO, assigned worker and coordinator may send service-coordination messages. Provider access requires the applicable current named-recipient grant and active case. Ended conversations are read-only for permitted staff; revoked provider details and message bodies disappear from its projection.

Messages are bounded to 1,000 characters, use server-derived identity and are saved with read receipts. Duplicate recent messages and rapid repeated sends are rejected. The UI displays unread messages from the actor's current permitted projection. Communication is in-app only; no SMS, email, WhatsApp, cold outreach or live NGO onboarding is connected.

## Actual command contract

All commands use the existing authenticated `/api/commands` envelope with positional `args`, expected state version and idempotency key. Current authorization is rechecked during replay.

| Command | Actor and arguments |
|---|---|
| requestFunding | Assigned worker/coordinator: needId, providerId, purpose, requestedRupees, reason, permission |
| decideFunding | Current recipient NGO: id, approved, approvedRupees, reason |
| reportFundingPayment | Current recipient NGO: id, fictional reference, note |
| confirmFundingReceipt | Assigned worker/coordinator: id, receivedRupees, person's confirmation note |
| closeFunding | Coordinator: id; requires positive receipt |
| withdrawFunding | Assigned worker/coordinator: id |
| cancelFunding | Coordinator: id, reason |
| reconcileFunding | Coordinator: id, verified usedRupees, evidence note; ended reported payments only |
| updateFundingBudget | NGO: own totalRupees |
| sendCaseMessage | Authorized case participant: threadKey, text |
| markCaseRead | Authorized case reader: threadKey |

## Persistence and access

The existing SQLite `application_state` owns funding records, budgets and messages. Additive startup migration preserves old tasks, plans, visits and referral history. Normalized funding and message tables add integrity checks. Approval, projection-sensitive transitions, normalization, audit and idempotency share the existing `BEGIN IMMEDIATE` transaction.

Providers receive sanitized `fundingRows`, their own budget totals and permitted conversations. They do not receive raw caseload, staff IDs, clinical flags, task coordinates or another NGO's funding records. An underlying need withdrawal also revokes linked funding access, including privacy withdrawal after a document case was closed.

## Screens and remaining boundaries

Coordinator, worker and provider each have Cash assistance and NGO messages screens. The network page links those workflows, role navigation shows unread messages, and reports keep approval, payment claims and confirmation distinct.

Real payments, real NGO balances, verified identities, bank reconciliation, national onboarding, offline messaging and deployment are separate work. See final runtime/browser evidence in [build status](BUILD_STATUS.md) and [handoff](CONTEXT_HANDOFF.md); source presence alone does not establish passing tests.
