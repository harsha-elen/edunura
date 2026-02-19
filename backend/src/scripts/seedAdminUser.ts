import sequelize from '../config/database';
import User, { UserRole } from '../models/User';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Creates the default admin user if one does not already exist.
 * Safe to call on every server startup — skips if admin already present.
 */
export const seedAdminIfNeeded = async (): Promise<void> => {
    const existing = await User.findOne({ where: { role: UserRole.ADMIN } });
    if (existing) {
        console.log('✅ Admin user already exists, skipping seed.');
        return;
    }

    await User.create({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        first_name: 'Admin',
        last_name: 'User',
        role: UserRole.ADMIN,
        phone: '1234567890',
        is_active: true,
        is_verified: true,
    });

    console.log('✅ Default admin user created.');
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('   ⚠️  Change this password immediately after first login!');
};

// ── Standalone usage: ts-node src/scripts/seedAdminUser.ts ──────────────────
if (require.main === module) {
    (async () => {
        try {
            await sequelize.authenticate();
            await seedAdminIfNeeded();
            process.exit(0);
        } catch (error) {
            console.error('❌ Error seeding admin user:', error);
            process.exit(1);
        }
    })();
}
