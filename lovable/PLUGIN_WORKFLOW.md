# Plugin and connector workflow

Checked 8 October 2026. This document distinguishes available capabilities from actions actually performed.

## 1. Capability findings and primary project

Initial connector inspection returned the following results. The account/workspace changed when Lovable reconnected; empty-list results from that initial inspection must not be treated as a current inventory of every workspace.

| Check | Observed result | Meaning |
|---|---|---|
| Lovable get_me | Authenticated; an accessible owner workspace | Connector usable for the inspected account; reconnection requires checking the current workspace |
| list_design_systems | Empty list | No reusable Lovable design-system ID returned |
| list_custom_connectors | Empty list | No added workspace chat connectors returned |
| list_workspace_skills | Empty list | No custom workspace skills returned |
| Initial list_projects query “ASHA” | Empty list before creation | Historical search result; a primary ASHA project now exists |

No workspace ID/email is needed in product source. Do not infer lack of Cloud/built-in skills from an empty custom connector list.

The existing source project is [ASHA Saath Planner](https://lovable.dev/projects/84ca52fd-1ccf-4574-ac3a-191a553287e0); its [preview](https://id-preview--84ca52fd-1ccf-4574-ac3a-191a553287e0.lovable.app) may require a Lovable session. Its native progress widget was shown, compact project knowledge was set and Supabase-backed Cloud provisioning succeeded. The inspected package confirms TanStack Start 1.168.60, React ^19.2.0 and TypeScript ^5.8.3 with the generated `bun.lock`.

The latest authorized direction made local implementation primary. The generated phase-2 frontend at `b4e03681e52dbba19f0a6b20f7f4d61bf678019e` was imported into [asha-saath-lovable](../asha-saath-lovable/README.md): 115 listed files, 113 text files downloaded. Credentials/binary favicon were excluded; generated configuration and `bun.lock` preserved. The later partial phase-3 remote commit `d0abb7` was stopped and was not imported.

The local frontend has government-style UI improvements and is connected to a Node 24 HTTP API with persistent SQLite, synthetic server-derived account sessions, scoped projections and transactional commands. Supabase Cloud is provisioned but unconnected; no application tables existed at its last inspection and no Supabase RLS is claimed. Read [BUILD_STATUS](../docs/BUILD_STATUS.md) and [handoff](../docs/CONTEXT_HANDOFF.md) for exact checks and remaining browser QA. No public production publication, real NGO integration or deployment of the unfinished Sites fallback is claimed.

## 2. Continuing the imported application locally

1. Read local context/status and the [import manifest](../output/lovable-source-manifest.json). The import is complete; do not restart generation or create another project. Local changes are not claimed to be synced back to Lovable.
2. Preserve the actual generated framework, platform entry configuration, routes and `bun.lock`. Keep the added local npm lockfile. The module tree in [FILE_STRUCTURE](../docs/FILE_STRUCTURE.md) is a responsibility map to adapt, not a replacement scaffold. Do not substitute the unfinished Vinext fallback.
3. Run `npm run dev:local` from `asha-saath-lovable/` using Node 24. It starts Vite 5173 and SQLite API 4318. Use the actual package scripts and visible local screens to complete remaining QA. Record the imported revision and subsequent local changes separately.
4. SQLite is authoritative: `backend/server.mjs`, `policy.mjs`, `domain.ts` and `schema.sql` enforce current identity/commands/transactions. Frontend `cmd` calls the HTTP adapter. Keep database/WAL/session files and server-only credentials out of bundles, screenshots, prompts and source packages. Do not claim Supabase integration because generated client files or a provisioned remote database exist.
5. Read remote project knowledge if source interpretation requires it. The initial build request included relevant document and fixture content inline; local files are not automatically visible to Lovable. For any later remote attachments, use returned file IDs. Project knowledge already exists, and setting it replaces the entire field with a maximum of 10,000 characters.
6. Remote build messages remain evidence only when their actual `response.status`, source and checks are inspected. Top-level user-message status, scaffold `creation_status=completed`, a screenshot or provisioned database alone do not establish application completion. A prepared request is not proof that its changes were applied.
7. Handle any connector tool approval/secure form under the exact tool/editor requirements. A pending human tool decision cannot be answered by an ordinary continuation message; never collect credentials in chat. Local reversible implementation follows the user's current authorization without adding generic approval steps.
8. Run checks appropriate to changes and review desktop/mobile states locally. The current local milestone passed 22 Vitest checks, eight actual HTTP/SQLite checks and a full browser referral/confirmation/closure/reload journey; responsive Hindi/English evidence is recorded. These results are scoped, and the full acceptance catalogue is not claimed passed. Fixed open demo accounts are not production identity verification. Record source revision, actual results, launch command and unresolved issues in [BUILD_STATUS](../docs/BUILD_STATUS.md) and the handoff.

Do not publish, create shared skills or change global workspace knowledge merely as a consequence of preparing local files.

## 3. Other tools

| Capability | Useful purpose | Current status |
|---|---|---|
| Web browsing + public browser captures | Official current design/tech sources and screenshots | Used for read-only reference research; current app interaction uses the available browser-control surface |
| Plugin Management | Discover/resolve a necessary missing capability | Skill applied; no plugin installed |
| Skill Creator | Create focused portable project recipes | Used for four local skills |
| Figma | Optional reviewed design file/components/prototype | No project file created; verify current tool/access availability before use |
| Canva | Optional mentor pitch graphics/deck | Unused; verify current access before use |
| Tavily | Optional further research | Earlier quota failures; verify current access and capacity |
| Git sync | Portable generated code/history | No synced Git repository claimed; an exported source snapshot is distinct from Git synchronization |
| Sites | Fallback hosting during the connector gap | Registered privately, unfinished and unpublished; not the primary application |

Lovable does not import this existing repository as a new project. The source project has already been created using supplied context. The generated source has been transferred into the local workspace; reviewed specs remain alongside it. Do not confuse a partial verification snapshot with the complete app or a source export with Git synchronization. [Current FAQ](https://docs.lovable.dev/introduction/faq).

## 4. Skills versus knowledge

[Lovable knowledge](https://docs.lovable.dev/features/knowledge) is persistent context; [workspace skills](https://docs.lovable.dev/features/skills) are task-specific reusable instructions. ASHA-specific knowledge belongs to the project. Workspace skills affect multiple projects, so a local ready file is not the same as an installed skill.

If importing a local skill later, include its dependent documents and verify relative references. Register reviewed skills intentionally; do not automatically make unrelated workspace projects obey this hackathon's rules.
