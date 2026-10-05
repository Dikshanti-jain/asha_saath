# Detailed file structure and ownership

Version 1.5 · 9 October 2026. **Generated Lovable frontend source has been imported into `asha-saath-lovable/` and connected to a local Node HTTP/SQLite backend.** The user also authorized a separate Android-first app in `asha-saath-mobile/`, retaining the companion website and shared server. Read [mobile implementation and build limits](MOBILE_APP.md). The actual local structure is recorded below. The later detailed module map remains a responsibility plan, not a claim that every conceptual file exists. Read [BUILD_STATUS](BUILD_STATUS.md) for actual website runtime and browser checks.

New actual files in the 9 October revision:

```text
asha-saath-lovable/
├── src/components/coordinator-visit-register.tsx   Guided import and visit register
├── src/components/ServiceMap.tsx                 Browser-only Leaflet component
├── src/components/VisitRouteMap.tsx              Saved order and interactive stop list
├── src/routes/coordinator.map.tsx                Routes and NGO service-area views
├── src/lib/demo/map.ts                           Synthetic-only map projection
├── src/lib/demo/map.test.ts                      Coordinate, order, centroid checks
├── scripts/build-node.mjs                        Node deployment target
├── scripts/start-production.mjs                  Single-origin SSR/API gateway
├── Dockerfile / .dockerignore                    Deployment image definition
├── render.yaml / railway.json                    Prepared host configurations
└── DEPLOYMENT.md                                 Pending deployment steps and limits
docs/UI_REVIEW_2026-10-09.md                       Changed UX and actual evidence
output/verification/ui-redesign-2026-10-09/        Screenshots and check record
```

## 1. Actual documentation repository

New user-authorized cash/message extension: `backend/support.mjs`; `src/components/FundingWorkspace.tsx` and `CaseMessages.tsx`; six role route files `coordinator|worker|provider.funding.tsx` and `.messages.tsx`; HTTP client types/commands in `store.ts`; role navigation, privacy/help/network/report integration. [Funding and communication](FUNDING_AND_COMMUNICATION.md) describes the actual contract. Trust/freshness components are `WorkspaceStatus.tsx` and its tests; pitch delivery aid is `docs/pitch/05-DELIVERY_AND_CLAIM_REVIEW.md`.

```text
problem/
├── START_HERE.md                    Team entry and document map
├── README.md                        Current delivery status
├── PROJECT_CONTEXT.md               Compact canonical context
├── AGENTS.md                        Project agent instructions
├── agent.md                         Convenience link to AGENTS.md
├── SKILLS.md                        Local skill catalogue
├── docs/
│   ├── PRD.md                       Product scope and FR-01…FR-20
│   ├── TRD.md                       Current stack and architecture
│   ├── DESIGN_RESEARCH.md           Observed government references
│   ├── DESIGN_SYSTEM.md             Visual/component tokens
│   ├── UI_UX_SPEC.md                 UX-01…UX-14 screen contracts
│   ├── FILE_STRUCTURE.md            This file
│   ├── DATA_MODEL.md                Entities and constraints
│   ├── API_CONTRACTS.md             Logical commands and errors
│   ├── STATE_MACHINES.md            Canonical enum/transition definitions
│   ├── ROLE_PERMISSIONS.md          Row/field/command access
│   ├── SECURITY_PRIVACY.md          Sensitive data and consent boundaries
│   ├── ACCESSIBILITY_I18N.md        Accessibility and bilingual rules
│   ├── TEST_ACCEPTANCE.md           Behaviour and release checks
│   ├── TRACEABILITY.md              Requirements → screens → tests
│   ├── ROADMAP.md                   Core build, offline and pilot sequence
│   ├── DEMO_SCRIPT.md               Judge demonstration with failure case
│   ├── DECISIONS.md                 Dated architecture/product decisions
│   ├── OPEN_QUESTIONS.md            Production questions and safe defaults
│   ├── CONTEXT_HANDOFF.md           Actual progress and next work
│   ├── BUILD_STATUS.md              Reviewed application evidence and limits
│   ├── MOBILE_APP.md                Separate Android-first source, transport and build limits
│   ├── RESEARCH_SOURCES.md          Current primary source register
│   ├── CHANGELOG.md                 Spec changes
│   └── reference-captures/
│       ├── capture-metadata.json    URLs, timestamps and render limits
│       ├── ux4g-desktop.png
│       ├── abdm-desktop.png
│       ├── myscheme-desktop.png
│       ├── myscheme-mobile.png
│       ├── emitra-desktop.png
│       ├── emitra-mobile.png
│       └── darpan-desktop.png
├── lovable/
│   ├── README.md                    Exact handoff order
│   ├── PROJECT_KNOWLEDGE.md         <=10,000-character persistent context
│   ├── INITIAL_PROMPT.md            Initial-request reference; do not restart
│   ├── BUILD_PROMPTS.md             Staged implementation prompts
│   ├── BACKEND_COMPLETION_REQUEST.md Prepared hardening/fix request; not evidence
│   ├── PLUGIN_WORKFLOW.md           Checked capabilities and future roles
│   ├── REVIEW_CHECKLIST.md          Lovable preview/backend review
│   └── UPLOAD_MANIFEST.md           Which docs to attach by phase
├── design/tokens.json               Machine-readable styling
├── fixtures/
│   ├── README.md                    Synthetic dataset semantics
│   ├── demo-config.json             Frozen clock and shift assumptions
│   ├── demo-caseload.csv             24 tasks
│   ├── demo-service-offers.json      Three fictional offers
│   └── demo-scenarios.json           Reproducible success/failure scenarios
├── skills/
│   ├── asha-product-context/SKILL.md
│   ├── asha-government-ui/SKILL.md
│   ├── asha-referral-integrity/SKILL.md
│   └── asha-evidence-refresh/SKILL.md
├── scripts/
│   ├── capture_design_references.cjs Read-only public captures
│   ├── validate_spec_pack.py         Local links/fixtures/contrast checks
│   ├── package_spec_pack.py          Reproducible ZIP selection
│   ├── check_planner_snapshot.mjs    Independent checks of a pinned source snapshot
│   ├── package_application_snapshot.py Packages a downloaded reviewed source manifest
│   └── README-spec-tools.md          How to run tools
├── output/
│   ├── asha-saath-spec-pack.zip      Documentation handoff
│   ├── spec-validation.json         Recorded pack validation
│   ├── lovable-source-manifest.json Pinned import inventory; 113 text files
│   └── verification/
│       ├── phase1/                 Historical first-commit modules/results
│       ├── local-domain/           Current independent planner checks
│       └── backend-independent-audit/ Isolated HTTP audit evidence/source hashes
├── research/                        Earlier ten-agent evidence and synthesis
├── asha-ngo-decision-brief.md
├── asha-ngo-full-report.md
├── README-research-pack.md
├── asha-saath-lovable/              Imported TanStack Start app; local primary
├── asha-saath-mobile/               Separate Expo/React Native Android-first app; same API/DB
└── asha-saath-app/                  Unfinished, unpublished Sites/Vinext fallback
    └── README-FALLBACK.md           Explains its status; not the primary app
```

Earlier reports/PDF/scripts remain preserved. The documentation root is not an application package. The local `asha-saath-app/` folder has a generated Vinext package and proposed code, but installation failed and no deployment or migration ran. Its existence does not establish a working website.

## 2. Actual primary application

The source project is [ASHA Saath Planner](https://lovable.dev/projects/84ca52fd-1ccf-4574-ac3a-191a553287e0), imported at `b4e03681e52dbba19f0a6b20f7f4d61bf678019e`. Its actual package uses TanStack Start 1.168.60, React ^19.2.0, TypeScript ^5.8.3 and Vite 8.1.5. The original generated configuration and `bun.lock` are retained; an npm `package-lock.json` was added for local execution. The local imported app is primary. Remote project knowledge and provisioned Supabase Cloud remain source context; Supabase is unconnected and no RLS is claimed.

The [source manifest](../output/lovable-source-manifest.json) records 115 listed files and 113 text files downloaded. Credentials and a binary favicon were excluded. The later stopped partial remote commit `d0abb7` was not imported. Local edits are separate from the imported revision. Historical modules in `output/verification/phase1/` are evidence, not the current full app. Do not recreate the project or substitute the unfinished Vinext fallback.

```text
asha-saath-lovable/
├── README.md                        Local start, API/database and limits
├── AGENTS.md                        Local implementation and server boundary
├── BUILD_VERIFICATION.md            Actual local checks and deployment limits
├── package.json                     dev:local/backend/typecheck/test/build scripts
├── bun.lock                         Preserved generated lockfile
├── package-lock.json                Local npm dependency lockfile
├── vite.config.ts                   Generated config + local /api proxy
├── src/
│   ├── components/AppShell.tsx      Government-style responsive shell
│   ├── components/SessionPanel.tsx  Fictional account/session/server status
│   ├── components/demo-views.tsx    Plan, visit, need and consent views
│   ├── components/provider-views.tsx Scoped provider workflow views
│   ├── components/ui-kit.tsx        Shared semantic controls/states
│   ├── components/ui/              Generated primitives
│   ├── lib/demo/                   Pure CSV/planner/time/fixtures + HTTP store
│   ├── integrations/supabase/      Preserved generated files; not connected
│   ├── routes/                     Actual worker/coordinator/provider/help routes
│   ├── routeTree.gen.ts            Generated route map; do not hand-edit
│   ├── server.ts, start.ts, router.tsx Preserved framework entry/configuration
│   ├── styles.css                  Government-style tokens and responsive/print CSS
│   └── test/                       Local route test/setup
├── backend/
│   ├── README.md                   Actual HTTP contract and identity limits
│   ├── server.mjs                  Node 24 HTTP + SQLite transactions/sessions
│   ├── schema.sql                  Persistent and normalized integrity tables
│   ├── policy.mjs                  Server membership/command/projection policy
│   ├── domain.ts                   Server-only canonical command transitions
│   ├── sync-domain.mjs             Generates runtime from actual pure TS modules
│   ├── http.test.mjs               Real HTTP/session/database integration tests
│   ├── runtime/                    Generated/ignored on startup
│   └── data/                       Ignored SQLite/WAL/session data; never package
├── scripts/dev-local.mjs            Launch frontend 5173 and backend 4318
└── supabase/config.toml             Preserved source context; not an active adapter
```

`src/lib/demo/store.ts` sends commands to the API and applies authorized server projections. It does not persist the caseload or capacity in localStorage. The Node SQLite backend is the actual active adapter. Its generated runtime and database directory are excluded from source packaging. `npm run dev:local` starts both services; `npm run dev` alone starts only Vite.

`output/asha-saath-website-source.zip` contains the current modified app, including backend/session/launch code, tests, lockfiles and updated app docs. Its inventory and checks are recorded in `output/lovable-source-manifest.json` and `output/website-source-packaging.json`. Credentials, databases, dependencies and build output are excluded. Rebuild it after source edits. A successful generated Cloudflare bundle is not a deployment of the Node SQLite backend.

## 3. Actual separate mobile application

The Android-first source uses Expo SDK 57, React Native 0.86 and Expo Router. Its native screens preserve the website's product invariants and call the same scoped Node/SQLite backend using native bearer sessions. The website retains its cookie transport. [MOBILE_APP](MOBILE_APP.md) records the detailed inspected source tree, commands, verified checks and pending Android binary/device work.

```text
asha-saath-mobile/
├── package.json / package-lock.json  Mobile runtime and exact SDK-compatible dependencies
├── app.json / app.config.ts          Identity, Android package, CNG plugins and network settings
├── eas.json                         Prepared internal APK / production AAB profiles
├── src/app/                         Expo Router root, tabs, visits, map and network
├── src/screens/                     Visits, Needs, Funding, Messages, Map, Network
├── src/components/                  Formal native shell/controls, original mark, platform map
├── src/lib/MobileContext.tsx         Session/actor/server state and versioned commands
├── src/lib/api.ts                   Validated origin and native bearer/no-cookie transport
├── src/lib/session-vault.ts          Native SecureStore; memory-only browser credential
├── src/lib/catalog.json             Approved synthetic service/geography/config projection
├── scripts/sync-catalog.mjs          Regenerate catalogue from synthetic fixtures
├── scripts/preview.mjs               Mobile web export and loopback companion API proxy
└── tests/transport.test.mjs          Origin, authorization transport and failure checks
```

Current maps default to an interactive SVG schematic and ordered-list alternative. `MapCanvas.native.tsx` contains optional Google Map integration, explicitly disabled until a restricted key/build is configured and tested. No household coordinate projection goes to the provider role. Native `android/`/`ios/` directories are generated through supported Expo tooling, not manually authored. JavaScript exports and browser screenshots do not constitute an installed APK.

## 4. Proposed website application module map

Use this as a **module ownership plan**. Map each responsibility onto the imported TanStack Start layout as work proceeds. Do not force guessed framework entry names or replace generated configuration. The root name below is conceptual and does not refer to the existing Vinext fallback.

```text
<imported-tanstack-repository>/      Local primary application; preserve generated scaffold
├── AGENTS.md                        Copy project invariants
├── docs/                            Reviewed specs and decisions
├── skills/                          Local skill recipes, if supported
├── package.json                     Generated; inspect actual scripts
├── <generated-lockfile>             Keep one existing package manager
├── <generated-build-config>         Preserve Lovable platform settings
├── tsconfig.json                    Strict supported project settings
├── public/
│   ├── brand/asha-saath-mark.svg     Original vector identity
│   ├── fonts/                       Only reviewed/licensed self-hosted fonts
│   ├── icons/                       PWA assets if implemented
│   └── <pwa-manifest>               Added only when offline install is tested
├── src/
│   ├── routes/                      TanStack file routes; exact layout inspected
│   │   ├── __root.tsx               Shared providers/shell/error boundary
│   │   ├── index.tsx                UX-01 demo overview
│   │   ├── login.tsx                Backend-auth phase only
│   │   ├── <protected-layout>.tsx   Server-authenticated role context
│   │   ├── <worker>/today.tsx        UX-04
│   │   ├── <worker>/visits.$id.tsx   UX-05
│   │   ├── <worker>/needs.tsx        Minimal captured-need projection
│   │   ├── <coordinator>/index.tsx   UX-11
│   │   ├── <coordinator>/caseload.tsx UX-02
│   │   ├── <coordinator>/plans.tsx   UX-03
│   │   ├── <coordinator>/needs.$id.tsx UX-06/07/10
│   │   ├── <coordinator>/network.tsx UX-12
│   │   ├── <coordinator>/reports.tsx UX-13
│   │   ├── <provider>/requests.tsx   UX-08
│   │   ├── <provider>/work.$id.tsx   UX-09
│   │   ├── <provider>/capacity.tsx  Scoped UX-12
│   │   └── help.tsx                 UX-14
│   ├── <generated-route-tree>.ts    Generated routing artifact; don't hand-edit
│   ├── components/
│   │   ├── shell/
│   │   │   ├── UtilityBar.tsx
│   │   │   ├── IdentityHeader.tsx
│   │   │   ├── RoleNavigation.tsx
│   │   │   ├── PrototypeNotice.tsx
│   │   │   ├── WorkerBottomNav.tsx
│   │   │   └── OwnershipFooter.tsx
│   │   ├── common/
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── ErrorSummary.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── SourceCard.tsx
│   │   │   ├── OfflineBanner.tsx
│   │   │   └── AccessibleDataTable.tsx
│   │   └── ui/                     Retain generated accessible primitives
│   ├── features/
│   │   ├── planning/
│   │   │   ├── components/          PlanSetup, TaskCard, RouteSchematic, UnservedList
│   │   │   ├── domain/
│   │   │   │   ├── types.ts
│   │   │   │   ├── import-schema.ts
│   │   │   │   ├── import-identity.ts
│   │   │   │   ├── partition-tasks.ts
│   │   │   │   ├── geography-groups.ts
│   │   │   │   ├── nearest-neighbour.ts
│   │   │   │   ├── travel-model.ts
│   │   │   │   ├── feasible-plan.ts
│   │   │   │   ├── coverage-projection.ts
│   │   │   │   └── baselines.ts
│   │   │   └── services/            Planning/import use cases
│   │   ├── visits/
│   │   │   ├── components/          VisitResultForm, EscalationPanel
│   │   │   └── services/            RecordVisit, ReplanRemaining
│   │   ├── support/
│   │   │   ├── components/          NeedForm, ConsentPanel, OfferCard, Timeline
│   │   │   ├── domain/
│   │   │   │   ├── types.ts
│   │   │   │   ├── consent-scope.ts
│   │   │   │   ├── catchment-match.ts
│   │   │   │   ├── offer-eligibility.ts
│   │   │   │   ├── transitions.ts
│   │   │   │   └── recovery-reasons.ts
│   │   │   └── services/            Offer, Accept, Arrange, Report, Confirm, Withdraw
│   │   ├── provider/                Scoped request/capacity screens and services
│   │   └── reporting/               Cohort counts and aggregate projections
│   ├── server/
│   │   ├── auth/                    Session, membership and capability checks
│   │   ├── commands/                Framework wrappers for API_CONTRACTS
│   │   ├── repositories/
│   │   │   ├── interfaces.ts        Domain persistence contracts
│   │   │   ├── synthetic.ts         Initial demo adapter, labelled simulation
│   │   │   └── postgres.ts          Transactional adapter after backend phase
│   │   ├── transactions/            Accept, withdraw, confirm and expiry
│   │   └── jobs/                    Guarded offer expiry; no blind slot release
│   ├── client/
│   │   ├── offline/
│   │   │   ├── indexeddb.ts         Browser-only lazy adapter
│   │   │   ├── queue.ts             Permitted command queue
│   │   │   ├── sync.ts              Idempotent replay and conflict handling
│   │   │   └── cache-policy.ts      Authorized download/clear limits
│   │   └── demo-clock.ts            Visible frozen clock; reset/test override
│   ├── i18n/
│   │   ├── en.json
│   │   ├── hi.json
│   │   └── format.ts                Locale/date formatting
│   ├── styles/
│   │   ├── tokens.css              Derived from design/tokens.json
│   │   ├── global.css              Generated framework integration retained
│   │   └── print.css               Day sheet
│   └── lib/                        Shared validation/error/time utilities
├── <backend-migrations>/
│   ├── 001_domain_tables.sql
│   ├── 002_integrity_constraints.sql
│   ├── 003_role_policies.sql
│   ├── 004_transaction_commands.sql
│   └── 005_synthetic_seed.sql
├── fixtures/                       This pack's synthetic data, adapted carefully
└── tests/
    ├── planning/                   Identity, feasibility, fairness, projection
    ├── referral/                   Consent, transitions, capacity race
    ├── authorization/              Separate-user/RLS tests
    └── e2e/                        Core role journeys, Hindi and offline
```

If Supabase is selected, migrations may live in its generated supabase/migrations directory. Cloud/server wrapper locations depend on the actual scaffold. Placeholder angle-bracket paths above are ownership concepts, not literal filenames to create.

## 5. Dependency direction

Routes/components call feature services or query hooks. Feature services call domain functions and repository interfaces. Domain functions depend on types/clock/declared data, not React/router/browser APIs. Server repositories handle SQL; client offline adapters never import server secrets.

Current concrete direction: routes/views → `cmd` HTTP adapter in `src/lib/demo/store.ts` → session-derived `backend/policy.mjs` → `backend/domain.ts` and synchronized pure modules → SQLite transaction/constraints. Browser planner previews are advisory; server recomputation controls saved plans. Offline adapters in the proposed map are not implemented.

## 6. Naming and change boundaries

- Domain files use descriptive kebab-case; React components PascalCase; enums stable uppercase.
- Keep presentation strings in locale dictionaries; no translating persisted enum values.
- Do not put all domain code into one page or one “AI agent” function.
- Generated route tree, lockfile and platform config are changed only through their supported generation/tooling.
- One backend adapter and one source of truth for state transitions.
- Copy documents into the generated repository with relative links intact; record actual path differences in the handoff.

## 7. Current pitch artifacts

`docs/pitch/` contains the five-minute Hinglish script, evidence/metrics, NGO operations and mind map, demo/Q&A, index, SVG, browser-rendered PNG, printable HTML and artifact-check JSON. `scripts/render_pitch_mind_map.py` regenerates the SVG/HTML and speech counts; `scripts/package_pitch_kit.py` packages this directory into `output/asha-saath-pitch-kit.zip`. A regenerated diagram needs a renewed visual review and PNG before final packaging.
