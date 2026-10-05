# NGO funding and communication review

Checked **9 October 2026**. The user chose **demo funding first**. Cash coordination and case messages are implemented in the imported local application, with actual Node HTTP/SQLite persistence. Amounts, budgets and participants are fictional; no money transfer or live NGO outreach occurs. The visit planner, unserved coverage and separate health pathway remain central.

## Implemented behaviour

- Assigned ASHA/coordinator selects an existing document-help need, a named NGO serving its locality, a nonclinical cost purpose, whole-rupee amount and fresh funding permission.
- NGO approves/declines against its own declared budget. SQLite reserves approval atomically; one active cash request per need prevents duplicate allocation.
- External payment reporting, the person's separately recorded receipt and coordinator closure are distinct. A mismatched receipt remains disputed for review.
- Withdrawal revokes NGO details/messages/actions. Unused amounts release; reported payments remain held for coordinator reconciliation. Original-need privacy withdrawal also ends related funding grants, including after document-case closure.
- In-app messages belong to a permitted referral or funding case, with server-derived participants, bounded text, read receipts and unread badges. Ended staff conversations are read-only; providers lose case bodies after access ends.
- Additive migration preserves existing tasks, plans, visits, identities and completed referral history. The backend owns budgets, permissions, transitions, audit and idempotency.

Implementation contract: [funding and communication](FUNDING_AND_COMMUNICATION.md). Source modules include `backend/support.mjs`, server/policy/schema changes, `FundingWorkspace.tsx`, `CaseMessages.tsx`, six role routes and the HTTP store adapter. Help, sources, privacy, network, reports and navigation describe these actual flows.

## Actual checks

| Check | Result and scope |
|---|---|
| TypeScript | Passed after final source edits |
| Vitest | 31/31 across seven files; includes four new funding/message boundary regressions |
| Actual HTTP/SQLite suite | 15/15 on isolated databases with distinct demo sessions |
| Independent HTTP/SQLite audit | [8/8 passed](../output/verification/ngo-support-independent-2026-10-09/audit-results.json): migration preservation, permission/projection, idempotency, closed-need withdrawal, immutable reconciliation, release, budget race and restart persistence |
| Node production build | Client, SSR and Nitro node-server passed; source checkpoint 05:31:53 IST |
| Browser | NGO approval → payment report → ASHA receipt → coordinator closure → reload persisted; case messages/read state and provider access ending reviewed |
| Hindi 320px at text scale 1.25 | Funding and message pages each had client/scroll width 305/305; no whole-page horizontal overflow |
| Console | No warning/error entries returned in the isolated final browser review |

## Browser evidence

The isolated Node gateway used port 5180 and a disposable file-backed database. The working database at port 5173 was preserved. After an interrupted browser/process session, synthetic setup scripts restored two needs, one pending ₹500 request and two messages. Screens below capture the resumed visible approval-to-closure flow, not a real household outcome. Earlier request and send-message form interactions were reviewed before interruption.

- [Approval and reserved budget](../output/verification/ngo-support-2026-10-09/ngo-approved-budget.png): A's fictional ₹25,000 total became ₹24,500 available / ₹500 held / ₹0 used.
- [Payment report awaiting confirmation](../output/verification/ngo-support-2026-10-09/ngo-payment-reported.png).
- [ASHA's independent receipt](../output/verification/ngo-support-2026-10-09/asha-receipt-confirmed.png).
- [Coordinator closure after reload](../output/verification/ngo-support-2026-10-09/coordinator-cash-closed-reload.png).
- [NGO final budget and ended access](../output/verification/ngo-support-2026-10-09/ngo-closed-access-budget.png): ₹24,500 available / ₹0 held / ₹500 used; case details unavailable.
- [Saved NGO case conversation](../output/verification/ngo-support-2026-10-09/ngo-case-messages.png).
- [Hindi funding](../output/verification/ngo-support-2026-10-09/funding-hindi-mobile-320.png) and [Hindi messages/read-only state](../output/verification/ngo-support-2026-10-09/messages-hindi-mobile-320.png).
- [Machine-readable browser checks](../output/verification/ngo-support-2026-10-09/browser-checks.json).

## Practical limits

Disputes, withdrawal, reconciliation and concurrent approval were checked through HTTP tests/audit rather than every browser branch. Hindi remains draft; a full screen-reader/all-page 200% zoom audit is pending. Open fictional accounts demonstrate backend role scope, not verified production identity. No actual bank balance, NGO agreement, payment gateway, WhatsApp/SMS/email, national partner network or measured impact is claimed. Public Render/Railway deployment remains pending host/source connection and hosted persistence verification.
