import apiClient from './apiClient';

export const getLiveSessions = async (params?: Record<string, unknown>) => {
    const response = await apiClient.get('/live-classes', { params });
    return response.data;
};

export const getLiveSession = async (id: string | number) => {
    const response = await apiClient.get(`/live-classes/${id}`);
    return response.data;
};

export const createLiveSession = async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/live-classes', data);
    return response.data;
};

export const updateLiveSession = async (id: string | number, data: Record<string, unknown>) => {
    const response = await apiClient.patch(`/live-classes/${id}`, data);
    return response.data;
};

export const deleteLiveSession = async (id: string | number) => {
    const response = await apiClient.delete(`/live-classes/${id}`);
    return response.data;
};
