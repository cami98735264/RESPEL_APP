-- =============================================================================
-- 0005_seed_default.sql
-- Seed: one default environmental authority, default generator (id = 1),
-- default authorized receptor. Required because the app runs without auth
-- and operates against a single fixed generator.
-- =============================================================================

INSERT OR IGNORE INTO environmental_authority (id, name, jurisdiction) VALUES
  (1, 'CAR Cundinamarca', 'Cundinamarca, Colombia');

INSERT OR IGNORE INTO generator (
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

INSERT OR IGNORE INTO authorized_receptor (
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
