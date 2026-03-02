import apiClient from './apiClient';

export const createOrder = async (courseId: string | number) => {
    const response = await apiClient.post('/payments/orders', { courseId });
    return response.data;
};

export const verifyPayment = async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/payments/verify', data);
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
