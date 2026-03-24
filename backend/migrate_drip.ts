import sequelize from './src/config/database';

async function migrate() {
    try {
        console.log('Starting drip migration...');
        
        await sequelize.query('ALTER TABLE `courses` ADD COLUMN `is_sequential` BOOLEAN DEFAULT FALSE;');
        console.log('Added is_sequential to courses');
        
        await sequelize.query('ALTER TABLE `lessons` ADD COLUMN `release_date` DATETIME DEFAULT NULL;');
        console.log('Added release_date to lessons');
        
        await sequelize.query('ALTER TABLE `lessons` ADD COLUMN `drip_days` INT DEFAULT NULL;');
        console.log('Added drip_days to lessons');
        
        await sequelize.query('ALTER TABLE `lessons` ADD COLUMN `prerequisite_lesson_id` INT UNSIGNED DEFAULT NULL;');
        console.log('Added prerequisite_lesson_id to lessons');
        
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
