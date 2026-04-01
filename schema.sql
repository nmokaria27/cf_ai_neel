-- Conversation summaries persisted from Durable Object sessions
CREATE TABLE IF NOT EXISTS conversation_summaries (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id    TEXT NOT NULL UNIQUE,
    summary       TEXT NOT NULL,
    message_count INTEGER NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_summaries_session
    ON conversation_summaries(session_id);

-- Research results from workflow executions
CREATE TABLE IF NOT EXISTS research_results (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   TEXT NOT NULL,
    workflow_id  TEXT NOT NULL UNIQUE,
    query        TEXT NOT NULL,
    result       TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL DEFAULT 'pending',
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_research_session
    ON research_results(session_id);
