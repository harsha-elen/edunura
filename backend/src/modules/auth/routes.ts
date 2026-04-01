import { Router } from 'express';
import { sendRegistrationOtp, register, login, getMe, refresh, generate2FA, verify2FA, disable2FA, forgotPassword, resetPassword, verifyEmailDuringLogin } from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public routes
router.post('/register/send-otp', sendRegistrationOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email-login', verifyEmailDuringLogin);
router.post('/refresh', refresh);
router.post('/2fa/verify', verify2FA); // Used for login verify
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/2fa/generate', authenticate, generate2FA);
router.post('/2fa/verify-setup', authenticate, verify2FA); // Same handler for setup
router.post('/2fa/disable', authenticate, disable2FA);

export default router;
