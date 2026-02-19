import apiClient from './apiClient';

export const getSettings = async (category?: string) => {
    try {
        const response = await apiClient.get('/settings', {
            params: { category }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching settings:', error);
        throw error;
    }
};
