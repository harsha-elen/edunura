import apiClient from './apiClient';

export const getSettings = async () => {
    const response = await apiClient.get('/settings');
    return response.data;
};

export const getSetting = async (key: string) => {
    const response = await apiClient.get(`/settings/${key}`);
    return response.data;
};

export const updateSetting = async (key: string, value: string, category?: string, description?: string) => {
    const response = await apiClient.put(`/settings/${key}`, { value, category, description });
    return response.data;
};

export const sendTestEmail = async (toEmail: string) => {
    const response = await apiClient.post('/settings/test-email', { toEmail });
    return response.data;
};

export const checkZoom = async () => {
    const response = await apiClient.post('/settings/check-zoom');
    return response.data;
};

export const getZoomAccount = async () => {
    const response = await apiClient.get('/settings/zoom-account');
    return response.data;
};
