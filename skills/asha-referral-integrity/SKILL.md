---
name: asha-referral-integrity
description: Implement or review ASHA Saath support referrals, consent withdrawal, capacity reservations and delivery confirmation with correct server-side ownership.
---

# Protect referral correctness

Use [state machines](../../docs/STATE_MACHINES.md), [API contracts](../../docs/API_CONTRACTS.md) and [data constraints](../../docs/DATA_MODEL.md) together.

Check current consent, actual catchment, current offer verification, fresh capacity, actor organization and expected version before each command. Acceptance and capacity allocation occur atomically. Only one active attempt/allocation may exist for a need. Retries return the original result for an identical idempotency key and payload.

Do not close a need from a provider delivery claim alone. Withdrawal revokes access and blocks later progress; restricted audit records survive under the documented policy.

Use the race, duplicate, expiry, withdrawal and cross-organization cases in [acceptance tests](../../docs/TEST_ACCEPTANCE.md). Demonstrate server/RLS behaviour with separate users; UI visibility alone is insufficient.
