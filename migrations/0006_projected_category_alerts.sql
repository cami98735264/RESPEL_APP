-- =============================================================================
-- 0006_projected_category_alerts.sql
-- Preventive category-change alerts, including WhatsApp delivery tracking.
-- =============================================================================

CREATE TABLE IF NOT EXISTS projected_category_alert (
    id                       INTEGER PRIMARY KEY,
    generator_id             INTEGER NOT NULL REFERENCES generator(id),
    current_category_id      INTEGER REFERENCES generator_category(id),
    projected_category_id    INTEGER NOT NULL REFERENCES generator_category(id),
    trigger_month            TEXT    NOT NULL,
    month_total_kg           REAL    NOT NULL CHECK (month_total_kg >= 0),
    projected_rolling_avg_kg REAL    NOT NULL CHECK (projected_rolling_avg_kg >= 0),
    threshold_kg             REAL    NOT NULL CHECK (threshold_kg >= 0),
    exceeded_by_kg           REAL    NOT NULL CHECK (exceeded_by_kg >= 0),
    created_at               TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    acknowledged             INTEGER NOT NULL DEFAULT 0 CHECK (acknowledged IN (0, 1)),
    acknowledged_at          TEXT,
    whatsapp_status          TEXT    NOT NULL DEFAULT 'pending'
                                      CHECK (whatsapp_status IN ('pending', 'sent', 'failed', 'skipped')),
    whatsapp_attempted_at    TEXT,
    whatsapp_sent_at         TEXT,
    whatsapp_provider_id     TEXT,
    whatsapp_last_error      TEXT
);

CREATE INDEX IF NOT EXISTS idx_projected_alert_generator
    ON projected_category_alert(generator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projected_alert_trigger_month
    ON projected_category_alert(trigger_month);
CREATE INDEX IF NOT EXISTS idx_projected_alert_unack
    ON projected_category_alert(acknowledged) WHERE acknowledged = 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_projected_alert_open_unique
    ON projected_category_alert(generator_id, trigger_month, projected_category_id, acknowledged);
