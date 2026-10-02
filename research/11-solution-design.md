# ASHA Saath: proposed solution and operating model

Working name only; brand uniqueness has not been researched. Research date: 8 October 2026. All architecture, examples, targets and budgets below are proposals, not deployed capabilities or measured impact.

## Recommendation

Build a visit planner with a small support-referral layer: **help the worker decide whom to visit today, then track whether a need discovered during that visit reaches an eligible, available provider and is actually addressed.** Keep government services, clinical care and NGO support as distinguishable pathways within the same need record.

The biggest implementation constraint is partner operations. Software cannot create transport, nutrition supplies, qualified staff or unrestricted funds. The minimum viable network is a willing local coordinator and a few providers with specific, current service offers. A national catalogue can help discovery later; national participation does not mean every NGO serves every village.

This is an adaptation hypothesis, not a first-ever invention. Indian frontline tools already support workplans and offline capture; overseas social-care platforms already document referral outcome tracking. The useful combination to validate is ASHA visit planning, Indian entitlement navigation, actual local service catchments, freshness of capacity, and follow-through with very little additional worker entry. See the platform catalogue and primary product documentation for the comparison.

## Stay inside Healthcare 03

The original problem is **Community Health Worker (ASHA/ANM) Visit Scheduling Optimizer with Risk-Weighted Prioritization**. Its expanded requirements, read earlier in this session, cover caseload CSV ingestion, geography-based daily routes, rule-based priority, travel estimates, risk flags and coverage projection. Current extraction reconfirmed the title but did not expand the description. [Official problem statements](https://hackathon.gitjaipur.com/ps).

The NGO feature should start **after a visit** and feed relevant follow-up tasks back into the planner. A stand-alone donation website would leave the required scheduling problem unsolved. Do not add NGO financing urgency to a clinical risk score: medical priority and support-access urgency are separate fields with separate owners.

## Four journeys that make the idea concrete

1. **Pregnancy follow-up and access barrier:** an ASHA visits a person already marked for priority follow-up by the health team. The person reports a transport or documentation problem. Show the applicable public-service pathway and local contact first. If the public service cannot be accessed in time, record the barrier and ask an opted-in provider whether a permitted bridge service is available. An NGO referral does not close the original medical task. A public-service failure remains visible to the supervisor even if temporary help is arranged.
2. **Child nutrition support:** route the assessment and programme follow-up to the authorized health/Anganwadi team. With consent, a non-clinical family-support need may be offered to a provider with suitable local services. Dietary treatment and clinical decisions remain with qualified staff; a food parcel is not proof that a clinical condition has resolved.
3. **Assistive-device access:** the worker identifies that an older or disabled person wants help navigating an assessment, certificate, device camp or transport. Match an eligibility navigator and a provider's actual programme catchment. Record separate milestones for assessment, application and device delivery; a successful form submission is not device receipt.
4. **TB-related social support:** only use an authorized and consented pathway aligned with the programme. Nutrition or livelihood assistance may complement treatment services. Keep sensitive identity and diagnosis out of donor listings. Support delivered is not treatment completion. Programme and beneficiary overlap with existing TB systems must be reconciled in a real pilot.

These are hypothetical journeys. No named beneficiary, local partnership or current service availability is asserted.

## Network design from village to national level

| Level | Who operates it | Data and decision | Boundary |
|---|---|---|---|
| Household / village / urban ward | ASHA and authorized health team | Today’s visits, consented need, preferred contact and constraints | Worker sees assigned cases; household identity stays restricted |
| PHC / urban primary health team | Supervisor or designated coordinator | Review priority, handle failed service access, follow unresolved needs | Clinical escalation stays in the health chain |
| Block / municipality / district | Named network coordinator with participating NGOs | Validate offers, maintain service catchments, contact non-responsive providers | Operational accountability must be agreed, not assumed |
| State | Authorized programme administrators / implementation partner | Maintain state-specific programme rules and aggregate capacity gaps | State eligibility and rollout cannot be copied from another state |
| National | Discovery catalogue and approved programme/funder interfaces | Search registered organizations and national programmes | Provider office location is not proof of nationwide delivery |

**Geography belongs to a service offer, not just to an organization.** A Jaipur-based NGO might serve two rural blocks for nutrition, provide counselling remotely in Rajasthan, and run a device camp only on one date. Those are three different offers. An organization marked “national” must still declare the catchment and eligibility of each offer.

Urban matching must handle wards, informal settlements, temporary addresses, migration and contact safety. Rural matching must handle hamlets, travel time, roads, outreach days and last-mile delivery. PIN codes help discovery but are often too coarse to establish eligibility or a feasible route. Keep geography configurable and validate it locally.

## Minimum information for a service offer

- Organization and branch identifiers; authorized service contact; legal identity evidence and review date.
- Service category and plain-language description; clinical/non-clinical boundary; who may deliver it.
- Catchment expressed as selected administrative units and, where needed, boundaries; delivery mode and accessibility.
- Eligibility conditions, exclusions, required documents and rule source/version.
- Opening times, intake process, response expectation and whether the offer is open, waitlisted or paused.
- Capacity quantity and unit (for example appointments this week, not an unspecified number); last confirmation and expiry.
- Cost, grant restrictions and whether assistance is free, partly funded or requires approval.
- Outcome states and allowed delivery evidence; grievance contact and re-verification date.

Registration, service readiness and funding authorization are three separate checks. NGO Darpan supplies a registration ID, with an explicit disclaimer that the ID is not an endorsement. A “verified” badge should explain exactly which checks were performed rather than imply government approval. [NPO Darpan](https://ngodarpan.gov.in/?lang=de).

## Need capture that does not burden the worker

Proposed first version: after marking a visit, the worker selects a support category, confirms that the person wants assistance, notes locality and the preferred safe contact method, and chooses the observed access barrier. Reuse authorized data already in the caseload rather than asking for another full registration form. Free text is optional. Voice entry may produce a draft the worker must confirm.

Capture only what is needed for the requested service. Full clinical history, Aadhaar scans, family photographs and diagnoses are not default NGO intake fields. A case can be handled with an internal identifier; the provider receives only the fields authorized for that referral. A person without a smartphone or OTP capability must have an assisted pathway. Missing identity documents should create a navigation task where possible rather than an automatic permanent rejection.

Separate refusal from unreachable status. Record “declined support” respectfully and stop repeated contact according to the person's preference. Household health consent is not blanket consent for every NGO, donor or future service.

## Referral states and accountability

Suggested states:

`draft -> consent recorded -> eligible offer selected -> offered -> accepted -> appointment/service arranged -> provider reports delivered -> beneficiary/worker confirmation -> closed`

Side branches must support `ineligible`, `declined by provider`, `expired/no response`, `waitlisted`, `person declined`, `cancelled`, `consent withdrawn`, `delivery disputed` and `closed unresolved`.

“Offered” means a provider was asked; “accepted” means the provider agreed; “delivered” means the service was reported as supplied; “confirmed” means the agreed verification was recorded. Reports show each stage separately. Closing unresolved preserves the failure reason; it must not be counted as a successful resolution.

Each case has a named follow-up owner and a next action date. The implementation partner must budget and assign coordinator time; this responsibility must not silently become unpaid ASHA work. A district coordinator can review provider non-response and offer alternatives with appropriate permission. Escalation intervals depend on the service and are locally agreed; they are not universal clinical deadlines. Urgent clinical situations use the established health referral process immediately and do not wait for an NGO timeout timer.

In a real deployment, one service request can generate several offers, but only the agreed active allocation reserves a limited slot. Use transaction-safe reservations with expiry; release the reservation on cancellation. Avoid broadcasting identifiable cases to every NGO. Administrative duplicates can be reviewed without denying legitimate repeat needs.

## Matching that can be explained

First apply hard filters: service fit, eligibility known or requiring review, verified provider readiness, true catchment, accessible delivery modality, open intake, valid capacity and beneficiary consent. Uncertainty goes to manual review. Do not manufacture an eligible match when no offer passes.

Then rank the remaining candidates using understandable factors: earliest feasible service, recipient's preference, travel/access burden, freshness of capacity, response history with enough sample context, and the requested support deadline. Show a short explanation: “serves this ward; document help available Tuesday; capacity confirmed today.” A new NGO should not be permanently excluded because it has little platform history. Paying for promotion must not control vulnerable households' service ranking.

Clinical risk and affordability are not monetized lead-generation scores. Each suggested service has an accept/decline decision by the responsible human. Government eligibility is “potentially eligible” until the responsible authority confirms it; the application or benefit approval is not automated by an LLM.

## Visit optimization

Use staff-supplied or approved rule-based priority, due dates, visit durations, household availability, location confidence, shift length and start/end location. Preserve the PS's geographic step: use basic geographic grouping or the stated nearest-neighbour approach, then generate a priority-aware route within the shift. Clearly name the implemented method in the demo. Advanced clustering, search or OR-Tools can come later if the team has time.

Optimize coverage subject to feasibility, then reduce unnecessary travel within the accepted coverage plan. A remote priority visit may legitimately increase travel. Show the tradeoff and all unserved visits, with reasons: shift full, location missing, household unavailable or requires supervisor review. Coordinate confidence and route assumptions must be visible. Straight-line distance multiplied by an assumed speed is an estimate, not a road ETA.

Repeatedly missed or remote households need an explicit coverage safeguard. Test a maximum permissible postponement policy approved by the supervisor rather than allowing a distance-first algorithm to keep deferring them. Do not claim a mathematically optimal route unless the algorithm and solver status support that claim.

Support follow-up tasks consume worker/coordinator time too. A proposed NGO appointment should not silently fill an already infeasible ASHA day. Multi-worker reallocation requires authorization and realistic travel areas, rather than assuming any worker can cover any household.

## Government service access before substituting donations

The scheme catalogue informs an entitlement checklist. Its minimal record contains programme, state applicability, beneficiary rules, support type, responsible facility/department, application or service channel, evidence link, effective date and last review. Include public services that need no conventional “application,” not just cash transfers.

“Available on a website” is not equivalent to “accessible to this household.” Record the actual barrier: unaware of benefit, eligibility unclear, documents missing, application pending, facility unreachable, stock unavailable, no response or person chose another option. An NGO bridge may help but should not erase the public-service gap. A scheduled review keeps rules from becoming stale.

Do not automatically merge related scheme amounts. For example, public delivery benefits, maternity transfers and nutrition programmes have different rules; one person may access several while still being only one beneficiary. Programmes/campaigns and entitlements are classified distinctly in the catalogue.

## Funding and in-kind support

The first useful funding unit is a **bounded service offer or reviewed need**, not a public feed of identifiable medical stories. A provider can declare in-kind transport slots, document-navigation hours, nutrition-support inventory or a restricted project budget. A request remains pending until the authorized provider or funder approves it.

Proposed funding workflow: need and permitted support specified -> entitlement/access check -> authorized NGO cost review -> eligible restricted budget check -> funder/NGO approval -> external authorized disbursement or in-kind service -> receipt/service record -> permitted beneficiary confirmation -> reconciliation.

In the hackathon, demonstrate the request/approval/receipt states with synthetic amounts and simulated decisions. Do not implement a wallet, hold donations, infer unrestricted capacity from historic CSR expenditure, or promise a grant. Actual legal, financial, CSR, FCRA and tax eligibility varies by entity and funding source and needs partner-specific verification before money movement. The official CSR Exchange already connects eligible implementing agencies and corporates; project acceptance and funding remain their decisions. [CSR Exchange FAQ](https://www.csrxchange.gov.in/Frontend/faq).

For national/state funders, aggregated unresolved needs can help target a district programme. Suppress small groups and identifying combinations in donor reporting. The default donor view has service categories, catchment, capacity requested and aggregated fulfillment, not named patient routes.

## Roles, privacy and offline behavior

| Role | Proposed access |
|---|---|
| ASHA | Assigned visits, minimal support capture and status of assigned follow-ups |
| ANM / CHO / authorized clinician | Relevant clinical information and clinical priority/referral decisions |
| Supervisor / coordinator | Assigned geography and unresolved queue; provider operations where authorized |
| NGO service operator | Only referrals offered/accepted to their service and the permitted intake details |
| Funder | Approved project requests and aggregate outcomes; no automatic patient record access |
| Beneficiary / caregiver | Assisted or self-service view of their requested help, consent and grievance channel |
| Public user | General service information, with no identifiable household cases |

Use role and assignment checks on the server, access logs, secure transport/storage, device lock/session controls, permission revocation and a retention policy appropriate to each record. A public map must not expose patient homes or diagnoses. A working prototype's login screen is not a production security assessment.

India's DPDP commencement notification specifies staged commencement: some provisions on publication, others after one year and many substantive provisions after eighteen months. Do not label the entire Act fully effective on the report date. The exact notified text and any subsequent amendments must guide deployment review. Privacy controls above are product design choices regardless of that staged timeline. [Official commencement notification, G.S.R. 843(E)](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf).

Offline first version: download an authorized day's plan; keep minimal permitted records locally; queue visit completion and draft needs. Display last sync time. A cached NGO offer is not a live reservation. Server-side capacity allocation and provider acceptance require connectivity or an explicitly logged coordinator-assisted channel. Reconnection uses stable event IDs, duplicate-safe writes, and a conflict state for withdrawn consent or changed allocations. Device loss, access revocation and persistence need explicit production design.

## Practical architecture

One mobile-friendly worker view, one NGO intake view and one coordinator view can share a single backend and database for the hackathon. No microservice fleet is needed. Suggested entities are `WorkerAssignment`, `VisitTask`, `HouseholdRef`, `ConsentEvent`, `NeedCase`, `OrganizationBranch`, `ServiceOffer`, `EligibilityRuleVersion`, `ReferralOffer`, `CapacityReservation`, `DeliveryEvent` and `AuditEvent`. Restricted support requests add approval and reconciliation records later.

Maintain a local planning module, a versioned scheme catalogue, deterministic service matching and an explicit referral state machine. Server transactions prevent double-booked capacity. A light scheduled job marks offer/reservation expiry and creates coordinator follow-ups. Interfaces can expose an export/import adapter before any authenticated national-platform integration exists.

CSV import is the authorized MVP input in the problem statement. Live RCH, U-WIN, ABDM, NGO Darpan or government identity integrations must not be presented as connected unless approved access and working interfaces are demonstrated. FHIR compatibility is an architecture intention until implemented and tested; it is not permission to access records.

An LLM can draft a Hindi summary from permitted text or explain an approved scheme excerpt with its source date. It should not assign clinical priority, determine final benefit eligibility, invent NGOs, approve funding or certify delivery. The demonstration can succeed without an LLM.

## 24-hour build order

| Proposed elapsed time | Concrete output |
|---|---|
| 0-3 hours | Lock data fields and states; seed synthetic caseload and service offers; build three simple views |
| 3-8 hours | CSV validation, priority list, daily route, shift feasibility, unserved queue and baseline comparison |
| 8-14 hours | Consented need card, service eligibility/catchment filter, explanation, NGO accept/decline and outcome states |
| 14-18 hours | Replan one blocked/unavailable visit; demonstrate rejected service and alternative; coordinator queue |
| 18-21 hours | Cache the daily plan and queue completion if core works; permission checks and focused edge-case verification |
| 21-24 hours | Demo rehearsal, evidence labels, pitch and restore/check seed data |

This is a proposed schedule, not an elapsed-work claim. The authoritative MVP uses **one document-navigation support category**, three fictional offers and one reviewed public-service pathway. Additional transport and family-support categories are pilot extensions after this flow works. Retain the broader catalogue as research. The report's 24-programme coverage does not mean all 24 workflows belong in a 24-hour implementation.

### MVP essentials

1. All required PS outputs: validated caseload, an explicit geography-based grouping/nearest-neighbour step, risk/due list, feasible route, travel estimate, flags and coverage projection.
2. One consented visit-to-support path, with actual hard filters on synthetic service data.
3. Provider accept, decline and delivered/confirmed outcomes, with unresolved reasons.
4. Supervisor override and coordinator handling of a failed offer.
5. A clear account of source dates and synthetic inputs in the demo.

### Build later

Broader scheme eligibility, restricted budget requests, multiple workers, advanced road routing, voice interfaces, patient-facing accounts, provider integrations, referrals across districts and funder dashboards. Every extra feature has an operations and privacy cost. Defer autonomous diagnosis, open public patient feeds, donation custody and universal automatic matching.

## Demo that shows a real workflow

Use **20-30 visibly synthetic visit tasks** in one fictional catchment, a declared shift, fixed visit durations and three fictional provider offers for one document-navigation service. This is the authoritative MVP dataset; 60-80 anonymous households are an optional larger stress scenario only after the core works. Mark provider identities as fictional or explicitly non-partner example organizations. Show nearest-first, priority-first and your chosen feasible planner with identical assumptions. Then:

1. Display a remote due/priority household that requires an explicit travel tradeoff.
2. Make a household unavailable, replan and expose remaining unserved work.
3. During a completed visit create a consented document-navigation need.
4. Exclude an NGO whose office is nearby but whose service does not cover the household's ward/block.
5. Offer the eligible service; provider declines because capacity has expired/full status.
6. With the person's permission, select a valid alternative; provider accepts and later reports service delivered.
7. Record beneficiary/worker confirmation and show the other unresolved cases still in the queue.

If offline completion is implemented, turn off network, capture a visit event, restore network and verify exactly one completion. Funding is an optional reviewed request, not the headline live action. Service outcomes are simulated; the demo does not prove improved health.

## Metrics and evidence needed

| Metric | Definition and interpretation |
|---|---|
| Planned due/priority coverage | Included eligible due/priority tasks divided by all such tasks in the same planning input; disclose exclusions |
| Unserved backlog | Tasks outside the feasible shift, with reason and age; do not hide hard cases |
| Travel and shift feasibility | Same declared travel model and visit durations across baselines; estimate until field measured |
| Offer acceptance | Accepted offers / valid offers made; distinguish providers and unique need cases |
| Delivered support | Need cases with service-specific delivered event and the agreed confirmation, over a defined cohort/window |
| Unresolved support | Reasons including capacity, eligibility, refusal, no response, access or disagreement |
| Extra worker time | Time to capture a need and handle follow-up, measured with practitioners rather than assumed |
| Remote/urban-migrant access | Coverage and delay by agreed geographic/access categories; safeguard privacy and small groups |
| Capacity freshness | Active offers confirmed within the local validity period; stale listings are separate |

Do not report projected coverage as actual completed visits, an accepted referral as received help, or delivered food/transport as a life saved. Demo improvements are simulation results; even good field operational outcomes require a separate study before claiming causal clinical impact.

## Field validation and adoption

Start with one willing PHC/urban health team, a named coordinator and three to five willing service providers. This is a proposed pilot size, not secured access. Interview ASHAs, a supervisor, beneficiaries/caregivers and NGO intake staff using recent cases. Ask where a case currently goes, who follows it, what data is already collected, how referrals are accepted, what service restrictions exist and why prior attempts failed.

Document the existing WhatsApp/phone/register workflow before replacing it. Offer assisted NGO intake and consolidate reporting so a partner is not forced to maintain another full system. Test a paper/coordinator version of the service graph before assuming software adoption. If local partners already use a capable referral tool, explore a visit-planning add-on or integration rather than replacing their platform.

Proceed only if the network has real offers, an accountable follow-up owner, beneficiary agreement and authorized data handling. Pilot in one rural catchment and one urban catchment when operationally feasible; they are different experiments. An indicative 4-8 week learning period and a 6-12 week rollout are planning assumptions, not promises. Local approvals and procurement can extend timelines.

## Economics without invented market size

ASHAs and households should not be assumed to pay a personal subscription. Potential institutional buyers are a health implementation partner, district programme, NGO consortium or CSR-funded approved project. Willingness to pay and procurement routes are unvalidated. The costs to test are coordinator time, offer verification, worker training, beneficiary follow-up, support, secure hosting and integration. A cheap database does not remove those costs.

CSR reported expenditure is context, not an accessible pool for this app. A February 2026 official answer reports INR 34,908.75 crore for FY 2023-24 and states CSR decisions are board-driven. This does not establish available 2026 funding or what share would fund ASHA coordination. [PIB/MCA, 10 February 2026](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2226018&lang=1&reg=3).

Build a pilot budget from quantities after interviews: coordinator hours x local rate; provider verification visits x actual travel cost; onboarding/training sessions x cost; hosting/messages x use; and support/evaluation time. Financial estimates without local rates should remain clearly labelled placeholders. There is no defensible revenue forecast from ASHA headcount, ABHA registrations or Darpan registrations alone.

## Pitch

“ASHA ghar tak pahunchti hai. Visit ke baad agar kisi family ko documents, transport ya permitted support ki zaroorat ho, us need ka follow-up aksar alag process mein chala jata hai. ASHA Saath daily visits plan karta hai, government service aur participating NGO ki actual local availability dikhata hai, aur case ko acceptance se delivery confirmation tak track karta hai. Jahan help nahi mili, woh bhi supervisor ko clear dikhta hai.”

Treat “follow-up often separate” as the proposed problem to verify locally; do not claim every district loses every case. For mentors, show one complete journey, the original route requirements, the failed-offer recovery and honest simulation metrics. That is a stronger demonstration than a long list of unimplemented promises.
