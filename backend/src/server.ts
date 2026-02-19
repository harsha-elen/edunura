import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import { connectDatabase } from './config/database';
import authRoutes from './modules/auth/routes';
import profileRoutes from './modules/profile/routes';
import usersRoutes from './modules/users/routes';
import settingsRoutes from './modules/settings/routes';
import teachersRoutes from './modules/teachers/routes';
import studentsRoutes from './modules/students/routes';
import categoriesRoutes from './modules/categories/routes';
import courseRoutes from './modules/courses/routes';
import liveClassRoutes from './modules/live-classes/routes';
import enrollmentRoutes from './modules/enrollments/routes';
import paymentRoutes from './modules/payments/routes';
import { initializeAssociations } from './models';
import { seedAdminIfNeeded } from './scripts/seedAdminUser';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// CORS middleware - must be first to apply to all routes including static files
// Origins are derived from DOMAIN + STUDENT_BASE_PATH — no need to set them individually
const _domain = process.env.DOMAIN || '';
const _studentBasePath = process.env.STUDENT_BASE_PATH || '/';
const _studentOrigin = _studentBasePath === '/'
    ? (_domain ? `https://app.${_domain}` : '')   // subdomain mode: app.domain.com
    : (_domain ? `https://${_domain}` : '');       // path mode: domain.com/app (origin = domain)

app.use(cors({
    origin: [
        'http://localhost:3000', // Student (legacy)
        'http://localhost:3001', // Admin
        'http://localhost:3002', // Teacher
        'http://localhost:3003', // Student
        'http://localhost:3004', // Student (alternate)
        _domain ? `https://${_domain}` : '',           // landing
        _domain ? `https://admin.${_domain}` : '',     // admin
        _domain ? `https://teacher.${_domain}` : '',   // teacher
        _studentOrigin,                                 // student
    ].filter(Boolean),
    credentials: true,
}));

// Serve static files from uploads directory - before helmet for proper CORS
// TODO (Production): Add token-based auth for course content (videos, PDFs) to prevent
// unauthorized access to paid content. This requires frontend changes to append ?token= to media URLs.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Security middleware - configure helmet to not block our static assets
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Strict rate limiting for authentication endpoints (brute force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 login attempts per window
    message: 'Too many login attempts. Please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware for HttpOnly cookies
app.use(cookieParser());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'LMS Backend is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/live-classes', liveClassRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', enrollmentRoutes);

app.get('/api', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'LMS API v1.0',
        modules: [
            'Authentication',
            'User Management',
            'Course Management',
            'Content Management',
            'Live Classes (Zoom)',
            'Payments (Razorpay)',
            'Enrollment',
            'Assessment',
            'Notifications',
            'Reporting',
            'Discussion',
        ],
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
    });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
});

// Start server
const startServer = async () => {
    try {
        // Initialize associations
        initializeAssociations();

        // Connect to database
        await connectDatabase();

        // Seed default admin user if no admin exists yet
        await seedAdminIfNeeded();

        // Start listening
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
            console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
