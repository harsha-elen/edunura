import apiClient from './apiClient';

export const getLiveSessions = async (params?: Record<string, unknown>) => {
    const courseId = params?.courseId;
    const response = courseId
        ? await apiClient.get(`/live-classes/course/${courseId}`, { params })
        : await apiClient.get('/live-classes/all', { params });
    return response.data;
};

export const getLiveSession = async (id: string | number) => {
    const response = await apiClient.get(`/live-classes/course/${id}`);
    return response.data;
};

export const createLiveSession = async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/live-classes', data);
    return response.data;
};

export const updateLiveSession = async (id: string | number, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/live-classes/${id}`, data);
    return response.data;
};

export const deleteLiveSession = async (id: string | number) => {
    const response = await apiClient.delete(`/live-classes/${id}`);
    return response.data;
};

export const getJitsiConfig = async (sessionId: string | number) => {
    const response = await apiClient.get(`/live-classes/${sessionId}/jitsi-config`);
    return response.data;
};
