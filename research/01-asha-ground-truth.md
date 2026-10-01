# ASHA/ANM ground truth for Healthcare 03 and an NGO-support extension

Research cutoff: **8 October 2026, India**. Prepared as one research contribution to the requested ten-agent review. All recommendations below are design proposals, not authorization from NHM and not clinical advice. Sources were checked with connected Tavily initially and the built-in web tool after Tavily research returned HTTP 504 and search reached its usage limit. No outreach, accounts, deployment, or movement of funds occurred.

## 1. What the hackathon actually asks for

The official problem-statement listing was successfully extracted on 8 October 2026 and confirms **Healthcare 03: Community Health Worker (ASHA/ANM) Visit Scheduling Optimizer with Risk-Weighted Prioritization**. The listing says 14 themes and 70 statements, released 8 October. Current extraction exposed the title, not the expanded panel. [Official Codefiesta 5.0 problem statements](https://hackathon.gitjaipur.com/ps).

The parent research brief records previously read expanded requirements: import a caseload CSV containing patient ID, location and rule-based risk; cluster visits and produce routes; prioritize with risk and travel estimates; display daily routes, risk flags and coverage. Those requirements are **carried forward from the earlier reading**, not claimed as text independently re-extracted here. The official panel should be saved or reread before presenting an exact quotation to judges.

The upgrade should therefore retain a visible working optimizer. A good demonstration starts with a CSV, explains why each household is due, produces a feasible daily visit sequence, and shows who could not be covered. NGO assistance is an additional response to barriers discovered during those visits. A general donation marketplace would weaken alignment with this PS.

## 2. The worker is a trusted community interface with a defined scope

NHM describes ASHA as a village-selected, trained woman linking communities to public health services. Duties include counselling, health education, mobilization for government services, limited protocol-appropriate first-contact care, and timely referrals. Selection generally prefers resident women aged 25–45 and gives preference to education through class 10, with relaxation when suitable candidates are unavailable. She receives performance incentives and depends on institutional support, including ANMs and Anganwadi workers. The NHM page has a website footer dated 14 September 2026; that footer is not proof that every item, including its old drug list, was freshly revised in 2026. [NHM: About ASHA](https://www.nhm.gov.in/images/index1.php?lang=1&level=1&lid=226&sublinkid=150).

NHSRC, NHM's technical support institute, frames ASHA's three functions as facilitating healthcare, providing defined community services, and health activism. Its current catalogue recognizes ASHAs within Ayushman Arogya Mandir primary-care teams and describes expanded community work including chronic disease, mental health, elderly and palliative care, alongside maternal/child and communicable-disease work. It lists continuing training, certification and support materials, including an April 2026 certification letter. These are trained tasks, not unrestricted medical authority. [NHSRC: Community Processes—ASHA](https://nhsrcindia.org/practice-areas/cpc-phc/community-process-asha).

### Scope-to-product mapping (design recommendation)

| Person or organization | Appropriate product capability | Boundary to preserve |
|---|---|---|
| ASHA | Confirm household location and consent, view assigned visits, record observations using approved forms, identify a need, initiate escalation/referral, track follow-up | Do not ask her to diagnose unfamiliar illness, override a clinician, or become a fundraising case manager by default |
| ANM | Clinical assessment and service delivery within qualifications/protocols; validate relevant findings; oversee and join indicated visits | Do not equate an ASHA visit with an ANM examination, immunization, or clinical clearance |
| CHO/medical officer | Own locally approved clinical pathways and technical escalation; review complex cases and appropriate referral destination | Software rankings and NGO volunteers cannot substitute for this authority |
| ASHA facilitator/community-process supervisor | Help with workload, mentoring, missed households, logistics, training and quality | Keep supportive review distinct from diagnosis and from punitive GPS surveillance |
| AWW/Anganwadi centre | Nutrition and child-development linkage, eligible supplementary nutrition and coordination | Avoid inventing dietary treatment or treating charitable food as the child's entire care pathway |
| NGO caseworker/volunteer | Accept a specifically consented support request, confirm service capacity, arrange nonclinical assistance and report fulfillment | No automatic access to full patient records; no ability to change clinical risk classification or certify health outcomes |
| District/block program authority | Approve worker mappings, rules, partner participation and monitoring arrangements | A registration badge or app account is not government endorsement |

The official rural coordination table assigns ASHA mobilization/home education, ANM clinical outreach and joint support, and AWW nutrition responsibilities. The same guidelines place immediate field support with ANM and ASHA facilitator. They provide a rural norm of one ASHA per 1,000 people, allowing habitation-based relaxation for difficult terrain. They envisage approximately 3–4 hours of overall ASHA work daily on 4–5 days a week, with roughly two hours for home visits; these are historical planning norms, not observed 2026 hours. They also encourage competency-based NGO partnerships for training and support. [Community Processes Guidelines, catalogued as 2014; forewords dated 26 June 2013; pp. 5–13](https://nhsrcindia.org/sites/default/files/2021-07/Community%20Processes%20Guidelines%202014%20%28English%29.pdf).

## 3. Geography and coverage are not interchangeable

Urban guidelines use one ASHA per **1,000–2,500 population**, approximately 200–500 households, with smaller coverage possible for dispersed or distinct vulnerable groups. Mahila Arogya Samitis generally cover 50–100 households, or 250–500 people. The framework targets vulnerable urban populations and gives states contextual flexibility. This is an older framework still hosted by NHM; the web search's recent crawl/publication labels should not be mistaken for its original issue date. [NUHM implementation framework, 2013-era framework](https://www.nhm.gov.in/images/pdf/NUHM/Implementation_Framework_NUHM.pdf); [NHM orientation module: selection norms](https://www.nhm.gov.in/images/pdf/NUHM/Orientation_module_for_planners_implementers_and_partners.pdf).

For scale, Parliament reported **1,030,992 ASHAs in position**, including **53,914 in Rajasthan**, using NHM-MIS data as of **30 September 2024**. The answer was issued **25 March 2025**. Those are dated counts, not an October 2026 census. It also explains that NHM releases state funds through flexible pools, rather than a separate ASHA allocation for every state. [Rajya Sabha question 2830, annexure I](https://sansad.in/getFile/annex/267/AU2830_j5ckFi.pdf?source=pqars).

Design implications:

- Model the **assigned households**, not a blanket radius around a worker. Someone living outside the efficient cluster may still be her responsibility.
- Keep village/hamlet/ward, block, district, state, rural/urban and coordinates as different fields. Administrative matching and travel matching serve different purposes.
- Rural walking paths, seasonal accessibility and urban settlement entrances need manual correction. A map coordinate does not prove a road is usable.
- National NGO visibility is not local service availability. Match requests to verified district/ward coverage, current capacity, eligibility, opening times and actual contact channels.
- Repeatedly deferred, inaccessible, migrant or unlocated households belong in the coverage gap list. Do not quietly drop them to improve a distance metric.

## 4. Critical 2026 update: SSBSK, not a frozen HBNC/HBYC model

On **29 June 2026**, MoHFW launched **Samagra Shishu Bal Swasthya Karyakram (SSBSK)**, integrating HBNC and HBYC into home/community care from birth through **36 months**. Its announced approach includes coordinated ASHA, ANM, CHO and AWW visits and early childhood development. [PIB/MoHFW launch release, 29 June 2026](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2279075&lang=1&reg=3).

The **25 August 2026** government workshop release confirms risk-differentiated care, additional follow-up for at-risk children, joint visits and clinical oversight. It describes **Shaishav App** for at-risk line-listing, scheduling/tracking visits, referral follow-up, supportive supervision and longitudinal child profiles. State-specific implementation readiness was under discussion. This verifies the policy direction and an existing digital product; it does **not** establish uniform adoption in every district by October. [PIB/MoHFW SSBSK workshop, 24–25 August 2026](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2303141&lang=2&reg=48).

NHM lists **SSBSK Operational Guidelines 2026**, alongside legacy HBNC and HBYC documents. The official listing was read, but the 67.1 MB guideline PDF could not be retrieved or its exact visit table independently verified in this run. An unofficial mirror contains purported new schedules; it is deliberately excluded from clinical defaults here. **Do not label legacy schedules below as the unchanged current SSBSK schedule.** Obtain the official 2026 table and the pilot district's approved implementation instructions before configuring production rules. [NHM SSBSK guideline catalogue, website updated 7 October 2026](https://nhm.gov.in/index4.php?lang=1&level=0&lid=825&linkid=521).

### Verified legacy schedules for a clearly labelled demonstration

NHM's community-programme page still gives HBNC visits after institutional birth on days **3, 7, 14, 21, 28 and 42**, with an additional visit within 24 hours for home delivery. It identifies additional follow-up for preterm, low-birth-weight, ill and SNCU-discharged babies. Its HBYC description gives visits at **3, 6, 9, 12 and 15 months**. Both descriptions are legacy programmes; this page's August 2026 website timestamp does not resolve the transition to SSBSK. [NHM community-based child health programme](https://nhm.gov.in/index4.php?lang=1&level=0&lid=818&linkid=514).

An older official urban ASHA training module corroborates those HBNC dates and teaches prompt facility referral for danger signs. It places pregnancy assessment/referral decisions with trained facility personnel and ANMs. This provides useful role separation but should not be mined for current medication doses or modern diagnostic thresholds. [NHSRC urban ASHA induction module, publication day not stated in retrieved text; hosted under 2021 directory](https://nhsrcindia.org/sites/default/files/2021-06/Induction%20Training%20Module%20for%20ASHAs%20in%20Urban%20Areas%20English.pdf).

Recommended rule record: `rule_id`, `program`, `version`, `source_url`, `published_date`, `effective_date_if_known`, `district_approval`, `eligible_cohort`, `due_date/window`, `required_cadre`, `joint_visit_required`, `escalation_path`, `review_date`. Unknown or conflicting rules should be shown to the supervisor; no silent rule switching.

## 5. Incentives and workload: avoid false current-pay claims

The official answer to **Rajya Sabha question 276, 22 July 2025** states that the fixed monthly incentive for routine/recurring activities was revised from ₹2,000 to **₹3,500** at the **4 March 2025** Mission Steering Group meeting. Task/performance incentives and state top-ups also apply; ASHAs remain envisaged as community health volunteers. This is the latest dated central revision directly verified here. It does not mean ₹3,500 is salary, total monthly earnings, guaranteed receipt, or that there were no later state changes. [Official Parliament answer](https://sansad.in/getFile/annex/268/AU276_yO0C1A.pdf?source=pqars).

A separate **July 2025 Lok Sabha answer** describes state-funded top-ups, AAM team incentives up to ₹1,000 monthly, nonmonetary support such as cycles and phones, and a ₹50,000 recognition amount for eligible leavers with at least ten years of service. Keep these dated and eligibility-specific. The exact parliamentary day was not recovered in this run. The NHM July 2025 incentive-table URL cited by Parliament returned a 404 during direct retrieval, so task-by-task amounts were not treated as newly verified. [Lok Sabha question 1082, 2025](https://sansad.in/getFile/loksabhaquestions/annex/185/AU1082_yJV2q5.pdf?source=pqals).

Observed workload differs from a guideline allowance. A primary mixed-method study published in **2025** covered **26 ASHAs** in one urban and one rural medical-college field-practice area in Bengaluru, with fieldwork in **June–July 2024**. Ten participants reported 5–6 hours daily; some described delayed or incomplete incentives. This small local study supports the plausibility of workload and payment friction, not a national 2026 average. [Primary study: work sampling assessment](https://pmc.ncbi.nlm.nih.gov/articles/PMC12296319/).

NHSRC's **FY 2024–25 work report**, hosted in February 2026, records a dedicated ASHA workload assessment and says its final report had been shared for presentation to MoHFW. The retrieved passage does not provide its numerical findings. Therefore no national hours-worked statistic is asserted from it. [NHSRC work report FY 2024–25, p. 38](https://nhsrcindia.org/sites/default/files/2026-02/NHSRC%20Work%20report%20FY%202024-25%20Eng.pdf).

Product implications:

- Worker-set availability, caregiving responsibilities, travel time, service time, existing outreach sessions, review/training meetings and escort duties must fit the day before adding NGO tasks.
- Show planned minutes, buffer, overruns and reasons; allow the ASHA to correct estimates.
- Measure time saved and fewer missed essential visits. Do not assume more visits per day always improves care.
- Separate clinically urgent priority from financial incentives. A scoring model should not favor whichever task pays more.
- Support requests should have an NGO/district coordinator owner. ASHA should not need to chase every donor or upload repeated proofs to complete her own visits.
- Record support completion independently of clinical visit completion and legitimate incentive documentation.

## 6. Existing government systems and credible differentiation

MoHFW's **Annual Report 2024–25** describes RCH as individual reproductive/child lifecycle tracking, and ANMOL as an ANM application with service due lists, workplans, VHND sessions, a dashboard, digital RCH register and counselling aids. It reported ANMOL in 28 states/UTs and approximately 1.82 lakh registered ANMs at that older report's reference point. Its list omits Rajasthan; do not assume the pilot uses ANMOL just because it is a national app. [MoHFW Annual Report 2024–25, section 1.2.6](https://www.mohfw.gov.in/sites/default/files/Final%20Printed%20English%20AR%202024-25.pdf). **Newer chronology:** the 2025–26 report states 29 States/UTs and about 1.82 lakh ANMs as of 31 December 2025; use that dated figure for the current platform comparison. [MoHFW Annual Report 2025–26, p.50](https://notto.mohfw.gov.in/WriteReadData/Portal/News/951_1_Annual_Report_of_the_MoH_FW__2025_-_2026.pdf).

On **24 March 2026**, MoHFW reported that U-WIN already line-lists children due for vaccination, sends reminders and generates lists of people who did not attend for follow-up. Counts were explicitly as of **18 March 2026**. A scheduling app should not advertise vaccination due-list generation as a first-of-its-kind invention. [PIB: Update on U-WIN, 24 March 2026](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2244518&lang=1&reg=1).

The official Swasth Bharat portal's search-indexed FAQ describes a single access point for authorized program users and mapped accounts across health programs. The direct page returned only a JavaScript shell, so this is a discovery lead, not verification of every integration or launch date. [Official Swasth Bharat portal](https://www.swasthbharat.mohfw.gov.in/).

**Original design inference:** The strongest positioning is an operational companion that combines due visits with terrain-aware routing, worker availability, joint-visit constraints and local nonclinical assistance. It can demonstrate import/export using a synthetic CSV. Actual RCH/U-WIN/Shaishav/state-system access requires authorized integration; no public API, government credential sharing or bidirectional sync was verified. Do not imply one.

## 7. NGO support already has a policy foothold, but must fit the health system

Urban ASHA/MAS guidelines explicitly describe NGOs as additional capacity for training and supportive community processes. They require rigorous, transparent selection, defined terms of reference and integration with the urban health system. This is a stronger basis than inventing a parallel clinical chain. [NUHM guidelines for ASHA and MAS, NGO section p. 23](https://www.nhm.gov.in/images/pdf/NUHM/Guidelines_for_Asha_and_MAS_in_Urban_Context.pdf).

Government entitlements should be checked before a charitable funding request. Under **JSSK**, NHM states that eligible public-facility delivery and specified pregnancy/infant care include free drugs, diagnostics, blood, diet and transport, including referral transport. The scheme launched **1 June 2011** and extended relevant entitlements in **2014**; the retrieved page was website-updated July 2026. Availability failures should be escalated and tracked, rather than automatically treated as a donor's obligation. [NHM: Janani-Shishu Suraksha Karyakram](https://nhm.gov.in/nhm_components/Empanelment_of_Independent_National_Monitors/index1.php?lang=1&level=3&lid=308&sublinkid=842).

### Recommended referral workflow (design proposal)

1. **Plan the health visit.** Pull due tasks from authorized records or the demo CSV. Preserve scheduled visits and required cadre.
2. **Escalate urgent findings immediately through the locally approved clinical route.** Routine optimization must not defer an emergency to tomorrow or await NGO acceptance.
3. **Record a distinct support barrier.** Examples: cannot reach the appointment, missing documents for entitlement, unavailable caregiver, nutrition access, disability access or unsafe travel.
4. **Check government entitlement and existing facility/Anganwadi pathways.** Ask what assistance is actually missing.
5. **Obtain specific consent for a limited NGO referral.** Select necessary fields and recipient. Consent to a health visit is not consent to public fundraising.
6. **Match a partner by actual service.** Confirm geographic coverage, eligibility, cost, capacity, access hours, quality/safeguarding requirements and the date of the latest operational confirmation.
7. **Have the partner accept or decline.** A directory match is not a promise. Provide a coordinator fallback and expiry/escalation for an unanswered request.
8. **Coordinate fulfillment with the scheduled health care.** The NGO may arrange a ride or accompaniment; ANM/CHO/facility retains the clinical decision.
9. **Confirm completion with minimal evidence.** Record who accepted, when support happened and who followed up; protect household identity.
10. **Close two loops separately.** Support supplied does not mean referral completed or clinical risk resolved. A health worker confirms the latter within her role.

### Candidate support types, without claims about any particular NGO

| Support need | Appropriate potential NGO contribution | What the app must verify |
|---|---|---|
| Travel barrier | Accessible transport or accompaniment; transport vouchers administered by an accountable partner | Local availability, cost, consent, safeguarding and whether public transport entitlement already applies |
| Nutrition access | Entitlement help, delivery/access coordination, suitable food assistance under approved counselling | Program eligibility, actual supply, approved plan and follow-up owner |
| Documents/benefits | Help completing forms and accessing schemes | No sale of data, no retention of unnecessary Aadhaar/bank information, no promise of approval |
| Disability/elder support | Accessible equipment referral, mobility aid, caregiver support | Qualified assessment where required, correct fit, maintenance and service capacity |
| Health literacy | Approved-language education, local mobilization and digital assistance | Training, language, supervision and no unsupported clinical advice |
| Supplies | Funds or approved procurement for equipment, connectivity or logistics through an accountable organization | Procurement policy, stock, quality, responsible custodian and duplication with government supply |
| Treatment-related financial barrier | Case navigation and assistance through a verified organization's own accountable process | Eligibility, legitimacy, documented expenses, benefit coverage and protection of patient identity |

Funding should be a later, explicitly governed support feature. In the hackathon MVP, show **noncash request, partner acceptance, fulfillment and audit history**. If a funding scenario is displayed, use synthetic data and a labelled simulated ledger. Do not pool money, promise a medical outcome, rank households by donor appeal, charge workers referral fees, or let an NGO payment alter clinical priority. A verified organization's existing funding process is a safer next-step concept than making this prototype a payment intermediary.

## 8. Preserve the optimizer and add accountable support

Recommended ordering for the scheduling engine:

1. Immediate locally defined escalation bypasses ordinary route scoring.
2. Required program dates/windows, indicated post-discharge follow-up and joint-cadre availability constrain the plan.
3. Risk tier, overdue duration and repeated missed coverage influence priority using explainable, approved rules.
4. Availability, care duration, route/access constraints and capacity determine feasibility.
5. Distance/time minimization chooses among clinically acceptable alternatives.

Show a reason for each priority, the rule/source/version, travel estimate confidence and a supervisor override with a reason. If mandatory work exceeds capacity, report the conflict and request coordination rather than fabricate a feasible schedule. A distant household's priority should not decay simply because it costs more time to reach.

Recommended MVP outputs: daily worker route, risk and due-date explanation, required joint visits, estimated travel/care time, unvisited/overdue queue, map correction, referral log, limited partner request and partner acceptance/decline. Suggested evidence metrics: risk-weighted visits completed before deadlines; essential overdue visits; travel minutes per valid visit; hard-to-reach household coverage; successful clinical referral follow-up; time to accepted nonclinical assistance; ASHA time spent on data entry/support chasing. All clinical outcome claims require a real evaluation beyond a hackathon.

## 9. Verification gaps to resolve before a pilot

- Exact SSBSK 2026 schedule/risk criteria from the **official PDF**, and state/district adoption and training status.
- The pilot site's existing system: RCH/ANMOL/Shaishav/Janani/U-WIN or a state implementation; permissible data exchange and duplication burden.
- Locally approved escalation destination, coverage hours, ambulance/transport arrangements and service capacity.
- Who actually approves the rule pack and NGO participation, and how the ASHA will access help when offline.
- Each partner's real district/ward service availability, eligibility, capacity, request channel and safeguarding practice. Registration alone does not verify delivery capability.
- Current state-specific incentive orders and actual local payment workflows if incentive tracking is included.
- Real observed travel/care times, missed-visit reasons and worker-set availability. Older national norms and small studies should not be substituted for local observation.

The proposed upgrade is credible when a high-priority visit leads to an accepted, consented, traceable support action that helps the person complete authorized care. Its strength is connecting operational barriers to responsible local assistance while retaining the original risk-weighted route planner.
