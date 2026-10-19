# ASHA Saath — working local prototype

This is the primary local application. It imports the Lovable-generated TanStack Start frontend at commit `b4e03681e52dbba19f0a6b20f7f4d61bf678019e` and adds government-style UI improvements plus an actual Node HTTP/SQLite backend. [Import manifest](../output/lovable-source-manifest.json) records 115 listed files, 113 text files downloaded. Local edits are separate from the remote revision and are not claimed to sync back to Lovable.

## Run locally

Use Node 24 (checks used 24.13 and 24.19) and npm. From this directory:

```powershell
npm install
npm run dev:local
```

Dependencies are already installed in the current workspace. A fresh source download needs `npm install`. Open [http://127.0.0.1:5173](http://127.0.0.1:5173). The launcher starts Vite on 5173 and the API on 4318; stop both with Ctrl+C. `npm run dev` starts only Vite, so it does not provide the working database API by itself.

Backend health: [http://127.0.0.1:4318/api/health](http://127.0.0.1:4318/api/health). The Vite development proxy forwards `/api` to this local backend. API details are in [backend/README.md](backend/README.md).

Choose a fictional coordinator, assigned ASHA or provider account through the account control. This explicitly creates a server-derived session. Everyone trying the demo may choose these accounts: they are not password/OTP-protected real staff identities. Request role labels do not authorize commands. The server scopes each session's reads and actions.

## What the prototype does

- Imports/validates synthetic CSV tasks with immutable dataset/task identities; two tasks for one person stay distinct.
- Generates/saves feasible daily visit plans, declares synthetic geography/travel assumptions, explains unserved dispositions and projects coverage without moving task due dates.
- Records assigned routine visit outcomes and document-navigation needs, with separate clinical escalation/joint-work queues.
- Supports named-recipient consent, sequential fictional provider offers, acceptance/capacity reservation, arrangements, delivery reports, independent confirmation, closure and withdrawal/recovery states.
- Uses a formal original government-style shell, Hindi/English draft copy, worker navigation, account/server states and source/privacy/help screens.
- Provides interactive visit-route and NGO catchment maps with numbered stop selection, zoom/pan and textual fallback. Coordinates are fictional; dashed lines show order, not road directions or live GPS.
- Coordinates fictional cash help for document-service costs, travel and other nonclinical service-access costs: request → NGO decision/budget reservation → external assistance report → independent receipt confirmation or dispute → coordinator closure.
- Requires fresh recipient-specific funding permission and exact service catchment. Shows server-derived available/reserved/used budget totals, restricted reconciliation and auditable history; withdrawal immediately revokes NGO access.
- Saves case-specific in-app messages for the assigned ASHA, coordinator and named NGO, with read/unread controls. A message cannot itself approve a request, send money or close a case. No WhatsApp, SMS or email connection is present.

**Latest 9 October support revision:** the user chose the demo funding flow first. Cash and messages pages are available under all three role workspaces; amounts/budgets and participants are fictional. Final source checks after consent/timestamp fixes at 05:31:53 IST passed TypeScript, 31/31 Vitest tests in seven files and the Node production build. The HTTP/SQLite suite passed 15/15; the [independent support audit passed 8/8](../output/verification/ngo-support-independent-2026-10-09/audit-results.json). Four new UI boundary regressions are included in the full frontend suite. Read [funding and communication](../docs/FUNDING_AND_COMMUNICATION.md) and the [support review](../docs/NGO_SUPPORT_REVIEW_2026-10-09.md); direct funding/messages browser review was pending at this documentation checkpoint.

**Earlier 9 October UI revision:** compact bilingual masthead, single navigation, task-first role screens, guided import, visible worker map action and simpler help-request steps. Its 25/25 Vitest and 9/9 HTTP counts are historical. See [UI/maps evidence](../docs/UI_REVIEW_2026-10-09.md). Render/Railway files are prepared; [deployment](DEPLOYMENT.md) is still pending.

The local import/UI/backend objective is complete. Browser checks followed REQ-005 through named-recipient permission, offer, provider acceptance/reservation, valid arrangement, delivery report, person confirmation and coordinator closure; reload preserved the closed case. The 390 English and 320 Hindi worker screens were inspected, including 1.25 Hindi text size. See [BUILD_VERIFICATION.md](BUILD_VERIFICATION.md) for actual test results and limits; the full acceptance catalogue is not claimed passed.

Scheduling policy `priority-due-deferral-window-locality-v2` gives approved priority, earlier due date, greater deferral and earlier latest window precedence over geography. The two earlier fairness failures are fixed and all nine required property checks pass. Consent choices reset when the request or named recipient changes; the two UI regression tests pass.

## Actual database and security boundary

The persistent database is `backend/data/asha-saath.sqlite`. SQLite/WAL/session data is ignored and must stay out of commits and source ZIPs. Records survive API restarts; coordinator demo reset restores the synthetic fixture state. The browser stores language/text preferences; saved plans, visits, needs, consents, referrals, capacity, funding records/budgets and case messages come from the server.

The backend uses opaque HttpOnly/SameSite sessions, server-side membership/ownership/recipient checks, scoped provider projections, `private, no-store` responses, transaction-guarded capacity/referral commands and idempotency/version handling. `BEGIN IMMEDIATE` serializes writes, with identity/active-attempt/allocation constraints. This is a scoped local synthetic backend, not a production identity/security certification.

`ASHA_DB_PATH` can select another SQLite file and `ASHA_API_PORT` can change the API port. If the port changes, update the matching Vite proxy too. The provisioned Lovable/Supabase database is **unconnected**; its generated integration files do not constitute an active connection or RLS implementation.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev:local` | Start frontend and backend together |
| `npm run backend` | Start only the persistent API |
| `npm run typecheck` | TypeScript check |
| `npm test` | Local Vitest suite |
| `npm run test:backend` | Actual HTTP/session/database integration suite |
| `npm run build` | Generated frontend client/SSR build |
| `npm run build:node` | Build the Node deployment target |
| `npm start` | Start the built frontend and SQLite API through one gateway; requires deployment variables |

The generated `bun.lock`, TanStack entries/configuration and route generator are retained. A local npm `package-lock.json` was added during dependency installation. Build output targets the generated frontend platform; it does not deploy the Node SQLite service. A production launch needs its own reviewed runtime/proxy/TLS/identity/data arrangement. `npm run preview` alone is not a complete backend deployment.

## Context and remaining work

Read [PROJECT_CONTEXT](../PROJECT_CONTEXT.md), [handoff](../docs/CONTEXT_HANDOFF.md), [BUILD_STATUS](../docs/BUILD_STATUS.md) and local [AGENTS](AGENTS.md). UI lives in `src/components/AppShell.tsx`, `SessionPanel.tsx`, role routes and `src/styles.css`; HTTP adapter in `src/lib/demo/store.ts`; backend policy/transactions in `backend/`.

Use fictional data only. No clinical rule approval, live government/NGO integration, payment custody, real partner network, verified production identity or offline synchronization exists. The separate `../asha-saath-app/` folder is an unfinished unpublished Vinext fallback.

The [website source ZIP](../output/asha-saath-website-source.zip) exists and was CRC/hash-checked. Its clean extracted backend regenerated runtime and initialized all 24 synthetic tasks without bundled dependencies/runtime/database. The [packaging report](../output/website-source-packaging.json) identifies its exact bytes; packaging is refreshed after final edits. Do not include SQLite/session data, credentials, dependencies or generated build artifacts.
