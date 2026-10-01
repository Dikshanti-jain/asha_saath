# Canonical product context

Version 1.8 · 9 October 2026. Read this when continuing in a new chat or after context compaction.

## User intent

The team chose Healthcare 03 in the GIT Jaipur hackathon. They want a practical ASHA visit optimizer expanded with locally useful NGO help, funding/in-kind coordination and rural/urban/state/national discovery. The latest direction is to **create a separate Android-first native mobile app alongside the website, then test and install it on the USB-connected phone**. The imported local app now has government-style role screens, maps, persistent Node/SQLite, synthetic cash requests/budget reservation/receipt/closure and scoped messages. Pitch and documentation reflect actual behaviour. Continue this local source; do not restart generation.

## Locked demo decisions

1. Working name: ASHA Saath; uniqueness unverified.
2. Original PS centre: CSV → approved risk/priority → geographic grouping/nearest-neighbour → feasible daily visits → travel estimate → unserved reasons → coverage projection.
3. Demo: **24 synthetic visit tasks**, a fictional catchment, two preassigned staff, three fictional provider offers and **one support category: entitlement-document navigation**.
4. Roles: ASHA/worker, coordinator/supervisor and provider intake. Current local sign-in explicitly selects a fixed fictional account and creates a server-derived scoped session. Anyone trying the demo may select these accounts; this is not verified production staff identity, password/OTP login or real provider provisioning. A browser role label never grants backend permission.
5. Clinical risk comes from authorized staff/versioned rules. No AI diagnosis, symptom scoring or automatic clinical eligibility.
6. Urgent clinical escalation bypasses NGO matching and remains a separate visible queue.
7. NGO follow-up has a named coordinator. ASHA captures a short need and permission during the visit.
8. Public entitlement/service pathway is considered first. NGO help does not approve benefits or replace public-service responsibility.
9. Organization registration, service verification, live capacity, provider acceptance, delivery and recipient confirmation are separate facts.
10. Actual service catchment is per offer. Rural village/hamlet/block and urban ward/settlement are supported in the model. State/national views aggregate; they do not expose household pins.
11. One active referral attempt/allocation per need; sequential provider offers in the MVP. Acceptance reserves capacity atomically.
12. Consent scopes the shared information and recipient. Withdrawal blocks further access/actions and ends an active allocation without erasing the restricted audit history.
13. Offline plan downloads and queued synthetic visit/need capture are later work and have not been implemented or tested. Provider acceptance/capacity reservation requires the online server.
14. No wallet, donation custody or live payment transfer. The user's 9 October instruction authorizes a synthetic NGO cash-assistance ledger and persistent case communication; they explicitly chose to complete the demo flow first. Separate recipient permission, own-NGO budget reservation, external payment claim and person confirmation are required. See [the current extension](docs/FUNDING_AND_COMMUNICATION.md). Real providers/payments and wider in-kind services remain later work.
15. Preserve the imported TanStack Start/React/TypeScript framework, generated entry/configuration and `bun.lock`. The actual current adapter is one local Node 24 HTTP backend with persistent SQLite. Supabase Cloud is provisioned but unconnected; no Supabase RLS claim is valid. PostgreSQL/Supabase specification sections describe a future reviewed deployment.
16. Government-style appearance uses original branding and a visible prototype label. No state emblem, ministry logo or implied official portal.
17. Current scheduling policy is `priority-due-deferral-window-locality-v2`: approved priority → earlier due date → higher defer count → earlier latest window → locality/nearest-neighbour → immutable identity. Geography must not displace the higher scheduling obligation. Historical nearest-first snapshots are superseded.

## Stable facts and cautions

- Earlier research catalogued 24 programmes and 30 platforms/services. That is not a count of independent welfare entitlements or competitors.
- ASHA is a trained community/public-health interface; ANM/CHO/doctor clinical responsibilities differ.
- SSBSK launched in June 2026 and changes the current child-care context. Exact new schedule was not retrieved; generic synthetic rules are used.
- Scheduling, offline collection and referrals already exist in products such as ANMOL, CommCare, Shaishav and others. Our differentiation is the specific usable journey and accountable local fulfillment.
- Darpan registration is not endorsement or service availability.
- No national NGO coverage, real household impact, guaranteed travel reduction or winning percentage has been demonstrated.

## Source of truth and precedence

The user's latest explicit instruction governs the task. For product implementation, resolve contradictions in this order: this context and [decisions](docs/DECISIONS.md), [PRD](docs/PRD.md), domain contracts ([states](docs/STATE_MACHINES.md), [data](docs/DATA_MODEL.md), [API](docs/API_CONTRACTS.md)), [TRD](docs/TRD.md), design/UI documents, then build prompts.

Research notes are evidence/background, not an override of the current narrow demo. Older stack recommendations in research notes are superseded by the current TRD. Update linked documents together when a decision changes.

## Current workspace status

**Latest Android checkpoint:** separate Expo SDK 57 / React Native mobile client in [asha-saath-mobile](asha-saath-mobile/README.md) shares the existing Node/SQLite backend. Native bearer sessions are independent of website cookies; backend HTTP **19/19**, mobile transport **4/4**, independent native HTTP **9/9**, Expo Doctor **21/21**, mobile TypeScript/full lint and JS exports passed. A bundled arm64 local-demo APK built successfully and was installed/launched on the user's authorized TECNO CL7k / Android 16 phone. Native login restoration, Hindi/English actions, visit/help capture, fresh-permission ₹500 request, saved case message, map selection/zoom/reset and NGO budget reading were checked; test records stayed in the isolated database. Phone now uses shared proxy5186 with Rural ASHA / Hindi Today. [Device review](output/verification/mobile-device-2026-10-09/native-device-review.json) distinguishes these checks from the full funding browser/HTTP journey. APK signature/ZIP/16KB alignment passed; test signing/local HTTP remain demo-only. Native maps use an illustrative confirmed-fictional route/list; no live GPS/road routing. Public hosting and production signing remain pending. Read [mobile architecture and build boundaries](docs/MOBILE_APP.md).

**Latest completed scope:** persistent cash-assistance requests, own-NGO budget decisions/reservation, independent receipt/coordinator closure, withdrawal/reconciliation, current-case messages and read receipts. TypeScript, **31/31 Vitest**, **15/15 real HTTP/SQLite**, **8/8 independent audit** and Node production build passed. Browser approval/report/receipt/closure survived reload; Hindi 320px at text scale 1.25 funding/messages had width/scroll 305/305. Existing working data was preserved. Read [support review](docs/NGO_SUPPORT_REVIEW_2026-10-09.md). No money-transfer account or live NGO connection is integrated.

**Latest pitch checkpoint:** [Hinglish speech](docs/pitch/01-FIVE_MINUTE_PITCH_HINGLISH.md), [evidence and benefit metrics](docs/pitch/02-EVIDENCE_AND_BENEFITS.md), [mind map/NGO operations](docs/pitch/03-MIND_MAP_AND_NGO_OPERATIONS.md) and [demo/Q&A](docs/pitch/04-DEMO_AND_JUDGE_QA.md) include the synthetic cash/messages flow. Speech: **606 words**, about **4.66 minutes at 130 words/minute**, plus pauses; human rehearsal remains needed. Dated official context is over **10.40 lakh ASHAs as of 31 December 2025** and provisional **NFHS-6 (2023–24) 65.2%** mothers with four-plus ANC visits for their last birth in the five years before the survey; India estimates exclude Manipur. These are context, not measured product impact. Real partner onboarding/payment arrangements and the eight-week pilot remain proposed. See diagram review for actual rendering checks.

**Latest 9 October checkpoint:** the user requested clean government-style UI/UX before deployment. The compact portal shell and all operational flows have been revised; Leaflet route/NGO catchment maps are implemented using existing fictional fixtures. Final checks: TypeScript, 25/25 Vitest, 9/9 backend HTTP and Node production build passed. Full synthetic referral flow passed in an isolated Node preview. Persistent working data is preserved. Read [current UI review](docs/UI_REVIEW_2026-10-09.md) and [handoff](docs/CONTEXT_HANDOFF.md).

Render/Railway are the user's chosen hosting options. Build/gateway/Docker/host configuration and deployment instructions are prepared; **not publicly deployed**. Host login/source connection and applicable paid-resource review remain pending. Prior paragraphs below document the 8 October milestone; their 22/8 test counts and screenshots are historical.

Documentation and synthetic fixtures are prepared. Five public portals were captured read-only; screenshot limitations are recorded in the design research. Initial connector queries returned no custom design systems/connectors/workspace skills and no matching ASHA project before creation; these historical results are not a current inventory.

The source [Lovable project](https://lovable.dev/projects/84ca52fd-1ccf-4574-ac3a-191a553287e0), commit `b4e03681e52dbba19f0a6b20f7f4d61bf678019e`, has been imported into [asha-saath-lovable](asha-saath-lovable/README.md): 115 listed files, 113 text files downloaded; credentials and a binary favicon were excluded. A later partial remote backend commit `d0abb7` was stopped under the user's local-build direction and was not imported. Local edits are distinct from the imported revision and are not claimed to be synced back.

The app runs on frontend 5173 and API 4318 with actual persistent SQLite. The user's local import/UI/backend/database objective is complete. Local typecheck and Vite 8.1.5 client/SSR/Cloudflare-target module build passed; full Vitest 22/22, backend HTTP 8/8, fresh planner regression 11/11 and all nine required properties passed. Earlier independent backend audit 7/7 remains historical evidence. The two earlier fairness failures were fixed under the approved urgency-before-geography policy.

Direct browser evidence covers REQ-005 with provider C through permission, offer, capacity reservation, valid arrangement, delivery report, independent person confirmation, coordinator closure and reload persistence. After API restart, recorded rural visits remained; rural remaining plan v2 and urban plan v1 were regenerated/saved. Mobile English at 390 and Hindi at 320 with 1.25 text size had no whole-page horizontal overflow; the Hindi action fit above the bottom navigation. Withdrawals/recovery were checked through HTTP rather than every browser branch. Hindi remains draft, and full screen-reader/all-page 200% zoom audits were not performed. Read [BUILD_STATUS](docs/BUILD_STATUS.md) and [app verification](asha-saath-lovable/BUILD_VERIFICATION.md).

The source ZIP exists and passed CRC/SHA256 plus clean extracted Node 24 backend initialization with 24 synthetic tasks. Final packaging is refreshed after document/source edits. A successful generated Cloudflare module is not a deployed Node SQLite backend. Production identity, real partner/rule approval, reviewed hosting and optional Supabase/RLS/offline/payment integrations remain beyond the local prototype.

An unpublished Sites/Vinext fallback in asha-saath-app was started during the temporary connector gap. Its dependency installation failed; it is unfinished and is not the primary website. Do not publish or confuse that scaffold with the Lovable app.
