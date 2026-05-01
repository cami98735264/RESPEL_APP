-- =============================================================================
-- 0003_transactions.sql
-- Transactional + alert tables: waste_entry, waste_exit,
-- generator_category_alert, storage_limit_alert.
-- =============================================================================

CREATE TABLE IF NOT EXISTS waste_entry (
    id                 INTEGER PRIMARY KEY,
    waste_id           INTEGER NOT NULL REFERENCES waste(id),
    generator_id       INTEGER NOT NULL REFERENCES generator(id),
    sensor_reading_ref TEXT,
    weight_kg          REAL    NOT NULL CHECK (weight_kg > 0),
    recorded_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    source_description TEXT,
    notes              TEXT
);

CREATE INDEX IF NOT EXISTS idx_entry_generator_month
    ON waste_entry(generator_id, strftime('%Y-%m', recorded_at));
CREATE INDEX IF NOT EXISTS idx_entry_waste       ON waste_entry(waste_id);
CREATE INDEX IF NOT EXISTS idx_entry_recorded_at ON waste_entry(recorded_at DESC);

CREATE TABLE IF NOT EXISTS waste_exit (
    id                       INTEGER PRIMARY KEY,
    waste_id                 INTEGER NOT NULL REFERENCES waste(id),
    generator_id             INTEGER NOT NULL REFERENCES generator(id),
    receptor_id              INTEGER NOT NULL REFERENCES authorized_receptor(id),
    weight_kg                REAL    NOT NULL CHECK (weight_kg > 0),
    dispatched_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    manifesto_number         TEXT,
    disposal_method          TEXT,
    receptor_certificate_ref TEXT,
    certificate_issued_at    TEXT,
    notes                    TEXT
);

CREATE INDEX IF NOT EXISTS idx_exit_generator_month
    ON waste_exit(generator_id, strftime('%Y-%m', dispatched_at));
CREATE INDEX IF NOT EXISTS idx_exit_waste         ON waste_exit(waste_id);
CREATE INDEX IF NOT EXISTS idx_exit_receptor      ON waste_exit(receptor_id);
CREATE INDEX IF NOT EXISTS idx_exit_dispatched_at ON waste_exit(dispatched_at DESC);

CREATE TABLE IF NOT EXISTS generator_category_alert (
    id                   INTEGER PRIMARY KEY,
    generator_id         INTEGER NOT NULL REFERENCES generator(id),
    previous_category_id INTEGER REFERENCES generator_category(id),
    new_category_id      INTEGER NOT NULL REFERENCES generator_category(id),
    trigger_month        TEXT    NOT NULL,
    rolling_avg_kg       REAL    NOT NULL,
    created_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    acknowledged         INTEGER NOT NULL DEFAULT 0 CHECK (acknowledged IN (0, 1)),
    acknowledged_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_alert_generator ON generator_category_alert(generator_id);
CREATE INDEX IF NOT EXISTS idx_alert_created   ON generator_category_alert(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_unack
    ON generator_category_alert(acknowledged) WHERE acknowledged = 0;

CREATE TABLE IF NOT EXISTS storage_limit_alert (
    id             INTEGER PRIMARY KEY,
    waste_id       INTEGER NOT NULL REFERENCES waste(id),
    generator_id   INTEGER NOT NULL REFERENCES generator(id),
    first_entry_at TEXT    NOT NULL,
    deadline_date  TEXT    NOT NULL,
    alerted_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    resolved       INTEGER NOT NULL DEFAULT 0 CHECK (resolved IN (0, 1)),
    resolved_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_storage_alert_gen      ON storage_limit_alert(generator_id);
CREATE INDEX IF NOT EXISTS idx_storage_alert_deadline ON storage_limit_alert(deadline_date);
CREATE INDEX IF NOT EXISTS idx_storage_alert_open
    ON storage_limit_alert(resolved) WHERE resolved = 0;
