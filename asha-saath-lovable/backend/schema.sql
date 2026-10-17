PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS application_state (
  id INTEGER PRIMARY KEY CHECK (id=1), version INTEGER NOT NULL CHECK(version>=1),
  state_json TEXT NOT NULL CHECK(json_valid(state_json)), updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, actor_id TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS idempotency (
  actor_id TEXT NOT NULL, command_name TEXT NOT NULL, command_key TEXT NOT NULL,
  payload_hash TEXT NOT NULL, response_json TEXT NOT NULL, created_at TEXT NOT NULL,
  PRIMARY KEY(actor_id, command_name, command_key)
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id TEXT NOT NULL, command_name TEXT NOT NULL,
  state_version INTEGER NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS task_identity (
  dataset_id TEXT NOT NULL, task_id TEXT NOT NULL, task_key TEXT NOT NULL UNIQUE,
  PRIMARY KEY(dataset_id, task_id)
);
CREATE TABLE IF NOT EXISTS referral_attempt (
  id TEXT PRIMARY KEY, need_id TEXT NOT NULL, provider_id TEXT NOT NULL, offer_id TEXT NOT NULL, state TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_attempt ON referral_attempt(need_id)
  WHERE state IN ('OFFERED','ACCEPTED','ARRANGED','DELIVERY_REPORTED','CONFIRMED','DISPUTED');
CREATE TABLE IF NOT EXISTS capacity_reservation (
  id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL UNIQUE REFERENCES referral_attempt(id),
  offer_id TEXT NOT NULL, units INTEGER NOT NULL CHECK(units>0), state TEXT NOT NULL
);

-- The aggregate remains authoritative; these tables enforce identity/state invariants
-- in the same BEGIN IMMEDIATE transaction as the budget and consent checks.
CREATE TABLE IF NOT EXISTS funding_request (
  id TEXT PRIMARY KEY, need_id TEXT NOT NULL, provider_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('REQUESTED','APPROVED','DECLINED','PAYMENT_REPORTED','RECEIVED','DISPUTED','CLOSED','WITHDRAWN','CANCELLED')),
  requested_rupees INTEGER NOT NULL CHECK(requested_rupees BETWEEN 1 AND 100000),
  approved_rupees INTEGER CHECK(approved_rupees BETWEEN 1 AND requested_rupees),
  resource_held INTEGER NOT NULL CHECK(resource_held IN (0,1)),
  reconciled_rupees INTEGER CHECK(reconciled_rupees BETWEEN 0 AND approved_rupees)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_funding_request ON funding_request(need_id)
  WHERE state IN ('REQUESTED','APPROVED','PAYMENT_REPORTED','RECEIVED','DISPUTED');
CREATE TABLE IF NOT EXISTS case_message (
  id TEXT PRIMARY KEY, thread_key TEXT NOT NULL, sender_actor_id TEXT NOT NULL,
  text TEXT NOT NULL CHECK(length(text) BETWEEN 1 AND 1000), at INTEGER NOT NULL
);
