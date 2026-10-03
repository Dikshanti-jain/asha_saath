# Demo cues, rehearsal and judge questions

Prepared 9 October 2026. Use [five-minute script](01-FIVE_MINUTE_PITCH_HINGLISH.md) for the speech; this is the optional live demonstration and question bank.

## Three-screen cue plan for the five-minute speech

| Script moment | Show | Say one thing |
|---|---|---|
| 1:10, scheduling | Daily visit plan and route map | “Priority and deadline come before distance; this excluded visit keeps its reason.” |
| 2:05, NGO journey | Selected help request and current next action | “Actual catchment, current capacity and permission naming this NGO.” |
| 3:25, accountability | Help confirmation or saved cash-request stages | “An NGO report needs the person's separate confirmation; cash records do not transfer money.” |

Have screens ready before speaking. Do not spend five minutes switching six accounts and clicking every transition. Keep the full flow for a separate demonstration if judges allow it.

## Fresh isolated rehearsal

Use the normal app at http://127.0.0.1:5173 for the existing persistent demonstration. It already contains earlier saved/closed cases. Do not reset someone else's work immediately before presenting.

For a fresh isolated rehearsal, from `asha-saath-lovable/` with Node 24:

```powershell
npm run build:node
$env:ASHA_PUBLIC_ORIGIN='http://localhost:5180'
$env:ASHA_DB_PATH=':memory:'
$env:ASHA_BIND_HOST='127.0.0.1'
$env:ASHA_SSR_PORT='4320'
$env:PORT='5180'
npm start
```

Use **http://localhost:5180** consistently. Its hostname keeps this rehearsal's session cookie separate from the working `127.0.0.1:5173` app. The database is disposable memory; Ctrl+C ends it, and the next startup creates a fresh fictional dataset. Keep these environment overrides in the rehearsal terminal; use a fresh terminal for normal persistent development afterward. Do not present in-memory reload retention as restart persistence.

## Optional full journey — allow a separate 5–8 minutes

1. Coordinator account → Daily visit plan → rural ASHA, frozen date 8 October 2026 → Create → review priorities/order/unserved reasons → Save.
2. Rural ASHA account → all planned visits → Visit 004/Village B → completed → request document/scheme help → save short need.
3. Coordinator → request → choose Outreach A (Village B catchment; available initial slots). Explain why an office locality does not determine service coverage.
4. ASHA → help request → show specific recipient and exact fields → person's fictional permission checkbox → Record permission.
5. Coordinator → send to Outreach A.
6. NGO A → accept → accepted work → permitted method and agreed date/from/until → save arrangement → report help delivered.
7. ASHA → ask the person → Received as described.
8. Coordinator → Close confirmed request → reload; completed state remains in the running database.

All people, localities and offers are fictional. Initial capacity depends on the fresh dataset; do not claim two free slots in an already used persistent instance. If a real API/network failure occurs, show the last reviewed screen/evidence and say the live demo is interrupted; do not narrate a failed action as completed.

## Alternative cash and communication demonstration

Use the existing synthetic help need after steps 1–2 above. Choose this journey or the document-referral journey if time is limited; doing both needs extra time. Rehearse the actual session rather than promise a fixed click duration.

1. ASHA/coordinator → **Cash assistance** → select the help request and an NGO covering its locality → travel support, ₹500 and a short fictional reason.
2. Explain the named NGO and funding fields; record the person's separate fictional permission → send the request. Document-referral permission does not authorize this cash request.
3. **Open this case's messages** → save a short service question. NGO A → its case conversation → unread/read status → reply. This is persisted in-app case discussion, not WhatsApp or outreach to a real NGO.
4. NGO A → **Cash assistance** → approve ₹500 with a decision note. Point to the budget amount now reserved. Use actual available budget; seeded totals are fictional.
5. NGO A → save a fictional **Demo payment reference** and assistance note. State clearly that this records an external-payment claim and transfers no money.
6. ASHA → record the amount the fictional person reports receiving, an independent note and the person-check checkbox. Equal ₹500 becomes received; unequal amounts become disputed.
7. Coordinator → close the received request → reload and show the saved status. Approval and payment reports alone cannot close it.

If showing withdrawal instead, use a different disposable request. It revokes the NGO's access; a reported payment requires restricted reconciliation before its held balance can be released. Do not turn a completed demo into a withdrawal example without explaining the different state.

## Mentor Q&A — short answers to rehearse

| Question | Grounded answer |
|---|---|
| Why this problem? | ASHA is already a community-to-public-service bridge. We are addressing the concrete operational connection between feasible visits and locally fulfilled nonclinical support. Official data establishes scale; the local workflow still needs field validation. |
| Why another app? | Existing case management and referral tools exist. Our prototype connects approved-priority planning, unserved reasons and named-recipient support in one journey. A pilot must test integration and extra workload; it has not established a need to replace existing systems. |
| What is the innovation? | Deadline/priority before proximity; service catchment and fresh capacity; and reported → independently confirmed → closed as separate steps. The cash demo also reserves an NGO budget and keeps approval, payment claim and recipient amount distinct. The combination is demonstrated, not claimed as a world-first invention. |
| Where is AI? | Current scheduling is deterministic and explainable. Authorized people/rules supply clinical priorities. No AI diagnosis or autonomous agent has been implemented. Future language assistance can be reviewed separately; it should not invent eligibility or priority. |
| How will you connect real NGOs? | Verify the organization and its actual delivery branch, agree a service/catchment/capacity and response targets, test a referral, then activate. Darpan is a discovery/identity reference, not an endorsement or appointment guarantee. |
| Who follows up? | A funded, named coordinator with a backup owns provider follow-up and failures. ASHA captures the short need and permission. Software cannot substitute for operational staff. |
| What if no NGO accepts? | The need stays unresolved with a reason, owner and next action. Coordinator considers other eligible services; a new recipient requires appropriate consent. We don't turn a search result into promised help. |
| Does funding work today? | The synthetic coordination flow works: request with separate permission, own-NGO budget approval/reservation, fictional payment reference, person's amount confirmation, disputes and coordinator closure. No money is transferred, donations held or real NGO funds verified. Actual grants and payments need participating organizations and separate integration. |
| Can ASHA and NGO communicate? | Yes, inside a currently authorized referral/funding case. Messages and read receipts are saved with server identity. A read receipt is not action taken. Case revocation removes the NGO's access; there is no SMS/email/WhatsApp integration or public cold-message inbox. |
| What exactly does the NGO see? | Its currently authorized case. Document referrals expose reference, category, fictional locality and preferred mode/time. A separately consented cash case exposes purpose, amount, nonclinical reason and payment/receipt reports plus that case's messages. Raw caseload, clinical details, contact information, staff IDs and task coordinates are excluded. |
| What if consent is withdrawn? | The server revokes provider access and blocks later actions. Already viewed information cannot be unseen; a live partner requires an approved handling/retention agreement. |
| Can the NGO fake delivery? | A delivery report alone cannot close the need. Person/assisted worker confirmation and coordinator closure are separate. A real pilot still needs an appropriate verification and dispute process; software does not eliminate collusion by itself. |
| What if two people accept the last slot or budget? | The server checks and reserves within a database transaction. Concurrent last-slot acceptance and the independent audit's last-budget approval race are covered. Actual external service/funds availability still depends on a participating provider and verification. |
| Is it offline? | Not yet. Current acceptance requires the online server. Offline queues/sync are later scope; no false offline claim. |
| Is the map actual road navigation? | No. It uses fictional sample points and saved order. Dashed lines aren't road routes or GPS tracking. Field travel/geography validation is part of a real pilot. |
| Does it diagnose or handle emergencies? | No diagnosis. Urgent clinical escalation remains in the approved health-team pathway, independent of NGO response. |
| What is working today? | Actual local Node/SQLite app; CSV/planning; outcomes; permission; transactional referral acceptance; arrangement and independent confirmation/closure; maps; synthetic cash budget/request/receipt/reconciliation; scoped messages/read receipts. 31/31 frontend/domain tests, 15/15 HTTP/SQLite tests and 8/8 separate audit checks passed. Public hosting is still pending. |
| What impact did you achieve? | We have demonstrated software behaviour, not measured household impact. We will measure eligible due completion, locality equity, unresolved age, confirmation, workload and cost in a defined pilot. |
| How do you scale? | One catchment first, real branch offers and an accountable coordinator. After usability/pilot evidence, repeat local operations and report approved aggregates. A national directory count is not national fulfilment capacity. |
| Who pays? | Proposed domestic programme sponsor/operating-partner grant for coordination, training and support; NGO services through agreed budgets. Future organizational subscription/programme contract is a hypothesis, with no funding commitment or validated pricing today. |
| What is your ask? | A participating PHC catchment, two ASHAs, a funded coordinator, two-three local branches, mentor support for field workflow and an approved synthetic-to-live pilot plan. |

## Avoid these substitutions

- 24 tasks ≠ 24 unique patients. The fixtures contain 23 fictional person references.
- Three demo offers ≠ three real partnerships.
- NGO acceptance ≠ help received.
- Document guidance ≠ application approved or money disbursed.
- Cash approval ≠ payment claim ≠ person receipt. A demo payment reference ≠ actual transfer.
- Message read ≠ follow-up completed or assistance delivered.
- Planned/forecast visit ≠ completed visit.
- Prototype role selection ≠ verified production login.
- Passing software checks ≠ field trials or health impact. Keep the 31/15/8 suites distinct.
- Government-style UI ≠ government ownership/endorsement.

## Two backup answers

**If a judge asks for proven savings:** “Abhi woh claim nahi karenge. Modelled travel aur observed travel alag hain. Pilot mein comparable workdays aur priority/locality breakdown ke saath measure karenge.”

**If a judge asks why this can make a difference:** “Because each handoff now has an owner and a check: a visit must fit; an NGO must serve the area; acceptance must reserve capacity; a person must confirm help. The prototype proves those checks can work together. The pilot tests whether they improve actual operations.”
