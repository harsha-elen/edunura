-- Add drip columns to courses
ALTER TABLE `courses`
ADD COLUMN `is_sequential` BOOLEAN DEFAULT FALSE;

-- Add drip columns to lessons
ALTER TABLE `lessons`
ADD COLUMN `release_date` DATETIME DEFAULT NULL,
ADD COLUMN `drip_days` INT DEFAULT NULL,
ADD COLUMN `prerequisite_lesson_id` INT UNSIGNED DEFAULT NULL;

-- Optional constraint (ignoring strictly due to cascade complexity, relying on code-level checks)
-- ALTER TABLE `lessons` ADD CONSTRAINT `fk_lesson_prerequisite` FOREIGN KEY (`prerequisite_lesson_id`) REFERENCES `lessons` (`id`) ON DELETE SET NULL;
