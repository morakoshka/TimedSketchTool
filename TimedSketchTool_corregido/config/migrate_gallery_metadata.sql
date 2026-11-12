ALTER TABLE drawings
    ADD COLUMN description TEXT NULL AFTER title,
    ADD COLUMN drawing_date DATE NULL AFTER category,
    ADD COLUMN session_duration_seconds SMALLINT UNSIGNED NULL,
    ADD COLUMN session_image_count SMALLINT UNSIGNED NULL,
    ADD COLUMN session_category VARCHAR(24) NULL,
    ADD COLUMN session_started_at DATETIME NULL;

UPDATE drawings
SET drawing_date = DATE(created_at)
WHERE drawing_date IS NULL;

UPDATE drawings
SET description = ''
WHERE description IS NULL;

ALTER TABLE drawings
    MODIFY COLUMN description TEXT NOT NULL,
    MODIFY COLUMN drawing_date DATE NOT NULL;
