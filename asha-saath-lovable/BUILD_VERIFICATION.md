# Build verification — ASHA Saath

## Latest support check: 9 October 2026

NGO cash-support coordination and case messages are implemented with server-side ownership, separate funding consent, recipient-scoped projections and SQLite persistence. The user selected the demo funding flow first. Synthetic budget approval reserves money amounts atomically; external payment reporting, the person's receipt confirmation and coordinator closure are distinct steps. Withdrawal removes provider details/messages; reported allocations stay held for restricted reconciliation. No real money transfer, donation custody or live NGO messaging is integrated. Read [funding/communication contract](../docs/FUNDING_AND_COMMUNICATION.md) and [support review](../docs/NGO_SUPPORT_REVIEW_2026-10-09.md).

| Check | Recorded result and scope |
|---|---|
| TypeScript | Passed after final consent/timestamp fixes at the 05:31:53 IST source checkpoint |
| Full Vitest | 31/31 tests in seven files passed at that checkpoint |
| New UI boundary regressions | Four passing cases included in the full suite: recipient-change permission, revoked provider display, draft-case switch and revoked conversation projection |
| Backend HTTP/SQLite | 15/15 passed with isolated databases and separate synthetic cookie accounts |
| Independent new-support audit | [8/8 passed](../output/verification/ngo-support-independent-2026-10-09/audit-results.json): migration, separate grants/projections, message authorization/idempotency, closed-need withdrawal cascade, immutable reconciliation, pre-payment release, budget race and restart persistence |
| Node production build | Client, SSR and Nitro node-server passed after final fixes at 05:31:53 |
| Direct funding/messages screen journey | Passed approval → report → ASHA receipt → coordinator closure/reload, messages/read status and ended NGO access; Hindi 320px at 1.25 had width/scroll 305/305 on both new pages. See support review for exact scope. |

Frontend files: `FundingWorkspace.tsx`, `CaseMessages.tsx` and six role-specific funding/messages routes. Tests add meaningful consent, scope and draft boundaries. The final full source check includes the last consent/timestamp copy edits. The working persistent database was not reset by these isolated tests.

## Historical UI/maps check: 9 October 2026

Clean government-style UI revision and interactive Leaflet maps implemented. See [full UI review](../docs/UI_REVIEW_2026-10-09.md) and [deployment instructions](DEPLOYMENT.md). TypeScript passed; 25/25 Vitest tests in four files; 9/9 backend HTTP tests; `npm run build:node` passed (client, SSR, Nitro node-server). Full synthetic referral flow passed on isolated in-memory Node gateway preview and stayed closed after reload; that preview has been stopped. The working persistent database on port 5173 was not reset.

320px Hindi at 1.25 text: width/scroll 305/305, record action bottom 602.58 before bottom nav 783.20. 390px English: 375/375, action bottom 481.19. Maps/CSV preview/account Escape and role screens were reviewed. No browser errors returned in final review. No comprehensive screen-reader/200% zoom audit is claimed. Docker and real host/volume deployment remain untested; no public service exists.

## Historical milestone: 8 October 2026

Checked 8 October 2026. The local import, government-style UI and actual persistent backend/database objective is complete. Source import: Lovable commit `b4e03681e52dbba19f0a6b20f7f4d61bf678019e`; local modifications follow it. Stopped partial phase-3 commit `d0abb7` was not imported.

Stack: TanStack Start 1.168.60, React ^19.2.0, TypeScript ^5.8.3, Vite 8.1.5. Active persistence is Node 24 HTTP/SQLite; Node 24.13 and 24.19 were used in checks. Supabase is provisioned but unconnected. Generated configuration/`bun.lock` remain; local npm packages/lockfile were added.

## Final local results

| Check | Recorded result |
|---|---|
| TypeScript | Zero errors |
| Vite build | Client, SSR and generated Cloudflare-target module passed on Vite 8.1.5 |
| Full Vitest | 22/22 tests across three files, root run at 17:57 IST |
| Backend HTTP suite | 8/8 actual HTTP/session/SQLite tests after final planner, at 17:54 IST |
| Independent backend audit | 7/7 on the retained earlier isolated snapshot |
| Fresh planner regression | 11/11 passed |
| Required planner properties | 9/9 passed, including both prior fairness failures |
| Request/recipient consent UI | Two regressions in `src/routes/-worker.needs.test.tsx` passed; included in full suite |
| Full browser journey | REQ-005/provider C closed and stayed closed after reload |
| Mobile worker | 390 English and 320 Hindi at 1.25 text scale checked without whole-page horizontal overflow; Hindi first action fits above bottom navigation |
| Source package | ZIP created, CRC/per-file SHA256 passed; clean extracted Node 24.19 backend regenerated runtime and initialized 24 tasks |

Evidence: [fresh regression](../output/verification/local-domain-fairness-fixed/independent-checks.json), [all required properties](../output/verification/local-domain-fairness-fixed/planner-property-checks.json), [historical independent HTTP audit](../output/verification/backend-independent-audit/http-audit-results.json), [browser measurements](../output/verification/browser/browser-checks.json) and [packaging report](../output/website-source-packaging.json).

[Final local command report](../output/verification/local-checks.json) records commands/exit codes, full test counts, Node 24.13.0/24.19.0 and build targets. Typecheck/build passed after the final copy edits. No further local UI changes are expected at this checkpoint.

Scheduling policy `priority-due-deferral-window-locality-v2` applies priority, approved due date, deferral and latest window before geography. All original input/break/rule regressions and both fairness regressions pass. Initial remote and earlier `local-domain` failures are retained as historical evidence, not current outstanding findings.

## Browser evidence

REQ-005/provider C: saved plan → assigned worker completed visit → document-help need → eligible named provider nomination → explicit permission → coordinator offer → provider acceptance/capacity reservation → valid in-person arrangement → delivery report → worker/person receipt confirmation → coordinator close → reload remained closed. [Closed case screenshot](../output/verification/browser/referral-closed-reload.jpg).

After API restart, rural remaining plan v2 preserved two recorded visits and scheduled two remaining; fresh urban plan v1 saved four stops. [Urban plan](../output/verification/browser/urban-plan-saved.jpg). Earlier REQ-001/provider B closure occurred before the final arrangement-method guard and remains historical.

Worker mobile measurements: 390 English document/scroll width 375/375 and record button bottom 615.76. Final 320 Hindi at 1.25 text scale document/scroll width 305/305; first action bottom 764.725, bottom navigation starts 783.2, viewport height 844. [Hindi worker screenshot](../output/verification/browser/worker-hindi-mobile-320.jpg). [Coordinator dashboard](../output/verification/browser/coordinator-dashboard.jpg) documents the local government-style view.

The Hindi JPEG capture is 305×804; the cited 844 height is the DOM viewport measurement. Refreshed coordinator cohorts show eight planned tasks/two staff, two completed visits, 14 not scheduled, one separate health queue, zero support follow-up requests and two closed requests. These separate cohort cards are not additive impact totals.

Provider acceptance now opens accepted work with permitted arrangement options and clear current-referral/action queues. Consent choices reset on request/recipient changes. Worker Hindi actions and future task/save explanations were refined. These screen results are distinct from the imported remote-agent smoke claims, which described earlier browser-local persistence and the wrong Vite version.

## Backend verification scope

Real HTTP tests use separate synthetic cookie accounts and SQLite transactions. They cover worker/provider authorization, forged role/organization fields, origin checks, session rotation/logout, no-store responses, concurrent last-unit acceptance, idempotency conflict/revocation, stale versions, independent confirmation, restart persistence, withdrawal resources, server recomputation and recipient changes/expiry. The earlier independent audit covers refusals after renomination, scoped expiry activity, clinical disposition bypass and cross-provider denials.

Fixed open fictional accounts are a demonstration facility, not verified production identity. Recovery/withdrawal branches passed HTTP checks rather than every browser screen. No Supabase RLS or production security certification is claimed. The acceptance catalogue is not claimed exhaustively passed.

## Production/pilot limits and artifacts

Hindi is draft; some detailed explanations remain English. Complete screen-reader/all-page 200% zoom audits were not performed. Clinical rules, geography and travel estimates are synthetic and unapproved. No verified real identities, live provider agreement, government API, payment custody, national network or offline synchronization exists.

The generated Cloudflare frontend module does not deploy the Node SQLite API. Production needs reviewed hosting/TLS/data arrangements, identity provisioning, tenant/privacy/security controls, clinically approved rules and real partners; Supabase/PostgreSQL/RLS is a separate optional migration.

[Source ZIP](../output/asha-saath-website-source.zip) and [spec ZIP](../output/asha-saath-spec-pack.zip) exist and are refreshed after final source/doc edits. Databases, sessions, credentials, dependencies and generated artifacts are excluded; package hashes describe archived bytes. Specification validation checks documents/fixtures, not runtime safety. Current context and final evidence are in [BUILD_STATUS](../docs/BUILD_STATUS.md) and [handoff](../docs/CONTEXT_HANDOFF.md).
