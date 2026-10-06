# Role and field access matrix

Version 1.1. The local server implements scoped synthetic-account policy; Supabase/PostgreSQL RLS remains unimplemented. [Cash assistance and case communication](FUNDING_AND_COMMUNICATION.md) adds the current recipient-specific extension.

| Capability | Worker | Coordinator | Provider intake | Public/donor |
|---|---|---|---|---|
| Read visit tasks | Assigned tasks only | Approved catchment/capability | No | No |
| Import/schedule tasks | No by default | Authorized supervisor capability | No | No |
| Record visit outcome | Assigned task/cadre | Authorized correction, reason required | No | No |
| Approve clinical rules | No | Only delegated clinical authority | No | No |
| Capture need/permission | Assigned visit/assisted role | Assigned assisted role | No | No |
| Read support need | Captured/assigned minimal projection | Assigned catchment/owner | Current case grant projection | Aggregate only |
| Offer provider referral | No default; coordinator workflow | Yes, current consent | No | No |
| Accept/decline | No | Cannot impersonate provider acceptance | Own organization's offered request | No |
| Change service capacity | No | Verify/review; policy-scoped | Own branch/service window | No |
| Arrange/report supplied help | No | Arrangement assistance when authorized | Own accepted request | No |
| Record person's confirmation | Authorized assisted recorder | Authorized assisted recorder | No | No |
| Close/recover need | No | Assigned coordinator | No | No |
| Withdraw permission | Assisted recorder for authorized need | Authorized assisted recorder | Cannot revoke person's decision on their behalf | No |
| Read clinical flags/location | Assigned clinical subset | Only appropriate authority | No | No |
| Read audit | Own action confirmation | Restricted authorized subset | Own permitted business action receipts | No |
| Read district/state metrics | Own work summary | Permitted aggregates | Own service totals | Only approved coarse aggregates |

## Enforcement

Funding: workers request/confirm/withdraw only their assigned needs; coordinators request, confirm, cancel, close and reconcile; NGOs approve/report and update only their own budget. NGO intake cannot confirm receipt or close funding. Messages require the current specific funding/referral grant. Withdrawal removes provider message bodies and active actions.

Authentication establishes identity; memberships establish roles/capabilities; assignment establishes geography/case relationship; consent establishes provider field/recipient/purpose access. All four are necessary where applicable.

UI role selection cannot create database membership. Client-provided organization_id cannot widen access. Server functions authorize, and RLS/query projections restrict data at storage boundaries.

Test two workers, two providers and a coordinator with separate authenticated sessions. Add a nonmember user and unauthenticated request. Check guessed IDs, expired/withdrawn grants, cross-tenant IDs, stale sessions and role reassignment.

## Withdrawal and historical access

Revocation blocks active provider case reads/actions immediately at the server. Do not leave identifying cached pages available after session changes. Minimal nonidentifying aggregate service counts and restricted resource reconciliation/audit may remain under policy. A live partner must have its own approved handling obligations for previously received information.
