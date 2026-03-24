import nodemailer from 'nodemailer';
import SystemSetting, { SettingCategory } from '../models/SystemSetting';

export const sendEmail = async (to: string, subject: string, html: string) => {
    // Fetch SMTP settings from database
    const emailSettings = await SystemSetting.findAll({
        where: { category: SettingCategory.EMAIL }
    });

    const settingsMap = emailSettings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {} as Record<string, string>);

    if (!settingsMap['email_smtp_host'] || !settingsMap['email_smtp_port']) {
        throw new Error('SMTP configuration is incomplete.');
    }

    const port = parseInt(settingsMap['email_smtp_port']);
    const transporter = nodemailer.createTransport({
        host: settingsMap['email_smtp_host'],
        port: port,
        secure: port === 465, 
        auth: settingsMap['email_smtp_user'] && settingsMap['email_smtp_pass'] ? {
            user: settingsMap['email_smtp_user'],
            pass: settingsMap['email_smtp_pass']
        } : undefined,
        tls: {
            rejectUnauthorized: process.env.NODE_ENV !== 'development'
        }
    });

    return await transporter.sendMail({
        from: `"${settingsMap['email_from_name'] || 'LMS'}" <${settingsMap['email_from_address'] || 'noreply@lms.com'}>`,
        to,
        subject,
        html,
    });
};
