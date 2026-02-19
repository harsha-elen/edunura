import apiClient from './apiClient';

export interface PaymentConfig {
    enabled: boolean;
    test_mode: boolean;
    key_id: string;
    key_id_prefix: string;
}

export interface CreateOrderResponse {
    order_id: string;
    amount: number;
    currency: string;
    receipt: string;
    key_id: string;
    course: {
        id: number;
        title: string;
        price: number;
    };
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export interface PaymentHistory {
    id: number;
    order_id: string;
    payment_id?: string;
    user_id: number;
    course_id: number;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    receipt?: string;
    created_at: string;
    course?: {
        id: number;
        title: string;
        thumbnail?: string;
    };
}

export const paymentService = {
    // Get payment configuration (public key, enabled status)
    getPaymentConfig: async (): Promise<PaymentConfig> => {
        const response = await apiClient.get('/payments/config');
        console.log('Payment config response:', response.data);
        if (response.data && response.data.data) {
            return response.data.data;
        }
        return { enabled: false, test_mode: true, key_id: '', key_id_prefix: '' };
    },

    // Create a payment order for a course
    createOrder: async (courseId: number): Promise<CreateOrderResponse> => {
        const response = await apiClient.post(`/payments/create-order/${courseId}`);
        return response.data.data;
    },

    // Verify payment after successful payment
    verifyPayment: async (order_id: string, payment_id: string, signature: string) => {
        const response = await apiClient.post('/payments/verify', {
            order_id,
            payment_id,
            signature,
        });
        return response.data;
    },

    // Get user's payment history
    getPaymentHistory: async (): Promise<PaymentHistory[]> => {
        const response = await apiClient.get('/payments/history');
        return response.data.data || [];
    },
};

export default paymentService;
