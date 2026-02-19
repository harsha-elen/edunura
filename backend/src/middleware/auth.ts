import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import User from '../models/User';

export interface AuthRequest extends Request {
    user?: User;
    userId?: number;
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                status: 'error',
                message: 'No token provided',
            });
            return;
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        // Fetch user from database
        const user = await User.findByPk(decoded.userId);

        if (!user || !user.is_active) {
            res.status(401).json({
                status: 'error',
                message: 'User not found or inactive',
            });
            return;
        }

        req.user = user;
        req.userId = user.id;
        next();
    } catch (error) {
        res.status(401).json({
            status: 'error',
            message: 'Invalid or expired token',
        });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                status: 'error',
                message: 'Unauthorized',
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                status: 'error',
                message: 'Forbidden: Insufficient permissions',
            });
            return;
        }

        next();
    };
};
