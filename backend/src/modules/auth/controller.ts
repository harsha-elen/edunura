import { Request, Response } from 'express';
import User, { UserRole } from '../../models/User';
import { generateToken, generateRefreshToken } from '../../utils/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, first_name, last_name, phone } = req.body;

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
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            });
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

        // Create new user — always force STUDENT role on public registration
        // Admin/teacher accounts must be created by an admin via the admin panel
        const user = await User.create({
            email,
            password,
            first_name,
            last_name,
            role: UserRole.STUDENT,
            phone,
            is_active: true,
            is_verified: false,
        });

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
