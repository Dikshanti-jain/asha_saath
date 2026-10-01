# ASHA versus mandi optimization: decision and market research

Research date: 8 October 2026. The user has narrowed the hackathon choice to Healthcare 03 and Agentic AI 04 from the [official statements](https://hackathon.gitjaipur.com/ps). This comparison is the current recommendation for that choice.

**Choose Healthcare 03: Community Health Worker (ASHA/ANM) Visit Scheduling Optimizer with Risk-Weighted Prioritization.** For the user's priorities—social help, credible impact, useful innovation and an understandable mentor demo—it has the stronger balance. This is an advisory judgment, not evidence that the judges will prefer it or a prediction of winning probability.

Mandi optimization remains a good choice for commercial/FPO logistics work. It becomes more attractive if the team already has access to an FPO manager, credible transport quotations, consistent commodity/grade data and a usable price snapshot. Neither basic idea is new globally. No field interviews, willingness-to-pay study or prototype benchmark were performed; this is public-source desk research.

## Evidence that changed the comparison

| Finding | Evidence | Implication |
|---|---|---|
| ASHA is an established, large workforce | A March 2025 Parliamentary answer reports 1,030,992 ASHAs nationally and 53,914 in Rajasthan, using NHM-MIS data as of September 2024 | The user group is real; these are dated workforce counts, not paying customers or an app revenue estimate |
| Home visits have an explicit planning workflow | NHM's HBYC handbook includes a dedicated section on planning home visits | A time-constrained visit planner addresses an existing activity |
| Travel/workload concerns are documented | A mixed-methods Indian ASHA workload study describes travel and remote-area burdens | Scheduling and travel deserve investigation; local observations do not prove a nationwide time-saving effect from this proposed app |
| ASHA priority lists already exist | CommCare's tasking reference describes urgency, due dates and priority-ordered tasks | Prioritization by itself is not a first-ever invention |
| ASHA offline/voice/workplan features already exist | AMRIT's Front Line Worker app advertises these features and prioritization | Hindi, voice, offline mode and a dashboard are usability features, not sufficient novelty claims |
| Immunization due lists already exist at national scale | A February 2026 PIB update describes U-WIN's line-listing, follow-ups and reminders | A generic due-date reminder app would duplicate existing capabilities |
| Farmer cooperatives already participate in digital market workflows | eNAM describes FPO aggregation, price information and logistics responsibility | A plausible primary user is an FPO dispatcher/manager rather than assuming every small farmer will manage logistics in a new app |
| Mandi discovery is an existing category | ONO advertises crop prices and nearby mandi discovery | Displaying/ranking mandi prices is weak differentiation |
| Net-realization comparison also exists | Buzzar advertises price, distance, transport costs and net-realization comparison | Even price minus transport is not a defensible global novelty claim |

Sources supporting those findings:

- [Parliamentary answer, 25 March 2025](https://sansad.in/getFile/annex/267/AU2830_j5ckFi.pdf?source=pqars).
- [NHM HBYC handbook](https://www.nhm.gov.in/New-Update-2022-24/CH-Programmes/HBNC-%26-HBYC-Resource-%20Material/Handbook_for_ASHA_on_HBYC-English.pdf).
- [Mixed-methods ASHA workload study](https://pmc.ncbi.nlm.nih.gov/articles/PMC7789492/).
- [CommCare tasking reference design](https://dimagi.atlassian.net/wiki/spaces/commcarepublic/pages/2143944957/Precision%2BTasking%2BCHW%2BApplication%2BWorkflow%2BDesign); the accessible page is archived and points to a newer reference.
- [AMRIT Front Line Worker application](https://amrit.piramalswasthya.org/products/front-line-worker-app/).
- [PIB U-WIN update, 13 February 2026](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2227422&lang=2&reg=48).
- [eNAM FPO workflow](https://enam.gov.in/stakeholders-Involved/fpos).
- [ONO](https://ono.ag/).
- [Buzzar](https://buzzarr.com/); the provider distinguishes its advertised intelligence capabilities from future execution ambitions. Product effectiveness and adoption were not independently tested.

## Market and adoption comparison

| Question | ASHA visit planning | Mandi and logistics planning |
|---|---|---|
| Direct user | ASHA/ANM and supervisor | FPO/cooperative manager and dispatcher |
| Beneficiary | Households receiving scheduled care, and workers managing workload | Member farmers whose lots are sold/transported |
| Adoption partner | PHC/block health team, health NGO, existing digital-health provider | FPO, cooperative, authorized trading/logistics partner |
| Plausible payer, unvalidated | Institution/government/NGO; do not assume ASHAs personally subscribe | Cooperative/institution; subscription or execution-related models require interviews |
| Core measurable result | Coverage of due/priority visits, travel estimate, feasibility and missed-visit backlog | Modeled/observed net proceeds, freight utilization, delays and fulfillment |
| Public data advantage | Guidelines and public aggregate reports are available; personal caseload data is not automatically open | Public mandi-price catalogues exist; matched live executable bids and freight quotes are separate |
| Main adoption obstacle | Extra data entry, app fatigue, unreliable connectivity, inaccurate locations and realistic working hours | Stale prices, commodity/grade mismatch, freight uncertainty, payment/buyer trust and acceptance of lots |
| Commercial opportunity | Institutional pilot with potentially slow procurement and integration | More direct economic value, although an executable trade workflow is much harder than recommendations |
| Hackathon demonstration | Relatively controllable: the caseload and constraints can be declared and compared | Visually attractive, but the result depends heavily on assumed prices, costs and losses |

The [government mandi resource catalogue](https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi) was located. Its direct reader did not yield usable records in this research, so live API access and district coverage were not verified. Do not treat a catalogued “daily” series as guaranteed real-time bids.

No market valuation, conversion rate, saved-lives number, income increase or team-selection count can be responsibly inferred from these sources.

## ASHA: features worth building

The official core is caseload CSV ingestion, geographic clustering/routes, rule-based risk weighting, travel estimates, risk flags and coverage projection. Add a small, demonstrable planning layer around that core.

| Feature | Why it matters | Hackathon priority |
|---|---|---|
| CSV import with input validation | Avoids a new patient-registration workflow; validates coordinates, priorities and durations | Core |
| Explainable priority | Each case shows staff-supplied priority, due date and missed attempts | Core |
| Feasible daily route | Working hours, visit duration and availability constrain the plan | Core |
| Missing and unserved visit view | A full shift must not silently drop priority cases | Core |
| Dynamic replanning | Household unavailable or road blocked changes the plan | Core decisive demo |
| Coverage safeguard for remote/previously missed visits | Makes the tradeoff between distance and equitable coverage explicit | One scoped extension |
| Supervisor override and overflow request | Staff can change priorities and inspect an infeasible schedule | Lightweight core control |
| Offline daily list and completion capture | The downloaded plan still opens and logs completions without connectivity | Useful after routing works |
| Hindi labels/readout | Makes the task list more usable | Optional polish, not novelty |
| Multi-worker workload redistribution | Supervisor can propose reassignment | Later pilot feature |

Medical priority must come from staff or reviewed, versioned rules, not an improvised diagnosis model. An urgent referral should follow the existing clinical workflow rather than wait as an ordinary scheduled visit. Program guidelines and local protocols can change, so avoid hardcoding old national schedules as universally current.

The innovation hypothesis is: **combine visit priorities, deadlines, realistic time budgets, geography, coverage safeguards and explanations, then demonstrate what changes under disruption.** The reviewed competitor descriptions do not establish that this exact combined workflow is absent from every product. It is a proposed differentiation to validate with practitioners.

### Decisive ASHA demonstration

Use roughly 60–80 anonymous synthetic households and one fixed shift. Compare three declared approaches: nearest-first, priority-order only, and the proposed constraint-aware planner. Use identical service times and travel assumptions. Show priority/due visits covered, remaining overdue visits, travel estimate, time-window violations and whether any required visits remain unserved.

Then make one household unavailable or block one road segment. Replan and explain which visits moved and why. If the shift is infeasible, show it and the supervisor action required. Demonstrate offline completion capture if time permits.

Do not promise lower travel in every scenario: covering a remote priority household can intentionally require more travel. The social value is visible in the tradeoff. No “30% improvement” or “lives saved” claim should appear before a relevant evaluation.

## Mandi: features worth building

The official core requires inventory, vehicles, locations, prices/fees/distances, perishability-aware allocation, a logistics schedule and verification of freshness/math/capacity.

| Feature | Why it matters | Hackathon priority |
|---|---|---|
| Price-source date, commodity, variety/grade and unit checks | Prevents misleading comparisons of unmatched products or quantities | Core |
| Net-proceeds breakdown | Makes transport, fees and assumed losses visible | Core |
| Vehicle and batch allocation | Turns a market recommendation into a feasible transport plan | Core |
| Pickup/arrival time and perishability constraints | A favorable quote is useless if the batch cannot arrive in time | Core |
| Agent tool-use trace | Shows fetch/lookup, calculation, allocation and validation as distinct steps | Core for the agentic theme |
| Disruption replanning | A delayed/unavailable truck changes allocation and expected proceeds | Core decisive demo |
| Break-even and uncertainty view | Shows when a recommendation reverses if freight or saleable quantity changes | One strong extension |
| Pool compatible farmer lots | Can improve vehicle fill; incompatible grades must stay separate | Optional extension |
| Member-wise cost allocation | Gives each farmer a transparent share of pooled costs | Later feature |
| Buyer/price confirmation and manager approval | Separates indicative market data from an accepted transaction | Pilot requirement; simulated in demo |

Use arithmetic and an optimization routine for allocations. A language model can select tools and explain results, but should not invent market prices or silently change mathematical totals. Keep any booking/trading step subject to the manager's review; a recommendation is not an executed sale.

### Decisive mandi demonstration

Use one crop and grade, three markets, two vehicles and several farmer lots. Compare closest-market, highest-quoted-price and the proposed feasible plan. Make all assumptions visible. Delay one vehicle and change one transport quote; show the changed schedule and net proceeds.

For illustration only: 5,000 kg at market A, INR 20/kg, 2% assumed unsaleable loss, INR 3,000 transport and INR 1,000 fees gives INR 94,000. Market B, INR 24/kg, 10% assumed loss, INR 14,000 transport and INR 2,000 fees gives INR 92,000. These are synthetic scenario inputs, not current prices or crop-loss facts. Explain where a different assumption would reverse the choice.

Measure capacity/time violations, modeled net proceeds and truck fill. Later field validation should compare actual receipts, deductions and freight invoices; simulation does not demonstrate farmer-income gains.

## Mentor appeal and decision

| Criterion | Judgment for this hackathon |
|---|---|
| Social relevance | Both strong; ASHA maps particularly clearly to continuity of care and worker workload |
| Global novelty | Neither basic idea is new |
| Demonstrable technical contribution | Strong in either if the constraints and disruption handling work |
| Reliability of declared demo inputs | ASHA advantage: priorities/durations can be explicitly supplied rather than claiming uncertain future sale prices |
| Commercial/business pitch | Mandi advantage: direct net-proceeds story and cooperative customer |
| Human story | ASHA advantage for the user's stated social-help emphasis |
| Live-data access | Mandi has a public-price-data advantage; neither has a complete ready-to-use operational dataset |
| Actual winning odds | Unknown; organizer rubric and competitor selections were unavailable |

**Choose ASHA.** Make the project a usable daily-planning tool with a compelling disruption demo and an honest comparison. A map, reminders and a generic chatbot alone will not justify the choice. If the team instead obtains an FPO partner and usable operational price/freight data before building, reassess mandi because that evidence can outweigh the desk-research preference.

Suggested pitch: “ASHA didi ka time limited hai. Hum priority, due dates, travel aur visit duration ko ek feasible daily plan mein combine karte hain, aur jo visits fit nahi hue unhe supervisor ke liye clearly visible rakhte hain.”

Before claiming field impact, validate with at least one willing worker and supervisor: How are visits chosen today? Which constraints are actually binding? What causes a missed visit? What record can be imported without duplicating entry? Would the plan save effort? For mandi, the comparable validation requires an FPO dispatcher, actual grade-matched sale records and freight quotations. No outreach was performed during this task.
