import { Router } from 'express';
import { getSettings, updateSetting, sendTestEmail, uploadFile, checkZoomAccount } from './controller';
import { upload } from '../../config/multer';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Public route to get settings (needed for branding across all portals)
router.get('/', getSettings);

// All routes below require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// Admin route to update settings
router.put('/:key', updateSetting);

// Admin route to send test email
router.post('/test-email', sendTestEmail);

// Admin route to check Zoom account information
router.get('/zoom-account', checkZoomAccount);

// Admin route to upload files (logo/favicon)
router.post('/upload', upload.single('file'), uploadFile);

export default router;

