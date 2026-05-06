CREATE TABLE IF NOT EXISTS events (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    trial_id       INTEGER NOT NULL REFERENCES trials(id),
    video_url      TEXT,
    timestamp      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_violation   BOOLEAN NOT NULL DEFAULT 0,
    violation_type TEXT,
    duration       REAL DEFAULT 0,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
