import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import ZoomService from '../services/zoomService';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lms',
    logging: false,
});

async function checkZoomAccount() {
    try {
        console.log('🔍 Checking Zoom account information...\n');

        // Test database connection
        await sequelize.authenticate();

        // Get account info
        const accountInfo = await ZoomService.getAccountInfo();

        console.log('✅ Zoom Account Information:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📧 Email:       ${accountInfo.email}`);
        console.log(`👤 Name:        ${accountInfo.firstName} ${accountInfo.lastName}`);
        console.log(`🎯 Plan Type:   ${accountInfo.planType}`);
        console.log(`🆔 Type Code:   ${accountInfo.type}`);
        console.log(`🏢 Account ID:  ${accountInfo.accountId}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        if (accountInfo.type === 1) {
            console.log('⚠️  WARNING: You are using a Basic (Free) Zoom account.');
            console.log('   Free accounts have the following limitations:');
            console.log('   - Maximum 40 minutes per group meeting');
            console.log('   - Maximum 100 participants');
            console.log('   - No cloud recording');
            console.log('   Consider upgrading to Zoom Pro for LMS usage.\n');
        } else if (accountInfo.type === 2) {
            console.log('✅ SUCCESS: You are using a Pro (Licensed) Zoom account.');
            console.log('   Pro accounts support:');
            console.log('   - Up to 24-hour meetings');
            console.log('   - 100+ participants (depending on plan)');
            console.log('   - Cloud recording');
            console.log('   - Advanced features\n');
        }

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error checking Zoom account:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Ensure Zoom credentials are configured in system_settings table');
        console.error('2. Check zoom_account_id, zoom_client_id, and zoom_client_secret');
        console.error('3. Verify credentials are valid in Zoom Marketplace');
        process.exit(1);
    }
}

checkZoomAccount();
