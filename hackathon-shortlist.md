# Codefiesta 5.0: five problem statements worth building

> Earlier research record. After the user's clarification about stronger demonstrable impact, the current recommendations are in [the revised shortlist](hackathon-powerful-shortlist.md). The 70-option screening below remains available as background.

Research date: 8 October 2026. Official event: a 24-hour hackathon. All 70 expanded briefs across 14 themes were read from the [official problem-statements page](https://hackathon.gitjaipur.com/ps).

Recommendation: **Healthcare 03 — ASHA/ANM visit scheduling with risk-weighted prioritization.** It offers the best balance of a recognizable human problem, a measurable algorithm, a practical prototype, and a short, understandable pitch.

This is a judgment about project selection, not a prediction of winning probability. Actual selections by the 150 teams, the judges' scoring rubric, and the team's remaining hours were not available. The user described the team as capable across technologies. The ranking favors prototypes that can work on a laptop without needing a government integration, specialized equipment, or a newly trained model.

## Decision table

Numbers below are the numbers within the official theme, not globally unique problem IDs. Short labels are used for readability.

| Rank | Official location | Project direction | Expected crowding, inferred | Main advantage | Main limitation |
|---|---|---|---|---|---|
| 1 | Healthcare 03 | ASHA visit prioritization and routing | Low–medium | Human impact plus an algorithm whose tradeoffs can be demonstrated | Scheduling must respect health-worker priorities; synthetic data does not establish clinical benefit |
| 2 | Smart Automation 02 | Ration stockout warning and replenishment planning | Low | Easily explained, dependable simulation, measurable stockout outcomes | Existing ePoS/PDS systems already digitize transactions; integration and transfers require authority |
| 3 | Cybersecurity 04 | Package-name and masquerading warning before installation | Low–medium | A live preventive demo relevant to student developers | Similar products exist; name similarity alone produces false alarms |
| 4 | Agentic AI 03 | Grant compliance and budget verification | Low | Cross-document checking and deterministic arithmetic provide evidence beyond a chat response | Parsing and context-dependent rules need careful scoping |
| 5 | GovTech 05 | Small-town sewage-plant monitoring and alert handling | Very low | Unfashionable but important operations problem with scope for meaningful alerts | A chart-only dashboard is weak; real operational validation needs an operator and reliable measurements |

Crowding is inferred from familiarity, likely student interest, data friction, and the ease of building a generic AI demo. There is no observed team-selection dataset supporting these labels. In particular, choosing a niche subject does not automatically improve the chance of winning.

The selection balances real need, likely competition, completion within the event, a visible technical contribution, and how clearly a judge can understand the result. These are advisory criteria, not the organizer's published judging weights.

## 1. Healthcare 03: ASHA visit scheduler

Official title: Community Health Worker (ASHA/ANM) Visit Scheduling Optimizer with Risk-Weighted Prioritization.

**Pitch:** “ASHA didi ka time limited hai. Hum unke din ka plan banate hain jisse overdue aur priority households cover hon aur travel bhi practical rahe.”

The National Health Mission specifies scheduled newborn home visits and additional follow-up for certain vulnerable newborns. This establishes a real scheduling workflow; it does not prove that a particular routing app improves health outcomes. See [NHM's community-based programme](https://nhm.gov.in/index4.php?lang=1&level=0&lid=818&linkid=514). Existing digital tracking also exists, including ANMOL, described in [NHM's IT initiatives booklet](https://nhm.gov.in/uhc-day/Session%202/eBooklet%20on%20IT%20Initiatives%20of%20NHM.pdf). Position the project as a scheduling layer for an existing caseload, rather than claiming to invent beneficiary tracking.

**Prototype:** Import a CSV containing anonymous household IDs, coordinates, visit duration, due dates, staff-assigned priority, and availability. Produce a daily route with explanations and a list of uncovered tasks. Include manual priority changes and route recalculation. An offline daily list is a useful additional feature after the scheduling works.

**Stage demo:** Use approximately 80 synthetic households and one fixed shift. Compare a simple nearest-first plan against the proposed priority-aware plan using the same travel estimates and visit durations. Add an overdue priority visit or make one household unavailable; demonstrate the changed plan. Show the distance/coverage tradeoff honestly. Every priority visit may not fit: explicitly show overflow instead of hiding it.

**Measure:** Priority visits completed, overdue visits still uncovered, total travel estimate, and shift feasibility. Label straight-line estimates as estimates if a road-network route matrix is unavailable. Do not present simulated coverage as real lives saved or invent a percentage improvement before measuring.

**Why teams may overlook it:** Healthcare's more obvious demos are reminders, medical chatbots, and rehabilitation pose detection. Scheduling is less flashy at first glance and requires attention to constraints. That is an inference about project appeal, not an observed selection count.

**Scope after the event:** Health-worker and NGO pilots, supervisor workload balancing, offline task capture, and data import from existing systems. The scheduling rules need review by practitioners. Urgent clinical referrals should follow the existing health-worker protocol rather than being treated as ordinary route tasks.

## 2. Smart Automation 02: ration stockout planner

Official title: Ration-Shop Monthly Quota & Stock-Replenishment Planner.

**Pitch:** “Ration khatam hone ke baad complaint aati hai; hum pehle dikhate hain kis dukaan mein shortage aane wala hai aur kab replenishment mangana chahiye.”

The official brief's blanket paper-record premise should not be repeated as a national fact. A [PIB release dated 20 November 2024](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2074977&lang=2&reg=48) describes widespread ePoS distribution and computerized supply-chain initiatives. [NFSA's state reports](https://www.nfsa.gov.in/State/AR) also list sales/stock reporting. Build a forecasting and decision layer over available stock records; do not pitch a new digital ledger as the main innovation.

**Prototype:** Eight shops, opening stock, daily issuance, expected arrivals, procurement lead time, and a safety buffer. Forecast a shortage window. Give a cluster-level view of shops at risk and surplus candidates. Keep suggested redistribution as a request requiring official authorization; it should not silently move stock or change beneficiary entitlements.

**Stage demo:** Simulate 30 days. Delay a delivery and increase withdrawals at one shop. Show the warning, a replenishment request, and a comparison between doing nothing and acting on the recommendation. Use a date range rather than pretending that consumption is perfectly predictable.

**Measure:** Stockout shop-days, late replenishment warnings, and the number of beneficiaries whose modeled demand cannot be fulfilled. Results are scenario outcomes, not demonstrated production impact.

**Why teams may overlook it:** Logistics for ration shops is less fashionable than voice budgeting, image-based recipes, or AI agents. Yet judges can quickly understand the consequence of a shortage.

**Scope after the event:** A pilot with a district supply office or an authorized FPS cluster. Data availability, demand seasonality, and transfer rules need validation. This is my strongest option when a dependable finished demo matters most.

## 3. Cybersecurity 04: package installation guard

Official title: Typosquatting and Masquerading Package Detector for Student Developers.

**Pitch:** “Ek package naam ki typo se galat code install ho sakta hai. Hum install se pehle suspicious naam check karke likely intended package aur warning ki wajah dikhate hain.”

This is a documented threat. [GitLab's own research, published 9 June 2026](https://about.gitlab.com/blog/shai-hulud-copycat-campaign-targets-python-developers/) describes malicious PyPI packages impersonating common libraries. It is also an established product category: [Socket's Python support](https://socket.dev/blog/python-support) already includes typosquatting detection. A project should not claim to be the first detector.

**Prototype:** Scope to pip, which is allowed by the brief. Implement an explicit install-wrapper command plus a manifest scanner. Check suspicious similarity to a curated list, substitution patterns, and available registry metadata. Show separate states for ordinary, suspicious, missing, and lookup unavailable. A new package or a similar name is a signal, not proof of malware. Never silently substitute a dependency.

**Stage demo:** Use benign fixture names and cached, clearly labeled metadata. Show a normal dependency passing, a lookalike name warning before any installation, and a legitimate similar name that should not be blocked. The demo needs no malicious package installation. A network-failure case shows whether the tool wrongly declares something safe.

**Measure:** Detection on a labeled fixture set, false alarms on legitimate packages, and lookup latency. Include the mistakes, not only successful detections.

**Implementation finding:** PyPI's JSON API does not provide usable download counts through its deprecated `downloads` field: [official documentation](https://docs.pypi.org/api/json/) says it is always -1. Use a separate documented download-data source if needed or omit that signal transparently. Author text alone is not verified maintainer reputation.

**Why teams may overlook it:** The topic needs package-registry details and false-positive handling. Browser phishing warnings and secret scanners have a more familiar entry point. Cybersecurity can still attract capable teams, so I would not label this “very low competition.”

**Scope after the event:** College development environments, a local warning CLI, editor support, and CI dependency review. Win the demo through transparent decisions and a useful workflow, not a claim to outperform mature security companies.

## 4. Agentic AI 03: grant application checker

Official title: Grant Proposal Compliance & Budget Verification Agent.

**Pitch:** “Achha project proposal bhi missing attachment ya galat budget calculation se atak sakta hai. Hum submission se pehle exact rule aur exact document location ke saath issues dikhate hain.”

Grant rules can be concrete and scoped to applicant type. An [archived DBT/DST BRICS call from 2020](https://dbtindia.gov.in/sites/default/files/National%20Application%20Annexure.pdf) is useful as a dated demo fixture: it includes equipment-cost limits and different provisions for industry and academic applicants. It is not an open 2026 funding opportunity. Existing competitors already review proposal compliance and budget consistency, as [Grantable's documentation](https://grantable.co/docs/user-journeys/reviewing-a-draft) shows.

**Prototype:** One chosen call, a clean text PDF proposal, a budget CSV, and an attachment list. Extract a requirements checklist with source locations. Run page-count, arithmetic, percentage, required-document, and cross-document consistency checks. Use code for arithmetic. Use the model for extracting and explaining candidate rules, with an “unclear/manual review” state for ambiguous conditions.

**Stage demo:** Seed three errors: a prohibited or over-limit budget item, a missing supporting document, and a different project duration in two files. Show the corresponding rule and evidence. Correct the files and run the checks again. Keep applicant-type conditions attached to each rule so the tool does not apply industry rules to an academic applicant.

**Measure:** Recall and false positives against deliberately seeded issues, arithmetic correctness, and coverage of the selected checklist. Do not estimate the probability of winning funding or evaluate applicants' research merit.

**Why teams may overlook it:** Among agent projects, contracts, bank reconciliation, and cloud costs are easier to recognize. Grant administration feels less glamorous but creates a credible cross-document demonstration.

**Scope after the event:** University research offices, incubators, and NGOs. Indian call templates, reproducible checks, and clear citations are a practical direction, not evidence of global novelty.

## 5. GovTech 05: sewage-treatment operations monitor

Official title: Simple Performance Monitoring and Alert Dashboard for Small Town Sewage Treatment Plants.

**Pitch:** “Treatment plant ka green status tabhi meaningful hai jab readings recent aur reliable hon. Hum limit crossings aur missing data ko clear action queue mein dikhate hain.”

[NITI Aayog's wastewater report](https://www.niti.gov.in/node/386), citing CPCB's 2021 inventory, distinguishes installed from operational capacity. This supports the importance of operations; it does not establish the demand for this exact application. [CPCB's effluent-monitoring guidance](https://cpcb.nic.in/upload/thrust-area/revised-GUIDELINES-final-sent-for-publication-on07.11.2014.pdf) also shows that monitoring systems already exist. The candidate product is a usable workflow for smaller operators, rather than the invention of water-quality monitoring.

**Prototype:** Import three plants' synthetic operational logs and laboratory results. Preserve units, sampling timestamps, entry timestamps, source, and configured threshold profiles. Show separate status for recent within-range readings, out-of-range readings, and missing/stale data. Create an alert that an operator can acknowledge, annotate, and close with evidence.

**Stage demo:** Demonstrate an out-of-range result, a sensor/data gap, and an operator response. Show that a three-day-old result cannot remain silently green. A photo of clean-looking water or a cheap sensor does not establish BOD/COD compliance. Monitoring laboratory results is enough for the prototype; use clearly labeled synthetic readings.

**Measure:** Detection of known threshold violations, stale-data cases correctly identified, and alert handling time in the simulated workflow. Thresholds need plant-specific applicable consent conditions for a real deployment. Do not claim automated diagnosis of a failure's cause or automatic certification of discharge compliance.

**Why teams may overlook it:** Sewage operations has little student glamour and requires some domain understanding. This is the least likely to be crowded in my judgment, but it also has the greatest need for domain validation.

**Scope after the event:** Municipal contractors, small plant operators, maintenance teams, and a credible pilot with an environmental engineer. If the team cannot explain the measured parameters and data-quality states, choose one of the higher-ranked options.

## Screening record: all 70 briefs

The following are abbreviated labels and original assessments, not reproductions of the full briefs. “Alternative” means a credible option outside the recommended five. Ratings concern this team's hackathon choice and do not dismiss the real needs involved.

| Theme | No. | Short label | Assessment |
|---|---|---|---|
| Web 3.0 | 01 | Offline academic credentials | Alternative; offline challenge and revocation freshness add engineering risk |
| Web 3.0 | 02 | Portable gig-worker reputation | Verifiable demo possible; real adoption depends on issuer cooperation |
| Web 3.0 | 03 | Vendor compliance credentials | Alternative; useful procurement story, but credential infrastructure must be explained |
| Web 3.0 | 04 | Alumni skill endorsements | Verification does not establish that the endorsement itself is trustworthy |
| Web 3.0 | 05 | Livestock health passport | Alternative; easy human story, but trustworthy issuers and physical animal identity matter |
| EdTech | 01 | Regional-language glossary | Needs real language contributors; synthetic or model-generated terms weaken evidence |
| EdTech | 02 | District school dashboard | Useful if genuine appropriate data is available; verify what UDISE+ actually measures |
| EdTech | 03 | Classroom OER reviews | Depends on contributor participation; a populated catalog alone is a weak demo |
| EdTech | 04 | Rural skill verification | Easy prototype; issuer registry and employer acceptance are the central challenges |
| EdTech | 05 | Cross-grade learning gaps | Alternative; clear rule-based scope and a possible teacher validation session |
| Healthcare | 01 | Self-care prescription tracking | Familiar adherence workflow with limited novelty unless directly validated |
| Healthcare | 02 | Rehabilitation exercise logging | Alternative; pose accuracy and prescribed protocol need care if included |
| Healthcare | 03 | ASHA priority routing | **Selected #1** |
| Healthcare | 04 | Home fall-hazard assessment | Alternative; practical checklist, but environment risk needs grounded criteria |
| Healthcare | 05 | Clinic no-show mitigation | Relevant operations problem; synthetic prediction data cannot establish predictive validity |
| GenAI | 01 | Public-notice translation | Strong accessibility use, but translation-plus-summary is an obvious AI workflow |
| GenAI | 02 | Receipt categorization | Familiar consumer demo; OCR corrections and duplicate handling are the real work |
| GenAI | 03 | Municipal FAQ with citations | Good baseline project; many teams can reproduce a similar document-Q&A pipeline |
| GenAI | 04 | Meeting minutes and actions | Very familiar AI workflow; weak differentiation without unusual evidence |
| GenAI | 05 | Fridge-to-shopping list | Visually attractive and straightforward AI demo; real ingredient confirmation matters |
| Agentic AI | 01 | Bank reconciliation | Alternative; measurable matching, though splits/refunds and confidence complicate it |
| Agentic AI | 02 | Contract risk flags | Attractive familiar use; jurisdiction and false-confidence risks complicate the demo |
| Agentic AI | 03 | Grant compliance and budget | **Selected #4** |
| Agentic AI | 04 | Mandi and logistics planning | Alternative; net proceeds and price freshness matter more than headline prices |
| Agentic AI | 05 | Cloud cost attribution | Alternative for cloud-experienced teams; realistic ownership data helps |
| Robotics and Drones | 01 | Under-desk lost items | Hardware/vision effort is large relative to the demonstrated benefit |
| Robotics and Drones | 02 | Bin overflow | Familiar IoT/vision theme with limited differentiation |
| Robotics and Drones | 03 | Crowd density heatmap | Alternative if suitable footage and a validated counting method are ready |
| Robotics and Drones | 04 | Patrol-cart air-quality map | Alternative with available calibrated equipment; otherwise weak ground truth |
| Robotics and Drones | 05 | Whiteboard inspection rover | A visible robot demo, but limited problem depth |
| IoT | 01 | Activity-based streetlights | Familiar hardware demo; quantify behavior and avoid unmeasured savings claims |
| IoT | 02 | Garden soil monitoring | Familiar irrigation project; sensor interpretation needs validation |
| IoT | 03 | Beehive acoustics | Likely niche; credible multi-state labeled recordings and validation are difficult |
| IoT | 04 | Rainwater tank planner | Alternative if hardware is ready; include usage decisions rather than only level display |
| IoT | 05 | Charger occupancy | Physical occupancy does not necessarily mean charger availability or usability |
| Cybersecurity | 01 | Login-page fingerprints | Alternative; dynamic legitimate pages and false positives need testing |
| Cybersecurity | 02 | IAM escalation paths | Strong technical alternative for a team already familiar with IAM policy semantics |
| Cybersecurity | 03 | Repository secret warnings | Existing scanners are mature; regex alerts alone add little |
| Cybersecurity | 04 | Package-name guard | **Selected #3** |
| Cybersecurity | 05 | Captive-portal verification | Platform interception and network trust add integration risk |
| Women Safety | 01 | Witness threshold reporting | Independence, abuse resistance, and appropriate escalation are harder than counting reports |
| Women Safety | 02 | Peer check-in circle | Useful recognizable need, but a familiar notification workflow |
| Women Safety | 03 | Location-share expiry | Control over other platforms is limited; accurately describe reminder vs. stop capability |
| Women Safety | 04 | Complaint draft support | Strong practical need; facts, authority-specific fields, and privacy need care |
| Women Safety | 05 | Event safety group | Easy event-related demo; depends on adoption and reliable group communication |
| Agriculture | 01 | Shelf-life planning | Alternative with defensible crop-specific curves; avoid unsupported loss percentages |
| Agriculture | 02 | Sowing-window probabilities | Field-level probability and calibration are hard to validate in 24 hours |
| Agriculture | 03 | Seed-quality cues | Photos and price cannot certify germination, genetics, or seed quality |
| Agriculture | 04 | Scheme eligibility | Familiar rules/chatbot direction; accurate current rules and documents matter |
| Agriculture | 05 | Dealer feedback | Cold-start participation and review manipulation limit the demo |
| Road Safety | 01 | School-zone alerts | Alternative; offline geofencing is feasible, though mobile GPS behavior matters |
| Road Safety | 02 | Neighborhood data gaps | Scarce accident data complicates defensible conclusions |
| Road Safety | 03 | Damaged-sign reporting | Capturing a complaint is easy; repair workflow and adoption determine value |
| Road Safety | 04 | Temporary crossing guidance | Simple prototype; actual safe crossing placement needs authorized site assessment |
| Road Safety | 05 | Streetlight repair reporting | Useful service workflow, but familiar complaint-tracker structure |
| Smart Automation | 01 | Road-repair crew scheduling | Strong alternative; scheduling adds substance to a familiar pothole theme |
| Smart Automation | 02 | Ration replenishment | **Selected #2** |
| Smart Automation | 03 | Exam-seat constraints | Strong alternative; readily testable and locally understandable, though familiar |
| Smart Automation | 04 | Milk sampling and settlement | Strong alternative; sample identity and exception handling matter because AMCU already exists |
| Smart Automation | 05 | Event resource reservations | Dependable demo but familiar scheduling-product territory |
| FinTech | 01 | Shop invoice reconciliation | Strong alternative; differentiated by split payments and understandable unresolved items |
| FinTech | 02 | Missed-call savings | Access-oriented problem; real telephony availability adds dependency risk |
| FinTech | 03 | SHG contribution transparency | Alternative; append-only records do not prove external payments actually occurred |
| FinTech | 04 | Prescription cost comparison | Matching drug strength/form and clinician-approved substitutions complicate correctness |
| FinTech | 05 | Voice budget assistant | Familiar AI assistant; language accuracy and correction UX matter |
| GovTech | 01 | Cross-department tracking | Institutional adoption and actual file status are harder than a tracker UI |
| GovTech | 02 | Grievance workload balancing | Strong alternative; evaluate missed SLAs and reassignment churn |
| GovTech | 03 | Fire-certificate renewal | Relevant but reminder-only scope gives limited technical depth |
| GovTech | 04 | Emergency bed coordination | Strong human appeal; freshness, reservation conflicts, and hospital cooperation are difficult |
| GovTech | 05 | Sewage plant monitoring | **Selected #5** |

One close alternative deserves special mention: Smart Automation 04, milk collection. [NDDB's AMCU technical specification](https://nddb.coop/sites/default/files/pdfs/AMCU_Technical%20Specification_.pdf) already describes weighing, fat/SNF-based calculation, identification, and transaction records. A defensible hackathon contribution would therefore focus on sample mismatch detection and traceable correction, not claim to invent automated milk payment.

## Execution advice

For the first choice, build CSV import, priority rules, a constraint-aware plan, and the comparison metrics before spending time on voice UI or extra AI. Reserve the final part of the available time for exception cases, offline/cached demo data, and pitch rehearsal. Remaining time was not supplied, so these are priorities rather than an hour-by-hour schedule.

A useful stage structure is: one recognizable person, one problem, one input, one visible decision, one measured comparison, and one honest limitation. A short interview with a willing relevant practitioner would strengthen the submission more than adding a generic chatbot. No interview or field validation was performed in this research.

If an organizer exposes current per-statement selection counts, update the competition estimates before locking the choice. Those counts would provide stronger evidence than any inference from topic popularity.

**Decision:** Choose ASHA scheduling for the strongest overall balance; ration replenishment for a dependable finished prototype; package guarding for a more technical live demonstration; grant verification for a document/agent team; sewage monitoring for the least crowded likely subject when domain understanding is available.
