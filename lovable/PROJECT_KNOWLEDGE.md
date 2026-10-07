# ASHA Saath project knowledge — v1.0 / 8 October 2026

## Product

Build Healthcare 03: ASHA/ANM visit scheduling optimizer, expanded with accountable local NGO support. Original CSV, supplied risk/priority, geography grouping/nearest-neighbour, feasible daily route, estimated travel, unserved flags and coverage projection remain the main feature.

Working name ASHA Saath / आशा साथ, uniqueness unverified. Outcome: feasible visits followed by consented document-navigation help with acceptance, delivery and confirmation tracked separately.

Default demo: 24 synthetic visit tasks, two assigned staff, fictional catchment, one category (entitlement-document navigation), three fictional provider offers. Do not expand to national integrations, finance, voice or diagnosis before the core works.

## Current stack

Keep the generated Lovable stack/configuration/lockfile. Current new projects use TanStack Start, React and TypeScript, with generated styling/components. Inspect actual package/config files; do not replace them with an old React/Vite-only template.

Use one PostgreSQL-backed Cloud or Supabase adapter only after inspecting project capabilities. Start with a labelled synthetic adapter if needed; it cannot prove real concurrency or authorization. Preserve generated routes/build settings. Browser APIs, IndexedDB and maps are client-only and SSR-safe. Private loaders authorize before returning data; no identifying public metadata/shared caches.

## Government-style UI

Original wordmark, navy utility bar, white identity header, navy navigation, restrained saffron underline, white panels, readable tables/forms, help/privacy/accessibility/source footer.

Tokens: navy #102A43, primary #1D4E89, saffron #F29D38, text #172B4D, secondary #475569, background #F5F7FA, white #FFFFFF. Saffron uses navy text, never white body/button text. Status = text + icon + colour. Base spacing 4px; panel radius 6px; body/actions 16px minimum; main mobile targets 48px.

Worker mobile: Today / Needs / Help; next visit and Record visit first. Coordinator desktop: Overview / Caseload / Plans / Needs / Service network / Reports. Provider: Requests / Accepted work / Capacity. Hindi/English switch; Devanagari line height and wrapping; keyboard focus, 320px reflow, 200% text and error summary.

Every page says: “Synthetic demonstration — no live government or NGO connection.” No national emblem, ministry/state seal, fake official owner or certification. No promotional carousel/modal in operational pages.

## Planning invariants

Import identity is tenant + source_dataset_id + immutable source_task_id. Repeat import must not duplicate; one patient can have different valid tasks. Unknown rule/priority/location goes to review, not invented data.

Clinical classification is supplied by approved staff/versioned rules, never inferred by an LLM. Urgent escalation bypasses NGO matching and is counted separately. Joint-cadre tasks require coordination.

Explicit confirmed-locality groups. Inside identical priority/deadline/deferral/due-date tiers use deterministic nearest-neighbour seed; ties by task ID. Final ordering preserves approved P1/P2/P3 priority, latest permissible date, deferral count and due date before geography.

Plan simulates travel, wait, visit, break, safety buffer and return within the declared shift/windows. Haversine × declared multiplier/speed is an estimate; label assumptions. Every task has a disposition/reason; difficult cases stay visible.

Replan only remaining work. Coverage projection advances planning date, never task due dates, never counts projected visits completed and never repeats assigned projected tasks.

## Support integrity

ASHA captures a short need and scoped permission. A named coordinator owns NGO follow-up/recovery. Public entitlement/service pathway is considered first. Document help does not approve a benefit or issue a certificate.

Organization -> branch -> specific service offer -> actual catchment -> eligibility -> current capacity -> attempt -> outcome. Registration is not endorsement/verification/capacity. State/national discovery uses aggregates; no household pins.

Current recipient/purpose/field-specific consent required before each offer. Wrong locality, unverified service, unresolved eligibility, expired/stale/full capacity must have exclusion/review reasons.

Sequential offers; one active attempt/allocation per need. Acceptance is online and atomic in the database: authorize, lock, recheck consent/state/TTL/catchment/verification/capacity, reserve, update versions, audit and idempotent response in one commit. UI button disabling is not concurrency protection.

Provider reports delivered; worker/coordinator records person's confirmation; coordinator closes only a positively confirmed service. Decline/expiry/no match/dispute has owner, reason and next action. Withdrawal revokes access immediately. Release unused resource before supply; after reported supply hold for reconciliation without restoring consent.

## Canonical states

Visit: PENDING, PLANNED, COMPLETED, NOT_AVAILABLE, DEFERRED, ESCALATION_REQUIRED, CANCELLED.

Need: DRAFT, CONSENT_REQUIRED, READY_TO_MATCH, OFFERED, ACCEPTED, ARRANGED, DELIVERY_REPORTED, CONFIRMED, CLOSED, UNRESOLVED, DISPUTED, WITHDRAWN.

Attempt: OFFERED, ACCEPTED, ARRANGED, DELIVERY_REPORTED, CONFIRMED, CLOSED, DECLINED, EXPIRED, CANCELLED, DISPUTED.

Reservation: RESERVED, COMMITTED, RELEASED, EXPIRED, RECONCILIATION_REQUIRED.

Free units = total - reserved - committed - reconciliation-held. Same actor/command/idempotency key and payload returns original response; changed payload is a conflict. Entity versions prevent stale overwrites.

## Roles and data

Role preview selector is cosmetic. Actual authority comes from server membership/capability/assignment/organization/case grant. Provider receives only authorized minimal referral fields, never clinical task CSV/risk/household coordinates.

Default Lovable terms restrict sensitive data unless an appropriate plan/written arrangement permits it. Use invented references and constructed points only. No real names/phones/Aadhaar/clinical records/document images/bank/card data in uploads, logs, prompts, previews or fixtures.

No live government/NGO API or funding partnership is assumed. No wallet/custody/payment rails. Funding is later: request -> review -> approval -> external fulfillment -> reconciliation.

## Offline and checks

Offline follows working core: downloaded authorized synthetic plan and queue for permitted visit/need/consent capture. Matching waits for synced consent. Acceptance, live capacity and closure require server. Reconnect authenticates/replays idempotently; conflicts stay visible. Clear cached role data on logout, handling unsynced edits explicitly.

Before calling a feature complete: run applicable planning/transition/race/role tests and view real desktop/mobile/Hindi/empty/error/offline states. Record results, not imagined checks.

Read project docs by task: PRD and DECISIONS for scope; TRD for architecture; UI_UX_SPEC/DESIGN_SYSTEM for screens; STATE_MACHINES/DATA_MODEL/API_CONTRACTS/ROLE_PERMISSIONS for backend; TEST_ACCEPTANCE for checks. Update CONTEXT_HANDOFF after each stage. A document or static screen is not implemented/authenticated/production evidence.
