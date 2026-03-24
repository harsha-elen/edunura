import sequelize from '../config/database';
import MigrationRunner from '../utils/migrationRunner';

const run = async () => {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        const runner = new MigrationRunner(sequelize);
        await runner.runPendingMigrations();

        console.log('Migrations completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

run();
