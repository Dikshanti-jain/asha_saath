# Decision register

All entries recorded 8 October 2026. Changes require updating affected specs/prompts; an older research note does not silently override these decisions.

| ID | Decision | Reason / consequence |
|---|---|---|
| ADR-01 | Keep Healthcare 03 visit optimizer central | NGO expansion must retain CSV, geography, risk-weighted feasible day and coverage |
| ADR-02 | 24 tasks, one category, three fictional offers | A complete understandable journey fits the hackathon; broader network remains roadmap |
| ADR-03 | Stable dataset/task identity | Patient/name dedup loses legitimate distinct visits |
| ADR-04 | Approved priority + deterministic heuristic | Auditability and clinical authority; no LLM clinical scoring |
| ADR-05 | Priority/deadline/deferral before geography | Nearby low-priority convenience cannot hide difficult due work |
| ADR-06 | Projection changes date, never deadlines | Prevent fake coverage obtained by rewriting clinical due dates |
| ADR-07 | Coordinator owns NGO follow-up | Protect worker workload; recovery requires a real owner |
| ADR-08 | Public pathway before NGO help | Preserve entitlement access and service responsibility |
| ADR-09 | Service/catchment/capacity independently verified | A registered organization's office is not a deliverable service everywhere |
| ADR-10 | Sequential offers and transactional acceptance | Smaller reliable MVP; one active allocation |
| ADR-11 | Delivery report ≠ recipient confirmation | Honest service closure and dispute handling |
| ADR-12 | Withdrawal revokes access immediately | Capacity reconciliation/audit cannot restore consent |
| ADR-13 | Synthetic data in default Lovable build | Current provider terms and no approved live-data deployment |
| ADR-14 | New Lovable uses generated TanStack Start | Current October 2026 documentation supersedes old React/Vite assumptions |
| ADR-15 | One authoritative backend adapter | Current local adapter is Node HTTP/SQLite (ADR-21); PostgreSQL/RLS remains a future deployment target |
| ADR-16 | Formal government shell with original identity | User visual preference; no implied government endorsement |
| ADR-17 | Offline follows working core; reservations online | A downloaded plan cannot establish live provider availability |
| ADR-18 | Funding documented as later noncustodial workflow | Preserve full vision without distracting from the core or pretending finance is live |
| ADR-19 | Specs/local skills first, no shared workspace mutations | Current user explicitly requested detailed files before the build |
| ADR-20 | Proceed with working Lovable website after user continuation | Lovable temporarily disconnected then reconnected; primary build uses Lovable. Unpublished Sites fallback is suspended |
| ADR-21 | Local Node 24 HTTP/SQLite for the imported frontend | User requested local implementation. Durable records and capacity transactions work locally; remote Supabase is unconnected |
| ADR-22 | Enforce urgency before geography in the imported planner | Priority → approved due date → higher defer count → earlier latest window → locality/nearest → immutable identity. Fixes the two reproduced fairness failures without changing approved inputs |
| ADR-23 | Fresh permission choice per request and named recipient | Changing either resets the checkbox. Re-nomination supersedes the prior grant server-side; provider access remains referral scoped |
| ADR-24 | Add user-authorized synthetic cash assistance and case messages, 9 October 2026 | Supersedes future-only ADR-18 for the demo ledger. Separate funding permission, NGO-only budget approval, atomic reservation, reported external payment and person confirmation; no actual transfer or bank details |

Actual generated configuration and current local database are resolved. Production hosting/data host, verified real identity and PostgreSQL/RLS migration remain open. Safe defaults are in [open questions](OPEN_QUESTIONS.md). Earlier nearest-first snapshots are historical evidence and must not be reused as the current algorithm.
