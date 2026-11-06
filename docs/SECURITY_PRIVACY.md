# Security, privacy and deployment boundaries

Version 1.0 · Synthetic demonstration design; not a production/legal certification.

## 1. Current build data

Only invented task/patient references, constructed route points, fictional localities/providers, synthetic rule flags and simulated service events are provided. No names, phone numbers, Aadhaar, bank details, actual diagnoses, photos or document copies are needed.

Lovable's current [terms](https://lovable.dev/terms) restrict sensitive data unless the plan or a separate written agreement expressly permits it, and state that standard services are not a regulatory-grade system of record for such data. Therefore no real clinical/identifier records go into this build, prompts, uploads, logs or preview. India-specific live deployment needs an appropriate reviewed arrangement; do not label it “HIPAA compliant” simply because the platform has unrelated security certifications.

## 2. Threats and controls

| Threat | Required control | Evidence after implementation |
|---|---|---|
| User changes role/org in request | Server-derived membership and relationship checks | Cross-role/cross-org requests denied |
| Provider guesses other case IDs | Minimal projection plus RLS/case grants | Separate-provider test |
| Last slot races | Atomic reservation and active-allocation uniqueness | Concurrent last-unit test |
| Retried mutation duplicates help/slots | Idempotency key + payload hash | Replay test |
| Withdrawn consent still accessible | Server grant revocation and state guards | Query/action denied after withdrawal |
| Browser stores secrets | Server-only credentials; inspect client bundle | No service key in delivered code |
| SSR/private pages cached publicly | Authorize loaders; private/no-store; no identifying metadata | Response/cache inspection |
| Offline stale state overwrites server | Expected version and individual conflict handling | Reconnect test |
| Upload formula/script injection | Treat cells as text, validate size/schema, escape exports | Malicious fixture test |
| Sensitive information leaks in logs | Structured IDs/event outcomes only; redacted errors | Log inspection |

## 3. Consent contract

Record purpose, intended provider/recipient, exact allowed fields, text/language version, recorder, person's decision and time. For the demo, allowed fields are category, fictional locality, preferred assistance method/time and request reference.

Sharing with a new provider needs an applicable current recipient grant. A generic initial checkbox is not permission for every future NGO. A person can decline or withdraw; public pathway/assisted help remains an option.

Withdrawal stops new sharing and provider actions. It does not pretend to remove information already observed by a recipient. Preserve minimal restricted audit/resource reconciliation under the policy, and do not use that retention as renewed consent.

## 4. Authentication and database security

Real session/membership data comes from the chosen backend authentication system; the role preview dropdown remains cosmetic. No self-assigned coordinator/provider role in an editable profile.

RLS/table access follows [role matrix](ROLE_PERMISSIONS.md). Use deny-by-default policy and explicit tenant/catchment/case relationships. Do not expose raw visit_tasks to providers. Validate scoped permissions in server commands as well.

Transactional database functions with elevated rights must use a safe fixed search path, explicit authorization and narrowly scoped execution permissions; implementation depends on the chosen backend. Do not call a privileged service client from a browser.

## 5. Offline and devices

Prototype offline data is synthetic. Browser storage does not automatically provide secure health-device storage. Clear cached role data on logout/role session change; warn if unsynced edits need export/retry. Do not silently retain one worker's downloaded tasks for another user.

A real pilot must resolve device ownership, shared phones, encryption/key management, lost-device response, consent synchronization delays, remote revocation and retention. These are production questions, not claims achieved by adding a service worker.

## 6. Reporting and finance

Public/donor reporting uses approved aggregates. A live district/state report needs small-cell disclosure policy and permitted geographical granularity; no arbitrary public threshold is declared safe in this spec.

No payment custody, card/bank data or public patient fundraising profile is implemented. The user-authorized [cash demo](FUNDING_AND_COMMUNICATION.md) records fictional budgets, separate consent, atomic approval and an external payment claim followed by independent person confirmation. Case messages share only the current purpose and recipient scope. NGO registration and CSR history do not prove current funding balance.

## 7. Live pilot entry checklist

Resolve the approved data host/contract, health authority workflow, current clinical rules, partner participation/handling agreement, coordinator budget, consent wording, security review, retention/deletion, incident response and offline device policy. The jurisdiction-specific legal review must use current authoritative sources; this document does not infer universal DPDP/health compliance from UI or vendor marketing.

### Cryptographic Field-Level Encryption Audit (2026-11-06)
- Beneficiary identifiable fields encrypted at rest via AES-256-GCM.
- Zero plaintext storage of vulnerable demographic markers.
