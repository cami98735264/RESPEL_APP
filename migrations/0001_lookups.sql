-- =============================================================================
-- 0001_lookups.sql
-- Lookup tables: hazard_characteristic, generator_category, waste_type,
-- environmental_authority. Includes static seed data for the first three.
-- =============================================================================

CREATE TABLE IF NOT EXISTS hazard_characteristic (
    id             INTEGER PRIMARY KEY,
    code           TEXT    NOT NULL UNIQUE CHECK (length(code) = 2),
    name_es        TEXT    NOT NULL UNIQUE,
    description_es TEXT    NOT NULL,
    created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

INSERT OR IGNORE INTO hazard_characteristic (id, code, name_es, description_es) VALUES
  (1, 'CO', 'Corrosivo',   'pH <= 2 o >= 12.5, o corroe acero a > 6.35 mm/ano a 55 C (Anexo III)'),
  (2, 'RE', 'Reactivo',    'Genera gases toxicos al mezclarse con agua u otros compuestos (Anexo III)'),
  (3, 'EX', 'Explosivo',   'Puede desprender gases explosivos de forma espontanea (Anexo III)'),
  (4, 'TO', 'Toxico',      'Causa danos biologicos; DL50 oral <= 200 mg/kg en solidos (Anexo III)'),
  (5, 'IN', 'Infeccioso',  'Contiene agentes patogenos con virulencia suficiente (Anexo III)'),
  (6, 'IF', 'Inflamable',  'Punto de inflamacion < 60 C o gas que arde <= 13% v/v en aire (Anexo III)'),
  (7, 'RA', 'Radiactivo',  'Actividad radiactiva > 70 kBq/kg o 2 nCi/g (Anexo III)');

CREATE TABLE IF NOT EXISTS generator_category (
    id                  INTEGER PRIMARY KEY,
    code                TEXT    NOT NULL UNIQUE CHECK (length(code) = 2),
    name_es             TEXT    NOT NULL,
    min_kg_month        REAL    NOT NULL,
    max_kg_month        REAL,
    registration_months INTEGER NOT NULL,
    CHECK (max_kg_month IS NULL OR min_kg_month < max_kg_month)
);

INSERT OR IGNORE INTO generator_category (id, code, name_es, min_kg_month, max_kg_month, registration_months) VALUES
  (1, 'PE', 'Pequeno Generador', 10,   100,  24),
  (2, 'ME', 'Mediano Generador', 100,  1000, 18),
  (3, 'GR', 'Gran Generador',    1000, NULL, 12);

CREATE TABLE IF NOT EXISTS waste_type (
    id             INTEGER PRIMARY KEY,
    annex_code     TEXT    NOT NULL UNIQUE,
    description_es TEXT    NOT NULL,
    source_annex   TEXT    NOT NULL CHECK (source_annex IN ('I', 'II')),
    created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS environmental_authority (
    id           INTEGER PRIMARY KEY,
    name         TEXT NOT NULL,
    jurisdiction TEXT,
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
