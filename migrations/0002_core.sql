-- =============================================================================
-- 0002_core.sql
-- Core entities: generator, authorized_receptor, waste.
-- =============================================================================

CREATE TABLE IF NOT EXISTS generator (
    id                   INTEGER PRIMARY KEY,
    legal_name           TEXT    NOT NULL,
    nit                  TEXT    NOT NULL UNIQUE,
    address              TEXT    NOT NULL,
    municipality         TEXT    NOT NULL,
    department           TEXT    NOT NULL,
    contact_phone        TEXT,
    contact_email        TEXT,
    authority_id         INTEGER NOT NULL REFERENCES environmental_authority(id),
    registration_code    TEXT,
    registered_at        TEXT,
    current_category_id  INTEGER REFERENCES generator_category(id),
    created_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at           TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_generator_nit       ON generator(nit);
CREATE INDEX IF NOT EXISTS idx_generator_category  ON generator(current_category_id);
CREATE INDEX IF NOT EXISTS idx_generator_authority ON generator(authority_id);

CREATE TABLE IF NOT EXISTS authorized_receptor (
    id                  INTEGER PRIMARY KEY,
    legal_name          TEXT    NOT NULL,
    nit                 TEXT    NOT NULL UNIQUE,
    license_number      TEXT    NOT NULL,
    license_expiry      TEXT,
    allowed_activities  TEXT,
    address             TEXT,
    contact_phone       TEXT,
    contact_email       TEXT,
    authority_id        INTEGER NOT NULL REFERENCES environmental_authority(id),
    is_active           INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_receptor_active ON authorized_receptor(is_active);

CREATE TABLE IF NOT EXISTS waste (
    id                       INTEGER PRIMARY KEY,
    generator_id             INTEGER NOT NULL REFERENCES generator(id),
    name                     TEXT    NOT NULL,
    waste_type_id            INTEGER REFERENCES waste_type(id),
    hazard_characteristic_id INTEGER NOT NULL REFERENCES hazard_characteristic(id),
    current_stock_kg         REAL    NOT NULL DEFAULT 0 CHECK (current_stock_kg >= 0),
    first_entry_at           TEXT,
    notes                    TEXT,
    created_at               TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at               TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE (generator_id, name, hazard_characteristic_id)
);

CREATE INDEX IF NOT EXISTS idx_waste_generator      ON waste(generator_id);
CREATE INDEX IF NOT EXISTS idx_waste_characteristic ON waste(hazard_characteristic_id);
CREATE INDEX IF NOT EXISTS idx_waste_stock          ON waste(current_stock_kg);
