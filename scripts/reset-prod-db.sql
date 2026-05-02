-- Wipes all operational rows and re-seeds the default authority/generator/receptor.
-- Keeps the schema and the regulatory lookups (hazard_characteristic,
-- generator_category, waste_type) which come from the migrations and don't
-- represent user-entered data.
PRAGMA foreign_keys = OFF;

-- Operational / transactional rows (FK-safe order: dependents first)
DELETE FROM waste_exit;
DELETE FROM waste_entry;
DELETE FROM storage_limit_alert;
DELETE FROM generator_category_alert;
DELETE FROM projected_category_alert;
DELETE FROM waste;

-- Tenant-style rows that get re-seeded below
DELETE FROM authorized_receptor;
DELETE FROM generator;
DELETE FROM environmental_authority;

-- Re-seed mirrors migrations/0005_seed_default.sql (no INSERT OR IGNORE
-- needed because we just emptied the tables).
INSERT INTO environmental_authority (id, name, jurisdiction) VALUES
  (1, 'CAR Cundinamarca', 'Cundinamarca, Colombia');

INSERT INTO generator (
    id, legal_name, nit, address, municipality, department,
    contact_phone, contact_email, authority_id, registration_code,
    registered_at, current_category_id
) VALUES (
    1,
    'RESPEL Default Generator S.A.S.',
    '900000000-0',
    'Calle 100 # 0-00',
    'Bogota',
    'Cundinamarca',
    '+57 300 000 0000',
    'contacto@respel.local',
    1,
    'RESPEL-DEFAULT-001',
    strftime('%Y-%m-%dT%H:%M:%SZ', 'now'),
    1
);

INSERT INTO authorized_receptor (
    id, legal_name, nit, license_number, license_expiry,
    allowed_activities, address, contact_phone, contact_email,
    authority_id, is_active
) VALUES (
    1,
    'Gestor Autorizado Default S.A.',
    '800000000-0',
    'LIC-RESPEL-0001',
    '2030-12-31',
    '["storage","treatment","disposal"]',
    'Av. Industrial # 50-00',
    '+57 301 000 0000',
    'gestor@respel.local',
    1,
    1
);
