// lib/local-schema.ts
export const LOCAL_SCHEMA = `
CREATE TABLE IF NOT EXISTS local_profile (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  full_name TEXT,
  device_id TEXT NOT NULL,
  offline_pin_hash TEXT NOT NULL,
  last_login_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_ops (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  op_type TEXT NOT NULL,
  payload TEXT NOT NULL,        -- JSON string
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pending_ops_user ON pending_ops(user_id);

`;
