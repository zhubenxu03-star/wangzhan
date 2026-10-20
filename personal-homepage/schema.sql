-- Cloudflare D1 → Console: paste and execute this file once.
-- Bind this database to the Pages project as GUESTBOOK, then redeploy.
CREATE TABLE IF NOT EXISTS guestbook_messages (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  body TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS guestbook_messages_newest
  ON guestbook_messages(created_at DESC, id DESC);

-- Only salted hashes are stored here, never IP addresses.
-- Expired rows are removed as part of the next submission.
CREATE TABLE IF NOT EXISTS guestbook_rate_limits (
  request_id TEXT PRIMARY KEY REFERENCES guestbook_messages(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS guestbook_rate_limits_client
  ON guestbook_rate_limits(ip_hash, created_at);

CREATE TABLE IF NOT EXISTS guestbook_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO guestbook_config(key, value)
  VALUES ('rate_limit_salt', lower(hex(randomblob(32))));
