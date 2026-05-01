-- =============================================================================
-- 0004_views.sql
-- Read-only views for monthly aggregation, current stock, rolling average,
-- and detail reports for entries/exits.
-- =============================================================================

CREATE VIEW IF NOT EXISTS v_monthly_generation AS
SELECT
    g.id                                   AS generator_id,
    g.legal_name                           AS generator_name,
    g.nit,
    gc.code                                AS category_code,
    gc.name_es                             AS category_name,
    strftime('%Y-%m', e.recorded_at)       AS period_month,
    hc.code                                AS hazard_code,
    hc.name_es                             AS hazard_name,
    SUM(e.weight_kg)                       AS total_entries_kg,
    COUNT(*)                               AS entry_count
FROM waste_entry e
JOIN waste                   w  ON w.id  = e.waste_id
JOIN generator               g  ON g.id  = e.generator_id
LEFT JOIN generator_category gc ON gc.id = g.current_category_id
JOIN hazard_characteristic   hc ON hc.id = w.hazard_characteristic_id
GROUP BY g.id, g.nit, gc.code, gc.name_es,
         strftime('%Y-%m', e.recorded_at), hc.code, hc.name_es;

CREATE VIEW IF NOT EXISTS v_current_stock AS
SELECT
    w.id                                   AS waste_id,
    w.name                                 AS waste_name,
    g.id                                   AS generator_id,
    g.legal_name                           AS generator_name,
    hc.code                                AS hazard_code,
    hc.name_es                             AS hazard_name,
    w.current_stock_kg,
    w.first_entry_at,
    date(w.first_entry_at, '+365 days')    AS storage_deadline,
    CASE
        WHEN date(w.first_entry_at, '+365 days') <= date('now', '+30 days') THEN 1
        ELSE 0
    END                                    AS near_deadline_flag
FROM waste w
JOIN generator             g  ON g.id  = w.generator_id
JOIN hazard_characteristic hc ON hc.id = w.hazard_characteristic_id
WHERE w.current_stock_kg > 0;

CREATE VIEW IF NOT EXISTS v_rolling_avg_6mo AS
SELECT
    sub.generator_id,
    AVG(sub.monthly_kg) AS rolling_avg_kg,
    COUNT(*)            AS months_with_data
FROM (
    SELECT
        generator_id,
        strftime('%Y-%m', recorded_at) AS period_month,
        SUM(weight_kg)                 AS monthly_kg
    FROM waste_entry
    WHERE recorded_at >= date('now', 'start of month', '-6 months')
      AND recorded_at <  date('now', 'start of month')
    GROUP BY generator_id, strftime('%Y-%m', recorded_at)
) sub
GROUP BY sub.generator_id;

CREATE VIEW IF NOT EXISTS v_entry_detail_report AS
SELECT
    e.id                                         AS entry_id,
    e.recorded_at,
    date(e.recorded_at)                          AS report_day,
    strftime('%Y-%m', e.recorded_at)             AS report_month,
    ((CAST(strftime('%m', e.recorded_at) AS INTEGER) - 1) / 3) + 1 AS report_quarter,
    strftime('%Y', e.recorded_at)                AS report_year,
    g.id                                         AS generator_id,
    g.nit                                        AS generator_nit,
    g.legal_name                                 AS generator_name,
    gc.code                                      AS category_code,
    w.name                                       AS waste_name,
    hc.code                                      AS hazard_code,
    hc.name_es                                   AS hazard_name,
    e.weight_kg,
    e.sensor_reading_ref,
    e.source_description
FROM waste_entry e
JOIN waste                   w  ON w.id  = e.waste_id
JOIN generator               g  ON g.id  = e.generator_id
LEFT JOIN generator_category gc ON gc.id = g.current_category_id
JOIN hazard_characteristic   hc ON hc.id = w.hazard_characteristic_id;

CREATE VIEW IF NOT EXISTS v_exit_detail_report AS
SELECT
    x.id                                         AS exit_id,
    x.dispatched_at,
    date(x.dispatched_at)                        AS report_day,
    strftime('%Y-%m', x.dispatched_at)           AS report_month,
    ((CAST(strftime('%m', x.dispatched_at) AS INTEGER) - 1) / 3) + 1 AS report_quarter,
    strftime('%Y', x.dispatched_at)              AS report_year,
    g.id                                         AS generator_id,
    g.nit                                        AS generator_nit,
    g.legal_name                                 AS generator_name,
    w.name                                       AS waste_name,
    hc.code                                      AS hazard_code,
    hc.name_es                                   AS hazard_name,
    x.weight_kg,
    r.legal_name                                 AS receptor_name,
    r.license_number                             AS receptor_license,
    x.manifesto_number,
    x.disposal_method,
    x.receptor_certificate_ref
FROM waste_exit x
JOIN waste                   w  ON w.id  = x.waste_id
JOIN generator               g  ON g.id  = x.generator_id
JOIN authorized_receptor     r  ON r.id  = x.receptor_id
JOIN hazard_characteristic   hc ON hc.id = w.hazard_characteristic_id;
