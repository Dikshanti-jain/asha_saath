# Data model, integrity and field minimization

Version 1.3 · Proposed PostgreSQL schema; these PostgreSQL tables are not deployed. The working local SQLite schema is [backend/schema.sql](../asha-saath-lovable/backend/schema.sql), with implementation boundaries in [backend/README](../asha-saath-lovable/backend/README.md). The local app has one authoritative database; Supabase is unconnected.

## 1. Conventions

Use UUID internal IDs; stable external task identity is separate. Common fields: tenant_id, created_at/updated_at UTC, version integer, created_by, synthetic boolean. Use foreign keys scoped to the same tenant; a UUID alone does not authorize access.

Local dates/windows use Asia/Kolkata; ISO dates in fixtures. No beneficiary name, Aadhaar, phone, diagnostic text, bank details or document upload is required in the synthetic model.

## 2. Entities

| Table | Essential fields | Constraints / access |
|---|---|---|
| tenants | id, display_name, synthetic | Demo tenant clearly fictional |
| memberships | user_id, tenant_id, role, organization_id?, staff_id?, approved capabilities, active | Server-managed; users cannot self-elevate |
| geographies | id, parent_id, level, area_type, name, code, synthetic | State/district/block/village/hamlet/ward/settlement hierarchy |
| staff | id, tenant_id, user_id?, cadre, assigned geography IDs, synthetic label | Coordinate assignment checked before plan |
| programme_rules | id, rule_id, rule_version, priority_policy, cadre, source_url, checked_at, local_approval_status, effective_from?, review_after | Unique tenant/rule_id/version; approved/synthetic-active status required |
| import_batches | id, source_dataset_id, content_hash, preview_counts, committed_at?, actor | Stable dataset identity; retain rejected/review summary |
| visit_tasks | id, source_dataset_id, source_task_id, patient_ref, staff_id, locality_id, lat/lon, location_confidence, rule_id/version, priority, due_date, latest_permissible_date?, window, duration, cadre, defer_count, supplied_flags, status | Unique tenant/dataset/task; multiple tasks per patient valid |
| visit_task_history | task_id, version, changed_fields, reason, actor, time | Clinical field changes authorized/auditable |
| daily_plans | id, staff_id, planning_date, input_hash, algorithm_version, rule_snapshot, config, totals, plan_version, current flag | Saved plan, not forecast completion |
| plan_stops | plan_id, task_id, order, locality_group, seed_rank, arrival/departure, travel/wait/visit minutes, reason list | Unique plan/task and plan/order |
| plan_dispositions | plan_id, task_id, disposition, reason_code, detail | Every input task accounted for |
| visit_events | id, task_id, outcome, captured_at, received_at, actor, short structured reason, client_operation_id | Duplicate-safe; authorize worker/cadre |
| support_needs | id, originating_visit_id, category, locality_id, preferred_mode/window, status, coordinator_id, next_action_at, recovery_reason | Minimal fields; clinical visit and need completion separate |
| consents | id, need_id, version, person_decision_reference, recorded_by, purpose, allowed_fields, recipient_org_id?, text_version/language, active_from, expires_at?, status | Recipient-specific grant required before offer; past text immutable |
| organizations | id, display_name, registration_status/reference?, participation_status, synthetic | Registration not service endorsement |
| organization_branches | id, organization_id, name, office_locality?, intake relay | Office locality not service coverage |
| service_offers | id, branch_id, category, service_mode, eligibility_rule, verification_status/evidence_ref, verified_at, expires_at, resource_unit, units_per_case | Per-service verification independent of organization |
| service_catchments | offer_id, geography_id, allowed area_type/mode | Actual covered areas; no “all India” inference from address |
| capacity_windows | id, offer_id, starts_at, ends_at, total_units, confirmed_at, fresh_until, version | Total nonnegative; decrease cannot undercut held/consumed units |
| referral_attempts | id, need_id, offer_id, consent_id, status, offered_at, offer_expires_at, accepted_at?, arrangement, reported_at?, version | Partial unique one active attempt per need |
| capacity_reservations | id, attempt_id, capacity_window_id, units, status, expires_at? | One allocation per attempt; units positive; active need allocation unique |
| delivery_reports | id, attempt_id, provider_actor, supplied_at, structured outcome, evidence_reference? | Report only; no sensitive attachments in demo |
| receipt_confirmations | id, attempt_id, person_decision, recorded_by, captured_at, resolution_reference? | Provider cannot create; positive validated result required |
| audit_events | entity_type/id, actor, command, from/to state, entity_version, reason, time, request_id | Restricted append-only; exclude sensitive payloads |
| idempotency_records | actor_id, command_name, key, payload_hash, response, created_at, retention_until | Unique actor/command/key; same-key different-payload conflict |
| programme_cards | programme ID, source URL, checked_at, jurisdiction, navigation checklist, approval status | Informational, no guaranteed eligibility |

The local cash extension stores fundingRequests, fundingBudgets and messages in authoritative SQLite state, with normalized funding_request and case_message integrity tables. Providers receive minimal case-grant projections. See [current fields and constraints](FUNDING_AND_COMMUNICATION.md). The proposed PostgreSQL resource tables remain a future migration rather than deployed schema.

## 3. Key integrity constraints

1. Composite identity uniqueness: tenant_id + source_dataset_id + source_task_id.
2. All cross-entity references belong to the same tenant. Cross-organization access is case-grant scoped.
3. Immutable approved task identity. An updated CSV cannot turn one task into another.
4. Active attempt states use a partial unique index on need_id. The concrete migration must use the canonical state set from STATE_MACHINES.
5. Reservation belongs to the accepted attempt and selected offer's capacity window. Unique attempt allocation.
6. Conditional free-capacity check occurs under lock in the same acceptance transaction; an aggregate computed client-side is not a constraint.
7. Expiry/withdrawal actions share guards with normal actions and are replay-safe.
8. Closure requires an authorized positive receipt_confirmation and appropriate state, not only delivery_report existence.
9. Programme/rule versions used by a plan remain reconstructible; updating a rule does not rewrite old plans.
10. Audit events append; routine clients cannot edit/delete history or memberships.

## 4. Suggested indexes

- visit_tasks(tenant_id, staff_id, due_date, status).
- visit_tasks(tenant_id, locality_id, priority).
- support_needs(tenant_id, coordinator_id, status, next_action_at).
- referral_attempts(offer_id, status, offer_expires_at).
- service_catchments(geography_id, offer_id).
- capacity_windows(offer_id, starts_at, ends_at).
- consents(need_id, status, expires_at).
- audit_events(entity_type, entity_id, created_at).

These are proposed; verify query plans and size after implementation rather than prematurely add every possible index.

## 5. Minimal provider projection

Before acceptance: request reference, document-help category, permitted locality, preferred mode/window, units, acceptance deadline and consent scope. No patient_ref, route coordinates, clinical flags or other needs.

After acceptance: same fields plus permitted arrangement/contact-relay details under a current grant. Withdrawal/expiry revokes access. A provider's historical aggregate service count can remain without identifying withdrawn case details.

Worker sees own assigned tasks and needs it captured. Coordinator sees its assigned catchment/needs and only its authorized clinical capabilities. Donor/public views use aggregate projections only.

## 6. Retention and production boundary

Synthetic fixtures may be reset reproducibly. For a live pilot, obtain approved purpose-specific retention periods; deletion/consent withdrawal/audit retention are distinct controls. Do not invent a universal Indian health-record retention period. Offline data must have an approved device/storage policy before real use.

Use [security/privacy](SECURITY_PRIVACY.md) for Lovable data restrictions and [role permissions](ROLE_PERMISSIONS.md) for row/field access.
