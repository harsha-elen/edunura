import apiClient from './apiClient';

export const getSettings = async () => {
    try {
        const response = await apiClient.get('/settings');
        return response.data;
    } catch (error) {
        console.error('Error fetching settings:', error);
        throw error;
    }
};

export const updateSetting = async (key: string, value: string, category: string, description?: string) => {
    try {
        const response = await apiClient.put(`/settings/${key}`, {
            value,
            category,
            description
        });
        return response.data;
    } catch (error) {
        console.error('Error updating setting:', error);
        throw error;
    }
};

export const sendTestEmail = async (toEmail: string) => {
    try {
        const response = await apiClient.post('/settings/test-email', {
            toEmail
        });
        return response.data;
    } catch (error) {
        console.error('Error sending test email:', error);
        throw error;
    }
};

export const getZoomAccount = async () => {
    try {
        const response = await apiClient.get('/settings/zoom-account');
        return response.data;
    } catch (error) {
        console.error('Error fetching Zoom account:', error);
        throw error;
    }
};
