import { Sequelize, QueryTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';

export interface Migration {
    name: string;
    timestamp: number;
    executed: boolean;
}

class MigrationRunner {
    private sequelize: Sequelize;
    private migrationsDir: string;
    private migrationsTableName = 'schema_migrations';

    constructor(sequelize: Sequelize) {
        this.sequelize = sequelize;
        this.migrationsDir = path.join(__dirname, '../../database/migrations');
    }

    /**
     * Initialize migrations tracking table
     */
    async initMigrationsTable(): Promise<void> {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS ${this.migrationsTableName} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_migration_name (migration_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        try {
            await this.sequelize.query(createTableSQL);
            console.log('✅ Migrations table initialized.');
        } catch (error) {
            console.error('❌ Failed to initialize migrations table:', error);
            throw error;
        }
    }

    /**
     * Get list of migration files from directory
     */
    async getPendingMigrations(): Promise<Migration[]> {
        try {
            // Check if migrations directory exists
            if (!fs.existsSync(this.migrationsDir)) {
                console.log('ℹ️  No migrations directory found.');
                return [];
            }

            const files = fs.readdirSync(this.migrationsDir)
                .filter(file => file.endsWith('.sql'))
                .sort();

            // Get executed migrations from database
            const executedMigrations = await this.sequelize.query(`
                SELECT migration_name FROM ${this.migrationsTableName}
            `, { type: QueryTypes.SELECT }) as any[];

            const executedNames = new Set(executedMigrations.map(m => m.migration_name));

            const migrations: Migration[] = files.map(file => {
                const timestamp = parseInt(file.split('_')[0]) || 0;
                return {
                    name: file,
                    timestamp,
                    executed: executedNames.has(file)
                };
            });

            return migrations.filter(m => !m.executed);
        } catch (error) {
            console.error('❌ Failed to get pending migrations:', error);
            throw error;
        }
    }

    /**
     * Execute a single migration file
     */
    async executeMigration(migrationName: string): Promise<void> {
        const migrationPath = path.join(this.migrationsDir, migrationName);

        try {
            // Read migration file
            if (!fs.existsSync(migrationPath)) {
                throw new Error(`Migration file not found: ${migrationPath}`);
            }

            const sqlContent = fs.readFileSync(migrationPath, 'utf8');

            // Split into individual statements
            // Remove comments and empty lines
            const cleanedSQL = sqlContent
                .replace(/--[^\n]*/g, '') // Remove single-line comments
                .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

            const statements = cleanedSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0);

            console.log(`🔄 Running migration: ${migrationName} (${statements.length} statements)`);

            // Execute each statement in sequence
            for (let i = 0; i < statements.length; i++) {
                await this.sequelize.query(statements[i]);
                if ((i + 1) % 5 === 0) {
                    console.log(`   └─ Executed ${i + 1}/${statements.length} statements...`);
                }
            }

            // Mark migration as executed
            await this.sequelize.query(`
                INSERT INTO ${this.migrationsTableName} (migration_name)
                VALUES (?)
            `, {
                replacements: [migrationName],
                type: QueryTypes.INSERT
            });

            console.log(`✅ Migration completed: ${migrationName}`);
        } catch (error) {
            console.error(`❌ Migration failed: ${migrationName}`, error);
            throw error;
        }
    }

    /**
     * Run all pending migrations
     */
    async runPendingMigrations(): Promise<void> {
        try {
            // Initialize migrations table if needed
            await this.initMigrationsTable();

            // Get pending migrations
            const pendingMigrations = await this.getPendingMigrations();

            if (pendingMigrations.length === 0) {
                console.log('✅ No pending migrations.');
                return;
            }

            console.log(`\n🔄 Found ${pendingMigrations.length} pending migration(s):`);
            pendingMigrations.forEach((m, idx) => {
                console.log(`   ${idx + 1}. ${m.name}`);
            });
            console.log('');

            // Execute migrations in order
            for (const migration of pendingMigrations) {
                await this.executeMigration(migration.name);
            }

            console.log('\n✅ All migrations completed successfully.\n');
        } catch (error) {
            console.error('\n❌ Migration process failed:', error);
            throw error;
        }
    }

    /**
     * Get migration status
     */
    async getStatus(): Promise<{ pending: Migration[], executed: Migration[] }> {
        try {
            if (!fs.existsSync(this.migrationsDir)) {
                return { pending: [], executed: [] };
            }

            const files = fs.readdirSync(this.migrationsDir)
                .filter(file => file.endsWith('.sql'))
                .sort();

            const executedMigrations = await this.sequelize.query(`
                SELECT migration_name FROM ${this.migrationsTableName}
            `, { type: QueryTypes.SELECT }) as any[];

            const executedNames = new Set(executedMigrations.map(m => m.migration_name));

            const pending: Migration[] = [];
            const executed: Migration[] = [];

            files.forEach(file => {
                const migration: Migration = {
                    name: file,
                    timestamp: parseInt(file.split('_')[0]) || 0,
                    executed: executedNames.has(file)
                };

                if (migration.executed) {
                    executed.push(migration);
                } else {
                    pending.push(migration);
                }
            });

            return { pending, executed };
        } catch (error) {
            console.error('❌ Failed to get migration status:', error);
            return { pending: [], executed: [] };
        }
    }
}

export default MigrationRunner;
