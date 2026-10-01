# Project skill catalogue

The four local skills below are reusable Markdown recipes. They are **not installed globally** and **not registered in the Lovable workspace**. A tool does not automatically load every SKILL.md from an arbitrary repository. An agent may read the linked file directly; a future Lovable import can register a reviewed package at workspace scope.

The website build is already authorized. The generated TanStack frontend has been imported into [asha-saath-lovable](asha-saath-lovable/README.md), improved locally and connected to an actual Node HTTP/SQLite database adapter. This is the primary app. Check current evidence and remaining QA in [BUILD_STATUS](docs/BUILD_STATUS.md). These recipes guide that work; reading or packaging them does not create a second application, install a workspace skill or establish that a feature has passed its checks. Start with [PROJECT_CONTEXT](PROJECT_CONTEXT.md) and [handoff](docs/CONTEXT_HANDOFF.md).

| Skill | When it helps | Main references |
|---|---|---|
| [asha-product-context](skills/asha-product-context/SKILL.md) | Resuming work or changing product scope | Context, PRD, decisions, handoff |
| [asha-government-ui](skills/asha-government-ui/SKILL.md) | Building/reviewing a screen with the formal government portal visual language | Design system, UI/UX, accessibility |
| [asha-referral-integrity](skills/asha-referral-integrity/SKILL.md) | Implementing capacity, consent, provider acceptance or closure | States, data, API, role tests |
| [asha-evidence-refresh](skills/asha-evidence-refresh/SKILL.md) | Updating clinical programme rules, scheme facts or platform capabilities | Source register, research notes, decisions |

## Available tool roles

- **Lovable:** source reference, remote project knowledge and provisioned Cloud information for [ASHA Saath Planner](https://lovable.dev/projects/84ca52fd-1ccf-4574-ac3a-191a553287e0). The pinned phase-2 source is already imported; later partial phase-3 changes were not imported. Supabase is unconnected. Do not create another project, restart generation or claim local edits are synced back.
- **Local file/runtime tools:** primary implementation in `asha-saath-lovable/`, retaining the generated TanStack Start scaffold and `bun.lock`. Local npm packages/lockfile are installed. Run `npm run dev:local` with Node 24 for frontend 5173 and backend 4318. Record actual package/HTTP tests and visible screen states; specification checks are not runtime checks.
- **Local backend:** server membership/session policy in `backend/policy.mjs`, commands in `backend/domain.ts`, persistence/transactions in `backend/server.mjs` and `schema.sql`. UI code uses the HTTP `cmd` adapter; never restore browser-authoritative clinical data, capacity or referral transitions. Fixed open fictional accounts are not verified production identity.
- **Web browsing:** current official design/technology sources and source refresh.
- **Plugin Management:** inspect/find relevant capabilities when something necessary is missing; avoid installing unrelated plugins.
- **Figma:** optional future shared design file/prototype. No Figma document exists for this project; discover current access if it becomes necessary.
- **Canva:** optional future mentor pitch; unused and not an application dependency. Availability must be checked before use.
- **Tavily:** optional research capability; earlier quota errors mean access and usable capacity must be checked before use.

Use the few tools that materially help the task. See [Lovable plugin workflow](lovable/PLUGIN_WORKFLOW.md) for exact boundaries and context transfer.

The local `asha-saath-app/` folder is an unfinished Sites/Vinext fallback, distinct from the working imported TanStack app. The [acceptance catalogue](docs/TEST_ACCEPTANCE.md) defines required behaviour; it is not a passing test report. Server checks passed within the synthetic local scope; production identity, Supabase RLS, live partners, clinical rule approval, offline synchronization and payments remain absent.

## Portability

The skill files have name/description frontmatter and focused instructions. Their relative links work in this documentation repository. When importing a skill alone into Lovable, attach its referenced project documents or replace the relative references with matching project-repository paths. Do not assume workspace skill storage includes the entire local research repository.
