# Product requirements — ASHA Saath

Version 1.0 · 8 October 2026 · Owner: hackathon team · Product status: specified, not implemented.

## 1. Problem and outcome

An ASHA/ANM needs a day plan that fits travel, visit durations and due work. A visit may reveal a nonclinical access barrier: the person needs help understanding a document checklist or reaching a public service. A directory entry or sent message does not establish that help was accepted or delivered.

ASHA Saath connects two measurable workflows: **a feasible, explained visit plan** and **a consented support request with a named owner and a confirmed outcome**. The expansion must strengthen Healthcare 03 rather than replace it with an NGO marketplace.

The [official problem listing](https://hackathon.gitjaipur.com/ps) identifies Healthcare 03 as the ASHA/ANM scheduling optimizer with risk-weighted prioritization. Detailed CSV/geographic/coverage requirements are retained from the earlier expanded-panel reading; current extraction did not recover the full expanded wording. Treat our extended inputs as product design, not a quotation of the organizer.

## 2. Users and responsibilities

| Persona | Main job | Product responsibility | Avoid adding |
|---|---|---|---|
| ASHA worker | Complete trained/authorized community visits and identify barriers | Today's plan, short visit result, consent-assisted need capture | Unpaid donor follow-up or clinical diagnosis by software |
| ANM / supervisor | Approve clinical rules and handle escalation | Review supplied priorities, difficult/unserved tasks, coverage | Automatic replacement of clinical authority |
| Support coordinator | Run a participating local service network | Provider verification, matching, recovery, person confirmation and closure | Unowned referrals |
| NGO intake worker | Accept feasible work for its branch/service | Capacity, acceptance/decline, arrangement and delivery report | Whole district patient database |
| Person/family | Receive an authorized visit and choose support | Understand sharing, consent/decline/withdraw and confirm experience | Forced enrollment or public exposure |
| District/state programme reviewer | See operational gaps | Permitted aggregate coverage/backlog by geography | Named household map or diagnoses |
| Donor/CSR reviewer, later | Resource a defined service | Aggregate requests, approvals and reconciliation | Clinical priority control or direct access to beneficiaries |

One small demo coordinator persona combines supervisor and support duties. The permission model still distinguishes clinical rule approval from NGO operations. A live pilot needs appropriately authorized people and coordinator resourcing.

## 3. Jobs to be done

1. “Before leaving, show what I can complete today, why these visits come first and which tasks still need attention.”
2. “If a household is unavailable, show a feasible next plan without losing the missed task.”
3. “When someone asks for document help, record only what the relevant provider needs, with their permission.”
4. “Match a service that actually covers this locality and has current capacity.”
5. “If help is declined or expires, show who must act next.”
6. “Tell me whether help was only offered, accepted, reported delivered or confirmed.”

## 4. Scope by phase

| Scope | Included |
|---|---|
| P0 core demo | 24 synthetic CSV tasks, two staff assignments, one planning date, locality grouping, deterministic route/time model, priority explanation, unserved reasons and coverage projection |
| P0 support demo | One document-navigation category, public-pathway reference, minimal consent, three fictional offers, sequential offer, online atomic acceptance, arrangement, provider report, worker/person confirmation, coordinator closure and unresolved recovery |
| P0 operational UI | Worker mobile, provider intake, coordinator desktop, Hindi/English, government-style shell, synthetic banner, role-specific presentation |
| P1 after core | Downloaded plan, queued visit/need drafts, synchronized result/conflict states, basic print day sheet and fuller accessibility checks |
| P2 pilot | Participating provider onboarding, approved current rules, real data arrangement, multiple service categories, actual response SLA and coordinator budget |
| P3 wider programme | Multi-cadre/joint scheduling, approved integrations, wider locality discovery, restricted funding/in-kind workflow and permitted state/national aggregates |

The user's explicit 9 October instruction adds synthetic cash assistance and permitted case communication to the working prototype. [Funding and communication](FUNDING_AND_COMMUNICATION.md) governs this extension: separate permission, NGO budget approval/reservation, external payment report, independent receipt confirmation and in-app messages. Real payments, partners and programme expansion remain later work.

## 5. Functional requirements and observable acceptance

| ID | Requirement | Acceptance |
|---|---|---|
| FR-01 | CSV validation and preview | The 24-task fixture imports; invalid rows show row/column/reason; no publish until conflicts are resolved or explicitly excluded |
| FR-02 | Stable import identity | Identical repeat import creates no duplicate tasks; two distinct task IDs for one patient remain distinct |
| FR-03 | Rule-supplied priority and escalation | Source/version visible; unknown or conflicting priority enters review; urgent escalation is visible separately |
| FR-04 | Geographic grouping and explained order | Every planned task has a locality group or an explicit ungrouped marker; nearest-neighbour seed and final order are reproducible |
| FR-05 | Feasible daily plan | Start/end travel, visits, time windows, breaks and buffer fit the declared shift; infeasible tasks have reason codes |
| FR-06 | Unserved and difficult-case visibility | Every due task is planned, completed, explicitly excluded or unserved; remote/deferred tasks remain countable |
| FR-07 | Replan and coverage projection | Unavailable task remains visible; future planning advances date, respects dates and avoids duplicate assignments |
| FR-08 | Visit result | A worker can record completed/unavailable/deferred with timestamps; nonclinical help does not change clinical disposition |
| FR-09 | Minimal need and consent | Without a recorded scoped consent no provider offer is sent; consent text and withdrawal action are visible |
| FR-10 | Public pathway and service discovery | One source-linked document-navigation pathway; rural/urban area filters; discovery is distinct from participating service readiness |
| FR-11 | Catchment, verification and fresh capacity | Wrong locality, unverified service, missing eligibility or stale/full offer is excluded with an explanation |
| FR-12 | Sequential offer and atomic acceptance | One active attempt/allocation; two simultaneous requests cannot reserve the last unit twice |
| FR-13 | Arrangement and delivery report | Acceptance records a slot/resource; provider report alone leaves the need open |
| FR-14 | Confirmation, dispute and closure | Authorized confirmation precedes closure; disagreement stays disputed for coordinator resolution |
| FR-15 | Recovery ownership | Decline/expiry/no match has owner, reason, due next action; coordinator may select another permitted offer |
| FR-16 | Offline continuity | Downloaded plan opens offline; queued entries show unsynced status; no offline provider acceptance or fake capacity reservation |
| FR-17 | Roles, audit and minimization | Provider cannot read another provider's request; donor/public aggregate view exposes no household identity; key commands are auditable |
| FR-18 | Government-style bilingual accessible interface | Consistent header/tokens; Hindi layout and 320-pixel reflow; keyboard/focus/status/error labels work |
| FR-19 | Honest metrics | Counts distinguish due/planned/visited/escalated/unserved and offered/accepted/reported/confirmed; simulated travel labelled |
| FR-20 | Restricted funding/in-kind extension, later | Approval, external fulfillment and reconciliation separate; no donation custody or unapproved financial data |

P0 release requires FR-01 through FR-15 and FR-17 through FR-19. FR-16 follows the working core and is necessary before calling the prototype “offline capable.” FR-20 is documented, not included in the core completion claim.

## 6. Core journeys

### Visit planning

Coordinator previews CSV → resolves review rows → selects worker/date/shift → generates plan → sees priority/locality reasons and modeled travel → worker follows the plan → marks one household unavailable → recalculates remaining day → coordinator sees coverage and all unserved tasks.

### Support fulfillment

Worker records document-help need during a visit → shows public pathway → explains purpose/recipient/fields → records consent → coordinator reviews eligible offers → excluded provider's catchment reason shown → first eligible provider declines/full → coordinator offers to next eligible provider → provider accepts → arrangement recorded → provider reports help → worker records person's confirmation → coordinator closes.

### Failure/withdrawal

Expired or rejected request becomes unresolved with a named owner. A person may withdraw. Provider access and future action stop; earlier events remain under restricted audit/retention policy. No response is not success.

## 7. Product metrics

| Metric | Definition | Limit |
|---|---|---|
| Due coverage | Completed due tasks / eligible due tasks for frozen cohort/date | Exclusions disclosed; visits are not health outcomes |
| Planned coverage | Scheduled due tasks / eligible due tasks | A plan is not completed care |
| Priority coverage | Same counts by approved P1/P2/P3 class | Urgent escalations separate |
| Feasibility | Shift duration and hard time-window violations | Modeled estimates depend on declared speeds/durations |
| Travel comparison | Modeled travel minutes under same inputs and model for baseline and planner | No fixed savings percentage promised |
| Referral acceptance | Accepted unique needs / offered unique needs | Provider acceptance is not delivery |
| Confirmed fulfillment | Closed confirmed unique needs / consented unique needs in cohort | Pending/withdrawn/disputed separately shown |
| Recovery backlog | Unresolved/expired/disputed cases by age, owner and reason | Counts need context; no blame leaderboard |
| Worker burden, pilot | Additional capture/follow-up minutes and usability feedback | Must be measured in field |

Proposed usability target: an explained support need + permission should take about two minutes in a local assisted test. This is a design target, not a verified result.

## 8. Non-goals for the hackathon

No diagnosis bot, live government data scraping, automatic benefit approval, national NGO coverage claim, public beneficiary crowdfunding page, wallet/payment storage, multi-state rules engine, route optimality proof, real ambulance dispatcher or automatic staffing/incentive decisions.

## 9. Risks and how the product responds

| Risk | Response in product |
|---|---|
| Clinical risk generated incorrectly | Only approved inputs; unknown goes to review; no LLM in decision path |
| Easy nearby visits displace difficult priority work | Priority/deadline/deferral precede geography; hard cases explicitly remain visible |
| Listed organization cannot deliver | Verify service/branch/locality/capacity separately |
| Last slot double-booked | Server transaction and unique active allocation |
| Person not comfortable sharing | Minimal purpose-specific consent; alternative assisted public pathway; withdrawal |
| Worker becomes unpaid case manager | Coordinator owns referrals and recovery |
| Unsupported government-like claims | Original branding, prototype banner, source dates and capability status |
| Lovable data terms do not suit live data | Synthetic demo; separate reviewed arrangement before a real deployment |

## 10. Completion definition

A judge can follow a working 24-task import-to-plan journey and an offer-to-confirmation journey, including at least one unresolved case. The team can explain the original PS fit, current competitors, partner operations, time assumptions and what remains synthetic. Runtime/RLS/concurrency tests must be recorded once implemented. Documentation readiness alone is not product completion.
