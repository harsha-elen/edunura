import jwt from 'jsonwebtoken';
import User from '../models/User';

interface TokenPayload {
    userId: number;
    email: string;
    role: string;
}

const getAccessSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
    }
    return secret;
};

const getRefreshSecret = (): string => {
    // Use a separate secret for refresh tokens; fall back to access secret + suffix if not set
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (refreshSecret) return refreshSecret;

    const accessSecret = getAccessSecret();
    return accessSecret + '_refresh';
};

export const generateToken = (user: User): string => {
    const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    const secret = getAccessSecret();
    const expiresIn: string | number = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign(payload, secret, { expiresIn } as any);
};

export const generateRefreshToken = (user: User): string => {
    const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    const secret = getRefreshSecret();
    const expiresIn: string | number = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

    return jwt.sign(payload, secret, { expiresIn } as any);
};

export const verifyToken = (token: string): TokenPayload => {
    try {
        const secret = getAccessSecret();
        return jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    try {
        const secret = getRefreshSecret();
        return jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};
