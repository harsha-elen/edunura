import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import Payment, { PaymentStatus } from '../../models/Payment';
import Enrollment, { EnrollmentStatus } from '../../models/Enrollment';
import Course from '../../models/Course';
import User from '../../models/User';
import razorpayService from '../../services/razorpayService';
import SystemSetting from '../../models/SystemSetting';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        const userId = req.userId;
        const courseIdNum = parseInt(courseId);

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (isNaN(courseIdNum)) {
            res.status(400).json({ status: 'error', message: 'Invalid course ID' });
            return;
        }

        const isEnabled = await razorpayService.isEnabled();
        if (!isEnabled) {
            res.status(400).json({ status: 'error', message: 'Payment gateway is not configured' });
            return;
        }

        const course = await Course.findByPk(courseIdNum);
        if (!course) {
            res.status(404).json({ status: 'error', message: 'Course not found' });
            return;
        }

        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).json({ status: 'error', message: 'User not found' });
            return;
        }

        const existingEnrollment = await Enrollment.findOne({
            where: { course_id: courseIdNum, student_id: userId },
        });

        if (existingEnrollment) {
            res.status(400).json({
                status: 'error',
                message: 'Already enrolled in this course',
                data: { already_enrolled: true },
            });
            return;
        }

        const amount = course.discounted_price ?? course.price;
        if (!amount || amount <= 0) {
            res.status(400).json({ status: 'error', message: 'This course is free or invalid price' });
            return;
        }

        const amountInPaise = Math.round(amount * 100);

        const order = await razorpayService.createOrder({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `course_${courseIdNum}_user_${userId}_${Date.now()}`,
            notes: {
                course_id: courseIdNum.toString(),
                user_id: userId.toString(),
                course_title: course.title,
                user_email: user.email,
            },
        });

        await Payment.create({
            order_id: order.id,
            user_id: userId,
            course_id: courseIdNum,
            amount: order.amount,
            currency: order.currency,
            status: PaymentStatus.PENDING,
            receipt: order.receipt,
        });

        const keyId = await razorpayService.getKeyId();

        res.status(200).json({
            status: 'success',
            data: {
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                key_id: keyId,
                course: {
                    id: course.id,
                    title: course.title,
                    price: amount,
                },
                user: {
                    id: user.id,
                    name: `${user.first_name} ${user.last_name}`,
                    email: user.email,
                },
            },
        });
    } catch (error: any) {
        console.error('Create payment order error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to create payment order',
        });
    }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { order_id, payment_id, signature } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        if (!order_id || !payment_id || !signature) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required fields: order_id, payment_id, signature',
            });
            return;
        }

        const isValidSignature = await razorpayService.verifyPaymentSignature({
            order_id,
            payment_id,
            signature,
        });

        if (!isValidSignature) {
            const payment = await Payment.findOne({ where: { order_id } });
            if (payment) {
                payment.status = PaymentStatus.FAILED;
                payment.error_message = 'Invalid signature';
                await payment.save();
            }

            res.status(400).json({ status: 'error', message: 'Invalid payment signature' });
            return;
        }

        const payment = await Payment.findOne({ where: { order_id, user_id: userId } });
        if (!payment) {
            res.status(404).json({ status: 'error', message: 'Payment not found or does not belong to you' });
            return;
        }

        if (payment.status === PaymentStatus.COMPLETED) {
            res.status(400).json({ status: 'error', message: 'Payment already completed' });
            return;
        }

        payment.payment_id = payment_id;
        payment.razorpay_signature = signature;
        payment.status = PaymentStatus.COMPLETED;
        await payment.save();

        const enrollment = await Enrollment.create({
            course_id: payment.course_id,
            student_id: payment.user_id,
            status: EnrollmentStatus.ACTIVE,
            enrollment_date: new Date(),
            progress_percentage: 0,
        });

        await Course.increment('total_enrollments', {
            where: { id: payment.course_id },
        });

        res.status(200).json({
            status: 'success',
            message: 'Payment verified successfully',
            data: {
                payment_id,
                order_id,
                enrollment_id: enrollment.id,
                course_id: payment.course_id,
            },
        });
    } catch (error: any) {
        console.error('Verify payment error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to verify payment',
        });
    }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get client IP (handle proxies)
        const clientIP = req.ip || req.socket.remoteAddress || '';
        const forwardedFor = req.headers['x-forwarded-for'] as string;
        const clientIPFinal = forwardedFor ? forwardedFor.split(',')[0].trim() : clientIP;

        // Log webhook requests for security monitoring
        if (process.env.NODE_ENV === 'production' && clientIPFinal) {
            console.log(`[Webhook] Request from IP: ${clientIPFinal}`);
        }

        const signature = req.headers['x-razorpay-signature'] as string;
        const webhookSecret = await getWebhookSecret();

        if (!signature || !webhookSecret) {
            res.status(400).json({ status: 'error', message: 'Missing signature or webhook secret' });
            return;
        }

        const isValid = razorpayService.verifyWebhookSignature(
            JSON.stringify(req.body),
            signature,
            webhookSecret
        );

        if (!isValid) {
            res.status(400).json({ status: 'error', message: 'Invalid webhook signature' });
            return;
        }

        const event = req.body.event;
        const payload = req.body.payload;

        console.log(`[Razorpay Webhook] Event: ${event}`);

        switch (event) {
            case 'payment.captured': {
                const paymentEntity = payload.payment.entity;
                const orderId = paymentEntity.order_id;
                const paymentId = paymentEntity.id;

                const payment = await Payment.findOne({ where: { order_id: orderId } });
                if (payment && payment.status !== PaymentStatus.COMPLETED) {
                    payment.payment_id = paymentId;
                    payment.status = PaymentStatus.COMPLETED;
                    await payment.save();

                    const existingEnrollment = await Enrollment.findOne({
                        where: { course_id: payment.course_id, student_id: payment.user_id },
                    });

                    if (!existingEnrollment) {
                        await Enrollment.create({
                            course_id: payment.course_id,
                            student_id: payment.user_id,
                            status: EnrollmentStatus.ACTIVE,
                            enrollment_date: new Date(),
                            progress_percentage: 0,
                        });

                        await Course.increment('total_enrollments', {
                            where: { id: payment.course_id },
                        });
                    }
                }
                break;
            }

            case 'payment.failed': {
                const paymentEntity = payload.payment.entity;
                const orderId = paymentEntity.order_id;

                const payment = await Payment.findOne({ where: { order_id: orderId } });
                if (payment) {
                    payment.status = PaymentStatus.FAILED;
                    payment.error_message = paymentEntity.error_description || 'Payment failed';
                    await payment.save();
                }
                break;
            }

            case 'refund.processed': {
                const refundEntity = payload.refund.entity;
                const paymentId = refundEntity.payment_id;

                const payment = await Payment.findOne({ where: { payment_id: paymentId } });
                if (payment) {
                    payment.status = PaymentStatus.REFUNDED;
                    await payment.save();
                }
                break;
            }

            default:
                console.log(`[Razorpay Webhook] Unhandled event: ${event}`);
        }

        res.status(200).json({ status: 'success', message: 'Webhook processed' });
    } catch (error: any) {
        console.error('Webhook error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to process webhook',
        });
    }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        const payments = await Payment.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title', 'thumbnail'],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        res.status(200).json({
            status: 'success',
            data: payments,
        });
    } catch (error: any) {
        console.error('Get payment history error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to fetch payment history',
        });
    }
};

export const getPaymentConfig = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const settingRepo = SystemSetting;

        const enabledSetting = await settingRepo.findOne({ where: { key: 'razorpay_enabled' } });
        const testModeSetting = await settingRepo.findOne({ where: { key: 'razorpay_test_mode' } });
        const keyIdSetting = await settingRepo.findOne({ where: { key: 'razorpay_key_id' } });

        const isEnabled = enabledSetting?.value === 'true';
        const isTestMode = testModeSetting?.value !== 'false';
        const keyId = keyIdSetting?.value || '';

        res.status(200).json({
            status: 'success',
            data: {
                enabled: isEnabled,
                test_mode: isTestMode,
                key_id: keyId,
                key_id_prefix: keyId ? keyId.substring(0, 10) + '...' : '',
            },
        });
    } catch (error: any) {
        console.error('Get payment config error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to fetch payment config',
        });
    }
};

async function getWebhookSecret(): Promise<string> {
    const setting = await SystemSetting.findOne({ where: { key: 'razorpay_webhook_secret' } });
    return setting?.value || '';
}
