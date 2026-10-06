# UI/UX specification and screen contracts

Version 1.4 · 9 October 2026. Use with [design system](DESIGN_SYSTEM.md), [PRD](PRD.md) and [state machines](STATE_MACHINES.md). [Current UI review](UI_REVIEW_2026-10-09.md) records the implemented revision and actual screen checks; planned contracts below are not blanket completion claims.

## 1. Information architecture

| Role | Navigation | Default screen |
|---|---|---|
| Demo visitor | About, Try demo, Help, Privacy, Accessibility | Overview |
| Worker | Today's visits, Help requests, Help | Next visit, large record action, route-map toggle |
| Coordinator | Overview, Visit register, Daily visit plan, Maps & coverage, Help requests, NGO partners, Reports | Daily work overview |
| Provider intake | New requests, Accepted work, Service capacity, Help | Offered requests |

State/national live discovery remains future scope. The user's 9 October extension adds working synthetic Cash assistance and NGO messages screens for each role, as defined in [funding and communication](FUNDING_AND_COMMUNICATION.md). Do not place dead buttons or claim real payments/partners. Worker mobile navigation offers Today, Needs, Funding and Messages; the compact utility bar retains Help.

The implemented account control says “Switch demo account” and creates a local server session for a fixed fictional account. Every request is checked against server-derived membership and referral scope. Accounts are openly selectable for the synthetic demo and do not verify a real staff identity. Switching accounts clears the old client projection. Protected routes show a loading state while session/state hydration is pending.

On phones, the worker's next stop and visit button precede plan details; bottom navigation remains visible. Coordinator work queues collapse behind a labelled control. Support requests use readable cards on small screens and a table on desktop. Each request shows its current owner and next action. A provider's acceptance moves directly to Accepted work; arrangement methods must match the actual offer mode.

Changing the selected request, named recipient or consent grant remounts the permission form with an unchecked checkbox. Permission for one recipient cannot be carried into another request by UI state. The server independently invalidates superseded grants. After permission is recorded, the coordinator screen says so and offers the named recipient; it must not also say permission is pending.

## 2. Reusable layout wireframes

### Coordinator desktop

```text
[Skip link | Hackathon prototype             Hindi/English | Help]
[ASHA Saath / original mark             Coordinator / signed identity]
[Overview | Visit register | Daily plan | Maps | Help requests | NGOs | Reports]
[Breadcrumb]
[Page title + short purpose]                          [Primary action]
[Fictional district | Demonstration date]
[Metric: due] [planned] [completed] [excluded by saved plans]
[Separate health-team queue]
[Visit register | Prepare plan | Follow up requests]
[ASHA plan register / request queue] [NGO availability]
[Ownership | Privacy | Accessibility | Sources/help]
```

### Worker mobile

```text
[काल्पनिक डेमो                       हिन्दी | Text size]
[ASHA Saath                         Account menu]
[आज के दौरे | date]
[Next stop: task ID, locality, due reason]
[Expected arrival | visit minutes]
[दौरा दर्ज करें]
[View route map]
[Planned / Remaining / Due not planned]
[View all planned visits — expandable]
[नहीं हो पाए दौरे — count + reasons]
[आज]                 [सहायता]              [मदद]
```

The route list works without tiles/GPS. The implemented interactive map uses existing synthetic coordinates, numbered stop order, a dashed illustrative line, visible OSM attribution and zoom/pan. Leaflet loads after browser mount only. The separate NGO service-area view uses offer catchments and fictional locality centres, never invented office points or service polygons. It never shows real patient homes or claims road routing/live GPS. On worker mobile, the map toggle follows the next visit; detailed assumptions follow the visit list.

## 3. Screen inventory

### UX-01 — overview / demo entry

**Purpose:** explain the two connected workflows in one glance.

Content: one sentence about visit planning and accountable help, three role cards with clear role actions and three short steps, short scope/status statement and sources/help. Avoid giant fundraising claims or decorative AI hero.

Primary action signs in to the selected fictional role. Existing records are retained; the server seeds an empty database only. Success redirects to the role; failures show a retry. Coordinator reset is inside demo controls, asks for confirmation and resets the shared fictional database, not just the current browser session.

### UX-02 — caseload import

**Coordinator desktop.** Steps: select CSV → mapping/preview → validation → commit.

Required sections: file name/size/source dataset; mapped columns; valid/review/error/excluded counts; row table with errors; repeated-import comparison. Example text: “Task ID stays the same when this file is imported again.”

No matching by name alone. Unknown coordinate/rule/priority fields show a review queue. “Commit 24 approved rows” states the count. Mixed files do not silently create partial duplicate datasets.

States: no file; parsing; invalid format; conflicting task update; valid preview; commit running; commit complete; network failure. Import spinner cannot erase the preview.

### UX-03 — plan setup and preview

**Coordinator.** Worker/date/shift/start-end point/mode/speed/break/buffer fields are editable. Show synthetic assumptions next to travel estimates.

Output: planned count by priority, modeled travel/visit/wait/return time, locality group summary, ordered list/schematic and unserved reasons. A plan version and rule snapshot are visible.

Primary actions: Generate plan, Save plan. “Save” is disabled while input review/contradiction is unresolved. The preview must fit the declared shift, including return travel.

If no feasible tasks, show constraints and unserved reasons—not an empty map. For urgent tasks show separate clinical escalation required count and configured action, not “covered.”

### UX-04 — today's plan

**Worker mobile.** First viewport: date/staff/locality context, last-sync, due/planned/remaining, next stop card, Record visit.

Each stop has synthetic task ID, location confidence/locality, approved priority label, “why this visit” disclosure, window, estimated arrival, travel and duration. Care instructions/risk classification are supplied from approved rules; no AI diagnosis.

Secondary list shows later stops. Unserved section always accessible and counted. If plan is outdated, show version mismatch and refresh; do not reassign completed visits.

Offline: downloaded list accessible; “Saved on phone, not yet synced” for queued changes. Accept/offer/capacity actions are absent from worker offline cards.

### UX-05 — record visit

Task summary → outcome choice: Completed, Household unavailable, Deferred with reason, Clinical escalation required → time/short structured note → save.

Completed means an authorized visit was recorded. It does not claim recovery or programme benefit. If unavailable/deferred, return to Today with a replan suggestion and visible unresolved task.

Use short controlled notes; no open request to type diagnoses, Aadhaar or identifiers. Clinical escalation routes to locally approved instructions; demo shows a synthetic configuration and records acknowledgement, without a fabricated emergency number.

After completed visit: optional **“Document help needed?”**. Skip does not block visit completion.

### UX-06 — support need and consent

Three short sections:

1. Need: document-navigation category, locality and preferred help mode/time. No diagnostic detail.
2. Public pathway: source-linked checklist, “Potentially applicable; authority confirms eligibility.” Assistance does not issue documents or benefits.
3. Permission: purpose, named intended provider where known, fields to share and withdrawal. Default unchecked. Distinguish consent to record a draft from consent to share with the selected provider.

Hindi copy: “इस सहायता अनुरोध के लिए क्या आप चुनी गई संस्था को नीचे दी गई जानकारी भेजने की अनुमति देते हैं?” List the actual fields; do not hide them behind a generic privacy link.

A person declining receives an alternative public-pathway/help option; no referral is sent. Offline capture remains pending synchronization. Consent to another provider is refreshed if the intended recipient or purpose changes.

### UX-07 — eligible service offers

**Coordinator.** Need context, public pathway, consent summary, catchment and category filters. Cards show fictional provider label, branch, service, rural/urban catchment, mode, eligibility status, verification timestamp, capacity and freshness/expiry.

Separate **Eligible now**, **Needs review** and **Excluded**, with reasons. Office address is not catchment. “Capacity last confirmed…” is always shown.

Selected offer view previews the minimal data to share and valid consent. Primary action: Offer to this provider. No “Book now” on a stale listing.

No match: coordinator owner, reason, next action/date, public option and refresh/assisted follow-up. Do not show success toast for zero providers.

### UX-08 — provider offered requests

**Provider intake desktop/mobile.** Only that organization's authorized requests. Table/cards: request reference, category, permitted locality/help preference, expiry, required units and current capacity. Clinical CSV/worker caseload are never included.

Actions: Accept; Decline with structured reason. Accept rechecks capacity online. Last slot conflict shows “Capacity changed; this request was not accepted” and refresh.

Expired/withdrawn request has no active actions. Authentication failure returns to sign-in and does not leak prior data in the page shell.

### UX-09 — accepted service and delivery

**Provider.** Timeline: Offered → Accepted → Arranged → Delivery reported → Confirmed → Closed. Current next action clearly named.

Arrangement: agreed method, date/window and coordinator contact relay. Avoid exposing personal numbers in demo; later safe-contact fields are policy-scoped.

Report delivered: structured help provided / when / document-checklist outcome; no sensitive attachments. Copy: “Your report is awaiting confirmation.”

A provider cannot press Close case or forge person confirmation. Missed arrangement/dispute is routed to coordinator.

### UX-10 — need detail, confirmation and recovery

**Worker/coordinator appropriate projections.** Main panel: status, owner, next action/deadline; timeline with actor/time; minimal sharing summary; active provider; withdrawal action.

Worker records person's confirmation: Received as described / Partly received / Not received / Could not confirm. Only positive validated confirmation moves to CONFIRMED. Others become unresolved/disputed with reason.

Coordinator closes only confirmed service-specific need. Closure summary says document-help received, not scheme approved.

Decline/expiry view: reason, remaining eligible offers and permitted next offer action. Require valid consent for a changed recipient. Withdrawal ends access and shows the limitation that already shared information cannot be “unseen”; further processing follows partner policy.

### UX-11 — coordinator operational overview

Top metrics: due tasks, planned/visited/unserved, escalation/review, support needs awaiting response/confirmation/recovery. Every number links to its cohort/filter.

Primary queue columns: case reference, locality, reason/status, age, owner, next action, deadline. Default shows items needing action, not a celebratory dashboard.

Separate clinical escalation/review and nonclinical NGO support queues. Donor/funding totals do not influence scheduling.

### UX-12 — service network and capacity

**Coordinator/provider scoped.** Organization → branch → service offer structure. Filter by state/district/area type; demo entries remain fictional.

Verification fields: registration reference status, service evidence, catchment, contact verification date and reviewing coordinator. No single “government verified NGO” badge.

Capacity editor: service window, total units, freshness validity, operating hours and accessibility. Reserved/committed units read-only from transactions. A reduction cannot go below held/consumed units; errors name the conflict.

Broad national search is discovery. Only participating verified local offers can receive a request.

### UX-13 — coverage/reporting

**Coordinator aggregate.** Selected worker/date/cohort, same-input baseline comparison, modeled travel, priority coverage and every unserved reason. Coverage forecast label: “Planning projection — visits not completed.”

Support funnel counts unique needs separately from attempt counts; retry attempts do not inflate people helped.

State/national later view uses permitted coarse aggregates with disclosure thresholds. No household map or public diagnoses.

### UX-14 — help, privacy and accessibility

Explain prototype status, approved role limits, data shown/shared, how consent withdrawal works and who owns next action. Present the actual configured support contact or say it is not configured. A decorative screen-reader widget is not required.

Use source dates/links for programme cards and a maintained accessibility statement listing tested capabilities/known limitations.

## 4. Global exceptional states

| State | User sees | Recovery |
|---|---|---|
| Loading | Labelled skeleton/progress, preserved context | Cancel/retry where appropriate |
| Empty | Why there is no data and next useful action | Import/load demo/filter reset |
| Offline | Last sync + queue count + online-only limits | Save draft; retry after connection |
| Stale capacity | Age/valid-until and no acceptance guarantee | Refresh or coordinator review |
| Version conflict | Current state changed; local entry retained | Reload/resolve, no silent overwrite |
| Session expired | Sign-in required; no private details | Reauthenticate, then guarded replay |
| Permission denied | Clear access message, no leaked fields | Return to role home |
| Urgent clinical | Approved escalation instruction and separate status | Health-team handoff, not NGO waiting |
| No eligible provider | Unresolved reason + coordinator | Assisted alternative/updated offer |
| Withdrawal/dispute | Explicit status and available permitted actions | Coordinator-only recovery/reconciliation |

## 5. Bilingual content examples

| Key | Hindi | English |
|---|---|---|
| today.title | आज के दौरे | Today's visits |
| plan.generate | दौरा योजना बनाएं | Generate visit plan |
| visit.record | दौरा दर्ज करें | Record visit |
| task.unserved | आज नहीं हो पाए दौरे | Unserved today |
| support.request | दस्तावेज़ सहायता मांगें | Request document help |
| consent.withdraw | साझा करने की अनुमति वापस लें | Withdraw sharing permission |
| provider.accept | अनुरोध स्वीकार करें | Accept request |
| provider.delivered | सहायता देने की सूचना दर्ज करें | Report help delivered |
| receipt.confirm | सहायता मिलने की पुष्टि करें | Confirm help received |
| network.stale | उपलब्धता दोबारा जांचें | Recheck availability |
| sync.pending | सेव हो गया; सिंक बाकी है | Saved; sync pending |

Translations are design drafts. Validate vocabulary with Hindi-speaking ASHAs. Keep programme names with their standard spelling and a short explanation; do not translate legal consent text without review for a pilot.

## 6. UI acceptance

Core paths must work at 1440 desktop, 768 tablet and 390/320 mobile; 200% text resize; keyboard-only; reduced motion; slow/loading/offline; Hindi labels; long locality names; empty/error/unresolved states. Screenshots of the happy path alone are insufficient.
