ALTER TABLE courses
ADD COLUMN tags JSON NULL COMMENT 'JSON array of selected category tags for the course' AFTER prerequisites;
