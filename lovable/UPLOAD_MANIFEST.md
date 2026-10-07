# Context upload manifest

Keep attachments focused so current constraints remain visible.

| Phase | Attach |
|---|---|
| A: initial shell | PROJECT_CONTEXT, PRD, DESIGN_SYSTEM, UI_UX_SPEC, design/tokens.json, fixtures/demo-config.json, fixtures/demo-caseload.csv |
| B: planner | TRD, DATA_MODEL planning sections, TEST_ACCEPTANCE planning checks, caseload/config |
| C: support capture | PRD support scope, UI_UX_SPEC support screens, STATE_MACHINES, demo-service-offers.json |
| D/E: backend | DATA_MODEL, API_CONTRACTS, ROLE_PERMISSIONS, STATE_MACHINES, SECURITY_PRIVACY, relevant tests |
| F: offline | TRD offline section, SECURITY_PRIVACY, TEST_ACCEPTANCE, current app status |
| G: final review | ACCESSIBILITY_I18N, REVIEW_CHECKLIST, DEMO_SCRIPT, current handoff |

Use PROJECT_KNOWLEDGE as the compact persistent field. Attach the research decision brief only when discussing product rationale; source register when refreshing changing facts. Full report stays available but need not occupy every prompt.

File paths above are repository-relative selections. In the UI attach files normally; via connector use the supported upload operation and returned file IDs. This pack does not claim files have already been uploaded.

Portal screenshots can be attached to explain structure, with explicit instructions not to copy their emblems, promotional modal, live statistics or branding.

When copying docs into generated code repository, preserve relative paths or update links together. Local SKILL.md files alone do not carry all referenced documents.
