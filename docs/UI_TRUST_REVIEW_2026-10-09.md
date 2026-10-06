# Service clarity and trust review — 9 October 2026

This revision makes responsibility, record freshness and service purpose visible. The portal keeps original ASHA Saath branding and explicitly identifies itself as an independent fictional prototype. Government-style presentation does not imply government approval or GIGW certification.

## Implemented changes

- Formal navy utility bar, white bilingual masthead, restrained saffron accent, larger action text and clear service-desk headings.
- The homepage explains visit planning, permitted local help and confirmation before offering the three demo desks.
- Protected workspaces show the current role, last successful server read in IST and a manual refresh action. A failed read replaces the healthy label with an out-of-date warning. Signing out or changing accounts clears the previous freshness timestamp. This timestamp is not the simulated planning date or evidence that every prior command succeeded.
- The account panel distinguishes an active session from a failed request; the misleading blanket “changes saved” message is removed.
- NGO capacity displays its recorded confirmation time, explicitly labelled as the demo clock. It is not a claim of current real-world capacity.
- Service information identifies the maintainer, exact fictional scope, permission and follow-up responsibilities, separate recipient confirmation and official information sources. Technical demo assumptions sit in expandable details.
- The speech follows one illustrative family through planning and document help. One dated official statistic remains in the spoken script; detailed qualifications and software checks stay in evidence/Q&A. A delivery cue card supports natural explanation without fabricated interviews.

Code touched: `AppShell.tsx`, `SessionPanel.tsx`, new `WorkspaceStatus.tsx` and its tests, client `store.ts`, homepage, coordinator overview, sources page and shared CSS. Backend domain, scheduling policy, consent and closure rules were not changed.

## Actual verification

| Check | Observed result |
|---|---|
| TypeScript | Passed |
| Vitest | 27/27 across five files; includes failure/recovery and account freshness tests |
| Actual HTTP/SQLite integration | 9/9 passed using isolated test data |
| Node production build | Client, SSR and Nitro node-server passed |
| Coordinator, homepage and service information | Desktop visual review; service-desk entry and refresh exercised |
| ASHA 390px, English | Page width/scroll width 375/375; record button bottom 531.99 |
| ASHA 320px, Hindi at 1.25 text | Width/scroll 305/305; record button bottom 633.38, above bottom navigation at 783.20 |
| Hindi outcome form | Heading receives focus; choices and actions wrap; cancelled without saving |
| Coordinator and map at 390px | No whole-page horizontal overflow; mobile navigation collapses after map selection |
| Service information at 320px | No whole-page horizontal overflow |
| Account interactions | ASHA → NGO → coordinator; Escape closes account menu and returns focus |
| Browser console | No error entries returned in final review |

Commands completed around 05:04–05:07 IST. The first sandbox Vitest attempt failed while renaming a temporary file before tests executed; the subsequent run outside the sandbox passed. Failure/recovery appearance is verified by React tests rather than an induced browser outage. See [recorded checks](../output/verification/ui-trust-2026-10-09/checks.json).

The earlier [complete referral UI review](UI_REVIEW_2026-10-09.md) remains evidence for that isolated flow. It was not repeated as part of this presentation/freshness revision. Persistent working visit/referral records were preserved.

## Screens inspected

- [Coordinator first viewport](../output/verification/ui-trust-2026-10-09/coordinator-desktop-viewport.png) and [full page](../output/verification/ui-trust-2026-10-09/coordinator-desktop.png).
- [Service homepage](../output/verification/ui-trust-2026-10-09/service-home-desktop.png).
- [Service information desktop](../output/verification/ui-trust-2026-10-09/service-information-desktop.png) and [320px mobile](../output/verification/ui-trust-2026-10-09/service-information-mobile-320.png).
- [ASHA English mobile](../output/verification/ui-trust-2026-10-09/worker-mobile-390.png) and [Hindi enlarged text](../output/verification/ui-trust-2026-10-09/worker-hindi-mobile-320.png).
- [NGO workspace](../output/verification/ui-trust-2026-10-09/provider-desktop.png) and [mobile map](../output/verification/ui-trust-2026-10-09/map-mobile-390.png).

## Limits and next work

Hindi remains draft. No complete screen-reader or all-page 200% zoom audit is claimed. Refresh reports the last successful read, not continuous connectivity. Maps retain fictional coordinates and route order rather than road directions. Real partners, production identity, offline sync, payments/funding and Supabase RLS remain unimplemented. Render/Railway public deployment still requires the host/source connection and real persistence verification. No deployment occurred in this revision.
