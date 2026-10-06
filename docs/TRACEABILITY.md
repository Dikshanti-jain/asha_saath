# Requirements traceability

Use this table to prevent a beautiful UI from replacing the chosen problem or a backend from omitting the visible workflow.

| Requirement | Screen | Domain/table | Logical command/query | Acceptance |
|---|---|---|---|---|
| FR-01 CSV | UX-02 | import_batches, visit_tasks | previewImport, commitImport | T-01, T-04 |
| FR-02 identity | UX-02 | task composite identity | commitImport | T-02, T-03 |
| FR-03 approved priority | UX-03/04/05 | programme_rules, task status | generatePlan, recordVisit | T-04, T-08 |
| FR-04 geography | UX-03/04 | locality groups, seed order | generatePlan | T-05, T-06 |
| FR-05 feasible day | UX-03/04 | daily_plans, plan_stops | generatePlan, savePlan | T-07 |
| FR-06 unserved | UX-03/04/11 | plan_dispositions | getDailyPlan | T-06–T-08 |
| FR-07 replan/projection | UX-03/13 | immutable due dates | replanRemaining, getCoverageProjection | T-09–T-11 |
| FR-08 visit result | UX-05 | visit_events | recordVisit | T-09 |
| FR-09 consent | UX-06/10 | consents, support_needs | recordConsent, withdrawConsent | T-12, T-14, T-22 |
| FR-10 public pathway | UX-06/07/12 | programme_cards, geographies | listEligibleOffers | T-13 |
| FR-11 eligible service | UX-07/12 | service_catchments, capacity_windows | listEligibleOffers, verifyService | T-13 |
| FR-12 atomic acceptance | UX-08 | attempts, reservations | acceptReferral | T-16–T-18, T-23 |
| FR-13 supplied report | UX-09 | arrangements, delivery_reports | arrangeService, reportDelivery | T-19 |
| FR-14 confirmation | UX-10 | receipt_confirmations | confirmReceipt, closeNeed | T-20–T-22 |
| FR-15 recovery | UX-10/11 | coordinator/next action | declineReferral, expireOffer, setRecoveryAction | T-15 |
| FR-16 offline, P1 | UX-04/05/06 | client queue + replay | permitted queued commands | T-28–T-30 |
| FR-17 roles/audit | All protected screens | memberships, case grants, audit | all server commands | T-24–T-27 |
| FR-18 UI/accessibility | UX-01–UX-14 | design tokens, locales | presentation | T-31, T-32 |
| FR-19 metrics | UX-03/11/13 | cohort-safe reporting | getReports | T-11, T-33 |
| FR-20 finance, later | Future scoped view | resource approvals/reconciliation | Deferred | Separate future contract/test plan |

The current pack validator checks the existence of these IDs and linked files, fixtures and contrast pairs. It cannot prove runtime implementation of any requirement.
