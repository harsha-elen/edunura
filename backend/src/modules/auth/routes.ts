import { Router } from 'express';
import { register, login, getMe, refresh } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes
router.get('/me', authenticate, getMe);

export default router;
