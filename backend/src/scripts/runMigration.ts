import fs from 'fs';
import path from 'path';
import sequelize from '../config/database';

async function runMigration() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const migrationFileName = process.argv[2];
        if (!migrationFileName) {
            console.error('Please provide a migration file name.');
            console.error('Example: npm run db:migrate:file -- 20260330_add_category_tags_columns.sql');
            process.exit(1);
        }

        const sqlPath = path.join(__dirname, `../../database/migrations/${migrationFileName}`);
        if (!fs.existsSync(sqlPath)) {
            console.error(`Migration file not found: ${migrationFileName}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');

        await sequelize.query(sql);
        console.log(`Migration executed successfully: ${migrationFileName}`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
