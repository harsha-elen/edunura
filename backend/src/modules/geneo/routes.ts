import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { generateGenoToken, verifyGenoToken, revokeGenoToken, getOrganizationInfo } from './controller';
import { authenticate, authorize } from '../../middleware/auth';

const geneoPublicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60,
    message: { status: 'error', message: 'Too many requests, please try again later' },
});

const router = Router();

// Public routes (no user auth — called by Geneo's backend)
router.post('/geneo/verify-token', geneoPublicLimiter, verifyGenoToken);
router.get('/geneo/organization-info', geneoPublicLimiter, getOrganizationInfo);

// Authenticated student & teacher routes
router.use(authenticate);
router.post('/geneo/generate-token', authorize('student', 'teacher', 'admin'), generateGenoToken);
router.post('/geneo/revoke-token', authorize('student', 'teacher', 'admin'), revokeGenoToken);

export default router;
