ALTER TABLE course_categories
ADD COLUMN tags_enabled TINYINT(1) DEFAULT 0 COMMENT 'Enable tags for this category' AFTER display_order,
ADD COLUMN tags JSON NULL COMMENT 'Ordered tags list for this category' AFTER tags_enabled;