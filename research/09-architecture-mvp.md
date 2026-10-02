# Healthcare 03: implementable 24-hour architecture and MVP

Prepared 8 October 2026. **Report only: no application, live integration, partner participation, funding or measured impact is claimed.** All algorithms, fields, states and build estimates below are our design proposals. Evidence comes from the companion research files and their primary-source URLs; operational assumptions still need local validation.

## Product decision

Build **a feasible daily visit planner, followed by one consented referral for nonclinical entitlement-document navigation**. The winning interaction is: import a synthetic caseload, explain which visits are due, show a usable worker day and every unserved task, record an access barrier during a completed visit, obtain permission, secure a participating provider's acceptance, and distinguish reported help from confirmed help.

Keep the original Healthcare 03 visibly central. The official listing confirms the title, “Community Health Worker (ASHA/ANM) Visit Scheduling Optimizer with Risk-Weighted Prioritization.” The detailed CSV, geography, daily route, rule-based risk, travel estimate, risk flag and coverage requirements are retained from the parent session's earlier expanded-panel reading; current extraction did not independently recover the expanded text. Save that panel before claiming an exact quotation. [Official problem statements](https://hackathon.gitjaipur.com/ps).

This is a companion workflow hypothesis, not a first-ever product category. The research catalogues **24 schemes/programmes and 30 platforms/services**; those are catalogue entries, not unique companies, households, markets or independent entitlements. ANMOL, CommCare and others already document worklists, prioritization and offline collection. Ni-kshay already provides a consented, district-coordinated community-support precedent. Shaishav was officially described in August 2026 with at-risk line-listing, visit tracking and referral follow-up; Poshan Tracker documents an AWW home-visit scheduler introduced in April 2026. Their documented scope does not establish universal local implementation, but it rules out a claim that scheduling and referral follow-up are new inventions. [ANMOL manual](https://nhmmizoram.org/upload/Anmol%205.0.12%20User%20Manual_28May2024.pdf), [CommCare Precision Tasking](https://commcare.dimagi.com/blog/precision-tasking-framework/), [Ni-kshay support guidance](https://tbcindia.mohfw.gov.in/wp-content/uploads/2023/05/1583929709Guidance-Booklet_02-08-2022.pdf), [Shaishav workshop](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2303141&lang=2&reg=48), [Poshan Tracker backgrounder](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2251769).

## Bound the demo

Use 20–30 visibly synthetic visit tasks in one fictional catchment, two preassigned staff members, one planning date, a configurable daily time budget, and three fictional provider offers for the same document-navigation service. Label every screen **Synthetic demonstration — no live government or NGO connection**. Avoid realistic beneficiary identities, real household pins, Aadhaar numbers and named NGOs presented as participating partners.

Three views share the same application:

- **Worker:** CSV validation, today's route/list, priority explanations, unserved queue, visit completion and a short support-need form.
- **Coordinator:** approved rule versions, assignment review, coverage projection, unmatched/expired/disputed referrals and named follow-up ownership.
- **Provider:** only that provider's offered/accepted cases, acceptance/decline, appointment and service reporting.

The referral service is assistance understanding a public-programme document checklist and preparing the next application step. It supplies navigation; it does not issue a certificate, approve a benefit or guarantee payment. For the demo, seed one source-linked checklist from the scheme research and a synthetic partner offer; do not build all 24 programme rules. A “potentially applicable public pathway” card is separate from final authority-confirmed eligibility. Government services remain an explicit option and actual access barriers remain visible.

## Caseload and rule contract

The extended demo CSV contract accepts `patient_id`, `location`, `staff_id`, `rule_id`, `priority` and an immutable `source_task_id` (a documented `task_id` alias is acceptable). The importer also binds a stable source/dataset identifier. These identity fields are required for repeat imports; missing identity goes to review rather than deduplication by patient alone. They extend the original PS input instead of being claimed as its exact required columns. A location must resolve to explicit coordinates or a manually confirmed locality reference; a text address alone is not silently converted into a precise home. Recommended columns are `latitude`, `longitude`, `location_confidence`, `locality_id`, `due_date`, `earliest_time`, `latest_time`, `visit_minutes`, `required_cadre`, `last_visit_date`, `defer_count`, and `risk_flags`. A worker/day configuration supplies start/end coordinates, mode, shift start/end, fixed commitments and buffer. Demonstration durations and speeds are labelled assumptions, editable by the coordinator.

Validate before publishing an import: missing/duplicate task IDs, conflicting staff assignments, unknown rules, invalid coordinates, invalid dates, negative durations, unsupported priority values and unresolved location. Show accepted rows and row-level errors. Use `(source, source_task_id)` as the import identity so repeating the same import updates through an explicit preview instead of creating duplicate visits. A patient can legitimately have multiple distinct tasks; do not deduplicate solely on patient ID or name. Do not manufacture clinical data from missing fields.

Rules are versioned configuration: `rule_id`, programme, source URL/date, effective date if known, district approval reference/status, due window, required cadre, priority bucket, supplied flag explanations, escalation path and review date. CSV priority may be used only when supplied by an approved authority or clearly marked synthetic. If priority conflicts with the approved rule version, put the row in review and display the discrepancy; no hidden override.

SSBSK was launched in June 2026 and changes the contemporary child-health context. The official 2026 schedule was not independently retrieved in the ground-truth research. Do not hard-code legacy HBNC/HBYC dates as the current SSBSK standard. Demonstrate generic tasks or visibly synthetic rules until the official table and district instructions are approved. [SSBSK launch](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2279075&lang=1&reg=3), [official guideline catalogue](https://nhm.gov.in/index4.php?lang=1&level=0&lid=825&linkid=521).

## Deterministic planning, with clinical boundaries

The software schedules **already classified tasks**. It neither diagnoses disease nor generates clinical risk from symptoms, photographs or an LLM. Imported risk flags show their source, owner and date. Unknown or contradictory classification is a review task. Incentive amounts, donor interest and fundraising urgency never alter clinical priority.

An urgent flag from an approved pathway creates **clinical escalation required** before routine route generation. Display the locally configured escalation contact/instruction and record acknowledgment and handoff. The worker can also invoke that pathway when a finding warrants escalation under her training. The planner cannot declare the situation safe, replace assessment or wait for NGO acceptance. The urgent task remains visible until an authorized health-team disposition; it is excluded from routine-route coverage with a separate escalation count, rather than shown as a successfully completed visit. ASHA referral and trained cadre boundaries are grounded in NHM/NHSRC guidance. [NHM ASHA role](https://www.nhm.gov.in/images/index1.php?lang=1&level=1&lid=226&sublinkid=150), [NHSRC Community Processes](https://nhsrcindia.org/practice-areas/cpc-phc/community-process-asha).

Proposed planning procedure:

1. Freeze an input snapshot and policy version for a selected staff member/date. Respect existing staff assignment and required cadre. Split tasks into escalation, review, eligible due, future and completed groups. Joint visits are deferred in the MVP: a task marked joint-required is visibly `coordination_required` and cannot be counted as independently completed by one cadre.
2. Perform required **geography-based grouping by confirmed locality**: tasks sharing a confirmed village/hamlet/ward locality ID form a group; tasks without a confirmed locality retain individual ungrouped markers rather than an invented common catchment. Retain group membership in planning output and show group-level coverage. Within an otherwise identical priority/deadline/deferral/due-date tier, construct a deterministic nearest-neighbour seed order from the staff start coordinate, repeatedly choosing the closest remaining task and using task ID to break distance ties. Geographic grouping and this route seed are explicit MVP outputs, not optional enhancements.
3. Order eligible due tasks by approved priority bucket, then approved latest permissible date, then deferral count descending, due date, and the nearest-neighbour seed order only within those ties. Geography cannot override those approved service/fairness fields. A supervisor-configured maximum postponement policy raises a visible mandatory-review constraint when exceeded; do not invent a universal medical interval or change clinical priority merely because a case is remote. Display groups and distance tie-breaking cannot justify repeatedly deferring a remote household without this visible review.
4. Insert tasks one at a time in that deterministic order. For each task, evaluate every insertion position in the current route. Recompute travel, arrival, waiting, visit duration, fixed commitments, breaks, buffer and return-to-end time. Choose the feasible insertion with the lowest incremental travel; tie-break on earliest arrival, then insertion position. If none is feasible, retain a named unserved reason.
5. Optionally apply a deterministic travel-reduction pass only to the selected visit set, preserving priority coverage, availability and commitments. This is a heuristic feasible plan, not a mathematical optimum.
6. Persist route version, selected IDs, timings, assumptions and all rejected/review IDs. Manual edits trigger the same feasibility check. A coordinator may authorize an override with a reason; it does not erase a warning or make an impossible shift feasible.

The primary objective is approved priority and due-service coverage within a usable day; travel is a secondary choice within that coverage plan. A remote priority visit may increase kilometres and reduce total visit count. Show that tradeoff. If a high-priority task cannot fit even alone, give it a specific escalation to supervisor review; do not silently fill the day with easier tasks and claim all needs covered.

For a first build, compute a deterministic pairwise distance estimate using coordinates and a declared mode/speed assumption, optionally a separately calibrated detour factor. Label it **estimated travel from coordinates, not a road ETA**. Add service time, return travel and waiting to the time budget. Missing coordinates, a blocked road reported by the worker, an unavailable household or uncertain access require manual review or explicit correction. A haversine estimate cannot prove a traversable route. Show a confidence badge and last location confirmation. Road matrices and traffic can come later after access, cost and routing quality are evaluated.

### Coverage and fairness output

Show due eligible visits covered/total, bucket-level coverage, planned travel/service/wait/buffer minutes, planned end time and all unserved cases with reason and next owner. Separately list escalations, review cases, joint-required cases and future tasks so denominator changes cannot hide them. Show remote/locality coverage and consecutive deferrals. Avoid a public household map or a punitive worker GPS score.

For the required **coverage projection**, rerun the same scheduler across the next three configured working days on the frozen task backlog, removing simulated scheduled tasks from subsequent simulated days and advancing the **planning date**, while preserving each task's approved due date/window. An authorized source update may change a due date through a separate reviewed event; the projection does not move deadlines. Respect each day's known availability. State assumptions: no new cases, no cancellations, the same travel model and supplied future household windows. Unknown future availability is marked unconfirmed; remaining unscheduled tasks remain visible. This is forecast coverage under assumptions, not a promise of visits or a health outcome.

## One NGO flow: consented document-navigation assistance

After completing a visit, the worker chooses `document_navigation`, records the actual access barrier and public pathway already tried, confirms that assistance is wanted, and selects a safe contact preference. Reuse internal case/locality references; do not copy full health records. The new support task has its own coordinator owner and next-action date. The health task remains governed by its own completion/clinical state.

A **service offer** belongs to a branch and a specific service, not to the organisation's national address. It declares confirmed villages/wards or administrative IDs, delivery mode/accessibility, eligibility and exclusions, source/version, opening times, response deadline, cost/free status, grant restriction if any, current capacity unit/window, confirmation timestamp, expiry and responsible operator. A registered NGO is not automatically a qualified or available provider. Darpan's ID explicitly does not confer government endorsement. [NPO Darpan notice](https://ngodarpan.gov.in/?lang=de).

Matching uses hard filters first: service category, actual catchment, readiness check still valid, eligibility confirmed for the navigation service, accessible modality, open intake window, unexpired capacity and permitted consent purpose. Unknown eligibility is `manual_review`; stale capacity is `capacity_reconfirmation_required`; no eligible offer yields `unmatched`, never an invented match. Eligibility to receive document help is distinct from eligibility for the underlying government benefit.

Rank only passing offers by earliest feasible appointment, beneficiary preference, accessibility/travel burden, capacity freshness, then stable offer ID. Explain each match in plain language. A newly participating provider need not have a response-history score; defer reputation-based ranking until there is meaningful, audited data. No paid promotion or donor appeal score influences matching.

For the demonstration, offer one case to one provider at a time. The case may have sequential attempts when an offer is declined or expires. The case owner arranges a fallback and records all attempts. Later parallel offers would still require exactly one authorized allocation for the same service request.

Internal matching can occur after agreement to seek assistance, without disclosing the case externally. Before each `offered` transition, show the selected recipient, service purpose, permitted intake fields and safe-contact step; record recipient-specific permission or verify that the current consent explicitly covers that recipient. Changing providers requires that check again. Acceptance cannot enlarge the consented field set.

### State machine and permission to move state

The need and individual offer attempts are separate records; a failed attempt does not erase the need.

| State | Allowed next action and owner | What the state proves |
|---|---|---|
| `draft` | Worker records category, barrier and owner; person may decline | A need draft exists; no sharing |
| `consent_pending` | Assisted or direct service-specific permission recorded; refusal closes as `person_declined` | Permission has not yet been granted |
| `ready_for_match` | Coordinator/system evaluates current offers and eligibility | Permission permits the selected purpose; no provider commitment |
| `manual_review` / `unmatched` | Coordinator resolves uncertainty or confirms another offer, with current permission | No valid allocation; remains on unresolved dashboard |
| `offered` | Identified provider accepts/declines before deadline; coordinator may cancel; system may expire | Provider has been asked, not booked |
| `accepted` | Provider reserves capacity atomically and sets appointment; person may decline; coordinator can cancel | Provider agreed to the bounded service |
| `arranged` | Provider records appointment/access plan; missed attempt creates follow-up | A service arrangement, not delivery |
| `delivery_reported` | Provider records completed navigation session and next-step outcome; authorized worker/person confirms or disputes | Provider says the session occurred |
| `confirmed` | Worker/person records agreed proportionate confirmation; coordinator closes | Confirmation of document-help session only |
| `closed_resolved` | Terminal; correction requires auditable reopening | This support service was confirmed, not benefit approval or improved health |
| `delivery_disputed` | Coordinator investigates, then resolves or closes unresolved | Conflict remains visible; not counted as confirmed |
| `closed_unresolved` | Coordinator records reason and remaining public-service barrier | Closure without successful support |
| `consent_withdrawn` / `cancelled` / `person_declined` | Stop new sharing/arrangements, release allocation, record contact preference | No further permitted active referral under that consent |

Offer attempts have their own terminal `provider_declined`, `expired` and `cancelled` states. A waitlist is an explicit follow-up branch with consent, owner and review date; it cannot be displayed as accepted capacity. Decline reasons use bounded categories, with optional minimized text. Recontact after refusal follows the person's preference; do not equate refusal with unreachable status.

Use separate `service_outcome` values such as `checklist_explained`, `application_step_prepared`, `referred_to_authority` and `next_step_unresolved`. A completed navigation session can coexist with an unresolved entitlement barrier. Completion of the health visit, acceptance of NGO help, service reporting, beneficiary confirmation and public-benefit approval remain distinct events.

### Acceptance and conflict transaction

Provider acceptance is an online server transaction, never a client-only button. Lock the need, current consent and relevant offer/capacity row in a consistent order. Recheck provider/assignment permission, state/version, consent still active, confirmed eligibility, catchment, valid capacity window, offer expiry and any required funding authorization. Atomically reserve one unit only if available, create the allocation, and transition the attempt/need to accepted. Commit together; failure leaves no reservation. Add database constraints for one active allocation per need/service request and nonnegative capacity.

Every mutating request includes stable event ID, actor, client timestamp and expected record version. Duplicate event IDs return the stored result without a second allocation or visit count. A different event against a stale version returns an explicit conflict and current authoritative state. Two provider acceptance requests for one remaining slot cannot both succeed; the loser receives `capacity_unavailable` or `allocation_conflict` and is sent for coordinator review. An expiry/cancellation race uses the same locks and state checks. Release capacity exactly once on cancellation or withdrawal; consumption after delivered service remains a historical fact, not a new free slot in the same accounting window.

Capacity is accounted as `total = available + active reservations + consumed` for the declared service window, with any authorised adjustment separately logged. A reservation expiry before arrangement releases its unit and returns the need to `manual_review` with `capacity_reconfirmation_required`; the UI must remove the booking promise. An arranged appointment uses the provider-confirmed appointment window and its cancellation policy, rather than silently expiring on a short offer-response timer. Delivered service atomically changes reserved to consumed once.

Withdrawal increments consent version and marks the case blocked for new sharing in the same transaction, cancels eligible active offers/arrangements, and releases unconsumed reservations. Notify the responsible provider through the product and log acknowledgment. It cannot recall information already legitimately viewed or undo completed service; retention/deletion follows the agreed policy. Late delivery evidence after withdrawal is quarantined for coordinator review, with factual chronology retained; it cannot silently reopen the case or imply renewed consent. Provider-reported delivery and beneficiary dispute are two append-only facts rather than last-write-wins edits.

## Offline: a limited, honest promise

For the hackathon, cache only the synthetic assigned day's plan and minimal task references. A worker can read it and queue visit completion or a need draft with UUID event IDs; display **offline, pending server acknowledgment** and last-sync time. Downloaded matches are explicitly stale observations. Offline users cannot reserve shared NGO capacity, confirm provider acceptance, change approved clinical rules or finalize fund approval. An appointment slot becomes real only after online acceptance or a separately logged authorized coordinator channel.

Record local withdrawal immediately, stop further local sharing and prioritize its sync. Do not promise instantaneous revocation on another offline device. On reconnection, authenticate anew, recheck role/assignment and consent version, replay duplicate-safe events and show conflicts rather than merging clinically meaningful facts automatically. Server revocation rejects queued prohibited changes. Keep a visible pending/conflict count and allow safe correction; no hidden “sync successful” if some records failed. A production offline implementation needs device controls, encrypted protected storage, expiry, loss handling, secure deletion and a defined revocation delay. A service worker caching synthetic data does not establish production privacy readiness.

## Minimal stack and schema

Use one mobile-friendly TypeScript web application, one server process with relational transactions, and PostgreSQL. Keep planner, matcher, permissions, state transitions and CSV validation as modules in that process. A small scheduled job in the same deployment expires offers and creates follow-ups. No microservices, message broker, vector database, LLM dependency, public donor marketplace or payment gateway is needed. Use a locally drawn coordinate route and a table if map tiles cannot be loaded; the plan must remain reviewable without an external map service. Add deployment/tool versions only after the build environment is chosen and checked.

| Record | Minimum useful fields and constraints |
|---|---|
| `User`, `StaffAssignment` | Role, organisation, permitted geography, assigned task/patient references, active/revoked status; server checks every query/mutation |
| `HouseholdRef` | Internal ID, restricted source patient ID, confirmed locality/coordinates/confidence; safe contact stored separately with restricted access |
| `RuleVersion` | Versioned programme/rule, authority/source, approval, due/priority/cadre/escalation policy; immutable once used |
| `VisitTask` | Source/task identity, household, staff/cadre, due window, supplied priority/flags, duration, availability, deferrals, independent visit state |
| `PlanSnapshot`, `PlanStop` | Date/staff, input/policy versions, travel assumptions, route/timings, status and rejected IDs/reasons; stale plan warning after changes |
| `NeedCase` | Household reference, category/barrier/public pathway, support owner/date, current version/state, active consent reference; clinical state not embedded |
| `ConsentEvent` | Purpose, intended recipient scope, approved fields, assisted/direct recording, actor/time, grant/withdrawal, version; append-only chronology |
| `OrganizationBranch`, `ServiceOffer` | Service/catchment/readiness, eligibility source/version, accessibility, hours, free/cost/restrictions, capacity unit/window/freshness/expiry |
| `ReferralAttempt` | Need, selected offer, permitted payload snapshot/version, deadline, accept/decline/expiry/cancel state and reason |
| `CapacityReservation` | Need/offer/window, quantity, active/consumed/released, reservation expiry; one active allocation per need/service request |
| `DeliveryEvent`, `FollowUp` | Provider report, permitted evidence, independent confirmation/dispute, owner/date and outcome; no compulsory beneficiary photos |
| `FundingRecord` | Optional budget/request reference, permitted cost/category, approval actor, external payment/in-kind receipt status; no balance/wallet |
| `EventReceipt`, `AuditEvent` | Unique event ID/idempotent result, entity/version, actor, transition, server time, source; logs omit unnecessary clinical/contact content |

Minimal interface contracts: import/validate CSV; generate/read plan snapshot; submit visit event; create need/record consent; list explainable matches; send offer; accept/decline; arrange/report/confirm/dispute; withdraw consent; read coordinator unresolved queue. Server handlers enforce explicit transitions instead of letting clients set arbitrary status values. Rate limits, secure sessions, database constraints and ordinary error handling belong in the same backend. The exact database library and frontend framework are routine implementation choices, not distinguishing product features.

## Access and data minimization

Worker access is limited to assigned cases. Supervisors see authorized geography; clinicians own clinical priority and health escalation. Providers see only requests offered to their service and fields consented for intake, with contact details released only at the agreed step. A provider cannot browse the caseload, route history, diagnosis or another NGO's cases. A funder receives approved project requests and sufficiently aggregated outcomes; there is no patient directory. Public access, if ever added, covers generic service information only.

Enforce role plus organisation, geography, assignment and purpose on the server; hiding a UI tab is insufficient. Demo accounts and fixtures are labelled. Record access/revocation and state transitions; provide a retention/deletion policy, safe-contact preference and grievance route before a pilot. Do not require a household smartphone, OTP, Aadhaar scan or public story for assistance. A provider badge states the exact identity/readiness/catchment checks and dates, rather than “government verified.” Household health permission does not automatically authorize NGO disclosure or donor reporting.

Do not claim that CSV import is connected to RCH, U-WIN, Shaishav, ABDM or Darpan. Public standards and source-code availability are not record-access permission. ABDM can represent service requests, so the design also must not claim it is technically incapable of referrals. Production interoperability needs authorised agreements, tested mappings and security review. [Official ABDM consent/sandbox/security description](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2152537&lang=2&reg=48), [published FHIR guide](https://www.nrces.in/ndhm/fhir/r4/index.html).

## Funding is a record of decisions, without custody

The selected navigation demo uses synthetic in-kind appointment capacity at no beneficiary cost. Show a compact optional funding progression: `not_required` or `request_draft -> cost_reviewed -> approval_pending -> approved/declined -> external_disbursement_reported or in_kind_supplied -> receipt_recorded -> reconciled`. Approval has a named authorised NGO/funder owner; an app administrator does not invent that authority. If funding is necessary to provide the service, acceptance must be conditional until approval or a provider commitment to supply it without that funding is recorded.

These states neither transfer money nor certify financial compliance. No donations, custody, wallet, fund balance, escrow, “available CSR pool” or guaranteed grant is part of the 24-hour build. External receipt status is reported metadata with appropriate review, not payment-provider confirmation. Before actual money movement, partners need source/entity-specific financial and legal review. CSR Exchange itself distinguishes platform/project interaction from funding decisions. [CSR Exchange FAQ](https://www.csrxchange.gov.in/Frontend/faq).

## 24-hour delivery plan

| Time budget | Buildable output |
|---|---|
| Hours 0–3 | Freeze scope/contracts, seed fictional inputs/offers, create three role views and source/provenance labels |
| Hours 3–9 | CSV preview/errors, staff-filtered deterministic plan, timings, risk explanations, unserved queue, locality groups and three-day projection |
| Hours 9–15 | Need/permission capture, one service matcher, offered/accepted/declined/expired flow with atomic capacity |
| Hours 15–19 | Appointment, delivery report/confirmation/dispute, coordinator queue, withdrawal and idempotent events |
| Hours 19–22 | Limited synthetic offline read/queue, race/edge-case validation, baseline metrics and clear assumptions |
| Hours 22–24 | Usability pass, seeded reset and rehearsed demonstration; fix core defects before optional features |

**Must:** end-to-end CSV scheduling core; feasible route and return time; explicit priority provenance/urgent bypass; every unserved case visible; coverage projection; one source-linked public pathway; consented offer matching; provider acceptance with capacity transaction; independent reported/confirmed outcome; server role/assignment checks; visible synthetic labels and honest baseline comparison.

**Should:** synthetic offline plan/read/queue with conflict display, capacity-expiry follow-up automation, Hindi labels reviewed by a fluent team member, assisted contact/consent, simple safe export, a read-only funding-state example. If time slips, keep offline claims limited and demonstrate its queue as a synthetic test scenario rather than asserting complete production support.

**Later:** jointly synchronized ASHA/ANM/AWW scheduling; cross-worker reassignment optimisation; realistic road matrices; authenticated state integration; validated multilingual voice; production device/offline security; multi-service referrals; financial integrations; generalized rule catalogue; large-scale provider onboarding. Joint-required cases must be flagged now even though joint-route optimization is later.

## Ten meaningful demonstration/test cases

| Scenario | Expected result |
|---|---|
| 1. Repeat import; one patient has two valid task IDs | Repeat same source/task does not duplicate; distinct tasks remain visible; conflicting rows are reviewed |
| 2. Remote high-priority household competes with three nearby routine tasks | Approved ordering preserves the remote case when feasible; increased travel is shown; routine misses remain visible |
| 3. High-priority task cannot fit; repeated remote deferral | Explicit infeasible reason and supervisor review; fairness policy triggers visible action; no fake complete coverage |
| 4. Missing coordinates, blocked access or expired rule | No precise invented location/ETA; task needs review; bucket denominators and review count are visible |
| 5. Availability window, fixed session, buffer and return-to-base | Every selected stop and return is feasible; manual rearrangement that breaks constraints produces a warning |
| 6. Approved urgent flag or joint-required task | Urgent pathway bypasses routine optimization; joint task awaits coordination; neither is counted as normal completed care |
| 7. NGO outside catchment, capacity stale or eligibility uncertain | Offer fails hard filter or goes to review; a directory listing is not a booking; no fabricated fallback |
| 8. Two acceptances race for one slot; same event retried | Exactly one allocation succeeds, retries are idempotent, losing request has a visible conflict without negative capacity |
| 9. Offline completion followed by consent withdrawal/access revocation | Local draft remains pending; reconnect rechecks authority/consent; rejected updates cannot resurrect sharing or inflate completion |
| 10. Offer timeout, reported delivery disputed, unauthorised provider lookup | Owner gets next-action queue; dispute excluded from confirmed success; provider cannot retrieve unrelated household/clinical data |

Use assertions on state transitions, row counts, capacity, access and feasibility, not screenshots alone. These cover material safety and shared-state behavior; avoid spending the hackathon on tests that merely restate labels.

## Metrics that do not manufacture impact

Compare against a reproducible baseline using the **same validated tasks, assignment, priorities, shift, availability and travel model**: priority/due-ordered task selection with append-only route construction in stable task-ID order inside ties. Show an optional simple distance-first route as an explicit tradeoff demonstration, with its priority misses exposed. Save the seed, inputs, algorithm versions and denominators. Do not compare an infeasible unrestricted baseline to a feasible constrained route without prominently reporting that difference.

Report estimated travel minutes, total planned minutes, visits served by bucket, due coverage, remote/locality coverage, overdue/deferral counts and the reasons for exclusions. A travel percentage is `(baseline - proposed) / baseline` only when baseline is nonzero and comparable; report no improvement or increased travel when that is the result. Display **simulation estimate on synthetic data**. Do not promise 30% savings, lives saved, clinically safer classification, optimality or field-proven outcomes.

For referrals, show matching, offered, accepted, reported delivered, confirmed and unresolved counts separately. Demo wall-clock response times are scripted behavior, not service-level evidence. A pilot would measure operator response, time to accepted appointment, confirmed session completion, unresolved barrier aging, user burden and unserved fairness, with observation windows and exclusions stated. Programme benefit approval and health outcomes need their own evidence.

## Shortcuts and pilot prerequisites

| Adopted 24-hour shortcut | Deferred capability / condition for production |
|---|---|
| Fictional records, seeded providers, source-linked manual rule review | Actual partner authorisation, district rules, worker mapping and service due diligence |
| Single backend/database; assigned-worker planning | Joint/multi-worker optimisation only after realistic calendars, scope and responsibility are agreed |
| Coordinate estimates and editable assumptions | Validated travel modes, seasonal access, safe routes and usable local calibration |
| One sequential referral attempt at a time | Parallel attempts only with recipient-specific permission and conflict-safe unique allocation |
| Assisted permission and minimal case payload | Locally approved consent wording, withdrawal, retention, safeguarding and grievance procedure |
| Synthetic offline cache and queued drafts | Secure device/storage controls, loss response, remote revocation limitations and field sync testing |
| Manually seeded expiry/readiness rules | Named partner owner, operational reconfirmation process, agreed response/expiry policies |
| Funding metadata only | Authorised budget owners, reconciliation and entity/source-specific review before payments |

Before a pilot, confirm what tools the catchment already uses and whether configuration or an add-on would serve it better. Obtain the actual 2026 programme rules and priority approval; a willing health team, coordinator and service providers; funded coordination and verification time; beneficiary/worker usability review; secure hosting, access auditing, tested backup/restore and incident handling; approved record-sharing and retention arrangements; a field-tested travel model; transaction/conflict tests; and realistic provider capacity/expiry/complaint procedures. Partner operations and physical service availability are prerequisites, not things software creates. Privacy implementation and legal review must use the applicable notified timeline rather than claiming that all DPDP provisions were fully effective on the report date. [Official staged commencement notification](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf).

## Minimal winning demonstration

In four minutes: import the synthetic CSV; show a remote approved-priority visit preserved in a feasible day and one missed case with a reason; compare estimated travel and bucket coverage honestly; complete a visit and record a document-access barrier; show an out-of-catchment/stale provider rejected; obtain recipient-specific permission and have the eligible provider accept one current slot; record help delivered then independently confirmed; finish on the coordinator view showing the still-unresolved entitlement step. A brief replay of two competing acceptance events for the last slot demonstrates technical credibility. The story succeeds by showing one usable day and one accountable support handoff, with failure visible.
