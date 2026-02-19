import { Request, Response } from 'express';
import SystemSetting, { SettingCategory } from '../../models/SystemSetting';
import nodemailer from 'nodemailer';
import ZoomService from '../../services/zoomService';
import jwt from 'jsonwebtoken';

export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'No file uploaded'
            });
        }

        const { fieldType } = req.body; // 'logo' or 'favicon'
        const filePath = `/uploads/assets/site-settings/${req.file.filename}`;

        // Save to database
        const key = fieldType === 'favicon' ? 'site_favicon' : 'org_logo';
        const [setting, created] = await SystemSetting.findOrCreate({
            where: { key },
            defaults: {
                key,
                value: filePath,
                category: SettingCategory.ORGANIZATION,
                description: fieldType === 'favicon' ? 'Site Favicon' : 'Organization Logo',
                is_encrypted: false
            }
        });

        if (!created) {
            setting.value = filePath;
            await setting.save();
        }

        return res.status(200).json({
            status: 'success',
            message: 'File uploaded successfully',
            data: {
                path: filePath,
                fileName: req.file.filename
            }
        });
    } catch (error: any) {
        console.error('File upload error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to upload file'
        });
    }
};

export const getSettings = async (req: Request, res: Response) => {
    try {
        const { category } = req.query;
        const whereClause: any = {};
        if (category && typeof category === 'string') {
            whereClause.category = category;
        }

        const settings = await SystemSetting.findAll({ where: whereClause });

        // Sensitive keys that should never be exposed to unauthenticated users
        const sensitiveKeys = [
            'razorpay_key_secret', 'razorpay_webhook_secret',
            'email_smtp_pass', 'email_smtp_user',
            'zoom_client_secret', 'zoom_client_id',
        ];

        // Check if request is authenticated (manually check header since route is public)
        let isAuthenticated = false;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                // Verify token using the same secret as auth middleware
                const secret = process.env.JWT_SECRET;
                if (secret) {
                    jwt.verify(token, secret);
                    isAuthenticated = true;
                }
            } catch (err) {
                // Token invalid or expired - treat as unauthenticated
                isAuthenticated = false;
            }
        }

        // Convert to key-value pair, filtering sensitive keys for unauthenticated requests
        const settingsMap = settings.reduce((acc, setting) => {
            if (!isAuthenticated && sensitiveKeys.includes(setting.key)) {
                return acc; // Skip sensitive keys for public requests
            }
            // Mask sensitive keys for authenticated users if they have a value
            if (isAuthenticated && sensitiveKeys.includes(setting.key) && setting.value) {
                acc[setting.key] = '********';
            } else {
                acc[setting.key] = setting.value;
            }
            return acc;
        }, {} as Record<string, string>);

        res.status(200).json({
            status: 'success',
            data: settingsMap
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch settings'
        });
    }
};

export const updateSetting = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value, category, description } = req.body;

        if (value === undefined || value === null || !category) {
            return res.status(400).json({
                status: 'error',
                message: 'Value and category are required'
            });
        }

        // If value is the mask, do not update
        if (value === '********') {
            return res.status(200).json({
                status: 'success',
                message: 'Setting unchanged',
            });
        }

        const [setting, created] = await SystemSetting.findOrCreate({
            where: { key },
            defaults: {
                key,
                value: String(value),
                category: category as SettingCategory,
                description,
                is_encrypted: false
            }
        });

        if (!created) {
            setting.value = String(value);
            if (description) setting.description = description;
            await setting.save();
        }

        return res.status(200).json({
            status: 'success',
            data: setting
        });
    } catch (error: any) {
        console.error('Update setting error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to update setting'
        });
    }
};

export const sendTestEmail = async (req: Request, res: Response) => {
    try {
        const { toEmail } = req.body;

        if (!toEmail) {
            return res.status(400).json({
                status: 'error',
                message: 'Recipient email address is required'
            });
        }

        // Fetch SMTP settings from database
        const emailSettings = await SystemSetting.findAll({
            where: { category: SettingCategory.EMAIL }
        });

        const settingsMap = emailSettings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {} as Record<string, string>);

        // Validate required SMTP settings
        if (!settingsMap['email_smtp_host'] || !settingsMap['email_smtp_port']) {
            return res.status(400).json({
                status: 'error',
                message: 'SMTP configuration is incomplete. Please configure SMTP settings first.'
            });
        }

        // Create transporter
        const port = parseInt(settingsMap['email_smtp_port']);
        const transporter = nodemailer.createTransport({
            host: settingsMap['email_smtp_host'],
            port: port,
            secure: port === 465, // true for port 465 (SSL), false for other ports (587 uses STARTTLS)
            auth: settingsMap['email_smtp_user'] && settingsMap['email_smtp_pass'] ? {
                user: settingsMap['email_smtp_user'],
                pass: settingsMap['email_smtp_pass']
            } : undefined,
            tls: {
                rejectUnauthorized: process.env.NODE_ENV !== 'development' // Only allow self-signed in development
            }
        });

        // Send test email
        const info = await transporter.sendMail({
            from: `"${settingsMap['email_from_name'] || 'LMS'}" <${settingsMap['email_from_address'] || 'noreply@lms.com'}>`,
            to: toEmail,
            subject: 'Test Email from LMS',
            text: 'This is a test email to verify your SMTP configuration.',
            html: '<p>This is a test email to verify your SMTP configuration.</p><p>If you received this, your email settings are working correctly!</p>'
        });

        return res.status(200).json({
            status: 'success',
            message: 'Test email sent successfully!',
            data: {
                messageId: info.messageId
            }
        });
    } catch (error: any) {
        console.error('Email send error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to send test email. Please check your SMTP settings.'
        });
    }
};

export const checkZoomAccount = async (_req: Request, res: Response) => {
    try {
        const accountInfo = await ZoomService.getAccountInfo();

        return res.status(200).json({
            status: 'success',
            message: 'Zoom account information retrieved successfully',
            data: accountInfo
        });
    } catch (error: any) {
        console.error('Zoom account check error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to check Zoom account. Please verify your Zoom configuration.'
        });
    }
};

