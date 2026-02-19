import Razorpay from 'razorpay';
import crypto from 'crypto';
import SystemSetting from '../models/SystemSetting';

export interface CreateOrderParams {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
}

export interface VerifyPaymentParams {
    order_id: string;
    payment_id: string;
    signature: string;
}

class RazorpayService {
    private static instance: RazorpayService;
    private razorpay: Razorpay | null = null;

    private constructor() { }

    public static getInstance(): RazorpayService {
        if (!RazorpayService.instance) {
            RazorpayService.instance = new RazorpayService();
        }
        return RazorpayService.instance;
    }

    private async getSystemSetting(key: string): Promise<string> {
        const setting = await SystemSetting.findOne({ where: { key } });
        if (!setting || !setting.value) {
            throw new Error(`Missing Razorpay Configuration: ${key}`);
        }
        return setting.value;
    }

    private async getRazorpayInstance(): Promise<Razorpay> {
        if (this.razorpay) {
            return this.razorpay;
        }

        const keyId = await this.getSystemSetting('razorpay_key_id');
        const keySecret = await this.getSystemSetting('razorpay_key_secret');

        this.razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        return this.razorpay;
    }

    public async isEnabled(): Promise<boolean> {
        try {
            const setting = await SystemSetting.findOne({ where: { key: 'razorpay_enabled' } });
            return setting?.value === 'true';
        } catch {
            return false;
        }
    }

    public async isTestMode(): Promise<boolean> {
        try {
            const setting = await SystemSetting.findOne({ where: { key: 'razorpay_test_mode' } });
            return setting?.value === 'true';
        } catch {
            return false;
        }
    }

    public async getKeyId(): Promise<string> {
        return this.getSystemSetting('razorpay_key_id');
    }

    public async createOrder(params: CreateOrderParams): Promise<{
        id: string;
        amount: number;
        currency: string;
        receipt: string;
    }> {
        const razorpay = await this.getRazorpayInstance();

        const options = {
            amount: params.amount,
            currency: params.currency || 'INR',
            receipt: params.receipt || `receipt_${Date.now()}`,
            notes: params.notes || {},
        };

        try {
            const order = await razorpay.orders.create(options);
            return {
                id: order.id as string,
                amount: Number(order.amount),
                currency: order.currency as string,
                receipt: order.receipt as string,
            };
        } catch (error: any) {
            console.error('Razorpay Create Order Error:', error.error?.description || error.message);
            throw new Error(error.error?.description || 'Failed to create Razorpay order');
        }
    }

    public async verifyPaymentSignature(params: VerifyPaymentParams): Promise<boolean> {
        const keySecret = await this.getSystemSetting('razorpay_key_secret');

        const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${params.order_id}|${params.payment_id}`)
            .digest('hex');

        return generatedSignature === params.signature;
    }

    public async getPaymentDetails(paymentId: string): Promise<any> {
        const razorpay = await this.getRazorpayInstance();
        
        try {
            const payment = await razorpay.payments.fetch(paymentId);
            return payment;
        } catch (error: any) {
            console.error('Razorpay Get Payment Error:', error.error?.description || error.message);
            throw new Error(error.error?.description || 'Failed to get payment details');
        }
    }

    public async refundPayment(paymentId: string, amount?: number): Promise<any> {
        const razorpay = await this.getRazorpayInstance();

        try {
            const refundData: any = {};
            if (amount) {
                refundData.amount = amount;
            }

            const refund = await razorpay.payments.refund(paymentId, refundData);
            return refund;
        } catch (error: any) {
            console.error('Razorpay Refund Error:', error.error?.description || error.message);
            throw new Error(error.error?.description || 'Failed to process refund');
        }
    }

    public verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        return expectedSignature === signature;
    }

    public resetInstance(): void {
        this.razorpay = null;
    }
}

export default RazorpayService.getInstance();
