import { Request, Response } from 'express';
import User, { UserRole } from '../../models/User';
import { Op } from 'sequelize';

// Get all teachers
export const getAllTeachers = async (req: Request, res: Response) => {
    try {
        const { search, status } = req.query;

        const whereClause: any = {
            role: UserRole.TEACHER,
        };

        // Add search filter
        if (search) {
            whereClause[Op.or] = [
                { first_name: { [Op.like]: `%${search}%` } },
                { last_name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
            ];
        }

        // Add status filter
        if (status === 'active') {
            whereClause.is_active = true;
        } else if (status === 'inactive') {
            whereClause.is_active = false;
        }

        const teachers = await User.findAll({
            where: whereClause,
            attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] },
            order: [['first_name', 'ASC'], ['last_name', 'ASC']],
        });

        return res.status(200).json({
            status: 'success',
            data: teachers,
        });
    } catch (error: any) {
        console.error('Error fetching teachers:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch teachers',
            error: error.message,
        });
    }
};

// Get single teacher by ID
export const getTeacherById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const teacher = await User.findOne({
            where: {
                id,
                role: UserRole.TEACHER,
            },
            attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] },
        });

        if (!teacher) {
            return res.status(404).json({
                status: 'error',
                message: 'Teacher not found',
            });
        }

        return res.status(200).json({
            status: 'success',
            data: teacher,
        });
    } catch (error: any) {
        console.error('Error fetching teacher:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch teacher',
            error: error.message,
        });
    }
};

// Create new teacher
export const createTeacher = async (req: Request, res: Response) => {
    try {
        const { email, password, first_name, last_name, phone } = req.body;

        // Validation
        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({
                status: 'error',
                message: 'Email, password, first name, and last name are required',
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'Email already exists',
            });
        }

        // Create teacher
        const teacher = await User.create({
            email,
            password,
            first_name,
            last_name,
            phone,
            role: UserRole.TEACHER,
            is_active: req.body.is_active !== undefined ? req.body.is_active : true,
            is_verified: true, // Auto-verify teachers
        });

        // Return teacher without password
        const teacherData = teacher.toJSON();

        return res.status(201).json({
            status: 'success',
            message: 'Teacher created successfully',
            data: teacherData,
        });
    } catch (error: any) {
        console.error('Error creating teacher:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to create teacher',
            error: error.message,
        });
    }
};

// Update teacher
export const updateTeacher = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { email, first_name, last_name, phone, is_active, password } = req.body;

        // Find teacher
        const teacher = await User.findOne({
            where: {
                id,
                role: UserRole.TEACHER,
            },
        });

        if (!teacher) {
            return res.status(404).json({
                status: 'error',
                message: 'Teacher not found',
            });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== teacher.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({
                    status: 'error',
                    message: 'Email already exists',
                });
            }
        }

        // Update fields
        if (email) teacher.email = email;
        if (first_name) teacher.first_name = first_name;
        if (last_name) teacher.last_name = last_name;
        if (phone !== undefined) teacher.phone = phone;
        if (is_active !== undefined) teacher.is_active = is_active;
        if (password) teacher.password = password; // Will be hashed by the model hook

        await teacher.save();

        // Return updated teacher without password
        const teacherData = teacher.toJSON();

        return res.status(200).json({
            status: 'success',
            message: 'Teacher updated successfully',
            data: teacherData,
        });
    } catch (error: any) {
        console.error('Error updating teacher:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to update teacher',
            error: error.message,
        });
    }
};

// Delete teacher
export const deleteTeacher = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Find teacher
        const teacher = await User.findOne({
            where: {
                id,
                role: UserRole.TEACHER,
            },
        });

        if (!teacher) {
            return res.status(404).json({
                status: 'error',
                message: 'Teacher not found',
            });
        }

        // Soft delete - set is_active to false
        teacher.is_active = false;
        await teacher.save();

        // Or hard delete if preferred:
        // await teacher.destroy();

        return res.status(200).json({
            status: 'success',
            message: 'Teacher deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting teacher:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to delete teacher',
            error: error.message,
        });
    }
};

// Get teacher statistics
export const getTeacherStats = async (_req: Request, res: Response) => {
    try {
        const totalTeachers = await User.count({
            where: { role: UserRole.TEACHER },
        });

        const activeTeachers = await User.count({
            where: {
                role: UserRole.TEACHER,
                is_active: true,
            },
        });

        const inactiveTeachers = await User.count({
            where: {
                role: UserRole.TEACHER,
                is_active: false,
            },
        });

        return res.status(200).json({
            status: 'success',
            data: {
                total: totalTeachers,
                active: activeTeachers,
                inactive: inactiveTeachers,
            },
        });
    } catch (error: any) {
        console.error('Error fetching teacher stats:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch teacher statistics',
            error: error.message,
        });
    }
};
