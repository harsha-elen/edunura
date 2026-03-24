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

export const getMeetingPlatform = async (): Promise<'zoom' | 'jitsi'> => {
    try {
        const response = await apiClient.get('/settings');
        const data = response.data?.data;
        return data?.meeting_platform === 'jitsi' ? 'jitsi' : 'zoom';
    } catch {
        return 'zoom'; // default to zoom
    }
};

export const getOrgLogoUrl = async (): Promise<string | undefined> => {
    try {
        const response = await apiClient.get('/settings');
        const orgLogo: string = response.data?.data?.org_logo || '';
        if (!orgLogo) return undefined;
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
        return `${apiBase}${orgLogo}`;
    } catch {
        return undefined;
    }
};
