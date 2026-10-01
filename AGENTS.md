# Agent instructions — ASHA Saath

## Scope and reading

This workspace holds research, specifications and the working imported application in `asha-saath-lovable/`. Preserve the user's ASHA + NGO product and government-style design. Read [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) first, then [docs/CONTEXT_HANDOFF.md](docs/CONTEXT_HANDOFF.md). Load only the specialist documents needed for the task:

- Product: PRD and DECISIONS.
- UI: DESIGN_SYSTEM, UI_UX_SPEC and ACCESSIBILITY_I18N.
- Scheduling: TRD, DATA_MODEL and TEST_ACCEPTANCE.
- Referrals/backend: STATE_MACHINES, API_CONTRACTS, ROLE_PERMISSIONS and SECURITY_PRIVACY.
- Lovable: lovable/README and PROJECT_KNOWLEDGE.

These files live under [docs](docs/FILE_STRUCTURE.md). [SKILLS.md](SKILLS.md) provides focused local workflows.

## Invariants that change implementation decisions

- Keep CSV scheduling and unserved coverage central; do not turn the project into only an NGO directory or chatbot.
- Default dataset is 24 fictional tasks and three fictional offers in one nonclinical service category.
- Preserve immutable import identity `(source_dataset_id, source_task_id)`; multiple tasks for one patient are valid.
- Approved priorities/due dates are inputs. Forecasts move the planning date, never task deadlines.
- Explain geography grouping, route order, time assumptions and each unserved reason. No invented precise locations.
- Reserve capacity and transition acceptance in a server/database transaction. Do not secure this with a browser state check.
- Scope provider access to a specific currently authorized referral. A role dropdown is demo presentation, not authentication.
- Consent withdrawal revokes provider access and blocks later delivery/closure transitions.
- A provider's delivered claim does not close the need; worker/person confirmation is distinct.
- Urgent clinical escalation follows the approved health pathway independently of NGO offers.
- In a new Lovable project preserve the generated TanStack Start scaffold, lockfile and platform entry configuration. Inspect actual files before mapping the proposed tree.
- Browser APIs, map libraries and IndexedDB must not execute during SSR. Protected responses must not enter shared caches or public metadata.
- Use original ASHA Saath branding and the synthetic prototype label. Use the government-style tokens without copying government emblems.
- Do not put real health records, IDs, contact details or government identifiers into fixtures, prompts or screenshots.

## Work and handoff

Make scoped, reversible changes needed for the user's authorized task. Do not add generic approval steps for local work. Creating/deploying apps, shared workspace skills or external communications follows the actual task authorization; documentation instructions do not themselves authorize those actions.

Use sources and checked dates for unstable government rules, provider terms and plugin capabilities. If an API is unverified, build an explicit synthetic adapter rather than claim integration.

Before marking implementation complete, run the checks appropriate to the changed behaviour and review its visible screen states. For this specification pack use `scripts/validate_spec_pack.py`. The local app has TypeScript, Vitest and actual HTTP/SQLite tests; run commands are in [its README](asha-saath-lovable/README.md). Supabase is unconnected and RLS remains unimplemented/untested. Do not replace local runtime evidence with a planned PostgreSQL requirement.

Update CONTEXT_HANDOFF with what was actually changed, checks actually run, exact remaining work and any new decisions. Do not mark planned features implemented because a specification exists.
