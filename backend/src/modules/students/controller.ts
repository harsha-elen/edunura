import { Request, Response } from 'express';
import User, { UserRole } from '../../models/User';
import Enrollment from '../../models/Enrollment';
import sequelize from '../../config/database';
import { Op, QueryTypes } from 'sequelize';

// Get all students
export const getAllStudents = async (req: Request, res: Response) => {
    try {
        const { search, status } = req.query;

        const whereClause: any = {
            role: UserRole.STUDENT,
        };

        if (search) {
            whereClause[Op.or] = [
                { first_name: { [Op.like]: `%${search}%` } },
                { last_name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
            ];
        }

        if (status === 'active') {
            whereClause.is_active = true;
        } else if (status === 'inactive') {
            whereClause.is_active = false;
        }

        const students = await User.findAll({
            where: whereClause,
            attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] },
            order: [['created_at', 'DESC']],
        });

        return res.status(200).json({
            status: 'success',
            data: students,
        });
    } catch (error: any) {
        console.error('Error fetching students:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch students',
            error: error.message,
        });
    }
};

// Get single student by ID
export const getStudentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const student = await User.findOne({
            where: {
                id,
                role: UserRole.STUDENT,
            },
            attributes: { exclude: ['password', 'reset_password_token', 'reset_password_expires'] },
        });

        if (!student) {
            return res.status(404).json({
                status: 'error',
                message: 'Student not found',
            });
        }

        return res.status(200).json({
            status: 'success',
            data: student,
        });
    } catch (error: any) {
        console.error('Error fetching student:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch student',
            error: error.message,
        });
    }
};

// Create new student
export const createStudent = async (req: Request, res: Response) => {
    try {
        const { email, password, first_name, last_name, phone, is_active } = req.body;

        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({
                status: 'error',
                message: 'Email, password, first name, and last name are required',
            });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'Email already exists',
            });
        }

        const student = await User.create({
            email,
            password,
            first_name,
            last_name,
            phone,
            role: UserRole.STUDENT,
            is_active: is_active !== undefined ? is_active : true,
            is_verified: true,
        });

        const studentData = student.toJSON();

        return res.status(201).json({
            status: 'success',
            message: 'Student created successfully',
            data: studentData,
        });
    } catch (error: any) {
        console.error('Error creating student:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to create student',
            error: error.message,
        });
    }
};

// Update student
export const updateStudent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { email, first_name, last_name, phone, is_active, password } = req.body;

        const student = await User.findOne({
            where: {
                id,
                role: UserRole.STUDENT,
            },
        });

        if (!student) {
            return res.status(404).json({
                status: 'error',
                message: 'Student not found',
            });
        }

        if (email && email !== student.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({
                    status: 'error',
                    message: 'Email already exists',
                });
            }
        }

        if (email) student.email = email;
        if (first_name) student.first_name = first_name;
        if (last_name) student.last_name = last_name;
        if (phone !== undefined) student.phone = phone;
        if (is_active !== undefined) student.is_active = is_active;
        if (password) student.password = password;

        await student.save();

        const studentData = student.toJSON();

        return res.status(200).json({
            status: 'success',
            message: 'Student updated successfully',
            data: studentData,
        });
    } catch (error: any) {
        console.error('Error updating student:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to update student',
            error: error.message,
        });
    }
};

// Delete student
export const deleteStudent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'soft' or 'permanent'

        const student = await User.findOne({
            where: {
                id,
                role: UserRole.STUDENT,
            },
        });

        if (!student) {
            return res.status(404).json({
                status: 'error',
                message: 'Student not found',
            });
        }

        if (type === 'permanent') {
            // Delete enrollments first
            await Enrollment.destroy({
                where: { student_id: student.id }
            });
            // Delete lesson progress
            await sequelize.query(
                `DELETE FROM lesson_progress WHERE student_id = ${student.id}`,
                { type: QueryTypes.DELETE }
            ).catch(() => {}); // Ignore if table doesn't exist
            await student.destroy();
            return res.status(200).json({
                status: 'success',
                message: 'Student permanently deleted successfully',
            });
        } else {
            student.is_active = false;
            await student.save();
            return res.status(200).json({
                status: 'success',
                message: 'Student deactivated successfully',
            });
        }
    } catch (error: any) {
        console.error('Error deleting student:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to delete student',
            error: error.message,
        });
    }
};

// Get student statistics
export const getStudentStats = async (_req: Request, res: Response) => {
    try {
        const totalStudents = await User.count({
            where: { role: UserRole.STUDENT },
        });

        const activeStudents = await User.count({
            where: {
                role: UserRole.STUDENT,
                is_active: true,
            },
        });

        const inactiveStudents = await User.count({
            where: {
                role: UserRole.STUDENT,
                is_active: false,
            },
        });

        return res.status(200).json({
            status: 'success',
            data: {
                total: totalStudents,
                active: activeStudents,
                inactive: inactiveStudents,
            },
        });
    } catch (error: any) {
        console.error('Error fetching student stats:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch student statistics',
            error: error.message,
        });
    }
};
