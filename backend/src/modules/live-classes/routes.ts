import { Router } from 'express';
import { body } from 'express-validator';
import { createLiveClass, updateLiveClass, getLiveClassesByCourse, deleteLiveClass, getZoomSignature, getAllLiveClasses } from './controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Validation Rules
const createLiveClassValidation = [
    body('course_id').notEmpty().withMessage('Course ID is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('start_time').notEmpty().withMessage('Start time is required').isISO8601().withMessage('Invalid date format'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
];

const updateLiveClassValidation = [
    body('title').notEmpty().withMessage('Title is required'),
    body('start_time').optional(),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
];

// Routes
router.use(authenticate); // Protect all routes

router.post(
    '/',
    authorize('admin', 'teacher', 'moderator'),
    createLiveClassValidation,
    createLiveClass
);

router.get(
    '/course/:courseId',
    // Allow all authenticated users (including students) to view classes
    getLiveClassesByCourse
);

router.get(
    '/all',
    // Allow all authenticated users with valid role check in controller
    getAllLiveClasses
);

router.get(
    '/:id/join-token',
    // Allow authenticated users to get zoom signature
    getZoomSignature
);

router.put(
    '/:lessonId',
    authorize('admin', 'teacher', 'moderator'),
    updateLiveClassValidation,
    updateLiveClass
);

router.delete(
    '/:id',
    authorize('admin', 'teacher', 'moderator'),
    deleteLiveClass
);

export default router;
