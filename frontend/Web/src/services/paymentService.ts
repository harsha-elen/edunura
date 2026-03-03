import apiClient from './apiClient';

export const createOrder = async (courseId: string | number) => {
    const response = await apiClient.post('/payments/create-order/' + courseId);
    return response.data?.data ?? response.data;
};

export const verifyPayment = async (data: Record<string, unknown>) => {
    const normalizedPayload = {
        order_id: data.order_id || data.razorpay_order_id,
        payment_id: data.payment_id || data.razorpay_payment_id,
        signature: data.signature || data.razorpay_signature,
    };
    const response = await apiClient.post('/payments/verify', normalizedPayload);
    return response.data;
};

export const getPaymentStatus = async (courseId: string | number) => {
    const response = await apiClient.get(`/payments/${courseId}`);
    return response.data;
};

export const getPaymentHistory = async () => {
    const response = await apiClient.get('/payments/history');
    return response.data.data || [];
};
