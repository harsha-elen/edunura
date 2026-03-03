import { Router } from 'express';
import { body } from 'express-validator';
import { createLiveClass, updateLiveClass, getLiveClassesByCourse, deleteLiveClass, getZoomSignature, getJitsiConfig, getAllLiveClasses, getLiveClassStatus, endLiveSession, hostHeartbeat, getJitsiBranding } from './controller';
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

// Public branding endpoint — fetched by Jitsi browser client (no auth headers sent)
// Must be registered BEFORE router.use(authenticate)
router.get('/branding', getJitsiBranding);

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

router.get(
    '/:id/jitsi-config',
    // Allow authenticated users to get jitsi config
    getJitsiConfig
);

router.get(
    '/:id/status',
    // Students poll this to check if host has joined yet
    getLiveClassStatus
);

router.post(
    '/:id/heartbeat',
    // Host pings every 15s while in meeting; isLive expires after 35s of silence
    authorize('admin', 'teacher', 'moderator'),
    hostHeartbeat
);

router.post(
    '/:id/end-session',
    // Best-effort: host explicitly ends, resets immediately without waiting 35s
    authorize('admin', 'teacher', 'moderator'),
    endLiveSession
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
