# Evidence, problem definition and benefits

Checked 9 October 2026. Use [spoken script](01-FIVE_MINUTE_PITCH_HINGLISH.md). Three evidence types stay separate: official context, implemented software behaviour, and proposed field impact.

## One spoken statistic and one supporting statistic

The revised conversational speech uses the workforce count. NFHS-6 stays in these supporting notes; it is not evidence that the app improves maternal-health outcomes. Both PIB releases were reopened and their values rechecked on 9 October 2026.

| Fact | Reference period and denominator | Source and how to say it |
|---|---|---|
| Over 10.40 lakh ASHAs | Administrative count as of 31 December 2025; not a count of full-time employees | [PIB, 20 September 2026](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2312619&lang=1&reg=48): “December 2025 ke snapshot mein 10.40 lakh se zyada ASHAs.” A newer NHM quarter was listed but its workforce table was not retrieved; do not call this the newest possible administrative count. |
| Mothers with at least four ANC visits: 65.2% | NFHS-6 2023–24; for the last birth in the five years before the survey; India estimate | [MoHFW India factsheet, row 30](https://www.mohfw-dohfw.gov.in/static/uploads/2026/05/111ff4a13ca36b5cabb7f94aec5bb0ce.pdf); [PIB release, 29 May 2026](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2266600&lang=1&reg=48). Say “mothers ke last birth ke liye”, not all currently pregnant women. |

NFHS-6 is the latest released round found in this research. Its factsheets are provisional and exclude Manipur from the India estimate. Fieldwork ran May 2023–December 2024. [IIPS official factsheet introduction](https://www.nfhsiips.in/nfhsuser/assets/National%20Family%20Health%20Survey%20%28NFHS-6%29%202023-2024%20Fact%20Sheets.pdf).

Retrieval: PIB pages opened directly. Official PDF text/rows and caveats were retrieved through indexed primary content; direct full-PDF fetching failed. The India row was independently checked against the release. No statistical confidence interval was retrieved. Do not describe this as new October field data, “34.8% get no antenatal care”, or evidence that scheduling alone explains incomplete care.

## Why the NGO coordination problem is credible

The official Ni-kshay Mitra 2026 guidance acknowledges fragmented support delivery, donor–patient linkage delays and monitoring gaps in its TB programme. It is a concrete Indian precedent for checking acceptance, delivery and follow-through, not a national percentage for all NGOs. [Official guidance, foreword dated 30 January 2026, printed page 5](https://communitysupport.nikshay.in/Recommendation_Monthly_Food_Basket.pdf). A publication date for that copy was not established. ASHA Saath is not integrated with Ni-kshay.

NPO Darpan's advisory explicitly distinguishes its ID from endorsement/affiliation/recognition. Its listing does not establish a service slot or catchment. [Official Darpan portal](https://ngodarpan.gov.in/). Advisory retrieved from the official indexed page; dynamic-page text extraction was limited.

NHM describes ASHA's community-to-health-service role. Linkage to functional referral facilities, referral transport and PHC support are existing public-health responsibilities. [NHM ASHA role](https://www.nhm.gov.in/images/index1.php?lang=1&level=1&lid=226&sublinkid=150), [NHM success factors](https://www.nhm.gov.in/index1.php?lang=1&level=3&lid=256&sublinkid=182). Our NGO workflow must complement those responsibilities.

Scheduling and referrals already exist elsewhere. [CommCare case management](https://commcare.dimagi.com/case-management/) and [its MHP Salud example](https://commcare.dimagi.com/blog/mhp-salud-integrated-community-health/) describe case/referral and public-benefit help capabilities. ASHA Saath's contribution is the particular connection between approved-priority scheduling, visible unserved coverage and accountable local help. No “world's first” or “no competitors” claim is supported.

## Problems → mechanisms → benefits → measurements

The problems below are design hypotheses with relevant official context, not claims that every ASHA/NGO has these failures. No ASHA interviews or field study were conducted for this prototype.

| Problem to test | Implemented mechanism | Intended benefit | What a pilot must measure |
|---|---|---|---|
| Scattered visits compete for a limited workday | Priority/due/deferral/time-window scheduling with locality and travel assumptions | A feasible, explained day plan | Planning minutes, observed travel/waiting, eligible due-task completion |
| Close homes crowd out important distant work | Approved obligations precede proximity | Remote due work stays visible | Completion by priority/locality; deferral age |
| Tasks that do not fit disappear from review | Unserved task with reason; future planning retains deadline | Supervisor can act on remaining work | Reason-coded unserved tasks and overdue age |
| Repeated files create duplicates or overwrite outcomes | Immutable dataset/task identity; repeat-import preview | Reliable register and preserved history | Duplicate task count, import corrections, preserved outcomes |
| A referral leaves nobody responsible | Named coordinator with current owner/next action | Follow-up becomes assigned work | Staff follow-up minutes and unresolved age |
| A listed NGO serves a different area or has stale/full capacity | Offer catchment, service method, fresh availability and exclusions | Fewer inappropriate offers | Wrong-catchment/full/stale-capacity rejection rates |
| Two people are promised the same last slot | Server/database transaction reserves acceptance | Avoids overbooking within declared capacity | Reservation conflicts, actual agreed appointment availability |
| Information goes to unwanted recipients | Specific NGO/purpose/field permission; revocation | Better control over sharing | Refusals/withdrawals honoured; access failures and complaints |
| NGO's delivered report becomes a false success | Report, person confirmation and closure are separate | Better evidence of help received | Confirmed, partial, disputed, pending counts |
| An approved cash request is mistaken for money received | Separate funding permission; transactional budget hold; payment claim, person's reported amount and coordinator closure | Cash-support stages remain distinguishable | Requested, approved, reported, received, disputed and closed amounts; unresolved age |
| Follow-up happens in conversations disconnected from the case | Persisted referral/funding messages with server identity, read receipts and current case permission | Participants can see the case discussion and whether a message was read | Time to first response, unread age, staff follow-up workload; a read receipt is not action taken |
| Social help delays an urgent health decision | Separate approved clinical escalation queue | Keeps medical responsibility with health team | Clinical escalation handling under local approved protocol |

## Benefits by stakeholder

- **ASHA:** next visit and one outcome form; short need capture; coordinator owns provider chasing. The extra app can also add work, so capture time and duplicate entry must be observed.
- **Person/family:** assisted access without requiring their own app, exact recipient permission and a clear next step. Document guidance does not approve a benefit or guarantee help.
- **NGO branch:** requests fitting its declared service/catchment; provider-controlled capacity, own cash budget and clear arrangement/outcome. Case messages carry the request context. Declining unsuitable work is permitted.
- **Coordinator/PHC team:** gaps, failed offers, pending confirmation and separate health actions remain visible. A dashboard has value only if someone has time and authority to act.
- **Programme sponsor:** aggregate confirmed work and operating cost can be reviewed under an approved reporting policy; provider claims are not counted automatically as household outcomes.

## Pilot scorecard and denominators

Proposed eight-week feasibility pilot: two weeks preparation, two baseline weeks, four supervised-use weeks. It is too small to claim causal health outcomes. Baseline and intervention figures need comparable approved tasks, areas and workdays; case mix can change.

| Measure | Definition |
|---|---|
| Due-task completion | Completed eligible tasks due by planning date / eligible tasks due by that date, with task identity fixed. Separate clinical/joint tasks outside this scheduler rather than silently deleting them. |
| Priority/locality equity | Report the same completion/defer-age measures by approved priority and locality. Do not sum overlapping cohorts. |
| Travel and workload | Observed minutes per comparable workday; ASHA capture time; coordinator follow-up time. Modelled distance is not observed savings. |
| Referral funnel | Unique consented needs → offered → accepted → reported → independently confirmed. Attempts can repeat; do not treat attempts as unique people. |
| Confirmed-help rate | Unique consented needs confirmed within a predeclared follow-up window / all unique consented needs enrolled in that cohort. Show pending, withdrawn, partial, disputed and unresolved separately; do not remove failures to improve the rate. |
| Time to help | Median time from need creation to person confirmation among confirmed needs; also report unresolved age to avoid hiding failures. |
| Cost per confirmed assistance | Actual agreed programme coordination/support expenditure / unique confirmed assists. Show period, included costs and zero-denominator handling; no rupee estimate is established. |
| Cash-assistance reconciliation | Show requests and whole-rupee amounts separately at approval, provider report, person receipt and closure. Report disputed/revoked cases and unresolved holds. Demo entries are not actual programme expenditure. |

Use the pilot to decide if the workflow is usable and worth a larger evaluation. Never promise 30% travel savings, 50% faster referrals, lives saved, national scale or guaranteed funding without appropriate evidence.

## What can be proved today

Working local TanStack/React app, Node/SQLite persistence, 24 fictional tasks representing 23 invented person references, two ASHA accounts and three fictional offers in document navigation. The cash extension adds fictional funding requests, NGO-owned budgets, transactional approval/reservation, external payment reports, independent assisted receipt, dispute/closure and revocation/reconciliation. Scoped referral/funding conversations persist with unread/read status. See [the implemented contract](../FUNDING_AND_COMMUNICATION.md).

Current checks: **31/31 Vitest**, **15/15 actual HTTP/SQLite tests** and **8/8 separate independent HTTP/SQLite audit checks**. [NGO-support verification](../NGO_SUPPORT_REVIEW_2026-10-09.md) records the extension evidence. The [UI trust review](../UI_TRUST_REVIEW_2026-10-09.md) and [earlier full referral-flow evidence](../UI_REVIEW_2026-10-09.md) remain dated records of preceding revisions. Counts concern software checks; they are not households helped or measured impact.

Public deployment is pending. No real partner onboarding, verified production identities, offline synchronization, live scheme API, money transfer/custody, AI diagnosis, real GPS routing or measured household impact exists. Fictional budget declarations and payment references demonstrate accountability states; they do not prove funds exist or authenticate an external payment.
