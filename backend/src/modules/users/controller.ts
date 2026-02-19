import { Request, Response } from 'express';
import User, { UserRole } from '../../models/User';
import { Op } from 'sequelize';

// Get all users (admins and moderators only)
export const getUsers = async (req: Request, res: Response) => {
    try {
        const { role, search, page = 1, limit = 10 } = req.query;

        // Build filter
        const where: any = {
            role: {
                [Op.in]: [UserRole.ADMIN, UserRole.MODERATOR]
            }
        };

        // Add role filter if specified
        if (role && (role === 'admin' || role === 'moderator')) {
            where.role = role;
        }

        // Add search filter
        if (search) {
            where[Op.or] = [
                { first_name: { [Op.like]: `%${search}%` } },
                { last_name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        // Calculate pagination
        const offset = (Number(page) - 1) * Number(limit);

        // Fetch users
        const { count, rows: users } = await User.findAndCountAll({
            where,
            limit: Number(limit),
            offset,
            order: [['created_at', 'DESC']],
            attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] }
        });

        return res.json({
            status: 'success',
            data: {
                users,
                pagination: {
                    total: count,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(count / Number(limit))
                }
            }
        });
    } catch (error: any) {
        console.error('Get users error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

// Get single user by ID
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id, {
            attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] }
        });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Only allow viewing admin and moderator users
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied'
            });
        }

        return res.json({
            status: 'success',
            data: user
        });
    } catch (error: any) {
        console.error('Get user error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user',
            error: error.message
        });
    }
};

// Create new user (admin/moderator)
export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, password, first_name, last_name, role, phone } = req.body;

        // Validate required fields
        if (!email || !password || !first_name || !last_name || !role) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields'
            });
        }

        // Validate role (only admin and moderator can be created)
        if (role !== UserRole.ADMIN && role !== UserRole.MODERATOR) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid role. Only admin and moderator roles are allowed'
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'Email already exists'
            });
        }

        // Create user
        const user = await User.create({
            email: email.trim().toLowerCase(),
            password,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            role,
            phone: phone?.trim() || null,
            is_active: true,
            is_verified: true
        });

        // Return user data (password excluded by toJSON)
        return res.status(201).json({
            status: 'success',
            message: 'User created successfully',
            data: user.toJSON()
        });
    } catch (error: any) {
        console.error('Create user error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to create user',
            error: error.message
        });
    }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, phone, is_active, role } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Only allow updating admin and moderator users
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied'
            });
        }

        // Validate role if provided
        if (role && role !== UserRole.ADMIN && role !== UserRole.MODERATOR) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid role. Only admin and moderator roles are allowed'
            });
        }

        // Update user fields
        if (first_name) user.first_name = first_name.trim();
        if (last_name) user.last_name = last_name.trim();
        if (phone !== undefined) user.phone = phone?.trim() || null;
        if (is_active !== undefined) user.is_active = is_active;
        if (role) user.role = role;

        await user.save();

        return res.json({
            status: 'success',
            message: 'User updated successfully',
            data: user.toJSON()
        });
    } catch (error: any) {
        console.error('Update user error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to update user',
            error: error.message
        });
    }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUserId = (req as any).userId;

        // Prevent self-deletion
        if (Number(id) === currentUserId) {
            return res.status(400).json({
                status: 'error',
                message: 'You cannot delete your own account'
            });
        }

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Only allow deleting admin and moderator users
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied'
            });
        }

        await user.destroy();

        return res.json({
            status: 'success',
            message: 'User deleted successfully'
        });
    } catch (error: any) {
        console.error('Delete user error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to delete user',
            error: error.message
        });
    }
};
