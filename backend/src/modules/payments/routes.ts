import { Router } from 'express';
import {
    createOrder,
    verifyPayment,
    handleWebhook,
    getPaymentHistory,
    getPaymentConfig,
} from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/webhook', handleWebhook);

router.use(authenticate);

router.post('/create-order/:courseId', createOrder);
router.post('/verify', verifyPayment);
router.get('/history', getPaymentHistory);
router.get('/config', getPaymentConfig);

export default router;
