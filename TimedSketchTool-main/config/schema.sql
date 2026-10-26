CREATE DATABASE IF NOT EXISTS timed_sketch_tool
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE timed_sketch_tool;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

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
