# ASHA Saath — implementation specification pack

**Version 1.4 · 9 October 2026 · Status: working website and shared SQLite backend; separate Android app built, installed and smoke-tested on the authorized phone. Public hosting remains pending.**

Bro, ye pack ASHA visit optimizer + local NGO support platform banane ke liye hai. Product ka working name **ASHA Saath** hai; name/trademark availability verify nahi hui. Technical specs English mein hain taaki Lovable aur coding agents clearly follow kar sakein. User-facing copy Hindi/English hai.

The working primary app is now [asha-saath-lovable](asha-saath-lovable/README.md). Run `npm run dev:local` from that folder with Node 24 to start the frontend and local database API, then open [127.0.0.1:5173](http://127.0.0.1:5173). Read its [verification report](asha-saath-lovable/BUILD_VERIFICATION.md) and [current build status](docs/BUILD_STATUS.md) before claiming feature completion.

The separate native client is [asha-saath-mobile](asha-saath-mobile/README.md). The [USB demo APK](output/asha-saath-android-usb-demo.apk) is installed on the connected Android phone; it currently needs the running laptop backend and USB port reversal. Read [mobile build/device boundaries](docs/MOBILE_APP.md) for actual checks and public HTTPS/production release work.

## Product in one sentence

**ASHA ka feasible daily visit plan banao; visit mein nikli nonclinical support need ko consent ke saath public service ya participating local provider tak pahunchao; acceptance, delivery aur confirmation alag track karo.**

The original Healthcare 03 visit optimizer is the centre. NGO discovery, help and funding are an expansion around that workflow. Build one complete local journey before adding a national network.

## Read in this order

| File | What it fixes |
|---|---|
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | Short context, product boundaries and current status |
| [PRD](docs/PRD.md) | Users, scope, feature IDs, acceptance and impact measures |
| [TRD](docs/TRD.md) | Current Lovable stack, architecture, planning algorithm and backend strategy |
| [Design research](docs/DESIGN_RESEARCH.md) | Five real government portal captures; observed patterns versus our decisions |
| [Design system](docs/DESIGN_SYSTEM.md) | Government-style shell, exact tokens, typography and component rules |
| [UI/UX specification](docs/UI_UX_SPEC.md) | Screen-by-screen layouts, actions, mobile behaviour and exceptional states |
| [Detailed file structure](docs/FILE_STRUCTURE.md) | Actual documentation/import/backend paths and proposed module map |
| [AGENTS.md](AGENTS.md) | Instructions for agents working in this project |
| [SKILLS.md](SKILLS.md) | Four local skill recipes and when to use them |
| [Lovable handoff](lovable/README.md) | Exact knowledge, initial prompt, staged build prompts and plugin workflow |

## Engineering and delivery references

- [Data model](docs/DATA_MODEL.md), [API contracts](docs/API_CONTRACTS.md), [state machines](docs/STATE_MACHINES.md) and [roles](docs/ROLE_PERMISSIONS.md) define the same domain.
- [Security/privacy](docs/SECURITY_PRIVACY.md), [accessibility/Hindi](docs/ACCESSIBILITY_I18N.md), [acceptance tests](docs/TEST_ACCEPTANCE.md) and [traceability](docs/TRACEABILITY.md) define the release gates.
- [Roadmap](docs/ROADMAP.md), [demo script](docs/DEMO_SCRIPT.md), [decisions](docs/DECISIONS.md), [open questions](docs/OPEN_QUESTIONS.md) and [handoff status](docs/CONTEXT_HANDOFF.md) preserve implementation context.
- [Source register](docs/RESEARCH_SOURCES.md) links current primary sources. The earlier [decision brief](asha-ngo-decision-brief.md) and [full research report](asha-ngo-full-report.md) retain the 24-programme / 30-platform analysis.
- [Synthetic data guide](fixtures/README.md), [24-task CSV](fixtures/demo-caseload.csv), [three provider offers](fixtures/demo-service-offers.json), [demo configuration](fixtures/demo-config.json) and [scenarios](fixtures/demo-scenarios.json) make the demo reproducible.
- [Machine-readable design tokens](design/tokens.json) and [validation instructions](scripts/README-spec-tools.md) support implementation.

## What is ready

This pack contains specifications, local skills, fixtures, research screenshots, a documentation validator and a ZIP handoff. Generated source from [ASHA Saath Planner](https://lovable.dev/projects/84ca52fd-1ccf-4574-ac3a-191a553287e0), commit `b4e03681e52dbba19f0a6b20f7f4d61bf678019e`, has been imported into the local workspace. The actual adapter is a Node 24 HTTP API with persistent SQLite, server-derived synthetic account sessions, scoped projections and transactional commands. Typecheck and Vite 8.1.5 client/SSR build passed; 22 Vitest tests, eight real HTTP backend tests, 11 planner regressions and nine required planner properties passed. The complete referral journey closed and remained closed after reload; worker mobile Hindi/English screens were checked. [BUILD_STATUS](docs/BUILD_STATUS.md) retains exact evidence, historical failures and the limits of those checks.

**Current implementation:** retain the imported **TanStack Start / React / TypeScript** scaffold, generated platform entry and `bun.lock`. Local npm dependencies and `package-lock.json` were added for execution. The local SQLite adapter is authoritative. Supabase Cloud is provisioned but unconnected; its generated client files do not establish a working integration or RLS. PostgreSQL/Supabase descriptions in the specification remain the future production architecture, not the current runtime.

**Visual direction:** formal utility bar, white identity header, navy navigation, restrained saffron accent, neutral panels, visible ownership/help footer, large Hindi controls and clear status tables. These are our design decisions informed by government portals; they do not imply government ownership, endorsement or GIGW certification.

## Continue the local application

1. Read [PROJECT_CONTEXT](PROJECT_CONTEXT.md), [handoff](docs/CONTEXT_HANDOFF.md), [BUILD_STATUS](docs/BUILD_STATUS.md) and the imported app's [AGENTS](asha-saath-lovable/AGENTS.md).
2. Run the local app using its [README](asha-saath-lovable/README.md). Inspect the actual frontend, backend and SQLite behaviour before changing it. Do not create a second Lovable project or use the unfinished Sites folder.
3. Keep verified workflows and server transaction boundaries when making later changes. Scheduling policy is `priority-due-deferral-window-locality-v2`: approved priority/due date/deferral/latest window precede geography. The original prompts are reference templates, not instructions to restart generation.
4. Read [context handoff](docs/CONTEXT_HANDOFF.md) for actual results and production/pilot limits. [Source ZIP](output/asha-saath-website-source.zip) exists with CRC/hash and clean-backend checks; refresh source/spec packaging whenever final source or documentation changes.

This is a **synthetic demonstration**. Real clinical records, Aadhaar, household identities and financial account data must not be uploaded into the default Lovable build. Live operation needs a reviewed deployment/data arrangement, approved clinical rules and participating service providers.
