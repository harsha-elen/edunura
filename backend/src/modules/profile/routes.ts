import express from 'express';
import { getProfile, updateProfile, changePassword, uploadAvatar } from './controller';
import { authenticate } from '../../middleware/auth';
import { uploadAvatar as uploadAvatarMiddleware } from '../../config/multer-avatar';

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

// Get profile
router.get('/', getProfile);

// Update profile
router.put('/', updateProfile);

// Change password
router.put('/change-password', changePassword);

// Upload avatar
router.post('/upload-avatar', uploadAvatarMiddleware.single('avatar'), uploadAvatar);

export default router;

