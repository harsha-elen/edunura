-- LMS Database Schema (Retrieved and Cleaned)
-- Last Updated: 2026-02-18

CREATE DATABASE IF NOT EXISTS lms_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lms_database;

-- Table: course_categories
CREATE TABLE IF NOT EXISTS `course_categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL COMMENT 'Icon name or path',
  `color` varchar(20) DEFAULT '#2b8cee' COMMENT 'Primary color for category',
  `accent_color` varchar(20) DEFAULT '#e8f2fe' COMMENT 'Accent/background color',
  `course_count` int(10) unsigned DEFAULT 0 COMMENT 'Total number of courses in this category',
  `display_order` int(11) DEFAULT 0 COMMENT 'Order for displaying categories',
  `tags_enabled` tinyint(1) DEFAULT 0 COMMENT 'Enable tags for this category',
  `tags` json DEFAULT NULL COMMENT 'Ordered tags list for this category',
  `is_featured` tinyint(1) DEFAULT 0 COMMENT 'Featured categories appear first',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Active categories are visible to users',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `parent_id` int(10) unsigned DEFAULT NULL COMMENT 'Parent category ID for hierarchical structure',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  KEY `course_categories_is_active` (`is_active`),
  KEY `course_categories_is_featured` (`is_featured`),
  KEY `course_categories_display_order` (`display_order`),
  KEY `course_categories_parent_id` (`parent_id`),
  CONSTRAINT `course_categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `course_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `role` enum('admin','moderator','teacher','student') NOT NULL DEFAULT 'student',
  `phone` varchar(20) DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_verified` tinyint(1) DEFAULT 0,
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `is_two_factor_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `last_login` datetime DEFAULT NULL,
  `reset_password_token` varchar(255) DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `bio` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `billing_address` varchar(500) DEFAULT NULL,
  `billing_city` varchar(100) DEFAULT NULL,
  `billing_state` varchar(100) DEFAULT NULL,
  `billing_zip` varchar(20) DEFAULT NULL,
  `billing_country` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: courses
CREATE TABLE IF NOT EXISTS `courses` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `short_description` varchar(500) DEFAULT NULL,
  `thumbnail` varchar(500) DEFAULT NULL,
  `intro_video` varchar(500) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT 0,
  `category` varchar(100) DEFAULT NULL,
  `level` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_free` tinyint(1) DEFAULT 0,
  `duration_hours` int(11) DEFAULT NULL,
  `enrollment_limit` int(11) DEFAULT NULL,
  `total_enrollments` int(11) DEFAULT 0,
  `rating` decimal(3,2) DEFAULT NULL,
  `total_reviews` int(11) DEFAULT 0,
  `created_by` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `outcomes` longtext DEFAULT NULL,
  `prerequisites` longtext DEFAULT NULL,
  `tags` json DEFAULT NULL COMMENT 'Selected category tags for the course',
  `validity_period` int(11) DEFAULT NULL,
  `discounted_price` decimal(10,2) DEFAULT 0.00,
  `instructors` longtext DEFAULT NULL,
  `enable_discussion_forum` tinyint(1) DEFAULT 1,
  `show_course_rating` tinyint(1) DEFAULT 0,
  `enable_certificate` tinyint(1) DEFAULT 1,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `visibility` enum('draft','published','private') DEFAULT 'draft',
  `geneo_enabled` tinyint(1) DEFAULT 0 COMMENT 'Enable Geneo access for this course',
  `geneo_class` varchar(50) DEFAULT NULL COMMENT 'Class for Geneo integration (1-10)',
  `geneo_subject` varchar(100) DEFAULT NULL COMMENT 'Subject for Geneo integration (maths, physics, science)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `created_by` (`created_by`),
  KEY `idx_geneo_enabled` (`geneo_enabled`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: course_sections
CREATE TABLE IF NOT EXISTS `course_sections` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `course_id` int(10) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `is_published` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `course_sections_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lessons
CREATE TABLE IF NOT EXISTS `lessons` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `section_id` int(10) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `content_type` enum('video','quiz','text','document','live','assignment') NOT NULL DEFAULT 'text',
  `content_platform` enum('zoom','jitsi') DEFAULT 'zoom',
  `content_body` text DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `zoom_meeting_id` varchar(100) DEFAULT NULL,
  `zoom_join_url` varchar(1000) DEFAULT NULL,
  `jitsi_room_name` varchar(255) DEFAULT NULL,
  `jitsi_join_url` varchar(1000) DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `duration` int(11) DEFAULT NULL,
  `is_free_preview` tinyint(1) DEFAULT 0,
  `is_published` tinyint(1) DEFAULT 1,
  `start_time` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `content_platform` (`content_platform`),
  KEY `jitsi_room_name` (`jitsi_room_name`),
  CONSTRAINT `lessons_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `course_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: enrollments
CREATE TABLE IF NOT EXISTS `enrollments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `course_id` int(10) unsigned NOT NULL,
  `student_id` int(10) unsigned NOT NULL,
  `status` enum('active','completed','suspended') NOT NULL DEFAULT 'active',
  `enrollment_date` datetime NOT NULL DEFAULT current_timestamp(),
  `completion_date` datetime DEFAULT NULL,
  `progress_percentage` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment` (`course_id`,`student_id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lesson_progress
CREATE TABLE IF NOT EXISTS `lesson_progress` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `course_id` int(10) unsigned NOT NULL,
  `student_id` int(10) unsigned NOT NULL,
  `lesson_id` int(10) unsigned NOT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT 1,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_lesson_progress` (`course_id`,`student_id`,`lesson_id`),
  KEY `idx_course` (`course_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_lesson` (`lesson_id`),
  CONSTRAINT `lesson_progress_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lesson_progress_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lesson_progress_ibfk_3` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lesson_resources
CREATE TABLE IF NOT EXISTS `lesson_resources` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `lesson_id` int(10) unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_size` varchar(255) NOT NULL,
  `file_type` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `lesson_id` (`lesson_id`),
  CONSTRAINT `lesson_resources_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: assignment_submissions
CREATE TABLE IF NOT EXISTS `assignment_submissions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `lesson_id` int(10) unsigned NOT NULL,
  `student_id` int(10) unsigned NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_size` int(10) unsigned NOT NULL,
  `status` enum('submitted','reviewed','resubmit_required') NOT NULL DEFAULT 'submitted',
  `score` float DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `submitted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_assignment_submission_per_student` (`lesson_id`,`student_id`),
  KEY `idx_assignment_submissions_lesson_id` (`lesson_id`),
  KEY `idx_assignment_submissions_student_id` (`student_id`),
  CONSTRAINT `assignment_submissions_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assignment_submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: live_sessions
CREATE TABLE IF NOT EXISTS `live_sessions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `course_id` int(10) unsigned NOT NULL,
  `section_id` int(10) unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `duration` int(11) NOT NULL DEFAULT 60,
  `meeting_id` varchar(255) NOT NULL,
  `start_url` text NOT NULL,
  `join_url` text NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `meeting_type` enum('zoom','jitsi') DEFAULT 'zoom',
  `jitsi_room_name` varchar(255) UNIQUE DEFAULT NULL,
  `jitsi_config` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `live_sessions_course_id` (`course_id`),
  KEY `live_sessions_start_time` (`start_time`),
  KEY `meeting_type` (`meeting_type`),
  KEY `jitsi_room_name` (`jitsi_room_name`),
  CONSTRAINT `live_sessions_course_fk` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` varchar(100) NOT NULL,
  `payment_id` varchar(100) DEFAULT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `course_id` int(10) unsigned NOT NULL,
  `amount` int(11) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  `receipt` varchar(100) DEFAULT NULL,
  `razorpay_signature` varchar(255) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  UNIQUE KEY `unique_payment_order` (`order_id`,`user_id`,`course_id`),
  KEY `user_id` (`user_id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: system_settings
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category` enum('payment','storage','email','zoom','jitsi','general','branding','organization','localization') NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `is_encrypted` tinyint(1) DEFAULT 0,
  `description` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `system_settings_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lesson_discussions
CREATE TABLE IF NOT EXISTS `lesson_discussions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `lesson_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `lesson_id` (`lesson_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `lesson_discussions_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `lesson_discussions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: quiz_questions
CREATE TABLE IF NOT EXISTS `quiz_questions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `lesson_id` int(10) unsigned NOT NULL,
  `question_text` text NOT NULL,
  `question_type` enum('multiple_choice','true_false','short_answer') NOT NULL,
  `correct_answer` text NOT NULL,
  `explanation` text DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_quiz_questions_lesson_id` (`lesson_id`),
  CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: quiz_question_options
CREATE TABLE IF NOT EXISTS `quiz_question_options` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `question_id` int(10) unsigned NOT NULL,
  `option_text` text NOT NULL,
  `option_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_quiz_question_options_question_id` (`question_id`),
  CONSTRAINT `quiz_question_options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: quiz_attempts
CREATE TABLE IF NOT EXISTS `quiz_attempts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `lesson_id` int(10) unsigned NOT NULL,
  `student_id` int(10) unsigned NOT NULL,
  `answers` json NOT NULL,
  `results` json NOT NULL,
  `total_questions` int(10) unsigned NOT NULL DEFAULT 0,
  `correct_count` int(10) unsigned NOT NULL DEFAULT 0,
  `wrong_count` int(10) unsigned NOT NULL DEFAULT 0,
  `review_count` int(10) unsigned NOT NULL DEFAULT 0,
  `submitted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_quiz_attempt_per_student` (`lesson_id`,`student_id`),
  KEY `idx_quiz_attempts_lesson_id` (`lesson_id`),
  KEY `idx_quiz_attempts_student_id` (`student_id`),
  CONSTRAINT `quiz_attempts_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quiz_attempts_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: geneo_tokens
CREATE TABLE IF NOT EXISTS `geneo_tokens` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `token` varchar(512) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `revoked` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `geneo_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
