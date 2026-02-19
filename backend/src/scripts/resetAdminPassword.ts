import sequelize from '../config/database';
import User from '../models/User';

const resetAdminPassword = async () => {
    try {
        console.log('🔄 Resetting admin password...');

        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connection established.');

        // Find admin user
        const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
        
        if (!adminUser) {
            console.log('❌ Admin user not found: admin@example.com');
            process.exit(1);
        }

        // Reset password to admin123
        // The User model's beforeUpdate hook will automatically hash it
        adminUser.password = 'admin123';
        await adminUser.save();

        console.log('✅ Admin password reset successfully!');
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Password: admin123`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting admin password:', error);
        process.exit(1);
    }
};

resetAdminPassword();
