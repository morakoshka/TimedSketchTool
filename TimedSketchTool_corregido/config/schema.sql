CREATE DATABASE IF NOT EXISTS timed_sketch_tool
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE timed_sketch_tool;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS drawings (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(24) NOT NULL DEFAULT 'sin_categoria',
    drawing_date DATE NOT NULL,
    session_duration_seconds SMALLINT UNSIGNED NULL,
    session_image_count SMALLINT UNSIGNED NULL,
    session_category VARCHAR(24) NULL,
    session_started_at DATETIME NULL,
    mime_type VARCHAR(30) NOT NULL,
    image_data MEDIUMBLOB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_drawings_user_created (user_id, created_at),
    CONSTRAINT fk_drawings_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
