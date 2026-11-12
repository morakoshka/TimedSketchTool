ALTER TABLE users
    ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash;

CREATE TABLE IF NOT EXISTS categories (
    slug VARCHAR(24) NOT NULL,
    label VARCHAR(40) NOT NULL,
    is_system TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (slug),
    UNIQUE KEY uq_categories_label (label)
) ENGINE=InnoDB;

INSERT IGNORE INTO categories (slug, label, is_system) VALUES
    ('sin_categoria', 'Sin categoría', 1),
    ('poses', 'Poses', 0),
    ('rostros', 'Rostros', 0),
    ('manos', 'Manos', 0),
    ('anatomia', 'Anatomía', 0);

CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(40) NOT NULL,
    setting_value VARCHAR(500) NOT NULL,
    PRIMARY KEY (setting_key)
) ENGINE=InnoDB;

INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES
    ('app_title', 'Timed Sketch Tool'),
    ('welcome_message', 'Practica dibujo a tu ritmo'),
    ('default_duration_seconds', '30');
