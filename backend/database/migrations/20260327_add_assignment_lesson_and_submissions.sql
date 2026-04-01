ALTER TABLE lessons
MODIFY COLUMN content_type ENUM('video','quiz','text','document','live','assignment') NOT NULL DEFAULT 'text';

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT UNSIGNED NOT NULL,
    student_id INT UNSIGNED NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    status ENUM('submitted','reviewed','resubmit_required') NOT NULL DEFAULT 'submitted',
    score FLOAT NULL,
    feedback TEXT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_assignment_submission_per_student (lesson_id, student_id),
    INDEX idx_assignment_submissions_lesson_id (lesson_id),
    INDEX idx_assignment_submissions_student_id (student_id),
    CONSTRAINT fk_assignment_submissions_lesson
        FOREIGN KEY (lesson_id) REFERENCES lessons(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_assignment_submissions_student
        FOREIGN KEY (student_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
