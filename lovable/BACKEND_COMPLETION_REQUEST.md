# Backend completion checkpoint

This is a prepared follow-up, not a claim that a backend exists. Send only after the current Lovable build finishes and adapt it to the actual new files/results. Do not supersede a running build or bypass a tool-approval pause.

## Verified initial-commit defects to check again

At commit 20f7e0bfdeafd8b61e15e316961a543312097154 independent Node checks reproduced:

1. `isValidDate("2026-02-30")` returned true. Validate calendar dates by exact year/month/day round-trip, not Date.parse alone.
2. Longitude 275.704 was accepted as a confirmed point. Validate finite latitude [-90,90] and longitude [-180,180] at import and planner boundaries; preserve a location review reason.
3. Unknown rule UNKNOWN-RULE@99, imported through the review option, was included in a routine plan. Unknown/unapproved rule/version/cadre stays in a RULE_REVIEW disposition until authorized correction.
4. A single task at lat 26.92/lng 75.7, window 11:00–12:00, duration 40, shift 11:00–12:30, break 12:00/30 and zero buffer was scheduled with return crossing the break without charging that break. Break applies to travel/return and waiting as well as the visit. Preserve explicit break accounting and feasibility.
5. AppShell called useLocation inside a short-circuited expression only for public routes. This violates hook order when changing to coordinator/worker/provider. Capture location once unconditionally. A first-build browser log showed a hook-order error; test public-to-role and back after fixing.
6. useDemo applied selectors inside useSyncExternalStore's getSnapshot. Selectors such as Timeline's attempts.filter return a fresh array on every read and can trigger a render loop. Subscribe to a stable state snapshot first, then apply the selector; use an immutable fixed synthetic server snapshot and request-scoped state for authenticated SSR. Verify need-detail/timeline routes through real browser rendering.

Mobile at 320px did not overflow horizontally but the utility/identity/nav/notice/demo controls occupied almost the entire screen. Collapse demo controls on phones, show role-relevant selectors, make the navigation compact and keep the next worker action visible. Retain the truthful prototype notice in the selected language.

Sample CSV download did not produce the browser automation download event within 10 seconds. This is an unverified download result, not proof of a broken application; check a real browser/download and fix Blob cleanup or offer a proper static synthetic sample link if needed.

## Authorized next implementation

Continue the same project; retain the working synthetic demonstration. Use the already provisioned Cloud database and actual platform-supported authentication/session/server primitives. Read STATE_MACHINES, API_CONTRACTS, ROLE_PERMISSIONS, SECURITY_PRIVACY and project knowledge.

The intended implementation must provide an authenticated backend mode, not describe a browser role dropdown as access control. Derive approved worker/coordinator/provider memberships at the server; the caller cannot select its authority. Users without membership receive a useful access-pending/denied state. Membership creation is restricted to an authorized coordinator/admin, with an explicit initial operator provisioning process. Never silently promote a public signup or the first arbitrary user.

Use minimal synthetic tables/migrations for tenant/membership, caseload/plans/visits, needs/recipient consent, service offers/catchment/capacity, attempts/reservations, confirmations, audit and idempotency. Reuse the tested domain semantics. Prefer a small complete vertical path over a wide collection of unused tables.

Acceptance must reserve capacity and transition the attempt/need in one database transaction. Lock in a consistent order, recheck current consent recipient, authenticated provider membership, verification, catchment, TTL, fresh capacity, expected version and server-calculated units. Unique active attempt/allocation and idempotency protect races/retries. Same operation key and payload replays; changed payload fails.

The provider query returns only a currently granted referral projection. It never returns raw tasks or clinical identifiers. Withdrawal immediately blocks queries and later delivery/confirmation/closure actions; release unused resource before supply, hold reconciliation after reported supply. Provider report is distinct from person confirmation and coordinator closure.

Browser/SSR boundaries: no service secret in client code, no private process-global store, no shared/public caching of protected responses, no private metadata, browser APIs only after hydration. Use real offline indicators: acceptance/capacity cannot work offline. Do not invent a sync queue or offline verification.

Wire the supported authenticated screens to these commands. Keep demo role switching clearly identified as synthetic presentation; it must not grant a membership or change access in backend mode. Use a clear mode/sync status so local simulation cannot be mistaken for server-authoritative success.

Run the package build/typecheck/tests. Execute actual database last-unit race and replay/expiry/withdrawal tests, separate-member authorization and nonmember/unauthenticated checks. If tests set PostgreSQL JWT claims through a privileged runner, label them policy-level tests rather than real browser login verification. Record exact executed checks and remaining limitations in BUILD_VERIFICATION.md. Preserve editable preview; do not publicly publish, send emails or add payment/live partner integrations.
