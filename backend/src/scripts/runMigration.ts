import fs from 'fs';
import path from 'path';
import sequelize from '../config/database';

async function runMigration() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        
        const sqlPath = path.join(__dirname, '../../database/migrations/20260323_create_lesson_discussions.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await sequelize.query(sql);
        console.log('Migration executed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
