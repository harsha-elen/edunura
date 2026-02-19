import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import User from '../../models/User';
import fs from 'fs';
import path from 'path';

/**
 * Get admin profile
 * GET /api/admin/profile
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const user = await User.findByPk(userId);

        if (!user) {
            res.status(404).json({ status: 'error', message: 'User not found' });
            return;
        }

        // Return user data without password
        const userData = user.toJSON();

        res.status(200).json({
            status: 'success',
            data: {
                id: userData.id,
                email: userData.email,
                first_name: userData.first_name,
                last_name: userData.last_name,
                phone: userData.phone,
                avatar: userData.avatar,
                role: userData.role,
                bio: userData.bio,
                location: userData.location,
                billing_address: userData.billing_address,
                billing_city: userData.billing_city,
                billing_state: userData.billing_state,
                billing_zip: userData.billing_zip,
                billing_country: userData.billing_country,
                created_at: userData.created_at,
                last_login: userData.last_login,
            },
        });
    } catch (error: any) {
        console.error('Get Profile Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Update admin profile
 * PUT /api/admin/profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const { first_name, last_name, phone, avatar, bio, location, billing_address, billing_city, billing_state, billing_zip, billing_country } = req.body;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const user = await User.findByPk(userId);

        if (!user) {
            res.status(404).json({ status: 'error', message: 'User not found' });
            return;
        }

        // Update fields if provided
        if (first_name !== undefined) user.first_name = first_name.trim();
        if (last_name !== undefined) user.last_name = last_name.trim();
        if (phone !== undefined) user.phone = phone.trim() || null;
        if (avatar !== undefined) user.avatar = avatar.trim() || null;
        
        // Bio and location - only for students (or any role really)
        if (bio !== undefined) user.bio = bio.trim() || null;
        if (location !== undefined) user.location = location.trim() || null;

        // Billing address fields
        if (billing_address !== undefined) user.billing_address = billing_address.trim() || null;
        if (billing_city !== undefined) user.billing_city = billing_city.trim() || null;
        if (billing_state !== undefined) user.billing_state = billing_state.trim() || null;
        if (billing_zip !== undefined) user.billing_zip = billing_zip.trim() || null;
        if (billing_country !== undefined) user.billing_country = billing_country.trim() || null;

        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            data: user.toJSON(),
        });
    } catch (error: any) {
        console.error('Update Profile Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Change password
 * PUT /api/admin/change-password
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        const { current_password, new_password } = req.body;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        // Validation
        if (!current_password || !new_password) {
            res.status(400).json({
                status: 'error',
                message: 'Current password and new password are required',
            });
            return;
        }

        if (new_password.length < 6) {
            res.status(400).json({
                status: 'error',
                message: 'New password must be at least 6 characters long',
            });
            return;
        }

        const user = await User.findByPk(userId);

        if (!user) {
            res.status(404).json({ status: 'error', message: 'User not found' });
            return;
        }

        // Verify current password
        const isPasswordValid = await user.comparePassword(current_password);

        if (!isPasswordValid) {
            res.status(400).json({
                status: 'error',
                message: 'Current password is incorrect',
            });
            return;
        }

        // Update password (will be automatically hashed by User model's beforeUpdate hook)
        user.password = new_password;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password changed successfully',
        });
    } catch (error: any) {
        console.error('Change Password Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to change password',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Upload/Update profile avatar
 * POST /api/profile/upload-avatar
 */
export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ status: 'error', message: 'No file provided' });
            return;
        }

        const user = await User.findByPk(userId);

        if (!user) {
            res.status(404).json({ status: 'error', message: 'User not found' });
            return;
        }

        // Delete old avatar file if exists
        if (user.avatar) {
            const oldAvatarPath = path.join(__dirname, '../../..', user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                try {
                    fs.unlinkSync(oldAvatarPath);
                    console.log('Old avatar deleted:', oldAvatarPath);
                } catch (error) {
                    console.error('Failed to delete old avatar:', error);
                    // Continue even if delete fails
                }
            }
        }

        // Store the avatar path relative to public directory
        const avatarPath = `/uploads/avatars/${req.file.filename}`;
        user.avatar = avatarPath;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Avatar uploaded successfully',
            data: {
                avatar: avatarPath,
            },
        });
    } catch (error: any) {
        console.error('Upload Avatar Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to upload avatar',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

