import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
    if (!process.env.DB_PASSWORD) {
        console.error('❌ ERROR: DB_PASSWORD is required in production');
        process.exit(1);
    }
    if (!process.env.DB_NAME) {
        console.error('❌ ERROR: DB_NAME is required in production');
        process.exit(1);
    }
    if (!process.env.DB_USER) {
        console.error('❌ ERROR: DB_USER is required in production');
        process.exit(1);
    }
}

const sequelize = new Sequelize(
    process.env.DB_NAME || 'lms_database',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            timestamps: true,
            underscored: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

export const connectDatabase = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        // Check if schema needs to be initialized (first run / fresh DB)
        const usersTableCheck = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM information_schema.tables
            WHERE table_schema = '${process.env.DB_NAME || 'lms_database'}'
            AND table_name = 'users'
        `, { type: QueryTypes.SELECT }) as any;

        if (usersTableCheck[0].count === 0) {
            console.log('⚙️  No schema detected — running initial database setup...');
            const schemaPath = path.join(__dirname, '../../database/schema.sql');
            const rawSql = fs.readFileSync(schemaPath, 'utf8');

            // Strip CREATE DATABASE / USE statements (already connected to the DB)
            const cleanedSql = rawSql
                .replace(/^\s*CREATE\s+DATABASE\b.*?;/gim, '')
                .replace(/^\s*USE\s+\S+\s*;/gim, '');

            // Split on statement-ending semicolons and run each one
            const statements = cleanedSql
                .split(/;\s*\n/)
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const stmt of statements) {
                if (stmt.trim()) {
                    await sequelize.query(stmt);
                }
            }
            console.log('✅ Database schema initialized successfully.');
        }

        // Create only the new lesson_progress table if it doesn't exist
        // Don't sync existing tables to avoid index conflicts
        if (process.env.NODE_ENV === 'development') {
            const tableCheck = await sequelize.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = '${process.env.DB_NAME || 'lms_database'}' 
                AND table_name = 'lesson_progress'
            `, { type: QueryTypes.SELECT }) as any;
            
            if (tableCheck[0].count === 0) {
                await sequelize.query(`
                    CREATE TABLE IF NOT EXISTS lesson_progress (
                        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                        course_id INT UNSIGNED NOT NULL,
                        student_id INT UNSIGNED NOT NULL,
                        lesson_id INT UNSIGNED NOT NULL,
                        completed TINYINT(1) DEFAULT 1 NOT NULL,
                        completed_at DATETIME,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        UNIQUE KEY unique_lesson_progress (course_id, student_id, lesson_id),
                        INDEX idx_course (course_id),
                        INDEX idx_student (student_id),
                        INDEX idx_lesson (lesson_id),
                        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `);
                console.log('✅ lesson_progress table created.');
            }
        }
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
};

export default sequelize;
