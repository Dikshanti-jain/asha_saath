# Agent instructions — local ASHA Saath application

## Scope and context

This imported TanStack Start app is the current primary implementation. Read [PROJECT_CONTEXT](../PROJECT_CONTEXT.md), [CONTEXT_HANDOFF](../docs/CONTEXT_HANDOFF.md) and [BUILD_STATUS](../docs/BUILD_STATUS.md) first. Use the specialist product/UI/state/API/security specs only as needed. The latest user direction is local frontend/UI improvement with a working backend/database; do not restart Lovable generation or substitute the unfinished Vinext fallback.

Imported source revision: `b4e03681e52dbba19f0a6b20f7f4d61bf678019e`. Local changes are separate from that revision. There is no claimed GitHub sync connection for this local snapshot. Preserve published history if a connection is later configured; never force-push/rewrite it to update Lovable. Do not merge the stopped partial remote phase-3 commit blindly.

## Framework and UI

- Preserve generated TanStack Start entry/configuration, supported route generation and `bun.lock`; retain the local npm lockfile unless a deliberate package-manager decision changes it.
- Original ASHA Saath identity, formal navy utility/navigation, white masthead, restrained saffron accent, clear prototype/footer, Hindi/English draft copy and useful worker actions are required. No government emblem or implied official ownership.
- Browser APIs, localStorage, maps and IndexedDB execute only after browser mount; never during SSR. The client serves a pristine synthetic shell for hydration and then loads the authorized API projection.
- Keep utility/account/demo controls compact on mobile. Role workspace navigation must reflect the server session. A browser role dropdown must not grant permissions.

## Actual persistence and authorization

The active adapter is Node 24 HTTP plus persistent SQLite. `npm run dev:local` starts Vite 5173 and backend 4318. `backend/data/asha-saath.sqlite` is the real local data store; runtime-generated modules, DB/WAL/session data, credentials and dependencies are ignored and must stay out of source packages. Supabase Cloud is provisioned but unconnected; generated client files do not authorize an RLS or integration claim.

The entry boundary is `backend/server.mjs` → `backend/policy.mjs` → `backend/domain.ts`/synchronized pure modules → SQLite transaction/constraints. `src/lib/demo/store.ts` is an HTTP adapter and state projection. UI may calculate advisory plan/CSV previews, but saved data is recomputed/validated server-side. Do not restore browser-domain mutations or browser-local persistence of caseload, plans, needs, consents, attempts or capacity.

- Session identity comes from a server-issued opaque HttpOnly cookie and the fixed server account catalogue. Discard client role/actor labels; validate every command and read projection independently.
- Open fixed fictional account selection is for demo testing. It is not verified staff identity, password/OTP sign-in or production provider provisioning. Do not describe it as production authentication.
- Membership/command/query policy belongs in `backend/policy.mjs`. Coordinator rights, worker task ownership and recipient-specific provider access must be enforced there, even if the UI hides an action.
- State transitions belong in server `backend/domain.ts`; frontend `cmd.*` calls HTTP only. If domain logic changes, update the authoritative server implementation and meaningful tests. `backend/sync-domain.mjs` regenerates pure CSV/planner/time/fixtures runtime from actual frontend sources at startup; never hand-edit `backend/runtime/`.
- Current state read, authorization, capacity availability, acceptance/reservation, transition, normalized integrity data, audit and idempotency must remain inside a SQLite `BEGIN IMMEDIATE` transaction. Preserve one-active-attempt, import-identity and one-reservation-per-attempt constraints. Do not secure acceptance with browser state checks.
- Idempotent replays recheck current authorization and return the fresh scoped state; cached previous provider details must never restore withdrawn access. Preserve version conflict handling and predecessor guards.
- Protected responses remain `private, no-store`; do not add shared response caches or public metadata containing task/need details. No service credentials in client bundles or public assets.

## Product invariants

The explicit 9 October user extension adds synthetic NGO cash assistance and case messages. Preserve the document-navigation core/three offers while implementing separate funding consent, transactional budget reservation, independent receipt and recipient-scoped conversations. No real money movement or bank details; see the parent funding/communication contract. Earlier future-only funding wording is superseded for this demo ledger.

- Keep CSV scheduling and unserved coverage central: 24 fictional tasks, two assigned staff, three fictional offers and one document-navigation category. Two tasks for one patient are valid; `(dataset_id, task_id)` identity remains immutable.
- Approved priorities/due dates are inputs. Forecasts move planning date, never task deadlines or recorded outcomes. Explain locality grouping, route order, travel/time/break/return assumptions and every unserved reason; no invented real precision.
- Urgent clinical escalation, joint work and unapproved rule/version/cadre review remain separate from routine visits and NGO offers. Do not infer diagnoses or clinically approve rules through an LLM.
- Every current consent names one recipient, fields and purpose. Nomination/renomination requires fresh permission; latest refusal cannot reactivate an old grant.
- Provider access is only to a current authorized referral projection. Do not send raw caseload/clinical records, household identity or unrelated referral/worker activity to providers.
- Withdrawal immediately revokes provider details/actions, blocks later delivery/closure transitions and handles resources correctly: unused supply released, reported supply held for coordinator reconciliation.
- Provider delivery report is distinct from recipient/worker confirmation; only authorized coordinator closure follows the permitted predecessor.
- Preserve accountable coordinator, sequential offers, catchment versus office verification and public-pathway consideration. Registration is not availability or endorsement.
- No real health records, IDs, phone/address/government identifiers in fixtures, prompts, DB demo data or screenshots. No live NGO/government/payment/offline integration claims.

## Verification and handoff

Run checks appropriate to changed behaviour: `npm run typecheck`, `npm test`, `npm run test:backend` and `npm run build` as applicable, plus actual changed screen states. Run backend tests with their isolated temporary databases rather than resetting the active demo database. The parent workspace's spec validator checks documentation/fixtures only and does not establish runtime safety.

Update [BUILD_VERIFICATION](BUILD_VERIFICATION.md), [BUILD_STATUS](../docs/BUILD_STATUS.md) and [CONTEXT_HANDOFF](../docs/CONTEXT_HANDOFF.md) with actual files/revision, commands/results, screen evidence, limitations and exact remaining work. Do not mark a scenario passed because source/specification exists. A generated Cloudflare frontend module is not a deployed Node SQLite backend.
