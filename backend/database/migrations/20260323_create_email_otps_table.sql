CREATE TABLE IF NOT EXISTS `email_otps` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `email` varchar(255) NOT NULL,
    `otp` varchar(10) NOT NULL,
    `expires_at` datetime NOT NULL,
    `created_at` datetime NOT NULL,
    `updated_at` datetime NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
