# Application build status

## Current Android and website checkpoint — 9 October

The separate [native mobile app](../asha-saath-mobile/README.md) now shares the preserved website/Node/SQLite backend. Its bundled arm64 **1.0.0** APK built successfully, passed signature/ZIP/16KB alignment checks, and was installed/launched on the authorized **TECNO CL7k / Android 16** phone. Native login restoration, Hindi/English visit actions, completed visit → linked help → fresh-permission ₹500 request → saved case message, map selection/zoom/reset and own-NGO budget reading were exercised. Mutations used a separate test database; native markers were absent from the working database. The phone is restored to proxy5186 / Rural ASHA / Hindi Today. [Device review](../output/verification/mobile-device-2026-10-09/native-device-review.json) and [independent APK review](../output/verification/mobile-device-2026-10-09/independent-apk-review.json) record the scope.

Current source checks: mobile TypeScript/ESLint, **4/4** transport, Expo Doctor **21/21**, web/Android JS exports; website TypeScript, **31/31** Vitest and Node production build; backend **19/19** actual HTTP/SQLite plus separate native HTTP audit **9/9** passed. Full cash approval/report/receipt/coordinator closure was verified through browser/HTTP, rather than every step on the physical phone. This APK is test-signed with explicit local HTTP for USB use; public HTTPS hosting, production identity/signing, live partners/payments and offline saving remain pending. See [MOBILE_APP](MOBILE_APP.md).

The paragraphs below retain the earlier cash/website checkpoint and its **15/15** pre-mobile backend count.

Checked **9 October 2026**. NGO cash-support coordination and case-specific in-app communication are implemented on the local Node/SQLite adapter. The user selected the **demo funding flow first**. The portal records fictional amounts and external assistance reports; it does not transfer or hold money. Read [funding and communication](FUNDING_AND_COMMUNICATION.md) and [new support review](NGO_SUPPORT_REVIEW_2026-10-09.md). **Public deployment is pending.**

The final **05:31:53 IST** source check after consent/timestamp fixes passed TypeScript, **31/31 Vitest tests in seven files** and the **Node production build**. The actual HTTP/SQLite suite passed **15/15**; a separate [independent HTTP audit passed 8/8](../output/verification/ngo-support-independent-2026-10-09/audit-results.json) using an isolated database. The frontend suite includes four new funding/message boundary regressions. Direct browser review passed approval, payment report, independent receipt, coordinator closure/reload, case messages/read status and ended provider access. Hindi funding/messages at 320px and text scale 1.25 had no whole-page horizontal overflow; [support review](NGO_SUPPORT_REVIEW_2026-10-09.md) records exact evidence and limits.

The previous government-style UI/maps review and its 25/9 test counts remain [historical UI evidence](UI_REVIEW_2026-10-09.md). Earlier screenshots, browser referral journeys and the detailed 8 October milestone below retain their dated scope.

## Primary local application

The primary app is [asha-saath-lovable](../asha-saath-lovable/README.md). It imports TanStack Start source from [ASHA Saath Planner](https://lovable.dev/projects/84ca52fd-1ccf-4574-ac3a-191a553287e0), commit `b4e03681e52dbba19f0a6b20f7f4d61bf678019e`: 115 listed files, 113 text files downloaded. [Manifest](../output/lovable-source-manifest.json) preserves that source inventory and adds the packaged local inventory/hashes. Credentials/binary favicon were excluded; local edits are separate from the remote revision. The stopped partial phase-3 commit `d0abb7` was not imported.

Generated entries/configuration and `bun.lock` are retained; npm dependencies and `package-lock.json` were added locally. Stack: TanStack Start 1.168.60, React ^19.2.0, TypeScript ^5.8.3, Vite 8.1.5. Checks used Node 24.13 and 24.19.

Run `npm run dev:local` from the app directory. Frontend: [127.0.0.1:5173](http://127.0.0.1:5173). API health: [127.0.0.1:4318/api/health](http://127.0.0.1:4318/api/health). Persistent data: `backend/data/asha-saath.sqlite`. **SQLite is the active adapter. Supabase Cloud is provisioned but unconnected**, with no application tables at its last inspection and no Supabase RLS claim. No public production deployment exists. The separate Sites/Vinext fallback is private, unfinished and unpublished.

## Implemented and checked

- Government-style original shell, compact utility/navigation, Hindi/English controls, account/server state, role workspaces and help/privacy/source screens: `src/components/AppShell.tsx`, `SessionPanel.tsx`, role routes and `src/styles.css`.
- Stable CSV identity/import review, feasible daily plans, recorded outcomes/replanning and coverage forecasts: `src/lib/demo/csv.ts`, `planner.ts`, `time.ts`; coordinator/worker views.
- Scheduling policy `priority-due-deferral-window-locality-v2`: approved priority → earlier due date → greater defer count → earlier latest window → locality/nearest-neighbour → immutable identity. The two earlier distance-first fairness failures are fixed.
- Named-recipient consent, sequential offers, scoped provider workflow, atomic capacity acceptance, valid arrangements, delivery reporting, independent confirmation, closure and resource handling: backend policy/domain/transaction code plus need/provider views.
- Consent checkbox resets on request or recipient change; two regressions in `src/routes/-worker.needs.test.tsx` passed. Provider acceptance moves to accepted work; current referral/action queues and valid arrangement choices are clear. Future task count/save copy and compact Hindi worker actions were refined.
- HTTP-only authoritative data boundary in `src/lib/demo/store.ts`; localStorage stores preferences. Node backend `server.mjs`, `policy.mjs`, `domain.ts`, `schema.sql` and `sync-domain.mjs` own persistence/permission/transitions. Saved plan/CSV data is validated or recomputed server-side.
- Cash-support requests linked to document-help needs: named NGO/locality selection, purpose, whole-rupee amount up to ₹1,00,000, cost note and fresh permission. Funding has a separate grant; an earlier document referral grant does not authorize funding.
- NGO-declared synthetic budget, server-derived available/reserved/used totals, transactional approval or decline, external assistance report, independent person confirmation, dispute review and coordinator closure. One active funding request per need and atomic budget checks prevent overcommitment. Reported payment is distinct from confirmed receipt.
- Permission withdrawal and cancellation revoke NGO funding/message access. Unused allocations release; reported amounts remain held for restricted coordinator reconciliation, which never restores the grant. Withdrawing an original document-help need also revokes its funding grants and related provider message bodies, including when the document case was already closed.
- Persistent messages for authorized referral/funding cases: named NGO, assigned worker and coordinator; timestamps labelled as the demo clock, read/unread controls and 1–1,000-character validation. No WhatsApp, SMS or email integration. Changing a case clears its draft; provider grant revocation removes its case conversation.

Fixed fictional account selection creates a server-derived opaque HttpOnly session. Anyone trying the demo may select these accounts; this does **not** verify a production staff/provider identity. Role/organization fields cannot grant membership. Worker ownership and recipient-specific provider projection are enforced server-side. Protected responses are `private, no-store`.

`BEGIN IMMEDIATE` encloses command/state/capacity/reservation/audit/idempotency work; SQLite locks and identity/active-attempt/allocation constraints support concurrent synthetic clients. Provider delivery report does not close a need. Consent withdrawal ends provider reads/actions, including idempotent replays; unused supply is released and reported supply remains held for reconciliation.

## Historical 8 October verification

| Check | Result and scope |
|---|---|
| TypeScript | Zero errors |
| Vite build | Vite 8.1.5 client, SSR and generated Cloudflare-target module passed |
| Full Vitest | 22/22 tests in three files; root run at 17:57 IST |
| Backend HTTP integration | 8/8 passed after final planner, at 17:54 IST; actual separate cookie sessions/SQLite operations |
| Independent backend audit | 7/7 passed on the retained earlier isolated snapshot; historical evidence, not rerun against every final copy edit |
| Fresh planner regressions | [11/11 passed](../output/verification/local-domain-fairness-fixed/independent-checks.json) |
| Required planner properties | [9/9 passed](../output/verification/local-domain-fairness-fixed/planner-property-checks.json), including both fairness regressions |
| Full browser journey | [REQ-005/provider C passed](../output/verification/browser/browser-checks.json): permission → offer → accept/reserve → valid arrangement → report → person confirmation → close → reload preserved closure |
| Restart/replanning | Rural remaining plan v2 preserved two recorded visits and scheduled two remaining; fresh urban plan v1 saved four stops |
| Mobile worker | 390 English document/scroll width 375/375; 320 Hindi at 1.25 text scale width/scroll 305/305, first action bottom 764.725 before bottom-nav top 783.2 within height 844 |
| Source package | ZIP exists, CRC/per-file SHA256 checked; clean extracted Node 24.19 API regenerated runtime and seeded 24 tasks without bundled dependencies/database |
| Spec validation | Passed; [validation report](../output/spec-validation.json) records final document/link counts, four skills, 24 tasks/23 person references and nine token contrast pairs |

Browser evidence: [closed referral after reload](../output/verification/browser/referral-closed-reload.jpg), [Hindi worker at 320](../output/verification/browser/worker-hindi-mobile-320.jpg), [coordinator overview](../output/verification/browser/coordinator-dashboard.jpg) and [saved urban plan](../output/verification/browser/urban-plan-saved.jpg). [Browser measurements](../output/verification/browser/browser-checks.json) define their exact scope.

The [final local command report](../output/verification/local-checks.json) records commands, exit codes, Node 24.13.0/24.19.0, test counts and build targets. Typecheck/build passed again after final copy edits. The refreshed coordinator screen shows eight planned tasks across two staff, two completed visits, 14 not scheduled, one separate health queue, zero support requests needing follow-up and two closed requests. These are separate synthetic dashboard cohorts, not a national impact claim.

The earlier REQ-001/provider B journey closed before the final arrangement-method guard and is historical. The independent backend [audit](../output/verification/backend-independent-audit/http-audit-results.json) covers refusals after renomination, scoped expiry activity, clinical bypass and cross-provider denials. Backend integration also covers last-unit races, forged roles, caching, idempotency/revocation, stale versions, independent confirmation, restart persistence, withdrawal and server recomputation. Recovery/withdrawal were tested through HTTP rather than every browser branch.

Initial commit failures and earlier `local-domain` fairness failures remain preserved as historical evidence. They are superseded by the fresh passing planner results. The [acceptance catalogue](TEST_ACCEPTANCE.md) remains a scenario catalogue, not a blanket passing report.

## Production and pilot limits

Hindi is draft and some detailed explanations remain English. Complete screen-reader/all-page 200% zoom audits were not performed. Travel/geography/rules, support budgets and money amounts are synthetic, with no field/clinical approval. Cash coordination and in-app messages work locally; offline synchronization, verified production identity, live government/NGO integrations, real transfers/funding custody, real partner agreements and a national provider network are unimplemented.

A generated Cloudflare frontend module is not a deployment of the Node SQLite backend. Any real pilot needs reviewed hosting/TLS/data arrangements, identity provisioning, tenant/privacy/security controls, clinical approval and provider agreements; Supabase/PostgreSQL/RLS is a separate optional future migration.

[Source ZIP](../output/asha-saath-website-source.zip) and [spec ZIP](../output/asha-saath-spec-pack.zip) contain the final local milestone. Rebuild packaging after later edits; [packaging report](../output/website-source-packaging.json) identifies exact archived bytes. Databases, sessions, credentials, dependencies and generated output are excluded. [Handoff](CONTEXT_HANDOFF.md) and [app verification](../asha-saath-lovable/BUILD_VERIFICATION.md) preserve the final local context.
