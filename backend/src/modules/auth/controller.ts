import { Request, Response } from 'express';
import User, { UserRole } from '../../models/User';
import EmailOtp from '../../models/EmailOtp';
import { generateToken, generateRefreshToken, verifyRefreshToken, generateTempToken, verifyToken } from '../../utils/jwt';
import { generateSecret, verify, generateURI } from 'otplib';
import QRCode from 'qrcode';
import { sendEmail } from '../../services/emailService';

// Helper to generate a 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendRegistrationOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ status: 'error', message: 'Email is required' });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            res.status(400).json({
                status: 'error',
                message: 'User with this email already exists',
            });
            return;
        }

        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Upsert into email_otps
        const [emailOtp, created] = await EmailOtp.findOrCreate({
            where: { email },
            defaults: { email, otp: otpCode, expires_at: otpExpiresAt }
        });

        if (!created) {
            emailOtp.otp = otpCode;
            emailOtp.expires_at = otpExpiresAt;
            await emailOtp.save();
        }

        try {
            await sendEmail(
                email,
                'Verify your LMS Registration',
                `<h2>Welcome to LMS!</h2>
                <p>Your verification code is: <strong>${otpCode}</strong></p>
                <p>This code will expire in 10 minutes.</p>`
            );
        } catch (emailErr) {
            console.error('Failed to send OTP email:', emailErr);
            res.status(500).json({ status: 'error', message: 'Failed to send OTP email' });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'A verification code has been sent to your email.',
        });
    } catch (error: any) {
        console.error('Send OTP error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send OTP' });
    }
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, first_name, last_name, phone, otp } = req.body;

        // Validate password complexity
        if (!password || password.length < 8) {
            res.status(400).json({
                status: 'error',
                message: 'Password must be at least 8 characters long',
            });
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            res.status(400).json({
                status: 'error',
                message: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character',
            });
            return;
        }

        if (!otp) {
            res.status(400).json({ status: 'error', message: 'OTP is required' });
            return;
        }

        // Verify OTP
        const emailOtp = await EmailOtp.findOne({ where: { email } });
        if (!emailOtp || emailOtp.otp !== String(otp)) {
            res.status(400).json({ status: 'error', message: 'Invalid or missing OTP' });
            return;
        }

        if (new Date() > emailOtp.expires_at) {
            res.status(400).json({ status: 'error', message: 'Verification OTP has expired' });
            return;
        }

        // OTP Validated! Now create the user exactly once.
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            res.status(400).json({ status: 'error', message: 'User with this email already exists' });
            return;
        }

        const user = await User.create({
            email,
            password,
            first_name,
            last_name,
            role: UserRole.STUDENT,
            phone,
            is_active: true,
            is_verified: true, // Mark verified immediately since OTP is good
        });

        // Clean up OTP
        await emailOtp.destroy();

        // Generate tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                token,
                refreshToken,
                user: user.toJSON(),
            },
        });
    } catch (error: any) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Registration failed',
        });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, portal } = req.body; // portal: 'admin', 'teacher', 'student'

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid email or password',
            });
            return;
        }

        // Check if user is active
        if (!user.is_active) {
            res.status(403).json({
                status: 'error',
                message: 'Account is deactivated',
            });
            return;
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid email or password',
            });
            return;
        }

        // Check if user has access to the requested portal
        if (portal) {
            const requiredRole = portal as UserRole;

            // For admin portal, check admin or moderator roles
            if (portal === 'admin') {
                const hasAdminAccess = user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR;
                if (!hasAdminAccess) {
                    res.status(403).json({
                        status: 'error',
                        message: 'Access denied. Admin or moderator credentials required.',
                    });
                    return;
                }
            } else {
                // For teacher/student portals, check specific role
                if (user.role !== requiredRole) {
                    res.status(403).json({
                        status: 'error',
                        message: `Access denied. ${portal} credentials required.`,
                    });
                    return;
                }
            }
        }

        // Handle 2FA if enabled
        if (user.is_two_factor_enabled) {
            const tempToken = generateTempToken(user);
            res.status(200).json({
                status: 'success',
                message: '2FA verification required',
                data: {
                    requires2FA: true,
                    tempToken,
                },
            });
            return;
        }

        // Before logging in, ensure they are verified if they are a student or teacher
        if (!user.is_verified && (user.role === UserRole.STUDENT || user.role === UserRole.TEACHER)) {
            // Send OTP for email verification
            const otpCode = generateOTP();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Store OTP in reset_password fields temporarily for verification
            user.reset_password_token = otpCode;
            user.reset_password_expires = otpExpiresAt;
            await user.save();

            try {
                await sendEmail(
                    user.email,
                    'Email Verification Required - LMS',
                    `<h2>Email Verification Required</h2>
                    <p>Your account needs email verification to proceed. Your verification code is: <strong>${otpCode}</strong></p>
                    <p>This code will expire in 10 minutes.</p>`
                );
            } catch (emailErr) {
                console.error('Failed to send verification email:', emailErr);
                res.status(500).json({ status: 'error', message: 'Failed to send verification email' });
                return;
            }

            res.status(200).json({
                status: 'success',
                message: 'Email verification required',
                data: {
                    requiresEmailVerification: true,
                    email: user.email,
                    userId: user.id,
                },
            });
            return;
        }

        // Update last login
        user.last_login = new Date();
        await user.save();

        // Generate tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                token,
                refreshToken,
                user: user.toJSON(),
            },
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Login failed',
        });
    }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
    try {
        const user = await User.findByPk(req.userId);

        if (!user) {
            res.status(404).json({
                status: 'error',
                message: 'User not found',
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: user.toJSON(),
            },
        });
    } catch (error: any) {
        console.error('Get me error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user data',
        });
    }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = req.body?.refreshToken;

        if (!refreshToken) {
            res.status(400).json({
                status: 'error',
                message: 'Refresh token is required',
            });
            return;
        }

        const decoded = verifyRefreshToken(refreshToken);
        const user = await User.findByPk(decoded.userId);

        if (!user || !user.is_active) {
            res.status(401).json({
                status: 'error',
                message: 'Invalid refresh token',
            });
            return;
        }

        const newAccessToken = generateToken(user);
        const newRefreshToken = generateRefreshToken(user);

        res.status(200).json({
            status: 'success',
            message: 'Token refreshed successfully',
            data: {
                token: newAccessToken,
                refreshToken: newRefreshToken,
                user: user.toJSON(),
            },
        });
    } catch (error: any) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            status: 'error',
            message: 'Invalid or expired refresh token',
        });
    }
};

export const generate2FA = async (req: any, res: Response): Promise<void> => {
    try {
        const user = await User.findByPk(req.userId);
        if (!user) {
            res.status(404).json({ status: 'error', message: 'User not found' });
            return;
        }

        const secret = generateSecret();
        user.setDataValue('two_factor_secret', secret);
        await user.save();

        const otpauth = generateURI({
            issuer: 'Edunura LMS',
            label: user.email,
            secret,
        });
        const qrCodeUrl = await QRCode.toDataURL(otpauth);

        res.status(200).json({
            status: 'success',
            data: {
                secret,
                qrCodeUrl,
            },
        });
    } catch (error: any) {
        console.error('Generate 2FA error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to generate 2FA' });
    }
};

export const verify2FA = async (req: any, res: Response): Promise<void> => {
    try {
        const { code, tempToken } = req.body;

        if (!code) {
            res.status(400).json({ status: 'error', message: 'Verification code is required' });
            return;
        }

        let userId = req.userId; // From authenticate middleware (Setup Mode)
        
        // Login Mode: verify using temporary token
        if (tempToken) {
            try {
                const decoded = verifyToken(tempToken);
                if (!decoded.isTemp) {
                    res.status(401).json({ status: 'error', message: 'Invalid token type' });
                    return;
                }
                userId = decoded.userId;
            } catch (err) {
                res.status(401).json({ status: 'error', message: 'Invalid or expired temporary token' });
                return;
            }
        }

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Authentication required' });
            return;
        }

        const user = await User.findByPk(userId);
        if (!user || !user.two_factor_secret) {
            res.status(400).json({ status: 'error', message: '2FA is not set up for this user' });
            return;
        }

        // Verify the code
        const verificationResult = await verify({ token: code, secret: user.two_factor_secret });
        
        if (!verificationResult.valid) {
            res.status(400).json({ status: 'error', message: 'Invalid verification code' });
            return;
        }

        // Setup Mode: activate 2FA if not enabled yet
        if (!user.is_two_factor_enabled) {
            user.is_two_factor_enabled = true;
            await user.save();
        }

        // If from login mode, update last login and generate permanent tokens
        if (tempToken) {
            user.last_login = new Date();
            await user.save();

            const token = generateToken(user);
            const refreshToken = generateRefreshToken(user);

            res.status(200).json({
                status: 'success',
                message: 'Login successful',
                data: {
                    token,
                    refreshToken,
                    user: user.toJSON(),
                },
            });
            return;
        }

        res.status(200).json({ status: 'success', message: '2FA verified successfully' });

    } catch (error: any) {
        console.error('Verify 2FA error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to verify 2FA' });
    }
};

export const disable2FA = async (req: any, res: Response): Promise<void> => {
    try {
        const { code } = req.body;

        if (!code) {
            res.status(400).json({ status: 'error', message: 'Verification code is required to disable 2FA' });
            return;
        }

        const user = await User.findByPk(req.userId);
        if (!user || !user.two_factor_secret) {
            res.status(404).json({ status: 'error', message: 'User or 2FA setup not found' });
            return;
        }

        const verificationResult = await verify({ token: code, secret: user.two_factor_secret });

        if (!verificationResult.valid) {
            res.status(400).json({ status: 'error', message: 'Invalid verification code' });
            return;
        }

        user.is_two_factor_enabled = false;
        user.setDataValue('two_factor_secret', null as any);
        await user.save();

        res.status(200).json({ status: 'success', message: '2FA disabled successfully' });
    } catch (error: any) {
        console.error('Disable 2FA error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to disable 2FA' });
    }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ status: 'error', message: 'Email is required' });
            return;
        }

        const user = await User.findOne({ where: { email } });
        
        // We always return success to prevent email enumeration, but conditionally send the email.
        if (user && user.is_active) {
            const otpCode = generateOTP();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            user.reset_password_token = otpCode;
            user.reset_password_expires = otpExpiresAt;
            await user.save();

            try {
                await sendEmail(
                    email,
                    'Password Reset Request - LMS',
                    `<h2>Password Reset Request</h2>
                    <p>We received a request to reset your password. Your password reset code is: <strong>${otpCode}</strong></p>
                    <p>This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>`
                );
            } catch (emailErr) {
                console.error('Failed to send forgot password email:', emailErr);
            }
        }

        res.status(200).json({
            status: 'success',
            message: 'If an active account with that email exists, a password reset code has been sent.',
        });
    } catch (error: any) {
        console.error('Forgot password error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to process forgot password request' });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            res.status(400).json({ status: 'error', message: 'Email, OTP, and new password are required' });
            return;
        }

        if (newPassword.length < 8) {
            res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters long' });
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            res.status(400).json({
                status: 'error',
                message: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character',
            });
            return;
        }

        const user = await User.findOne({ where: { email } });

        if (!user || user.reset_password_token !== String(otp)) {
            res.status(400).json({ status: 'error', message: 'Invalid or missing OTP' });
            return;
        }

        if (!user.reset_password_expires || new Date() > user.reset_password_expires) {
            res.status(400).json({ status: 'error', message: 'Password reset code has expired' });
            return;
        }

        // OTP is valid, safely update password
        user.password = newPassword;
        user.reset_password_token = undefined;
        user.reset_password_expires = undefined;
        user.setDataValue('reset_password_token', null as any);
        user.setDataValue('reset_password_expires', null as any);
        
        // This will trigger the User.beforeUpdate hook which hashes the new password
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Your password has been reset successfully. You can now log in.',
        });
    } catch (error: any) {
        console.error('Reset password error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to reset password' });
    }
};

export const verifyEmailDuringLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            res.status(400).json({ status: 'error', message: 'Email and OTP are required' });
            return;
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            res.status(404).json({ status: 'error', message: 'User not found' });
            return;
        }

        // Check OTP
        if (user.reset_password_token !== String(otp)) {
            res.status(400).json({ status: 'error', message: 'Invalid or missing OTP' });
            return;
        }

        if (!user.reset_password_expires || new Date() > user.reset_password_expires) {
            res.status(400).json({ status: 'error', message: 'Verification code has expired' });
            return;
        }

        // Mark user as verified
        user.is_verified = true;
        user.reset_password_token = null as any;
        user.reset_password_expires = null as any;
        user.setDataValue('reset_password_token', null as any);
        user.setDataValue('reset_password_expires', null as any);
        user.last_login = new Date();
        await user.save();

        // Generate tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        res.status(200).json({
            status: 'success',
            message: 'Email verified successfully',
            data: {
                token,
                refreshToken,
                user: user.toJSON(),
            },
        });
    } catch (error: any) {
        console.error('Email verification error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to verify email',
        });
    }
};
