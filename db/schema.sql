CREATE TABLE IF NOT EXISTS entries (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  tag        TEXT NOT NULL DEFAULT 'Harian',
  date       TEXT NOT NULL,
  body       TEXT NOT NULL,
  published  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entries_pub_date ON entries (published, date DESC);

-- Pembatas percobaan login (aman dijalankan ulang).
CREATE TABLE IF NOT EXISTS login_fails (
  ip TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_fails_ip ON login_fails (ip, at);
